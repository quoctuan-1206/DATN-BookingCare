import { Link, NavLink, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
    Menu,
    PieChart,
    UserRound,
    Hospital,
    Stethoscope,
    CalendarCheck,
    Users,
    Newspaper,
    Star,
    Banknote,
    Bell,
    Settings,
    LogOut,
    Pill,
    Activity,
} from "lucide-react";
import { useAuth } from "../../../context/AuthContext";

function AdminSidebar({ collapsed, setCollapsed }) {
    const navigate = useNavigate();
    const { logout } = useAuth();

    const menus = [

        {
            title: "Dashboard",
            path: "/admin",
            icon: <PieChart size={18} />,
        },

        {
            title: "Bác sĩ",
            path: "/admin/doctors",
            icon: <UserRound size={18} />,
        },

        {
            title: "Phòng khám",
            path: "/admin/clinics",
            icon: <Hospital size={18} />,
        },

        {
            title: "Chuyên khoa",
            path: "/admin/specialties",
            icon: <Stethoscope size={18} />,
        },

        {
            title: "Thuốc",
            path: "/admin/medicines",
            icon: <Pill size={18} />,
        },

        {
            title: "Cận lâm sàng",
            path: "/admin/clinical-services",
            icon: <Activity size={18} />,
        },

        {
            title: "Lịch hẹn",
            path: "/admin/appointments",
            icon: <CalendarCheck size={18} />,
        },

        {
            title: "Người dùng",
            path: "/admin/users",
            icon: <Users size={18} />,
        },

        {
            title: "Bài viết",
            path: "/admin/articles",
            icon: <Newspaper size={18} />,
        },

        {
            title: "Đánh giá",
            path: "/admin/reviews",
            icon: <Star size={18} />,
        },

        {
            title: "Thanh toán",
            path: "/admin/payments",
            icon: <Banknote size={18} />,
        },

        {
            title: "Thông báo",
            path: "/admin/notifications",
            icon: <Bell size={18} />,
        },

        {
            title: "Cài đặt",
            path: "/admin/settings",
            icon: <Settings size={18} />,
        },

    ];

    return (

        <aside
            className={
                collapsed
                    ? "admin-sidebar collapsed"
                    : "admin-sidebar"
            }
        >

            <div className="sidebar-top">

                <Link
                    to="/admin"
                    className="sidebar-logo"
                >

                    {collapsed ? "MU" : "MediUTE"}

                </Link>

                <button
                    className="sidebar-toggle"
                    onClick={() => setCollapsed(!collapsed)}
                >

                    <Menu size={18} />

                </button>

            </div>

            <nav className="sidebar-menu">

                {

                    menus.map((item) => (

                        <NavLink

                            key={item.path}

                            to={item.path}

                            end={item.path === "/admin"}

                            className={({ isActive }) =>

                                isActive

                                    ? "sidebar-item active"

                                    : "sidebar-item"

                            }

                        >

                            <span className="sidebar-icon">

                                {item.icon}

                            </span>

                            {

                                !collapsed &&

                                <span>

                                    {item.title}

                                </span>

                            }

                        </NavLink>

                    ))

                }

            </nav>

            <div className="sidebar-bottom">

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

                    {

                        !collapsed &&

                        <span>

                            Đăng xuất

                        </span>

                    }

                </button>

            </div>

        </aside>

    );

}

export default AdminSidebar;
