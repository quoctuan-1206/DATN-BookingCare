import { HeartPulse } from "lucide-react";

const EMPTY_RECORD = { allergies: [], history: [], conditions: [], vitals: [] };

const confirmationLabel = {
  PENDING: "Bệnh nhân khai báo · Chưa xác nhận",
  PATIENT_REPORTED_NONE: "Bệnh nhân khai báo không có dị ứng đã biết",
  CONFIRMED: "Đã xác nhận",
  REJECTED: "Chưa được xác nhận",
};

const allergyTypeLabel = {
  MEDICATION: "Thuốc",
  FOOD: "Thực phẩm",
  ENVIRONMENT: "Môi trường",
  OTHER: "Khác",
};

const vitalTypeLabel = {
  BLOOD_PRESSURE: "Huyết áp",
  HEART_RATE: "Nhịp tim",
  WEIGHT: "Cân nặng",
  HEIGHT: "Chiều cao",
  TEMPERATURE: "Nhiệt độ",
  BLOOD_GLUCOSE: "Đường huyết",
  SPO2: "SpO₂",
};

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString("vi-VN");
}

function EntryMeta({ children }) {
  return children ? <small className="doctor-health-record-meta">{children}</small> : null;
}

function HealthSection({ title, items, renderItem, emptyText }) {
  return (
    <section className="doctor-health-record-section">
      <h5>{title}</h5>
      {items.length ? (
        <ul>
          {items.map((item) => (
            <li key={item.id}>{renderItem(item)}</li>
          ))}
        </ul>
      ) : (
        <p className="doctor-health-record-empty">{emptyText}</p>
      )}
    </section>
  );
}

function DoctorHealthRecordSummary({ data = EMPTY_RECORD, loading, error }) {
  const records = { ...EMPTY_RECORD, ...data };

  return (
    <section className="doctor-appointment-panel doctor-health-record-card" aria-labelledby="doctor-health-record-title">
      <div className="doctor-appointment-panel-title">
        <span className="doctor-appointment-panel-icon" aria-hidden="true"><HeartPulse size={18} /></span>
        <div className="doctor-health-record-heading">
          <h4 id="doctor-health-record-title">Hồ sơ sức khỏe</h4>
          <p>Thông tin bệnh nhân đã khai báo cho hồ sơ được đặt lịch.</p>
        </div>
      </div>

      {loading ? (
        <p className="doctor-health-record-state">Đang tải hồ sơ sức khỏe...</p>
      ) : error ? (
        <p className="doctor-health-record-state doctor-health-record-state--error" role="status">{error}</p>
      ) : (
        <>
          <p className="doctor-health-record-notice">Thông tin do bệnh nhân khai báo có thể chưa được nhân viên y tế xác nhận.</p>
          <div className="doctor-health-record-grid">
            <HealthSection
              title="Dị ứng"
              items={records.allergies}
              emptyText="Chưa có thông tin dị ứng."
              renderItem={(item) => (
                <>
                  <strong>{item.confirmation_status === "PATIENT_REPORTED_NONE" ? "Không ghi nhận dị ứng đã biết" : item.allergen}</strong>
                  {item.confirmation_status !== "PATIENT_REPORTED_NONE" && (
                    <p>{[allergyTypeLabel[item.allergy_type] || item.allergy_type, item.severity && `Mức độ: ${item.severity}`].filter(Boolean).join(" · ")}</p>
                  )}
                  {item.reaction && <p>Phản ứng: {item.reaction}</p>}
                  <EntryMeta>{confirmationLabel[item.confirmation_status] || "Bệnh nhân khai báo"}</EntryMeta>
                </>
              )}
            />

            <HealthSection
              title="Tiền sử bệnh"
              items={records.history}
              emptyText="Chưa có tiền sử bệnh được khai báo."
              renderItem={(item) => (
                <>
                  <strong>{item.title}</strong>
                  {item.description && <p>{item.description}</p>}
                  {item.surgery_history && <p>Phẫu thuật: {item.surgery_history}</p>}
                  {item.family_history && <p>Gia đình: {item.family_history}</p>}
                  <EntryMeta>{[formatDate(item.discovered_at), confirmationLabel[item.confirmation_status] || "Bệnh nhân khai báo"].filter(Boolean).join(" · ")}</EntryMeta>
                </>
              )}
            />

            <HealthSection
              title="Bệnh đang theo dõi"
              items={records.conditions}
              emptyText="Chưa có bệnh hoặc tình trạng đang theo dõi."
              renderItem={(item) => (
                <>
                  <strong>{item.name}</strong>
                  {item.note && <p>{item.note}</p>}
                  <EntryMeta>{[item.status === "MONITORING" ? "Đang theo dõi" : item.status, confirmationLabel[item.confirmation_status] || "Bệnh nhân khai báo"].filter(Boolean).join(" · ")}</EntryMeta>
                </>
              )}
            />

            <HealthSection
              title="Chỉ số sức khỏe"
              items={records.vitals}
              emptyText="Chưa có chỉ số sức khỏe được ghi nhận."
              renderItem={(item) => (
                <>
                  <strong>{vitalTypeLabel[item.type] || item.type}: {item.value}{item.secondary_value != null ? `/${item.secondary_value}` : ""} {item.unit}</strong>
                  <EntryMeta>{formatDate(item.measured_at)}{item.source === "PATIENT" ? " · Bệnh nhân tự khai báo" : ""}</EntryMeta>
                </>
              )}
            />
          </div>
        </>
      )}
    </section>
  );
}

export default DoctorHealthRecordSummary;
