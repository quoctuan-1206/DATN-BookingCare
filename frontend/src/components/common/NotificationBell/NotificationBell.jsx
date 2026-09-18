import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Bell, CheckCheck } from "lucide-react";
import toast from "react-hot-toast";
import notificationService, {
  formatNotificationTime,
} from "../../../services/notification.service";
import { getApiErrorMessage } from "../../../api/axios";
import "./NotificationBell.css";

function NotificationBell({
  viewAllTo = "/notifications",
  buttonClassName = "notification-bell-btn",
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const rootRef = useRef(null);

  useEffect(() => {
    let alive = true;
    notificationService
      .getUnreadCount()
      .then((count) => {
        if (alive) setUnreadCount(count);
      })
      .catch(() => {
        if (alive) setUnreadCount(0);
      });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!open) return undefined;

    const onPointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  const loadItems = async () => {
    setLoading(true);
    try {
      const result = await notificationService.getNotifications({
        page: 1,
        limit: 8,
      });
      setItems(result.data);
      setUnreadCount(result.unread_count);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không tải được thông báo"));
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleOpen = async () => {
    const next = !open;
    setOpen(next);
    if (next) await loadItems();
  };

  const markRead = async (id) => {
    const target = items.find((item) => item.id === id);
    if (!target || target.is_read) return;

    try {
      await notificationService.markRead(id);
      setItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, is_read: true } : item,
        ),
      );
      setUnreadCount((count) => Math.max(0, count - 1));
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không cập nhật được"));
    }
  };

  const markAllRead = async () => {
    if (unreadCount === 0) return;
    try {
      await notificationService.markAllRead();
      setItems((prev) => prev.map((item) => ({ ...item, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không cập nhật được"));
    }
  };

  return (
    <div className="notification-bell" ref={rootRef}>
      <button
        type="button"
        className={buttonClassName}
        aria-label="Thông báo"
        aria-expanded={open}
        onClick={toggleOpen}
      >
        <Bell size={16} />
        {unreadCount > 0 && (
          <span>{unreadCount > 99 ? "99+" : unreadCount}</span>
        )}
      </button>

      {open && (
        <div className="notification-popover">
          <div className="notification-popover-header">
            <div>
              <strong>Thông báo</strong>
              {unreadCount > 0 && (
                <small>{unreadCount} chưa đọc</small>
              )}
            </div>
            <button
              type="button"
              className="notification-popover-mark-all"
              onClick={markAllRead}
              disabled={unreadCount === 0}
            >
              <CheckCheck size={14} />
              Đọc tất cả
            </button>
          </div>

          <div className="notification-popover-list">
            {loading ? (
              <p className="notification-popover-empty">Đang tải...</p>
            ) : items.length === 0 ? (
              <p className="notification-popover-empty">Chưa có thông báo</p>
            ) : (
              items.map((item) => {
                const target = item.link || viewAllTo;
                return (
                  <Link
                    key={item.id}
                    to={target}
                    className={`notification-popover-item${
                      item.is_read ? "" : " unread"
                    }`}
                    onClick={() => {
                      markRead(item.id);
                      setOpen(false);
                    }}
                  >
                    <div className="notification-popover-item-icon">
                      <Bell size={14} />
                    </div>
                    <div className="notification-popover-item-body">
                      <strong>{item.title}</strong>
                      <p>{item.content}</p>
                      <small>{formatNotificationTime(item.created_at)}</small>
                    </div>
                  </Link>
                );
              })
            )}
          </div>

          <Link
            to={viewAllTo}
            className="notification-popover-footer"
            onClick={() => setOpen(false)}
          >
            Xem tất cả
          </Link>
        </div>
      )}
    </div>
  );
}

export default NotificationBell;
