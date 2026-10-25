import defaultPaymentRepository from "../repositories/payment.repository.js";
import { getVnpayConfig } from "../config/vnpay.js";
import {
  buildPaymentUrl,
  verifyVnpaySignature,
  createTxnRef,
} from "../utils/vnpay.js";
import defaultNotificationService from "./notification.service.js";
import defaultAuditLogService from "./audit-log.service.js";

class PaymentService {
  constructor({
    config = null,
    repository = defaultPaymentRepository,
    notifications,
    auditLogs,
  } = {}) {
    this.config = config;
    this.repository = repository;
    this.notifications =
      notifications === undefined
        ? repository === defaultPaymentRepository
          ? defaultNotificationService
          : null
        : notifications;
    this.auditLogs =
      auditLogs === undefined
        ? repository === defaultPaymentRepository
          ? defaultAuditLogService
          : null
        : auditLogs;
  }

  async recordPaymentAudit({ invoice, action, actorId = null, oldValue, newValue, metadata }) {
    if (!this.auditLogs || !invoice) return;
    await this.auditLogs.record({
      userId:
        actorId ?? invoice.appointments?.patient_profiles?.account_id ?? null,
      action,
      resource: "PAYMENT",
      resourceId: invoice.id,
      oldValue,
      newValue,
      metadata: {
        appointmentId: invoice.appointment_id || invoice.appointments?.id || null,
        invoiceType: invoice.invoice_type,
        amount: Number(invoice.amount || 0),
        ...metadata,
      },
    });
  }

  async notifyPayment(invoice, succeeded) {
    if (!this.notifications || !invoice) return;
    const patientId = invoice.appointments?.patient_profiles?.account_id;
    const appointmentId = invoice.appointment_id || invoice.appointments?.id;
    if (!patientId || !appointmentId) return;

    try {
      await this.notifications.notifyOnce(patientId, {
        title: succeeded
          ? "Thanh toán thành công"
          : "Thanh toán không thành công",
        content: succeeded
          ? `Thanh toán phí khám cho lịch ${invoice.appointments?.booking_code || `#${appointmentId}`} đã thành công.`
          : `Giao dịch cho lịch ${invoice.appointments?.booking_code || `#${appointmentId}`} chưa thành công. Bạn có thể thử thanh toán lại khi hóa đơn còn hạn.`,
        link: `/patient/appointments/${appointmentId}`,
        type: succeeded ? "PAYMENT_SUCCESS" : "PAYMENT_FAILED",
      });
    } catch (error) {
      console.error("[PaymentService] Không thể gửi thông báo thanh toán:", error);
    }
  }

  getConfig() {
    if (this.config) return this.config;
    return getVnpayConfig();
  }

  parseId(id) {
    const parsed = Number(id);
    if (!Number.isInteger(parsed) || parsed <= 0) {
      const error = new Error("ID hóa đơn không hợp lệ");
      error.statusCode = 400;
      throw error;
    }
    return parsed;
  }

  cleanIp(ip) {
    if (!ip) return "127.0.0.1";
    const cleaned = String(ip).replace(/^::ffff:/, "").trim();
    return cleaned || "127.0.0.1";
  }

  // Tạo URL thanh toán VNPAY cho bệnh nhân
  async createPaymentUrl(user, invoiceId, clientIp, now = new Date()) {
    const id = this.parseId(invoiceId);
    const invoice = await this.repository.findClinicInvoiceById(id);

    if (!invoice || invoice.invoice_type !== "CLINIC_FEE") {
      const error = new Error("Không tìm thấy hóa đơn phí khám");
      error.statusCode = 404;
      throw error;
    }

    const patientAccountId =
      invoice.appointments?.patient_profiles?.account_id;

    if (
      user.role?.name !== "Patient" ||
      Number(patientAccountId) !== Number(user.id)
    ) {
      const error = new Error("Bạn không có quyền thanh toán hóa đơn này");
      error.statusCode = 403;
      throw error;
    }

    if (
      invoice.payment_status !== "UNPAID" ||
      invoice.appointments?.status !== "PENDING"
    ) {
      const error = new Error("Lịch hẹn không ở trạng thái chờ thanh toán");
      error.statusCode = 400;
      throw error;
    }

    if (invoice.payment_expires_at && invoice.payment_expires_at <= now) {
      const error = new Error("Hóa đơn đã hết hạn thanh toán");
      error.statusCode = 400;
      throw error;
    }

    let txnRef = invoice.vnp_txn_ref;
    if (!txnRef) {
      txnRef = createTxnRef(invoice.id, now);
      await this.repository.setInvoiceTxnRef(invoice.id, txnRef);
    }

    const config = this.getConfig();
    const ipAddress = this.cleanIp(clientIp);

    let paymentUrl;
    if (config.isMock) {
      const patientName =
        invoice.appointments?.patient_profiles?.full_name ||
        user.name ||
        user.first_name ||
        "";
      const params = new URLSearchParams({
        invoiceId: String(invoice.id),
        amount: String(invoice.amount),
        txnRef,
        bookingCode: invoice.appointments?.booking_code || "",
        patientName,
        expiresAt: invoice.payment_expires_at ? invoice.payment_expires_at.toISOString() : "",
      });
      paymentUrl = `${config.frontendUrl}/payment/mock-gateway?${params.toString()}`;
    } else {
      paymentUrl = buildPaymentUrl(config, {
        amount: invoice.amount,
        txnRef,
        bookingCode: invoice.appointments?.booking_code || "",
        ipAddress,
        createdAt: invoice.created_at || now,
        expiresAt: invoice.payment_expires_at,
      });
    }

    return {
      payment_url: paymentUrl,
      txn_ref: txnRef,
      expires_at: invoice.payment_expires_at,
    };
  }

