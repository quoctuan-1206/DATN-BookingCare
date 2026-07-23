import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";

function formatMoney(money) {
    return Number(money).toLocaleString("vi-VN") + " VNĐ";
}

function createMockBookingCode() {
    const now = new Date();
    const stamp = [
        now.getFullYear(),
        String(now.getMonth() + 1).padStart(2, "0"),
        String(now.getDate()).padStart(2, "0"),
        String(now.getHours()).padStart(2, "0"),
        String(now.getMinutes()).padStart(2, "0"),
        String(now.getSeconds()).padStart(2, "0"),
    ].join("");

    return `BK${stamp}`;
}

function BookingConfirm({
    doctor,
    schedule,
    patient,
    formData,
    embedded = false,
}) {
    const navigate = useNavigate();
    const [agree, setAgree] = useState(false);

    const handleConfirm = (e) => {
        e.preventDefault();

        if (!agree) {
            alert("Vui lòng xác nhận thông tin trước khi đặt lịch.");
            return;
        }

        if (!formData.reason.trim()) {
            alert("Vui lòng nhập lý do khám.");
            return;
        }

        navigate("/booking/success", {
            state: {
                booking: {
                    bookingCode: createMockBookingCode(),
                    doctorName: doctor.name,
                    specialty: doctor.specialty,
                    clinic: doctor.clinic,
                    date: schedule.date,
                    time: schedule.time,
                    patient: patient.fullName,
                    fee: formatMoney(doctor.consultationFee),
                    reason: formData.reason.trim(),
                    note: formData.note.trim(),
                },
            },
            replace: true,
        });
    };

    const content = (
        <div className="booking-confirm">
            {!embedded && <h2>Xác nhận đặt lịch</h2>}

            <label className="confirm-checkbox">
                <input
                    type="checkbox"
                    checked={agree}
                    onChange={(e) => setAgree(e.target.checked)}
                />

                <span>
                    Tôi xác nhận thông tin chính xác và đồng ý với điều khoản
                    sử dụng của hệ thống.
                </span>
            </label>

            <div className="booking-actions">
                <Link
                    to={`/doctors/${doctor.id || 1}`}
                    className="btn btn-outline"
                >
                    Quay lại
                </Link>

                <button
                    type="button"
                    className={`btn btn-primary ${!agree ? "disabled" : ""}`}
                    onClick={handleConfirm}
                >
                    Xác nhận đặt lịch
                </button>
            </div>
        </div>
    );

    if (embedded) return content;

    return <div className="booking-card">{content}</div>;
}

export default BookingConfirm;
