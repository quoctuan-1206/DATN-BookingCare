import { useNavigate } from "react-router-dom";
import { CalendarDays, Clock3, MapPin, ShieldCheck, Wallet } from "lucide-react";
import { minAdvanceNotice } from "../../utils/booking";

function formatFullDate(ymd) {
  const parts = String(ymd || "").split("-");
  if (parts.length !== 3) return ymd || "—";
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function BookingPanel({ doctor, selectedDate, selectedSchedule }) {
  const navigate = useNavigate();
  const hasSchedule = Boolean(selectedSchedule?.start);

  const handleBook = () => {
    if (!hasSchedule) return;

    navigate("/booking", {
      state: {
        doctor: {
          id: doctor.id,
          name: doctor.name,
          avatar: doctor.image || doctor.avatar,
          specialty: doctor.specialty,
          specialty_id: doctor.specialty_id,
          clinic: doctor.clinic,
          consultationFee: doctor.consultation_fee,
        },
        schedule: {
          id: selectedSchedule.id,
          date: selectedSchedule.date,
          work_date: selectedSchedule.work_date,
          start: selectedSchedule.start,
          end: selectedSchedule.end,
          consultation_type: selectedSchedule.consultation_type || "IN_PERSON",
          time: `${selectedSchedule.start} - ${selectedSchedule.end}`,
        },
      },
    });
  };

  return (
    <section className="booking-panel" aria-labelledby="booking-panel-title">
      <h2 id="booking-panel-title">Đặt lịch khám</h2>

      <ul className="booking-summary">
        <li>
          <CalendarDays size={18} aria-hidden="true" />
          <div>
            <span>Ngày khám</span>
            <strong>{formatFullDate(selectedDate)}</strong>
          </div>
        </li>
        <li>
          <Clock3 size={18} aria-hidden="true" />
          <div>
            <span>Giờ khám</span>
            <strong>
              {selectedSchedule?.start
                ? `${selectedSchedule.start}${selectedSchedule.end ? ` - ${selectedSchedule.end}` : ""}`
                : "Chưa chọn"}
            </strong>
          </div>
        </li>
        <li>
          <Clock3 size={18} aria-hidden="true" />
          <div>
            <span>Hình thức khám</span>
            <strong>
              {selectedSchedule?.consultation_type === "ONLINE"
                ? "Tư vấn trực tuyến"
                : "Trực tiếp"}
            </strong>
          </div>
        </li>
        <li>
          <MapPin size={18} aria-hidden="true" />
          <div>
            <span>Địa điểm</span>
            <strong>{doctor.clinic || "Chưa cập nhật"}</strong>
          </div>
        </li>
        <li>
          <Wallet size={18} aria-hidden="true" />
          <div>
            <span>Giá khám</span>
            <strong className="booking-fee">{doctor.price}</strong>
          </div>
        </li>
      </ul>

      <p className="booking-advance-note">{minAdvanceNotice()}</p>

      <button
        type="button"
        className="btn btn-primary booking-btn"
        disabled={!hasSchedule}
        onClick={handleBook}
      >
        <CalendarDays size={18} aria-hidden="true" />
        Đặt lịch khám
      </button>

      <p className="booking-secure">
        <ShieldCheck size={16} aria-hidden="true" />
        Thông tin của bạn được bảo mật
      </p>
    </section>
  );
}

export default BookingPanel;
