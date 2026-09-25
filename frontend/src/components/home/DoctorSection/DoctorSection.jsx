import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, Check, Star, UsersRound } from "lucide-react";
import SectionHeader from "../../common/SectionHeader/SectionHeader";
import doctorService from "../../../services/doctor.service";

function RatingStars({ rating }) {
  const roundedRating = Math.round(Number(rating || 0));

  return (
    <span className="home-rating-stars" aria-label={`${rating || 0} trên 5 sao`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={14}
          fill={star <= roundedRating ? "currentColor" : "none"}
        />
      ))}
    </span>
  );
}

function DoctorSection() {
  const [doctors, setDoctors] = useState([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const result = await doctorService.getDoctors({ page: 1, limit: 12 });
        if (!cancelled) setDoctors(result.data || []);
      } catch {
        if (!cancelled) setDoctors([]);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="section home-modern-section home-doctor-section">
      <div className="home-content-container">
        <SectionHeader
          title="Bác sĩ nổi bật"
          viewMoreLink="/doctors"
          viewMoreLabel="Xem tất cả"
        />

        {doctors.length === 0 ? (
          <p className="home-section-empty">Thông tin bác sĩ đang được cập nhật.</p>
        ) : (
          <div className="home-doctor-grid">
            {doctors.slice(0, 4).map((doctor) => {
              const rating = Number(doctor.rating || 0);
              const visitCount = doctor.appointment_count ?? doctor.review_count ?? 0;

              return (
                <article key={doctor.id} className="home-doctor-card">
                  <Link
                    className="home-doctor-photo"
                    to={`/doctors/${doctor.id}`}
                    aria-label={`Xem hồ sơ ${doctor.name}`}
                  >
                    <img src={doctor.image} alt={doctor.name} loading="lazy" />
                    <span className="home-verified-badge">
                      <Check size={13} strokeWidth={3} />
                      Đã xác minh
                    </span>
                  </Link>

                  <div className="home-doctor-body">
                    <div>
                      <Link className="home-card-title" to={`/doctors/${doctor.id}`}>
                        {doctor.name}
                      </Link>
                      <p className="home-doctor-specialty">
                        {doctor.specialty && doctor.specialty !== "—"
                          ? doctor.specialty
                          : "Bác sĩ đa khoa"}
                      </p>
                    </div>

                    <div className="home-doctor-meta">
                      <span className="home-doctor-rating">
                        <RatingStars rating={rating} />
                        <strong>{rating.toFixed(1)}</strong>
                      </span>
                      <span className="home-visit-count">
                        <UsersRound size={15} />
                        {visitCount} lượt khám
                      </span>
                    </div>

                    <div className="home-doctor-actions">
                      <Link className="home-action-btn home-action-btn--outline" to={`/doctors/${doctor.id}`}>
                        Xem hồ sơ
                      </Link>
                      <Link className="home-action-btn home-action-btn--primary" to={`/doctors/${doctor.id}`}>
                        <CalendarDays size={16} />
                        Đặt lịch
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

export default DoctorSection;
