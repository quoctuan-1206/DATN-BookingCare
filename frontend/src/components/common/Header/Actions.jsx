import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../../../context/AuthContext";

function Actions() {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout, getRedirectPathByRole } = useAuth();

  const handleLogout = async () => {
    await logout();
    toast.success("Đã đăng xuất");
    navigate("/login");
  };

  if (isAuthenticated && user) {
    const dashboardPath = getRedirectPathByRole(user.role?.name);

    return (
      <div className="actions">
        <Link to={dashboardPath} className="support-btn">
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
      <button type="button" className="support-btn">
        Hỗ trợ
      </button>

      <Link to="/login" className="login-btn">
        Đăng nhập
      </Link>
    </div>
  );
}

export default Actions;
