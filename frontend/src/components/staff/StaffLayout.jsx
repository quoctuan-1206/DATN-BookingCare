import { CalendarClock, ClipboardList, LogOut, UsersRound, Package } from "lucide-react";
import { Navigate, NavLink, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";

function StaffLayout({ children, title }) {
  const navigate = useNavigate();
  const { user, loading, logout } = useAuth();
  const fullName = [user?.last_name, user?.first_name].filter(Boolean).join(" ");
  const isUnassignedStaff = user?.role?.name === "STAFF" && !user?.clinic_id;

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (!["STAFF", "Admin"].includes(user.role?.name || user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="sidebar-top">
          <NavLink to="/staff" className="sidebar-logo">MediUTE</NavLink>
        </div>
        <nav className="sidebar-menu">
          <NavLink to="/staff" end className={({ isActive }) => `sidebar-item${isActive ? " active" : ""}`}>
            <span className="sidebar-icon"><ClipboardList size={18} /></span><span>Tổng quan</span>
          </NavLink>
          <NavLink to="/staff/appointments" className={({ isActive }) => `sidebar-item${isActive ? " active" : ""}`}>
            <span className="sidebar-icon"><UsersRound size={18} /></span>
            <span>Check-in & hàng đợi</span>
          </NavLink>
          <NavLink to="/staff/inventory" className={({ isActive }) => `sidebar-item${isActive ? " active" : ""}`}>
            <span className="sidebar-icon"><Package size={18} /></span><span>Kho dược</span>
          </NavLink>
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
          <div className="admin-header-right"><strong>{fullName || "Nhân viên cận lâm sàng"}</strong>{user?.role?.name === "STAFF" && <span>{user?.clinics?.name || "Chưa được phân công cơ sở"}</span>}</div>
        </header>
        <main className="admin-content">
          {isUnassignedStaff ? (
            <div className="dashboard-card" role="status">
              Bạn chưa được phân công cơ sở làm việc. Vui lòng liên hệ quản trị viên.
            </div>
          ) : children}
        </main>
      </div>
    </div>
  );
}

export default StaffLayout;
