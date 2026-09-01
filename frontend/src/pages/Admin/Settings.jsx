import AdminLayout from "../../components/admin/layout/AdminLayout";

function Settings() {
    return (
        <AdminLayout title="Cài đặt">
            <div className="admin-page">
                <div className="admin-page-header">
                    <div>
                        <h3>Cài đặt hệ thống</h3>
                        <p>Cấu hình thông tin chung của MediUTE</p>
                    </div>
                </div>

                <div className="dashboard-card">
                    <form
                        className="admin-form"
                        onSubmit={(e) => e.preventDefault()}
                    >
                        <div className="admin-form-group">
                            <label htmlFor="siteName">Tên hệ thống</label>
                            <input
                                id="siteName"
                                className="admin-input"
                                type="text"
                                defaultValue="MediUTE"
                            />
                        </div>

                        <div className="admin-form-group">
                            <label htmlFor="supportEmail">Email hỗ trợ</label>
                            <input
                                id="supportEmail"
                                className="admin-input"
                                type="email"
                                defaultValue="support@mediute.vn"
                            />
                        </div>

                        <div className="admin-form-group">
                            <label htmlFor="hotline">Hotline</label>
                            <input
                                id="hotline"
                                className="admin-input"
                                type="text"
                                defaultValue="1900 1234"
                            />
                        </div>

                        <div className="admin-form-group">
                            <label htmlFor="address">Địa chỉ</label>
                            <textarea
                                id="address"
                                className="admin-textarea"
                                defaultValue="TP. Hồ Chí Minh, Việt Nam"
                            />
                        </div>

                        <div className="admin-form-actions">
                            <button
                                type="submit"
                                className="admin-btn admin-btn-primary"
                            >
                                Lưu cài đặt
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AdminLayout>
    );
}

export default Settings;
