import AdminLayout from "../../components/admin/layout/AdminLayout";

const payments = [
    {
        id: "PAY001",
        patient: "Nguyễn Văn A",
        appointment: "BK0001",
        amount: "350.000đ",
        method: "VNPay",
        date: "18/08/2026",
        status: "success",
    },
    {
        id: "PAY002",
        patient: "Trần Thị B",
        appointment: "BK0002",
        amount: "280.000đ",
        method: "MoMo",
        date: "17/08/2026",
        status: "pending",
    },
    {
        id: "PAY003",
        patient: "Phạm Văn C",
        appointment: "BK0003",
        amount: "420.000đ",
        method: "Tiền mặt",
        date: "15/08/2026",
        status: "failed",
    },
];

const statusMap = {
    success: { className: "confirmed", label: "Thành công" },
    pending: { className: "pending", label: "Đang xử lý" },
    failed: { className: "cancelled", label: "Thất bại" },
};

function Payments() {
    return (
        <AdminLayout title="Thanh toán">
            <div className="admin-page">
                <div className="admin-page-header">
                    <div>
                        <h3>Quản lý thanh toán</h3>
                        <p>Theo dõi giao dịch thanh toán trên hệ thống</p>
                    </div>
                </div>

                <div className="dashboard-card">
                    <div className="table-wrapper">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Mã GD</th>
                                    <th>Bệnh nhân</th>
                                    <th>Lịch hẹn</th>
                                    <th>Số tiền</th>
                                    <th>Phương thức</th>
                                    <th>Ngày</th>
                                    <th>Trạng thái</th>
                                </tr>
                            </thead>
                            <tbody>
                                {payments.map((payment) => (
                                    <tr key={payment.id}>
                                        <td>
                                            <strong>{payment.id}</strong>
                                        </td>
                                        <td>{payment.patient}</td>
                                        <td>{payment.appointment}</td>
                                        <td>{payment.amount}</td>
                                        <td>{payment.method}</td>
                                        <td>{payment.date}</td>
                                        <td>
                                            <span
                                                className={`status ${
                                                    statusMap[payment.status]
                                                        .className
                                                }`}
                                            >
                                                {statusMap[payment.status].label}
                                            </span>
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

export default Payments;
