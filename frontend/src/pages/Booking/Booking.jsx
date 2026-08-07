import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import Header from "../../components/common/Header/Header";
import Footer from "../../components/common/Footer/Footer";

import BookingDoctor from "../../components/booking/BookingDoctor";
import PatientSelector from "../../components/booking/PatientSelector";
import BookingForm from "../../components/booking/BookingForm";
import BookingSummary from "../../components/booking/BookingSummary";
import BookingConfirm from "../../components/booking/BookingConfirm";
import { useAuth } from "../../context/AuthContext";
import patientProfileService from "../../services/patient-profile.service";
import appointmentService from "../../services/appointment.service";
import { getApiErrorMessage } from "../../api/axios";

function formatMoney(money) {
  return `${Number(money || 0).toLocaleString("vi-VN")} VNĐ`;
}

function Booking() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const incoming = location.state;
  const doctor = incoming?.doctor;
  const schedule = incoming?.schedule;

  const [patients, setPatients] = useState([]);
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    reason: "",
    note: "",
  });

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      toast.error("Vui lòng đăng nhập để đặt lịch");
      navigate("/login", { state: { from: "/booking", booking: incoming } });
      return;
    }

    const roleName = user.role?.name || user.role;
    if (roleName && roleName !== "Patient") {
      toast.error("Chỉ tài khoản bệnh nhân mới đặt lịch được");
      navigate("/");
    }
  }, [authLoading, user, navigate, incoming]);

  useEffect(() => {
    let cancelled = false;

    async function loadProfiles() {
      const roleName = user?.role?.name || user?.role;
      if (!user || roleName !== "Patient") return;

      setLoadingPatients(true);
      try {
        const list = await patientProfileService.getMyProfiles();
        if (cancelled) return;
        setPatients(list);
        setSelectedPatientId(list[0]?.id || null);
      } catch (error) {
        if (!cancelled) {
          toast.error(
            getApiErrorMessage(error, "Không tải được hồ sơ bệnh nhân"),
          );
        }
      } finally {
        if (!cancelled) setLoadingPatients(false);
      }
    }

    loadProfiles();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const selectedPatient = useMemo(
    () => patients.find((p) => p.id === selectedPatientId) || patients[0],
    [patients, selectedPatientId],
  );

  const handleConfirm = async () => {
    if (!doctor?.id || !schedule?.id) {
      toast.error("Thiếu thông tin bác sĩ hoặc lịch khám");
      return;
    }
    if (!selectedPatient?.id) {
      toast.error("Vui lòng chọn hồ sơ bệnh nhân");
      return;
    }
    if (!formData.reason.trim()) {
      toast.error("Vui lòng nhập lý do khám");
      return;
    }

    setSubmitting(true);
    try {
      const reason = formData.note.trim()
        ? `${formData.reason.trim()}\nGhi chú: ${formData.note.trim()}`
        : formData.reason.trim();

      const res = await appointmentService.createAppointment({
        schedule_id: schedule.id,
        patient_profile_id: selectedPatient.id,
        reason,
      });

      const appointment = res.data?.data;

      navigate("/booking/success", {
        replace: true,
        state: {
          booking: {
            bookingCode: appointment?.booking_code,
            appointmentId: appointment?.id,
            doctorName: appointment?.doctor_name || doctor.name,
            specialty: appointment?.specialty || doctor.specialty,
            clinic: appointment?.clinic || doctor.clinic,
            date: appointment?.date_display || schedule.date,
            time: appointment?.time || schedule.time,
            patient: appointment?.patient_name || selectedPatient.fullName,
            fee: formatMoney(
              appointment?.consultation_fee ?? doctor.consultationFee,
            ),
            reason: formData.reason.trim(),
            note: formData.note.trim(),
          },
        },
      });
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Đặt lịch thất bại"));
    } finally {
      setSubmitting(false);
    }
  };

  if (!doctor || !schedule) {
    return (
      <>
        <Header />
        <section className="section">
          <div className="container">
            <h1>Thiếu thông tin đặt lịch</h1>
            <p>Vui lòng chọn bác sĩ và khung giờ trước.</p>
            <Link to="/doctors" className="btn btn-primary">
              Chọn bác sĩ
            </Link>
          </div>
        </section>
        <Footer />
      </>
    );
  }

  const doctorView = {
    ...doctor,
    consultationFee: doctor.consultationFee ?? doctor.consultation_fee ?? 0,
  };

  return (
    <>
      <Header />

      <section className="section booking-section">
        <div className="container booking-page">
          <header className="booking-page-header">
            <p className="booking-eyebrow">Booking Care</p>
            <h1 className="page-title">Đặt lịch khám</h1>
            <p className="booking-page-desc">
              Kiểm tra thông tin bác sĩ, chọn hồ sơ bệnh nhân và xác nhận lịch
              khám của bạn.
            </p>
          </header>

          <div className="booking-layout">
            <div className="booking-main">
              {loadingPatients ? (
                <div className="booking-card">
                  <p>Đang tải hồ sơ bệnh nhân...</p>
                </div>
              ) : (
                <PatientSelector
                  patients={patients}
                  selectedPatientId={selectedPatientId}
                  onSelectPatient={setSelectedPatientId}
                />
              )}

              <BookingForm formData={formData} onChange={setFormData} />
            </div>

            <aside className="booking-aside">
              <BookingDoctor doctor={doctorView} schedule={schedule} />

              <div className="booking-card booking-aside-panel">
                <BookingSummary
                  doctor={doctorView}
                  schedule={schedule}
                  patient={selectedPatient}
                  embedded
                />

                <BookingConfirm
                  doctor={doctorView}
                  schedule={schedule}
                  patient={selectedPatient}
                  formData={formData}
                  embedded
                  submitting={submitting}
                  onConfirm={handleConfirm}
                />
              </div>
            </aside>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}

export default Booking;
