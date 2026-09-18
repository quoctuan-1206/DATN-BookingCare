import { Fragment, useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import DoctorLayout from "../../components/doctor-dashboard/layout/DoctorLayout";
import DoctorPrescriptionTable from "../../components/doctor-dashboard/DoctorPrescriptionTable";
import ClinicalRecordSection from "../../components/clinical/ClinicalRecordSection";
import medicalRecordService from "../../services/medical-record.service";
import clinicalService from "../../services/clinical.service";
import { getApiErrorMessage } from "../../api/axios";

const emptyForm = {
  symptoms: "",
  diagnosis: "",
  conclusion: "",
  note: "",
};

function MedicalRecord() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [expandedId, setExpandedId] = useState(null);
  const [clinicalExpandedId, setClinicalExpandedId] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const recordsResult = await medicalRecordService.getRecords({
        page: 1,
        limit: 50,
      });
      setRecords(recordsResult.data || []);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không tải được bệnh án"));
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openEdit = (record) => {
    setExpandedId(null);
    setClinicalExpandedId(null);
    setEditingId(record.id);
    setFormData({
      symptoms: record.symptoms === "—" ? "" : record.symptoms || "",
      diagnosis: record.diagnosis === "—" ? "" : record.diagnosis || "",
      conclusion: record.conclusion === "—" ? "" : record.conclusion || "",
      note: record.note || "",
    });
  };

  const closeEdit = () => {
    setEditingId(null);
    setFormData(emptyForm);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!editingId) return;

    if (!formData.diagnosis.trim()) {
      toast.error("Vui lòng nhập chẩn đoán");
      return;
    }

    setSaving(true);
    try {
      await medicalRecordService.update(editingId, {
        symptoms: formData.symptoms.trim() || null,
        diagnosis: formData.diagnosis.trim(),
        conclusion: formData.conclusion.trim() || null,
        note: formData.note.trim() || null,
      });
      toast.success("Đã cập nhật bệnh án");
      closeEdit();
      await loadData();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không lưu được bệnh án"));
    } finally {
      setSaving(false);
    }
  };

  const openClinicalAttachment = async (attachment) => {
    try {
      await clinicalService.openAttachment(attachment);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không mở được tệp cận lâm sàng"));
    }
  };

  return (
    <DoctorLayout title="Hồ sơ bệnh án">
      <div className="doctor-page">
        <div className="doctor-card">
          <div style={{ marginBottom: 12 }}>
            <h3>Danh sách bệnh án</h3>
            <p style={{ color: "#666", marginTop: 4 }}>
              Xem và chỉnh sửa bệnh án đã tạo từ lịch khám.
            </p>
          </div>

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
                    <th>Ngày / giờ bắt đầu</th>
                    <th>Chẩn đoán</th>
                    <th>Đơn thuốc</th>
                    <th>Cận lâm sàng</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((item) => {
                    const isExpanded = expandedId === item.id;
                    const isClinicalExpanded = clinicalExpandedId === item.id;
                    const isEditing = editingId === item.id;

                    return (
                      <Fragment key={item.id}>
                        <tr>
                          <td>{item.booking_code}</td>
                          <td>{item.patient_name}</td>
                          <td>
                            {item.date_display}
                            <br />
                            <strong>{item.start_time || "—"}</strong>
                          </td>
                          <td>{item.diagnosis}</td>
                          <td>
                            {item.has_prescription ? (
                              <button
                                type="button"
                                className="admin-btn admin-btn-secondary"
                                onClick={() => {
                                  closeEdit();
                                  setExpandedId(isExpanded ? null : item.id);
                                }}
                              >
                                {isExpanded ? "Ẩn đơn" : "Xem đơn"}
                              </button>
                            ) : (
                              <span className="doctor-muted">Chưa kê</span>
                            )}
                          </td>
                          <td>
                            {item.has_clinical_services || item.clinical_services?.length ? (
                              <button
                                type="button"
                                className="admin-btn admin-btn-secondary"
                                onClick={() => {
                                  closeEdit();
                                  setExpandedId(null);
                                  setClinicalExpandedId(isClinicalExpanded ? null : item.id);
                                }}
                              >
                                {isClinicalExpanded ? "Ẩn kết quả" : "Xem kết quả"}
                              </button>
                            ) : (
                              <span className="doctor-muted">Chưa có</span>
                            )}
                          </td>
                          <td>
                            <div
                              style={{
                                display: "flex",
                                gap: 8,
                                flexWrap: "wrap",
                              }}
                            >
                              <button
                                type="button"
                                className="admin-btn admin-btn-secondary"
                                onClick={() =>
                                  isEditing ? closeEdit() : openEdit(item)
                                }
                              >
                                {isEditing ? "Đóng" : "Sửa"}
                              </button>
                              <Link
                                to={`/doctor/appointments/${item.appointment_id}`}
                                className="admin-btn admin-btn-primary"
                              >
                                Chi tiết
                              </Link>
                            </div>
                          </td>
                        </tr>

                        {isEditing ? (
                          <tr className="doctor-rx-expand-row">
                            <td colSpan={7}>
                              <form
                                className="admin-form"
                                onSubmit={handleSubmit}
                              >
                                <div className="admin-form-group">
                                  <label htmlFor={`symptoms-${item.id}`}>
                                    Triệu chứng
                                  </label>
                                  <textarea
                                    id={`symptoms-${item.id}`}
                                    name="symptoms"
                                    className="admin-textarea"
                                    rows={3}
                                    value={formData.symptoms}
                                    onChange={handleChange}
                                  />
                                </div>

                                <div className="admin-form-group">
                                  <label htmlFor={`diagnosis-${item.id}`}>
                                    Chẩn đoán
                                  </label>
                                  <textarea
                                    id={`diagnosis-${item.id}`}
                                    name="diagnosis"
                                    className="admin-textarea"
                                    rows={3}
                                    value={formData.diagnosis}
                                    onChange={handleChange}
                                    required
                                  />
                                </div>

                                <div className="admin-form-group">
                                  <label htmlFor={`conclusion-${item.id}`}>
                                    Kết luận
                                  </label>
                                  <textarea
                                    id={`conclusion-${item.id}`}
                                    name="conclusion"
                                    className="admin-textarea"
                                    rows={3}
                                    value={formData.conclusion}
                                    onChange={handleChange}
                                  />
                                </div>

                                <div className="admin-form-group">
                                  <label htmlFor={`note-${item.id}`}>
                                    Ghi chú
                                  </label>
                                  <textarea
                                    id={`note-${item.id}`}
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
                                      : "Cập nhật bệnh án"}
                                  </button>
                                  <button
                                    type="button"
                                    className="admin-btn admin-btn-secondary"
                                    onClick={closeEdit}
                                  >
                                    Hủy
                                  </button>
                                </div>
                              </form>
                            </td>
                          </tr>
                        ) : null}

                        {isExpanded && item.prescription ? (
                          <tr className="doctor-rx-expand-row">
                            <td colSpan={7}>
                              <DoctorPrescriptionTable
                                prescription={item.prescription}
                              />
                            </td>
                          </tr>
                        ) : null}

                        {isClinicalExpanded ? (
                          <tr className="doctor-rx-expand-row">
                            <td colSpan={7}>
                              <ClinicalRecordSection
                                orders={item.clinical_services || []}
                                onOpenAttachment={openClinicalAttachment}
                              />
                            </td>
                          </tr>
                        ) : null}
                      </Fragment>
                    );
                  })}
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
