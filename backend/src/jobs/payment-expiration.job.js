import defaultPaymentRepository from "../repositories/payment.repository.js";

/**
 * Khởi động background job định kỳ quét và hủy các lịch hẹn chưa thanh toán quá hạn
 * @param {object} options
 * @param {number} [options.intervalMs=60000] Chu kỳ quét (mặc định 60 giây)
 * @param {object} [options.repository] Repository thanh toán để thực hiện sweep
 * @returns {{ run: () => Promise<void>, stop: () => void }}
 */
export function startPaymentExpirationJob({
  intervalMs = 60_000,
  repository = defaultPaymentRepository,
} = {}) {
  let isRunning = false;

  const run = async () => {
    if (isRunning) return;
    isRunning = true;
    try {
      await repository.expireUnpaidClinicInvoices(new Date());
    } catch (error) {
      console.error("[PaymentExpirationJob] Lỗi khi quét hóa đơn hết hạn:", error);
    } finally {
      isRunning = false;
    }
  };

  // Chạy ngay lần đầu khi khởi động
  void run();

  const timer = setInterval(() => void run(), intervalMs);
  timer.unref?.();

  return {
    run,
    stop: () => clearInterval(timer),
  };
}
