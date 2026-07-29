import { Link, NavLink } from "react-router-dom";
import {
    Menu,
    LayoutDashboard,
    CalendarDays,
    CalendarCheck,
    ClipboardPlus,
    Clock3,
    Pill,
    Star,
    UserRound,
    LogOut,
} from "lucide-react";

function DoctorSidebar({ collapsed, setCollapsed }) {
    const menus = [
        {
            title: "Dashboard",
            path: "/doctor",
            icon: <LayoutDashboard size={18} />,
        },
        {
            title: "Lịch hôm nay",
            path: "/doctor/schedule",
            icon: <CalendarDays size={18} />,
        },
        {
            title: "Lịch hẹn",
            path: "/doctor/appointments",
            icon: <CalendarCheck size={18} />,
        },
        {
            title: "Hồ sơ bệnh án",
            path: "/doctor/medical-records",
            icon: <ClipboardPlus size={18} />,
        },
        {
            title: "Lịch làm việc",
            path: "/doctor/working-schedule",
            icon: <Clock3 size={18} />,
        },
        {
            title: "Đơn thuốc",
            path: "/doctor/prescriptions",
            icon: <Pill size={18} />,
        },
        {
            title: "Đánh giá",
            path: "/doctor/reviews",
            icon: <Star size={18} />,
        },
        {
            title: "Hồ sơ",
            path: "/doctor/profile",
            icon: <UserRound size={18} />,
        },
    ];

    return (
        <aside
            className={
                collapsed ? "doctor-sidebar collapsed" : "doctor-sidebar"
            }
        >
            <div className="doctor-sidebar-top">
                <Link to="/doctor" className="doctor-sidebar-logo">
                    {collapsed ? "BS" : "Doctor Panel"}
                </Link>

                <button
                    type="button"
                    className="doctor-sidebar-toggle"
                    onClick={() => setCollapsed(!collapsed)}
                >
                    <Menu size={18} />
                </button>
            </div>

            <nav className="doctor-sidebar-menu">
                {menus.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        end={item.path === "/doctor"}
                        className={({ isActive }) =>
                            isActive
                                ? "doctor-sidebar-item active"
                                : "doctor-sidebar-item"
                        }
                    >
                        <span className="doctor-sidebar-icon">{item.icon}</span>
                        {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                ))}
            </nav>

            <div className="doctor-sidebar-bottom">
                <button type="button" className="doctor-logout-btn">
                    <LogOut size={18} />
                    {!collapsed && <span>Đăng xuất</span>}
                </button>
            </div>
        </aside>
    );
}

export default DoctorSidebar;
