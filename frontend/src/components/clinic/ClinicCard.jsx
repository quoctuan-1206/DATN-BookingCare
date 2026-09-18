import { Link } from "react-router-dom";
import { ChevronRight, MapPin, Phone, Users } from "lucide-react";

function ClinicCard({ clinic }) {
  return (
    <Link to={`/clinics/${clinic.id}`} className="clinic-card">
      <div className="clinic-card__image">
        <img src={clinic.image} alt={clinic.name} />
        <span className="clinic-card__badge">Phòng khám</span>
      </div>

      <div className="clinic-card__body">
        <h2>{clinic.name}</h2>
        <p className="clinic-card__address">
          <MapPin size={16} />
          <span>{clinic.address || "Đang cập nhật địa chỉ"}</span>
        </p>

        <div className="clinic-card__meta">
          <span>
            <Users size={15} />
            {clinic.doctor_count || 0} bác sĩ
          </span>
          {clinic.phone && (
            <span>
              <Phone size={15} />
              {clinic.phone}
            </span>
          )}
        </div>

        <span className="clinic-card__link">
          Xem chi tiết <ChevronRight size={15} />
        </span>
      </div>
    </Link>
  );
}

export default ClinicCard;
