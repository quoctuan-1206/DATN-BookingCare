import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
    Bell,
    Search,
    ChevronDown,
    UserCircle,
    Settings,
    LogOut,
} from "lucide-react";
import notificationService from "../../../services/notification.service";

function AdminHeader({ title }) {
    const [showMenu, setShowMenu] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        let alive = true;
        notificationService
            .getUnreadCount()
            .then((count) => {
                if (alive) setUnreadCount(count);
            })
            .catch(() => {
                if (alive) setUnreadCount(0);
            });
        return () => {
            alive = false;
        };
    }, []);

    return (
        <header className="admin-header">
            <div className="admin-header-left">
                <h2>{title}</h2>
                <p>Dashboard / {title}</p>
            </div>

            <div className="admin-header-right">
                <div className="admin-search">
                    <Search size={16} />
                    <input type="text" placeholder="Tìm kiếm..." />
                </div>

                <Link to="/admin/notifications" className="admin-notification">
                    <Bell size={16} />
                    {unreadCount > 0 && <span>{unreadCount}</span>}
                </Link>

                <div className="admin-user">
                    <button
                        className="admin-user-btn"
                        onClick={() => setShowMenu(!showMenu)}
                    >
                        <img
                            src="https://i.pravatar.cc/100"
                            alt="Admin"
                        />
                        <div className="admin-user-info">
                            <strong>Administrator</strong>
                            <small>Super Admin</small>
                        </div>
                        <ChevronDown size={14} />
                    </button>

                    {showMenu && (
                        <div className="admin-dropdown">
                            <Link to="/admin/profile">
                                <UserCircle size={16} />
                                Hồ sơ
                            </Link>
                            <Link to="/admin/settings">
                                <Settings size={16} />
                                Cài đặt
                            </Link>
                            <button type="button">
                                <LogOut size={16} />
                                Đăng xuất
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}

export default AdminHeader;
