import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import AdminLayout from "../../components/admin/layout/AdminLayout";

const doctors = [
    {
        id: 1,
        name: "TS. Nguyễn Minh",
        email: "bs.nguyenminh@email.com",
        specialty: "Tim mạch",
        clinic: "Phòng khám Đa khoa A",
        status: "active",
        avatar: "https://i.pravatar.cc/100?img=11",
    },
    {
        id: 2,
        name: "BS. Lê Hoàng",
        email: "bs.lehoang@email.com",
        specialty: "Nhi khoa",
        clinic: "Phòng khám Nhi B",
        status: "active",
        avatar: "https://i.pravatar.cc/100?img=12",
    },
    {
        id: 3,
        name: "BS. Trần Quốc",
        email: "bs.tranquoc@email.com",
        specialty: "Da liễu",
        clinic: "Phòng khám Da liễu C",
        status: "inactive",
        avatar: "https://i.pravatar.cc/100?img=13",
    },
];

function Doctors() {
    return (
        <AdminLayout title="Bác sĩ">
            <div className="admin-page">
                <div className="admin-page-header">
                    <div>
                        <h3>Quản lý bác sĩ</h3>
                        <p>Danh sách bác sĩ trên hệ thống</p>
                    </div>
                    <div className="admin-page-actions">
                        <Link
                            to="/admin/doctors/create"
                            className="admin-btn admin-btn-primary"
                        >
                            <Plus size={16} />
                            Thêm bác sĩ
                        </Link>
                    </div>
                </div>

                <div className="dashboard-card">
                    <div className="admin-toolbar">
                        <input
                            className="admin-input"
                            type="text"
                            placeholder="Tìm bác sĩ..."
                        />
                    </div>

                    <div className="table-wrapper">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Bác sĩ</th>
                                    <th>Chuyên khoa</th>
                                    <th>Phòng khám</th>
                                    <th>Trạng thái</th>
                                    <th>Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {doctors.map((doctor) => (
                                    <tr key={doctor.id}>
                                        <td>
                                            <div className="table-user">
                                                <img
                                                    className="table-avatar"
                                                    src={doctor.avatar}
                                                    alt={doctor.name}
                                                />
                                                <div className="table-user-info">
                                                    <strong>{doctor.name}</strong>
                                                    <span>{doctor.email}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td>{doctor.specialty}</td>
                                        <td>{doctor.clinic}</td>
                                        <td>
                                            <span
                                                className={`status ${
                                                    doctor.status === "active"
                                                        ? "confirmed"
                                                        : "cancelled"
                                                }`}
                                            >
                                                {doctor.status === "active"
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

export default Doctors;
