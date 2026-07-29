import { UserRound, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

const queue = [
    {
        id: 1,
        name: "Nguyễn Văn A",
        room: "P.302",
        reason: "Đau ngực",
        status: "examining",
    },
    {
        id: 2,
        name: "Trần Thị B",
        room: "P.302",
        reason: "Khám định kỳ",
        status: "waiting",
    },
    {
        id: 3,
        name: "Lê Minh E",
        room: "P.302",
        reason: "Theo dõi huyết áp",
        status: "waiting",
    },
    {
        id: 4,
        name: "Phạm Thị F",
        room: "P.302",
        reason: "Tái khám",
        status: "next",
    },
];

const statusLabel = {
    examining: "Đang khám",
    waiting: "Đang chờ",
    next: "Tiếp theo",
};

function PatientQueue() {
    return (
        <div className="doctor-card doctor-patient-queue">
            <div className="doctor-card-header">
                <div>
                    <h3>Hàng chờ bệnh nhân</h3>
                    <p>Phòng khám P.302</p>
                </div>
            </div>

            <div className="doctor-queue-list">
                {queue.map((patient, index) => (
                    <Link
                        key={patient.id}
                        to={`/doctor/appointments/${patient.id}`}
                        className={`doctor-queue-item ${patient.status}`}
                    >
                        <div className="doctor-queue-order">{index + 1}</div>

                        <div className="doctor-queue-avatar">
                            <UserRound size={18} />
                        </div>

                        <div className="doctor-queue-info">
                            <strong>{patient.name}</strong>
                            <span>
                                {patient.room} · {patient.reason}
                            </span>
                        </div>

                        <span className={`doctor-status ${patient.status}`}>
                            {statusLabel[patient.status]}
                        </span>

                        <ChevronRight size={16} className="doctor-queue-arrow" />
                    </Link>
                ))}
            </div>
        </div>
    );
}

export default PatientQueue;
