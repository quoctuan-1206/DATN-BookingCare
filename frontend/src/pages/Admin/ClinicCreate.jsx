import { Link } from "react-router-dom";
import AdminLayout from "../../components/admin/layout/AdminLayout";

function ClinicCreate() {
    return (
        <AdminLayout title="Thêm phòng khám">
            <div className="admin-page">
                <div className="admin-page-header">
                    <div>
                        <h3>Thêm phòng khám mới</h3>
                        <p>Nhập thông tin phòng khám</p>
                    </div>
                    <div className="admin-page-actions">
                        <Link
                            to="/admin/clinics"
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
                            <label htmlFor="name">Tên phòng khám</label>
                            <input
                                id="name"
                                className="admin-input"
                                type="text"
                                placeholder="Nhập tên phòng khám"
                            />
                        </div>

                        <div className="admin-form-group">
                            <label htmlFor="address">Địa chỉ</label>
                            <input
                                id="address"
                                className="admin-input"
                                type="text"
                                placeholder="Nhập địa chỉ"
                            />
                        </div>

                        <div className="admin-form-group">
                            <label htmlFor="phone">Số điện thoại</label>
                            <input
                                id="phone"
                                className="admin-input"
                                type="text"
                                placeholder="0281234567"
                            />
                        </div>

                        <div className="admin-form-group">
                            <label htmlFor="description">Mô tả</label>
                            <textarea
                                id="description"
                                className="admin-textarea"
                                placeholder="Mô tả ngắn về phòng khám"
                            />
                        </div>

                        <div className="admin-form-actions">
                            <button
                                type="submit"
                                className="admin-btn admin-btn-primary"
                            >
                                Lưu phòng khám
                            </button>
                            <Link
                                to="/admin/clinics"
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

export default ClinicCreate;
