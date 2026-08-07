import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import PatientLayout from "../../components/patient/PatientLayout";
import medicalRecordService from "../../services/medical-record.service";
import { getApiErrorMessage } from "../../api/axios";

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
        <p>Đang tải...</p>
      </PatientLayout>
    );
  }

  if (!record) {
    return (
      <PatientLayout>
        <div className="empty-state">
          <h3>Không tìm thấy bệnh án.</h3>
          <Link to="/patient/medical-records" className="btn btn-outline">
            Quay lại
          </Link>
        </div>
      </PatientLayout>
    );
  }

  return (
    <PatientLayout>
      <div className="page-header">
        <div>
          <h1>Chi tiết bệnh án</h1>
          <p>
            Mã lịch: <strong>{record.booking_code}</strong>
          </p>
        </div>
        <Link to="/patient/medical-records" className="btn btn-outline">
          Quay lại
        </Link>
      </div>

      <div className="detail-card" style={{ marginBottom: 16 }}>
        <h2>Thông tin khám</h2>
        <p>
          <strong>Bác sĩ:</strong> {record.doctor_name}
        </p>
        <p>
          <strong>Chuyên khoa:</strong> {record.specialty}
        </p>
        <p>
          <strong>Phòng khám:</strong> {record.clinic}
        </p>
        <p>
          <strong>Ngày:</strong> {record.date_display} · {record.time}
        </p>
        <p>
          <strong>Bệnh nhân:</strong> {record.patient_name}
        </p>
      </div>

      <div className="detail-card" style={{ marginBottom: 16 }}>
        <h2>Kết quả</h2>
        <p>
          <strong>Triệu chứng:</strong> {record.symptoms}
        </p>
        <p>
          <strong>Chẩn đoán:</strong> {record.diagnosis}
        </p>
        <p>
          <strong>Kết luận:</strong> {record.conclusion}
        </p>
        <p>
          <strong>Ghi chú:</strong> {record.note || "—"}
        </p>
      </div>

      <Link
        to={`/patient/appointments/${record.appointment_id}`}
        className="btn btn-primary"
      >
        Xem lịch hẹn liên quan
      </Link>
    </PatientLayout>
  );
}

export default MedicalRecordDetail;
