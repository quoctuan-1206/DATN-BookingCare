import { Link } from "react-router-dom";
import { Star } from "lucide-react";

const reviews = [
    {
        id: 1,
        patient: "Nguyễn Văn A",
        rating: 5,
        comment: "Bác sĩ tư vấn rất tận tình và dễ hiểu.",
    },
    {
        id: 2,
        patient: "Trần Thị B",
        rating: 4,
        comment: "Khám nhanh, thái độ chuyên nghiệp.",
    },
    {
        id: 3,
        patient: "Phạm Văn C",
        rating: 5,
        comment: "Giải thích bệnh rất rõ ràng.",
    },
];

function ReviewSummary() {
    return (
        <div className="doctor-card doctor-review-summary">
            <div className="doctor-card-header">
                <div>
                    <h3>Đánh giá gần đây</h3>
                    <p>Điểm trung bình 4.8/5</p>
                </div>
                <Link to="/doctor/reviews" className="doctor-view-all">
                    Xem tất cả
                </Link>
            </div>

            <div className="doctor-rating-overview">
                <div className="doctor-rating-score">
                    <strong>4.8</strong>
                    <div className="doctor-rating-stars">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                                key={star}
                                size={16}
                                fill="#f59e0b"
                                color="#f59e0b"
                            />
                        ))}
                    </div>
                    <span>128 đánh giá</span>
                </div>

                <div className="doctor-rating-bars">
                    {[
                        { star: 5, percent: 78 },
                        { star: 4, percent: 15 },
                        { star: 3, percent: 5 },
                        { star: 2, percent: 1 },
                        { star: 1, percent: 1 },
                    ].map((item) => (
                        <div key={item.star} className="doctor-rating-bar-row">
                            <span>{item.star}</span>
                            <div className="doctor-rating-bar">
                                <div style={{ width: `${item.percent}%` }} />
                            </div>
                            <small>{item.percent}%</small>
                        </div>
                    ))}
                </div>
            </div>

            <div className="doctor-review-list">
                {reviews.map((review) => (
                    <div key={review.id} className="doctor-review-item">
                        <div className="doctor-review-top">
                            <strong>{review.patient}</strong>
                            <span>
                                <Star size={12} fill="#f59e0b" color="#f59e0b" />
                                {review.rating}.0
                            </span>
                        </div>
                        <p>{review.comment}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default ReviewSummary;
