import { Link } from "react-router-dom";
import { Briefcase, Building2, GraduationCap, Heart, Star } from "lucide-react";

function DoctorProfile({ doctor }) {
  const displayName =
    [doctor.last_name, doctor.first_name].filter(Boolean).join(" ") ||
    doctor.name;
  const rating = Number(doctor.rating || 0);
  const reviewCount = doctor.review_count ?? doctor.reviews?.length ?? 0;
  const badge = doctor.degree || doctor.position || "Bác sĩ";

  return (
    <section className="doctor-profile">
      <img
        src={doctor.image}
        alt={displayName}
        className="doctor-profile__image"
      />

      <div className="doctor-profile__info">
        <span className="doctor-profile__badge">{badge}</span>
        <h1>Bác sĩ {displayName}</h1>

        <ul className="doctor-profile__meta">
          {doctor.specialty ? (
            <li>
              <Heart size={16} />
              <span className="doctor-profile__specialty">{doctor.specialty}</span>
            </li>
          ) : null}
          {doctor.clinic ? (
            <li>
              <Building2 size={16} />
              {doctor.clinic_id ? (
                <Link to={`/clinics/${doctor.clinic_id}`}>{doctor.clinic}</Link>
              ) : (
                <span>{doctor.clinic}</span>
              )}
            </li>
          ) : null}
          {doctor.degree ? (
            <li>
              <GraduationCap size={16} />
              <span>{doctor.degree}</span>
            </li>
          ) : null}
          {doctor.experience_years ? (
            <li>
              <Briefcase size={16} />
              <span>{doctor.experience_years}+ năm kinh nghiệm</span>
            </li>
          ) : null}
        </ul>
      </div>

      <div className="doctor-profile__rating">
        <p>
          <Star size={22} fill="#f5a623" color="#f5a623" />
          <strong>{rating.toFixed(1)}</strong>
          <span>/ 5</span>
        </p>
        <small>({reviewCount} đánh giá)</small>
        <div className="doctor-profile__stars">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              size={16}
              fill={star <= Math.round(rating) ? "#f5a623" : "none"}
              color={star <= Math.round(rating) ? "#f5a623" : "#cbd5e1"}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export default DoctorProfile;