  async createClinicalPaymentUrl(user, orderId, clientIp, now = new Date()) {
    const id = this.parseId(orderId);
    const order = await this.repository.findClinicalOrderPaymentById(id);
    if (!order || order.payment_amount == null) {
      const error = new Error("Không tìm thấy khoản phí cận lâm sàng"); error.statusCode = 404; throw error;
    }
    if (user.role?.name !== "Patient" || Number(order.patient_profiles?.account_id) !== Number(user.id)) {
      const error = new Error("Bạn không có quyền thanh toán phiếu này"); error.statusCode = 403; throw error;
    }
    if (order.payment_status !== "UNPAID" || order.status !== "PENDING") {
      const error = new Error("Phiếu cận lâm sàng không ở trạng thái chờ thanh toán"); error.statusCode = 400; throw error;
    }
    if (order.payment_expires_at && order.payment_expires_at <= now) {
      const error = new Error("Phiếu đã hết hạn thanh toán"); error.statusCode = 400; throw error;
    }
    let txnRef = order.vnp_txn_ref;
    if (!txnRef) {
      txnRef = `CLS${createTxnRef(order.id, now).slice(3)}`;
      await this.repository.setClinicalOrderTxnRef(order.id, txnRef);
    }
    const config = this.getConfig();
    const ipAddress = this.cleanIp(clientIp);
    const paymentExpiresAt = order.payment_expires_at || new Date(now.getTime() + 10 * 60 * 1000);
    let paymentUrl;
    if (config.isMock) {
      const params = new URLSearchParams({
        clinicalOrderId: String(order.id), amount: String(order.payment_amount), txnRef,
        bookingCode: order.booking_code || `CLS-${order.id}`,
        patientName: order.patient_profiles?.full_name || "",
        expiresAt: paymentExpiresAt.toISOString(),
      });
      paymentUrl = `${config.frontendUrl}/payment/mock-gateway?${params.toString()}`;
    } else {
      paymentUrl = buildPaymentUrl(config, {
        amount: order.payment_amount, txnRef,
        bookingCode: `CLS ${order.booking_code || order.id}`,
        orderInfo: `Thanh toan can lam sang ${order.booking_code || order.id}`,
        ipAddress, createdAt: order.ordered_at || now, expiresAt: paymentExpiresAt,
      });
    }
    return { payment_url: paymentUrl, txn_ref: txnRef, expires_at: order.payment_expires_at };
  }

  async getClinicalPaymentStatus(user, orderId, now = new Date()) {
    const id = this.parseId(orderId);
    const order = await this.repository.findClinicalOrderPaymentById(id);
    if (!order || order.payment_amount == null) { const error = new Error("Không tìm thấy khoản phí cận lâm sàng"); error.statusCode = 404; throw error; }
    const owner = Number(order.patient_profiles?.account_id) === Number(user.id);
    if (user.role?.name !== "Admin" && !(user.role?.name === "Patient" && owner)) { const error = new Error("Bạn không có quyền xem thanh toán này"); error.statusCode = 403; throw error; }
    return {
      clinical_order_id: order.id,
      payment_status: order.payment_status,
      payment_expires_at: order.payment_expires_at,
      amount: Number(order.payment_amount),
      can_retry: order.payment_status === "UNPAID" && order.status === "PENDING" && (!order.payment_expires_at || order.payment_expires_at > now),
    };
  }

