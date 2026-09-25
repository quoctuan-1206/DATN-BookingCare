import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Clock3, Heart, MapPin, Star } from "lucide-react";
import SectionHeader from "../../common/SectionHeader/SectionHeader";
import clinicService from "../../../services/clinic.service";

function formatReviewCount(value) {
  const count = Number(value || 0);
  if (count < 1000) return count.toLocaleString("vi-VN");

  const compact = (count / 1000).toFixed(count >= 10000 ? 0 : 1);
  return `${compact.replace(".0", "")}k`;
}

function getFacilityCategory(clinic) {
  if (clinic.category) return clinic.category;
  if (clinic.type) return clinic.type;

  const name = String(clinic.name || "").toLocaleLowerCase("vi-VN");
  const knownCategories = [
    ["tai mũi họng", "Tai Mũi Họng"],
    ["da liễu", "Da liễu"],
    ["nha khoa", "Nha khoa"],
    ["mắt", "Nhãn khoa"],
    ["sản", "Sản phụ khoa"],
    ["nhi", "Nhi khoa"],
    ["tim mạch", "Tim mạch"],
  ];

  return knownCategories.find(([keyword]) => name.includes(keyword))?.[1] || "Đa khoa";
}

function ClinicSection() {
  const [clinics, setClinics] = useState([]);
  const [favoriteIds, setFavoriteIds] = useState(() => new Set());

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const result = await clinicService.getClinics({ page: 1, limit: 12 });
        if (!cancelled) setClinics(result.data || []);
      } catch {
        if (!cancelled) setClinics([]);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  function toggleFavorite(clinicId) {
    setFavoriteIds((current) => {
      const next = new Set(current);
      if (next.has(clinicId)) next.delete(clinicId);
      else next.add(clinicId);
      return next;
    });
  }

  return (
    <section className="section home-modern-section home-clinic-section">
      <div className="home-content-container">
        <SectionHeader
          title="Cơ sở y tế"
          viewMoreLink="/clinics"
          viewMoreLabel="Xem tất cả"
        />

        {clinics.length === 0 ? (
          <p className="home-section-empty">Thông tin cơ sở y tế đang được cập nhật.</p>
        ) : (
          <div className="home-clinic-grid">
            {clinics.slice(0, 3).map((clinic) => {
              const rating = Number(clinic.rating ?? 5);
              const reviewCount = formatReviewCount(clinic.review_count);
              const category = getFacilityCategory(clinic);
              const isFavorite = favoriteIds.has(clinic.id);

              return (
                <article key={clinic.id} className="home-clinic-card">
                  <div className="home-clinic-media">
                    <Link
                      className="home-clinic-photo"
                      to={`/clinics/${clinic.id}`}
                      aria-label={`Xem chi tiết ${clinic.name}`}
                    >
                      <img src={clinic.image} alt={clinic.name} loading="lazy" />
                    </Link>

                    <span className="home-clinic-badge">{category}</span>
                    <button
                      type="button"
                      className={`home-clinic-favorite${isFavorite ? " active" : ""}`}
                      onClick={() => toggleFavorite(clinic.id)}
                      aria-label={isFavorite ? `Bỏ yêu thích ${clinic.name}` : `Yêu thích ${clinic.name}`}
                      aria-pressed={isFavorite}
                    >
                      <Heart size={18} fill={isFavorite ? "currentColor" : "none"} />
                    </button>
                  </div>

                  <div className="home-clinic-body">
                    <Link className="home-clinic-title" to={`/clinics/${clinic.id}`}>
                      {clinic.name}
                    </Link>

                    <div
                      className="home-clinic-rating"
                      aria-label={`${rating.toFixed(1)} sao, ${reviewCount} đánh giá`}
                    >
                      <Star size={16} fill="currentColor" />
                      <strong>{rating.toFixed(1)}</strong>
                      <span>({reviewCount} đánh giá)</span>
                    </div>

                    <div className="home-clinic-services" aria-label="Dịch vụ nổi bật">
                      <span>{category}</span>
                      <span>{clinic.doctor_count || 0} bác sĩ</span>
                    </div>

                    <div className="home-clinic-meta">
                      <p className="home-clinic-address">
                        <MapPin size={17} />
                        <span>{clinic.address || "Đang cập nhật địa chỉ"}</span>
                      </p>
                      <p className="home-clinic-hours">
                        <Clock3 size={17} />
                        <span>{clinic.working_hours || "07:00 - 16:30"}</span>
                      </p>
                    </div>

                    <div className="home-clinic-actions">
                      <Link className="home-clinic-detail" to={`/clinics/${clinic.id}`}>
                        Xem chi tiết <ChevronRight size={15} />
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

export default ClinicSection;
