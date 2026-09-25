import { useState } from "react";
import { Save } from "lucide-react";
import toast from "react-hot-toast";
import medicalRecordService from "../../services/medical-record.service";
import { getApiErrorMessage } from "../../api/axios";
import CollapseToggle from "./CollapseToggle";
import "../../styles/medical-record.css";

const emptyForm = {
  symptoms: "",
  blood_pressure: "",
  heart_rate: "",
  temperature: "",
  spo2: "",
  respiratory_rate: "",
  weight: "",
  height: "",
  clinical_examination: "",
  diagnosis: "",
  icd10_code: "",
  secondary_diagnosis: "",
  assessment: "",
  note: "",
};

const numericFields = new Set([
  "heart_rate",
  "temperature",
  "spo2",
  "respiratory_rate",
  "weight",
  "height",
]);

function normalizeField(value) {
  return value === "—" || value == null ? "" : String(value);
}

function getInitialForm(record) {
  return {
    ...emptyForm,
    symptoms: normalizeField(record?.symptoms),
    blood_pressure: normalizeField(record?.blood_pressure),
    heart_rate: normalizeField(record?.heart_rate),
    temperature: normalizeField(record?.temperature),
    spo2: normalizeField(record?.spo2),
    respiratory_rate: normalizeField(record?.respiratory_rate),
    weight: normalizeField(record?.weight ?? record?.patient_weight),
    height: normalizeField(record?.height ?? record?.patient_height),
    clinical_examination: normalizeField(record?.clinical_examination),
    diagnosis: normalizeField(record?.diagnosis),
    icd10_code: normalizeField(record?.icd10_code),
    secondary_diagnosis: normalizeField(record?.secondary_diagnosis),
    assessment: normalizeField(record?.assessment ?? record?.conclusion),
    note: normalizeField(record?.note),
  };
}

function SectionTitle({ number, children }) {
  return (
    <div className="medical-record-form-section__title">
      <span aria-hidden="true">{number}</span>
      <h5>{children}</h5>
    </div>
  );
}

function TextareaField({
  name,
  value,
  placeholder,
  maxLength,
  onChange,
  minRows = 5,
}) {
  return (
    <div className="medical-record-form-textarea">
      <textarea
        id={`medical-record-${name}`}
        name={name}
        rows={minRows}
        value={value}
        maxLength={maxLength}
        placeholder={placeholder}
        onChange={onChange}
      />
      {maxLength ? (
        <span className="medical-record-form-counter">
          {value.length}/{maxLength}
        </span>
      ) : null}
    </div>
  );
}

function ReadOnlyValue({ label, value, wide = false }) {
  return (
    <div className={wide ? "medical-record-readonly-value is-wide" : "medical-record-readonly-value"}>
      <span>{label}</span>
      <strong>{value || "—"}</strong>
    </div>
  );
}

