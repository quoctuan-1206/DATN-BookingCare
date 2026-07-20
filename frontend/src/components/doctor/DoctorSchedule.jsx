const schedules = [
    "08:00",
    "09:00",
    "10:00",
    "11:00",
    "13:00",
    "14:00",
    "15:00",
    "16:00",
];

const dateOptions = [
    { label: "Hôm nay", value: "20/07/2026" },
    { label: "Ngày mai", value: "21/07/2026" },
    { label: "20/07/2026", value: "20/07/2026" },
];

function DoctorSchedule({
    doctor,
    selectedDate,
    selectedSchedule,
    onDateChange,
    onSelectTime,
}) {
    return (
        <section className="doctor-schedule">
            <h2>Lịch khám</h2>

            <select
                className="schedule-date"
                value={selectedDate}
                onChange={(e) => onDateChange(e.target.value)}
            >
                {dateOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>

            <div className="schedule-list">
                {schedules.map((time) => (
                    <button
                        key={time}
                        type="button"
                        className={`schedule-item${
                            selectedSchedule?.start === time ? " active" : ""
                        }`}
                        onClick={() => onSelectTime(time)}
                    >
                        {time}
                    </button>
                ))}
            </div>

            <div className="schedule-info">
                <h3>Địa chỉ khám</h3>
                <p>{doctor.clinic}</p>
                <p>268 Nguyễn Chí Thanh, Quận 5</p>

                <hr />

                <h3>Giá khám</h3>
                <p>{doctor.price}</p>
            </div>
        </section>
    );
}

export default DoctorSchedule;
