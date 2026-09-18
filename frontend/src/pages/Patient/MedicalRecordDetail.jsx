import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";
import PatientLayout from "../../components/patient/PatientLayout";
import PatientPrescriptionView from "../../components/patient/PatientPrescriptionView";
import ClinicalRecordSection from "../../components/clinical/ClinicalRecordSection";
import medicalRecordService from "../../services/medical-record.service";
import clinicalService from "../../services/clinical.service";
import { getApiErrorMessage } from "../../api/axios";

function DetailRow({ label, value }) {
  return (
    <div className="detail-field-row">
      <span className="detail-field-label">{label}</span>
      <span className="detail-field-value">{value}</span>
    </div>
  );
}

function MedicalRecordDetail() {
  const { id } = useParams();
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const data = await medicalRecordService.getById(id);
        if (!cancelled) setRecord(data);
      } catch (error) {
        if (!cancelled) {
          setRecord(null);
          toast.error(getApiErrorMessage(error, "Không tải được bệnh án"));
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
      <PatientLayout>
        <div className="patient-content-card">
          <p className="patient-page-loading">Đang tải...</p>
        </div>
      </PatientLayout>
    );
  }

  const openClinicalAttachment = async (attachment) => {
    try {
      await clinicalService.openAttachment(attachment);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không mở được tệp cận lâm sàng"));
    }
  };

  if (!record) {
    return (
      <PatientLayout>
        <div className="patient-content-card">
          <div className="patient-panel-empty">
            <p>Không tìm thấy bệnh án.</p>
            <Link to="/patient/medical-records" className="patient-detail-back">
              <ArrowLeft size={16} />
              Quay lại
            </Link>
          </div>
        </div>
      </PatientLayout>
    );
  }

  return (
    <PatientLayout>
      <div className="patient-content-card">
        <div className="patient-content-card-head">
          <h1 className="patient-content-card-title">Chi tiết bệnh án</h1>
          <Link to="/patient/medical-records" className="patient-detail-back">
            <ArrowLeft size={16} />
            Quay lại
          </Link>
        </div>

        <div className="detail-card">
          <h2>Thông tin khám</h2>
          <DetailRow label="Mã lịch" value={record.booking_code} />
          <DetailRow label="Bác sĩ" value={record.doctor_name} />
          <DetailRow label="Chuyên khoa" value={record.specialty} />
          <DetailRow label="Phòng khám" value={record.clinic} />
          <DetailRow
            label="Thời gian"
            value={`${record.date_display} · ${record.time}`}
          />
          <DetailRow label="Bệnh nhân" value={record.patient_name} />
        </div>

        <div className="detail-card">
          <h2>Kết quả</h2>
          <DetailRow label="Triệu chứng" value={record.symptoms} />
          <DetailRow label="Chẩn đoán" value={record.diagnosis} />
          <DetailRow label="Kết luận" value={record.conclusion} />
          <DetailRow label="Ghi chú" value={record.note || "—"} />
        </div>

        <ClinicalRecordSection
          orders={record.clinical_services || []}
          onOpenAttachment={openClinicalAttachment}
        />

        <PatientPrescriptionView
          medicalRecordId={record.id}
          hasPrescription={record.has_prescription}
        />

        <div className="patient-detail-actions">
          <Link
            to={`/patient/appointments/${record.appointment_id}`}
            className="patient-profile-save-btn"
            style={{ marginTop: 0, textDecoration: "none" }}
          >
            Xem lịch hẹn liên quan
          </Link>
        </div>
      </div>
    </PatientLayout>
  );
}

export default MedicalRecordDetail;
