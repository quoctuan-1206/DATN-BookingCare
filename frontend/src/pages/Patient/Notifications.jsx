import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import PatientLayout from "../../components/patient/PatientLayout";
import NotificationCard from "../../components/patient/NotificationCard";
import notificationService from "../../services/notification.service";
import { getApiErrorMessage } from "../../api/axios";

function Notifications() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUnread, setShowUnread] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const result = await notificationService.getNotifications({
        unread_only: showUnread ? "true" : "false",
        page: 1,
        limit: 50,
      });
      setItems(result.data);
      setUnreadCount(result.unread_count);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không tải được thông báo"));
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [showUnread]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markRead = async (id) => {
    try {
      await notificationService.markRead(id);
      setItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, is_read: true } : item,
        ),
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không cập nhật được"));
    }
  };

  const markAllRead = async () => {
    try {
      await notificationService.markAllRead();
      setItems((prev) => prev.map((item) => ({ ...item, is_read: true })));
      setUnreadCount(0);
      toast.success("Đã đánh dấu tất cả đã đọc");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không cập nhật được"));
    }
  };

  return (
    <PatientLayout>
      <div className="page-header">
        <div>
          <h1>Thông báo</h1>
          <p>
            Theo dõi cập nhật lịch hẹn và bệnh án
            {unreadCount > 0 ? ` · ${unreadCount} chưa đọc` : ""}.
          </p>
        </div>
      </div>

      <div className="notification-toolbar">
        <button
          type="button"
          className={showUnread ? "btn btn-primary" : "btn btn-outline"}
          onClick={() => setShowUnread((v) => !v)}
        >
          {showUnread ? "Hiển thị tất cả" : "Chỉ thông báo chưa đọc"}
        </button>
        {unreadCount > 0 && (
          <button
            type="button"
            className="btn btn-outline"
            onClick={markAllRead}
          >
            Đánh dấu tất cả đã đọc
          </button>
        )}
      </div>

      <div className="notification-list">
        {loading ? (
          <div className="empty-state">
            <h3>Đang tải...</h3>
          </div>
        ) : items.length > 0 ? (
          items.map((notification) => (
            <NotificationCard
              key={notification.id}
              notification={notification}
              onOpen={markRead}
              fallbackLink="/patient/notifications"
            />
          ))
        ) : (
          <div className="empty-state">
            <h3>Không có thông báo.</h3>
          </div>
        )}
      </div>
    </PatientLayout>
  );
}

export default Notifications;
