import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Star } from "lucide-react";
import toast from "react-hot-toast";
import PatientLayout from "../../components/patient/PatientLayout";
import appointmentService, {
  STATUS_LABEL,
} from "../../services/appointment.service";
import reviewService from "../../services/review.service";
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

function AppointmentDetail() {
  const { id } = useParams();
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

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
  const isCompleted = appointment.status === "COMPLETED";

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

      {isCompleted && (
        <div className="review-section">
          <h2>Đánh giá bác sĩ</h2>

          {reviewLoading ? (
            <p>Đang tải đánh giá...</p>
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
                className="btn btn-outline btn-sm"
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

              <label htmlFor="review-comment">Nhận xét (không bắt buộc):</label>
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
                  className="btn btn-primary"
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
                    className="btn btn-outline"
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
    </PatientLayout>
  );
}

export default AppointmentDetail;
