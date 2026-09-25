import prisma from "../config/prisma.js";

const clinicInvoiceInclude = {
  appointments: {
    include: {
      patient_profiles: {
        select: { id: true, account_id: true, full_name: true },
      },
      schedules: {
        select: { id: true, work_date: true, start_time: true, end_time: true },
      },
    },
  },
};

class PaymentRepository {
  constructor(prismaClient = prisma) {
    this.prisma = prismaClient;
  }

  // Lấy hóa đơn phí khám theo ID kèm lịch hẹn, hồ sơ bệnh nhân và khung giờ
  async findClinicInvoiceById(invoiceId) {
    return this.prisma.invoices.findFirst({
      where: {
        id: Number(invoiceId),
        invoice_type: "CLINIC_FEE",
      },
      include: clinicInvoiceInclude,
    });
  }

  // Cập nhật mã tham chiếu thanh toán VNPAY (vnp_txn_ref)
  async setInvoiceTxnRef(invoiceId, txnRef) {
    return this.prisma.invoices.update({
      where: { id: Number(invoiceId) },
      data: {
        vnp_txn_ref: txnRef,
        updated_at: new Date(),
      },
      include: clinicInvoiceInclude,
    });
  }

  // Xử lý cập nhật thanh toán từ IPN (đảm bảo an toàn giao dịch và idempotent)
  async markPaidFromIpn({
    txnRef,
    amount,
    transactionNo,
    paidAt = new Date(),
    now = new Date(),
  }) {
    return this.prisma.$transaction(async (tx) => {
      const invoice = await tx.invoices.findFirst({
        where: {
          vnp_txn_ref: txnRef,
          invoice_type: "CLINIC_FEE",
        },
        include: {
          appointments: true,
        },
      });

      if (!invoice) {
        return { success: false, code: "NOT_FOUND", message: "Order not found" };
      }

      const expectedAmount = Math.round(Number(invoice.amount) * 100);
      if (Number(amount) !== expectedAmount) {
        return { success: false, code: "INVALID_AMOUNT", message: "Invalid amount" };
      }

      if (invoice.payment_status === "PAID") {
        return {
          success: true,
          code: "ALREADY_PAID",
          message: "Order already confirmed",
          invoice,
        };
      }

      const isExpired =
        (invoice.payment_expires_at && invoice.payment_expires_at < now) ||
        invoice.appointments?.status === "CANCELLED";

      if (isExpired) {
        return {
          success: false,
          code: "EXPIRED",
          message: "Order expired or cancelled",
        };
      }

      const updated = await tx.invoices.update({
        where: { id: invoice.id },
        data: {
          payment_status: "PAID",
          payment_method: "VNPAY",
          transaction_id: String(transactionNo),
          payment_date: paidAt,
          updated_at: now,
        },
      });

      return {
        success: true,
        code: "SUCCESS",
        message: "Confirm Success",
        invoice: updated,
      };
    });
  }

  // Quét và hủy các lịch hẹn chưa thanh toán quá 10 phút, hoàn trả số chỗ đã đặt
  async expireUnpaidClinicInvoices(now = new Date()) {
    const candidates = await this.prisma.invoices.findMany({
      where: {
        invoice_type: "CLINIC_FEE",
        payment_status: "UNPAID",
        payment_expires_at: { lte: now },
        appointments: { status: "PENDING" },
      },
      select: {
        id: true,
        appointment_id: true,
        appointments: {
          select: { id: true, schedule_id: true, status: true },
        },
      },
    });

    let expiredCount = 0;

    for (const candidate of candidates) {
      await this.prisma.$transaction(async (tx) => {
        const updateResult = await tx.appointments.updateMany({
          where: {
            id: candidate.appointment_id,
            status: "PENDING",
          },
          data: {
            status: "CANCELLED",
            updated_at: now,
          },
        });

        if (updateResult.count === 1) {
          const scheduleId = candidate.appointments?.schedule_id;
          if (scheduleId) {
            await tx.schedules.updateMany({
              where: {
                id: scheduleId,
                booked_patients: { gt: 0 },
              },
              data: {
                booked_patients: { decrement: 1 },
                updated_at: now,
              },
            });
          }
          expiredCount++;
        }
      });
    }

    return expiredCount;
  }
}

export { PaymentRepository };
export default new PaymentRepository();
