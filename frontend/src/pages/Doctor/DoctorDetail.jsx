import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import toast from "react-hot-toast";

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
            from_date: new Date().toISOString().slice(0, 10),
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
    return schedulesByDate[selectedDate] || [];
  }, [schedulesByDate, selectedDate]);

  const clinic = doctor
    ? {
        id: doctor.clinic_id,
        name: doctor.clinic,
        address: doctor.clinic_address || "—",
      }
    : null;

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
        <section className="section">
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
        <section className="section">
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

  const doctorView = {
    ...doctor,
    price:
      doctor.price ||
      `${Number(doctor.consultation_fee || 0).toLocaleString("vi-VN")} đ`,
  };

  return (
    <>
      <Header />

      <section className="section">
        <div className="container doctor-detail">
          <DoctorProfile doctor={doctorView} />
          <DoctorBiography doctor={doctorView} />

          <div className="doctor-booking-flow">
            <DoctorSchedule
              doctor={doctorView}
              clinic={clinic}
              dateOptions={dateOptions}
              slots={slots}
              selectedDate={selectedDate}
              selectedSchedule={selectedSchedule}
              onDateChange={handleDateChange}
              onSelectSlot={handleSelectSlot}
            />

            <BookingPanel
              doctor={doctorView}
              selectedSchedule={selectedSchedule}
            />
          </div>

          <DoctorReview
            doctorId={doctor.id}
            reviews={doctor.reviews}
            rating={doctor.rating}
            reviewCount={doctor.review_count}
          />
        </div>
      </section>

      <Footer />
    </>
  );
}

export default DoctorDetail;
