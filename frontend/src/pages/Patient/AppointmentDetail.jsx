import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import PatientLayout from "../../components/patient/PatientLayout";
import appointmentService, {
  STATUS_LABEL,
} from "../../services/appointment.service";
import { getApiErrorMessage } from "../../api/axios";

function AppointmentDetail() {
  const { id } = useParams();
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const data = await appointmentService.getAppointmentById(id);
        if (!cancelled) setAppointment(data);
      } catch (error) {
        if (!cancelled) {
          setAppointment(null);
          toast.error(getApiErrorMessage(error, "Không tải được lịch hẹn"));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleCancel = async () => {
    const ok = window.confirm("Bạn có chắc muốn hủy lịch hẹn này?");
    if (!ok) return;

    setCancelling(true);
    try {
      const res = await appointmentService.updateStatus(id, "CANCELLED");
      setAppointment(res.data?.data || null);
      toast.success("Đã hủy lịch hẹn");
      const refreshed = await appointmentService.getAppointmentById(id);
      setAppointment(refreshed);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không hủy được lịch hẹn"));
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <PatientLayout>
        <p>Đang tải...</p>
      </PatientLayout>
    );
  }

  if (!appointment) {
    return (
      <PatientLayout>
        <h3>Không tìm thấy lịch hẹn.</h3>
        <Link to="/patient/appointments" className="btn btn-primary">
          Quay lại
        </Link>
      </PatientLayout>
    );
  }

  const canCancel =
    appointment.status === "PENDING" || appointment.status === "CONFIRMED";

  return (
    <PatientLayout>
      <div className="page-header">
        <div>
          <h1>Chi tiết lịch hẹn</h1>
          <p>
            Mã lịch hẹn: <strong>{appointment.booking_code}</strong>
          </p>
        </div>
        <Link to="/patient/appointments" className="btn btn-outline">
          Quay lại
        </Link>
      </div>

      <div className="booking-card" style={{ marginBottom: 16 }}>
        <h2>Thông tin lịch khám</h2>
        <p>Trạng thái: {STATUS_LABEL[appointment.status]}</p>
        <p>Bác sĩ: {appointment.doctor_name}</p>
        <p>Chuyên khoa: {appointment.specialty}</p>
        <p>Phòng khám: {appointment.clinic}</p>
        <p>Ngày: {appointment.date_display}</p>
        <p>Giờ: {appointment.time}</p>
        <p>Bệnh nhân: {appointment.patient_name}</p>
        <p>Lý do: {appointment.reason || "—"}</p>
        <p>
          Phí khám:{" "}
          {Number(appointment.consultation_fee || 0).toLocaleString("vi-VN")} đ
        </p>
      </div>

      {canCancel && (
        <button
          type="button"
          className="btn btn-outline"
          disabled={cancelling}
          onClick={handleCancel}
        >
          {cancelling ? "Đang hủy..." : "Hủy lịch"}
        </button>
      )}
    </PatientLayout>
  );
}

export default AppointmentDetail;
