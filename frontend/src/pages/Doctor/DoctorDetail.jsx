import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
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

const CONTENT_LINKS = [
  ["intro", "Giới thiệu"],
  ["specialty", "Chuyên môn"],
  ["experience", "Kinh nghiệm"],
  ["education", "Học vấn"],
  ["doctor-schedule", "Lịch khám"],
  ["doctor-reviews", "Đánh giá"],
];
const INFO_TAB_IDS = new Set(["intro", "specialty", "experience", "education"]);

function DoctorDetail() {
  const { id } = useParams();
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateOptions, setDateOptions] = useState([]);
  const [schedulesByDate, setSchedulesByDate] = useState({});
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [activeTab, setActiveTab] = useState("intro");
  const [activeNavItem, setActiveNavItem] = useState("intro");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setActiveTab("intro");
      setActiveNavItem("intro");
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
          toast.error(getApiErrorMessage(error, "Không tải được thông tin bác sĩ"));
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
    if (!doctor) return undefined;

    const sections = ["doctor-schedule", "doctor-reviews"]
      .map((sectionId) => document.getElementById(sectionId))
      .filter(Boolean);
    if (!sections.length || !("IntersectionObserver" in window)) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) {
          setActiveNavItem(visible.target.id);
        } else if (entries.some((entry) => !entry.isIntersecting)) {
          setActiveNavItem(activeTab);
        }
      },
      { rootMargin: "-20% 0px -65% 0px", threshold: [0, 0.15, 0.4] },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [doctor, activeTab]);

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
      consultation_type: slot.consultation_type || "IN_PERSON",
    });
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
    setSelectedSchedule(null);
  };

  const handleTabClick = (tabId) => {
    setActiveNavItem(tabId);
    if (INFO_TAB_IDS.has(tabId)) {
      setActiveTab(tabId);
      return;
    }

    if (tabId === "doctor-schedule" || tabId === "doctor-reviews") {
      document.getElementById(tabId)?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
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
    [doctor.last_name, doctor.first_name].filter(Boolean).join(" ") || doctor.name;
  const doctorView = {
    ...doctor,
    price:
      doctor.price ||
      `${Number(doctor.consultation_fee || 0).toLocaleString("vi-VN")} ₫`,
  };

  return (
    <>
      <Header />
      <section className="doctor-detail-page">
        <div className="container doctor-detail">
          <nav className="doctor-breadcrumb" aria-label="Đường dẫn">
            <Link to="/">
              <Home size={15} aria-hidden="true" />
              Trang chủ
            </Link>
            <ChevronRight size={14} aria-hidden="true" />
            <Link to="/doctors">Bác sĩ</Link>
            <ChevronRight size={14} aria-hidden="true" />
            <span>Bác sĩ {displayName}</span>
          </nav>

          <DoctorProfile doctor={doctorView} />

          <nav className="doctor-section-nav" aria-label="Điều hướng hồ sơ bác sĩ">
            {CONTENT_LINKS.map(([tabId, label]) => (
              <button
                key={tabId}
                type="button"
                className={activeNavItem === tabId ? "active" : ""}
                aria-pressed={activeNavItem === tabId}
                onClick={() => handleTabClick(tabId)}
              >
                {label}
              </button>
            ))}
          </nav>

          <div className="doctor-detail-columns">
            <div className="doctor-detail-main">
              <DoctorBiography doctor={doctorView} activeTab={activeTab} />
              <DoctorSchedule
                dateOptions={dateOptions}
                slots={slots}
                selectedDate={selectedDate}
                selectedSchedule={selectedSchedule}
                onDateChange={handleDateChange}
                onSelectSlot={handleSelectSlot}
              />
            </div>
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
