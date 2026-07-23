import { useState } from "react";
import PatientLayout from "../../components/patient/PatientLayout";
import NotificationCard from "../../components/patient/NotificationCard";
import { db } from "../../data/patientMock";

function Notifications() {
    const [items, setItems] = useState(db.notifications);
    const [showUnread, setShowUnread] = useState(false);

    const data = showUnread ? items.filter((item) => !item.is_read) : items;

    const markRead = (id) => {
        setItems((prev) =>
            prev.map((item) =>
                item.id === id ? { ...item, is_read: true } : item
            )
        );
    };

    return (
        <PatientLayout>
            <div className="page-header">
                <div>
                    <h1>Thông báo</h1>
                    <p>Theo dõi các thông báo từ hệ thống (notifications).</p>
                </div>
            </div>

            <div className="notification-toolbar">
                <button
                    type="button"
                    className={showUnread ? "btn btn-primary" : "btn btn-outline"}
                    onClick={() => setShowUnread((v) => !v)}
                >
                    {showUnread
                        ? "Hiển thị tất cả"
                        : "Chỉ thông báo chưa đọc"}
                </button>
            </div>

            <div className="notification-list">
                {data.length > 0 ? (
                    data.map((notification) => (
                        <NotificationCard
                            key={notification.id}
                            notification={notification}
                            onOpen={markRead}
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
