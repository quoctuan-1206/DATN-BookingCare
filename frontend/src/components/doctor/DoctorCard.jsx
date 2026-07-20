import { Link } from "react-router-dom";
import { Star, Building2 } from "lucide-react";

function DoctorCard({ doctor }) {
    return (
        <article className="listing-card listing-card--doctor">
            <div className="listing-card__media">
                <img
                    src={doctor.image}
                    alt={doctor.name}
                />
                <span className="listing-card__badge">{doctor.specialty}</span>
            </div>

            <div className="listing-card__body">
                <h3 className="listing-card__title">{doctor.name}</h3>

                <p className="listing-card__specialty">{doctor.specialty}</p>

                <div className="listing-card__meta">
                    <span className="listing-card__meta-item">
                        <Building2 size={16} />
                        {doctor.clinic}
                    </span>
                </div>

                <div className="listing-card__rating">
                    <Star size={16} fill="#f5a623" stroke="#f5a623" />
                    {doctor.rating ?? "4.8"}
                </div>

                <div className="listing-card__footer">
                    <Link
                        to={`/doctors/${doctor.id}`}
                        className="btn btn-primary"
                    >
                        Xem chi tiết
                    </Link>
                </div>
            </div>
        </article>
    );
}

export default DoctorCard;
