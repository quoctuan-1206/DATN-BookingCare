import { useEffect, useState } from "react";
import { Bell, CalendarCheck, CheckCircle2, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import appointmentService from "../../services/appointment.service";
import notificationService from "../../services/notification.service";

function DashboardCard() {
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    completed: 0,
    unread: 0,
  });

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const [apptResult, unread] = await Promise.all([
          appointmentService.getAppointments({ page: 1, limit: 100 }),
          notificationService.getUnreadCount(),
        ]);

        const list = Array.isArray(apptResult.data) ? apptResult.data : [];
        if (!alive) return;

        setStats({
          total: list.length,
          pending: list.filter((a) => a.status === "PENDING").length,
          completed: list.filter((a) => a.status === "COMPLETED").length,
          unread,
        });
      } catch {
        if (alive) {
          setStats({ total: 0, pending: 0, completed: 0, unread: 0 });
        }
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  const items = [
    {
      id: 1,
      title: "Tổng lịch hẹn",
      value: stats.total,
      icon: CalendarCheck,
      color: "#49BCE2",
      to: "/patient/appointments",
    },
    {
      id: 2,
      title: "Đang chờ",
      value: stats.pending,
      icon: Clock,
      color: "#F39C12",
      to: "/patient/appointments",
    },
    {
      id: 3,
      title: "Đã hoàn thành",
      value: stats.completed,
      icon: CheckCircle2,
      color: "#2ECC71",
      to: "/patient/appointments",
    },
    {
      id: 4,
      title: "Thông báo chưa đọc",
      value: stats.unread,
      icon: Bell,
      color: "#9B59B6",
      to: "/patient/notifications",
    },
  ];

  return (
    <div className="dashboard-card-grid">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <Link key={item.id} to={item.to} className="dashboard-card">
            <div
              className="dashboard-card-icon"
              style={{ background: item.color }}
            >
              <Icon size={20} />
            </div>
            <div className="dashboard-card-content">
              <h3>{item.value}</h3>
              <p>{item.title}</p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

export default DashboardCard;
