import { CalendarDays, HeartPulse, UserRound } from "lucide-react";
import { resolveMediaUrl } from "../../utils/media";

const DEFAULT_AVATAR =
  "https://ui-avatars.com/api/?background=2E8B57&color=fff&size=128";

function PatientHeader({
  fullName = "Bệnh nhân",
  avatar,
  nextAppointment = "Chưa có lịch",
  healthStatus = "Sức khỏe ổn định",
  accountLabel = "Bệnh nhân",
}) {
  const avatarSrc = resolveMediaUrl(avatar) || DEFAULT_AVATAR;

  return (
    <div className="patient-header patient-welcome-card">
      <div className="patient-header-left">
        <img src={avatarSrc} alt={fullName} className="patient-avatar" />
        <div>
          <h1>
            Xin chào, <span>{fullName}</span>
          </h1>
          <p>Chúc bạn một ngày thật nhiều sức khỏe.</p>
        </div>
      </div>

      <div className="patient-header-right">
        <div className="patient-header-item">
          <CalendarDays size={18} />
          <div>
            <small>Lịch khám gần nhất</small>
            <strong>{nextAppointment}</strong>
          </div>
        </div>

        <div className="patient-header-item">
          <HeartPulse size={18} />
          <div>
            <small>Tình trạng sức khỏe</small>
            <strong>{healthStatus}</strong>
          </div>
        </div>

        <div className="patient-header-item">
          <UserRound size={18} />
          <div>
            <small>Loại tài khoản</small>
            <strong>{accountLabel}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PatientHeader;
