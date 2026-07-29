import AdminLayout from "../../components/admin/layout/AdminLayout";

const users = [
    {
        id: 1,
        name: "Nguyễn Văn A",
        email: "vana@gmail.com",
        role: "PATIENT",
        avatar: "https://i.pravatar.cc/100?img=1",
        status: "active",
    },
    {
        id: 2,
        name: "Trần Thị B",
        email: "thib@gmail.com",
        role: "DOCTOR",
        avatar: "https://i.pravatar.cc/100?img=2",
        status: "active",
    },
    {
        id: 3,
        name: "Lê Văn C",
        email: "vanc@gmail.com",
        role: "PATIENT",
        avatar: "https://i.pravatar.cc/100?img=3",
        status: "inactive",
    },
    {
        id: 4,
        name: "Phạm Thị D",
        email: "thid@gmail.com",
        role: "ADMIN",
        avatar: "https://i.pravatar.cc/100?img=4",
        status: "active",
    },
];

const roleClass = {
    ADMIN: "admin",
    DOCTOR: "doctor",
    PATIENT: "patient",
};

const roleLabel = {
    ADMIN: "Admin",
    DOCTOR: "Bác sĩ",
    PATIENT: "Bệnh nhân",
};

function Users() {
    return (
        <AdminLayout title="Người dùng">
            <div className="admin-page">
                <div className="admin-page-header">
                    <div>
                        <h3>Quản lý người dùng</h3>
                        <p>Danh sách tài khoản trên hệ thống</p>
                    </div>
                </div>

                <div className="dashboard-card">
                    <div className="admin-toolbar">
                        <input
                            className="admin-input"
                            type="text"
                            placeholder="Tìm người dùng..."
                        />
                        <select className="admin-select" style={{ maxWidth: 200 }}>
                            <option value="">Tất cả vai trò</option>
                            <option value="ADMIN">Admin</option>
                            <option value="DOCTOR">Bác sĩ</option>
                            <option value="PATIENT">Bệnh nhân</option>
                        </select>
                    </div>

                    <div className="table-wrapper">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Người dùng</th>
                                    <th>Vai trò</th>
                                    <th>Trạng thái</th>
                                    <th>Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((user) => (
                                    <tr key={user.id}>
                                        <td>
                                            <div className="table-user">
                                                <img
                                                    className="table-avatar"
                                                    src={user.avatar}
                                                    alt={user.name}
                                                />
                                                <div className="table-user-info">
                                                    <strong>{user.name}</strong>
                                                    <span>{user.email}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`role ${roleClass[user.role]}`}>
                                                {roleLabel[user.role]}
                                            </span>
                                        </td>
                                        <td>
                                            <span
                                                className={`status ${
                                                    user.status === "active"
                                                        ? "confirmed"
                                                        : "cancelled"
                                                }`}
                                            >
                                                {user.status === "active"
                                                    ? "Hoạt động"
                                                    : "Tạm khóa"}
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

export default Users;
