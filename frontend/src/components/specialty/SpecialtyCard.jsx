import { Link } from "react-router-dom";
import { Stethoscope, Hospital, ChevronRight } from "lucide-react";

function SpecialtyCard({ specialty }) {
  const desc = specialty.description || "";
  const shortDesc = desc.length > 80 ? `${desc.slice(0, 80).trim()}...` : desc;

  return (
    <Link to={`/specialties/${specialty.id}`} className="specialty-card">
      <div className="specialty-card-image">
        <img src={specialty.image} alt={specialty.name} />
      </div>

      <div className="specialty-card-body">
        <h3 className="specialty-card-title">{specialty.name}</h3>

        {shortDesc && (
          <p className="specialty-card-desc">{shortDesc}</p>
        )}

        <div className="specialty-card-stats">
          <span className="specialty-card-stat">
            <Stethoscope size={14} />
            {specialty.doctor_count || 0} bác sĩ
          </span>
          <span className="specialty-card-stat">
            <Hospital size={14} />
            {specialty.clinic_count || 0} cơ sở y tế
          </span>
        </div>

        <span className="specialty-card-link">
          Xem chuyên khoa <ChevronRight size={14} />
        </span>
      </div>
    </Link>
  );
}

export default SpecialtyCard;
