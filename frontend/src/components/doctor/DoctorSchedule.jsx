function DoctorSchedule({
    doctor,
    clinic,
    dateOptions = [],
    slots = [],
    selectedDate,
    selectedSchedule,
    onDateChange,
    onSelectSlot,
}) {
    return (
        <section className="doctor-schedule">
            <h2>Lịch khám</h2>

            {dateOptions.length > 0 ? (
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
            ) : (
                <p className="schedule-empty">Chưa có lịch khám.</p>
            )}

            <div className="schedule-list">
                {slots.length === 0 ? (
                    <p className="schedule-empty">Không có khung giờ trong ngày này.</p>
                ) : (
                    slots.map((slot) => (
                        <button
                            key={slot.id}
                            type="button"
                            className={`schedule-item${
                                selectedSchedule?.id === slot.id ? " active" : ""
                            }${!slot.available ? " disabled" : ""}`}
                            disabled={!slot.available}
                            onClick={() => onSelectSlot(slot)}
                        >
                            {slot.start_time}
                        </button>
                    ))
                )}
            </div>

            <div className="schedule-info">
                <h3>Địa chỉ khám</h3>
                <p>{doctor.clinic}</p>
                <p>{clinic?.address || "—"}</p>

                <hr />

                <h3>Giá khám</h3>
                <p>{doctor.price}</p>
            </div>
        </section>
    );
}

export default DoctorSchedule;
