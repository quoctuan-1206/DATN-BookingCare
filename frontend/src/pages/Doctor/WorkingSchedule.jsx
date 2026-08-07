import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import DoctorLayout from "../../components/doctor-dashboard/layout/DoctorLayout";
import scheduleService from "../../services/schedule.service";
import doctorService from "../../services/doctor.service";
import { getApiErrorMessage } from "../../api/axios";
import { useAuth } from "../../context/AuthContext";

function WorkingSchedule() {
  const { user } = useAuth();
  const [schedules, setSchedules] = useState([]);
  const [workplaces, setWorkplaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    doctor_workplace_id: "",
    work_date: "",
    start_time: "08:00",
    end_time: "09:00",
    max_patients: 10,
  });

  const loadData = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const [doctor, scheduleResult] = await Promise.all([
        doctorService.getDoctorById(user.id),
        scheduleService.getSchedules({
          doctor_id: user.id,
          from_date: new Date().toISOString().slice(0, 10),
          limit: 100,
        }),
      ]);

      const wps = doctor?.workplaces || [];
      setWorkplaces(wps);
      setSchedules(scheduleResult.data);
      setForm((prev) => ({
        ...prev,
        doctor_workplace_id: prev.doctor_workplace_id || String(wps[0]?.id || ""),
      }));
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không tải được lịch làm việc"));
      setSchedules([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.doctor_workplace_id || !form.work_date) {
      toast.error("Chọn nơi làm việc và ngày khám");
      return;
    }

    setSaving(true);
    try {
      await scheduleService.createSchedule({
        doctor_workplace_id: Number(form.doctor_workplace_id),
        work_date: form.work_date,
        start_time: form.start_time,
        end_time: form.end_time,
        max_patients: Number(form.max_patients) || 10,
      });
      toast.success("Đã thêm khung giờ");
      loadData();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không tạo được lịch"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item) => {
    const ok = window.confirm(
      `Xóa khung ${item.start_time} ngày ${item.date_display}?`,
    );
    if (!ok) return;

    try {
      await scheduleService.deleteSchedule(item.id);
      toast.success("Đã xóa khung giờ");
      loadData();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không xóa được lịch"));
    }
  };

  return (
    <DoctorLayout title="Lịch làm việc">
      <div className="doctor-page">
        <div className="doctor-card" style={{ marginBottom: 20 }}>
          <h3 style={{ marginBottom: 12 }}>Thêm khung giờ khám</h3>
          <form
            onSubmit={handleCreate}
            style={{
              display: "grid",
              gap: 12,
              gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
              alignItems: "end",
            }}
          >
            <label>
              Nơi làm việc
              <select
                name="doctor_workplace_id"
                className="admin-select"
                value={form.doctor_workplace_id}
                onChange={handleChange}
                required
              >
                <option value="">Chọn...</option>
                {workplaces.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.clinic_name} · {w.specialty_name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Ngày
              <input
                type="date"
                name="work_date"
                className="admin-input"
                value={form.work_date}
                onChange={handleChange}
                required
              />
            </label>
            <label>
              Bắt đầu
              <input
                type="time"
                name="start_time"
                className="admin-input"
                value={form.start_time}
                onChange={handleChange}
                required
              />
            </label>
            <label>
              Kết thúc
              <input
                type="time"
                name="end_time"
                className="admin-input"
                value={form.end_time}
                onChange={handleChange}
                required
              />
            </label>
            <label>
              Số bệnh nhân tối đa
              <input
                type="number"
                name="max_patients"
                className="admin-input"
                min="1"
                max="100"
                value={form.max_patients}
                onChange={handleChange}
              />
            </label>
            <button
              type="submit"
              className="admin-btn admin-btn-primary"
              disabled={saving}
            >
              {saving ? "Đang lưu..." : "Thêm lịch"}
            </button>
          </form>
        </div>

        <div className="doctor-card">
          <h3 style={{ marginBottom: 12 }}>Lịch sắp tới</h3>
          {loading ? (
            <p>Đang tải...</p>
          ) : schedules.length === 0 ? (
            <p>Chưa có lịch khám.</p>
          ) : (
            <div className="table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Ngày</th>
                    <th>Giờ</th>
                    <th>Phòng khám</th>
                    <th>Đã đặt</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {schedules.map((item) => (
                    <tr key={item.id}>
                      <td>{item.date_display}</td>
                      <td>{item.time}</td>
                      <td>
                        {item.clinic_name}
                        {item.specialty_name
                          ? ` · ${item.specialty_name}`
                          : ""}
                      </td>
                      <td>
                        {item.booked_patients}/{item.max_patients}
                      </td>
                      <td>
                        <button
                          type="button"
                          className="admin-btn admin-btn-danger"
                          onClick={() => handleDelete(item)}
                          disabled={item.booked_patients > 0}
                        >
                          Xóa
                        </button>
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

export default WorkingSchedule;
