import { useEffect, useMemo, useState } from "react";
import { Check, ClipboardPlus, X } from "lucide-react";
import {
  CLINICAL_TYPES,
  formatClinicalPrice,
} from "./clinical.constants";
import { ClinicalTypeIcon } from "./ClinicalOrderWorkspace";

function ClinicalOrderFormModal({
  appointments,
  services,
  fixedAppointment = null,
  submitting = false,
  onClose,
  onSubmit,
}) {
  const [appointmentId, setAppointmentId] = useState(
    fixedAppointment?.id || appointments[0]?.id || "",
  );
  const [type, setType] = useState(
    services.find((item) => item.is_active)?.service_type || "LAB",
  );
  const [serviceIds, setServiceIds] = useState([]);
  const [indication, setIndication] = useState("");
  const [preparationNote, setPreparationNote] = useState("");

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

  const availableServices = useMemo(
    () => services.filter((item) => item.service_type === type && item.is_active),
    [services, type],
  );

  const changeType = (nextType) => {
    setType(nextType);
    setServiceIds([]);
  };

  const toggleService = (id) => {
    setServiceIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  };

  const submit = (event) => {
    event.preventDefault();
    if (!appointmentId || serviceIds.length === 0 || !indication.trim()) return;
    onSubmit({
      appointment_id: Number(appointmentId),
      service_type: type,
      service_ids: serviceIds,
      indication: indication.trim(),
      preparation_note: preparationNote.trim() || null,
    });
  };

  return (
    <div className="clinical-modal-backdrop" role="presentation">
      <section className="clinical-modal clinical-modal--wide" role="dialog" aria-modal="true" aria-labelledby="clinical-order-form-title">
        <header>
          <div>
            <span className="clinical-eyebrow"><ClipboardPlus size={16} /> Phiếu mới</span>
            <h2 id="clinical-order-form-title">Tạo chỉ định cận lâm sàng</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Đóng" disabled={submitting}><X size={20} /></button>
        </header>

        <form onSubmit={submit}>
          {fixedAppointment ? (
            <div className="clinical-fixed-appointment">
              <span>Lịch khám và bệnh nhân</span>
              <strong>{fixedAppointment.patient_name}</strong>
              <small>
                {fixedAppointment.booking_code} · {fixedAppointment.date_display} · {fixedAppointment.time}
              </small>
            </div>
          ) : (
            <label>
              Lịch khám và bệnh nhân
              <select value={appointmentId} onChange={(event) => setAppointmentId(event.target.value)} required>
                <option value="">Chọn lịch khám...</option>
                {appointments.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.booking_code} · {item.patient_name} · {item.date_display}
                  </option>
                ))}
              </select>
            </label>
          )}

          <fieldset className="clinical-type-picker">
            <legend>Loại cận lâm sàng</legend>
            <div>
              {CLINICAL_TYPES.filter((item) => item.value !== "ALL").map((item) => (
                <button
                  type="button"
                  className={type === item.value ? "active" : ""}
                  key={item.value}
                  onClick={() => changeType(item.value)}
                >
                  <ClinicalTypeIcon type={item.value} size={18} /> {item.label}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="clinical-service-picker">
            <legend>Dịch vụ</legend>
            {availableServices.length === 0 ? (
              <p>Chưa có dịch vụ đang hoạt động cho loại này.</p>
            ) : (
              <div>
                {availableServices.map((service) => {
                  const checked = serviceIds.includes(service.id);
                  return (
                    <button
                      type="button"
                      className={checked ? "selected" : ""}
                      key={service.id}
                      onClick={() => toggleService(service.id)}
                    >
                      <span className="clinical-service-check">{checked && <Check size={14} />}</span>
                      <span>
                        <strong>{service.name}</strong>
                        <small>{service.estimated_duration_minutes || "—"} phút · {formatClinicalPrice(service.price)}</small>
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </fieldset>

          <label>
            Yêu cầu / chỉ định
            <textarea rows={3} value={indication} onChange={(event) => setIndication(event.target.value)} placeholder="Mô tả triệu chứng và mục tiêu cần khảo sát..." required />
          </label>
          <label>
            Chuẩn bị trước thực hiện
            <textarea rows={2} value={preparationNote} onChange={(event) => setPreparationNote(event.target.value)} placeholder="Nhịn ăn, uống nước hoặc lưu ý khác..." />
          </label>

          <footer>
            <button type="button" className="clinical-button clinical-button--secondary" onClick={onClose} disabled={submitting}>Hủy</button>
            <button type="submit" className="clinical-button clinical-button--primary clinical-order-form-submit" disabled={submitting || !appointmentId || serviceIds.length === 0 || !indication.trim()}>
              <ClipboardPlus size={17} /> {submitting ? "Đang tạo..." : "Tạo chỉ định"}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}

export default ClinicalOrderFormModal;
