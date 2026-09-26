import defaultPaymentRepository from "../repositories/payment.repository.js";
import { getVnpayConfig } from "../config/vnpay.js";
import {
  buildPaymentUrl,
  verifyVnpaySignature,
  createTxnRef,
} from "../utils/vnpay.js";

class PaymentService {
  constructor({ config = null, repository = defaultPaymentRepository } = {}) {
    this.config = config;
    this.repository = repository;
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
      const params = new URLSearchParams({
        invoiceId: String(invoice.id),
        amount: String(invoice.amount),
        txnRef,
        bookingCode: invoice.appointments?.booking_code || "",
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
      return `${config.frontendUrl}/payment/result?status=not_found`;
    }

    if (query.vnp_ResponseCode !== "00") {
      return `${config.frontendUrl}/payment/result?status=failed&invoiceId=${invoice.id}`;
    }

    return `${config.frontendUrl}/payment/result?invoiceId=${invoice.id}`;
  }

  // Giả lập thanh toán thành công trong Mock mode
  async mockCompletePayment(user, invoiceId, now = new Date()) {
    const id = this.parseId(invoiceId);
    const invoice = await this.repository.findClinicInvoiceById(id);

    if (!invoice || invoice.invoice_type !== "CLINIC_FEE") {
      const error = new Error("Không tìm thấy hóa đơn phí khám");
      error.statusCode = 404;
      throw error;
    }

    const patientAccountId = invoice.appointments?.patient_profiles?.account_id;
    if (
      user.role?.name !== "Patient" &&
      user.role?.name !== "Admin" &&
      Number(patientAccountId) !== Number(user.id)
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

    return {
      success: true,
      message: "Thanh toán giả lập thành công",
      result,
    };
  }
}

export { PaymentService };
export default new PaymentService();
