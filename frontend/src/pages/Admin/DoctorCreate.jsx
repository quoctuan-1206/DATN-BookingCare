import { Link } from "react-router-dom";
import AdminLayout from "../../components/admin/layout/AdminLayout";

function DoctorCreate() {
    return (
        <AdminLayout title="Thêm bác sĩ">
            <div className="admin-page">
                <div className="admin-page-header">
                    <div>
                        <h3>Thêm bác sĩ mới</h3>
                        <p>Nhập thông tin bác sĩ để thêm vào hệ thống</p>
                    </div>
                    <div className="admin-page-actions">
                        <Link
                            to="/admin/doctors"
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
                            <label htmlFor="name">Họ và tên</label>
                            <input
                                id="name"
                                className="admin-input"
                                type="text"
                                placeholder="Nhập họ tên bác sĩ"
                            />
                        </div>

                        <div className="admin-form-group">
                            <label htmlFor="email">Email</label>
                            <input
                                id="email"
                                className="admin-input"
                                type="email"
                                placeholder="email@example.com"
                            />
                        </div>

                        <div className="admin-form-group">
                            <label htmlFor="phone">Số điện thoại</label>
                            <input
                                id="phone"
                                className="admin-input"
                                type="text"
                                placeholder="0901234567"
                            />
                        </div>

                        <div className="admin-form-group">
                            <label htmlFor="specialty">Chuyên khoa</label>
                            <select id="specialty" className="admin-select">
                                <option value="">Chọn chuyên khoa</option>
                                <option value="1">Tim mạch</option>
                                <option value="2">Nhi khoa</option>
                                <option value="3">Da liễu</option>
                            </select>
                        </div>

                        <div className="admin-form-group">
                            <label htmlFor="clinic">Phòng khám</label>
                            <select id="clinic" className="admin-select">
                                <option value="">Chọn phòng khám</option>
                                <option value="1">Phòng khám Đa khoa A</option>
                                <option value="2">Phòng khám Nhi B</option>
                            </select>
                        </div>

                        <div className="admin-form-actions">
                            <button
                                type="submit"
                                className="admin-btn admin-btn-primary"
                            >
                                Lưu bác sĩ
                            </button>
                            <Link
                                to="/admin/doctors"
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

export default DoctorCreate;
