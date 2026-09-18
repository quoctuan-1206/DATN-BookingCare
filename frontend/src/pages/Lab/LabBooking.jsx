import { useEffect, useMemo, useState } from "react";
import {
  Calendar,
  CalendarCheck2,
  Check,
  CircleUserRound,
  Clock3,
  FlaskConical,
  Headphones,
  Hospital,
  MapPin,
  Pencil,
  ReceiptText,
  Wallet,
} from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import Header from "../../components/common/Header/Header";
import Footer from "../../components/common/Footer/Footer";
import PatientSelector from "../../components/booking/PatientSelector";
import { useAuth } from "../../context/AuthContext";
import patientProfileService from "../../services/patient-profile.service";
import labService from "../../services/lab.service";
import { getApiErrorMessage } from "../../api/axios";
import { resolveMediaUrl } from "../../utils/media";

const NOTE_MAX = 500;

function formatMoney(value) {
  return `${Number(value || 0).toLocaleString("vi-VN")} VND`;
}

function LabBooking() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const [profiles, setProfiles] = useState([]);
  const [tests, setTests] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [selectedProfileId, setSelectedProfileId] = useState(null);
  const [selectedTestIds, setSelectedTestIds] = useState([]);
  const [selectedClinicId, setSelectedClinicId] = useState(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedScheduleId, setSelectedScheduleId] = useState(null);
  const [patientNote, setPatientNote] = useState("");
  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [completedOrder, setCompletedOrder] = useState(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      toast.error("Vui lòng đăng nhập để đặt lịch xét nghiệm");
      navigate("/login", {
        state: { from: `/lab-booking?${searchParams.toString()}` },
      });
      return;
    }
    const roleName = user.role?.name || user.role;
    if (roleName !== "Patient") {
      toast.error("Chỉ tài khoản bệnh nhân mới có thể đặt lịch xét nghiệm");
      navigate("/lab-tests");
    }
  }, [authLoading, navigate, searchParams, user]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const roleName = user?.role?.name || user?.role;
      if (!user || roleName !== "Patient") return;
      setLoading(true);
      try {
        const [profileData, testData, scheduleResponse] = await Promise.all([
          patientProfileService.getMyProfiles(),
          labService.getPublicTests(),
          labService.getAvailableSchedules({ page: 1, limit: 200 }),
        ]);
        if (cancelled) return;
        const scheduleData = scheduleResponse.data || [];
        const requestedIds = (searchParams.get("test_ids") || "")
          .split(",")
          .map(Number)
          .filter((id) => testData.some((test) => test.id === id));
        const firstSchedule = scheduleData[0];

        setProfiles(profileData);
        setTests(testData);
        setSchedules(scheduleData);
        setSelectedProfileId(profileData[0]?.id || null);
        setSelectedTestIds([...new Set(requestedIds)]);
        setSelectedClinicId(firstSchedule?.clinic_id || null);
        setSelectedDate(firstSchedule?.work_date || "");
        setSelectedScheduleId(firstSchedule?.id || null);
      } catch (error) {
        if (!cancelled) {
          toast.error(
            getApiErrorMessage(
              error,
              "Không tải được thông tin đặt lịch xét nghiệm",
            ),
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [searchParams, user]);

  const selectedTests = useMemo(
    () => tests.filter((test) => selectedTestIds.includes(test.id)),
    [selectedTestIds, tests],
  );
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
      .forEach((schedule) =>
        unique.set(schedule.work_date, schedule.date_display),
      );
    return [...unique.entries()].map(([value, label]) => ({ value, label }));
  }, [schedules, selectedClinicId]);
  const timeSlots = useMemo(
    () =>
      schedules.filter(
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
  const total = selectedTests.reduce(
    (sum, test) => sum + Number(test.price || 0),
    0,
  );
  const canSubmit = Boolean(
    selectedProfile &&
    selectedTests.length > 0 &&
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
      const response = await labService.createPatientOrder({
        patient_id: selectedProfileId,
        lab_schedule_id: selectedScheduleId,
        test_ids: selectedTestIds,
        patient_note: patientNote.trim() || null,
      });
      setCompletedOrder(response.data?.data);
      toast.success("Đặt lịch xét nghiệm thành công");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không đặt được lịch xét nghiệm"));
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) return null;

  return (
    <>
      <Header />
      <main className="section booking-section lab-booking-page">
        <div className="container booking-page">
          {completedOrder ? (
            <section className="booking-success-card lab-booking-success">
              <div className="success-icon">
                <Check size={38} />
              </div>
              <h1>Đặt lịch xét nghiệm thành công</h1>
              <p className="success-message">
                Lịch đã được chuyển tới cơ sở xét nghiệm. Bạn có thể theo dõi
                trạng thái và kết quả trong tài khoản.
              </p>
              <div className="success-info">
                <div className="success-row success-row--highlight">
                  <span>Mã lịch xét nghiệm</span>
                  <strong>{completedOrder.booking_code}</strong>
                </div>
                <div className="success-row">
                  <span>Cơ sở</span>
                  <strong>{completedOrder.schedule?.clinic_name}</strong>
                </div>
                <div className="success-row">
                  <span>Thời gian</span>
                  <strong>
                    {completedOrder.schedule?.date_display} ·{" "}
                    {completedOrder.schedule?.time}
                  </strong>
                </div>
                <div className="success-row">
                  <span>Người xét nghiệm</span>
                  <strong>{completedOrder.patient_name}</strong>
                </div>
                <div className="success-row">
                  <span>Tổng phí tham khảo</span>
                  <strong>{formatMoney(total)}</strong>
                </div>
              </div>
              <div className="success-actions">
                <Link className="btn btn-outline" to="/lab-tests">
                  Xem gói khác
                </Link>
                <Link className="btn btn-primary" to="/patient/lab-orders">
                  Xem lịch của tôi
                </Link>
              </div>
            </section>
          ) : (
            <>
              {loading ? (
                <div className="lab-state">
                  <span className="lab-spinner" />
                  Đang chuẩn bị lịch xét nghiệm...
                </div>
              ) : (
                <div className="booking-board lab-booking-board">
                  <aside className="booking-sidebar">
                    <div className="booking-card booking-doctor lab-booking-package-summary">
                      <div className="booking-doctor-top">
                        {selectedTests[0]?.image ? (
                          <img
                            className="booking-doctor-avatar"
                            src={resolveMediaUrl(selectedTests[0].image)}
                            alt={selectedTests[0].name}
                          />
                        ) : (
                          <div className="booking-doctor-avatar booking-doctor-avatar--fallback">
                            <FlaskConical size={28} />
                          </div>
                        )}
                        <div className="booking-doctor-identity">
                          <h2>Xét nghiệm</h2>
                          <p className="booking-specialty">
                            <FlaskConical size={15} /> {selectedTests.length}{" "}
                            gói đã chọn
                          </p>
                          <p className="booking-clinic">
                            <Hospital size={15} />{" "}
                            {selectedSchedule?.clinic_name || "Chưa chọn cơ sở"}
                          </p>
                        </div>
                      </div>
                      {selectedTests.length === 0 ? (
                        <p>Chưa chọn gói xét nghiệm.</p>
                      ) : (
                        <ul>
                          {selectedTests.map((test) => (
                            <li key={test.id}>
                              <span>{test.name}</span>
                              <strong>{formatMoney(test.price)}</strong>
                            </li>
                          ))}
                        </ul>
                      )}
                      <Link
                        className="btn btn-outline booking-change-doctor"
                        to="/lab-tests"
                      >
                        <Pencil size={14} />
                        Đổi gói xét nghiệm
                      </Link>
                      <div className="booking-meta-list">
                        <div className="booking-meta-chip">
                          <Calendar size={18} />
                          <div>
                            <span>Ngày xét nghiệm</span>
                            <strong>
                              {selectedSchedule?.date_display || "Chưa chọn"}
                            </strong>
                          </div>
                        </div>
                        <div className="booking-meta-chip">
                          <Clock3 size={18} />
                          <div>
                            <span>Khung giờ</span>
                            <strong>
                              {selectedSchedule?.time || "Chưa chọn"}
                            </strong>
                          </div>
                        </div>
                        <div className="booking-meta-chip">
                          <Wallet size={18} />
                          <div>
                            <span>Tổng phí</span>
                            <strong className="booking-price">
                              {formatMoney(total)}
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
                      title="Hồ sơ người xét nghiệm"
                      description="Chọn người sẽ đến cơ sở thực hiện xét nghiệm."
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
                          <p>
                            Hiện chưa có lịch xét nghiệm khả dụng. Vui lòng quay
                            lại sau.
                          </p>
                        </div>
                      ) : (
                        <div className="lab-slot-picker">
                          <div>
                            <label>Cơ sở xét nghiệm</label>
                            <div className="lab-clinic-options">
                              {clinics.map((clinic) => (
                                <button
                                  type="button"
                                  key={clinic.id}
                                  className={
                                    selectedClinicId === clinic.id
                                      ? "active"
                                      : ""
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
                            <label>Ngày xét nghiệm</label>
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
                                    selectedScheduleId === slot.id
                                      ? "active"
                                      : ""
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
                          <p>
                            Nhập thông tin cần lưu ý cho nhân viên xét nghiệm.
                          </p>
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
                            onChange={(event) =>
                              setPatientNote(event.target.value)
                            }
                            placeholder="Ví dụ: cần hỗ trợ khi lấy mẫu..."
                          />
                          <small className="field-counter">
                            {patientNote.length}/{NOTE_MAX}
                          </small>
                        </div>
                      </div>
                      <div className="booking-summary-grid lab-booking-confirm-grid">
                        <div className="summary-item">
                          <CircleUserRound size={16} />
                          <div>
                            <span>Người xét nghiệm</span>
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
                            <span>Ngày xét nghiệm</span>
                            <strong>
                              {selectedSchedule?.date_display || "Chưa chọn"}
                            </strong>
                          </div>
                        </div>
                        <div className="summary-item">
                          <Clock3 size={16} />
                          <div>
                            <span>Khung giờ</span>
                            <strong>
                              {selectedSchedule?.time || "Chưa chọn"}
                            </strong>
                          </div>
                        </div>
                      </div>
                      <div className="booking-fee-row">
                        <span>Tổng phí tham khảo</span>
                        <strong>{formatMoney(total)}</strong>
                      </div>
                      <button
                        type="button"
                        className="btn btn-primary booking-confirm-btn"
                        disabled={!canSubmit}
                        onClick={submit}
                      >
                        <CalendarCheck2 size={18} />
                        {submitting
                          ? "Đang đặt lịch..."
                          : "Xác nhận đặt lịch xét nghiệm"}
                      </button>
                      <label className="confirm-checkbox">
                        <input
                          type="checkbox"
                          checked={agree}
                          onChange={(event) => setAgree(event.target.checked)}
                        />
                        <span>
                          Tôi xác nhận thông tin trên là chính xác và đồng ý với
                          điều khoản sử dụng của hệ thống.
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
                            <p>Chọn đúng người sẽ thực hiện xét nghiệm.</p>
                          </div>
                        </li>
                        <li>
                          <span className="booking-guide-icon">
                            <FlaskConical size={18} />
                          </span>
                          <div>
                            <strong>Chọn gói</strong>
                            <p>Xem mô tả và chọn các gói cần thực hiện.</p>
                          </div>
                        </li>
                        <li>
                          <span className="booking-guide-icon">
                            <Hospital size={18} />
                          </span>
                          <div>
                            <strong>Chọn lịch</strong>
                            <p>Chọn cơ sở, ngày và khung giờ còn chỗ.</p>
                          </div>
                        </li>
                        <li>
                          <span className="booking-guide-icon">
                            <ReceiptText size={18} />
                          </span>
                          <div>
                            <strong>Nhận kết quả</strong>
                            <p>
                              Theo dõi trạng thái và kết quả trong tài khoản.
                            </p>
                          </div>
                        </li>
                      </ol>
                    </div>
                    <div className="booking-card booking-support">
                      <h3>Cần hỗ trợ?</h3>
                      <div className="booking-support-body">
                        <Headphones size={28} />
                        <p>
                          Liên hệ cơ sở nếu bạn cần hướng dẫn chuẩn bị trước xét
                          nghiệm.
                        </p>
                      </div>
                    </div>
                  </aside>
                </div>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

export default LabBooking;
