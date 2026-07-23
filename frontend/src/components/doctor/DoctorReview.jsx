import { formatDate, getReviewsByDoctorId } from "../../data";

function DoctorReview({ doctorId }) {
    const reviews = getReviewsByDoctorId(doctorId).map((r) => ({
        id: r.id,
        patient: r.patient_name,
        rating: r.rating,
        comment: r.comment,
        date: formatDate(r.created_at?.slice(0, 10)),
    }));

    if (!reviews.length) {
        return (
            <section className="doctor-review">
                <h2>Đánh giá bệnh nhân</h2>
                <p>Chưa có đánh giá.</p>
            </section>
        );
    }

    const average =
        reviews.reduce((sum, item) => sum + item.rating, 0) / reviews.length;

    return (
        <section className="doctor-review">
            <h2>Đánh giá bệnh nhân</h2>

            <div className="review-summary">
                <span className="review-score">⭐ {average.toFixed(1)}</span>
                <span>({reviews.length} đánh giá)</span>
            </div>

            {reviews.map((review) => (
                <div className="review-card" key={review.id}>
                    <div className="review-header">
                        <h4>{review.patient}</h4>
                        <span>{review.date}</span>
                    </div>

                    <div className="review-rating">
                        {"⭐".repeat(review.rating)}
                    </div>

                    <p>{review.comment}</p>
                </div>
            ))}
        </section>
    );
}

export default DoctorReview;
