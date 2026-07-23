import { Link } from "react-router-dom";
import PatientLayout from "../../components/patient/PatientLayout";
import PatientHeader from "../../components/patient/PatientHeader";
import DashboardCard from "../../components/patient/DashboardCard";
import AppointmentCard from "../../components/patient/AppointmentCard";
import NotificationCard from "../../components/patient/NotificationCard";
import {
    db,
    getUpcomingAppointments,
} from "../../data/patientMock";

function Dashboard() {
    const upcoming = getUpcomingAppointments();
    const todayLike = upcoming.slice(0, 2);
    const later = upcoming.slice(2);
    const notifications = db.notifications.slice(0, 3);

    return (
        <PatientLayout>
            <PatientHeader />
            <DashboardCard />

            <div className="patient-block">
                <div className="page-header page-header--compact">
                    <div>
                        <h2>Lịch hẹn sắp tới</h2>
                        <p>Các lịch đang chờ hoặc đã xác nhận.</p>
                    </div>
                    <Link to="/patient/appointments" className="text-link">
                        Xem tất cả
                    </Link>
                </div>

                <div className="appointment-list">
                    {upcoming.length === 0 ? (
                        <div className="empty-state">
                            <h3>Chưa có lịch hẹn sắp tới</h3>
                            <p>
                                <Link to="/doctors">Đặt lịch khám mới</Link>
                            </p>
                        </div>
                    ) : (
                        <>
                            {todayLike.map((item) => (
                                <AppointmentCard
                                    key={item.id}
                                    appointment={item}
                                />
                            ))}
                            {later.map((item) => (
                                <AppointmentCard
                                    key={item.id}
                                    appointment={item}
                                />
                            ))}
                        </>
                    )}
                </div>
            </div>

            <div className="patient-block">
                <div className="page-header page-header--compact">
                    <div>
                        <h2>Thông báo gần đây</h2>
                    </div>
                    <Link to="/patient/notifications" className="text-link">
                        Xem tất cả
                    </Link>
                </div>

                <div className="notification-list">
                    {notifications.map((item) => (
                        <NotificationCard
                            key={item.id}
                            notification={item}
                        />
                    ))}
                </div>
            </div>
        </PatientLayout>
    );
}

export default Dashboard;
