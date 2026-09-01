import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Bell,
  CalendarDays,
  ChevronRight,
  Mail,
  Phone,
  UserRound,
} from "lucide-react";
import toast from "react-hot-toast";
import PatientLayout from "../../components/patient/PatientLayout";
import DashboardCard from "../../components/patient/DashboardCard";
import DashboardAppointmentItem from "../../components/patient/DashboardAppointmentItem";
import NotificationCard from "../../components/patient/NotificationCard";
import appointmentService from "../../services/appointment.service";
import notificationService from "../../services/notification.service";
import { getApiErrorMessage } from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import { resolveMediaUrl } from "../../utils/media";

const DEFAULT_AVATAR =
  "https://ui-avatars.com/api/?background=2E8B57&color=fff&size=128";

function sortUpcoming(appointments) {
  return [...appointments]
    .filter((a) => a.status === "PENDING" || a.status === "CONFIRMED")
    .sort((a, b) => {
      const left = `${a.work_date || ""}T${a.start_time || "00:00"}`;
      const right = `${b.work_date || ""}T${b.start_time || "00:00"}`;
      return left.localeCompare(right);
    });
}

function Dashboard() {
  const { user } = useAuth();
  const [upcoming, setUpcoming] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    completed: 0,
    unread: 0,
  });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [apptResult, notifResult, unread] = await Promise.all([
        appointmentService.getAppointments({ page: 1, limit: 100 }),
        notificationService.getNotifications({ page: 1, limit: 4 }),
        notificationService.getUnreadCount(),
      ]);

      const list = Array.isArray(apptResult.data) ? apptResult.data : [];
      const sortedUpcoming = sortUpcoming(list);

      setUpcoming(sortedUpcoming.slice(0, 4));
      setNotifications(notifResult.data.slice(0, 4));
      setStats({
        total: list.length,
        pending: list.filter((a) => a.status === "PENDING").length,
        completed: list.filter((a) => a.status === "COMPLETED").length,
        unread,
      });
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không tải được dashboard"));
      setUpcoming([]);
      setNotifications([]);
      setStats({ total: 0, pending: 0, completed: 0, unread: 0 });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const fullName = useMemo(() => {
    if (!user) return "Bệnh nhân";
    return [user.last_name, user.first_name].filter(Boolean).join(" ").trim();
  }, [user]);

  const nextAppointmentLabel = useMemo(() => {
    const next = upcoming[0];
    if (!next) return "Chưa có lịch";
    return [next.date_display, next.time].filter(Boolean).join(" · ");
  }, [upcoming]);

  const avatarSrc = useMemo(() => {
    const name = fullName || "Bệnh nhân";
    return (
      resolveMediaUrl(user?.avatar) ||
      `${DEFAULT_AVATAR}&name=${encodeURIComponent(name)}`
    );
  }, [fullName, user?.avatar]);

  return (
    <PatientLayout>
      <div className="patient-dashboard-wrap">
        <div className="patient-content-card-head">
          <h1 className="patient-content-card-title">Tổng quan</h1>
        </div>

        <Link
          to="/patient/profile"
          className="patient-ac-card patient-ac-profile-row"
        >
          <img src={avatarSrc} alt={fullName} />
          <div>
            <strong>{fullName || "Bệnh nhân"}</strong>
            <span>{nextAppointmentLabel}</span>
          </div>
          <ChevronRight size={20} className="patient-ac-row-chevron" />
        </Link>

        <DashboardCard stats={stats} />

        <div className="patient-dashboard-split">
          <section className="patient-dashboard-panel">
            <div className="patient-dashboard-panel-head">
              <div>
                <h2>Lịch hẹn sắp tới</h2>
              </div>
              <Link to="/patient/appointments" className="text-link">
                Xem tất cả
              </Link>
            </div>

            <div className="patient-dashboard-panel-body">
              {loading ? (
                <p className="patient-dashboard-loading">Đang tải...</p>
              ) : upcoming.length === 0 ? (
                <div className="patient-panel-empty">
                  <CalendarDays size={48} strokeWidth={1.75} />
                  <p>Chưa có lịch hẹn sắp tới</p>
                  <Link to="/doctors" className="patient-profile-save-btn">
                    Đặt lịch khám
                  </Link>
                </div>
              ) : (
                <div className="dashboard-appointment-list">
                  {upcoming.map((item) => (
                    <DashboardAppointmentItem
                      key={item.id}
                      appointment={item}
                    />
                  ))}
                </div>
              )}
            </div>
          </section>

          <section className="patient-dashboard-panel">
            <div className="patient-dashboard-panel-head">
              <div>
                <h2>Thông báo gần đây</h2>
              </div>
              <Link to="/patient/notifications" className="text-link">
                Xem tất cả
              </Link>
            </div>

            <div className="patient-dashboard-panel-body">
              {loading ? (
                <p className="patient-dashboard-loading">Đang tải...</p>
              ) : notifications.length === 0 ? (
                <div className="patient-panel-empty">
                  <Bell size={48} strokeWidth={1.75} />
                  <p>Chưa có thông báo</p>
                  <Link
                    to="/patient/notifications"
                    className="patient-profile-secondary-btn"
                  >
                    Mở thông báo
                  </Link>
                </div>
              ) : (
                <div className="dashboard-notification-list">
                  {notifications.map((item) => (
                    <NotificationCard key={item.id} notification={item} />
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>

        {user && (
          <section className="patient-account-compact">
            <div className="patient-account-compact-head">
              <h2>Thông tin tài khoản</h2>
              <Link to="/patient/profile" className="text-link">
                Chỉnh sửa
              </Link>
            </div>
            <div className="patient-account-compact-grid">
              <div className="patient-account-compact-item">
                <UserRound size={16} />
                <span>{fullName || "—"}</span>
              </div>
              <div className="patient-account-compact-item">
                <Mail size={16} />
                <span>{user.email || "—"}</span>
              </div>
              <div className="patient-account-compact-item">
                <Phone size={16} />
                <span>{user.phone || "Chưa cập nhật"}</span>
              </div>
              <Link
                to="/patient/profiles"
                className="patient-account-compact-link"
              >
                Quản lý hồ sơ bệnh nhân →
              </Link>
            </div>
          </section>
        )}
      </div>
    </PatientLayout>
  );
}

export default Dashboard;
