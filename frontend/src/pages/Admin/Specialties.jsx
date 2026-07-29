import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import AdminLayout from "../../components/admin/layout/AdminLayout";

const specialties = [
    { id: 1, name: "Tim mạch", doctors: 12, clinics: 4, status: "active" },
    { id: 2, name: "Nhi khoa", doctors: 9, clinics: 3, status: "active" },
    { id: 3, name: "Da liễu", doctors: 7, clinics: 2, status: "active" },
    { id: 4, name: "Nội tổng quát", doctors: 15, clinics: 5, status: "inactive" },
];

function Specialties() {
    return (
        <AdminLayout title="Chuyên khoa">
            <div className="admin-page">
                <div className="admin-page-header">
                    <div>
                        <h3>Quản lý chuyên khoa</h3>
                        <p>Danh sách chuyên khoa trên hệ thống</p>
                    </div>
                    <div className="admin-page-actions">
                        <Link
                            to="/admin/specialties/create"
                            className="admin-btn admin-btn-primary"
                        >
                            <Plus size={16} />
                            Thêm chuyên khoa
                        </Link>
                    </div>
                </div>

                <div className="dashboard-card">
                    <div className="admin-toolbar">
                        <input
                            className="admin-input"
                            type="text"
                            placeholder="Tìm chuyên khoa..."
                        />
                    </div>

                    <div className="table-wrapper">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Tên chuyên khoa</th>
                                    <th>Số bác sĩ</th>
                                    <th>Số phòng khám</th>
                                    <th>Trạng thái</th>
                                    <th>Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {specialties.map((item) => (
                                    <tr key={item.id}>
                                        <td>
                                            <strong>{item.name}</strong>
                                        </td>
                                        <td>{item.doctors}</td>
                                        <td>{item.clinics}</td>
                                        <td>
                                            <span
                                                className={`status ${
                                                    item.status === "active"
                                                        ? "confirmed"
                                                        : "cancelled"
                                                }`}
                                            >
                                                {item.status === "active"
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

export default Specialties;
