import {
  Activity,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  FileText,
  MapPin,
  Pill,
  Stethoscope,
  UserRound,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";
import { resolveMediaUrl } from "../../utils/media";

function getInitials(name) {
  return (name || "Bác sĩ")
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((part) => part[0])
    .join("")
    .toLocaleUpperCase("vi");
}

function MedicalRecordPreview({ record, onClose }) {
  const avatar = resolveMediaUrl(record.doctor_avatar);
  const services = (record.clinical_services || []).flatMap((order) => {
    const results = (order.results || []).map((result) => result.service_name).filter(Boolean);
    return results.length ? results : [order.service_type_label || order.service_type].filter(Boolean);
  });
  const prescriptionItems = record.prescription?.items || [];
  const consultationType = {
    IN_PERSON: "Trực tiếp",
    ONLINE: "Trực tuyến",
  }[record.consultation_type] || "Chưa có thông tin";

  return (
    <aside className="medical-records-preview medical-record-preview" aria-label="Xem nhanh bệnh án" aria-live="polite">
      <div className="medical-record-preview-header">
        <div>
          <span className="medical-record-preview-eyebrow">HỒ SƠ KHÁM</span>
          <h2>Chi tiết bệnh án</h2>
        </div>
        <button type="button" className="medical-record-preview-close" onClick={onClose} aria-label="Đóng xem nhanh">
          <X size={19} />
        </button>
      </div>

      <div className="medical-record-preview-scroll">
        <div className="medical-record-preview-doctor">
          {avatar ? (
            <img src={avatar} alt="" />
          ) : (
            <span className="medical-record-preview-avatar-fallback" aria-hidden="true">{getInitials(record.doctor_name)}</span>
          )}
          <div>
            <strong>{record.doctor_name || "Chưa có thông tin bác sĩ"}</strong>
            <span>{record.specialty || "Chưa có thông tin chuyên khoa"}</span>
            <span>{record.clinic || "Chưa có thông tin cơ sở y tế"}</span>
            <small>Mã lịch: {record.booking_code || "Chưa có thông tin"}</small>
          </div>
        </div>

        <section className="medical-record-preview-section">
          <h3><CalendarDays size={17} aria-hidden="true" /> Thông tin khám</h3>
          <div className="medical-record-visit-grid">
            <div><small>Ngày khám</small><strong>{record.date_display || "Chưa có thông tin"}</strong></div>
            <div><small>Phòng khám</small><strong>{record.clinic || "Chưa có thông tin"}</strong></div>
            <div><small>Chuyên khoa</small><strong>{record.specialty || "Chưa có thông tin"}</strong></div>
            <div><small>Hình thức</small><strong>{consultationType}</strong></div>
          </div>
        </section>

        <section className="medical-record-preview-section medical-record-preview-findings">
          <h3><FileText size={17} aria-hidden="true" /> Nội dung bệnh án</h3>
          <div className="medical-record-finding">
            <strong><Stethoscope size={15} aria-hidden="true" /> Chẩn đoán</strong>
            <p>{record.diagnosis && record.diagnosis !== "—" ? record.diagnosis : "Chưa có thông tin"}</p>
            {record.icd10_code && <small>Mã ICD-10: {record.icd10_code}</small>}
          </div>
          <div className="medical-record-finding">
            <strong><Activity size={15} aria-hidden="true" /> Triệu chứng</strong>
            <p>{record.symptoms && record.symptoms !== "—" ? record.symptoms : "Chưa có thông tin"}</p>
          </div>
          <div className="medical-record-finding">
            <strong><CheckCircle2 size={15} aria-hidden="true" /> Kết luận</strong>
            <p>{record.conclusion && record.conclusion !== "—" ? record.conclusion : "Chưa có thông tin"}</p>
          </div>
          <div className="medical-record-finding">
            <strong><FileText size={15} aria-hidden="true" /> Ghi chú của bác sĩ</strong>
            <p>{record.note || "Chưa có thông tin"}</p>
          </div>
        </section>

        <section className="medical-record-preview-followup">
          <CalendarDays size={19} aria-hidden="true" />
          <div>
            <strong>Lịch tái khám</strong>
            <span>{record.follow_up_date_display || record.follow_up_date || "Chưa có lịch tái khám"}</span>
          </div>
        </section>

        <section className="medical-record-preview-section">
          <h3><ClipboardList size={17} aria-hidden="true" /> Dịch vụ cận lâm sàng <span className="medical-record-section-count">{services.length}</span></h3>
          {services.length ? (
            <ul className="medical-record-service-list">
              {services.map((service, index) => <li key={`${service}-${index}`}>{service}</li>)}
            </ul>
          ) : (
            <p className="medical-record-muted">Chưa có dịch vụ cận lâm sàng.</p>
          )}
        </section>

        <section className="medical-record-preview-section medical-record-preview-prescription">
          <h3><Pill size={17} aria-hidden="true" /> Đơn thuốc</h3>
          <span className={`medical-record-prescription-badge${record.has_prescription ? " has-prescription" : " no-prescription"}`}>
            {record.has_prescription ? "Có đơn thuốc" : "Không có đơn thuốc"}
          </span>
          {record.has_prescription && prescriptionItems.length > 0 && (
            <ul className="medical-record-prescription-list">
              {prescriptionItems.slice(0, 3).map((item) => (
                <li key={item.id || `${item.medicine_id}-${item.medicine_name}`}>
                  <span>{item.medicine_name || "Thuốc"}</span>
                  <small>{item.dosage || item.instruction || ""}</small>
                </li>
              ))}
              {prescriptionItems.length > 3 && <li className="medical-record-more-items">+{prescriptionItems.length - 3} thuốc khác</li>}
            </ul>
          )}
        </section>

        <div className="medical-record-preview-patient">
          <UserRound size={15} aria-hidden="true" />
          <span>Bệnh nhân: {record.patient_name || "Chưa có thông tin"}</span>
          <span className="medical-record-preview-address"><MapPin size={14} aria-hidden="true" />{record.clinic_address || "Chưa có địa chỉ"}</span>
        </div>
      </div>

      <div className="medical-record-preview-footer">
        <Link to={`/patient/medical-records/${record.id}`} className="medical-record-full-detail-button">
          Xem chi tiết bệnh án
        </Link>
      </div>
    </aside>
  );
}

export default MedicalRecordPreview;
