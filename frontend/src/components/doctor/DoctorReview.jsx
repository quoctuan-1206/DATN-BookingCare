import { useEffect, useMemo, useState } from "react";
import { Check, Star } from "lucide-react";
import reviewService from "../../services/review.service";
import { getApiErrorMessage } from "../../api/axios";

function formatReviewDate(value) {
  if (!value) return "";
  try {
    return new Date(value).toLocaleDateString("vi-VN");
  } catch {
    return String(value).slice(0, 10);
  }
}

function initialOf(name) {
  return (name || "B").trim().charAt(0).toUpperCase();
}

function DoctorReview({ doctorId }) {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({
    average_rating: 0,
    total_reviews: 0,
    distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  });

  useEffect(() => {
    if (!doctorId) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const [statsData, listData] = await Promise.all([
          reviewService.getDoctorStats(doctorId),
          reviewService.getReviews({ doctor_id: doctorId, page: 1, limit: 50 }),
        ]);
        if (cancelled) return;
        setStats({
          average_rating: Number(statsData.average_rating || 0),
          total_reviews: Number(statsData.total_reviews || 0),
          distribution: {
            1: 0,
            2: 0,
            3: 0,
            4: 0,
            5: 0,
            ...(statsData.distribution || {}),
          },
        });
        setReviews(listData.data || []);
      } catch (err) {
        if (!cancelled) {
          setError(getApiErrorMessage(err, "Không tải được đánh giá"));
          setReviews([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [doctorId]);

  const count = stats.total_reviews;
  const average = stats.average_rating;
  const dist = stats.distribution;
  const shown = expanded ? reviews : reviews.slice(0, 2);

  const reviewItems = useMemo(
    () =>
      shown.map((r) => ({
        id: r.id,
        patient: r.patient_name || "Bệnh nhân",
        rating: r.rating || 0,
        comment: r.comment || "",
        date: formatReviewDate(r.created_at),
      })),
    [shown],
  );

  return (
    <section className="doctor-review">
      <h2>Đánh giá bệnh nhân</h2>

      <div className="doctor-review-body">
        <div className="review-breakdown">
          <p className="review-score">
            <Star size={22} fill="#f5a623" color="#f5a623" />
            <strong>{Number(average).toFixed(1)}</strong>
            <span>/ 5</span>
          </p>
          <small>({count} đánh giá)</small>

          <div className="review-bars">
            {[5, 4, 3, 2, 1].map((star) => {
              const value = dist[star] || 0;
              const percent = count ? (value / count) * 100 : 0;
              return (
                <div className="review-bar-row" key={star}>
                  <span>{star}</span>
                  <div className="review-bar-track">
                    <div
                      className="review-bar-fill"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <em>{value}</em>
                </div>
              );
            })}
          </div>
        </div>

        <div className="review-list">
          {loading ? (
            <p className="schedule-empty">Đang tải đánh giá...</p>
          ) : error ? (
            <p className="schedule-empty">{error}</p>
          ) : reviews.length === 0 ? (
            <p className="schedule-empty">Chưa có đánh giá.</p>
          ) : (
            reviewItems.map((review) => (
              <article className="review-card" key={review.id}>
                <div className="review-header">
                  <div className="review-user">
                    <span className="review-avatar" aria-hidden="true">
                      {initialOf(review.patient)}
                    </span>
                    <div>
                      <h4>
                        {review.patient}
                        <span className="review-verified">
                          <Check size={12} strokeWidth={2.5} />
                          Đã khám
                        </span>
                      </h4>
                    </div>
                  </div>
                  <span>{review.date}</span>
                </div>

                <div className="review-rating">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={14}
                      fill={star <= review.rating ? "#f5a623" : "none"}
                      color={star <= review.rating ? "#f5a623" : "#cbd5e1"}
                    />
                  ))}
                </div>

                {review.comment ? <p>{review.comment}</p> : null}
              </article>
            ))
          )}

          {!loading && reviews.length > 2 ? (
            <button
              type="button"
              className="review-more"
              onClick={() => setExpanded((v) => !v)}
            >
              {expanded ? "Thu gọn" : "Xem tất cả đánh giá"}
            </button>
          ) : null}
        </div>
      </div>
    </section>
  );
}

export default DoctorReview;
