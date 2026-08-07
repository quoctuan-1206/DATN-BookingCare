import { useEffect, useMemo, useState } from "react";
import appointmentService from "../../../services/appointment.service";

function toYMD(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function OverviewChart() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const result = await appointmentService.getAppointments({
          page: 1,
          limit: 100,
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

  const days = useMemo(() => {
    const result = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 6; i >= 0; i -= 1) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = toYMD(d);
      const count = appointments.filter((a) => a.work_date === key).length;
      result.push({
        key,
        label: d.toLocaleDateString("vi-VN", {
          weekday: "short",
          day: "2-digit",
          month: "2-digit",
        }),
        count,
      });
    }
    return result;
  }, [appointments]);

  const maxCount = Math.max(...days.map((d) => d.count), 1);
  const totalWeek = days.reduce((sum, d) => sum + d.count, 0);

  const byStatus = useMemo(() => {
    const map = {
      PENDING: 0,
      CONFIRMED: 0,
      COMPLETED: 0,
      CANCELLED: 0,
    };
    for (const a of appointments) {
      if (map[a.status] !== undefined) map[a.status] += 1;
    }
    return map;
  }, [appointments]);

  return (
    <div className="overview-chart">
      <div className="dashboard-card-header">
        <h3>Tổng quan hệ thống</h3>
        <p>
          {loading
            ? "Đang tải thống kê..."
            : `${totalWeek} lịch hẹn trong 7 ngày gần nhất`}
        </p>
      </div>

      <div className="chart-container">
        {loading ? (
          <div className="chart-placeholder">Đang tải...</div>
        ) : (
          <div className="admin-simple-chart">
            <div className="admin-bar-chart">
              {days.map((day) => (
                <div key={day.key} className="admin-bar-col">
                  <div className="admin-bar-track">
                    <div
                      className="admin-bar-fill"
                      style={{
                        height: `${Math.max(
                          (day.count / maxCount) * 100,
                          day.count ? 8 : 0,
                        )}%`,
                      }}
                      title={`${day.count} lịch`}
                    />
                  </div>
                  <strong>{day.count}</strong>
                  <span>{day.label}</span>
                </div>
              ))}
            </div>

            <div className="admin-status-summary">
              <div>
                <span className="status pending">Chờ</span>
                <strong>{byStatus.PENDING}</strong>
              </div>
              <div>
                <span className="status confirmed">Xác nhận</span>
                <strong>{byStatus.CONFIRMED}</strong>
              </div>
              <div>
                <span className="status completed">Hoàn thành</span>
                <strong>{byStatus.COMPLETED}</strong>
              </div>
              <div>
                <span className="status cancelled">Hủy</span>
                <strong>{byStatus.CANCELLED}</strong>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default OverviewChart;
