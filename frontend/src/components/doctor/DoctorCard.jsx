import { Link } from "react-router-dom";
import { Building2, ChevronRight, Star } from "lucide-react";

function DoctorCard({ doctor }) {
  return (
    <Link to={`/doctors/${doctor.id}`} className="specialty-card doctor-list-card">
      <div className="specialty-card-image">
        <img src={doctor.image} alt={doctor.name} />
      </div>

      <div className="specialty-card-body">
        <h3 className="specialty-card-title">{doctor.name}</h3>

        {doctor.specialty ? (
          <p className="specialty-card-desc">{doctor.specialty}</p>
        ) : null}

        <div className="specialty-card-stats">
          <span className="specialty-card-stat">
            <Building2 size={14} />
            {doctor.clinic || "—"}
          </span>
          <span className="specialty-card-stat">
            <Star size={14} />
            {doctor.rating ?? "—"}
          </span>
        </div>

        <span className="specialty-card-link">
          Xem hồ sơ <ChevronRight size={14} />
        </span>
      </div>
    </Link>
  );
}

export default DoctorCard;
