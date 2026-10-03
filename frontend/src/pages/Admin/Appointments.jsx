import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import AdminLayout from "../../components/admin/layout/AdminLayout";
import appointmentService, {
  STATUS_CLASS,
  STATUS_LABEL,
} from "../../services/appointment.service";
import { getApiErrorMessage } from "../../api/axios";

function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [filters, setFilters] = useState({ search: "", status: "" });

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page: 1, limit: 100 };
      if (filters.search.trim()) params.search = filters.search.trim();
      if (filters.status) params.status = filters.status;

      const result = await appointmentService.getAppointments(params);
      setAppointments(result.data);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không tải được lịch hẹn"));
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const handleStatus = async (item, nextStatus) => {
    const ok = window.confirm(
      `Chuyển ${item.booking_code} → ${STATUS_LABEL[nextStatus]}?`,
    );
    if (!ok) return;

    try {
      await appointmentService.updateStatus(item.id, nextStatus);
      toast.success("Đã cập nhật");
      fetchAppointments();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không cập nhật được"));
    }
  };

  const handleWorkflow = async (item, action) => {
    try {
      await appointmentService.performAction(item.id, action);
      toast.success("Đã cập nhật lượt khám");
      fetchAppointments();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không cập nhật được"));
    }
  };

  return (
    <AdminLayout title="Lịch hẹn">
      <div className="admin-page">
        <div className="admin-page-header">
          <div>
            <h3>Quản lý lịch hẹn</h3>
            <p>Theo dõi và xử lý lịch hẹn trên hệ thống</p>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="admin-toolbar">
            <input
              className="admin-input"
              type="text"
              placeholder="Tìm mã / bệnh nhân..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setFilters({ search, status });
                }
              }}
            />
            <select
              className="admin-select"
              style={{ maxWidth: 200 }}
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">Tất cả trạng thái</option>
              <option value="PENDING">Đang chờ</option>
              <option value="CONFIRMED">Đã xác nhận</option>
              <option value="CHECKED_IN">Đã check-in</option>
              <option value="WAITING">Đang chờ khám</option>
              <option value="CALLED">Đã gọi</option>
              <option value="IN_PROGRESS">Đang khám</option>
              <option value="COMPLETED">Hoàn thành</option>
              <option value="CANCELLED">Đã hủy</option>
              <option value="NO_SHOW">Không đến</option>
            </select>
            <button
              type="button"
              className="admin-btn admin-btn-primary"
              onClick={() => setFilters({ search, status })}
            >
              Tìm
            </button>
          </div>

          <div className="table-wrapper">
            {loading ? (
              <p>Đang tải...</p>
            ) : appointments.length === 0 ? (
              <p>Không có lịch hẹn.</p>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Mã</th>
                    <th>Bệnh nhân</th>
                    <th>Bác sĩ</th>
                    <th>Ngày</th>
                    <th>Giờ</th>
                    <th>Trạng thái</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.map((item) => (
                    <tr key={item.id}>
                      <td>{item.booking_code}</td>
                      <td>{item.patient_name}</td>
                      <td>{item.doctor_name}</td>
                      <td>{item.date_display}</td>
                      <td>{item.start_time}</td>
                      <td>
                        <span
                          className={`status ${
                            STATUS_CLASS[item.status] || "pending"
                          }`}
                        >
                          {STATUS_LABEL[item.status]}
                        </span>
                      </td>
                      <td style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        {item.status === "PENDING" && (
                          <button
                            type="button"
                            className="admin-btn admin-btn-primary"
                            onClick={() => handleStatus(item, "CONFIRMED")}
                          >
                            Xác nhận
                          </button>
                        )}
                        {(item.status === "PENDING" ||
                          item.status === "CONFIRMED") && (
                          <button
                            type="button"
                            className="admin-btn admin-btn-danger"
                            onClick={() => handleStatus(item, "CANCELLED")}
                          >
                            Hủy
                          </button>
                        )}
                        {item.status === "CONFIRMED" && (
                          <>
                            <button type="button" className="admin-btn admin-btn-primary" onClick={() => handleWorkflow(item, "check-in")}>Check-in & cấp số</button>
                            <button type="button" className="admin-btn admin-btn-secondary" onClick={() => handleWorkflow(item, "no-show")}>Không đến</button>
                          </>
                        )}
                        {item.status === "CHECKED_IN" && (
                          <button type="button" className="admin-btn admin-btn-primary" onClick={() => handleWorkflow(item, "enqueue")}>Cấp số</button>
                        )}
                        {item.status === "WAITING" && (
                          <button type="button" className="admin-btn admin-btn-primary" onClick={() => handleWorkflow(item, "call")}>Gọi</button>
                        )}
                        {item.status === "CALLED" && (
                          <button type="button" className="admin-btn admin-btn-primary" onClick={() => handleWorkflow(item, "start")}>Bắt đầu khám</button>
                        )}
                        {item.status === "IN_PROGRESS" && item.can_complete_exam && (
                          <button type="button" className="admin-btn admin-btn-primary" onClick={() => handleWorkflow(item, "complete")}>Hoàn thành</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

export default Appointments;
