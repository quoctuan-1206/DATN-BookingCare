import { Calendar, ChevronRight, Clock, Stethoscope } from "lucide-react";
import { Link } from "react-router-dom";
import { STATUS_CLASS, STATUS_LABEL } from "../../services/appointment.service";

function DashboardAppointmentItem({ appointment }) {
  if (!appointment) return null;

  const statusClass = STATUS_CLASS[appointment.status] || "pending";

  return (
    <Link
      to={`/patient/appointments/${appointment.id}`}
      className="dashboard-appointment-item"
    >
      <div className="dashboard-appointment-item-main">
        <span className={`appointment-status ${statusClass}`}>
          {STATUS_LABEL[appointment.status] || appointment.status}
        </span>
        <strong>{appointment.doctor_name}</strong>
        <span className="dashboard-appointment-meta">
          <Stethoscope size={13} />
          {appointment.specialty}
        </span>
      </div>

      <div className="dashboard-appointment-item-side">
        <span>
          <Calendar size={13} />
          {appointment.date_display}
        </span>
        <span>
          <Clock size={13} />
          {appointment.time}
        </span>
        <ChevronRight size={16} className="dashboard-appointment-arrow" />
      </div>
    </Link>
  );
}

export default DashboardAppointmentItem;
