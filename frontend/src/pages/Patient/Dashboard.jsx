import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import PatientLayout from "../../components/patient/PatientLayout";
import PatientHeader from "../../components/patient/PatientHeader";
import DashboardCard from "../../components/patient/DashboardCard";
import AppointmentCard from "../../components/patient/AppointmentCard";
import NotificationCard from "../../components/patient/NotificationCard";
import appointmentService from "../../services/appointment.service";
import notificationService from "../../services/notification.service";
import { getApiErrorMessage } from "../../api/axios";

function Dashboard() {
  const [upcoming, setUpcoming] = useState([]);
  const [notifications, setNotifications] = useState([]);

  const load = useCallback(async () => {
    try {
      const [apptResult, notifResult] = await Promise.all([
        appointmentService.getAppointments({ page: 1, limit: 20 }),
        notificationService.getNotifications({ page: 1, limit: 3 }),
      ]);

      const list = Array.isArray(apptResult.data) ? apptResult.data : [];
      const upcomingList = list.filter(
        (a) => a.status === "PENDING" || a.status === "CONFIRMED",
      );
      setUpcoming(upcomingList.slice(0, 4));
      setNotifications(notifResult.data.slice(0, 3));
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không tải được dashboard"));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

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
            upcoming.map((item) => (
              <AppointmentCard key={item.id} appointment={item} />
            ))
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
          {notifications.length === 0 ? (
            <div className="empty-state">
              <h3>Chưa có thông báo</h3>
            </div>
          ) : (
            notifications.map((item) => (
              <NotificationCard key={item.id} notification={item} />
            ))
          )}
        </div>
      </div>
    </PatientLayout>
  );
}

export default Dashboard;
