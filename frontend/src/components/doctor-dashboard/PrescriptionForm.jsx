import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import medicineService from "../../services/medicine.service";
import prescriptionService from "../../services/prescription.service";
import { getApiErrorMessage } from "../../api/axios";

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

  if (readOnly || (hasPrescription && !editing)) {
    const displayItems = initialPrescription?.items || [];

    return (
      <div className="doctor-prescription-view">
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
          <h4 style={{ margin: 0 }}>Đơn thuốc</h4>
          {!readOnly && (
            <button
              type="button"
              className="admin-btn admin-btn-secondary"
              onClick={() => setEditing(true)}
            >
              Chỉnh sửa đơn
            </button>
          )}
        </div>

        {displayItems.length === 0 ? (
          <p style={{ margin: 0, color: "#64748b" }}>Chưa kê thuốc.</p>
        ) : (
          <div className="table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Thuốc</th>
                  <th>Số lượng</th>
                  <th>Liều dùng</th>
                  <th>Hướng dẫn</th>
                  <th>Thành tiền</th>
                </tr>
              </thead>
              <tbody>
                {displayItems.map((item) => (
                  <tr key={item.id || `${item.medicine_id}-${item.dosage}`}>
                    <td>{item.medicine_name}</td>
                    <td>
                      {item.quantity} {item.unit || ""}
                    </td>
                    <td>{item.dosage || "—"}</td>
                    <td>{item.instruction || "—"}</td>
                    <td>
                      {Number(item.line_total || 0).toLocaleString("vi-VN")} đ
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {initialPrescription?.note && (
          <p style={{ marginTop: 12, color: "#475569" }}>
            <strong>Ghi chú đơn:</strong> {initialPrescription.note}
          </p>
        )}

        {displayItems.length > 0 && (
          <p style={{ marginTop: 12, fontWeight: 600 }}>
            Tổng tiền thuốc: {Number(totalAmount).toLocaleString("vi-VN")} đ
          </p>
        )}
      </div>
    );
  }

  return (
    <form className="admin-form doctor-prescription-form" onSubmit={handleSubmit}>
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
        <h4 style={{ margin: 0 }}>
          {hasPrescription ? "Cập nhật đơn thuốc" : "Kê đơn thuốc"}
        </h4>
        {!hasPrescription && onSkip && (
          <button
            type="button"
            className="admin-btn admin-btn-secondary"
            onClick={onSkip}
          >
            Không kê thuốc
          </button>
        )}
      </div>

      {loadingMedicines ? (
        <p>Đang tải danh sách thuốc...</p>
      ) : medicines.length === 0 ? (
        <p>Chưa có thuốc trong hệ thống. Vui lòng liên hệ quản trị viên.</p>
      ) : (
        <>
          <div className="prescription-items">
            {items.map((item, index) => (
              <div key={index} className="prescription-item-row">
                <div className="admin-form-group">
                  <label>Thuốc</label>
                  <select
                    className="admin-select"
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

                <div className="admin-form-group">
                  <label>Số lượng</label>
                  <input
                    type="number"
                    className="admin-input"
                    min={1}
                    value={item.quantity}
                    onChange={(e) =>
                      handleItemChange(index, "quantity", e.target.value)
                    }
                    required
                  />
                </div>

                <div className="admin-form-group">
                  <label>Liều dùng</label>
                  <input
                    type="text"
                    className="admin-input"
                    placeholder="VD: 1 viên x 2 lần/ngày"
                    value={item.dosage}
                    onChange={(e) =>
                      handleItemChange(index, "dosage", e.target.value)
                    }
                  />
                </div>

                <div className="admin-form-group">
                  <label>Hướng dẫn</label>
                  <input
                    type="text"
                    className="admin-input"
                    placeholder="VD: Uống sau ăn"
                    value={item.instruction}
                    onChange={(e) =>
                      handleItemChange(index, "instruction", e.target.value)
                    }
                  />
                </div>

                <button
                  type="button"
                  className="admin-btn admin-btn-danger prescription-remove-btn"
                  onClick={() => removeItem(index)}
                  disabled={items.length <= 1}
                  aria-label="Xóa dòng thuốc"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            className="admin-btn admin-btn-secondary"
            onClick={addItem}
            style={{ marginBottom: 16 }}
          >
            <Plus size={16} style={{ marginRight: 6 }} />
            Thêm thuốc
          </button>

          <div className="admin-form-group">
            <label htmlFor="prescription_note">Ghi chú đơn thuốc</label>
            <textarea
              id="prescription_note"
              className="admin-textarea"
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="VD: Uống đủ liệu trình 5 ngày"
            />
          </div>

          <p style={{ margin: "0 0 16px", fontWeight: 600 }}>
            Tạm tính: {Number(totalAmount).toLocaleString("vi-VN")} đ
          </p>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button
              type="submit"
              className="admin-btn admin-btn-primary"
              disabled={saving}
            >
              {saving
                ? "Đang lưu..."
                : hasPrescription
                  ? "Cập nhật đơn thuốc"
                  : "Lưu đơn thuốc"}
            </button>
            {hasPrescription && (
              <button
                type="button"
                className="admin-btn admin-btn-secondary"
                disabled={saving}
                onClick={() => {
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
                  setEditing(false);
                }}
              >
                Hủy
              </button>
            )}
          </div>
        </>
      )}
    </form>
  );
}

export default PrescriptionForm;
