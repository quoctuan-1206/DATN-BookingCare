import { Calendar, ChevronRight, Clock, Hospital, Stethoscope } from "lucide-react";
import { Link } from "react-router-dom";
import { STATUS_CLASS, STATUS_LABEL } from "../../services/appointment.service";

function AppointmentCard({ appointment }) {
  if (!appointment) return null;

  const statusClass = STATUS_CLASS[appointment.status] || "pending";

  return (
    <div className="appointment-card">
      <div className="appointment-left">
        <span className={`appointment-status ${statusClass}`}>
          {STATUS_LABEL[appointment.status] || appointment.status}
        </span>

        <h3>{appointment.doctor_name}</h3>

        <p>
          <Stethoscope size={14} />
          {appointment.specialty}
        </p>

        <p>
          <Hospital size={14} />
          {appointment.clinic}
        </p>

        <p className="appointment-patient">
          Bệnh nhân: {appointment.patient_name}
        </p>
      </div>

      <div className="appointment-right">
        <div className="appointment-info">
          <Calendar size={14} />
          <span>{appointment.date_display}</span>
        </div>

        <div className="appointment-info">
          <Clock size={14} />
          <span>{appointment.time}</span>
        </div>

        <p className="appointment-code">{appointment.booking_code}</p>

        <Link
          to={`/patient/appointments/${appointment.id}`}
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
