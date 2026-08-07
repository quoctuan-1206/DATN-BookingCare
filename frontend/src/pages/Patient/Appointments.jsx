import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import PatientLayout from "../../components/patient/PatientLayout";
import AppointmentCard from "../../components/patient/AppointmentCard";
import appointmentService from "../../services/appointment.service";
import { getApiErrorMessage } from "../../api/axios";

const tabs = [
  { key: "ALL", label: "Tất cả" },
  { key: "PENDING", label: "Đang chờ" },
  { key: "CONFIRMED", label: "Đã xác nhận" },
  { key: "COMPLETED", label: "Hoàn thành" },
  { key: "CANCELLED", label: "Đã hủy" },
];

function Appointments() {
  const [activeTab, setActiveTab] = useState("ALL");
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page: 1, limit: 50 };
      if (activeTab !== "ALL") params.status = activeTab;
      const result = await appointmentService.getAppointments(params);
      setAppointments(result.data);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không tải được lịch hẹn"));
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  return (
    <PatientLayout>
      <div className="page-header">
        <div>
          <h1>Lịch hẹn</h1>
          <p>Theo dõi và quản lý tất cả lịch khám.</p>
        </div>

        <Link to="/doctors" className="btn btn-primary">
          Đặt lịch mới
        </Link>
      </div>

      <div className="appointment-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={`appointment-tab${
              activeTab === tab.key ? " active" : ""
            }`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="appointment-list">
        {loading ? (
          <p>Đang tải...</p>
        ) : appointments.length > 0 ? (
          appointments.map((appointment) => (
            <AppointmentCard
              key={appointment.id}
              appointment={appointment}
            />
          ))
        ) : (
          <div className="empty-state">
            <h3>Không có lịch hẹn.</h3>
            <p>
              <Link to="/doctors">Đặt lịch khám mới</Link>
            </p>
          </div>
        )}
      </div>
    </PatientLayout>
  );
}

export default Appointments;
