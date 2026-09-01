import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Star } from "lucide-react";
import reviewService from "../../../services/review.service";
import { useAuth } from "../../../context/AuthContext";

function ReviewSummary() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ average_rating: 0, total_reviews: 0 });
  const [recent, setRecent] = useState([]);

  useEffect(() => {
    const userId = user?.id;
    if (!userId) return;

    let cancelled = false;

    Promise.all([
      reviewService.getDoctorStats(userId),
      reviewService.getReviews({ doctor_id: userId, page: 1, limit: 3 }),
    ])
      .then(([s, r]) => {
        if (cancelled) return;
        setStats(s);
        setRecent(r.data || []);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const avg = Number(stats.average_rating || 0);

  return (
    <div className="doctor-card doctor-review-summary">
      <div className="doctor-card-header">
        <div>
          <h3>Đánh giá gần đây</h3>
          <p>{stats.total_reviews} đánh giá</p>
        </div>
        <Link to="/doctor/reviews" className="doctor-view-all">
          Xem tất cả
        </Link>
      </div>

      <div className="doctor-rating-overview">
        <div className="doctor-rating-score">
          <strong>{avg > 0 ? avg.toFixed(1) : "—"}</strong>
          <div className="doctor-rating-stars">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                size={16}
                fill={star <= Math.round(avg) ? "#f5a623" : "none"}
                color={star <= Math.round(avg) ? "#f5a623" : "#cbd5e1"}
              />
            ))}
          </div>
          <span>{stats.total_reviews} đánh giá</span>
        </div>
      </div>

      <div className="doctor-review-list">
        {recent.length === 0 ? (
          <p>Chưa có đánh giá từ bệnh nhân.</p>
        ) : (
          recent.map((r) => (
            <div key={r.id} className="doctor-review-item">
              <div className="doctor-review-item-header">
                <strong>{r.patient_name || "Bệnh nhân"}</strong>
                <span>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={14}
                      fill={star <= r.rating ? "#f5a623" : "none"}
                      color={star <= r.rating ? "#f5a623" : "#cbd5e1"}
                    />
                  ))}
                </span>
              </div>
              {r.comment && <p>{r.comment}</p>}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default ReviewSummary;
