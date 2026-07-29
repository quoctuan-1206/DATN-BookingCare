const days = [
    { label: "T2", date: 20, count: 4 },
    { label: "T3", date: 21, count: 6 },
    { label: "T4", date: 22, count: 3, active: true },
    { label: "T5", date: 23, count: 5 },
    { label: "T6", date: 24, count: 2 },
    { label: "T7", date: 25, count: 1 },
    { label: "CN", date: 26, count: 0 },
];

const slots = [
    { time: "08:00 - 09:00", status: "busy", patient: "Nguyễn Văn A" },
    { time: "09:00 - 10:00", status: "busy", patient: "Trần Thị B" },
    { time: "10:00 - 11:00", status: "free" },
    { time: "14:00 - 15:00", status: "busy", patient: "Phạm Văn C" },
    { time: "15:00 - 16:00", status: "free" },
    { time: "16:00 - 17:00", status: "off" },
];

function ScheduleCalendar() {
    return (
        <div className="doctor-card doctor-schedule-calendar">
            <div className="doctor-card-header">
                <div>
                    <h3>Lịch làm việc tuần</h3>
                    <p>20/07 - 26/07/2026</p>
                </div>
            </div>

            <div className="doctor-week-days">
                {days.map((day) => (
                    <div
                        key={day.label}
                        className={`doctor-week-day${
                            day.active ? " active" : ""
                        }`}
                    >
                        <span className="doctor-week-label">{day.label}</span>
                        <strong className="doctor-week-date">{day.date}</strong>
                        <small>{day.count} lịch</small>
                    </div>
                ))}
            </div>

            <div className="doctor-slot-list">
                {slots.map((slot) => (
                    <div
                        key={slot.time}
                        className={`doctor-slot-item ${slot.status}`}
                    >
                        <div>
                            <strong>{slot.time}</strong>
                            <p>
                                {slot.status === "busy" && slot.patient}
                                {slot.status === "free" && "Còn trống"}
                                {slot.status === "off" && "Nghỉ"}
                            </p>
                        </div>
                        <span className={`doctor-slot-badge ${slot.status}`}>
                            {slot.status === "busy" && "Đã đặt"}
                            {slot.status === "free" && "Trống"}
                            {slot.status === "off" && "Off"}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default ScheduleCalendar;
