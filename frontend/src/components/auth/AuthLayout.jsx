import { Link } from "react-router-dom";
import {
    CalendarCheck,
    Hospital,
    ShieldCheck,
    Stethoscope,
} from "lucide-react";

function AuthLayout({ title, subtitle, children }) {
    return (
        <div className="auth-page">
            <div className="auth-container">
                <div className="auth-banner">
                    <Link to="/" className="auth-logo">
                        MediUTE
                    </Link>

                    <h1>
                        Chăm sóc sức khỏe
                        <br />
                        ngay tại nhà
                    </h1>

                    <p>
                        Hệ thống đặt lịch khám trực tuyến giúp kết nối bệnh nhân
                        với bác sĩ, phòng khám và bệnh viện nhanh chóng, tiện lợi.
                    </p>

                    <div className="auth-features">
                        <div className="auth-feature">
                            <CalendarCheck size={22} />
                            <span>Đặt lịch khám chỉ trong vài phút</span>
                        </div>

                        <div className="auth-feature">
                            <Stethoscope size={22} />
                            <span>Hơn 500 bác sĩ chuyên khoa</span>
                        </div>

                        <div className="auth-feature">
                            <Hospital size={22} />
                            <span>Liên kết nhiều bệnh viện uy tín</span>
                        </div>

                        <div className="auth-feature">
                            <ShieldCheck size={22} />
                            <span>Bảo mật thông tin người dùng</span>
                        </div>
                    </div>
                </div>

                <div className="auth-card">
                    <div className="auth-header">
                        <h2>{title}</h2>
                        <p>{subtitle}</p>
                    </div>

                    {children}
                </div>
            </div>
        </div>
    );
}

export default AuthLayout;
