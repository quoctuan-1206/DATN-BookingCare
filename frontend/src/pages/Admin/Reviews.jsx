import AdminLayout from "../../components/admin/layout/AdminLayout";

const reviews = [
    {
        id: 1,
        patient: "Nguyễn Văn A",
        doctor: "TS. Nguyễn Minh",
        rating: 5,
        comment: "Bác sĩ tư vấn rất tận tình.",
        date: "18/08/2026",
        status: "visible",
    },
    {
        id: 2,
        patient: "Trần Thị B",
        doctor: "BS. Lê Hoàng",
        rating: 4,
        comment: "Khám nhanh, thái độ tốt.",
        date: "16/08/2026",
        status: "visible",
    },
    {
        id: 3,
        patient: "Phạm Văn C",
        doctor: "BS. Trần Quốc",
        rating: 2,
        comment: "Thời gian chờ hơi lâu.",
        date: "14/08/2026",
        status: "hidden",
    },
];

function Reviews() {
    return (
        <AdminLayout title="Đánh giá">
            <div className="admin-page">
                <div className="admin-page-header">
                    <div>
                        <h3>Quản lý đánh giá</h3>
                        <p>Theo dõi đánh giá của bệnh nhân</p>
                    </div>
                </div>

                <div className="dashboard-card">
                    <div className="table-wrapper">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Bệnh nhân</th>
                                    <th>Bác sĩ</th>
                                    <th>Điểm</th>
                                    <th>Nội dung</th>
                                    <th>Ngày</th>
                                    <th>Trạng thái</th>
                                    <th>Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reviews.map((review) => (
                                    <tr key={review.id}>
                                        <td>{review.patient}</td>
                                        <td>{review.doctor}</td>
                                        <td>
                                            <strong>{review.rating}/5</strong>
                                        </td>
                                        <td>{review.comment}</td>
                                        <td>{review.date}</td>
                                        <td>
                                            <span
                                                className={`status ${
                                                    review.status === "visible"
                                                        ? "confirmed"
                                                        : "cancelled"
                                                }`}
                                            >
                                                {review.status === "visible"
                                                    ? "Hiển thị"
                                                    : "Ẩn"}
                                            </span>
                                        </td>
                                        <td>
                                            <button
                                                type="button"
                                                className="admin-btn admin-btn-secondary"
                                            >
                                                Xử lý
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}

export default Reviews;