  // Tra cứu trạng thái thanh toán hóa đơn
  async getPaymentStatus(user, invoiceId, now = new Date()) {
    const id = this.parseId(invoiceId);
    const invoice = await this.repository.findClinicInvoiceById(id);

    if (!invoice || invoice.invoice_type !== "CLINIC_FEE") {
      const error = new Error("Không tìm thấy hóa đơn phí khám");
      error.statusCode = 404;
      throw error;
    }

    const roleName = user.role?.name;
    const patientAccountId =
      invoice.appointments?.patient_profiles?.account_id;
    const isOwner = Number(patientAccountId) === Number(user.id);

    if (roleName !== "Admin" && !(roleName === "Patient" && isOwner)) {
      const error = new Error("Bạn không có quyền xem thông tin thanh toán này");
      error.statusCode = 403;
      throw error;
    }

    const isLive =
      !invoice.payment_expires_at || invoice.payment_expires_at > now;
    const canRetry =
      invoice.payment_status === "UNPAID" &&
      invoice.appointments?.status === "PENDING" &&
      isLive;

    return {
      invoice_id: invoice.id,
      appointment_id: invoice.appointment_id,
      payment_status: invoice.payment_status,
      payment_expires_at: invoice.payment_expires_at,
      amount: Number(invoice.amount),
      can_retry: canRetry,
    };
  }

  // Xử lý webhook IPN từ VNPAY
  async handleIpn(query, now = new Date()) {
    const config = this.getConfig();
    const isValid = verifyVnpaySignature(query, config.hashSecret);

    if (!isValid) {
      return { RspCode: "97", Message: "Invalid Checksum" };
    }

    if (
      query.vnp_ResponseCode !== "00" ||
      query.vnp_TransactionStatus !== "00"
    ) {
      return { RspCode: "00", Message: "Confirm Success" };
    }

    const result = await this.repository.markPaidFromIpn({
      txnRef: query.vnp_TxnRef,
      amount: query.vnp_Amount,
      transactionNo: query.vnp_TransactionNo,
      paidAt: now,
      now,
    });

    if (result.code === "NOT_FOUND") {
      return { RspCode: "01", Message: "Order not found" };
    }
    if (result.code === "ALREADY_PAID") {
      return { RspCode: "02", Message: "Order already confirmed" };
    }
    if (result.code === "INVALID_AMOUNT") {
      return { RspCode: "04", Message: "Invalid amount" };
    }
    if (result.code === "EXPIRED") {
      return { RspCode: "04", Message: "Order expired or cancelled" };
    }

    if (result.code === "SUCCESS") {
      if (result.kind === "CLINICAL") {
        const order = await this.repository.findClinicalOrderPaymentById(result.order.id);
        await this.notifyClinicalPayment(order, true);
        await this.recordClinicalPaymentAudit(order, "PAYMENT_SUCCESS", {
          provider: "VNPAY", source: "IPN", providerTransactionNo: query.vnp_TransactionNo || null,
        });
        return { RspCode: "00", Message: "Confirm Success" };
      }
      const invoice = await this.repository.findClinicInvoiceById(
        result.invoice.id,
      );
      await this.notifyPayment(invoice, true);
      await this.recordPaymentAudit({
        invoice,
        action: "PAYMENT_SUCCESS",
        oldValue: { payment_status: "UNPAID" },
        newValue: {
          payment_status: invoice.payment_status,
          transaction_id: invoice.transaction_id,
          payment_date: invoice.payment_date,
        },
        metadata: {
          provider: "VNPAY",
          providerTransactionNo: query.vnp_TransactionNo || null,
          source: "IPN",
        },
      });
    }

    return { RspCode: "00", Message: "Confirm Success" };
  }

