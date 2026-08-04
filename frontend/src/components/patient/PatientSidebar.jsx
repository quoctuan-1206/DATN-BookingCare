import { NavLink, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
    Bell,
    CalendarDays,
    ClipboardList,
    LayoutDashboard,
    LogOut,
    User,
    Users,
} from "lucide-react";
import { db } from "../../data/patientMock";
import { useAuth } from "../../context/AuthContext";

const menus = [
    { title: "Tổng quan", icon: LayoutDashboard, path: "/patient", end: true },
    { title: "Hồ sơ bệnh nhân", icon: Users, path: "/patient/profiles" },
    { title: "Lịch hẹn", icon: CalendarDays, path: "/patient/appointments" },
    {
        title: "Lịch sử khám",
        icon: ClipboardList,
        path: "/patient/medical-records",
    },
    { title: "Thông báo", icon: Bell, path: "/patient/notifications" },
    { title: "Tài khoản", icon: User, path: "/patient/profile" },
];

function PatientSidebar() {
    const navigate = useNavigate();
    const { logout } = useAuth();
    const account = db.account;
    const fullName = `${account.last_name} ${account.first_name}`;

    return (
        <aside className="patient-sidebar">
            <div className="patient-sidebar-header">
                <img src={account.avatar} alt={fullName} />
                <h3>{fullName}</h3>
                <p>Bệnh nhân</p>
            </div>

            <nav className="patient-nav">
                {menus.map((menu) => {
                    const Icon = menu.icon;
                    return (
                        <NavLink
                            key={menu.path}
                            to={menu.path}
                            end={menu.end}
                            className={({ isActive }) =>
                                `patient-menu${isActive ? " active" : ""}`
                            }
                        >
                            <Icon size={18} />
                            <span>{menu.title}</span>
                        </NavLink>
                    );
                })}
            </nav>

            <button
                type="button"
                className="logout-btn"
                onClick={async () => {
                    await logout();
                    toast.success("Đã đăng xuất");
                    navigate("/login");
                }}
            >
                <LogOut size={18} />
                Đăng xuất
            </button>
        </aside>
    );
}

export default PatientSidebar;
