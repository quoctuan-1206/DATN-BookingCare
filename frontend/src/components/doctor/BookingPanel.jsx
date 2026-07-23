import { useNavigate } from "react-router-dom";

function BookingPanel({ doctor, selectedSchedule }) {
    const navigate = useNavigate();
    const hasSchedule = Boolean(selectedSchedule?.start);

    const handleBook = () => {
        if (!hasSchedule) return;

        navigate("/booking", {
            state: {
                doctor: {
                    id: doctor.id,
                    name: doctor.name,
                    avatar: doctor.image || doctor.avatar,
                    specialty: doctor.specialty,
                    clinic: doctor.clinic,
                    consultationFee: doctor.consultation_fee,
                },
                schedule: {
                    id: selectedSchedule.id,
                    date: selectedSchedule.date,
                    work_date: selectedSchedule.work_date,
                    start: selectedSchedule.start,
                    end: selectedSchedule.end,
                    time: `${selectedSchedule.start} - ${selectedSchedule.end}`,
                },
            },
        });
    };

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
                onClick={handleBook}
            >
                ĐẶT LỊCH
            </button>
        </section>
    );
}

export default BookingPanel;
