import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import toast from "react-hot-toast";

import Header from "../../components/common/Header/Header";
import Footer from "../../components/common/Footer/Footer";
import SpecialtyProfile from "../../components/specialty/SpecialtyProfile";
import SpecialtyDoctorCard from "../../components/specialty/SpecialtyDoctorCard";
import specialtyService from "../../services/specialty.service";
import doctorService from "../../services/doctor.service";
import scheduleService from "../../services/schedule.service";
import { getApiErrorMessage } from "../../api/axios";
import { getMinBookingDateYMD } from "../../utils/booking";

function SpecialtyDetail() {
  const { id } = useParams();
  const [specialty, setSpecialty] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const [specialtyData, doctorsResult, schedulesResult] =
          await Promise.all([
            specialtyService.getSpecialtyById(id),
            doctorService.getDoctors({ specialty_id: Number(id), limit: 50 }),
            scheduleService.getSchedules({
              specialty_id: Number(id),
              from_date: getMinBookingDateYMD(),
              available_only: "false",
              page: 1,
              limit: 200,
            }),
          ]);

        if (cancelled) return;
        setSpecialty(specialtyData);
        setDoctors(doctorsResult.data || []);
        setSchedules(schedulesResult.data || []);
      } catch (error) {
        if (!cancelled) {
          setSpecialty(null);
          setDoctors([]);
          setSchedules([]);
          toast.error(
            getApiErrorMessage(error, "Không tải được chuyên khoa"),
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
  }, [id]);

  const schedulesByDoctor = useMemo(() => {
    const map = {};
    for (const slot of schedules) {
      const key = slot.doctor_id;
      if (!map[key]) map[key] = [];
      map[key].push(slot);
    }
    return map;
  }, [schedules]);

  if (loading) {
    return (
      <>
        <Header />
        <section className="specialty-detail-page">
          <div className="specialty-detail-inner">
            <p>Đang tải thông tin chuyên khoa...</p>
          </div>
        </section>
        <Footer />
      </>
    );
  }

  if (!specialty) {
    return (
      <>
        <Header />
        <section className="specialty-detail-page">
          <div className="specialty-detail-inner">
            <h1>Không tìm thấy chuyên khoa</h1>
            <Link to="/specialties" className="btn btn-primary">
              Quay lại danh sách
            </Link>
          </div>
        </section>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="specialty-detail-page">
        <div className="specialty-detail-inner">
          <SpecialtyProfile specialty={specialty} />

          <div className="specialty-booking-list">
            {doctors.length === 0 ? (
              <p>Chưa có bác sĩ thuộc chuyên khoa này.</p>
            ) : (
              doctors.map((doctor) => (
                <SpecialtyDoctorCard
                  key={doctor.id}
                  doctor={doctor}
                  schedules={schedulesByDoctor[doctor.id] || []}
                />
              ))
            )}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

export default SpecialtyDetail;
