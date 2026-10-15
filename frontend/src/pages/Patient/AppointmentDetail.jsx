import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, CalendarDays, Star } from "lucide-react";
import toast from "react-hot-toast";
import PatientLayout from "../../components/patient/PatientLayout";
import PatientPrescriptionView from "../../components/patient/PatientPrescriptionView";
import medicalRecordService from "../../services/medical-record.service";
import appointmentService, {
  STATUS_CLASS,
  STATUS_LABEL,
} from "../../services/appointment.service";
import reviewService from "../../services/review.service";
import paymentService from "../../services/payment.service";
import scheduleService from "../../services/schedule.service";
import {
  computeRemainingSeconds,
  formatCountdown,
  canRetryPayment,
  getPaymentBadge,
} from "../../utils/payment";
import { getApiErrorMessage } from "../../api/axios";

function StarRating({ value, onChange, disabled }) {
  const [hover, setHover] = useState(0);

  return (
    <div className="star-rating-input">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={disabled}
          className={`star-btn ${star <= (hover || value) ? "active" : ""}`}
          onMouseEnter={() => !disabled && setHover(star)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(star)}
        >
          <Star
            size={28}
            fill={star <= (hover || value) ? "#f5a623" : "none"}
            color={star <= (hover || value) ? "#f5a623" : "#cbd5e1"}
          />
        </button>
      ))}
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="detail-field-row">
      <span className="detail-field-label">{label}</span>
      <span className="detail-field-value">{value}</span>
    </div>
  );
}

