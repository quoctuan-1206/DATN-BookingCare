import { useEffect, useMemo, useState } from "react";

const WEEK_LABELS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

function toYMD(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function ScheduleCalendar({
  schedules = [],
  appointments = [],
  weekStart,
  selectedDate,
  loading = false,
}) {
  const [activeDate, setActiveDate] = useState(selectedDate);

  useEffect(() => {
    if (selectedDate) setActiveDate(selectedDate);
  }, [selectedDate]);

  const days = useMemo(() => {
    if (!weekStart) return [];
    const list = [];
    for (let i = 0; i < 7; i += 1) {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      const key = toYMD(d);
      const count = appointments.filter(
        (a) => a.work_date === key && a.status !== "CANCELLED",
      ).length;
      list.push({
        key,
        label: WEEK_LABELS[i],
        date: d.getDate(),
        count,
        active: key === activeDate,
      });
    }
    return list;
  }, [weekStart, appointments, activeDate]);

  const weekRangeLabel = useMemo(() => {
    if (!weekStart) return "";
    const end = new Date(weekStart);
    end.setDate(weekStart.getDate() + 6);
    return `${weekStart.toLocaleDateString("vi-VN")} - ${end.toLocaleDateString("vi-VN")}`;
  }, [weekStart]);

  const daySlots = useMemo(() => {
    return schedules
      .filter((s) => s.work_date === activeDate)
      .sort((a, b) =>
        String(a.start_time || "").localeCompare(String(b.start_time || "")),
      )
      .map((slot) => {
        const booked = Number(slot.booked_patients || 0);
        const max = Number(slot.max_patients || 0);
        const related = appointments.filter(
          (a) =>
            Number(a.schedule_id) === Number(slot.id) &&
            a.status !== "CANCELLED",
        );
        let status = "free";
        if (max > 0 && booked >= max) status = "busy";
        else if (booked > 0) status = "busy";

        return {
          id: slot.id,
          time: slot.time || `${slot.start_time} - ${slot.end_time}`,
          status,
          patient:
            related[0]?.patient_name ||
            (booked > 0 ? `${booked}/${max || "?"} đã đặt` : null),
          booked,
          max,
        };
      });
  }, [schedules, appointments, activeDate]);

  return (
    <div className="doctor-card doctor-schedule-calendar">
      <div className="doctor-card-header">
        <div>
          <h3>Lịch làm việc tuần</h3>
          <p>{loading ? "Đang tải..." : weekRangeLabel}</p>
        </div>
      </div>

      <div className="doctor-week-days">
        {days.map((day) => (
          <button
            key={day.key}
            type="button"
            className={`doctor-week-day${day.active ? " active" : ""}`}
            onClick={() => setActiveDate(day.key)}
          >
            <span className="doctor-week-label">{day.label}</span>
            <strong className="doctor-week-date">{day.date}</strong>
            <small>{day.count} lịch</small>
          </button>
        ))}
      </div>

      <div className="doctor-slot-list">
        {loading ? (
          <p>Đang tải...</p>
        ) : daySlots.length === 0 ? (
          <p>Không có khung giờ trong ngày này.</p>
        ) : (
          daySlots.map((slot) => (
            <div key={slot.id} className={`doctor-slot-item ${slot.status}`}>
              <div>
                <strong>{slot.time}</strong>
                <p>
                  {slot.status === "busy"
                    ? slot.patient || "Đã có lịch"
                    : "Còn trống"}
                </p>
              </div>
              <span className={`doctor-slot-badge ${slot.status}`}>
                {slot.status === "busy" ? "Đã đặt" : "Trống"}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default ScheduleCalendar;