export default function MedicalRecordForm({
  appointmentId,
  initialRecord = null,
  onSaved,
  readOnly = false,
}) {
  const hasRecord = Boolean(initialRecord?.id);
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [formData, setFormData] = useState(() => getInitialForm(initialRecord));

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleCancel = () => {
    setFormData(getInitialForm(initialRecord));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.diagnosis.trim()) {
      toast.error("Vui lòng nhập chẩn đoán chính");
      return;
    }

    setSaving(true);
    try {
      const payload = Object.entries(formData).reduce((result, [key, value]) => {
        const normalizedValue = String(value).trim();
        return {
          ...result,
          [key]: numericFields.has(key)
            ? normalizedValue === ""
              ? null
              : Number(normalizedValue)
            : normalizedValue || null,
        };
      }, {});

      // Giữ trường cũ để các màn hình đọc bệnh án hiện có tiếp tục hiển thị đánh giá.
      payload.conclusion = payload.assessment;

      let savedRecord;
      if (hasRecord) {
        savedRecord = await medicalRecordService.update(initialRecord.id, payload);
        toast.success("Đã cập nhật bệnh án");
      } else {
        savedRecord = await medicalRecordService.create({
          ...payload,
          appointment_id: Number(appointmentId),
        });
        toast.success("Đã lưu bệnh án. Tiếp theo kê đơn thuốc.");
      }

      onSaved?.(savedRecord);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không lưu được bệnh án"));
    } finally {
      setSaving(false);
    }
  };

  if (readOnly) {
    return (
      <section className="doctor-medical-record-view medical-record-component">
        <div className="medical-record-component__header">
          <div>
            <h4>Hồ sơ bệnh án</h4>
            <p>Thông tin thăm khám và đánh giá lâm sàng</p>
          </div>
          <CollapseToggle
            expanded={expanded}
            label="hồ sơ bệnh án"
            onToggle={() => setExpanded((value) => !value)}
          />
        </div>

        <div className="medical-record-readonly-grid" hidden={!expanded}>
          <ReadOnlyValue label="Triệu chứng và diễn biến bệnh" value={formData.symptoms} wide />
          <ReadOnlyValue label="Khám lâm sàng" value={formData.clinical_examination} wide />
          <ReadOnlyValue label="Huyết áp" value={formData.blood_pressure && `${formData.blood_pressure} mmHg`} />
          <ReadOnlyValue label="Nhịp tim" value={formData.heart_rate && `${formData.heart_rate} lần/phút`} />
          <ReadOnlyValue label="Nhiệt độ" value={formData.temperature && `${formData.temperature} °C`} />
          <ReadOnlyValue label="SpO₂" value={formData.spo2 && `${formData.spo2}%`} />
          <ReadOnlyValue label="Nhịp thở" value={formData.respiratory_rate && `${formData.respiratory_rate} lần/phút`} />
          <ReadOnlyValue label="Cân nặng / Chiều cao" value={[formData.weight && `${formData.weight} kg`, formData.height && `${formData.height} cm`].filter(Boolean).join(" / ")} />
          <ReadOnlyValue label="Chẩn đoán chính" value={formData.diagnosis} />
          <ReadOnlyValue label="Mã ICD-10" value={formData.icd10_code} />
          <ReadOnlyValue label="Chẩn đoán kèm theo" value={formData.secondary_diagnosis} wide />
          <ReadOnlyValue label="Đánh giá tình trạng bệnh" value={formData.assessment} wide />
          <ReadOnlyValue label="Ghi chú" value={formData.note} wide />
        </div>
      </section>
    );
  }

  return (
    <form className="doctor-medical-record-form medical-record-component" onSubmit={handleSubmit}>
      <div className="medical-record-component__header">
        <div>
          <h4>Hồ sơ bệnh án</h4>
          <p>Thông tin thăm khám và đánh giá lâm sàng</p>
        </div>
        <CollapseToggle
          expanded={expanded}
          label="hồ sơ bệnh án"
          onToggle={() => setExpanded((value) => !value)}
        />
      </div>

      <div className="medical-record-component__content" hidden={!expanded}>
        <div className="medical-record-form-grid">
          <section className="medical-record-form-section">
            <SectionTitle number="01">Triệu chứng và diễn biến bệnh</SectionTitle>
            <TextareaField
              name="symptoms"
              value={formData.symptoms}
              maxLength={1000}
              placeholder="Nhập triệu chứng, diễn biến bệnh, thời gian xuất hiện, mức độ, tần suất, triệu chứng kèm theo..."
              onChange={handleChange}
            />
          </section>

          <section className="medical-record-form-section">
            <SectionTitle number="02">Dấu hiệu sinh tồn</SectionTitle>
            <div className="medical-record-vital-grid">
              {[
                ["blood_pressure", "Huyết áp (mmHg)", "VD: 120/80", "text"],
                ["heart_rate", "Nhịp tim (lần/phút)", "VD: 75", "number"],
                ["temperature", "Nhiệt độ (°C)", "VD: 36.8", "number"],
                ["spo2", "SpO₂ (%)", "VD: 98", "number"],
                ["respiratory_rate", "Nhịp thở (lần/phút)", "VD: 18", "number"],
                ["weight", "Cân nặng (kg)", "VD: 65", "number"],
                ["height", "Chiều cao (cm)", "VD: 170", "number"],
              ].map(([name, label, placeholder, type]) => (
                <label key={name} htmlFor={`medical-record-${name}`}>
                  <span>{label}</span>
                  <input
                    id={`medical-record-${name}`}
                    type={type}
                    step={name === "temperature" || name === "weight" ? "0.1" : "1"}
                    name={name}
                    value={formData[name]}
                    placeholder={placeholder}
                    onChange={handleChange}
                  />
                </label>
              ))}
            </div>
          </section>

          <section className="medical-record-form-section">
            <SectionTitle number="03">Khám lâm sàng</SectionTitle>
            <TextareaField
              name="clinical_examination"
              value={formData.clinical_examination}
              maxLength={1000}
              placeholder="Nhập kết quả khám lâm sàng..."
              onChange={handleChange}
            />
          </section>

          <section className="medical-record-form-section">
            <SectionTitle number="04">Chẩn đoán</SectionTitle>
            <div className="medical-record-diagnosis-grid">
              <label htmlFor="medical-record-diagnosis">
                <span>Chẩn đoán chính <i>*</i></span>
                <input
                  id="medical-record-diagnosis"
                  type="text"
                  name="diagnosis"
                  value={formData.diagnosis}
                  placeholder="VD: Viêm họng cấp"
                  onChange={handleChange}
                  required
                />
              </label>
              <label htmlFor="medical-record-icd10">
                <span>Mã ICD-10</span>
                <input
                  id="medical-record-icd10"
                  type="text"
                  name="icd10_code"
                  value={formData.icd10_code}
                  placeholder="VD: J02.9"
                  onChange={handleChange}
                />
              </label>
            </div>
            <label className="medical-record-secondary-diagnosis" htmlFor="medical-record-secondary-diagnosis">
              <span>Chẩn đoán kèm theo</span>
              <textarea
                id="medical-record-secondary-diagnosis"
                name="secondary_diagnosis"
                rows={3}
                value={formData.secondary_diagnosis}
                placeholder="Nhập chẩn đoán kèm theo (nếu có)..."
                onChange={handleChange}
              />
            </label>
          </section>

          <section className="medical-record-form-section">
            <SectionTitle number="05">Đánh giá tình trạng bệnh</SectionTitle>
            <TextareaField
              name="assessment"
              value={formData.assessment}
              maxLength={1000}
              placeholder="Nhận định, đánh giá tình trạng bệnh, hướng điều trị..."
              onChange={handleChange}
            />
          </section>

          <section className="medical-record-form-section">
            <SectionTitle number="06">Ghi chú</SectionTitle>
            <TextareaField
              name="note"
              value={formData.note}
              maxLength={500}
              placeholder="Nhập ghi chú khác (nếu có)..."
              onChange={handleChange}
            />
          </section>
        </div>

        <div className="medical-record-form-actions">
          <button
            type="button"
            className="medical-record-form-cancel"
            disabled={saving}
            onClick={handleCancel}
          >
            Hủy
          </button>
          <button
            type="submit"
            className="medical-record-form-save"
            disabled={saving}
          >
            <Save size={17} />
            {saving
              ? "Đang lưu..."
              : hasRecord
                ? "Cập nhật bệnh án"
                : "Lưu bệnh án"}
          </button>
        </div>
      </div>
    </form>
  );
}
