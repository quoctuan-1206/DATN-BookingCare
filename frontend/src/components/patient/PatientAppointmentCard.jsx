import {
  CalendarDays,
  ChevronRight,
  Clock3,
  FileText,
  MapPin,
  Stethoscope,
} from "lucide-react";
import { Link } from "react-router-dom";
import { resolveMediaUrl } from "../../utils/media";
import { STATUS_CLASS, STATUS_LABEL } from "../../services/appointment.service";

function initials(name) {
  return (name || "Bác sĩ")
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((part) => part[0])
    .join("")
    .toLocaleUpperCase("vi");
}

function formatDate(date, fallback) {
  if (!date) return fallback || "Chưa có thông tin";
  const match = String(date).match(/^(\d{4})-(\d{2})-(\d{2})/);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : fallback || date;
}

function PatientAppointmentCard({ appointment, selected = false, onSelect }) {
  if (!appointment) return null;

  const statusClass = STATUS_CLASS[appointment.status] || "pending";
  const doctorName = appointment.doctor_name && appointment.doctor_name !== "—"
    ? appointment.doctor_name
    : "Chưa có thông tin bác sĩ";
  const avatar = resolveMediaUrl(appointment.doctor_avatar);
  const clinic = appointment.clinic && appointment.clinic !== "—"
    ? appointment.clinic
    : "";

  return (
    <article className={`patient-appointment-card${selected ? " is-selected" : ""}`}>
      <button
        type="button"
        className="patient-appointment-card-select"
        aria-pressed={selected}
        aria-label={`Chọn lịch hẹn với ${doctorName}, ${formatDate(appointment.work_date, appointment.date_display)}, ${STATUS_LABEL[appointment.status] || appointment.status}`}
        onClick={onSelect}
      >
        <div className="patient-appointment-card-content">
          <div className="patient-appointment-doctor">
            {avatar ? (
              <img className="patient-appointment-avatar" src={avatar} alt="" />
            ) : (
              <span className="patient-appointment-avatar patient-appointment-avatar--fallback" aria-hidden="true">
                {initials(doctorName)}
              </span>
            )}
            <span className="patient-appointment-doctor-copy">
              <small className="patient-appointment-overline">BÁC SĨ PHỤ TRÁCH</small>
              <strong>{doctorName}</strong>
              <span className="patient-appointment-specialty">
                <Stethoscope size={15} aria-hidden="true" />
                {appointment.specialty && appointment.specialty !== "—" ? appointment.specialty : "Chưa có thông tin chuyên khoa"}
              </span>
              {clinic && <span className="patient-appointment-clinic-name"><MapPin size={14} aria-hidden="true" />{clinic}</span>}
            </span>
          </div>

          <div className="patient-appointment-schedule">
            <span className="patient-appointment-detail">
              <CalendarDays size={17} aria-hidden="true" />
              <span><small>Ngày khám</small><strong>{formatDate(appointment.work_date, appointment.date_display)}</strong></span>
            </span>
            <span className="patient-appointment-detail">
              <Clock3 size={17} aria-hidden="true" />
              <span><small>Giờ khám</small><strong>{appointment.time || "Chưa có thông tin"}</strong></span>
            </span>
            {appointment.booking_code && (
              <span className="patient-appointment-code">
                <FileText size={15} aria-hidden="true" />
                <span><small>Mã lịch</small><strong>{appointment.booking_code}</strong></span>
              </span>
            )}
          </div>

          <span className={`patient-appointment-status appointment-status ${statusClass}`}>
            {STATUS_LABEL[appointment.status] || appointment.status}
          </span>
        </div>
      </button>
      <Link to={`/patient/appointments/${appointment.id}`} className="patient-appointment-detail-link">
        Xem chi tiết <ChevronRight size={16} aria-hidden="true" />
      </Link>
    </article>
  );
}

export default PatientAppointmentCard;
