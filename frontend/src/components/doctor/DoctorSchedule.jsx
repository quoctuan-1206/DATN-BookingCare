const WEEKDAYS = ["CN", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];

function weekdayOf(ymd) {
  const date = new Date(`${ymd}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "";
  return WEEKDAYS[date.getDay()];
}

function dayMonth(ymd) {
  const parts = String(ymd || "").split("-");
  if (parts.length !== 3) return ymd;
  return `${parts[2]}/${parts[1]}`;
}

function minutesOf(time) {
  const [h, m] = String(time || "00:00").split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

function SlotGrid({ slots, selectedId, onSelectSlot }) {
  if (!slots.length) {
    return <p className="schedule-empty">Không có khung giờ.</p>;
  }

  return (
    <div className="schedule-list">
      {slots.map((slot) => (
        <button
          key={slot.id}
          type="button"
          className={`schedule-item${
            selectedId === slot.id ? " active" : ""
          }${!slot.available ? " full" : ""}`}
          disabled={!slot.available}
          onClick={() => onSelectSlot(slot)}
        >
          {slot.start_time}
        </button>
      ))}
    </div>
  );
}

function DoctorSchedule({
  dateOptions = [],
  slots = [],
  selectedDate,
  selectedSchedule,
  onDateChange,
  onSelectSlot,
}) {
  const morning = slots.filter((s) => minutesOf(s.start_time) < 12 * 60);
  const afternoon = slots.filter((s) => minutesOf(s.start_time) >= 12 * 60);

  return (
    <section className="doctor-schedule">
      <h2>Lịch khám</h2>

      {dateOptions.length > 0 ? (
        <div className="schedule-days">
          {dateOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`schedule-day${
                selectedDate === option.value ? " active" : ""
              }`}
              onClick={() => onDateChange(option.value)}
            >
              {weekdayOf(option.value)} {dayMonth(option.value)}
            </button>
          ))}
        </div>
      ) : (
        <p className="schedule-empty">
          Chưa có lịch khám từ 3 ngày trở đi. Vui lòng chọn ngày khác hoặc quay
          lại sau.
        </p>
      )}

      {dateOptions.length > 0 ? (
        <>
          <div className="schedule-period">
            <h3>Buổi sáng</h3>
            <SlotGrid
              slots={morning}
              selectedId={selectedSchedule?.id}
              onSelectSlot={onSelectSlot}
            />
          </div>
          <div className="schedule-period">
            <h3>Buổi chiều</h3>
            <SlotGrid
              slots={afternoon}
              selectedId={selectedSchedule?.id}
              onSelectSlot={onSelectSlot}
            />
          </div>

          <div className="schedule-legend">
            <span>
              <i className="legend-available" /> Còn trống
            </span>
            <span>
              <i className="legend-selected" /> Đang chọn
            </span>
            <span>
              <i className="legend-full" /> Đã hết
            </span>
          </div>
        </>
      ) : null}
    </section>
  );
}

export default DoctorSchedule;
