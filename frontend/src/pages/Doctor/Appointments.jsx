import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import DoctorLayout from "../../components/doctor-dashboard/layout/DoctorLayout";
import appointmentService, {
  STATUS_CLASS,
  STATUS_LABEL,
} from "../../services/appointment.service";
import { getApiErrorMessage } from "../../api/axios";
import { isExamDay } from "../../utils/booking";

function Appointments() {
  const [status, setStatus] = useState("");
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page: 1, limit: 50 };
      if (status) params.status = status;
      const result = await appointmentService.getAppointments(params);
      setAppointments(result.data);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không tải được lịch hẹn"));
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const handleStatus = async (item, nextStatus) => {
    const label = STATUS_LABEL[nextStatus] || nextStatus;
    const ok = window.confirm(
      `Chuyển lịch ${item.booking_code} sang "${label}"?`,
    );
    if (!ok) return;

    try {
      await appointmentService.updateStatus(item.id, nextStatus);
      toast.success("Đã cập nhật trạng thái");
      fetchAppointments();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không cập nhật được"));
    }
  };

  return (
    <DoctorLayout title="Lịch hẹn">
      <div className="doctor-page">
        <div className="doctor-card">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
              marginBottom: 16,
              flexWrap: "wrap",
            }}
          >
            <h3>Quản lý lịch hẹn</h3>
            <select
              className="admin-select"
              style={{ maxWidth: 200 }}
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">Tất cả trạng thái</option>
              <option value="PENDING">Đang chờ</option>
              <option value="CONFIRMED">Đã xác nhận</option>
              <option value="COMPLETED">Hoàn thành</option>
              <option value="CANCELLED">Đã hủy</option>
            </select>
          </div>

          {loading ? (
            <p>Đang tải...</p>
          ) : appointments.length === 0 ? (
            <p>Chưa có lịch hẹn.</p>
          ) : (
            <div className="table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Mã</th>
                    <th>Bệnh nhân</th>
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
                      <td>{item.date_display}</td>
                      <td>{item.time}</td>
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
                        <Link
                          to={`/doctor/appointments/${item.id}`}
                          className="admin-btn admin-btn-secondary"
                        >
                          Chi tiết
                        </Link>
                        {item.status === "PENDING" && (
                          <>
                            <button
                              type="button"
                              className="admin-btn admin-btn-primary"
                              onClick={() => handleStatus(item, "CONFIRMED")}
                            >
                              Xác nhận
                            </button>
                            <button
                              type="button"
                              className="admin-btn admin-btn-danger"
                              onClick={() => handleStatus(item, "CANCELLED")}
                            >
                              Hủy
                            </button>
                          </>
                        )}
                        {item.status === "CONFIRMED" && (
                          <>
                            {isExamDay(item.work_date) && (
                              <Link
                                to={`/doctor/appointments/${item.id}?exam=1`}
                                className="admin-btn admin-btn-primary"
                              >
                                Bắt đầu khám
                              </Link>
                            )}
                            <button
                              type="button"
                              className="admin-btn admin-btn-danger"
                              onClick={() => handleStatus(item, "CANCELLED")}
                            >
                              Hủy
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DoctorLayout>
  );
}

export default Appointments;
