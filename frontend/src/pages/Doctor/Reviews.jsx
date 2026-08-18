import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import toast from "react-hot-toast";
import DoctorLayout from "../../components/doctor-dashboard/layout/DoctorLayout";
import reviewService from "../../services/review.service";
import { getApiErrorMessage } from "../../api/axios";

function formatDate(value) {
  if (!value) return "";
  try {
    return new Date(value).toLocaleDateString("vi-VN");
  } catch {
    return String(value).slice(0, 10);
  }
}

function Reviews() {
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({ average_rating: 0, total_reviews: 0 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const userId = JSON.parse(
          localStorage.getItem("user") || "{}",
        )?.id;

        const [result, statsData] = await Promise.all([
          reviewService.getReviews({ doctor_id: userId, page, limit: 20 }),
          userId ? reviewService.getDoctorStats(userId) : Promise.resolve({ average_rating: 0, total_reviews: 0 }),
        ]);

        if (!cancelled) {
          setReviews(result.data || []);
          setTotalPages(result.pagination?.total_pages || 0);
          setStats(statsData);
        }
      } catch (error) {
        if (!cancelled) {
          toast.error(getApiErrorMessage(error, "Không tải được đánh giá"));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [page]);

  return (
    <DoctorLayout title="Đánh giá">
      <div className="doctor-reviews-page">
        <div className="doctor-reviews-header">
          <h3>Đánh giá từ bệnh nhân</h3>
          <div className="doctor-reviews-stats">
            <span className="doctor-reviews-avg">
              ⭐ {stats.average_rating.toFixed(1)}
            </span>
            <span className="doctor-reviews-count">
              {stats.total_reviews} đánh giá
            </span>
          </div>
        </div>

        {loading ? (
          <p>Đang tải...</p>
        ) : reviews.length === 0 ? (
          <p className="doctor-reviews-empty">Chưa có đánh giá nào.</p>
        ) : (
          <>
            <div className="doctor-reviews-list">
              {reviews.map((review) => (
                <div key={review.id} className="doctor-review-card">
                  <div className="doctor-review-card-header">
                    <strong>{review.patient_name || "Bệnh nhân"}</strong>
                    <span className="doctor-review-date">
                      {formatDate(review.created_at)}
                    </span>
                  </div>
                  <div className="doctor-review-stars">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={16}
                        fill={star <= review.rating ? "#f5a623" : "none"}
                        color={star <= review.rating ? "#f5a623" : "#cbd5e1"}
                      />
                    ))}
                    <span className="doctor-review-rating-num">
                      {review.rating}/5
                    </span>
                  </div>
                  {review.comment && (
                    <p className="doctor-review-comment">{review.comment}</p>
                  )}
                  {review.booking_code && (
                    <span className="doctor-review-booking">
                      Mã: {review.booking_code}
                    </span>
                  )}
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="doctor-reviews-pagination">
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Trước
                </button>
                <span>
                  Trang {page} / {totalPages}
                </span>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Sau
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </DoctorLayout>
  );
}

export default Reviews;
