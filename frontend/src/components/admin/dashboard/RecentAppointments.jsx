import { Link } from "react-router-dom";

function RecentAppointments() {

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

    function renderStatus(status) {

        switch (status) {

            case "pending":
                return (
                    <span className="status pending">
                        Chờ xác nhận
                    </span>
                );

            case "confirmed":
                return (
                    <span className="status confirmed">
                        Đã xác nhận
                    </span>
                );

            case "completed":
                return (
                    <span className="status completed">
                        Hoàn thành
                    </span>
                );

            case "cancelled":
                return (
                    <span className="status cancelled">
                        Đã hủy
                    </span>
                );

            default:
                return null;

        }

    }

    return (

        <div className="dashboard-card">

            <div className="dashboard-card-header">

                <h3>

                    Lịch hẹn gần đây

                </h3>

                <Link
                    to="/admin/appointments"
                    className="view-all"
                >

                    Xem tất cả

                </Link>

            </div>

            <table className="admin-table">

                <thead>

                    <tr>

                        <th>Mã</th>

                        <th>Bệnh nhân</th>

                        <th>Bác sĩ</th>

                        <th>Ngày</th>

                        <th>Giờ</th>

                        <th>Trạng thái</th>

                    </tr>

                </thead>

                <tbody>

                    {

                        appointments.map((item) => (

                            <tr key={item.id}>

                                <td>

                                    {item.id}

                                </td>

                                <td>

                                    {item.patient}

                                </td>

                                <td>

                                    {item.doctor}

                                </td>

                                <td>

                                    {item.date}

                                </td>

                                <td>

                                    {item.time}

                                </td>

                                <td>

                                    {renderStatus(item.status)}

                                </td>

                            </tr>

                        ))

                    }

                </tbody>

            </table>

        </div>

    );

}

export default RecentAppointments;