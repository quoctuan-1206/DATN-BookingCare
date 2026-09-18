import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  ClipboardPlus,
  Clock3,
  Stethoscope,
} from "lucide-react";
import toast from "react-hot-toast";
import DoctorLayout from "../../components/doctor-dashboard/layout/DoctorLayout";
import DoctorPatientInfo from "../../components/doctor-dashboard/DoctorPatientInfo";
import MedicalRecordForm from "../../components/doctor-dashboard/MedicalRecordForm";
import PrescriptionForm from "../../components/doctor-dashboard/PrescriptionForm";
import AppointmentClinicalOrders from "../../components/doctor-dashboard/AppointmentClinicalOrders";
import appointmentService, {
  STATUS_CLASS,
  STATUS_LABEL,
} from "../../services/appointment.service";
import medicalRecordService from "../../services/medical-record.service";
import prescriptionService from "../../services/prescription.service";
import { getApiErrorMessage } from "../../api/axios";
import { isExamDay } from "../../utils/booking";
import { mapMedicalRecord } from "../../services/medical-record.service";

function splitAppointmentReason(value, fallbackNote) {
  const rawReason = String(value || "").trim();
  const noteMatch = rawReason.match(/(?:^|\r?\n)\s*Ghi chú:\s*([\s\S]*)$/i);

  if (!noteMatch) {
    return {
      reason: rawReason || "—",
      note: fallbackNote || "—",
    };
  }

  return {
    reason: rawReason.slice(0, noteMatch.index).trim() || "—",
    note: fallbackNote || noteMatch[1].trim() || "—",
  };
}

