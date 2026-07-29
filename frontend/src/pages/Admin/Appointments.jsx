import AdminLayout from "../../components/admin/layout/AdminLayout";

const appointments = [
    {
        id: "BK0001",
        patient: "Nguyễn Văn A",
        doctor: "TS. Nguyễn Minh",
        date: "20/08/2026",
        time: "08:00",
        status: "pending",
    },
    {
        id: "BK0002",
        patient: "Trần Thị B",
        doctor: "BS. Lê Hoàng",
        date: "20/08/2026",
        time: "09:30",
        status: "confirmed",
    },
    {
        id: "BK0003",
        patient: "Phạm Văn C",
        doctor: "BS. Trần Quốc",
        date: "20/08/2026",
        time: "10:00",
        status: "completed",
    },
    {
        id: "BK0004",
        patient: "Đỗ Thị D",
        doctor: "TS. Nguyễn Minh",
        date: "20/08/2026",
        time: "11:00",
        status: "cancelled",
    },
];

const statusLabel = {
    pending: "Chờ xác nhận",
    confirmed: "Đã xác nhận",
    completed: "Hoàn thành",
    cancelled: "Đã hủy",
};

function Appointments() {
    return (
        <AdminLayout title="Lịch hẹn">
            <div className="admin-page">
                <div className="admin-page-header">
                    <div>
                        <h3>Quản lý lịch hẹn</h3>
                        <p>Theo dõi và xử lý lịch hẹn trên hệ thống</p>
                    </div>
                </div>

                <div className="dashboard-card">
                    <div className="admin-toolbar">
                        <input
                            className="admin-input"
                            type="text"
                            placeholder="Tìm lịch hẹn..."
                        />
                        <select className="admin-select" style={{ maxWidth: 200 }}>
                            <option value="">Tất cả trạng thái</option>
                            <option value="pending">Chờ xác nhận</option>
                            <option value="confirmed">Đã xác nhận</option>
                            <option value="completed">Hoàn thành</option>
                            <option value="cancelled">Đã hủy</option>
                        </select>
                    </div>

                    <div className="table-wrapper">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Mã</th>
                                    <th>Bệnh nhân</th>
                                    <th>Bác sĩ</th>
                                    <th>Ngày</th>
                                    <th>Giờ</th>
                                    <th>Trạng thái</th>
                                    <th>Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {appointments.map((item) => (
                                    <tr key={item.id}>
                                        <td>
                                            <strong>{item.id}</strong>
                                        </td>
                                        <td>{item.patient}</td>
                                        <td>{item.doctor}</td>
                                        <td>{item.date}</td>
                                        <td>{item.time}</td>
                                        <td>
                                            <span className={`status ${item.status}`}>
                                                {statusLabel[item.status]}
                                            </span>
                                        </td>
                                        <td>
                                            <button
                                                type="button"
                                                className="admin-btn admin-btn-secondary"
                                            >
                                                Chi tiết
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

export default Appointments;
