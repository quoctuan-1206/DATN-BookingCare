import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import DoctorLayout from "../../components/doctor-dashboard/layout/DoctorLayout";
import NotificationCard from "../../components/patient/NotificationCard";
import notificationService from "../../services/notification.service";
import { getApiErrorMessage } from "../../api/axios";

function DoctorNotifications() {
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
    <DoctorLayout title="Thông báo">
      <div className="doctor-page">
        <div className="doctor-card">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
              marginBottom: 16,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <div>
              <h3 style={{ margin: 0 }}>Thông báo</h3>
              <p style={{ margin: "6px 0 0", color: "#6b7280", fontSize: 14 }}>
                Lịch hẹn mới và cập nhật từ hệ thống
                {unreadCount > 0 ? ` · ${unreadCount} chưa đọc` : ""}.
              </p>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
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

          <div className="notification-list">
            {loading ? (
              <p>Đang tải...</p>
            ) : items.length > 0 ? (
              items.map((notification) => (
                <NotificationCard
                  key={notification.id}
                  notification={notification}
                  onOpen={markRead}
                  fallbackLink="/doctor/notifications"
                />
              ))
            ) : (
              <p>Không có thông báo.</p>
            )}
          </div>
        </div>
      </div>
    </DoctorLayout>
  );
}

export default DoctorNotifications;
