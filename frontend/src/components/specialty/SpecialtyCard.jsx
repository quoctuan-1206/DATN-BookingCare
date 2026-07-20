import { Link } from "react-router-dom";

function SpecialtyCard({ specialty }) {
    return (
        <article className="listing-card">
            <div className="listing-card__media">
                <img
                    src={specialty.image}
                    alt={specialty.name}
                />
                <span className="listing-card__badge">Chuyên khoa</span>
            </div>

            <div className="listing-card__body">
                <h3 className="listing-card__title">{specialty.name}</h3>

                <p className="listing-card__desc">{specialty.description}</p>

                <div className="listing-card__footer">
                    <Link
                        to={`/specialties/${specialty.id}`}
                        className="btn btn-primary"
                    >
                        Xem chi tiết
                    </Link>
                </div>
            </div>
        </article>
    );
}

export default SpecialtyCard;
