import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import appointmentService, {
  STATUS_LABEL,
} from "../../../services/appointment.service";

function renderStatus(status) {
  const key = String(status || "").toLowerCase();
  const label = STATUS_LABEL[status] || status || "—";
  return <span className={`status ${key}`}>{label}</span>;
}

function RecentAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const result = await appointmentService.getAppointments({
          page: 1,
          limit: 8,
        });
        if (alive) setAppointments(result.data || []);
      } catch {
        if (alive) setAppointments([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="dashboard-card">
      <div className="dashboard-card-header">
        <h3>Lịch hẹn gần đây</h3>
        <Link to="/admin/appointments" className="view-all">
          Xem tất cả
        </Link>
      </div>

      <table className="admin-table">
        <thead>
          <tr>
            <th>Mã</th>
            <th>Bệnh nhân</th>
            <th>Bác sĩ</th>
            <th>Ngày</th>
            <th>Giờ</th>
            <th>Trạng thái</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={6}>Đang tải...</td>
            </tr>
          ) : appointments.length === 0 ? (
            <tr>
              <td colSpan={6}>Chưa có lịch hẹn.</td>
            </tr>
          ) : (
            appointments.map((item) => (
              <tr key={item.id}>
                <td>{item.booking_code || item.id}</td>
                <td>{item.patient_name || "—"}</td>
                <td>{item.doctor_name || "—"}</td>
                <td>{item.date_display || item.work_date || "—"}</td>
                <td>{item.start_time || item.time || "—"}</td>
                <td>{renderStatus(item.status)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default RecentAppointments;
