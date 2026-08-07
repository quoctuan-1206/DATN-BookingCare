import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
    Bell,
    Search,
    ChevronDown,
    UserCircle,
    LogOut,
} from "lucide-react";
import notificationService from "../../../services/notification.service";

function DoctorHeader({ title }) {
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
        <header className="doctor-header">
            <div className="doctor-header-left">
                <h2>{title}</h2>
                <p>Bác sĩ / {title}</p>
            </div>

            <div className="doctor-header-right">
                <div className="doctor-search">
                    <Search size={16} />
                    <input type="text" placeholder="Tìm bệnh nhân, lịch hẹn..." />
                </div>

                <Link to="/doctor/notifications" className="doctor-notification">
                    <Bell size={16} />
                    {unreadCount > 0 && <span>{unreadCount}</span>}
                </Link>

                <div className="doctor-user">
                    <button
                        type="button"
                        className="doctor-user-btn"
                        onClick={() => setShowMenu(!showMenu)}
                    >
                        <img
                            src="https://i.pravatar.cc/100?img=12"
                            alt="Doctor"
                        />
                        <div className="doctor-user-info">
                            <strong>TS. Nguyễn Minh</strong>
                            <small>Tim mạch</small>
                        </div>
                        <ChevronDown size={14} />
                    </button>

                    {showMenu && (
                        <div className="doctor-dropdown">
                            <Link to="/doctor/profile">
                                <UserCircle size={16} />
                                Hồ sơ
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

export default DoctorHeader;
