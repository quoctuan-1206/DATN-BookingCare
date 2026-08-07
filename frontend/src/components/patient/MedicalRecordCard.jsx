import {
  Calendar,
  ChevronRight,
  ClipboardPlus,
  Hospital,
  Pill,
  Stethoscope,
} from "lucide-react";
import { Link } from "react-router-dom";

function MedicalRecordCard({ record }) {
  if (!record) return null;

  return (
    <div className="medical-card">
      <div className="medical-top">
        <div>
          <h3>{record.doctor_name}</h3>
          <p>
            <Hospital size={14} />
            {record.clinic}
          </p>
          <p>
            <Stethoscope size={14} />
            {record.specialty}
          </p>
        </div>

        <div className="medical-date">
          <Calendar size={14} />
          {record.date_display}
        </div>
      </div>

      <div className="medical-body">
        <div className="medical-diagnosis">
          <ClipboardPlus size={16} />
          <div>
            <strong>Chẩn đoán</strong>
            <p>{record.diagnosis}</p>
          </div>
        </div>

        <div className="medical-prescription">
          <Pill size={16} />
          <span>
            {record.has_prescription ? "Có đơn thuốc" : "Không có đơn thuốc"}
          </span>
        </div>
      </div>

      <div className="medical-footer">
        <span className="patient-muted">{record.booking_code}</span>
        <Link
          to={`/patient/medical-records/${record.id}`}
          className="medical-detail-btn"
        >
          Xem bệnh án
          <ChevronRight size={14} />
        </Link>
      </div>
    </div>
  );
}

export default MedicalRecordCard;
