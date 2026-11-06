import { Link } from "react-router-dom";
import { Building2, Heart } from "lucide-react";

function DoctorProfile({ doctor }) {
  const displayName =
    [doctor.last_name, doctor.first_name].filter(Boolean).join(" ") ||
    doctor.name;

  return (
    <section className="doctor-profile">
      <img
        src={doctor.image}
        alt={displayName}
        className="doctor-profile__image"
      />

      <div className="doctor-profile__info">
        <span className="doctor-profile__badge">Bác sĩ</span>
        <h1>{displayName}</h1>

        <ul className="doctor-profile__meta">
          {doctor.specialty ? (
            <li>
              <Heart size={16} aria-hidden="true" />
              {doctor.specialty_id ? (
                <Link
                  to={`/specialties/${doctor.specialty_id}`}
                  className="doctor-profile__specialty"
                >
                  {doctor.specialty}
                </Link>
              ) : (
                <span className="doctor-profile__specialty">{doctor.specialty}</span>
              )}
            </li>
          ) : null}
          {doctor.clinic ? (
            <li>
              <Building2 size={16} aria-hidden="true" />
              {doctor.clinic_id ? (
                <Link to={`/clinics/${doctor.clinic_id}`}>{doctor.clinic}</Link>
              ) : (
                <span>{doctor.clinic}</span>
              )}
            </li>
          ) : null}
        </ul>
      </div>
    </section>
  );
}

export default DoctorProfile;
