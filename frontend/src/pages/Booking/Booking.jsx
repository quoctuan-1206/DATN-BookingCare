import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Calendar,
  CalendarDays,
  ChevronLeft,
  Clock,
  Hospital,
  Stethoscope,
} from "lucide-react";
import toast from "react-hot-toast";

import Header from "../../components/common/Header/Header";
import Footer from "../../components/common/Footer/Footer";
import { useAuth } from "../../context/AuthContext";
import patientProfileService from "../../services/patient-profile.service";
import appointmentService from "../../services/appointment.service";
import { getApiErrorMessage } from "../../api/axios";
import { isBookableDate, minAdvanceNotice } from "../../utils/booking";

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
  const doctor = incoming?.doctor;
  const schedule = incoming?.schedule;

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
      navigate("/booking/success", {
        replace: true,
        state: {
          booking: {
            bookingCode: a?.booking_code,
            appointmentId: a?.id,
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
    consultationFee: doctor.consultationFee ?? doctor.consultation_fee ?? 0,
  };

  return (
    <>
      <Header />

      <section className="section booking-section">
        <div className="container booking-page">
          <div className="booking-board">
            <aside className="booking-col booking-col--doctor">
              <h1>Đặt lịch khám</h1>
              <p className="booking-advance-note">{minAdvanceNotice()}</p>
              <div className="booking-card booking-doctor">
                <div className="booking-doctor-top">
                  <img
                    src={dv.avatar}
                    alt={dv.name}
                    className="booking-doctor-avatar"
                  />
                  <div className="booking-doctor-identity">
                    <h2>{dv.name}</h2>
                    <p className="booking-specialty">
                      <Stethoscope size={15} /> {dv.specialty}
                    </p>
                    <p className="booking-clinic">
                      <Hospital size={15} /> {dv.clinic}
                    </p>
                  </div>
                </div>

                <div className="booking-doctor-meta">
                  <div className="booking-meta-chip">
                    <Calendar size={15} />
                    <div>
                      <span>Ngày khám</span>
                      <strong>{schedule.date}</strong>
                    </div>
                  </div>
                  <div className="booking-meta-chip">
                    <Clock size={15} />
                    <div>
                      <span>Khung giờ</span>
                      <strong>{schedule.time}</strong>
                    </div>
                  </div>
                </div>

                <div className="booking-price-row">
                  <span>Phí khám</span>
                  <strong className="booking-price">
                    {formatMoney(dv.consultationFee)}
                  </strong>
                </div>
              </div>
            </aside>

            <div className="booking-card booking-col booking-col--patient">
              <div className="booking-card-head">
                <h2>Hồ sơ bệnh nhân</h2>
                <p>Chọn người sẽ đi khám trong lần đặt lịch này.</p>
              </div>

              {loadingPatients ? (
                <p>Đang tải hồ sơ...</p>
              ) : patients.length === 0 ? (
                <div>
                  <p>Chưa có hồ sơ. Vui lòng thêm hồ sơ trước.</p>
                  <Link
                    to="/patient/profiles"
                    className="btn btn-primary"
                    style={{ marginTop: 12 }}
                  >
                    Thêm hồ sơ
                  </Link>
                </div>
              ) : (
                <div className="patient-list">
                  {patients.map((p) => (
                    <label
                      key={p.id}
                      className={`patient-card ${
                        selectedPatientId === p.id ? "active" : ""
                      }`}
                    >
                      <input
                        type="radio"
                        name="patient"
                        checked={selectedPatientId === p.id}
                        onChange={() => setSelectedPatientId(p.id)}
                      />
                      <div className="patient-info">
                        <div className="patient-info-top">
                          <h3>{p.fullName || p.full_name}</h3>
                          <span className="patient-badge">
                            {p.relationship_label || p.relationship}
                          </span>
                        </div>
                        <div className="patient-meta">
                          <span>{p.gender_label || p.gender || "—"}</span>
                          <span>{p.dateOfBirth || p.date_of_birth || "—"}</span>
                          <span>{p.phone || "—"}</span>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}

              <Link
                to="/patient/profiles"
                className="btn btn-outline add-patient-btn"
              >
                + Quản lý hồ sơ
              </Link>
            </div>

            <div className="booking-card booking-col">
              <div className="booking-card-head">
                <h2>Thông tin khám bệnh</h2>
                <p>Mô tả ngắn triệu chứng để bác sĩ chuẩn bị trước.</p>
              </div>
              <div className="booking-form">
                <div className="form-group">
                  <label>
                    Lý do khám <span>*</span>
                  </label>
                  <textarea
                    name="reason"
                    rows="6"
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
                    rows="4"
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

            <div className="booking-card booking-col">
              <div className="booking-card-head">
                <h2>Xác nhận thông tin</h2>
                <p>Kiểm tra lại thông tin trước khi đặt lịch.</p>
              </div>

              <div className="booking-summary">
                <div className="summary-row">
                  <span>Bệnh nhân</span>
                  <strong>
                    {selectedPatient?.fullName ||
                      selectedPatient?.full_name ||
                      "—"}
                  </strong>
                </div>
                <div className="summary-row">
                  <span>Bác sĩ</span>
                  <strong>{dv.name}</strong>
                </div>
                <div className="summary-row">
                  <span>Chuyên khoa</span>
                  <strong>{dv.specialty}</strong>
                </div>
                <div className="summary-row">
                  <span>Phòng khám</span>
                  <strong>{dv.clinic}</strong>
                </div>
                <div className="summary-row">
                  <span>Ngày khám</span>
                  <strong>{schedule.date}</strong>
                </div>
                <div className="summary-row">
                  <span>Khung giờ</span>
                  <strong>{schedule.time}</strong>
                </div>
                <div className="summary-row">
                  <span>Lý do khám</span>
                  <strong>{formData.reason.trim() || "—"}</strong>
                </div>
                <div className="summary-row">
                  <span>Thanh toán</span>
                  <strong>Tại phòng khám</strong>
                </div>
                <div className="summary-row total">
                  <span>Phí khám</span>
                  <strong>{formatMoney(dv.consultationFee)}</strong>
                </div>
              </div>

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

            <div className="booking-col booking-col--actions">
              <Link
                to={`/doctors/${dv.id || ""}`}
                className="btn btn-outline booking-action-back"
              >
                <ChevronLeft size={16} /> Chọn lại bác sĩ
              </Link>

              <button
                type="button"
                className="btn btn-primary booking-action-submit"
                disabled={!canSubmit}
                onClick={handleConfirm}
              >
                <CalendarDays size={16} />
                {submitting ? "Đang đặt..." : "Xác nhận đặt lịch"}
              </button>
            </div>
          </div>

        </div>
      </section>
      <Footer />
    </>
  );
}

export default Booking;
