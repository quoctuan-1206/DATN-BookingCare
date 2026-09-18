import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Search,
  ChevronDown,
  UserCircle,
  LogOut,
} from "lucide-react";
import toast from "react-hot-toast";
import doctorService from "../../../services/doctor.service";
import { useAuth } from "../../../context/AuthContext";
import NotificationBell from "../../common/NotificationBell/NotificationBell";

function getDisplayName(user, doctor) {
  if (doctor?.name) return doctor.name;
  const fullName = [user?.last_name, user?.first_name].filter(Boolean).join(" ");
  return fullName || user?.email || "Bác sĩ";
}

function DoctorHeader({ title }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const [doctor, setDoctor] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadDoctor() {
      if (!user?.id) {
        setDoctor(null);
        return;
      }

      try {
        const data = await doctorService.getDoctorById(user.id);
        if (!cancelled) setDoctor(data);
      } catch {
        if (!cancelled) setDoctor(null);
      }
    }

    loadDoctor();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const handleLogout = async () => {
    await logout();
    toast.success("Đã đăng xuất");
    navigate("/login");
  };

  const displayName = getDisplayName(user, doctor);
  const specialty = doctor?.specialty || "—";
  const avatar = doctor?.avatar || doctor?.image;

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

        <NotificationBell
          viewAllTo="/doctor/notifications"
          buttonClassName="doctor-notification"
        />

        <div className="doctor-user">
          <button
            type="button"
            className="doctor-user-btn"
            onClick={() => setShowMenu(!showMenu)}
          >
            {avatar ? (
              <img src={avatar} alt={displayName} />
            ) : (
              <span className="doctor-user-avatar-fallback">
                {displayName.charAt(0).toUpperCase()}
              </span>
            )}
            <div className="doctor-user-info">
              <strong>{displayName}</strong>
              <small>{specialty}</small>
            </div>
            <ChevronDown size={14} />
          </button>

          {showMenu && (
            <div className="doctor-dropdown">
              <Link to="/doctor/profile" onClick={() => setShowMenu(false)}>
                <UserCircle size={16} />
                Hồ sơ
              </Link>
              <button type="button" onClick={handleLogout}>
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
