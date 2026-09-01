import { useCallback, useEffect, useState } from "react";
import { Bell } from "lucide-react";
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
      <div className="patient-content-card">
        <div className="patient-content-card-head">
          <h1 className="patient-content-card-title">
            Thông báo
            {unreadCount > 0 ? ` (${unreadCount} chưa đọc)` : ""}
          </h1>
        </div>

        <div className="patient-content-card-toolbar patient-content-card-toolbar--split">
          <button
            type="button"
            className={
              showUnread
                ? "patient-profile-save-btn"
                : "patient-profile-secondary-btn"
            }
            style={{ marginTop: 0 }}
            onClick={() => setShowUnread((v) => !v)}
          >
            {showUnread ? "Hiển thị tất cả" : "Chỉ thông báo chưa đọc"}
          </button>
          {unreadCount > 0 && (
            <button
              type="button"
              className="patient-profile-secondary-btn"
              style={{ marginTop: 0 }}
              onClick={markAllRead}
            >
              Đánh dấu tất cả đã đọc
            </button>
          )}
        </div>

        <div className="patient-content-card-body">
          {loading ? (
            <p className="patient-page-loading">Đang tải...</p>
          ) : items.length > 0 ? (
            <div className="dashboard-notification-list">
              {items.map((notification) => (
                <NotificationCard
                  key={notification.id}
                  notification={notification}
                  onOpen={markRead}
                  fallbackLink="/patient/notifications"
                />
              ))}
            </div>
          ) : (
            <div className="patient-panel-empty">
              <Bell size={48} strokeWidth={1.75} />
              <p>
                {showUnread
                  ? "Không còn thông báo chưa đọc."
                  : "Không có thông báo. Bạn đã đọc tất cả thông báo."}
              </p>
            </div>
          )}
        </div>
      </div>
    </PatientLayout>
  );
}

export default Notifications;
