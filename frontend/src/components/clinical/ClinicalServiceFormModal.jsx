import { useEffect, useState } from "react";
import { Save, X } from "lucide-react";
import ImageUploadField from "../admin/ImageUploadField";
import {
  CLINICAL_BOOKING_MODES,
  CLINICAL_TYPES,
} from "./clinical.constants";

function ClinicalServiceFormModal({ service, submitting = false, onClose, onSubmit }) {
  const [form, setForm] = useState({
    service_type: service?.service_type || "XRAY",
    booking_mode:
      service?.booking_mode ||
      (service?.service_type === "LAB" ? "SELF_BOOKING" : "DOCTOR_ORDER"),
    name: service?.name || "",
    image: service?.image || "",
    description: service?.description || "",
    preparation_instructions: service?.preparation_instructions || "",
    estimated_duration_minutes: service?.estimated_duration_minutes || 15,
    price: service?.price || "",
    is_active: service?.is_active ?? true,
  });

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const update = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const submit = (event) => {
    event.preventDefault();
    onSubmit({
      ...form,
      name: form.name.trim(),
      image: form.image || null,
      description: form.description.trim() || null,
      preparation_instructions: form.preparation_instructions.trim() || null,
      estimated_duration_minutes: Number(form.estimated_duration_minutes),
      price: Number(form.price),
    });
  };

  return (
    <div className="clinical-modal-backdrop" role="presentation">
      <section className="clinical-modal" role="dialog" aria-modal="true" aria-labelledby="clinical-service-form-title">
        <header>
          <div>
            <span className="clinical-eyebrow">Danh mục cận lâm sàng</span>
            <h2 id="clinical-service-form-title">{service ? "Cập nhật dịch vụ" : "Thêm dịch vụ mới"}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Đóng" disabled={submitting}><X size={20} /></button>
        </header>
        <form onSubmit={submit}>
          <div className="clinical-form-grid clinical-form-grid--two">
            <label>
              Loại dịch vụ
              <select value={form.service_type} onChange={(event) => update("service_type", event.target.value)}>
                {CLINICAL_TYPES.filter((item) => item.value !== "ALL").map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </select>
            </label>
            <label>
              Thời gian dự kiến (phút)
              <input type="number" min="1" max="1440" value={form.estimated_duration_minutes} onChange={(event) => update("estimated_duration_minutes", event.target.value)} required />
            </label>
          </div>
          <label>
            Hình thức đặt dịch vụ
            <select
              value={form.booking_mode}
              onChange={(event) => update("booking_mode", event.target.value)}
            >
              {CLINICAL_BOOKING_MODES.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>
            <small className="clinical-field-help">
              {CLINICAL_BOOKING_MODES.find(
                (item) => item.value === form.booking_mode,
              )?.description}
            </small>
          </label>
          <label>
            Tên dịch vụ
            <input value={form.name} onChange={(event) => update("name", event.target.value)} placeholder="Ví dụ: X-quang ngực thẳng" maxLength={255} required />
          </label>
          <div className="clinical-service-image-field">
            <ImageUploadField
              label="Ảnh mô tả dịch vụ"
              inputId="clinical-service-image"
              aspect={16 / 9}
              value={form.image}
              onChange={(url) => update("image", url)}
              allowRemove
            />
          </div>
          <label>
            Mô tả
            <textarea rows={3} value={form.description} onChange={(event) => update("description", event.target.value)} placeholder="Mô tả ngắn về dịch vụ..." />
          </label>
          <label>
            Hướng dẫn chuẩn bị
            <textarea rows={3} value={form.preparation_instructions} onChange={(event) => update("preparation_instructions", event.target.value)} placeholder="Các lưu ý dành cho bệnh nhân..." />
          </label>
          <div className="clinical-form-grid clinical-form-grid--two">
            <label>
              Giá dịch vụ
              <div className="clinical-money-input">
                <input type="number" min="0" step="1000" value={form.price} onChange={(event) => update("price", event.target.value)} required />
                <span>đ</span>
              </div>
            </label>
            <label className="clinical-switch-field">
              Trạng thái hoạt động
              <button type="button" role="switch" aria-checked={form.is_active} className={form.is_active ? "active" : ""} onClick={() => update("is_active", !form.is_active)}>
                <span /> {form.is_active ? "Đang hoạt động" : "Tạm ngừng"}
              </button>
            </label>
          </div>
          <footer>
            <button type="button" className="clinical-button clinical-button--secondary" onClick={onClose} disabled={submitting}>Hủy</button>
            <button type="submit" className="clinical-button clinical-button--primary" disabled={submitting}><Save size={17} /> {submitting ? "Đang lưu..." : "Lưu dịch vụ"}</button>
          </footer>
        </form>
      </section>
    </div>
  );
}

export default ClinicalServiceFormModal;
