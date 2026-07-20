import { Link } from "react-router-dom";
import { MapPin, Phone } from "lucide-react";

function ClinicCard({ clinic }) {
    return (
        <article className="listing-card">
            <div className="listing-card__media">
                <img
                    src={clinic.image}
                    alt={clinic.name}
                />
                <span className="listing-card__badge">Phòng khám</span>
            </div>

            <div className="listing-card__body">
                <h3 className="listing-card__title">{clinic.name}</h3>

                <div className="listing-card__meta">
                    <span className="listing-card__meta-item">
                        <MapPin size={16} />
                        {clinic.address}
                    </span>

                    <span className="listing-card__meta-item">
                        <Phone size={16} />
                        {clinic.phone}
                    </span>
                </div>

                <div className="listing-card__footer">
                    <Link
                        to={`/clinics/${clinic.id}`}
                        className="btn btn-primary"
                    >
                        Xem chi tiết
                    </Link>
                </div>
            </div>
        </article>
    );
}

export default ClinicCard;
