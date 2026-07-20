const reviews = [
    {
        id: 1,
        patient: "Nguyễn Văn A",
        rating: 5,
        comment: "Bác sĩ rất tận tâm, giải thích rõ ràng.",
        date: "20/07/2026",
    },
    {
        id: 2,
        patient: "Trần Văn B",
        rating: 4,
        comment: "Khám nhanh, nhiệt tình.",
        date: "18/07/2026",
    },
    {
        id: 3,
        patient: "Lê Thị C",
        rating: 5,
        comment: "Rất hài lòng.",
        date: "15/07/2026",
    },
];

function DoctorReview() {

    const average =
        reviews.reduce((sum, item) => sum + item.rating, 0) /
        reviews.length;

    return (
        <section className="doctor-review">

            <h2>Đánh giá bệnh nhân</h2>

            <div className="review-summary">

                <span className="review-score">
                    ⭐ {average.toFixed(1)}
                </span>

                <span>
                    ({reviews.length} đánh giá)
                </span>

            </div>

            {reviews.map((review) => (

                <div
                    className="review-card"
                    key={review.id}
                >

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