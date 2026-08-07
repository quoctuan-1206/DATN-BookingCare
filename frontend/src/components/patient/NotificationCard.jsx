import { Bell, Calendar, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { formatNotificationTime } from "../../services/notification.service";

function NotificationCard({ notification, onOpen, fallbackLink = "#" }) {
  if (!notification) return null;

  const target = notification.link || fallbackLink;

  return (
    <div
      className={`notification-card${notification.is_read ? "" : " unread"}`}
    >
      <div className="notification-icon">
        <Bell size={18} />
      </div>

      <div className="notification-content">
        <h3>{notification.title}</h3>
        <p>{notification.content}</p>

        <div className="notification-footer">
          <span>
            <Calendar size={13} />
            {formatNotificationTime(notification.created_at)}
          </span>

          {target && target !== "#" ? (
            <Link
              to={target}
              className="notification-detail-btn"
              onClick={() => onOpen?.(notification.id)}
            >
              Xem
              <ChevronRight size={14} />
            </Link>
          ) : (
            <button
              type="button"
              className="notification-detail-btn"
              onClick={() => onOpen?.(notification.id)}
            >
              Đánh dấu đã đọc
              <ChevronRight size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default NotificationCard;
