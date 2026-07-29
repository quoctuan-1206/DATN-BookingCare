import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import AdminLayout from "../../components/admin/layout/AdminLayout";

const articles = [
    {
        id: 1,
        title: "5 cách chăm sóc tim mạch mùa nóng",
        author: "TS. Nguyễn Minh",
        category: "Sức khỏe",
        date: "18/08/2026",
        status: "published",
    },
    {
        id: 2,
        title: "Lịch tiêm chủng cho trẻ em",
        author: "BS. Lê Hoàng",
        category: "Nhi khoa",
        date: "15/08/2026",
        status: "draft",
    },
    {
        id: 3,
        title: "Phòng ngừa bệnh da liễu mùa mưa",
        author: "BS. Trần Quốc",
        category: "Da liễu",
        date: "10/08/2026",
        status: "published",
    },
];

function Articles() {
    return (
        <AdminLayout title="Bài viết">
            <div className="admin-page">
                <div className="admin-page-header">
                    <div>
                        <h3>Quản lý bài viết</h3>
                        <p>Danh sách bài viết trên hệ thống</p>
                    </div>
                    <div className="admin-page-actions">
                        <Link
                            to="/admin/articles/create"
                            className="admin-btn admin-btn-primary"
                        >
                            <Plus size={16} />
                            Viết bài mới
                        </Link>
                    </div>
                </div>

                <div className="dashboard-card">
                    <div className="admin-toolbar">
                        <input
                            className="admin-input"
                            type="text"
                            placeholder="Tìm bài viết..."
                        />
                    </div>

                    <div className="table-wrapper">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Tiêu đề</th>
                                    <th>Tác giả</th>
                                    <th>Danh mục</th>
                                    <th>Ngày</th>
                                    <th>Trạng thái</th>
                                    <th>Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {articles.map((article) => (
                                    <tr key={article.id}>
                                        <td>
                                            <strong>{article.title}</strong>
                                        </td>
                                        <td>{article.author}</td>
                                        <td>{article.category}</td>
                                        <td>{article.date}</td>
                                        <td>
                                            <span
                                                className={`status ${
                                                    article.status === "published"
                                                        ? "confirmed"
                                                        : "pending"
                                                }`}
                                            >
                                                {article.status === "published"
                                                    ? "Đã đăng"
                                                    : "Nháp"}
                                            </span>
                                        </td>
                                        <td>
                                            <button
                                                type="button"
                                                className="admin-btn admin-btn-secondary"
                                            >
                                                Sửa
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

export default Articles;
