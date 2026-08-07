import { Link } from "react-router-dom";
import { useState } from "react";

function BookingConfirm({
  doctor,
  schedule,
  patient,
  formData,
  embedded = false,
  submitting = false,
  onConfirm,
}) {
  const [agree, setAgree] = useState(false);

  const handleConfirm = (e) => {
    e.preventDefault();

    if (!agree) {
      alert("Vui lòng xác nhận thông tin trước khi đặt lịch.");
      return;
    }

    if (!formData.reason.trim()) {
      alert("Vui lòng nhập lý do khám.");
      return;
    }

    onConfirm?.();
  };

  const content = (
    <div className="booking-confirm">
      {!embedded && <h2>Xác nhận đặt lịch</h2>}

      <label className="confirm-checkbox">
        <input
          type="checkbox"
          checked={agree}
          onChange={(e) => setAgree(e.target.checked)}
        />

        <span>
          Tôi xác nhận thông tin chính xác và đồng ý với điều khoản sử dụng của
          hệ thống.
        </span>
      </label>

      <div className="booking-actions">
        <Link
          to={`/doctors/${doctor.id || 1}`}
          className="btn btn-outline"
        >
          Quay lại
        </Link>

        <button
          type="button"
          className={`btn btn-primary ${!agree || submitting ? "disabled" : ""}`}
          disabled={!agree || submitting || !patient}
          onClick={handleConfirm}
        >
          {submitting ? "Đang đặt..." : "Xác nhận đặt lịch"}
        </button>
      </div>
    </div>
  );

  if (embedded) return content;

  return <div className="booking-card">{content}</div>;
}

export default BookingConfirm;
