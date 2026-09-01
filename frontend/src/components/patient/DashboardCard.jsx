import { Bell, CalendarCheck, CheckCircle2, Clock } from "lucide-react";
import { Link } from "react-router-dom";

function DashboardCard({ stats }) {
  const items = [
    {
      id: 1,
      title: "Tổng lịch hẹn",
      value: stats.total,
      icon: CalendarCheck,
      color: "#2E8B57",
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
    <div className="patient-ac-card">
      <h2 className="patient-ac-card-title">Hoạt động</h2>
      <div className="patient-ac-list dashboard-card-grid">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.id} to={item.to} className="dashboard-card">
              <div
                className="dashboard-card-icon"
                style={{ background: item.color }}
              >
                <Icon size={18} />
              </div>
              <div className="dashboard-card-content">
                <p>{item.title}</p>
                <h3>{item.value}</h3>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default DashboardCard;
