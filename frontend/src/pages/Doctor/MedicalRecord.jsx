import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import DoctorLayout from "../../components/doctor-dashboard/layout/DoctorLayout";
import appointmentService from "../../services/appointment.service";
import medicalRecordService from "../../services/medical-record.service";
import { getApiErrorMessage } from "../../api/axios";

const emptyForm = {
  appointment_id: "",
  symptoms: "",
  diagnosis: "",
  conclusion: "",
  note: "",
};

function MedicalRecord() {
  const [records, setRecords] = useState([]);
  const [eligibleAppointments, setEligibleAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(emptyForm);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [recordsResult, confirmed, completed] = await Promise.all([
        medicalRecordService.getRecords({ page: 1, limit: 50 }),
        appointmentService.getAppointments({
          status: "CONFIRMED",
          page: 1,
          limit: 50,
        }),
        appointmentService.getAppointments({
          status: "COMPLETED",
          page: 1,
          limit: 50,
        }),
      ]);

      const existingAppointmentIds = new Set(
        (recordsResult.data || []).map((r) => r.appointment_id),
      );

      const eligible = [...confirmed.data, ...completed.data].filter(
        (a) => !existingAppointmentIds.has(a.id),
      );

      setRecords(recordsResult.data || []);
      setEligibleAppointments(eligible);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không tải được bệnh án"));
      setRecords([]);
      setEligibleAppointments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openCreate = () => {
    setEditingId(null);
    setFormData(emptyForm);
    setShowForm(true);
  };

  const openEdit = (record) => {
    setEditingId(record.id);
    setFormData({
      appointment_id: String(record.appointment_id),
      symptoms: record.symptoms === "—" ? "" : record.symptoms || "",
      diagnosis: record.diagnosis === "—" ? "" : record.diagnosis || "",
      conclusion: record.conclusion === "—" ? "" : record.conclusion || "",
      note: record.note || "",
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData(emptyForm);
  };

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

    if (!editingId && !formData.appointment_id) {
      toast.error("Vui lòng chọn lịch hẹn");
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

      if (editingId) {
        await medicalRecordService.update(editingId, payload);
        toast.success("Đã cập nhật bệnh án");
      } else {
        await medicalRecordService.create({
          ...payload,
          appointment_id: Number(formData.appointment_id),
        });
        toast.success("Đã tạo bệnh án");
      }

      closeForm();
      await loadData();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không lưu được bệnh án"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <DoctorLayout title="Hồ sơ bệnh án">
      <div className="doctor-page">
        <div className="doctor-card" style={{ marginBottom: 20 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
              marginBottom: 12,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <div>
              <h3>Hồ sơ bệnh án</h3>
              <p style={{ color: "#666", marginTop: 4 }}>
                Ghi bệnh án cho lịch đã xác nhận / hoàn thành.
              </p>
            </div>
            <button
              type="button"
              className="admin-btn admin-btn-primary"
              onClick={openCreate}
              disabled={eligibleAppointments.length === 0 && !editingId}
            >
              + Tạo bệnh án
            </button>
          </div>

          {showForm && (
            <form
              className="admin-form"
              onSubmit={handleSubmit}
              style={{ marginTop: 16 }}
            >
              {!editingId && (
                <div className="admin-form-group">
                  <label htmlFor="appointment_id">Lịch hẹn</label>
                  <select
                    id="appointment_id"
                    name="appointment_id"
                    className="admin-select"
                    value={formData.appointment_id}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Chọn lịch hẹn...</option>
                    {eligibleAppointments.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.booking_code} · {a.patient_name} · {a.date_display}{" "}
                        {a.start_time}
                      </option>
                    ))}
                  </select>
                </div>
              )}

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

              <div className="admin-form-actions">
                <button
                  type="submit"
                  className="admin-btn admin-btn-primary"
                  disabled={saving}
                >
                  {saving
                    ? "Đang lưu..."
                    : editingId
                      ? "Cập nhật bệnh án"
                      : "Lưu bệnh án"}
                </button>
                <button
                  type="button"
                  className="admin-btn admin-btn-secondary"
                  onClick={closeForm}
                >
                  Hủy
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="doctor-card">
          <h3 style={{ marginBottom: 12 }}>Danh sách bệnh án</h3>
          {loading ? (
            <p>Đang tải...</p>
          ) : records.length === 0 ? (
            <p>Chưa có bệnh án nào.</p>
          ) : (
            <div className="table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Mã lịch</th>
                    <th>Bệnh nhân</th>
                    <th>Ngày</th>
                    <th>Chẩn đoán</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((item) => (
                    <tr key={item.id}>
                      <td>{item.booking_code}</td>
                      <td>{item.patient_name}</td>
                      <td>
                        {item.date_display} {item.start_time}
                      </td>
                      <td>{item.diagnosis}</td>
                      <td>
                        <button
                          type="button"
                          className="admin-btn admin-btn-secondary"
                          onClick={() => openEdit(item)}
                        >
                          Sửa
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DoctorLayout>
  );
}

export default MedicalRecord;
