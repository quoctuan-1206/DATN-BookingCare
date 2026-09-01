import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { ChevronRight, Home } from "lucide-react";

import Header from "../../components/common/Header/Header";
import Footer from "../../components/common/Footer/Footer";

import DoctorProfile from "../../components/doctor/DoctorProfile";
import DoctorBiography from "../../components/doctor/DoctorBiography";
import DoctorSchedule from "../../components/doctor/DoctorSchedule";
import DoctorReview from "../../components/doctor/DoctorReview";
import BookingPanel from "../../components/doctor/BookingPanel";
import doctorService from "../../services/doctor.service";
import scheduleService from "../../services/schedule.service";
import { getApiErrorMessage } from "../../api/axios";
import { getMinBookingDateYMD } from "../../utils/booking";

function DoctorDetail() {
  const { id } = useParams();
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateOptions, setDateOptions] = useState([]);
  const [schedulesByDate, setSchedulesByDate] = useState({});
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSchedule, setSelectedSchedule] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const [doctorData, scheduleMap] = await Promise.all([
          doctorService.getDoctorById(id),
          scheduleService.getDoctorScheduleMap(id, {
            from_date: getMinBookingDateYMD(),
          }),
        ]);

        if (cancelled) return;

        setDoctor(doctorData);
        setDateOptions(scheduleMap.dateOptions);
        setSchedulesByDate(scheduleMap.byDate);
        setSelectedDate(scheduleMap.dateOptions[0]?.value || "");
        setSelectedSchedule(null);
      } catch (error) {
        if (!cancelled) {
          setDoctor(null);
          setDateOptions([]);
          setSchedulesByDate({});
          toast.error(getApiErrorMessage(error, "Không tải được bác sĩ"));
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

  const slots = useMemo(() => {
    if (!selectedDate) return [];
    return [...(schedulesByDate[selectedDate] || [])].sort((a, b) =>
      String(a.start_time || "").localeCompare(String(b.start_time || "")),
    );
  }, [schedulesByDate, selectedDate]);

  const handleSelectSlot = (slot) => {
    setSelectedSchedule({
      id: slot.id,
      date: slot.date_display,
      work_date: slot.work_date,
      start: slot.start_time,
      end: slot.end_time,
    });
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
    setSelectedSchedule(null);
  };

  if (loading) {
    return (
      <>
        <Header />
        <section className="doctor-detail-page">
          <div className="container doctor-detail">
            <p>Đang tải thông tin bác sĩ...</p>
          </div>
        </section>
        <Footer />
      </>
    );
  }

  if (!doctor) {
    return (
      <>
        <Header />
        <section className="doctor-detail-page">
          <div className="container doctor-detail">
            <h1>Không tìm thấy bác sĩ</h1>
            <Link to="/doctors" className="btn btn-primary">
              Quay lại danh sách
            </Link>
          </div>
        </section>
        <Footer />
      </>
    );
  }

  const displayName =
    [doctor.last_name, doctor.first_name].filter(Boolean).join(" ") ||
    doctor.name;

  const doctorView = {
    ...doctor,
    price:
      doctor.price ||
      `${Number(doctor.consultation_fee || 0).toLocaleString("vi-VN")} đ`,
  };

  return (
    <>
      <Header />

      <section className="doctor-detail-page">
        <div className="container doctor-detail">
          <nav className="doctor-breadcrumb">
            <Link to="/">
              <Home size={15} />
              Trang chủ
            </Link>
            <ChevronRight size={14} />
            <Link to="/doctors">Bác sĩ</Link>
            <ChevronRight size={14} />
            <span>Bác sĩ {displayName}</span>
          </nav>

          <DoctorProfile doctor={doctorView} />
          <DoctorBiography doctor={doctorView} />

          <div className="doctor-booking-flow">
            <DoctorSchedule
              dateOptions={dateOptions}
              slots={slots}
              selectedDate={selectedDate}
              selectedSchedule={selectedSchedule}
              onDateChange={handleDateChange}
              onSelectSlot={handleSelectSlot}
            />

            <BookingPanel
              doctor={doctorView}
              selectedDate={selectedDate}
              selectedSchedule={selectedSchedule}
            />
          </div>

          <DoctorReview doctorId={doctor.id} />
        </div>
      </section>

      <Footer />
    </>
  );
}

export default DoctorDetail;
