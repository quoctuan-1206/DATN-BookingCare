import AdminLayout from "../../components/admin/layout/AdminLayout";

function Profile() {
    return (
        <AdminLayout title="Hồ sơ">
            <div className="admin-page">
                <div className="admin-page-header">
                    <div>
                        <h3>Hồ sơ quản trị viên</h3>
                        <p>Thông tin tài khoản admin hiện tại</p>
                    </div>
                </div>

                <div className="dashboard-card">
                    <div className="table-user" style={{ marginBottom: 24 }}>
                        <img
                            className="table-avatar"
                            src="https://i.pravatar.cc/100"
                            alt="Admin"
                            style={{ width: 72, height: 72 }}
                        />
                        <div className="table-user-info">
                            <strong style={{ fontSize: 18 }}>Administrator</strong>
                            <span>Super Admin</span>
                        </div>
                    </div>

                    <form
                        className="admin-form"
                        onSubmit={(e) => e.preventDefault()}
                    >
                        <div className="admin-form-group">
                            <label htmlFor="fullName">Họ và tên</label>
                            <input
                                id="fullName"
                                className="admin-input"
                                type="text"
                                defaultValue="Administrator"
                            />
                        </div>

                        <div className="admin-form-group">
                            <label htmlFor="email">Email</label>
                            <input
                                id="email"
                                className="admin-input"
                                type="email"
                                defaultValue="admin@mediute.vn"
                            />
                        </div>

                        <div className="admin-form-group">
                            <label htmlFor="phone">Số điện thoại</label>
                            <input
                                id="phone"
                                className="admin-input"
                                type="text"
                                defaultValue="0909999888"
                            />
                        </div>

                        <div className="admin-form-actions">
                            <button
                                type="submit"
                                className="admin-btn admin-btn-primary"
                            >
                                Cập nhật hồ sơ
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AdminLayout>
    );
}

export default Profile;
