import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Activity,
  Calendar,
  CalendarCheck2,
  CalendarDays,
  CircleUserRound,
  Clock,
  FilePenLine,
  Headphones,
  Hospital,
  Pencil,
  UserRound,
  Wallet,
} from "lucide-react";
import toast from "react-hot-toast";

import Header from "../../components/common/Header/Header";
import Footer from "../../components/common/Footer/Footer";
import PatientSelector from "../../components/booking/PatientSelector";
import { useAuth } from "../../context/AuthContext";
import patientProfileService from "../../services/patient-profile.service";
import appointmentService from "../../services/appointment.service";
import paymentService from "../../services/payment.service";
import { doctorService } from "../../services/doctor.service";
import { getApiErrorMessage } from "../../api/axios";
import { isBookableDate } from "../../utils/booking";

const REASON_MAX = 500;
const NOTE_MAX = 300;

function formatMoney(v) {
  return `${Number(v || 0).toLocaleString("vi-VN")} VND`;
}

function Booking() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const incoming = location.state;
  const initialDoctor = incoming?.doctor;
  const schedule = incoming?.schedule;
  const [doctor, setDoctor] = useState(initialDoctor);

  useEffect(() => {
    setDoctor(incoming?.doctor);
  }, [incoming?.doctor]);

  useEffect(() => {
    const docId = initialDoctor?.id || initialDoctor?.doctor_id;
    if (!docId) return;
    let cancelled = false;
    doctorService.getDoctorById(docId).then((fresh) => {
      if (cancelled || !fresh) return;
      setDoctor((prev) => ({
        ...prev,
        ...fresh,
        consultationFee: fresh.consultation_fee ?? fresh.consultationFee ?? prev?.consultationFee,
      }));
    }).catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [initialDoctor?.id, initialDoctor?.doctor_id]);

  const [patients, setPatients] = useState([]);
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [agree, setAgree] = useState(false);
  const [formData, setFormData] = useState({ reason: "", note: "" });

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      toast.error("Vui lòng đăng nhập để đặt lịch");
      navigate("/login", { state: { from: "/booking", booking: incoming } });
      return;
    }
    const roleName = user.role?.name || user.role;
    if (roleName && roleName !== "Patient") {
      toast.error("Chỉ tài khoản bệnh nhân mới đặt lịch được");
      navigate("/");
    }
  }, [authLoading, user, navigate, incoming]);

  useEffect(() => {
    let cancelled = false;
    async function loadProfiles() {
      const roleName = user?.role?.name || user?.role;
      if (!user || roleName !== "Patient") return;
      setLoadingPatients(true);
      try {
        const list = await patientProfileService.getMyProfiles();
        if (cancelled) return;
        setPatients(list);
        setSelectedPatientId(list[0]?.id || null);
      } catch (error) {
        if (!cancelled)
          toast.error(getApiErrorMessage(error, "Không tải được hồ sơ"));
      } finally {
        if (!cancelled) setLoadingPatients(false);
      }
    }
    loadProfiles();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const selectedPatient = useMemo(
    () => patients.find((p) => p.id === selectedPatientId) || patients[0],
    [patients, selectedPatientId],
  );

  const canSubmit =
    !!selectedPatient &&
    formData.reason.trim().length > 0 &&
    agree &&
    !submitting;

  const handleFieldChange = (name, max) => (event) => {
    const value = event.target.value.slice(0, max);
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleConfirm = async () => {
    if (!doctor?.id || !schedule?.id) {
      toast.error("Thiếu thông tin bác sĩ hoặc lịch khám");
      return;
    }
    if (!selectedPatient?.id) {
      toast.error("Vui lòng chọn hồ sơ bệnh nhân");
      return;
    }
    if (!formData.reason.trim()) {
      toast.error("Vui lòng nhập lý do khám");
      return;
    }
    if (!agree) {
      toast.error("Vui lòng xác nhận thông tin trước khi đặt lịch");
      return;
    }

    const workDate = schedule.work_date || schedule.date;
    if (!isBookableDate(workDate)) {
      toast.error("Phải đặt lịch trước ít nhất 3 ngày");
      return;
    }

    setSubmitting(true);
    try {
      const reason = formData.note.trim()
        ? `${formData.reason.trim()}\nGhi chú: ${formData.note.trim()}`
        : formData.reason.trim();

      const res = await appointmentService.createAppointment({
        schedule_id: schedule.id,
        patient_profile_id: selectedPatient.id,
        reason,
      });

      const a = res.data?.data;
      const invoiceId = a?.clinic_fee_invoice?.id;

      if (invoiceId) {
        try {
          const paymentData = await paymentService.createPaymentUrl(invoiceId);
          if (paymentData?.payment_url) {
            window.location.assign(paymentData.payment_url);
            return;
          }
        } catch (paymentErr) {
          toast.error(
            "Không thể tạo link thanh toán tự động, vui lòng thanh toán trong chi tiết lịch hẹn",
          );
        }
      }

      navigate("/booking/success", {
        replace: true,
        state: {
          booking: {
            bookingCode: a?.booking_code,
            appointmentId: a?.id,
            invoiceId,
            doctorName: a?.doctor_name || doctor.name,
            specialty: a?.specialty || doctor.specialty,
            clinic: a?.clinic || doctor.clinic,
            date: a?.date_display || schedule.date,
            time: a?.time || schedule.time,
            patient: a?.patient_name || selectedPatient.fullName,
            fee: formatMoney(a?.consultation_fee ?? doctor.consultationFee),
            reason: formData.reason.trim(),
            note: formData.note.trim(),
          },
        },
      });
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Đặt lịch thất bại"));
    } finally {
      setSubmitting(false);
    }
  };

  if (!doctor || !schedule) {
    return (
      <>
        <Header />
        <section className="section">
          <div className="container">
            <h1>Thiếu thông tin đặt lịch</h1>
            <p>Vui lòng chọn bác sĩ và khung giờ trước.</p>
            <Link to="/doctors" className="btn btn-primary">
              Chọn bác sĩ
            </Link>
          </div>
        </section>
        <Footer />
      </>
    );
  }

  const dv = {
    ...doctor,
    consultationFee: doctor?.consultationFee ?? doctor?.consultation_fee ?? 0,
  };

  const patientName =
    selectedPatient?.fullName || selectedPatient?.full_name || "—";

  const specialtyPath = dv.specialty_id
    ? `/specialties/${dv.specialty_id}`
    : "/specialties";

  return (
    <>
      <Header />

      <section className="section booking-section">
        <div className="container booking-page">
          <div className="booking-board">
            <aside className="booking-sidebar">
              <div className="booking-card booking-doctor">
                <div className="booking-doctor-top">
                  {dv.avatar ? (
                    <img
                      src={dv.avatar}
                      alt={dv.name}
                      className="booking-doctor-avatar"
                    />
                  ) : (
                    <div className="booking-doctor-avatar booking-doctor-avatar--fallback">
                      <UserRound size={28} />
                    </div>
                  )}
                  <div className="booking-doctor-identity">
                    <h2>{dv.name}</h2>
                    <p className="booking-specialty">
                      <Activity size={15} /> {dv.specialty}
                    </p>
                    <p className="booking-clinic">
                      <Hospital size={15} /> {dv.clinic}
                    </p>
                  </div>
                </div>

                <Link
                  to={specialtyPath}
                  className="btn btn-outline booking-change-doctor"
                >
                  <Pencil size={14} /> Đổi bác sĩ
                </Link>

                <div className="booking-meta-list">
                  <div className="booking-meta-chip">
                    <Calendar size={18} />
                    <div>
                      <span>Ngày khám</span>
                      <strong>{schedule.date}</strong>
                    </div>
                  </div>
                  <div className="booking-meta-chip">
                    <Clock size={18} />
                    <div>
                      <span>Khung giờ</span>
                      <strong>{schedule.time}</strong>
                    </div>
                  </div>
                  <div className="booking-meta-chip">
                    <Wallet size={18} />
                    <div>
                      <span>Phí khám</span>
                      <strong className="booking-price">
                        {formatMoney(dv.consultationFee)}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>
            </aside>

            <div className="booking-main">
              <PatientSelector
                patients={patients}
                selectedPatientId={selectedPatientId}
                onSelectPatient={setSelectedPatientId}
                loading={loadingPatients}
              />

              <div className="booking-card">
                <div className="booking-card-head">
                  <span className="booking-step-num">2</span>
                  <div>
                    <h2>Thông tin khám bệnh</h2>
                  </div>
                </div>
                <div className="booking-form">
                  <div className="form-group">
                    <label>
                      Lý do khám <span>*</span>
                    </label>
                    <textarea
                      name="reason"
                      rows="4"
                      maxLength={REASON_MAX}
                      placeholder="Ví dụ: Ho kéo dài, đau đầu, sốt cao..."
                      value={formData.reason}
                      onChange={handleFieldChange("reason", REASON_MAX)}
                    />
                    <small className="field-counter">
                      {formData.reason.length}/{REASON_MAX}
                    </small>
                  </div>
                  <div className="form-group">
                    <label>Ghi chú thêm</label>
                    <textarea
                      name="note"
                      rows="3"
                      maxLength={NOTE_MAX}
                      placeholder="Thông tin bổ sung cho bác sĩ (nếu có)..."
                      value={formData.note}
                      onChange={handleFieldChange("note", NOTE_MAX)}
                    />
                    <small className="field-counter">
                      {formData.note.length}/{NOTE_MAX}
                    </small>
                  </div>
                </div>
              </div>

              <div className="booking-card">
                <div className="booking-card-head">
                  <span className="booking-step-num">3</span>
                  <div>
                    <h2>Xác nhận thông tin</h2>
                  </div>
                </div>

                <div className="booking-summary-grid">
                  <div className="summary-item">
                    <UserRound size={16} />
                    <div>
                      <span>Bệnh nhân</span>
                      <strong>{patientName}</strong>
                    </div>
                  </div>
                  <div className="summary-item">
                    <Calendar size={16} />
                    <div>
                      <span>Ngày khám</span>
                      <strong>{schedule.date}</strong>
                    </div>
                  </div>
                  <div className="summary-item">
                    <UserRound size={16} />
                    <div>
                      <span>Bác sĩ</span>
                      <strong>{dv.name}</strong>
                    </div>
                  </div>
                  <div className="summary-item">
                    <Clock size={16} />
                    <div>
                      <span>Khung giờ</span>
                      <strong>{schedule.time}</strong>
                    </div>
                  </div>
                  <div className="summary-item">
                    <Activity size={16} />
                    <div>
                      <span>Chuyên khoa</span>
                      <strong>{dv.specialty}</strong>
                    </div>
                  </div>
                  <div className="summary-item">
                    <Activity size={16} />
                    <div>
                      <span>Lý do khám</span>
                      <strong>{formData.reason.trim() || "—"}</strong>
                    </div>
                  </div>
                  <div className="summary-item">
                    <Hospital size={16} />
                    <div>
                      <span>Phòng khám</span>
                      <strong>{dv.clinic}</strong>
                    </div>
                  </div>
                  <div className="summary-item">
                    <Wallet size={16} />
                    <div>
                      <span>Thanh toán</span>
                      <strong>Tại phòng</strong>
                    </div>
                  </div>
                </div>

                <div className="booking-fee-row">
                  <span>Phí khám</span>
                  <strong>{formatMoney(dv.consultationFee)}</strong>
                </div>

                <button
                  type="button"
                  className="btn btn-primary booking-confirm-btn"
                  disabled={!canSubmit}
                  onClick={handleConfirm}
                >
                  <CalendarDays size={18} />
                  {submitting ? "Đang đặt..." : "Xác nhận đặt lịch"}
                </button>

                <label className="confirm-checkbox">
                  <input
                    type="checkbox"
                    checked={agree}
                    onChange={(e) => setAgree(e.target.checked)}
                  />
                  <span>
                    Tôi xác nhận thông tin trên là chính xác và đồng ý với điều
                    khoản sử dụng của hệ thống.
                  </span>
                </label>
              </div>
            </div>

            <aside className="booking-aside">
              <div className="booking-card booking-guide">
                <h3>Hướng dẫn</h3>
                <ol className="booking-guide-list">
                  <li>
                    <span className="booking-guide-icon">
                      <CircleUserRound size={18} />
                    </span>
                    <div>
                      <strong>Chọn hồ sơ bệnh nhân</strong>
                      <p>Chọn người sẽ đi khám trong lần đặt lịch.</p>
                    </div>
                  </li>
                  <li>
                    <span className="booking-guide-icon">
                      <FilePenLine size={18} />
                    </span>
                    <div>
                      <strong>Nhập thông tin khám</strong>
                      <p>Mô tả lý do khám để bác sĩ chuẩn bị trước.</p>
                    </div>
                  </li>
                  <li>
                    <span className="booking-guide-icon">
                      <CalendarCheck2 size={18} />
                    </span>
                    <div>
                      <strong>Xác nhận thông tin</strong>
                      <p>Kiểm tra lại thông tin và xác nhận đặt lịch.</p>
                    </div>
                  </li>
                  <li>
                    <span className="booking-guide-icon">
                      <Clock size={18} />
                    </span>
                    <div>
                      <strong>Chờ xác nhận</strong>
                      <p>Bác sĩ sẽ xác nhận lịch hẹn của bạn.</p>
                    </div>
                  </li>
                </ol>
              </div>

              <div className="booking-card booking-support">
                <h3>Cần hỗ trợ?</h3>
                <div className="booking-support-body">
                  <Headphones size={28} />
                  <p>
                    Liên hệ qua hotline hoặc chat để được hỗ trợ nhanh chóng.
                  </p>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
}

export default Booking;
