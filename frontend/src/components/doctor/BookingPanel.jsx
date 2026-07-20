function BookingPanel({ doctor, selectedSchedule }) {
    const hasSchedule = Boolean(selectedSchedule?.start);

    return (
        <section className="booking-panel">
            <h2>Đặt lịch khám</h2>

            <div className="booking-item">
                <span>Ngày khám</span>
                <strong>
                    {selectedSchedule?.date || "--/--/----"}
                </strong>
            </div>

            <div className="booking-item">
                <span>Giờ khám</span>
                <strong>
                    {hasSchedule
                        ? `${selectedSchedule.start} - ${selectedSchedule.end}`
                        : "Chưa chọn"}
                </strong>
            </div>

            <div className="booking-item">
                <span>Giá khám</span>
                <strong>{doctor.price}</strong>
            </div>

            <button
                type="button"
                className="btn btn-primary booking-btn"
                disabled={!hasSchedule}
            >
                ĐẶT LỊCH
            </button>
        </section>
    );
}

export default BookingPanel;
