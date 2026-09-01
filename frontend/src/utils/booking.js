export const MIN_ADVANCE_DAYS = 3;

export function todayYMD() {
  const d = new Date();
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
}

export function addDaysYMD(ymd, days) {
  const d = new Date(`${ymd}T00:00:00`);
  d.setDate(d.getDate() + days);
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
}

export function getMinBookingDateYMD() {
  return addDaysYMD(todayYMD(), MIN_ADVANCE_DAYS);
}

export function isBookableDate(ymd) {
  if (!ymd) return false;
  return ymd >= getMinBookingDateYMD();
}

/** Ngày khám đã tới hoặc đã qua — có thể bắt đầu khám */
export function isExamDay(ymd) {
  if (!ymd) return false;
  return ymd <= todayYMD();
}

export function minAdvanceNotice() {
  return `Lịch khám phải đặt trước ít nhất ${MIN_ADVANCE_DAYS} ngày. Sau khi đặt, bác sĩ sẽ xác nhận lịch.`;
}