function AppointmentDetail() {
  const { id } = useParams();
  const [appointment, setAppointment] = useState(null);
  const [medicalRecord, setMedicalRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [queuePosition, setQueuePosition] = useState(null);
  const [showReschedule, setShowReschedule] = useState(false);
  const [scheduleOptions, setScheduleOptions] = useState([]);
  const [selectedScheduleId, setSelectedScheduleId] = useState("");
  const [loadingSchedules, setLoadingSchedules] = useState(false);
  const [rescheduling, setRescheduling] = useState(false);

  const [review, setReview] = useState(null);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [editing, setEditing] = useState(false);

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

  useEffect(() => {
    if (!appointment?.queue_number) {
      setQueuePosition(null);
      return;
    }
    let cancelled = false;
    appointmentService.getQueuePosition(appointment.id)
      .then((data) => !cancelled && setQueuePosition(data))
      .catch(() => !cancelled && setQueuePosition(null));
    return () => { cancelled = true; };
  }, [appointment?.id, appointment?.status, appointment?.queue_number]);

  useEffect(() => {
    if (!appointment || appointment.status !== "COMPLETED") {
      setMedicalRecord(null);
      return;
    }

    let cancelled = false;

    async function loadRecord() {
      try {
        const record = await medicalRecordService.getByAppointmentId(
          appointment.id,
        );
        if (!cancelled) setMedicalRecord(record);
      } catch {
        if (!cancelled) setMedicalRecord(null);
      }
    }

    loadRecord();
    return () => {
      cancelled = true;
    };
  }, [appointment]);

  useEffect(() => {
    if (!appointment || appointment.status !== "COMPLETED") return;
    let cancelled = false;

    async function loadReview() {
      setReviewLoading(true);
      try {
        const data = await reviewService.getByAppointment(appointment.id);
        if (!cancelled && data) {
          setReview(data);
          setRating(data.rating);
          setComment(data.comment || "");
        }
      } catch {
        // no review yet
      } finally {
        if (!cancelled) setReviewLoading(false);
      }
    }

    loadReview();
    return () => {
      cancelled = true;
    };
  }, [appointment]);

  const handleCancel = async () => {
    const ok = window.confirm("Bạn có chắc muốn hủy lịch hẹn này?");
    if (!ok) return;

    setCancelling(true);
    try {
      await appointmentService.updateStatus(id, "CANCELLED");
      toast.success("Đã hủy lịch hẹn");
      const refreshed = await appointmentService.getAppointmentById(id);
      setAppointment(refreshed);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không hủy được lịch hẹn"));
    } finally {
      setCancelling(false);
    }
  };

  const handleOpenReschedule = async () => {
    if (showReschedule) {
      setShowReschedule(false);
      return;
    }
    setLoadingSchedules(true);
    try {
      const now = new Date();
      const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
      const result = await scheduleService.getSchedules({
        doctor_id: appointment.doctor_id,
        from_date: today,
        available_only: true,
        page: 1,
        limit: 200,
      });
      const options = result.data.filter((slot) => Number(slot.id) !== Number(appointment.schedule_id));
      setScheduleOptions(options);
      setSelectedScheduleId(options[0]?.id ? String(options[0].id) : "");
      setShowReschedule(true);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không tải được khung giờ còn trống"));
    } finally {
      setLoadingSchedules(false);
    }
  };

  const handleReschedule = async (event) => {
    event.preventDefault();
    if (!selectedScheduleId) return;
    const wasConfirmed = appointment.status === "CONFIRMED";
    setRescheduling(true);
    try {
      const updated = await appointmentService.reschedule(id, Number(selectedScheduleId));
      setAppointment(updated);
      setShowReschedule(false);
      toast.success(wasConfirmed
        ? "Đã gửi yêu cầu đổi lịch. Vui lòng chờ bác sĩ xác nhận lại."
        : "Đã đổi lịch thành công.");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không đổi được lịch hẹn"));
    } finally {
      setRescheduling(false);
    }
  };

  const clinicInvoice = appointment?.clinic_fee_invoice;
  const [retryingPayment, setRetryingPayment] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(() =>
    clinicInvoice
      ? computeRemainingSeconds(clinicInvoice.payment_expires_at)
      : 0,
  );

  useEffect(() => {
    if (
      !clinicInvoice ||
      clinicInvoice.payment_status !== "UNPAID" ||
      appointment?.status !== "PENDING"
    ) {
      setRemainingSeconds(0);
      return;
    }

    setRemainingSeconds(
      computeRemainingSeconds(clinicInvoice.payment_expires_at),
    );

    const interval = setInterval(() => {
      const sec = computeRemainingSeconds(clinicInvoice.payment_expires_at);
      setRemainingSeconds(sec);
      if (sec <= 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [clinicInvoice, appointment?.status]);

  const handleRetryPayment = async () => {
    if (!clinicInvoice?.id) return;
    setRetryingPayment(true);
    try {
      const res = await paymentService.createPaymentUrl(clinicInvoice.id);
      if (res?.payment_url) {
        window.location.assign(res.payment_url);
      } else {
        toast.error("Không nhận được link thanh toán");
      }
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, "Không thể tạo lại link thanh toán"),
      );
    } finally {
      setRetryingPayment(false);
    }
  };

  const handleSubmitReview = async () => {
    if (rating === 0) {
      toast.error("Vui lòng chọn số sao");
      return;
    }

    setSubmitting(true);
    try {
      if (review && editing) {
        const updated = await reviewService.updateReview(review.id, {
          rating,
          comment: comment.trim() || undefined,
        });
        setReview(updated);
        setEditing(false);
        toast.success("Đã cập nhật đánh giá");
      } else {
        const created = await reviewService.createReview({
          appointment_id: appointment.id,
          rating,
          comment: comment.trim() || undefined,
        });
        setReview(created);
        toast.success("Đánh giá thành công");
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không gửi được đánh giá"));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <PatientLayout>
        <div className="patient-content-card">
          <p className="patient-page-loading">Đang tải...</p>
        </div>
      </PatientLayout>
    );
  }

  if (!appointment) {
    return (
      <PatientLayout>
        <div className="patient-content-card">
          <div className="patient-panel-empty">
            <p>Không tìm thấy lịch hẹn.</p>
            <Link to="/patient/appointments" className="patient-detail-back">
              <ArrowLeft size={16} />
              Quay lại
            </Link>
          </div>
        </div>
      </PatientLayout>
    );
  }

  const canCancel =
    appointment.status === "PENDING" || appointment.status === "CONFIRMED";
  const isCompleted = appointment.status === "COMPLETED";
  const statusClass = STATUS_CLASS[appointment.status] || "pending";
  const canRetry = canRetryPayment(clinicInvoice, appointment.status);
  const paymentBadge = getPaymentBadge(clinicInvoice, appointment.status);
  const statusMessage = {
    CONFIRMED: appointment.consultation_type === "ONLINE"
      ? "Lịch tư vấn trực tuyến đã được xác nhận. Bạn có thể vào phòng tư vấn trước giờ hẹn 15 phút."
      : "Lịch khám đã được xác nhận. Vui lòng đến đúng giờ để nhân viên check-in.",
    CHECKED_IN: "Bạn đã check-in và đang chờ được cấp số.",
    WAITING: "Bạn đang chờ khám.",
    CALLED: `Đến lượt bạn. Vui lòng đến ${appointment.room ? `phòng ${appointment.room}` : "phòng khám"}.`,
    IN_PROGRESS: "Bác sĩ đang thực hiện lượt khám của bạn.",
    COMPLETED: "Lượt khám đã hoàn thành.",
    NO_SHOW: "Lịch khám được ghi nhận là không đến.",
  }[appointment.status];

  return (
    <PatientLayout>
      <div className="patient-content-card">
        <div className="patient-content-card-head">
          <h1 className="patient-content-card-title">Chi tiết lịch hẹn</h1>
          <Link to="/patient/appointments" className="patient-detail-back">
            <ArrowLeft size={16} />
            Quay lại
          </Link>
        </div>

        <div className="detail-card">
          <h2>Thông tin lịch khám</h2>
          <DetailRow label="Mã lịch" value={appointment.booking_code} />
          <DetailRow
            label="Trạng thái"
            value={
              <span className={`appointment-status ${statusClass}`}>
                {STATUS_LABEL[appointment.status]}
              </span>
            }
          />
          <DetailRow label="Bác sĩ" value={appointment.doctor_name} />
          <DetailRow label="Hình thức khám" value={appointment.consultation_type === "ONLINE" ? "Tư vấn trực tuyến" : "Trực tiếp tại phòng khám"} />
          <DetailRow label="Chuyên khoa" value={appointment.specialty} />
          <DetailRow label="Phòng khám" value={appointment.clinic} />
          <DetailRow
            label="Thời gian"
            value={`${appointment.date_display} · ${appointment.time}`}
          />
          <DetailRow label="Bệnh nhân" value={appointment.patient_name} />
          <DetailRow label="Lý do" value={appointment.reason || "—"} />
          <DetailRow
            label="Phí khám"
            value={`${Number(appointment.consultation_fee || 0).toLocaleString("vi-VN")} đ`}
          />
        </div>

        {appointment.consultation_type === "ONLINE" && appointment.status === "CONFIRMED" && (
          <div className="detail-card">
            <h2>Buổi tư vấn trực tuyến</h2>
            <p>Phòng tư vấn mở 15 phút trước giờ hẹn. Hãy cho phép trình duyệt sử dụng camera và microphone.</p>
            <Link className="admin-btn admin-btn-primary" to={`/consultations/${appointment.id}`}>Vào phòng tư vấn</Link>
          </div>
        )}

        {statusMessage && (
          <div className="detail-card" aria-live="polite">
            <h2>Tiến trình khám</h2>
            <p>{statusMessage}</p>
            {appointment.consultation_type !== "ONLINE" && queuePosition?.queue_number && (
              <div className="queue-position-summary">
                <DetailRow label="STT của bạn" value={`#${String(queuePosition.queue_number).padStart(2, "0")}`} />
                <DetailRow
                  label="Đang khám / đã gọi"
                  value={queuePosition.current_queue_number ? `#${String(queuePosition.current_queue_number).padStart(2, "0")}` : "Chưa có"}
                />
                <DetailRow label="Còn trước bạn" value={`${queuePosition.people_ahead} người`} />
              </div>
            )}
          </div>
        )}

        {clinicInvoice && (
          <div className="detail-card payment-detail-card">
            <h2>Thông tin thanh toán phí khám</h2>
            <DetailRow
              label="Số tiền"
              value={`${Number(clinicInvoice.amount || 0).toLocaleString("vi-VN")} đ`}
            />
            <DetailRow
              label="Trạng thái thanh toán"
              value={
                paymentBadge && (
                  <span
                    className={`payment-status-badge payment-status-badge--${paymentBadge.className}`}
                  >
                    {paymentBadge.label}
                  </span>
                )
              }
            />
            {canRetry && (
              <DetailRow
                label="Thời gian thanh toán còn lại"
                value={
                  <span className="payment-countdown-text">
                    ⏱ {formatCountdown(remainingSeconds)}
                  </span>
                }
              />
            )}
            {canRetry && (
              <div
                className="patient-detail-actions"
                style={{ marginTop: "16px" }}
              >
                <button
                  type="button"
                  className="patient-profile-primary-btn"
                  disabled={retryingPayment}
                  onClick={handleRetryPayment}
                >
                  {retryingPayment ? "Đang chuyển tiếp..." : "Thanh toán lại"}
                </button>
              </div>
            )}
          </div>
        )}

        {(canCancel || ["PENDING", "CONFIRMED"].includes(appointment.status)) && (
          <div className="patient-detail-actions">
            {["PENDING", "CONFIRMED"].includes(appointment.status) && (
              <button
                type="button"
                className="patient-profile-save-btn appointment-reschedule-trigger"
                disabled={loadingSchedules || rescheduling}
                onClick={handleOpenReschedule}
              >
                <CalendarDays size={16} aria-hidden="true" />
                {loadingSchedules ? "Đang tải khung giờ..." : "Đổi lịch"}
              </button>
            )}
            <button
              type="button"
              className="patient-profile-secondary-btn"
              disabled={cancelling}
              onClick={handleCancel}
            >
              {cancelling ? "Đang hủy..." : "Hủy lịch"}
            </button>
          </div>
        )}

        {showReschedule && (
          <form
            className="detail-card appointment-reschedule-card"
            onSubmit={handleReschedule}
          >
            <div className="appointment-reschedule-heading">
              <span className="appointment-reschedule-icon" aria-hidden="true">
                <CalendarDays size={18} />
              </span>
              <div>
                <h2>Đổi lịch khám</h2>
                <p>Chọn một khung giờ còn trống của bác sĩ này.</p>
              </div>
            </div>

            {appointment.status === "CONFIRMED" && (
              <div className="appointment-reschedule-notice" role="status">
                Bác sĩ cần xác nhận lại khung giờ mới. Sau khi gửi yêu cầu, lịch sẽ ở trạng thái chờ xác nhận.
              </div>
            )}

            {scheduleOptions.length ? (
              <>
                <label className="appointment-reschedule-label" htmlFor="reschedule-slot">
                  Khung giờ mới
                </label>
                <select
                  id="reschedule-slot"
                  className="appointment-reschedule-select"
                  value={selectedScheduleId}
                  onChange={(event) => setSelectedScheduleId(event.target.value)}
                  required
                >
                  {scheduleOptions.map((slot) => (
                    <option key={slot.id} value={slot.id}>
                      {slot.date_display} · {slot.time} · Còn {slot.remaining} chỗ
                    </option>
                  ))}
                </select>
                <div className="patient-detail-actions appointment-reschedule-actions">
                  <button
                    type="button"
                    className="patient-profile-secondary-btn"
                    onClick={() => setShowReschedule(false)}
                    disabled={rescheduling}
                  >
                    Đóng
                  </button>
                  <button
                    type="submit"
                    className="patient-profile-save-btn"
                    disabled={rescheduling || !selectedScheduleId}
                  >
                    {rescheduling ? "Đang cập nhật..." : "Xác nhận đổi lịch"}
                  </button>
                </div>
              </>
            ) : (
              <div className="appointment-reschedule-empty">
                <p>Hiện chưa có khung giờ trống khác cho bác sĩ này.</p>
                <button
                  type="button"
                  className="patient-profile-secondary-btn"
                  onClick={() => setShowReschedule(false)}
                >
                  Đóng
                </button>
              </div>
            )}
          </form>
        )}

        {isCompleted && medicalRecord && (
          <>
            <div className="detail-card">
              <h2>Bệnh án</h2>
              <DetailRow label="Chẩn đoán" value={medicalRecord.diagnosis} />
              <DetailRow label="Kết luận" value={medicalRecord.conclusion} />
              <div className="patient-detail-actions">
                <Link
                  to={`/patient/medical-records/${medicalRecord.id}`}
                  className="patient-profile-secondary-btn"
                >
                  Xem chi tiết bệnh án
                </Link>
              </div>
            </div>

            <PatientPrescriptionView
              medicalRecordId={medicalRecord.id}
              hasPrescription={medicalRecord.has_prescription}
            />
          </>
        )}

        {isCompleted && (
          <div className="review-section">
            <h2>Đánh giá bác sĩ</h2>

            {reviewLoading ? (
              <p className="patient-page-loading">Đang tải đánh giá...</p>
            ) : review && !editing ? (
              <div className="review-display">
                <div className="review-stars-display">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={22}
                      fill={star <= review.rating ? "#f5a623" : "none"}
                      color={star <= review.rating ? "#f5a623" : "#cbd5e1"}
                    />
                  ))}
                  <span className="review-rating-text">
                    {review.rating}/5
                  </span>
                </div>
                {review.comment && (
                  <p className="review-comment">{review.comment}</p>
                )}
                <p className="review-date">
                  Đánh giá lúc:{" "}
                  {new Date(review.created_at).toLocaleDateString("vi-VN")}
                </p>
                <button
                  type="button"
                  className="patient-profile-secondary-btn"
                  onClick={() => setEditing(true)}
                >
                  Sửa đánh giá
                </button>
              </div>
            ) : (
              <div className="review-form">
                <label>Chọn số sao:</label>
                <StarRating
                  value={rating}
                  onChange={setRating}
                  disabled={submitting}
                />

                <label htmlFor="review-comment">
                  Nhận xét (không bắt buộc):
                </label>
                <textarea
                  id="review-comment"
                  className="review-textarea"
                  rows={3}
                  maxLength={2000}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Chia sẻ trải nghiệm của bạn..."
                  disabled={submitting}
                />

                <div className="review-form-actions">
                  <button
                    type="button"
                    className="patient-profile-save-btn"
                    style={{ marginTop: 0 }}
                    disabled={submitting || rating === 0}
                    onClick={handleSubmitReview}
                  >
                    {submitting
                      ? "Đang gửi..."
                      : editing
                        ? "Cập nhật"
                        : "Gửi đánh giá"}
                  </button>
                  {editing && (
                    <button
                      type="button"
                      className="patient-profile-secondary-btn"
                      onClick={() => {
                        setEditing(false);
                        setRating(review.rating);
                        setComment(review.comment || "");
                      }}
                    >
                      Hủy
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </PatientLayout>
  );
}

export default AppointmentDetail;
