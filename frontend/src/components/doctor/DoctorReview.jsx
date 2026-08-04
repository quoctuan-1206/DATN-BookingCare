function formatReviewDate(value) {
  if (!value) return "";
  try {
    return new Date(value).toLocaleDateString("vi-VN");
  } catch {
    return String(value).slice(0, 10);
  }
}

function DoctorReview({
  reviews: reviewsProp,
  rating,
  reviewCount,
}) {
  const reviews = (reviewsProp || []).map((r) => ({
    id: r.id,
    patient: r.patient_name || r.patient || "Bệnh nhân",
    rating: r.rating || 0,
    comment: r.comment || "",
    date: formatReviewDate(r.created_at),
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
    typeof rating === "number"
      ? rating
      : reviews.reduce((sum, item) => sum + item.rating, 0) / reviews.length;

  return (
    <section className="doctor-review">
      <h2>Đánh giá bệnh nhân</h2>

      <div className="review-summary">
        <span className="review-score">⭐ {Number(average).toFixed(1)}</span>
        <span>({reviewCount ?? reviews.length} đánh giá)</span>
      </div>

      {reviews.map((review) => (
        <div className="review-card" key={review.id}>
          <div className="review-header">
            <h4>{review.patient}</h4>
            <span>{review.date}</span>
          </div>

          <div className="review-rating">{"⭐".repeat(review.rating)}</div>

          <p>{review.comment}</p>
        </div>
      ))}
    </section>
  );
}

export default DoctorReview;
