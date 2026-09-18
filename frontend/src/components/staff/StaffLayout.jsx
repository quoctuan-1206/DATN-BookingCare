import { CalendarClock, ClipboardList, LogOut } from "lucide-react";
import { Navigate, NavLink, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";

function StaffLayout({ children, title }) {
  const navigate = useNavigate();
  const { user, loading, logout } = useAuth();
  const fullName = [user?.last_name, user?.first_name].filter(Boolean).join(" ");

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (!["STAFF", "Admin"].includes(user.role?.name || user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="sidebar-top">
          <NavLink to="/staff/clinical/orders" className="sidebar-logo">MediUTE</NavLink>
        </div>
        <nav className="sidebar-menu">
          <NavLink to="/staff/clinical/orders" className={({ isActive }) => `sidebar-item${isActive ? " active" : ""}`}>
            <span className="sidebar-icon"><ClipboardList size={18} /></span>
            <span>Phiếu cận lâm sàng</span>
          </NavLink>
          <NavLink to="/staff/clinical/schedules" className={({ isActive }) => `sidebar-item${isActive ? " active" : ""}`}>
            <span className="sidebar-icon"><CalendarClock size={18} /></span>
            <span>Lịch cận lâm sàng</span>
          </NavLink>
        </nav>
        <div className="sidebar-bottom">
          <button type="button" className="logout-btn" onClick={async () => {
            await logout();
            toast.success("Đã đăng xuất");
            navigate("/login");
          }}>
            <LogOut size={18} /><span>Đăng xuất</span>
          </button>
        </div>
      </aside>
      <div className="admin-main">
        <header className="admin-header">
          <div className="admin-header-left"><h2>{title}</h2></div>
          <div className="admin-header-right"><strong>{fullName || "Nhân viên cận lâm sàng"}</strong></div>
        </header>
        <main className="admin-content">{children}</main>
      </div>
    </div>
  );
}

export default StaffLayout;
