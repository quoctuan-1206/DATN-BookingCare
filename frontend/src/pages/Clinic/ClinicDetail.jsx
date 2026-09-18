import { useEffect, useState } from "react";
import {
  Activity,
  CalendarCheck2,
  ChevronRight,
  ClipboardList,
  Home,
  Stethoscope,
  UserRoundCheck,
  UsersRound,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import toast from "react-hot-toast";

import Header from "../../components/common/Header/Header";
import Footer from "../../components/common/Footer/Footer";
import ClinicProfile from "../../components/clinic/ClinicProfile";
import ClinicDoctors from "../../components/clinic/ClinicDoctors";
import ClinicImages from "../../components/clinic/ClinicImages";
import clinicService from "../../services/clinic.service";
import doctorService from "../../services/doctor.service";
import { getApiErrorMessage } from "../../api/axios";
import { hasRichText, sanitizeRichText } from "../../utils/richText";

function ClinicDetail() {
  const { id } = useParams();
  const [clinic, setClinic] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  const specialties = [
    ...new Set(
      doctors
        .map((doctor) => doctor.specialty)
        .filter((name) => name && name !== "—"),
    ),
  ];

  const bookingSteps = [
    { icon: Activity, label: "Chọn chuyên khoa" },
    { icon: Stethoscope, label: "Chọn bác sĩ" },
    { icon: CalendarCheck2, label: "Chọn lịch khám" },
    { icon: ClipboardList, label: "Nhập thông tin bệnh nhân" },
    { icon: UserRoundCheck, label: "Xác nhận đặt lịch" },
  ];

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const [clinicData, doctorsResult] = await Promise.all([
          clinicService.getClinicById(id),
          doctorService.getDoctors({ clinic_id: Number(id), limit: 50 }),
        ]);

        if (!cancelled) {
          setClinic(clinicData);
          setDoctors(doctorsResult.data || []);
        }
      } catch (error) {
        if (!cancelled) {
          setClinic(null);
          setDoctors([]);
          toast.error(
            getApiErrorMessage(error, "Không tải được thông tin cơ sở khám"),
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

  if (loading) {
    return (
      <>
        <Header />
        <main className="clinic-detail-page">
          <div className="container clinic-detail">
            <div className="clinic-state">Đang tải thông tin cơ sở khám...</div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (!clinic) {
    return (
      <>
        <Header />
        <main className="clinic-detail-page">
          <div className="container clinic-detail">
            <div className="clinic-state clinic-state--empty">
              <h1>Không tìm thấy cơ sở khám</h1>
              <Link to="/clinics" className="btn btn-primary">
                Quay lại danh sách
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="clinic-detail-page">
        <div className="container clinic-detail">
          <nav className="clinic-detail-breadcrumb" aria-label="Điều hướng">
            <Link to="/" aria-label="Trang chủ">
              <Home size={15} /> Trang chủ
            </Link>
            <ChevronRight size={14} />
            <Link to="/clinics">Cơ sở khám</Link>
            <ChevronRight size={14} />
            <span>{clinic.name}</span>
          </nav>

          <ClinicProfile clinic={clinic} />

          <nav className="clinic-anchor-nav" aria-label="Nội dung trang">
            <a href="#gioi-thieu">Giới thiệu</a>
            <a href="#chuyen-mon">Thế mạnh chuyên môn</a>
            <a href="#bac-si">Bác sĩ</a>
            <a href="#trang-thiet-bi">Trang thiết bị</a>
            <a href="#quy-trinh">Quy trình khám</a>
          </nav>

          <section id="gioi-thieu" className="clinic-section clinic-overview">
            <div className="clinic-section__heading">
              <div><span>Thông tin cơ sở</span><h2>Giới thiệu</h2></div>
            </div>
            <div className="clinic-overview__grid">
              <div className="clinic-overview__copy">
                {hasRichText(clinic.description) ? (
                  <div
                    className="clinic-rich-content"
                    dangerouslySetInnerHTML={{ __html: sanitizeRichText(clinic.description) }}
                  />
                ) : (
                  <p>{`${clinic.name} là cơ sở khám chữa bệnh thuộc hệ thống MediUTE, kết nối người bệnh với đội ngũ bác sĩ phù hợp và quy trình đặt lịch thuận tiện.`}</p>
                )}
                <div className="clinic-overview__note">
                  <UsersRound size={20} />
                  <div>
                    <strong>Đội ngũ chuyên môn</strong>
                    <span>{doctors.length} bác sĩ đang công tác tại cơ sở</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section id="chuyen-mon" className="clinic-section clinic-specialties">
            <div className="clinic-section__heading">
              <div><span>Dịch vụ nổi bật</span><h2>Thế mạnh chuyên môn</h2></div>
            </div>
            {hasRichText(clinic.specialties_content) && (
              <div
                className="clinic-rich-content clinic-rich-content--lead"
                dangerouslySetInnerHTML={{ __html: sanitizeRichText(clinic.specialties_content) }}
              />
            )}
            {specialties.length ? (
              <div className="clinic-specialties__grid">
                {specialties.map((specialty, index) => (
                  <div className="clinic-specialty-item" key={specialty}>
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <Activity size={22} />
                    <strong>{specialty}</strong>
                  </div>
                ))}
              </div>
            ) : !hasRichText(clinic.specialties_content) ? (
              <p className="clinic-section__empty">Thông tin chuyên khoa đang được cập nhật.</p>
            ) : null}
          </section>

          <div id="bac-si"><ClinicDoctors doctors={doctors} /></div>
          <div id="trang-thiet-bi">
            <ClinicImages
              content={clinic.equipment_content}
            />
          </div>

          <section id="quy-trinh" className="clinic-section clinic-process">
            <div className="clinic-section__heading">
              <div><span>Đặt khám dễ dàng</span><h2>Quy trình khám</h2></div>
            </div>
            <ol className="clinic-process__list">
              {bookingSteps.map(({ icon: Icon, label }, index) => (
                <li key={label}>
                  <span className="clinic-process__number">{String(index + 1).padStart(2, "0")}</span>
                  <span className="clinic-process__icon"><Icon size={22} /></span>
                  <strong>{label}</strong>
                </li>
              ))}
            </ol>
          </section>

          <section className="clinic-booking-cta">
            <div>
              <span>Sẵn sàng chăm sóc sức khỏe của bạn?</span>
              <h2>Chọn bác sĩ và lịch khám phù hợp ngay hôm nay</h2>
            </div>
            <a href="#bac-si" className="btn btn-primary">
              Đặt lịch khám <ChevronRight size={18} />
            </a>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}

export default ClinicDetail;
