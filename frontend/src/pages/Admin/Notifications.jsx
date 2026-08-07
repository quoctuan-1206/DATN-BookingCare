import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import AdminLayout from "../../components/admin/layout/AdminLayout";
import NotificationCard from "../../components/patient/NotificationCard";
import notificationService from "../../services/notification.service";
import { getApiErrorMessage } from "../../api/axios";

function AdminNotifications() {
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
    <AdminLayout title="Thông báo">
      <div className="admin-page">
        <div className="admin-page-header">
          <div>
            <h3>Thông báo</h3>
            <p>
              Cập nhật lịch hẹn và sự kiện hệ thống
              {unreadCount > 0 ? ` · ${unreadCount} chưa đọc` : ""}.
            </p>
          </div>
          <div className="admin-page-actions">
            <button
              type="button"
              className="admin-btn admin-btn-secondary"
              onClick={() => setShowUnread((v) => !v)}
            >
              {showUnread ? "Hiển thị tất cả" : "Chỉ chưa đọc"}
            </button>
            {unreadCount > 0 && (
              <button
                type="button"
                className="admin-btn admin-btn-secondary"
                onClick={markAllRead}
              >
                Đánh dấu tất cả đã đọc
              </button>
            )}
          </div>
        </div>

        <div className="dashboard-card">
          <div className="notification-list">
            {loading ? (
              <p>Đang tải...</p>
            ) : items.length > 0 ? (
              items.map((notification) => (
                <NotificationCard
                  key={notification.id}
                  notification={notification}
                  onOpen={markRead}
                  fallbackLink="/admin/notifications"
                />
              ))
            ) : (
              <p>Không có thông báo.</p>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

export default AdminNotifications;
