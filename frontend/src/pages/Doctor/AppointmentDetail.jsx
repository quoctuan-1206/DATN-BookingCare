import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import DoctorLayout from "../../components/doctor-dashboard/layout/DoctorLayout";
import MedicalRecordForm from "../../components/doctor-dashboard/MedicalRecordForm";
import PrescriptionForm from "../../components/doctor-dashboard/PrescriptionForm";
import appointmentService, {
  STATUS_CLASS,
  STATUS_LABEL,
} from "../../services/appointment.service";
import medicalRecordService from "../../services/medical-record.service";
import prescriptionService from "../../services/prescription.service";
import { getApiErrorMessage } from "../../api/axios";
import { isExamDay } from "../../utils/booking";
import { mapMedicalRecord } from "../../services/medical-record.service";

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

  useEffect(() => {
    if (autoStartExam && canStartExam && !medicalRecord) {
      setExamStarted(true);
    }
  }, [autoStartExam, canStartExam, medicalRecord]);

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

  return (
    <DoctorLayout title="Chi tiết lịch hẹn">
      <div className="doctor-page">
        <div className="doctor-card">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
              marginBottom: 16,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <div>
              <h3>Chi tiết lịch hẹn #{appointment.booking_code}</h3>
              <p style={{ margin: "6px 0 0", color: "#64748b", fontSize: 14 }}>
                Xác nhận lịch → khám bệnh → ghi bệnh án → kê đơn thuốc.
              </p>
            </div>
            <Link to="/doctor/appointments" className="admin-btn admin-btn-secondary">
              Quay lại danh sách
            </Link>
          </div>

          <div className="doctor-detail-grid">
            <div>
              <span>Trạng thái</span>
              <strong>
                <span
                  className={`status ${
                    STATUS_CLASS[appointment.status] || "pending"
                  }`}
                >
                  {STATUS_LABEL[appointment.status]}
                </span>
              </strong>
            </div>
            <div>
              <span>Bệnh nhân</span>
              <strong>{appointment.patient_name}</strong>
            </div>
            <div>
              <span>Ngày khám</span>
              <strong>{appointment.date_display}</strong>
            </div>
            <div>
              <span>Giờ khám</span>
              <strong>{appointment.time}</strong>
            </div>
            <div>
              <span>Chuyên khoa</span>
              <strong>{appointment.specialty}</strong>
            </div>
            <div>
              <span>Phòng khám</span>
              <strong>{appointment.clinic}</strong>
            </div>
            <div className="doctor-detail-grid--full">
              <span>Lý do khám</span>
              <strong>{appointment.reason || "—"}</strong>
            </div>
            <div>
              <span>Phí khám</span>
              <strong>
                {Number(appointment.consultation_fee || 0).toLocaleString("vi-VN")} đ
              </strong>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
              marginTop: 20,
            }}
          >
            {appointment.status === "PENDING" && (
              <>
                <button
                  type="button"
                  className="admin-btn admin-btn-primary"
                  disabled={updating}
                  onClick={() => handleStatus("CONFIRMED")}
                >
                  Xác nhận lịch
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

            {appointment.status === "CONFIRMED" && !medicalRecord && !examStarted && (
              <>
                {canStartExam ? (
                  <button
                    type="button"
                    className="admin-btn admin-btn-primary"
                    disabled={updating}
                    onClick={() => setExamStarted(true)}
                  >
                    Bắt đầu khám
                  </button>
                ) : (
                  <p
                    style={{
                      margin: 0,
                      color: "#64748b",
                      fontSize: 14,
                      flex: "1 1 100%",
                    }}
                  >
                    Lịch khám vào {appointment.date_display}. Bạn có thể bắt đầu
                    khám vào ngày hẹn.
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

            {appointment.status === "CONFIRMED" && examStarted && !medicalRecord && (
              <button
                type="button"
                className="admin-btn admin-btn-secondary"
                onClick={() => setExamStarted(false)}
              >
                Đóng form
              </button>
            )}

            {medicalRecord && !prescription && !prescriptionStep && !prescriptionSkipped && (
              <button
                type="button"
                className="admin-btn admin-btn-primary"
                onClick={() => setPrescriptionStep(true)}
              >
                Kê đơn thuốc
              </button>
            )}
          </div>
        </div>

        {showMedicalForm && (
          <div className="doctor-card" style={{ marginTop: 20 }}>
            <MedicalRecordForm
              key={medicalRecord?.id || "new"}
              appointmentId={appointment.id}
              initialRecord={medicalRecord}
              onSaved={handleRecordSaved}
              readOnly={appointment.status === "CANCELLED"}
            />
          </div>
        )}

        {showPrescriptionForm && (
          <div className="doctor-card" style={{ marginTop: 20 }}>
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
