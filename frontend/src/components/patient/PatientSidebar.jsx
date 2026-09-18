import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
    Bell,
    CalendarDays,
    ChevronDown,
    ChevronRight,
    ClipboardList,
    User,
    Users,
    FlaskConical,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { resolveMediaUrl } from "../../utils/media";

const DEFAULT_AVATAR =
    "https://ui-avatars.com/api/?background=2E8B57&color=fff&size=128";

const accountSubmenus = [
    { title: "Thông tin cá nhân", path: "/patient/profile" },
    { title: "Đổi mật khẩu", path: "/patient/profile/password" },
];

const menus = [
    { title: "Hồ sơ bệnh nhân", icon: Users, path: "/patient/profiles" },
    { title: "Cận lâm sàng", icon: FlaskConical, path: "/patient/clinical" },
    { title: "Lịch hẹn", icon: CalendarDays, path: "/patient/appointments" },
    {
        title: "Lịch sử khám",
        icon: ClipboardList,
        path: "/patient/medical-records",
    },
    { title: "Thông báo", icon: Bell, path: "/patient/notifications" },
];

function PatientSidebar() {
    const location = useLocation();
    const { user } = useAuth();
    const isAccountSection = location.pathname.startsWith("/patient/profile");
    const [accountOpen, setAccountOpen] = useState(isAccountSection);

    useEffect(() => {
        if (isAccountSection) {
            setAccountOpen(true);
        }
    }, [isAccountSection]);

    const fullName = user
        ? [user.last_name, user.first_name].filter(Boolean).join(" ").trim()
        : "Bệnh nhân";
    const avatarSrc =
        resolveMediaUrl(user?.avatar) ||
        `${DEFAULT_AVATAR}&name=${encodeURIComponent(fullName)}`;

    return (
        <aside className="patient-sidebar">
            <div className="patient-sidebar-header">
                <img src={avatarSrc} alt={fullName} />
                <h3>{fullName}</h3>
                <p>Bệnh nhân</p>
            </div>

            <nav className="patient-nav">
                <div className="patient-menu-group">
                    <button
                        type="button"
                        className={`patient-menu patient-menu-toggle${
                            isAccountSection ? " active" : ""
                        }${accountOpen ? " open" : ""}`}
                        onClick={() => setAccountOpen((open) => !open)}
                        aria-expanded={accountOpen}
                    >
                        <User size={20} />
                        <span>Tài khoản</span>
                        <ChevronDown
                            size={16}
                            className="patient-menu-chevron patient-menu-chevron--toggle"
                        />
                    </button>

                    {accountOpen && (
                        <div className="patient-submenu">
                            {accountSubmenus.map((item) => (
                                <NavLink
                                    key={item.path}
                                    to={item.path}
                                    end={item.path === "/patient/profile"}
                                    className={({ isActive }) =>
                                        `patient-submenu-item${
                                            isActive ? " active" : ""
                                        }`
                                    }
                                >
                                    {item.title}
                                </NavLink>
                            ))}
                        </div>
                    )}
                </div>

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
                            <Icon size={20} />
                            <span>{menu.title}</span>
                            <ChevronRight
                                size={16}
                                className="patient-menu-chevron"
                            />
                        </NavLink>
                    );
                })}
            </nav>
        </aside>
    );
}

export default PatientSidebar;
