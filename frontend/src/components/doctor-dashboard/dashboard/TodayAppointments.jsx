import { Link } from "react-router-dom";
import { Clock3 } from "lucide-react";

const appointments = [
    {
        id: "BK1001",
        patient: "Nguyễn Văn A",
        time: "08:00",
        type: "Tái khám",
        status: "confirmed",
    },
    {
        id: "BK1002",
        patient: "Trần Thị B",
        time: "09:00",
        type: "Khám mới",
        status: "pending",
    },
    {
        id: "BK1003",
        patient: "Phạm Văn C",
        time: "10:30",
        type: "Tư vấn",
        status: "confirmed",
    },
    {
        id: "BK1004",
        patient: "Đỗ Thị D",
        time: "14:00",
        type: "Khám mới",
        status: "completed",
    },
];

const statusLabel = {
    pending: "Chờ khám",
    confirmed: "Đã xác nhận",
    completed: "Hoàn thành",
};

function TodayAppointments() {
    return (
        <div className="doctor-card doctor-today-appointments">
            <div className="doctor-card-header">
                <div>
                    <h3>Lịch hẹn hôm nay</h3>
                    <p>4 cuộc hẹn trong ngày</p>
                </div>
                <Link to="/doctor/appointments" className="doctor-view-all">
                    Xem tất cả
                </Link>
            </div>

            <div className="doctor-appointment-list">
                {appointments.map((item) => (
                    <Link
                        key={item.id}
                        to={`/doctor/appointments/${item.id}`}
                        className="doctor-appointment-item"
                    >
                        <div className="doctor-appointment-time">
                            <Clock3 size={16} />
                            <span>{item.time}</span>
                        </div>

                        <div className="doctor-appointment-info">
                            <strong>{item.patient}</strong>
                            <span>
                                {item.id} · {item.type}
                            </span>
                        </div>

                        <span className={`doctor-status ${item.status}`}>
                            {statusLabel[item.status]}
                        </span>
                    </Link>
                ))}
            </div>
        </div>
    );
}

export default TodayAppointments;
