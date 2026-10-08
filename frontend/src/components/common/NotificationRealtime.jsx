import { useEffect } from "react";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import notificationService from "../../services/notification.service";

function NotificationRealtime() {
  const { user } = useAuth();

  useEffect(() => {
    const role = user?.role?.name || user?.role;
    if (!user?.id || !["Patient", "Doctor", "Admin"].includes(role)) {
      return undefined;
    }

    return notificationService.subscribe((notification) => {
      window.dispatchEvent(
        new CustomEvent("notification:new", { detail: notification }),
      );
      if (notification?.title) {
        toast(notification.title, { duration: 4500, icon: "🔔" });
      }
    });
  }, [user?.id, user?.role]);

  return null;
}

export default NotificationRealtime;
