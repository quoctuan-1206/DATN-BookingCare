import { Link } from "react-router-dom";
import AdminLayout from "../../components/admin/layout/AdminLayout";

function ArticleCreate() {
    return (
        <AdminLayout title="Viết bài mới">
            <div className="admin-page">
                <div className="admin-page-header">
                    <div>
                        <h3>Viết bài mới</h3>
                        <p>Tạo nội dung bài viết cho hệ thống</p>
                    </div>
                    <div className="admin-page-actions">
                        <Link
                            to="/admin/articles"
                            className="admin-btn admin-btn-secondary"
                        >
                            Quay lại
                        </Link>
                    </div>
                </div>

                <div className="dashboard-card">
                    <form
                        className="admin-form"
                        onSubmit={(e) => e.preventDefault()}
                    >
                        <div className="admin-form-group">
                            <label htmlFor="title">Tiêu đề</label>
                            <input
                                id="title"
                                className="admin-input"
                                type="text"
                                placeholder="Nhập tiêu đề bài viết"
                            />
                        </div>

                        <div className="admin-form-group">
                            <label htmlFor="category">Danh mục</label>
                            <select id="category" className="admin-select">
                                <option value="">Chọn danh mục</option>
                                <option value="health">Sức khỏe</option>
                                <option value="pediatric">Nhi khoa</option>
                                <option value="dermatology">Da liễu</option>
                            </select>
                        </div>

                        <div className="admin-form-group">
                            <label htmlFor="content">Nội dung</label>
                            <textarea
                                id="content"
                                className="admin-textarea"
                                placeholder="Nhập nội dung bài viết"
                                style={{ minHeight: 220 }}
                            />
                        </div>

                        <div className="admin-form-actions">
                            <button
                                type="submit"
                                className="admin-btn admin-btn-primary"
                            >
                                Đăng bài
                            </button>
                            <button
                                type="button"
                                className="admin-btn admin-btn-warning"
                            >
                                Lưu nháp
                            </button>
                            <Link
                                to="/admin/articles"
                                className="admin-btn admin-btn-secondary"
                            >
                                Hủy
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </AdminLayout>
    );
}

export default ArticleCreate;
