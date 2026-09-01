import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CalendarDays, Heart, MapPin } from "lucide-react";
import { isBookableDate } from "../../utils/booking";

function SpecialtyDoctorCard({ doctor, schedules = [] }) {
  const navigate = useNavigate();

  const bookableSchedules = useMemo(
    () => schedules.filter((s) => isBookableDate(s.work_date)),
    [schedules],
  );

  const dateOptions = useMemo(() => {
    const map = {};
    for (const slot of bookableSchedules) {
      if (!map[slot.work_date]) {
        map[slot.work_date] = slot.date_display || slot.work_date;
      }
    }
    return Object.keys(map)
      .sort()
      .map((value) => ({ value, label: map[value] }));
  }, [bookableSchedules]);

  const [selectedDate, setSelectedDate] = useState(dateOptions[0]?.value || "");

  useEffect(() => {
    if (!dateOptions.some((d) => d.value === selectedDate)) {
      setSelectedDate(dateOptions[0]?.value || "");
    }
  }, [dateOptions, selectedDate]);

  const slots = useMemo(
    () =>
      bookableSchedules
        .filter((s) => s.work_date === selectedDate)
        .sort((a, b) =>
          String(a.start_time || "").localeCompare(String(b.start_time || "")),
        ),
    [bookableSchedules, selectedDate],
  );

  const fee = Number(doctor.consultation_fee || 0).toLocaleString("vi-VN");
  const bio =
    doctor.biography ||
    [
      doctor.position,
      doctor.degree,
      doctor.experience_years
        ? `${doctor.experience_years} năm kinh nghiệm`
        : null,
      doctor.specialty ? `Chuyên khoa ${doctor.specialty}` : null,
    ]
      .filter(Boolean)
      .join(" · ");

  const handleSelectSlot = (slot) => {
    if (!slot.available) return;
    navigate("/booking", {
      state: {
        doctor: {
          id: doctor.id,
          name: doctor.name,
          avatar: doctor.image || doctor.avatar,
          specialty: doctor.specialty,
          clinic: doctor.clinic,
          consultationFee: doctor.consultation_fee,
        },
        schedule: {
          id: slot.id,
          date: slot.date_display,
          work_date: slot.work_date,
          start: slot.start_time,
          end: slot.end_time,
          time: slot.time,
        },
      },
    });
  };

  return (
    <article className="specialty-booking-card">
      <div className="specialty-booking-left">
        <img
          className="specialty-booking-avatar"
          src={doctor.image || doctor.avatar}
          alt={doctor.name}
        />
        <Link to={`/doctors/${doctor.id}`} className="specialty-booking-more">
          Xem thêm
        </Link>

        <div className="specialty-booking-name-row">
          {Number(doctor.rating) >= 4.5 ? (
            <span className="specialty-fav-badge">
              <Heart size={12} fill="currentColor" />
              Yêu thích
            </span>
          ) : null}
          <Link to={`/doctors/${doctor.id}`} className="specialty-booking-name">
            {doctor.name}
          </Link>
        </div>

        {bio ? <p className="specialty-booking-bio">{bio}</p> : null}

        <p className="specialty-booking-city">
          <MapPin size={14} />
          {doctor.clinic_address || doctor.clinic || "—"}
        </p>
      </div>

      <div className="specialty-booking-right">
        {dateOptions.length > 0 ? (
          <select
            className="specialty-booking-date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          >
            {dateOptions.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        ) : (
          <p className="specialty-booking-empty">Chưa có lịch khám</p>
        )}

        <h4>
          <CalendarDays size={16} />
          LỊCH KHÁM
        </h4>

        <div className="specialty-slot-grid">
          {slots.length === 0 ? (
            <p className="specialty-booking-empty">
              Không có khung giờ trong ngày này.
            </p>
          ) : (
            slots.map((slot) => (
              <button
                key={slot.id}
                type="button"
                className={`specialty-slot${slot.available ? "" : " disabled"}`}
                disabled={!slot.available}
                onClick={() => handleSelectSlot(slot)}
              >
                {slot.time || slot.start_time}
              </button>
            ))
          )}
        </div>

        {slots.length > 0 ? (
          <p className="specialty-slot-note">
            Chọn và đặt (Phí đặt lịch 0đ)
            <br />
            <span>Đây là lịch khám dự kiến (cập nhật theo tuần)</span>
          </p>
        ) : null}

        <div className="specialty-booking-meta">
          <h5>ĐỊA CHỈ KHÁM</h5>
          <Link to={`/clinics/${doctor.clinic_id}`} className="specialty-clinic-link">
            {doctor.clinic}
          </Link>
          <p>{doctor.clinic_address || "—"}</p>
        </div>

        <div className="specialty-booking-meta">
          <h5>
            GIÁ KHÁM: <strong>{fee}đ</strong>
          </h5>
        </div>
      </div>
    </article>
  );
}

export default SpecialtyDoctorCard;
