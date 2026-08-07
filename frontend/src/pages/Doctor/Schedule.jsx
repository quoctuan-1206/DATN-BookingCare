import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import DoctorLayout from "../../components/doctor-dashboard/layout/DoctorLayout";
import scheduleService from "../../services/schedule.service";
import { getApiErrorMessage } from "../../api/axios";
import { useAuth } from "../../context/AuthContext";

function Schedule() {
  const { user } = useAuth();
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);

  const today = new Date().toISOString().slice(0, 10);

  const load = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const result = await scheduleService.getSchedules({
        doctor_id: user.id,
        work_date: today,
        limit: 50,
      });
      setSchedules(result.data);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không tải được lịch hôm nay"));
      setSchedules([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id, today]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <DoctorLayout title="Lịch hôm nay">
      <div className="doctor-page">
        <div className="doctor-card">
          <h3 style={{ marginBottom: 8 }}>Lịch khám ngày {today}</h3>
          {loading ? (
            <p>Đang tải...</p>
          ) : schedules.length === 0 ? (
            <p>Hôm nay chưa có khung giờ khám.</p>
          ) : (
            <div className="table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Giờ</th>
                    <th>Phòng khám</th>
                    <th>Chuyên khoa</th>
                    <th>Đã đặt / Tối đa</th>
                    <th>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {schedules.map((item) => (
                    <tr key={item.id}>
                      <td>{item.time}</td>
                      <td>{item.clinic_name}</td>
                      <td>{item.specialty_name}</td>
                      <td>
                        {item.booked_patients}/{item.max_patients}
                      </td>
                      <td>
                        <span
                          className={`status ${
                            item.available ? "confirmed" : "cancelled"
                          }`}
                        >
                          {item.available ? "Còn chỗ" : "Hết chỗ"}
                        </span>
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

export default Schedule;
