import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import AdminLayout from "../../components/admin/layout/AdminLayout";

const clinics = [
    {
        id: 1,
        name: "Phòng khám Đa khoa A",
        address: "Quận 1, TP.HCM",
        phone: "0281234567",
        doctors: 12,
        status: "active",
    },
    {
        id: 2,
        name: "Phòng khám Nhi B",
        address: "Quận 3, TP.HCM",
        phone: "0287654321",
        doctors: 8,
        status: "active",
    },
    {
        id: 3,
        name: "Phòng khám Da liễu C",
        address: "Hà Nội",
        phone: "0241112222",
        doctors: 5,
        status: "inactive",
    },
];

function Clinics() {
    return (
        <AdminLayout title="Phòng khám">
            <div className="admin-page">
                <div className="admin-page-header">
                    <div>
                        <h3>Quản lý phòng khám</h3>
                        <p>Danh sách phòng khám trên hệ thống</p>
                    </div>
                    <div className="admin-page-actions">
                        <Link
                            to="/admin/clinics/create"
                            className="admin-btn admin-btn-primary"
                        >
                            <Plus size={16} />
                            Thêm phòng khám
                        </Link>
                    </div>
                </div>

                <div className="dashboard-card">
                    <div className="admin-toolbar">
                        <input
                            className="admin-input"
                            type="text"
                            placeholder="Tìm phòng khám..."
                        />
                    </div>

                    <div className="table-wrapper">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Tên phòng khám</th>
                                    <th>Địa chỉ</th>
                                    <th>Điện thoại</th>
                                    <th>Số bác sĩ</th>
                                    <th>Trạng thái</th>
                                    <th>Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {clinics.map((clinic) => (
                                    <tr key={clinic.id}>
                                        <td>
                                            <strong>{clinic.name}</strong>
                                        </td>
                                        <td>{clinic.address}</td>
                                        <td>{clinic.phone}</td>
                                        <td>{clinic.doctors}</td>
                                        <td>
                                            <span
                                                className={`status ${
                                                    clinic.status === "active"
                                                        ? "confirmed"
                                                        : "cancelled"
                                                }`}
                                            >
                                                {clinic.status === "active"
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

export default Clinics;
