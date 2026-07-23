import { Calendar, ChevronRight, Clock, Hospital, Stethoscope } from "lucide-react";
import { Link } from "react-router-dom";
import {
    STATUS_CLASS,
    STATUS_LABEL,
    enrichAppointment,
} from "../../data/patientMock";

function AppointmentCard({ appointment }) {
    if (!appointment) return null;

    const data = enrichAppointment(appointment);
    const statusClass = STATUS_CLASS[data.status] || "pending";

    return (
        <div className="appointment-card">
            <div className="appointment-left">
                <span className={`appointment-status ${statusClass}`}>
                    {STATUS_LABEL[data.status] || data.status}
                </span>

                <h3>{data.doctor_name}</h3>

                <p>
                    <Stethoscope size={14} />
                    {data.specialty}
                </p>

                <p>
                    <Hospital size={14} />
                    {data.clinic}
                </p>

                <p className="appointment-patient">
                    Bệnh nhân: {data.patient_name}
                </p>
            </div>

            <div className="appointment-right">
                <div className="appointment-info">
                    <Calendar size={14} />
                    <span>{data.date_display}</span>
                </div>

                <div className="appointment-info">
                    <Clock size={14} />
                    <span>{data.time}</span>
                </div>

                <p className="appointment-code">{data.booking_code}</p>

                <Link
                    to={`/patient/appointments/${data.id}`}
                    className="appointment-detail-btn"
                >
                    Chi tiết
                    <ChevronRight size={14} />
                </Link>
            </div>
        </div>
    );
}

export default AppointmentCard;
