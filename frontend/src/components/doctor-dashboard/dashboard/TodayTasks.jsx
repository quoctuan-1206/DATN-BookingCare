import { Link } from "react-router-dom";
import {
  Check,
  ChevronRight,
  ClipboardPlus,
  MessageSquare,
  Pill,
  Users,
} from "lucide-react";

function TaskRow({ item }) {
  const isDone = item.count === 0;

  return (
    <Link
      to={item.to}
      className={`doctor-todo-item ${isDone ? "done" : ""}`}
    >
      <span className="doctor-todo-icon" style={{ background: item.tint }}>
        {item.icon}
      </span>

      <div>
        <strong>{item.label}</strong>
        <span>{item.hint}</span>
      </div>

      {isDone ? (
        <span className="doctor-todo-done-icon" aria-label="Đã hoàn thành">
          <Check size={14} strokeWidth={3} />
        </span>
      ) : (
        <>
          <em className="doctor-todo-count">{item.count}</em>
          <ChevronRight size={16} className="doctor-todo-arrow" />
        </>
      )}
    </Link>
  );
}

function TodayTasks({
  waitingCount = 0,
  recordCount = 0,
  prescriptionCount = 0,
  reviewCount = 0,
}) {
  const items = [
    {
      id: "waiting",
      label: "Bệnh nhân đang chờ khám",
      hint:
        waitingCount > 0
          ? `${waitingCount} bệnh nhân cần xử lý`
          : "Không có việc cần xử lý/Đã hoàn thành",
      count: waitingCount,
      to: "/doctor/appointments",
      tint: "rgba(13, 148, 136, 0.12)",
      icon: <Users size={16} />,
    },
    {
      id: "records",
      label: "Hoàn thành hồ sơ bệnh án",
      hint:
        recordCount > 0
          ? `${recordCount} hồ sơ cần hoàn thành`
          : "Không có việc cần xử lý/Đã hoàn thành",
      count: recordCount,
      to: "/doctor/medical-records",
      tint: "rgba(37, 99, 235, 0.12)",
      icon: <ClipboardPlus size={16} />,
    },
    {
      id: "prescriptions",
      label: "Ký đơn thuốc",
      hint:
        prescriptionCount > 0
          ? `${prescriptionCount} đơn thuốc cần ký`
          : "Không có việc cần xử lý/Đã hoàn thành",
      count: prescriptionCount,
      to: "/doctor/prescriptions",
      tint: "rgba(245, 158, 11, 0.14)",
      icon: <Pill size={16} />,
    },
    {
      id: "reviews",
      label: "Phản hồi từ bệnh nhân",
      hint:
        reviewCount > 0
          ? `${reviewCount} phản hồi cần xem`
          : "Không có việc cần xử lý/Đã hoàn thành",
      count: reviewCount,
      to: "/doctor/reviews",
      tint: "rgba(239, 68, 68, 0.12)",
      icon: <MessageSquare size={16} />,
    },
  ];

  return (
    <div className="doctor-card doctor-today-tasks">
      <div className="doctor-card-header">
        <div>
          <h3>Việc cần làm hôm nay</h3>
          <p>Theo dõi công việc trong ngày</p>
        </div>
      </div>

      <div className="doctor-todo-list">
        {items.map((item) => (
          <TaskRow key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}

export default TodayTasks;
