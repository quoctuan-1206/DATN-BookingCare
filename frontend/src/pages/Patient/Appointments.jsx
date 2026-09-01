import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, Plus } from "lucide-react";
import toast from "react-hot-toast";
import PatientLayout from "../../components/patient/PatientLayout";
import DashboardAppointmentItem from "../../components/patient/DashboardAppointmentItem";
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
      <div className="patient-content-card">
        <div className="patient-content-card-head">
          <h1 className="patient-content-card-title">Lịch hẹn</h1>
          <Link to="/doctors" className="patient-content-card-action">
            <Plus size={16} />
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

        <div className="patient-content-card-body">
          {loading ? (
            <p className="patient-page-loading">Đang tải...</p>
          ) : appointments.length > 0 ? (
            <div className="dashboard-appointment-list">
              {appointments.map((appointment) => (
                <DashboardAppointmentItem
                  key={appointment.id}
                  appointment={appointment}
                />
              ))}
            </div>
          ) : (
            <div className="patient-panel-empty">
              <CalendarDays size={48} strokeWidth={1.75} />
              <p>Không có lịch hẹn</p>
              <Link to="/doctors" className="patient-profile-save-btn">
                Đặt lịch khám mới
              </Link>
            </div>
          )}
        </div>
      </div>
    </PatientLayout>
  );
}

export default Appointments;
