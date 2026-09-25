/**
 * Tính số giây còn lại trước khi hết hạn thanh toán
 * @param {string|Date} expiresAt Thời điểm hết hạn
 * @param {number} [now=Date.now()] Thời điểm hiện tại (ms)
 * @returns {number} Số giây còn lại (tối thiểu 0)
 */
export function computeRemainingSeconds(expiresAt, now = Date.now()) {
  if (!expiresAt) return 0;
  const targetTime = new Date(expiresAt).getTime();
  if (Number.isNaN(targetTime)) return 0;
  return Math.max(0, Math.floor((targetTime - now) / 1000));
}

/**
 * Định dạng số giây còn lại thành chuỗi mm:ss
 * @param {number} seconds
 * @returns {string}
 */
export function formatCountdown(seconds) {
  const safeSec = Math.max(0, Math.floor(seconds || 0));
  const mins = Math.floor(safeSec / 60);
  const secs = safeSec % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

/**
 * Kiểm tra xem lịch hẹn và hóa đơn có được phép thanh toán lại hay không
 * @param {object} invoice Hóa đơn
 * @param {string} appointmentStatus Trạng thái lịch hẹn
 * @param {number} [now=Date.now()]
 * @returns {boolean}
 */
export function canRetryPayment(invoice, appointmentStatus, now = Date.now()) {
  if (!invoice) return false;
  if (invoice.payment_status !== "UNPAID") return false;
  if (appointmentStatus !== "PENDING") return false;
  return computeRemainingSeconds(invoice.payment_expires_at, now) > 0;
}

/**
 * Lấy nhãn và lớp CSS hiển thị trạng thái thanh toán
 * @param {object} invoice
 * @param {string} appointmentStatus
 * @param {number} [now=Date.now()]
 * @returns {{ label: string, className: string, type: "success"|"warning"|"danger" } | null}
 */
export function getPaymentBadge(invoice, appointmentStatus, now = Date.now()) {
  if (!invoice) return null;

  if (invoice.payment_status === "PAID") {
    return {
      label: "Đã thanh toán",
      className: "paid",
      type: "success",
    };
  }

  if (canRetryPayment(invoice, appointmentStatus, now)) {
    return {
      label: "Chưa thanh toán",
      className: "unpaid",
      type: "warning",
    };
  }

  return {
    label: "Hết hạn thanh toán",
    className: "expired",
    type: "danger",
  };
}
