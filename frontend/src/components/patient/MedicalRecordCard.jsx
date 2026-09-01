import { Calendar, ChevronRight, Pill } from "lucide-react";
import { Link } from "react-router-dom";

function MedicalRecordCard({ record }) {
  if (!record) return null;

  return (
    <article className="patient-profile-card">
      <div className="patient-profile-card-head">
        <div>
          <h3>{record.doctor_name}</h3>
          <span className="patient-muted">{record.booking_code}</span>
        </div>
        <Link
          to={`/patient/medical-records/${record.id}`}
          className="medical-detail-btn"
        >
          Xem bệnh án
          <ChevronRight size={14} />
        </Link>
      </div>

      <div className="patient-profile-card-body">
        <div className="profile-field-row">
          <span className="profile-field-label">Chuyên khoa</span>
          <span className="profile-field-value">{record.specialty}</span>
        </div>
        <div className="profile-field-row">
          <span className="profile-field-label">Phòng khám</span>
          <span className="profile-field-value">{record.clinic}</span>
        </div>
        <div className="profile-field-row">
          <span className="profile-field-label">Ngày khám</span>
          <span className="profile-field-value">
            <Calendar size={14} style={{ verticalAlign: "text-bottom" }} />{" "}
            {record.date_display}
          </span>
        </div>
        <div className="profile-field-row">
          <span className="profile-field-label">Chẩn đoán</span>
          <span className="profile-field-value">{record.diagnosis}</span>
        </div>
        <div className="profile-field-row">
          <span className="profile-field-label">Đơn thuốc</span>
          <span className="profile-field-value">
            <Pill size={14} style={{ verticalAlign: "text-bottom" }} />{" "}
            {record.has_prescription ? "Có đơn thuốc" : "Không có đơn thuốc"}
          </span>
        </div>
      </div>
    </article>
  );
}

export default MedicalRecordCard;
