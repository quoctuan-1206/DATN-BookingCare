import { Bell, Calendar, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { formatDateTime } from "../../data/patientMock";

function NotificationCard({ notification, onOpen }) {
    if (!notification) return null;

    const target = notification.appointment_id
        ? `/patient/appointments/${notification.appointment_id}`
        : "/patient/notifications";

    return (
        <div
            className={`notification-card${
                notification.is_read ? "" : " unread"
            }`}
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
                        {formatDateTime(notification.created_at)}
                    </span>

                    <Link
                        to={target}
                        className="notification-detail-btn"
                        onClick={() => onOpen?.(notification.id)}
                    >
                        Xem
                        <ChevronRight size={14} />
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default NotificationCard;
