import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import StaffLayout from "../../components/staff/StaffLayout";
import appointmentService, {
  STATUS_CLASS,
  STATUS_LABEL,
} from "../../services/appointment.service";
import { getApiErrorMessage } from "../../api/axios";

const currentDate = new Date();
const today = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(currentDate.getDate()).padStart(2, "0")}`;

const actionsByStatus = {
  CONFIRMED: [
    { action: "check-in", label: "Check-in & cấp số", kind: "primary" },
    { action: "no-show", label: "Không đến", kind: "danger" },
  ],
  CHECKED_IN: [{ action: "enqueue", label: "Đưa vào hàng đợi", kind: "primary" }],
  WAITING: [{ action: "call", label: "Gọi bệnh nhân", kind: "primary" }],
};

function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [date, setDate] = useState(today);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page: 1, limit: 100 };
      if (search.trim()) params.search = search.trim();
      if (status) params.status = status;
      const result = date === today
        ? await appointmentService.getToday(params)
        : await appointmentService.getAppointments({ ...params, date });
      setAppointments(result.data || []);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không tải được lịch khám hôm nay"));
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }, [search, status, date]);

  useEffect(() => {
    load();
  }, [load]);

  async function runAction(item, action) {
    setBusyId(item.id);
    try {
      await appointmentService.performAction(item.id, action);
      toast.success("Đã cập nhật lượt khám");
      await load();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không thể cập nhật lượt khám"));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <StaffLayout title="Check-in & hàng đợi khám">
      <div className="admin-page">
        <div className="admin-page-header">
          <div>
            <h3>Lịch khám {date === today ? "hôm nay" : date}</h3>
            <p>Check-in, cấp số và gọi bệnh nhân theo đúng thứ tự.</p>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="admin-toolbar">
            <input
              className="admin-input"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Mã lịch, tên hoặc số điện thoại..."
            />
            <input className="admin-input" type="date" value={date} onChange={(event) => setDate(event.target.value)} />
            <select className="admin-select" value={status} onChange={(event) => setStatus(event.target.value)}>
              <option value="">Tất cả trạng thái</option>
              {Object.entries(STATUS_LABEL).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          {loading ? (
            <p>Đang tải...</p>
          ) : appointments.length === 0 ? (
            <p>Không có lịch khám phù hợp.</p>
          ) : (
            <div className="table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>STT</th><th>Bệnh nhân</th><th>Bác sĩ</th><th>Giờ</th>
                    <th>Phòng</th><th>Trạng thái</th><th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.map((item) => (
                    <tr key={item.id}>
                      <td>{item.queue_number ? `#${String(item.queue_number).padStart(2, "0")}` : "—"}</td>
                      <td><strong>{item.patient_name}</strong><br /><small>{item.booking_code} · {item.patient_phone || "—"}</small></td>
                      <td>{item.doctor_name}</td>
                      <td>{item.start_time}</td>
                      <td>{item.room || "—"}</td>
                      <td><span className={`status ${STATUS_CLASS[item.status] || "pending"}`}>{STATUS_LABEL[item.status]}</span></td>
                      <td style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        {(actionsByStatus[item.status] || []).map((action) => (
                          <button
                            key={action.action}
                            type="button"
                            className={`admin-btn admin-btn-${action.kind}`}
                            disabled={busyId === item.id || date !== today}
                            onClick={() => runAction(item, action.action)}
                          >
                            {action.label}
                          </button>
                        ))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </StaffLayout>
  );
}

export default Appointments;
