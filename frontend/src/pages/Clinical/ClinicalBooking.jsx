import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Calendar,
  CalendarCheck2,
  Check,
  CircleUserRound,
  Clock3,
  FilePenLine,
  Headphones,
  Hospital,
  MapPin,
  Pencil,
  ReceiptText,
  UserRound,
  Wallet,
} from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import Header from "../../components/common/Header/Header";
import Footer from "../../components/common/Footer/Footer";
import PatientSelector from "../../components/booking/PatientSelector";
import { CLINICAL_TYPE_LABEL } from "../../components/clinical/clinical.constants";
import { useAuth } from "../../context/AuthContext";
import { getApiErrorMessage } from "../../api/axios";
import clinicalService from "../../services/clinical.service";
import patientProfileService from "../../services/patient-profile.service";
import { resolveMediaUrl } from "../../utils/media";

const NOTE_MAX = 500;

function formatMoney(value) {
  return `${Number(value || 0).toLocaleString("vi-VN")} đ`;
}

function ClinicalBooking() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const serviceId = Number(searchParams.get("service_id"));

  const [service, setService] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [selectedProfileId, setSelectedProfileId] = useState(null);
  const [selectedClinicId, setSelectedClinicId] = useState(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedScheduleId, setSelectedScheduleId] = useState(null);
  const [patientNote, setPatientNote] = useState("");
  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [completedOrder, setCompletedOrder] = useState(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      toast.error("Vui lòng đăng nhập để đặt lịch cận lâm sàng");
      navigate("/login", {
        state: { from: `/clinical-booking?${searchParams.toString()}` },
      });
      return;
    }
    const roleName = user.role?.name || user.role;
    if (roleName !== "Patient") {
      toast.error("Chỉ tài khoản bệnh nhân mới có thể tự đặt dịch vụ");
      navigate(`/clinical-services/${serviceId || ""}`);
    }
  }, [authLoading, navigate, searchParams, serviceId, user]);

  useEffect(() => {
    let cancelled = false;

    async function loadBookingData() {
      const roleName = user?.role?.name || user?.role;
      if (!user || roleName !== "Patient") return;
      if (!Number.isInteger(serviceId) || serviceId <= 0) {
        setError("Dịch vụ được chọn không hợp lệ");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");
      try {
        const [profileData, serviceData] = await Promise.all([
          patientProfileService.getMyProfiles(),
          clinicalService.getPublicService(serviceId),
        ]);
        if (serviceData.booking_mode !== "SELF_BOOKING") {
          throw new Error("Dịch vụ này cần bác sĩ chỉ định và không thể tự đặt");
        }
        const scheduleResponse = await clinicalService.getAvailableSchedules({
          service_type: serviceData.service_type,
          page: 1,
          limit: 200,
        });
        if (cancelled) return;

        const scheduleData = scheduleResponse.data || [];
        const firstSchedule = scheduleData[0];
        setService(serviceData);
        setProfiles(profileData);
        setSchedules(scheduleData);
        setSelectedProfileId(profileData[0]?.id || null);
        setSelectedClinicId(firstSchedule?.clinic_id || null);
        setSelectedDate(firstSchedule?.work_date || "");
        setSelectedScheduleId(firstSchedule?.id || null);
      } catch (loadError) {
        if (!cancelled) {
          const message = getApiErrorMessage(
            loadError,
            "Không tải được thông tin đặt lịch",
          );
          setError(message);
          toast.error(message);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadBookingData();
    return () => {
      cancelled = true;
    };
  }, [serviceId, user]);

  const clinics = useMemo(() => {
    const unique = new Map();
    schedules.forEach((schedule) => {
      if (!unique.has(schedule.clinic_id)) {
        unique.set(schedule.clinic_id, {
          id: schedule.clinic_id,
          name: schedule.clinic_name,
          address: schedule.clinic_address,
        });
      }
    });
    return [...unique.values()];
  }, [schedules]);

  const dates = useMemo(() => {
    const unique = new Map();
    schedules
      .filter((schedule) => schedule.clinic_id === selectedClinicId)
      .forEach((schedule) => unique.set(schedule.work_date, schedule.date_display));
    return [...unique.entries()].map(([value, label]) => ({ value, label }));
  }, [schedules, selectedClinicId]);

  const timeSlots = useMemo(
    () => schedules.filter(
      (schedule) =>
        schedule.clinic_id === selectedClinicId &&
        schedule.work_date === selectedDate,
    ),
    [schedules, selectedClinicId, selectedDate],
  );

  const selectedSchedule = schedules.find(
    (schedule) => schedule.id === selectedScheduleId,
  );
  const selectedProfile = profiles.find(
    (profile) => profile.id === selectedProfileId,
  );
  const canSubmit = Boolean(
    service &&
    selectedProfile &&
    selectedSchedule &&
    agree &&
    !submitting,
  );

  const chooseClinic = (clinicId) => {
    const clinicSchedules = schedules.filter(
      (schedule) => schedule.clinic_id === clinicId,
    );
    setSelectedClinicId(clinicId);
    setSelectedDate(clinicSchedules[0]?.work_date || "");
    setSelectedScheduleId(clinicSchedules[0]?.id || null);
  };

  const chooseDate = (workDate) => {
    const firstSlot = schedules.find(
      (schedule) =>
        schedule.clinic_id === selectedClinicId &&
        schedule.work_date === workDate,
    );
    setSelectedDate(workDate);
    setSelectedScheduleId(firstSlot?.id || null);
  };

  const submit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const order = await clinicalService.createPatientOrder({
        patient_id: selectedProfileId,
        schedule_id: selectedScheduleId,
        service_type: service.service_type,
        service_ids: [service.id],
        patient_note: patientNote.trim() || null,
      });
      setCompletedOrder(order);
      toast.success("Đặt lịch cận lâm sàng thành công");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (submitError) {
      toast.error(getApiErrorMessage(submitError, "Không đặt được lịch dịch vụ"));
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) return null;

  return (
    <>
      <Header />
      <main className="section booking-section clinical-booking-page">
        <div className="container booking-page">
          {completedOrder ? (
            <section className="booking-success-card clinical-booking-success">
              <div className="success-icon"><Check size={38} /></div>
              <h1>Đặt lịch thành công</h1>
              <p className="success-message">
                Phiếu dịch vụ đã được gửi đến cơ sở. Bạn có thể theo dõi trạng thái trong tài khoản.
              </p>
              <div className="success-info">
                <div className="success-row success-row--highlight">
                  <span>Mã phiếu</span><strong>{completedOrder.booking_code}</strong>
                </div>
                <div className="success-row">
                  <span>Dịch vụ</span><strong>{service.name}</strong>
                </div>
                <div className="success-row">
                  <span>Cơ sở</span><strong>{completedOrder.schedule?.clinic_name}</strong>
                </div>
                <div className="success-row">
                  <span>Thời gian</span>
                  <strong>{completedOrder.schedule?.date_display} · {completedOrder.schedule?.time}</strong>
                </div>
              </div>
              <div className="success-actions">
                <Link className="btn btn-outline" to="/clinical-services">Xem dịch vụ khác</Link>
                <Link className="btn btn-primary" to="/patient/clinical">Xem phiếu của tôi</Link>
              </div>
            </section>
          ) : loading ? (
            <div className="clinical-public-state">
              <span className="clinical-loading-spinner" />
              <p>Đang chuẩn bị thông tin đặt lịch...</p>
            </div>
          ) : error || !service ? (
            <div className="clinical-public-state clinical-public-state--error">
              <Activity size={34} />
              <h1>Không thể đặt dịch vụ</h1>
              <p>{error || "Dịch vụ không còn khả dụng."}</p>
              <Link className="btn btn-outline" to="/clinical-services">Quay lại danh sách</Link>
            </div>
          ) : (
            <div className="booking-board clinical-booking-board">
              <aside className="booking-sidebar">
                <div className="booking-card booking-doctor clinical-booking-service-summary">
                  <div className="booking-doctor-top">
                    {service.image ? (
                      <img
                        className="booking-doctor-avatar clinical-booking-service-avatar"
                        src={resolveMediaUrl(service.image)}
                        alt={service.name}
                      />
                    ) : (
                      <div className="booking-doctor-avatar booking-doctor-avatar--fallback clinical-booking-service-avatar">
                        <Activity size={28} />
                      </div>
                    )}
                    <div className="booking-doctor-identity">
                      <h2>{service.name}</h2>
                      <p className="booking-specialty">
                        <Activity size={15} />
                        {CLINICAL_TYPE_LABEL[service.service_type] ||
                          service.service_type}
                      </p>
                      <p className="booking-clinic">
                        <Hospital size={15} />
                        {selectedSchedule?.clinic_name || "Chưa chọn cơ sở"}
                      </p>
                    </div>
                  </div>

                  <p className="clinical-booking-service-description">
                    {service.description ||
                      "Dịch vụ cận lâm sàng đang được cung cấp."}
                  </p>

                  <Link
                    className="btn btn-outline booking-change-doctor"
                    to="/clinical-services"
                  >
                    <Pencil size={14} />
                    Đổi dịch vụ
                  </Link>

                  <div className="booking-meta-list">
                    <div className="booking-meta-chip">
                      <Calendar size={18} />
                      <div>
                        <span>Ngày thực hiện</span>
                        <strong>
                          {selectedSchedule?.date_display || "Chưa chọn"}
                        </strong>
                      </div>
                    </div>
                    <div className="booking-meta-chip">
                      <Clock3 size={18} />
                      <div>
                        <span>Khung giờ</span>
                        <strong>{selectedSchedule?.time || "Chưa chọn"}</strong>
                      </div>
                    </div>
                    <div className="booking-meta-chip">
                      <Wallet size={18} />
                      <div>
                        <span>Phí tham khảo</span>
                        <strong className="booking-price">
                          {formatMoney(service.price)}
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>
              </aside>

              <div className="booking-main">
                <PatientSelector
                  patients={profiles}
                  selectedPatientId={selectedProfileId}
                  onSelectPatient={setSelectedProfileId}
                  title="Hồ sơ người thực hiện"
                  description="Chọn người sẽ đến cơ sở thực hiện dịch vụ."
                />

                <section className="booking-card">
                  <div className="booking-card-head">
                    <span className="booking-step-num">2</span>
                    <div>
                      <h2>Chọn cơ sở và thời gian</h2>
                      <p>Chỉ hiển thị các khung giờ còn nhận lịch.</p>
                    </div>
                  </div>
                  {schedules.length === 0 ? (
                    <div className="lab-booking-empty">
                      <Calendar size={28} />
                      <p>Hiện chưa có lịch khả dụng cho dịch vụ này.</p>
                    </div>
                  ) : (
                    <div className="lab-slot-picker">
                      <div>
                        <label>Cơ sở thực hiện</label>
                        <div className="lab-clinic-options">
                          {clinics.map((clinic) => (
                            <button
                              type="button"
                              key={clinic.id}
                              className={
                                selectedClinicId === clinic.id ? "active" : ""
                              }
                              onClick={() => chooseClinic(clinic.id)}
                            >
                              <Hospital size={18} />
                              <span>
                                <strong>{clinic.name}</strong>
                                <small>{clinic.address}</small>
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label>Ngày thực hiện</label>
                        <div className="lab-date-options">
                          {dates.map((date) => (
                            <button
                              type="button"
                              key={date.value}
                              className={
                                selectedDate === date.value ? "active" : ""
                              }
                              onClick={() => chooseDate(date.value)}
                            >
                              <Calendar size={16} />
                              {date.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label>Khung giờ</label>
                        <div className="lab-time-options">
                          {timeSlots.map((slot) => (
                            <button
                              type="button"
                              key={slot.id}
                              className={
                                selectedScheduleId === slot.id ? "active" : ""
                              }
                              onClick={() => setSelectedScheduleId(slot.id)}
                            >
                              <Clock3 size={16} />
                              <strong>{slot.time}</strong>
                              <small>Còn {slot.remaining} chỗ</small>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </section>

                <section className="booking-card">
                  <div className="booking-card-head">
                    <span className="booking-step-num">3</span>
                    <div>
                      <h2>Ghi chú và xác nhận</h2>
                      <p>Kiểm tra thông tin trước khi gửi lịch.</p>
                    </div>
                  </div>
                  <div className="booking-form">
                    <div className="form-group">
                      <label>
                        Ghi chú <small>(không bắt buộc)</small>
                      </label>
                      <textarea
                        maxLength={NOTE_MAX}
                        value={patientNote}
                        onChange={(event) => setPatientNote(event.target.value)}
                        placeholder="Thông tin cần lưu ý cho nhân viên..."
                      />
                      <small className="field-counter">
                        {patientNote.length}/{NOTE_MAX}
                      </small>
                    </div>
                  </div>
                  <div className="booking-summary-grid clinical-booking-summary">
                    <div className="summary-item">
                      <UserRound size={16} />
                      <div>
                        <span>Người thực hiện</span>
                        <strong>
                          {selectedProfile?.fullName ||
                            selectedProfile?.full_name ||
                            "Chưa chọn"}
                        </strong>
                      </div>
                    </div>
                    <div className="summary-item">
                      <MapPin size={16} />
                      <div>
                        <span>Cơ sở</span>
                        <strong>
                          {selectedSchedule?.clinic_name || "Chưa chọn"}
                        </strong>
                      </div>
                    </div>
                    <div className="summary-item">
                      <Calendar size={16} />
                      <div>
                        <span>Ngày thực hiện</span>
                        <strong>
                          {selectedSchedule?.date_display || "Chưa chọn"}
                        </strong>
                      </div>
                    </div>
                    <div className="summary-item">
                      <Clock3 size={16} />
                      <div>
                        <span>Khung giờ</span>
                        <strong>{selectedSchedule?.time || "Chưa chọn"}</strong>
                      </div>
                    </div>
                  </div>
                  <div className="booking-fee-row">
                    <span>Phí tham khảo</span>
                    <strong>{formatMoney(service.price)}</strong>
                  </div>
                  <button
                    type="button"
                    className="btn btn-primary booking-confirm-btn"
                    disabled={!canSubmit}
                    onClick={submit}
                  >
                    <CalendarCheck2 size={18} />
                    {submitting ? "Đang đặt lịch..." : "Xác nhận đặt lịch"}
                  </button>
                  <label className="confirm-checkbox">
                    <input
                      type="checkbox"
                      checked={agree}
                      onChange={(event) => setAgree(event.target.checked)}
                    />
                    <span>
                      Tôi xác nhận thông tin trên là chính xác và đồng ý với
                      điều khoản sử dụng.
                    </span>
                  </label>
                </section>
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
                        <strong>Chọn hồ sơ</strong>
                        <p>Chọn đúng người sẽ thực hiện dịch vụ.</p>
                      </div>
                    </li>
                    <li>
                      <span className="booking-guide-icon">
                        <CalendarCheck2 size={18} />
                      </span>
                      <div>
                        <strong>Chọn lịch</strong>
                        <p>Chọn cơ sở, ngày và khung giờ còn chỗ.</p>
                      </div>
                    </li>
                    <li>
                      <span className="booking-guide-icon">
                        <FilePenLine size={18} />
                      </span>
                      <div>
                        <strong>Thêm ghi chú</strong>
                        <p>Cung cấp thông tin cần lưu ý cho nhân viên.</p>
                      </div>
                    </li>
                    <li>
                      <span className="booking-guide-icon">
                        <ReceiptText size={18} />
                      </span>
                      <div>
                        <strong>Theo dõi phiếu</strong>
                        <p>Xem trạng thái và kết quả trong tài khoản.</p>
                      </div>
                    </li>
                  </ol>
                </div>

                <div className="booking-card booking-support">
                  <h3>Cần hỗ trợ?</h3>
                  <div className="booking-support-body">
                    <Headphones size={28} />
                    <p>
                      Liên hệ cơ sở nếu bạn cần hướng dẫn chuẩn bị trước khi thực
                      hiện dịch vụ.
                    </p>
                  </div>
                </div>
              </aside>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

export default ClinicalBooking;
