import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { ArrowLeft, CalendarDays, Check, ClipboardPlus, Clock3, FileText, Home, Pill, Stethoscope } from "lucide-react";
import axiosClient, { tokenStorage } from "../../api/axios";
import appointmentService from "../../services/appointment.service";
import "../../styles/consultation-ended.css";

function formatDuration(value) {
  if (value == null || value === "") return "Chưa ghi nhận";
  const seconds = Number(value);
  if (!Number.isFinite(seconds) || seconds < 0) return "Chưa ghi nhận";
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes < 1) return `${remainingSeconds} giây`;
  return `${minutes} phút ${remainingSeconds} giây`;
}

export default function ConsultationEnded() {
  const { id } = useParams();
  const location = useLocation();
  const user = tokenStorage.getUser();
  const isDoctor = user?.role?.name === "Doctor";
  const appointmentFromState = location.state?.appointment || null;
  const [session, setSession] = useState(null);
  const [appointment, setAppointment] = useState(appointmentFromState);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const results = await Promise.allSettled([
        axiosClient.get(`/consultations/${id}`),
        appointmentFromState ? Promise.resolve(appointmentFromState) : appointmentService.getAppointmentById(id),
      ]);
      if (cancelled) return;
      const [sessionResult, appointmentResult] = results;
      if (sessionResult.status === "fulfilled") setSession(sessionResult.value.data?.data || null);
      else setError(sessionResult.reason?.response?.data?.message || "Không thể xác nhận trạng thái phiên tư vấn.");
      if (appointmentResult.status === "fulfilled") setAppointment(appointmentResult.value);
      setLoading(false);
    };
    void load();
    return () => { cancelled = true; };
  }, [id, appointmentFromState]);

  const ended = session?.status === "COMPLETED";
  const doctorHref = `/doctor/appointments/${id}`;
  const patientHref = `/patient/appointments/${id}`;
  const doctorRecordHref = `${doctorHref}?consultation=1`;
  const prescriptionHref = `${doctorHref}?consultation=1&prescribe=1`;

  return (
    <main className="consult-ended-page">
      <header className="consult-ended-header">
        <Link to={isDoctor ? "/doctor/appointments" : "/patient/appointments"} aria-label="Quay lại danh sách lịch hẹn"><ArrowLeft size={18} /></Link>
        <span className="consult-ended-brand"><span><Stethoscope size={17} /></span> Booking Care</span>
      </header>
      <section className="consult-ended-content">
        <div className={`consult-ended-check${ended ? " is-success" : " is-pending"}`}>
          {loading ? <Clock3 size={27} /> : ended ? <Check size={29} /> : <FileText size={26} />}
        </div>
        <span className="consult-ended-eyebrow">TƯ VẤN TRỰC TUYẾN</span>
        <h1>{loading ? "Đang tải thông tin phiên" : ended ? "Buổi tư vấn đã kết thúc" : "Chưa xác nhận được kết quả cuộc gọi"}</h1>
        <p className="consult-ended-description">
          {loading
            ? "Đang tải thông tin lịch hẹn và thời lượng tư vấn."
            : ended
              ? isDoctor
                ? "Phiên tư vấn đã được lưu. Lịch hẹn vẫn giữ nguyên trạng thái để bạn tiếp tục xử lý hồ sơ theo quy trình."
                : "Bác sĩ đã kết thúc buổi tư vấn. Lịch hẹn không tự thay đổi trạng thái sau cuộc gọi."
              : error || "Hãy quay lại phòng tư vấn hoặc lịch hẹn để kiểm tra trạng thái phiên."}
        </p>

        <div className="consult-ended-details">
          <div><span><CalendarDays size={16} /> Lịch hẹn</span><strong>{appointment?.date_display || appointment?.work_date || "—"}{appointment?.time ? ` · ${appointment.time}` : ""}</strong></div>
          <div><span><Stethoscope size={16} /> {isDoctor ? "Bệnh nhân" : "Bác sĩ"}</span><strong>{isDoctor ? appointment?.patient_name || "—" : appointment?.doctor_name || "—"}</strong></div>
          <div><span><Clock3 size={16} /> Thời lượng tư vấn</span><strong>{formatDuration(session?.duration_seconds)}</strong></div>
          {appointment?.specialty && <div><span><FileText size={16} /> Chuyên khoa</span><strong>{appointment.specialty}</strong></div>}
        </div>

        {error && !ended && <p className="consult-ended-error" role="alert">{error}</p>}

        {ended && isDoctor ? (
          <div className="consult-ended-actions is-doctor">
            <Link className="consult-ended-primary" to={doctorRecordHref}><ClipboardPlus size={17} /> Lập hồ sơ khám</Link>
            <Link className="consult-ended-secondary" to={prescriptionHref}><Pill size={17} /> Kê đơn thuốc</Link>
            <Link className="consult-ended-text-link" to={doctorHref}>Quay lại lịch hẹn</Link>
          </div>
        ) : ended ? (
          <div className="consult-ended-actions">
            <Link className="consult-ended-primary" to={patientHref}><CalendarDays size={17} /> Xem lịch hẹn</Link>
            <Link className="consult-ended-secondary" to="/"><Home size={17} /> Về trang chủ</Link>
          </div>
        ) : (
          <div className="consult-ended-actions">
            <Link className="consult-ended-primary" to={isDoctor ? doctorHref : patientHref}><CalendarDays size={17} /> Quay lại lịch hẹn</Link>
            <Link className="consult-ended-secondary" to="/"><Home size={17} /> Về trang chủ</Link>
          </div>
        )}
        <span className="consult-ended-footnote">Kết thúc cuộc gọi không tự hoàn tất lịch khám hoặc tạo hồ sơ y tế.</span>
      </section>
    </main>
  );
}
