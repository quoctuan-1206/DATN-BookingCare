import { useEffect, useMemo, useState } from "react";
import { Pill, Plus, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import medicineService from "../../services/medicine.service";
import prescriptionService from "../../services/prescription.service";
import { getApiErrorMessage } from "../../api/axios";
import DoctorPrescriptionTable from "./DoctorPrescriptionTable";
import CollapseToggle from "./CollapseToggle";

const emptyItem = () => ({
  medicine_id: "",
  quantity: 1,
  dosage: "",
  instruction: "",
});

function PrescriptionForm({
  medicalRecordId,
  initialPrescription = null,
  onSaved,
  onSkip,
  readOnly = false,
}) {
  const hasPrescription = Boolean(initialPrescription?.id);
  const [medicines, setMedicines] = useState([]);
  const [loadingMedicines, setLoadingMedicines] = useState(true);
  const [editing, setEditing] = useState(!readOnly && !hasPrescription);
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [note, setNote] = useState(initialPrescription?.note || "");
  const [items, setItems] = useState(() => {
    if (initialPrescription?.items?.length) {
      return initialPrescription.items.map((item) => ({
        medicine_id: String(item.medicine_id),
        quantity: item.quantity,
        dosage: item.dosage || "",
        instruction: item.instruction || "",
      }));
    }
    return [emptyItem()];
  });

  useEffect(() => {
    let cancelled = false;

    async function loadMedicines() {
      setLoadingMedicines(true);
      try {
        const result = await medicineService.getMedicines({ limit: 200 });
        if (!cancelled) setMedicines(result.data || []);
      } catch (error) {
        if (!cancelled) {
          toast.error(getApiErrorMessage(error, "Không tải được danh sách thuốc"));
          setMedicines([]);
        }
      } finally {
        if (!cancelled) setLoadingMedicines(false);
      }
    }

    loadMedicines();
    return () => {
      cancelled = true;
    };
  }, []);

  const totalAmount = useMemo(() => {
    if (hasPrescription && !editing) {
      return initialPrescription.total_amount || 0;
    }

    return items.reduce((sum, item) => {
      const medicine = medicines.find(
        (m) => String(m.id) === String(item.medicine_id),
      );
      const price = Number(medicine?.price || 0);
      const qty = Number(item.quantity || 0);
      return sum + price * qty;
    }, 0);
  }, [items, medicines, hasPrescription, editing, initialPrescription]);

  const handleItemChange = (index, field, value) => {
    setItems((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)),
    );
  };

  const addItem = () => setItems((prev) => [...prev, emptyItem()]);

  const removeItem = (index) => {
    setItems((prev) =>
      prev.length <= 1 ? prev : prev.filter((_, i) => i !== index),
    );
  };

  const resetFromInitial = () => {
    setNote(initialPrescription?.note || "");
    setItems(
      initialPrescription?.items?.length
        ? initialPrescription.items.map((item) => ({
            medicine_id: String(item.medicine_id),
            quantity: item.quantity,
            dosage: item.dosage || "",
            instruction: item.instruction || "",
          }))
        : [emptyItem()],
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payloadItems = items
      .filter((item) => item.medicine_id)
      .map((item) => ({
        medicine_id: Number(item.medicine_id),
        quantity: Number(item.quantity),
        dosage: item.dosage.trim() || null,
        instruction: item.instruction.trim() || null,
      }));

    if (payloadItems.length === 0) {
      toast.error("Vui lòng chọn ít nhất một loại thuốc");
      return;
    }

    if (payloadItems.some((item) => !item.quantity || item.quantity < 1)) {
      toast.error("Số lượng thuốc phải lớn hơn 0");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        note: note.trim() || null,
        items: payloadItems,
      };

      if (hasPrescription) {
        await prescriptionService.update(initialPrescription.id, payload);
        toast.success("Đã cập nhật đơn thuốc");
      } else {
        await prescriptionService.create({
          ...payload,
          medical_record_id: Number(medicalRecordId),
        });
        toast.success("Đã kê đơn thuốc");
      }

      setEditing(false);
      onSaved?.();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không lưu được đơn thuốc"));
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (hasPrescription) {
      resetFromInitial();
      setEditing(false);
      return;
    }

    if (onSkip) {
      onSkip();
      return;
    }

    resetFromInitial();
  };

  if (readOnly || (hasPrescription && !editing)) {
    return (
      <div className="doctor-prescription-view">
        <header className="doctor-prescription-form__header">
          <div className="doctor-prescription-form__heading">
            <span className="doctor-prescription-form__icon" aria-hidden="true">
              <Pill size={19} />
            </span>
            <h3>Kê đơn thuốc</h3>
          </div>
          <div className="doctor-section-heading__actions">
            {!readOnly && expanded && (
              <button
                type="button"
                className="doctor-prescription-header-action"
                onClick={() => setEditing(true)}
              >
                Chỉnh sửa đơn
              </button>
            )}
            <CollapseToggle
              expanded={expanded}
              label="kê đơn thuốc"
              onToggle={() => setExpanded((value) => !value)}
            />
          </div>
        </header>

        <div className="doctor-prescription-view__body" hidden={!expanded}>
          <DoctorPrescriptionTable
            prescription={initialPrescription}
            emptyText="Chưa kê thuốc."
          />
        </div>
      </div>
    );
  }

  return (
    <form className="doctor-prescription-form" onSubmit={handleSubmit}>
      <header className="doctor-prescription-form__header">
        <div className="doctor-prescription-form__heading">
          <span className="doctor-prescription-form__icon" aria-hidden="true">
            <Pill size={19} />
          </span>
          <h3>Kê đơn thuốc</h3>
        </div>
        <div className="doctor-section-heading__actions">
          {!hasPrescription && onSkip && expanded && (
            <button
              type="button"
              className="doctor-prescription-skip-btn"
              onClick={onSkip}
            >
              Không kê thuốc
            </button>
          )}
          <CollapseToggle
            expanded={expanded}
            label="kê đơn thuốc"
            onToggle={() => setExpanded((value) => !value)}
          />
        </div>
      </header>

      <div className="doctor-prescription-form__body" hidden={!expanded}>
        {loadingMedicines ? (
          <p className="doctor-prescription-form__state">Đang tải danh sách thuốc...</p>
        ) : medicines.length === 0 ? (
          <p className="doctor-prescription-form__state">
            Chưa có thuốc trong hệ thống. Vui lòng liên hệ quản trị viên.
          </p>
        ) : (
          <>
            <section className="doctor-prescription-medicines" aria-labelledby="prescription-medicines-title">
              <h4 id="prescription-medicines-title">Danh sách thuốc</h4>

              <div className="prescription-table-wrap">
                <div className="prescription-table" role="table" aria-label="Danh sách thuốc kê đơn">
                  <div className="prescription-table__head" role="row">
                    <span role="columnheader">STT</span>
                    <span role="columnheader">Tên thuốc</span>
                    <span role="columnheader">Liều dùng</span>
                    <span role="columnheader">Số lượng</span>
                    <span role="columnheader">Đơn vị</span>
                    <span role="columnheader">Hướng dẫn</span>
                    <span role="columnheader">Thao tác</span>
                  </div>

                  {items.map((item, index) => {
                    const selectedMedicine = medicines.find(
                      (medicine) => String(medicine.id) === String(item.medicine_id),
                    );

                    return (
                      <div key={index} className="prescription-item-row" role="row">
                        <span className="prescription-item-index" role="cell">{index + 1}</span>

                        <div role="cell">
                          <label className="sr-only" htmlFor={`prescription_medicine_${index}`}>Tên thuốc</label>
                          <select
                            id={`prescription_medicine_${index}`}
                            value={item.medicine_id}
                            onChange={(e) =>
                              handleItemChange(index, "medicine_id", e.target.value)
                            }
                            required
                          >
                            <option value="">Chọn thuốc...</option>
                            {medicines.map((medicine) => (
                              <option key={medicine.id} value={medicine.id}>
                                {medicine.name}
                                {medicine.unit ? ` (${medicine.unit})` : ""}
                                {medicine.price
                                  ? ` — ${Number(medicine.price).toLocaleString("vi-VN")} đ`
                                  : ""}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div role="cell">
                          <label className="sr-only" htmlFor={`prescription_dosage_${index}`}>Liều dùng</label>
                          <input
                            id={`prescription_dosage_${index}`}
                            type="text"
                            placeholder="VD: 1 viên x 2 lần/ngày"
                            value={item.dosage}
                            onChange={(e) =>
                              handleItemChange(index, "dosage", e.target.value)
                            }
                          />
                        </div>

                        <div role="cell">
                          <label className="sr-only" htmlFor={`prescription_quantity_${index}`}>Số lượng</label>
                          <input
                            id={`prescription_quantity_${index}`}
                            type="number"
                            min={1}
                            value={item.quantity}
                            onChange={(e) =>
                              handleItemChange(index, "quantity", e.target.value)
                            }
                            required
                          />
                        </div>

                        <div role="cell">
                          <label className="sr-only" htmlFor={`prescription_unit_${index}`}>Đơn vị</label>
                          <input
                            id={`prescription_unit_${index}`}
                            type="text"
                            value={selectedMedicine?.unit || "viên"}
                            readOnly
                          />
                        </div>

                        <div role="cell">
                          <label className="sr-only" htmlFor={`prescription_instruction_${index}`}>Hướng dẫn</label>
                          <input
                            id={`prescription_instruction_${index}`}
                            type="text"
                            placeholder="VD: Uống sau ăn"
                            value={item.instruction}
                            onChange={(e) =>
                              handleItemChange(index, "instruction", e.target.value)
                            }
                          />
                        </div>

                        <div className="prescription-item-action" role="cell">
                          <button
                            type="button"
                            className="prescription-remove-btn"
                            onClick={() => removeItem(index)}
                            disabled={items.length <= 1}
                            aria-label={`Xóa thuốc dòng ${index + 1}`}
                          >
                            <Trash2 size={17} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <button
                type="button"
                className="doctor-prescription-add-btn"
                onClick={addItem}
              >
                <Plus size={16} />
                Thêm thuốc
              </button>
            </section>

            <div className="doctor-prescription-details">
              <section className="doctor-prescription-note-panel">
                <label htmlFor="prescription_note">Ghi chú đơn thuốc</label>
                <textarea
                  id="prescription_note"
                  rows={3}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="VD: Uống đủ liệu trình 5 ngày"
                />

              </section>

              <aside className="doctor-prescription-total-card" aria-live="polite">
                <span>Tổng tiền thuốc</span>
                <strong>{Number(totalAmount).toLocaleString("vi-VN")} đ</strong>
                <p>Chi phí thuốc sẽ được cập nhật sau khi lưu đơn thuốc.</p>
              </aside>
            </div>

            <footer className="doctor-prescription-form__footer">
              <p>
                Tạm tính: <strong>{Number(totalAmount).toLocaleString("vi-VN")} đ</strong>
              </p>
              <div className="doctor-prescription-form__actions">
                <button
                  type="button"
                  className="doctor-prescription-cancel-btn"
                  disabled={saving}
                  onClick={handleCancel}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="doctor-prescription-save-btn"
                  disabled={saving}
                >
                  {saving ? "Đang lưu..." : "Lưu đơn thuốc"}
                </button>
              </div>
            </footer>
          </>
        )}
      </div>
    </form>
  );
}

export default PrescriptionForm;
