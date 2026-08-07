import { Link } from "react-router-dom";
import { Clock3 } from "lucide-react";
import { STATUS_LABEL } from "../../../services/appointment.service";

function TodayAppointments({ appointments = [], loading = false }) {
  return (
    <div className="doctor-card doctor-today-appointments">
      <div className="doctor-card-header">
        <div>
          <h3>Lịch hẹn hôm nay</h3>
          <p>
            {loading
              ? "Đang tải..."
              : `${appointments.length} cuộc hẹn trong ngày`}
          </p>
        </div>
        <Link to="/doctor/appointments" className="doctor-view-all">
          Xem tất cả
        </Link>
      </div>

      <div className="doctor-appointment-list">
        {loading ? (
          <p>Đang tải...</p>
        ) : appointments.length === 0 ? (
          <p>Không có lịch hẹn hôm nay.</p>
        ) : (
          appointments.map((item) => (
            <Link
              key={item.id}
              to={`/doctor/appointments/${item.id}`}
              className="doctor-appointment-item"
            >
              <div className="doctor-appointment-time">
                <Clock3 size={16} />
                <span>{item.start_time || "—"}</span>
              </div>

              <div className="doctor-appointment-info">
                <strong>{item.patient_name || "Bệnh nhân"}</strong>
                <span>
                  {item.booking_code || `#${item.id}`}
                  {item.reason ? ` · ${item.reason}` : ""}
                </span>
              </div>

              <span
                className={`doctor-status ${String(item.status || "").toLowerCase()}`}
              >
                {STATUS_LABEL[item.status] || item.status}
              </span>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

export default TodayAppointments;
