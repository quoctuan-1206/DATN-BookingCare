import { useEffect, useState } from "react";
import {
  CalendarDays,
  Clock3,
  FileText,
  Phone,
  UserRound,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";
import { resolveMediaUrl } from "../../utils/media";
import { STATUS_CLASS, STATUS_LABEL } from "../../services/appointment.service";
import medicalRecordService from "../../services/medical-record.service";

function initials(name) {
  return (name || "Bác sĩ")
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((part) => part[0])
    .join("")
    .toLocaleUpperCase("vi");
}

function displayValue(value, fallback = "Chưa có thông tin") {
  return value && value !== "—" ? value : fallback;
}

function formatCreatedAt(value) {
  if (!value) return "Chưa có thông tin";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Chưa có thông tin"
    : date.toLocaleString("vi-VN", { dateStyle: "medium", timeStyle: "short" });
}

function AppointmentPreview({ appointment, cancelling, onClose, onCancel }) {
  const [medicalRecordId, setMedicalRecordId] = useState(null);
  const [loadingRecord, setLoadingRecord] = useState(false);
  const avatar = resolveMediaUrl(appointment.doctor_avatar);
  const statusClass = STATUS_CLASS[appointment.status] || "pending";
  const canManage = ["PENDING", "CONFIRMED"].includes(appointment.status);
  const consultationType = {
    IN_PERSON: "Trực tiếp",
    ONLINE: "Trực tuyến",
  }[appointment.consultation_type] || "Chưa có thông tin";

  useEffect(() => {
    let cancelled = false;
    setMedicalRecordId(null);
    if (!appointment.has_medical_record) {
      setLoadingRecord(false);
      return undefined;
    }

    setLoadingRecord(true);
    medicalRecordService.getByAppointmentId(appointment.id)
      .then((record) => {
        if (!cancelled) setMedicalRecordId(record?.id || null);
      })
      .catch(() => {
        if (!cancelled) setMedicalRecordId(null);
      })
      .finally(() => {
        if (!cancelled) setLoadingRecord(false);
      });

    return () => {
      cancelled = true;
    };
  }, [appointment.has_medical_record, appointment.id]);

  return (
    <aside className="patient-appointment-preview" aria-label="Chi tiết lịch hẹn" aria-live="polite">
      <header className="patient-appointment-preview-header">
        <div>
          <span className="patient-appointment-preview-eyebrow">THÔNG TIN KHÁM</span>
          <h2>Chi tiết lịch hẹn</h2>
        </div>
        <button type="button" className="patient-appointment-preview-close" onClick={onClose} aria-label="Đóng xem nhanh lịch hẹn">
          <X size={19} />
        </button>
      </header>

      <div className="patient-appointment-preview-scroll">
        <div className="patient-appointment-preview-doctor">
          {avatar ? (
            <img src={avatar} alt="" />
          ) : (
            <span className="patient-appointment-preview-avatar-fallback" aria-hidden="true">
              {initials(appointment.doctor_name)}
            </span>
          )}
          <div>
            <strong>{displayValue(appointment.doctor_name, "Chưa có thông tin bác sĩ")}</strong>
            <span>{displayValue(appointment.specialty, "Chưa có thông tin chuyên khoa")}</span>
            <span>{displayValue(appointment.clinic, "Chưa có thông tin cơ sở y tế")}</span>
          </div>
        </div>

        <section className="patient-appointment-preview-section">
          <h3><CalendarDays size={17} aria-hidden="true" /> Thông tin lịch khám</h3>
          <div className="patient-appointment-preview-grid">
            <div><small>Mã lịch hẹn</small><strong>{displayValue(appointment.booking_code)}</strong></div>
            <div>
              <small>Trạng thái</small>
              <strong><span className={`patient-appointment-status appointment-status ${statusClass}`}>{STATUS_LABEL[appointment.status] || appointment.status}</span></strong>
            </div>
            <div><small>Ngày khám</small><strong>{displayValue(appointment.date_display)}</strong></div>
            <div><small>Giờ khám</small><strong>{displayValue(appointment.time)}</strong></div>
            <div><small>Địa điểm khám</small><strong>{displayValue(appointment.clinic_address, appointment.clinic || "Chưa có thông tin")}</strong></div>
            <div><small>Phòng khám</small><strong>{displayValue(appointment.room)}</strong></div>
            <div><small>Hình thức khám</small><strong>{consultationType}</strong></div>
          </div>
        </section>

        <section className="patient-appointment-preview-section">
          <h3><UserRound size={17} aria-hidden="true" /> Thông tin bệnh nhân</h3>
          <div className="patient-appointment-contact">
            <span><UserRound size={15} aria-hidden="true" />{displayValue(appointment.patient_name, "Chưa có thông tin")}</span>
            {appointment.patient_phone && appointment.patient_phone !== "—" && (
              <a href={`tel:${appointment.patient_phone}`}><Phone size={15} aria-hidden="true" />{appointment.patient_phone}</a>
            )}
          </div>
        </section>

        {(appointment.reason || appointment.note || appointment.created_at) && (
          <section className="patient-appointment-preview-section">
            <h3><FileText size={17} aria-hidden="true" /> Nội dung đặt khám</h3>
            {appointment.reason && <div className="patient-appointment-note"><small>Lý do khám</small><p>{appointment.reason}</p></div>}
            {appointment.note && <div className="patient-appointment-note"><small>Ghi chú</small><p>{appointment.note}</p></div>}
            {appointment.created_at && <div className="patient-appointment-created"><Clock3 size={14} aria-hidden="true" />Đặt lúc {formatCreatedAt(appointment.created_at)}</div>}
          </section>
        )}

      </div>

      <footer className="patient-appointment-preview-footer">
        <Link to={`/patient/appointments/${appointment.id}`} className="patient-appointment-full-detail">
          Xem chi tiết lịch hẹn
        </Link>
        {canManage && (
          <div className="patient-appointment-preview-actions">
            <Link to={`/patient/appointments/${appointment.id}`} className="patient-appointment-reschedule">
              Đổi lịch
            </Link>
            <button type="button" className="patient-appointment-cancel" onClick={onCancel} disabled={cancelling}>
              {cancelling ? "Đang hủy..." : "Hủy lịch"}
            </button>
          </div>
        )}
        {appointment.status === "COMPLETED" && appointment.has_medical_record && (
          medicalRecordId ? (
            <Link to={`/patient/medical-records/${medicalRecordId}`} className="patient-appointment-medical-record">
              Xem bệnh án
            </Link>
          ) : loadingRecord ? (
            <span className="patient-appointment-record-loading">Đang tải bệnh án...</span>
          ) : null
        )}
      </footer>
    </aside>
  );
}

export default AppointmentPreview;
