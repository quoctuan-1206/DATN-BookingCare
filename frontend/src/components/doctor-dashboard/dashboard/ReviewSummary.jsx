import { Link } from "react-router-dom";
import { Star } from "lucide-react";

function ReviewSummary() {
  return (
    <div className="doctor-card doctor-review-summary">
      <div className="doctor-card-header">
        <div>
          <h3>Đánh giá gần đây</h3>
          <p>Chưa có API đánh giá</p>
        </div>
        <Link to="/doctor/reviews" className="doctor-view-all">
          Xem tất cả
        </Link>
      </div>

      <div className="doctor-rating-overview">
        <div className="doctor-rating-score">
          <strong>—</strong>
          <div className="doctor-rating-stars">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star key={star} size={16} color="#cbd5e1" />
            ))}
          </div>
          <span>0 đánh giá</span>
        </div>
      </div>

      <div className="doctor-review-list">
        <p>Chưa có đánh giá từ bệnh nhân.</p>
      </div>
    </div>
  );
}

export default ReviewSummary;