  // Xử lý chuyển hướng người dùng trở lại hệ thống từ VNPAY
  async handleReturn(query) {
    const config = this.getConfig();
    const isValid = verifyVnpaySignature(query, config.hashSecret);

    if (!isValid) {
      return `${config.frontendUrl}/payment/result?status=invalid`;
    }

    const txnRef = query.vnp_TxnRef;
    if (!txnRef) {
      return `${config.frontendUrl}/payment/result?status=invalid`;
    }

    const invoice = await this.repository.findClinicInvoiceByTxnRef(txnRef);

    if (!invoice) {
      const order = await this.repository.findClinicalOrderPaymentByTxnRef(txnRef);
      if (!order) return `${config.frontendUrl}/payment/result?status=not_found`;
      if (query.vnp_ResponseCode !== "00") {
        await this.notifyClinicalPayment(order, false);
        return `${config.frontendUrl}/payment/result?status=failed&clinicalOrderId=${order.id}`;
      }
      return `${config.frontendUrl}/payment/result?clinicalOrderId=${order.id}`;
    }

    if (query.vnp_ResponseCode !== "00") {
      await this.notifyPayment(invoice, false);
      await this.recordPaymentAudit({
        invoice,
        action: "PAYMENT_FAILED",
        oldValue: { payment_status: invoice.payment_status },
        newValue: { payment_status: invoice.payment_status },
        metadata: {
          provider: "VNPAY",
          responseCode: query.vnp_ResponseCode,
          source: "RETURN",
        },
      });
      return `${config.frontendUrl}/payment/result?status=failed&invoiceId=${invoice.id}`;
    }

    return `${config.frontendUrl}/payment/result?invoiceId=${invoice.id}`;
  }

  // Giả lập thanh toán thành công trong Mock mode
  async mockCompletePayment(user, invoiceId, now = new Date()) {
    if (this.getConfig().isMock === false) { const error = new Error("Mock payment is disabled"); error.statusCode = 404; throw error; }
    const id = this.parseId(invoiceId);
    const invoice = await this.repository.findClinicInvoiceById(id);

    if (!invoice || invoice.invoice_type !== "CLINIC_FEE") {
      const error = new Error("Không tìm thấy hóa đơn phí khám");
      error.statusCode = 404;
      throw error;
    }

    const patientAccountId = invoice.appointments?.patient_profiles?.account_id;
    const isOwner = Number(patientAccountId) === Number(user.id);
    if (
      user.role?.name !== "Admin" &&
      !(user.role?.name === "Patient" && isOwner)
    ) {
      const error = new Error("Bạn không có quyền thực hiện thao tác này");
      error.statusCode = 403;
      throw error;
    }

    if (invoice.payment_expires_at && invoice.payment_expires_at <= now) {
      const error = new Error("Hóa đơn đã hết hạn thanh toán");
      error.statusCode = 400;
      throw error;
    }

    if (invoice.payment_status === "PAID") {
      return { success: true, message: "Hóa đơn đã được thanh toán", invoice };
    }

    let txnRef = invoice.vnp_txn_ref;
    if (!txnRef) {
      txnRef = createTxnRef(invoice.id, now);
      await this.repository.setInvoiceTxnRef(invoice.id, txnRef);
    }

    const result = await this.repository.markPaidFromIpn({
      txnRef,
      amount: Math.round(Number(invoice.amount) * 100),
      transactionNo: `MOCK_${Date.now()}`,
      paidAt: now,
    });

    if (result.code === "SUCCESS") {
      const updatedInvoice = await this.repository.findClinicInvoiceById(
        result.invoice.id,
      );
      await this.notifyPayment(updatedInvoice, true);
      await this.recordPaymentAudit({
        invoice: updatedInvoice,
        action: "PAYMENT_SUCCESS",
        actorId: user.id,
        oldValue: { payment_status: invoice.payment_status },
        newValue: {
          payment_status: updatedInvoice.payment_status,
          transaction_id: updatedInvoice.transaction_id,
          payment_date: updatedInvoice.payment_date,
        },
        metadata: { provider: "MOCK", source: "MOCK_GATEWAY" },
      });
    }

    return {
      success: true,
      message: "Thanh toán giả lập thành công",
      result,
    };
  }

