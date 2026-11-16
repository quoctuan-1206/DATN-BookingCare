import { Link } from "react-router-dom";
import { ChevronRight, MapPin, Phone, Users } from "lucide-react";

function ClinicCard({ clinic }) {
  function handleImageLoad(event) {
    const image = event.currentTarget;
    const ratio = image.naturalWidth / image.naturalHeight;
    const name = String(clinic.image || "").split("?")[0].split("/").pop();
    const filenameSuggestsLogo = /(?:^|[-_.])(logo|brand|emblem)(?:[-_.]|$)/i.test(name || "");

    image.dataset.fit = filenameSuggestsLogo || ratio <= 1.2 ? "contain" : "cover";
  }

  function handleImageError(event) {
    event.currentTarget.dataset.fit = "cover";
    event.currentTarget.src = "/clinic-placeholder.svg";
  }

  return (
    <Link to={`/clinics/${clinic.id}`} className="clinic-card">
      <div className="clinic-card__image">
        <img
          src={clinic.image || "/clinic-placeholder.svg"}
          alt={clinic.name}
          onLoad={handleImageLoad}
          onError={handleImageError}
        />
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
