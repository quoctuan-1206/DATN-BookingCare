import { useState } from "react";
import toast from "react-hot-toast";
import medicalRecordService from "../../services/medical-record.service";
import { getApiErrorMessage } from "../../api/axios";

function normalizeField(value) {
  return value === "—" ? "" : value || "";
}

export default function MedicalRecordForm({
  appointmentId,
  initialRecord = null,
  onSaved,
  readOnly = false,
}) {
  const hasRecord = Boolean(initialRecord?.id);
  const [editing, setEditing] = useState(!readOnly && !hasRecord);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    symptoms: normalizeField(initialRecord?.symptoms),
    diagnosis: normalizeField(initialRecord?.diagnosis),
    conclusion: normalizeField(initialRecord?.conclusion),
    note: initialRecord?.note || "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.diagnosis.trim()) {
      toast.error("Vui lòng nhập chẩn đoán");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        symptoms: formData.symptoms.trim() || null,
        diagnosis: formData.diagnosis.trim(),
        conclusion: formData.conclusion.trim() || null,
        note: formData.note.trim() || null,
      };

      if (hasRecord) {
        await medicalRecordService.update(initialRecord.id, payload);
        toast.success("Đã cập nhật bệnh án");
        onSaved?.(initialRecord);
      } else {
        const res = await medicalRecordService.create({
          ...payload,
          appointment_id: Number(appointmentId),
        });
        toast.success("Đã lưu bệnh án. Tiếp theo kê đơn thuốc.");
        onSaved?.(res.data?.data);
      }
      setEditing(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không lưu được bệnh án"));
    } finally {
      setSaving(false);
    }
  };

  if (readOnly || (hasRecord && !editing)) {
    return (
      <div className="doctor-medical-record-view">
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
          <h4 style={{ margin: 0 }}>Hồ sơ bệnh án</h4>
          {!readOnly && (
            <button
              type="button"
              className="admin-btn admin-btn-secondary"
              onClick={() => setEditing(true)}
            >
              Chỉnh sửa
            </button>
          )}
        </div>

        <div className="doctor-detail-grid">
          <div className="doctor-detail-grid--full">
            <span>Triệu chứng</span>
            <strong>{formData.symptoms || "—"}</strong>
          </div>
          <div className="doctor-detail-grid--full">
            <span>Chẩn đoán</span>
            <strong>{formData.diagnosis || "—"}</strong>
          </div>
          <div className="doctor-detail-grid--full">
            <span>Kết luận</span>
            <strong>{formData.conclusion || "—"}</strong>
          </div>
          <div className="doctor-detail-grid--full">
            <span>Ghi chú</span>
            <strong>{formData.note || "—"}</strong>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form className="admin-form doctor-medical-record-form" onSubmit={handleSubmit}>
      <h4 style={{ margin: "0 0 16px" }}>
        {hasRecord ? "Cập nhật hồ sơ bệnh án" : "Hồ sơ bệnh án"}
      </h4>

      <div className="admin-form-group">
        <label htmlFor="symptoms">Triệu chứng</label>
        <textarea
          id="symptoms"
          name="symptoms"
          className="admin-textarea"
          rows={3}
          value={formData.symptoms}
          onChange={handleChange}
        />
      </div>

      <div className="admin-form-group">
        <label htmlFor="diagnosis">Chẩn đoán</label>
        <textarea
          id="diagnosis"
          name="diagnosis"
          className="admin-textarea"
          rows={3}
          value={formData.diagnosis}
          onChange={handleChange}
          required
        />
      </div>

      <div className="admin-form-group">
        <label htmlFor="conclusion">Kết luận</label>
        <textarea
          id="conclusion"
          name="conclusion"
          className="admin-textarea"
          rows={3}
          value={formData.conclusion}
          onChange={handleChange}
        />
      </div>

      <div className="admin-form-group">
        <label htmlFor="note">Ghi chú</label>
        <textarea
          id="note"
          name="note"
          className="admin-textarea"
          rows={2}
          value={formData.note}
          onChange={handleChange}
        />
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button
          type="submit"
          className="admin-btn admin-btn-primary"
          disabled={saving}
        >
          {saving ? "Đang lưu..." : hasRecord ? "Cập nhật bệnh án" : "Lưu bệnh án"}
        </button>
        {hasRecord && (
          <button
            type="button"
            className="admin-btn admin-btn-secondary"
            disabled={saving}
            onClick={() => {
              setFormData({
                symptoms: normalizeField(initialRecord?.symptoms),
                diagnosis: normalizeField(initialRecord?.diagnosis),
                conclusion: normalizeField(initialRecord?.conclusion),
                note: initialRecord?.note || "",
              });
              setEditing(false);
            }}
          >
            Hủy
          </button>
        )}
      </div>
    </form>
  );
}
