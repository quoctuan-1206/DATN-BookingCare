import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../../../context/AuthContext";
import NotificationBell from "../NotificationBell/NotificationBell";

function Actions({ onNavigate }) {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout, getRedirectPathByRole } = useAuth();

  const handleLogout = async () => {
    onNavigate?.();
    await logout();
    toast.success("Đã đăng xuất");
    navigate("/login");
  };

  if (isAuthenticated && user) {
    const dashboardPath = getRedirectPathByRole(user.role?.name);
    const notificationPath =
      user.role?.name === "Doctor"
        ? "/doctor/notifications"
        : user.role?.name === "Admin"
          ? "/admin/notifications"
          : "/patient/notifications";

    return (
      <div className="actions">
        <NotificationBell
          viewAllTo={notificationPath}
          buttonClassName="header-notification-btn"
        />
        <Link to={dashboardPath} className="support-btn" onClick={onNavigate}>
          {user.first_name || "Tài khoản"}
        </Link>

        <button type="button" className="login-btn" onClick={handleLogout}>
          Đăng xuất
        </button>
      </div>
    );
  }

  return (
    <div className="actions">
      <Link to="/login" className="header-login-btn" onClick={onNavigate}>
        Đăng nhập
      </Link>
      <Link to="/register" className="header-register-btn" onClick={onNavigate}>
        Đăng ký
      </Link>
    </div>
  );
}

export default Actions;