  async mockFailPayment(user, invoiceId) {
    if (this.getConfig().isMock === false) { const error = new Error("Mock payment is disabled"); error.statusCode = 404; throw error; }
    const id = this.parseId(invoiceId);
    const invoice = await this.repository.findClinicInvoiceById(id);
    if (!invoice || invoice.invoice_type !== "CLINIC_FEE") {
      const error = new Error("Không tìm thấy hóa đơn phí khám");
      error.statusCode = 404;
      throw error;
    }

    const patientAccountId = invoice.appointments?.patient_profiles?.account_id;
    const isOwner = Number(patientAccountId) === Number(user.id);
    if (
      user.role?.name !== "Admin" &&
      !(user.role?.name === "Patient" && isOwner)
    ) {
      const error = new Error("Bạn không có quyền thực hiện thao tác này");
      error.statusCode = 403;
      throw error;
    }

    await this.notifyPayment(invoice, false);
    await this.recordPaymentAudit({
      invoice,
      action: "PAYMENT_FAILED",
      actorId: user.id,
      oldValue: { payment_status: invoice.payment_status },
      newValue: { payment_status: invoice.payment_status },
      metadata: { provider: "MOCK", source: "MOCK_GATEWAY" },
    });
    return { success: true, message: "Đã ghi nhận giao dịch không thành công" };
  }
  async notifyClinicalPayment(order, succeeded) {
    const patientId = order?.patient_profiles?.account_id;
    if (!patientId || !this.notifications) return;
    try {
      await this.notifications.notifyOnce(patientId, {
        title: succeeded ? "Thanh toán cận lâm sàng thành công" : "Thanh toán cận lâm sàng chưa thành công",
        content: `Phiếu ${order.booking_code || `#${order.id}`} ${succeeded ? "đã được thanh toán" : "chưa thanh toán thành công"}.`,
        link: "/patient/clinical",
        type: succeeded ? "PAYMENT_SUCCESS" : "PAYMENT_FAILED",
      });
    } catch (error) {
      console.error("[PaymentService] Could not notify clinical payment:", error);
    }
  }

  async recordClinicalPaymentAudit(order, action, metadata = {}, actorId = null) {
    if (!this.auditLogs || !order) return;
    await this.auditLogs.record({
      userId: actorId ?? order.patient_profiles?.account_id ?? null,
      action,
      resource: "PAYMENT",
      resourceId: order.id,
      oldValue: { payment_status: "UNPAID" },
      newValue: {
        payment_status: order.payment_status,
        transaction_id: order.transaction_id,
        payment_date: order.payment_date,
      },
      metadata: { clinicalOrderId: order.id, amount: Number(order.payment_amount || 0), ...metadata },
    });
  }

  async mockCompleteClinicalPayment(user, orderId, now = new Date()) {
    if (this.getConfig().isMock === false) { const error = new Error("Mock payment is disabled"); error.statusCode = 404; throw error; }
    const id = this.parseId(orderId);
    const order = await this.repository.findClinicalOrderPaymentById(id);
    if (!order || order.payment_amount == null) { const error = new Error("Không tìm thấy phiếu"); error.statusCode = 404; throw error; }
    const owner = Number(order.patient_profiles?.account_id) === Number(user.id);
    if (!(user.role?.name === "Admin" || (user.role?.name === "Patient" && owner))) { const error = new Error("Không có quyền"); error.statusCode = 403; throw error; }
    if (order.payment_expires_at && order.payment_expires_at <= now) { const error = new Error("Phiếu đã hết hạn thanh toán"); error.statusCode = 400; throw error; }
    if (order.payment_status !== "UNPAID" || order.status !== "PENDING") { const error = new Error("Phiếu không ở trạng thái chờ thanh toán"); error.statusCode = 400; throw error; }
    let txnRef = order.vnp_txn_ref;
    if (!txnRef) { txnRef = `CLS${createTxnRef(order.id, now).slice(3)}`; await this.repository.setClinicalOrderTxnRef(order.id, txnRef); }
    const result = await this.repository.markPaidFromIpn({ txnRef, amount: Math.round(Number(order.payment_amount) * 100), transactionNo: `MOCK_CLS_${Date.now()}`, paidAt: now, now });
    if (result.code === "SUCCESS") {
      const updated = await this.repository.findClinicalOrderPaymentById(id);
      await this.notifyClinicalPayment(updated, true);
      await this.recordClinicalPaymentAudit(updated, "PAYMENT_SUCCESS", { provider: "MOCK", source: "MOCK_GATEWAY" }, user.id);
    }
    return { success: result.code === "SUCCESS" || result.code === "ALREADY_PAID", result };
  }

  async mockFailClinicalPayment(user, orderId) {
    if (this.getConfig().isMock === false) { const error = new Error("Mock payment is disabled"); error.statusCode = 404; throw error; }
    const order = await this.repository.findClinicalOrderPaymentById(this.parseId(orderId));
    const owner = Number(order?.patient_profiles?.account_id) === Number(user.id);
    if (!order || !(user.role?.name === "Admin" || (user.role?.name === "Patient" && owner))) { const error = new Error("Không có quyền"); error.statusCode = 403; throw error; }
    await this.notifyClinicalPayment(order, false);
    return { success: true };
  }
}

export { PaymentService };
export default new PaymentService();
