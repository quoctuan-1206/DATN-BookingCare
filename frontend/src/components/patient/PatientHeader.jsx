import { CalendarDays, HeartPulse, UserRound } from "lucide-react";
import {
    db,
    getNextAppointmentLabel,
} from "../../data/patientMock";

function PatientHeader() {
    const account = db.account;
    const fullName = `${account.last_name} ${account.first_name}`;

    return (
        <div className="patient-header">
            <div className="patient-header-left">
                <img
                    src={account.avatar}
                    alt={fullName}
                    className="patient-avatar"
                />
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
                        <strong>{getNextAppointmentLabel()}</strong>
                    </div>
                </div>

                <div className="patient-header-item">
                    <HeartPulse size={18} />
                    <div>
                        <small>Tình trạng</small>
                        <strong>Sức khỏe ổn định</strong>
                    </div>
                </div>

                <div className="patient-header-item">
                    <UserRound size={18} />
                    <div>
                        <small>Tài khoản</small>
                        <strong>Bệnh nhân</strong>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default PatientHeader;
