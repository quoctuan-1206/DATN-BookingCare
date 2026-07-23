import { Calendar, Clock, Hospital, Stethoscope } from "lucide-react";

function formatMoney(money) {
    return Number(money).toLocaleString("vi-VN") + " VNĐ";
}

function BookingDoctor({ doctor, schedule }) {
    return (
        <div className="booking-card booking-doctor">
            <div className="booking-doctor-top">
                <img
                    src={doctor.avatar}
                    alt={doctor.name}
                    className="booking-doctor-avatar"
                />

                <div className="booking-doctor-identity">
                    <span className="booking-step">Thông tin lịch</span>
                    <h2>{doctor.name}</h2>

                    <p className="booking-specialty">
                        <Stethoscope size={15} />
                        {doctor.specialty}
                    </p>

                    <p className="booking-clinic">
                        <Hospital size={15} />
                        {doctor.clinic}
                    </p>
                </div>
            </div>

            <div className="booking-doctor-meta">
                <div className="booking-meta-chip">
                    <Calendar size={15} />
                    <div>
                        <span>Ngày khám</span>
                        <strong>{schedule.date}</strong>
                    </div>
                </div>

                <div className="booking-meta-chip">
                    <Clock size={15} />
                    <div>
                        <span>Khung giờ</span>
                        <strong>{schedule.time}</strong>
                    </div>
                </div>
            </div>

            <div className="booking-price-row">
                <span>Phí khám</span>
                <strong className="booking-price">
                    {formatMoney(doctor.consultationFee)}
                </strong>
            </div>
        </div>
    );
}

export default BookingDoctor;