function AppointmentDetail() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const autoStartExam = searchParams.get("exam") === "1";
  const autoPrescribe = searchParams.get("prescribe") === "1";

  const [appointment, setAppointment] = useState(null);
  const [medicalRecord, setMedicalRecord] = useState(null);
  const [prescription, setPrescription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [examStarted, setExamStarted] = useState(false);
  const [prescriptionStep, setPrescriptionStep] = useState(false);
  const [prescriptionSkipped, setPrescriptionSkipped] = useState(false);
  const [clinicalOrderSummary, setClinicalOrderSummary] = useState(null);

  const canStartExam = useMemo(() => {
    if (!appointment) return false;
    return (
      appointment.status === "CONFIRMED" && isExamDay(appointment.work_date)
    );
  }, [appointment]);

  const showMedicalForm = useMemo(() => {
    if (!appointment) return false;
    if (medicalRecord) return true;
    return examStarted && appointment.status === "CONFIRMED";
  }, [appointment, medicalRecord, examStarted]);

  const showPrescriptionForm = useMemo(() => {
    if (!medicalRecord || prescriptionSkipped) return false;
    if (prescription) return true;
    return prescriptionStep;
  }, [medicalRecord, prescription, prescriptionStep, prescriptionSkipped]);

  const loadAppointment = async () => {
    setLoading(true);
    try {
      const data = await appointmentService.getAppointmentById(id);
      setAppointment(data);

      try {
        const record = await medicalRecordService.getByAppointmentId(id);
        setMedicalRecord(record);
        setExamStarted(true);

        try {
          const rx = await prescriptionService.getByMedicalRecordId(record.id);
          setPrescription(rx);
        } catch (error) {
          if (error?.response?.status !== 404) {
            toast.error(getApiErrorMessage(error, "Không tải được đơn thuốc"));
          }
          setPrescription(null);
        }
      } catch (error) {
        if (error?.response?.status !== 404) {
          toast.error(getApiErrorMessage(error, "Không tải được bệnh án"));
        }
        setMedicalRecord(null);
        setPrescription(null);
        if (data?.exam_started_at && data.status === "CONFIRMED") {
          setExamStarted(true);
        }
      }
    } catch (error) {
      setAppointment(null);
      toast.error(getApiErrorMessage(error, "Không tải được lịch hẹn"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppointment();
  }, [id]);

  const handleStartExam = async () => {
    if (!appointment?.id || updating) return;

    setUpdating(true);
    try {
      const updated = await appointmentService.startExam(appointment.id);
      setAppointment(updated);
      setExamStarted(true);
      toast.success("Đã bắt đầu khám");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không bắt đầu được khám"));
    } finally {
      setUpdating(false);
    }
  };

  useEffect(() => {
    if (
      autoStartExam &&
      canStartExam &&
      !medicalRecord &&
      !appointment?.exam_started_at &&
      !loading &&
      appointment
    ) {
      handleStartExam();
    }
  }, [
    autoStartExam,
    canStartExam,
    medicalRecord,
    appointment?.exam_started_at,
    loading,
    appointment?.id,
  ]);

  useEffect(() => {
    if (autoPrescribe && medicalRecord && !prescription) {
      setPrescriptionStep(true);
    }
  }, [autoPrescribe, medicalRecord, prescription]);

  const handleStatus = async (nextStatus) => {
    const label = STATUS_LABEL[nextStatus] || nextStatus;
    const ok = window.confirm(
      `Chuyển lịch ${appointment.booking_code} sang "${label}"?`,
    );
    if (!ok) return;

    setUpdating(true);
    try {
      await appointmentService.updateStatus(appointment.id, nextStatus);
      toast.success("Đã cập nhật trạng thái");
      await loadAppointment();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không cập nhật được"));
    } finally {
      setUpdating(false);
    }
  };

  const handleRecordSaved = async (record) => {
    if (record) {
      setMedicalRecord(mapMedicalRecord(record));
      setPrescriptionStep(true);
      setPrescriptionSkipped(false);
    }
    await loadAppointment();
  };

  const handlePrescriptionSaved = async () => {
    await loadAppointment();
  };

  const handleSkipPrescription = () => {
    setPrescriptionSkipped(true);
    setPrescriptionStep(false);
    toast.success("Đã bỏ qua kê thuốc cho lần khám này");
  };

  const handleClinicalOrdersChange = useCallback(({ appointmentId, orders }) => {
    setClinicalOrderSummary({
      appointmentId: Number(appointmentId),
      total: orders.length,
      incomplete: orders.filter(
        (order) => order.status === "PENDING" || order.status === "IN_PROGRESS",
      ).length,
    });
  }, []);

  if (loading) {
    return (
      <DoctorLayout title="Chi tiết lịch hẹn">
        <div className="doctor-page">
          <p>Đang tải...</p>
        </div>
      </DoctorLayout>
    );
  }

  if (!appointment) {
    return (
      <DoctorLayout title="Chi tiết lịch hẹn">
        <div className="doctor-page">
          <div className="doctor-card">
            <h3>Không tìm thấy lịch hẹn</h3>
            <Link to="/doctor/appointments" className="admin-btn admin-btn-secondary">
              Quay lại danh sách
            </Link>
          </div>
        </div>
      </DoctorLayout>
    );
  }

  const examInformation = splitAppointmentReason(
    appointment.reason,
    appointment.note,
  );
  const currentClinicalSummary =
    clinicalOrderSummary?.appointmentId === Number(appointment.id)
      ? clinicalOrderSummary
      : null;
  const incompleteClinicalOrderCount = currentClinicalSummary
    ? currentClinicalSummary.incomplete
    : Number(appointment.incomplete_clinical_order_count || 0);

  return (
    <DoctorLayout title="Chi tiết lịch hẹn">
      <div className="doctor-page doctor-appointment-detail-page">
        <div className="doctor-appointment-detail-heading">
          <div>
            <div className="doctor-appointment-title-line">
              <h3>Chi tiết lịch hẹn #{appointment.booking_code}</h3>
              <span
                className={`status ${
                  STATUS_CLASS[appointment.status] || "pending"
                }`}
              >
                {STATUS_LABEL[appointment.status]}
              </span>
            </div>
            <p>Xác nhận lịch → khám bệnh → ghi bệnh án → kê đơn thuốc.</p>
          </div>
          <Link
            to="/doctor/appointments"
            className="admin-btn admin-btn-secondary doctor-appointment-back"
          >
            <ArrowLeft size={16} />
            Quay lại danh sách
          </Link>
        </div>

        <section
          className="doctor-appointment-summary"
          aria-label="Thông tin lịch khám"
        >
          <div className="doctor-appointment-summary-item">
            <span className="doctor-appointment-summary-icon" aria-hidden="true">
              <CalendarDays size={19} />
            </span>
            <div>
              <span>Ngày khám</span>
              <strong>{appointment.date_display || "—"}</strong>
            </div>
          </div>
          <div className="doctor-appointment-summary-item">
            <span className="doctor-appointment-summary-icon" aria-hidden="true">
              <Clock3 size={19} />
            </span>
            <div>
              <span>Khung giờ</span>
              <strong>{appointment.time || "—"}</strong>
            </div>
          </div>
          <div className="doctor-appointment-summary-item">
            <span className="doctor-appointment-summary-icon" aria-hidden="true">
              <Building2 size={19} />
            </span>
            <div>
              <span>Phòng khám</span>
              <strong>{appointment.clinic || "—"}</strong>
            </div>
          </div>
          <div className="doctor-appointment-summary-item">
            <span className="doctor-appointment-summary-icon" aria-hidden="true">
              <Stethoscope size={19} />
            </span>
            <div>
              <span>Chuyên khoa</span>
              <strong>{appointment.specialty || "—"}</strong>
            </div>
          </div>
        </section>

        <div className="doctor-appointment-content-grid">
          <DoctorPatientInfo data={appointment} />

          <section className="doctor-appointment-panel doctor-exam-info-card">
            <div className="doctor-appointment-panel-title">
              <span className="doctor-appointment-panel-icon" aria-hidden="true">
                <ClipboardPlus size={18} />
              </span>
              <h4>Thông tin khám</h4>
            </div>

            <div className="doctor-compact-info-list doctor-exam-info-list">
              <div className="doctor-compact-info-row doctor-compact-info-row--stacked">
                <span>Lý do khám</span>
                <strong>{examInformation.reason}</strong>
              </div>
              <div className="doctor-compact-info-row">
                <span>Phí khám</span>
                <strong className="doctor-appointment-fee">
                  {Number(appointment.consultation_fee || 0).toLocaleString(
                    "vi-VN",
                  )}{" "}
                  đ
                </strong>
              </div>
              <div className="doctor-compact-info-row doctor-compact-info-row--stacked">
                <span>Ghi chú</span>
                <strong>{examInformation.note}</strong>
              </div>
            </div>

            <div className="doctor-appointment-actions">
              {appointment.status === "PENDING" && (
                <>
                  <button
                    type="button"
                    className="admin-btn admin-btn-primary"
                    disabled={updating}
                    onClick={() => handleStatus("CONFIRMED")}
                  >
                    Xác nhận khám
                  </button>
                  <button
                    type="button"
                    className="admin-btn admin-btn-danger"
                    disabled={updating}
                    onClick={() => handleStatus("CANCELLED")}
                  >
                    Hủy
                  </button>
                </>
              )}

              {appointment.status === "CONFIRMED" &&
                !medicalRecord &&
                !examStarted && (
                  <>
                    {appointment.exam_started_at ? (
                      <button
                        type="button"
                        className="admin-btn admin-btn-primary"
                        onClick={() => setExamStarted(true)}
                      >
                        Tiếp tục khám
                      </button>
                    ) : canStartExam ? (
                      <button
                        type="button"
                        className="admin-btn admin-btn-primary"
                        disabled={updating}
                        onClick={handleStartExam}
                      >
                        {updating ? "Đang lưu..." : "Bắt đầu khám"}
                      </button>
                    ) : (
                      <p className="doctor-appointment-action-note">
                        Lịch khám vào {appointment.date_display}. Bạn có thể bắt
                        đầu khám vào ngày hẹn.
                      </p>
                    )}
                    <button
                      type="button"
                      className="admin-btn admin-btn-danger"
                      disabled={updating}
                      onClick={() => handleStatus("CANCELLED")}
                    >
                      Hủy
                    </button>
                  </>
                )}

              {appointment.status === "CONFIRMED" &&
                examStarted &&
                !medicalRecord && (
                  <button
                    type="button"
                    className="admin-btn admin-btn-secondary"
                    onClick={() => setExamStarted(false)}
                  >
                    Đóng form
                  </button>
                )}

              {medicalRecord &&
                !prescription &&
                !prescriptionStep &&
                !prescriptionSkipped && (
                  <button
                    type="button"
                    className="admin-btn admin-btn-primary"
                    onClick={() => setPrescriptionStep(true)}
                  >
                    Kê đơn thuốc
                  </button>
                )}

              {medicalRecord && appointment.status === "CONFIRMED" && (
                <>
                  <button
                    type="button"
                    className="admin-btn admin-btn-primary doctor-complete-exam-btn"
                    disabled={updating || incompleteClinicalOrderCount > 0}
                    onClick={() => handleStatus("COMPLETED")}
                  >
                    {updating ? "Đang lưu..." : "Hoàn thành khám"}
                  </button>
                  {incompleteClinicalOrderCount > 0 && (
                    <p className="doctor-appointment-action-note">
                      Còn {incompleteClinicalOrderCount} chỉ định cận lâm sàng chưa hoàn tất.
                      Chỉ có thể hoàn thành khám sau khi có đầy đủ kết quả.
                    </p>
                  )}
                </>
              )}
            </div>
          </section>
        </div>

        {showMedicalForm && (
          <>
            <div className="doctor-card" style={{ marginTop: 20 }}>
              <MedicalRecordForm
                key={medicalRecord?.id || "new"}
                appointmentId={appointment.id}
                initialRecord={medicalRecord}
                onSaved={handleRecordSaved}
                readOnly={appointment.status === "CANCELLED"}
              />
            </div>

            <div style={{ marginTop: 20 }}>
              <AppointmentClinicalOrders
                appointment={appointment}
                onOrdersChange={handleClinicalOrdersChange}
              />
            </div>
          </>
        )}

        {showPrescriptionForm && (
          <div className="doctor-card doctor-prescription-card-shell">
            <PrescriptionForm
              key={prescription?.id || "new"}
              medicalRecordId={medicalRecord.id}
              initialPrescription={prescription}
              onSaved={handlePrescriptionSaved}
              onSkip={handleSkipPrescription}
              readOnly={appointment.status === "CANCELLED"}
            />
          </div>
        )}
      </div>
    </DoctorLayout>
  );
}

export default AppointmentDetail;
