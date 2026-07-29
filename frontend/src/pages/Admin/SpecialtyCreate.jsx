import { Link } from "react-router-dom";
import AdminLayout from "../../components/admin/layout/AdminLayout";

function SpecialtyCreate() {
    return (
        <AdminLayout title="Thêm chuyên khoa">
            <div className="admin-page">
                <div className="admin-page-header">
                    <div>
                        <h3>Thêm chuyên khoa mới</h3>
                        <p>Nhập thông tin chuyên khoa</p>
                    </div>
                    <div className="admin-page-actions">
                        <Link
                            to="/admin/specialties"
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
                            <label htmlFor="name">Tên chuyên khoa</label>
                            <input
                                id="name"
                                className="admin-input"
                                type="text"
                                placeholder="Ví dụ: Tim mạch"
                            />
                        </div>

                        <div className="admin-form-group">
                            <label htmlFor="description">Mô tả</label>
                            <textarea
                                id="description"
                                className="admin-textarea"
                                placeholder="Mô tả chuyên khoa"
                            />
                        </div>

                        <div className="admin-form-actions">
                            <button
                                type="submit"
                                className="admin-btn admin-btn-primary"
                            >
                                Lưu chuyên khoa
                            </button>
                            <Link
                                to="/admin/specialties"
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

export default SpecialtyCreate;
