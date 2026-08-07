function formatMoney(money) {
    return Number(money).toLocaleString("vi-VN") + " VNĐ";
}

function BookingSummary({ doctor, schedule, patient, embedded = false }) {
    const content = (
        <>
            {!embedded && <h2>Xác nhận thông tin</h2>}

            {embedded && (
                <div className="booking-card-head booking-card-head--compact">
                    <span className="booking-step">Bước 3</span>
                    <h2>Xác nhận thông tin</h2>
                </div>
            )}

            <div className="booking-summary">
                <div className="summary-row">
                    <span>Bệnh nhân</span>
                    <strong>{patient?.fullName || patient?.full_name || "—"}</strong>
                </div>

                <div className="summary-row">
                    <span>Bác sĩ</span>
                    <strong>{doctor.name}</strong>
                </div>

                <div className="summary-row">
                    <span>Chuyên khoa</span>
                    <strong>{doctor.specialty}</strong>
                </div>

                <div className="summary-row">
                    <span>Phòng khám</span>
                    <strong>{doctor.clinic}</strong>
                </div>

                <div className="summary-row">
                    <span>Ngày khám</span>
                    <strong>{schedule.date}</strong>
                </div>

                <div className="summary-row">
                    <span>Khung giờ</span>
                    <strong>{schedule.time}</strong>
                </div>

                <div className="summary-row">
                    <span>Thanh toán</span>
                    <strong>Tại phòng khám</strong>
                </div>

                <div className="summary-row total">
                    <span>Phí khám</span>
                    <strong>{formatMoney(doctor.consultationFee)}</strong>
                </div>
            </div>
        </>
    );

    if (embedded) return <div className="booking-summary-block">{content}</div>;

    return <div className="booking-card">{content}</div>;
}

export default BookingSummary;
