import {
  CalendarDays,
  ChevronRight,
  FileText,
  MapPin,
  Pill,
  Stethoscope,
} from "lucide-react";
import { Link } from "react-router-dom";
import { resolveMediaUrl } from "../../utils/media";

function getDateParts(record) {
  const isoDate = String(record.work_date || "").match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoDate) {
    return { day: isoDate[3], month: `Tháng ${Number(isoDate[2])}`, year: isoDate[1] };
  }
  const displayDate = String(record.date_display || "");
  const localizedDate = displayDate.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (localizedDate) {
    return {
      day: localizedDate[1].padStart(2, "0"),
      month: `Tháng ${Number(localizedDate[2])}`,
      year: localizedDate[3],
    };
  }
  return { day: displayDate || "—", month: "", year: "" };
}

function getInitials(name) {
  return (name || "Bác sĩ")
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((part) => part[0])
    .join("")
    .toLocaleUpperCase("vi");
}

function MedicalRecordCard({ record, selected = false, onSelect }) {
  if (!record) return null;

  const date = getDateParts(record);
  const avatar = resolveMediaUrl(record.doctor_avatar);

  return (
    <article className={`medical-record-card${selected ? " is-selected" : ""}`}>
      <button
        type="button"
        className="medical-record-card-select"
        aria-pressed={selected}
        aria-label={`Chọn lần khám ${date.day} ${date.month} ${date.year}, bác sĩ ${record.doctor_name || "chưa rõ"}`}
        onClick={onSelect}
      >
        <div className="medical-record-card-main">
          <div className="medical-record-date-block" aria-label={record.date_display || "Ngày khám"}>
            <strong>{date.day}</strong>
            {date.month && <span>{date.month}</span>}
            {date.year && <small>{date.year}</small>}
          </div>

          <div className="medical-record-card-content">
            <div className="medical-record-card-topline">
              <div className="medical-record-doctor">
                {avatar ? (
                  <img className="medical-record-avatar" src={avatar} alt="" />
                ) : (
                  <span className="medical-record-avatar medical-record-avatar-fallback" aria-hidden="true">
                    {getInitials(record.doctor_name)}
                  </span>
                )}
                <span className="medical-record-doctor-text">
                  <strong>{record.doctor_name || "Chưa có thông tin bác sĩ"}</strong>
                  <small>{record.booking_code || "Chưa có mã lịch khám"}</small>
                </span>
              </div>
            </div>

            <div className="medical-record-meta-grid">
              <span><Stethoscope size={15} aria-hidden="true" /><span><small>Chuyên khoa</small><strong>{record.specialty || "Chưa có thông tin"}</strong></span></span>
              <span><MapPin size={15} aria-hidden="true" /><span><small>Phòng khám</small><strong>{record.clinic || "Chưa có thông tin"}</strong></span></span>
              <span><CalendarDays size={15} aria-hidden="true" /><span><small>Ngày khám</small><strong>{record.date_display || "Chưa có thông tin"}</strong></span></span>
            </div>

            <div className="medical-record-card-summary">
              <span className="medical-record-summary-diagnosis">
                <FileText size={16} aria-hidden="true" />
                <span><small>Chẩn đoán</small><strong>{record.diagnosis && record.diagnosis !== "—" ? record.diagnosis : "Chưa có thông tin"}</strong></span>
              </span>
              <span className="medical-record-summary-prescription">
                <Pill size={16} aria-hidden="true" />
                <span><small>Đơn thuốc</small><strong className={`medical-record-prescription-badge${record.has_prescription ? " has-prescription" : " no-prescription"}`}>{record.has_prescription ? "Có đơn thuốc" : "Không có đơn thuốc"}</strong></span>
              </span>
            </div>
          </div>
        </div>
      </button>
      <Link to={`/patient/medical-records/${record.id}`} className="medical-record-detail-link">
        Xem bệnh án <ChevronRight size={16} aria-hidden="true" />
      </Link>
    </article>
  );
}

export default MedicalRecordCard;
