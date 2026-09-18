import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarClock, Plus, RefreshCcw } from "lucide-react";
import toast from "react-hot-toast";
import { Navigate } from "react-router-dom";
import { ClinicalTypeIcon } from "../../components/clinical/ClinicalOrderWorkspace";
import {
  CLINICAL_TYPES,
  CLINICAL_TYPE_LABEL,
} from "../../components/clinical/clinical.constants";
import StaffLayout from "../../components/staff/StaffLayout";
import { getApiErrorMessage } from "../../api/axios";
import clinicService from "../../services/clinic.service";
import clinicalService from "../../services/clinical.service";
import { useAuth } from "../../context/AuthContext";

const SERVICE_TYPES = CLINICAL_TYPES.filter((item) => item.value !== "ALL");
const MINIMUM_DATE = new Date(Date.now() + 7 * 60 * 60 * 1000)
  .toISOString()
  .slice(0, 10);
const EMPTY_FORM = {
  service_type: "LAB",
  clinic_id: "",
  work_date: "",
  start_time: "08:00",
  end_time: "09:00",
  max_orders: 10,
};

function StaffClinicalSchedules() {
  const { user, loading: authLoading } = useAuth();
  const [clinics, setClinics] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [type, setType] = useState("ALL");
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [clinicResponse, scheduleResponse] = await Promise.all([
        clinicService.getClinics({ page: 1, limit: 100 }),
        clinicalService.getSchedules({
          page: 1,
          limit: 200,
          ...(type !== "ALL" ? { service_type: type } : {}),
        }),
      ]);
      const clinicData = clinicResponse.data || [];
      setClinics(clinicData);
      setSchedules(scheduleResponse.data || []);
      setForm((current) => ({
        ...current,
        clinic_id: current.clinic_id || clinicData[0]?.id || "",
      }));
    } catch (loadError) {
      const message = getApiErrorMessage(
        loadError,
        "Không tải được lịch cận lâm sàng",
      );
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [type]);

  useEffect(() => {
    if (["STAFF", "Admin"].includes(user?.role?.name)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadData();
    }
  }, [loadData, user?.role?.name]);

  const counts = useMemo(() => ({
    total: schedules.length,
    active: schedules.filter((item) => item.is_active).length,
    available: schedules.filter((item) => item.available).length,
  }), [schedules]);

  const resetForm = () => {
    setEditingId(null);
    setForm((current) => ({
      ...EMPTY_FORM,
      service_type: type === "ALL" ? "LAB" : type,
      clinic_id: current.clinic_id || clinics[0]?.id || "",
    }));
  };

  const saveSchedule = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        clinic_id: Number(form.clinic_id),
        max_orders: Number(form.max_orders),
      };
      if (editingId) {
        await clinicalService.updateSchedule(editingId, payload);
        toast.success("Đã cập nhật lịch cận lâm sàng");
      } else {
        await clinicalService.createSchedule(payload);
        toast.success("Đã tạo lịch cận lâm sàng");
      }
      resetForm();
      await loadData();
    } catch (saveError) {
      toast.error(
        getApiErrorMessage(saveError, "Không lưu được lịch cận lâm sàng"),
      );
    } finally {
      setSaving(false);
    }
  };

  const startEditing = (schedule) => {
    setEditingId(schedule.id);
    setForm({
      service_type: schedule.service_type || "LAB",
      clinic_id: schedule.clinic_id,
      work_date: schedule.work_date,
      start_time: schedule.start_time,
      end_time: schedule.end_time,
      max_orders: schedule.max_orders,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggleSchedule = async (schedule) => {
    setSaving(true);
    try {
      await clinicalService.updateSchedule(schedule.id, {
        is_active: !schedule.is_active,
      });
      toast.success(
        schedule.is_active ? "Đã tạm ngừng nhận lịch" : "Đã mở lại khung giờ",
      );
      await loadData();
    } catch (toggleError) {
      toast.error(
        getApiErrorMessage(toggleError, "Không cập nhật được khung giờ"),
      );
    } finally {
      setSaving(false);
    }
  };

  const removeSchedule = async (schedule) => {
    if (
      !window.confirm(
        `Xóa lịch ${CLINICAL_TYPE_LABEL[schedule.service_type]} ngày ${schedule.date_display}, ${schedule.time}?`,
      )
    ) return;

    setSaving(true);
    try {
      await clinicalService.deleteSchedule(schedule.id);
      toast.success("Đã xóa lịch cận lâm sàng");
      if (editingId === schedule.id) resetForm();
      await loadData();
    } catch (deleteError) {
      toast.error(
        getApiErrorMessage(deleteError, "Không xóa được khung giờ"),
      );
    } finally {
      setSaving(false);
    }
  };

  if (authLoading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (!["STAFF", "Admin"].includes(user.role?.name)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return (
    <StaffLayout title="Lịch cận lâm sàng">
      <div className="clinical-page clinical-schedule-page">
        <section className="clinical-page-hero">
          <div>
            <span className="clinical-eyebrow">
              <CalendarClock size={16} /> Điều phối thực hiện
            </span>
            <h1>Lịch cận lâm sàng</h1>
            <p>
              Tạo và quản lý khung giờ riêng cho Xét nghiệm, X-quang, Siêu âm,
              Nội soi và Điện tim.
            </p>
          </div>
        </section>

        <div className="clinical-summary-grid">
          <article className="clinical-summary-card">
            <CalendarClock size={21} />
            <div><strong>{counts.total}</strong><span>Tổng khung giờ</span></div>
          </article>
          <article className="clinical-summary-card clinical-summary-card--success">
            <CalendarClock size={21} />
            <div><strong>{counts.active}</strong><span>Đang hoạt động</span></div>
          </article>
          <article className="clinical-summary-card clinical-summary-card--info">
            <CalendarClock size={21} />
            <div><strong>{counts.available}</strong><span>Còn nhận lượt</span></div>
          </article>
        </div>

        <section className="dashboard-card staff-lab-schedule-card">
          <div className="staff-lab-section-head">
            <div>
              <h3>{editingId ? "Chỉnh sửa khung giờ" : "Tạo khung giờ mới"}</h3>
              <p>Mỗi loại cận lâm sàng có lịch và sức chứa riêng.</p>
            </div>
          </div>
          <form className="admin-form staff-lab-schedule-form clinical-schedule-form" onSubmit={saveSchedule}>
            <div className="admin-form-group">
              <label>Loại cận lâm sàng</label>
              <select
                className="admin-select"
                value={form.service_type}
                onChange={(event) => setForm((current) => ({
                  ...current,
                  service_type: event.target.value,
                }))}
              >
                {SERVICE_TYPES.map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </select>
            </div>
            <div className="admin-form-group">
              <label>Cơ sở</label>
              <select
                className="admin-select"
                value={form.clinic_id}
                onChange={(event) => setForm((current) => ({
                  ...current,
                  clinic_id: event.target.value,
                }))}
                required
                disabled={!clinics.length}
              >
                <option value="">Chọn cơ sở</option>
                {clinics.map((clinic) => (
                  <option key={clinic.id} value={clinic.id}>{clinic.name}</option>
                ))}
              </select>
            </div>
            <div className="admin-form-group">
              <label>Ngày</label>
              <input
                className="admin-input"
                type="date"
                min={MINIMUM_DATE}
                value={form.work_date}
                onChange={(event) => setForm((current) => ({
                  ...current,
                  work_date: event.target.value,
                }))}
                required
              />
            </div>
            <div className="admin-form-group">
              <label>Bắt đầu</label>
              <input
                className="admin-input"
                type="time"
                value={form.start_time}
                onChange={(event) => setForm((current) => ({
                  ...current,
                  start_time: event.target.value,
                }))}
                required
              />
            </div>
            <div className="admin-form-group">
              <label>Kết thúc</label>
              <input
                className="admin-input"
                type="time"
                value={form.end_time}
                onChange={(event) => setForm((current) => ({
                  ...current,
                  end_time: event.target.value,
                }))}
                required
              />
            </div>
            <div className="admin-form-group">
              <label>Số lượt tối đa</label>
              <input
                className="admin-input"
                type="number"
                min="1"
                max="200"
                value={form.max_orders}
                onChange={(event) => setForm((current) => ({
                  ...current,
                  max_orders: event.target.value,
                }))}
                required
              />
            </div>
            <div className="admin-form-actions">
              <button className="admin-btn admin-btn-primary" disabled={saving || !clinics.length}>
                <Plus size={16} /> {editingId ? "Lưu thay đổi" : "Thêm khung giờ"}
              </button>
              {editingId && (
                <button type="button" className="admin-btn admin-btn-secondary" onClick={resetForm} disabled={saving}>
                  Hủy sửa
                </button>
              )}
            </div>
          </form>
        </section>

        <section className="dashboard-card clinical-schedule-list-card">
          <div className="staff-lab-section-head clinical-schedule-list-head">
            <div>
              <h3>Danh sách khung giờ</h3>
              <p>Lọc theo loại dịch vụ để điều phối nhanh hơn.</p>
            </div>
            <select className="admin-select" value={type} onChange={(event) => setType(event.target.value)}>
              {CLINICAL_TYPES.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>
          </div>

          {loading ? (
            <div className="clinical-state"><span className="clinical-loading-spinner" /><p>Đang tải lịch...</p></div>
          ) : error ? (
            <div className="clinical-state clinical-state--error">
              <CalendarClock size={30} /><h3>Không tải được lịch</h3><p>{error}</p>
              <button type="button" className="clinical-button clinical-button--secondary" onClick={loadData}>
                <RefreshCcw size={16} /> Thử lại
              </button>
            </div>
          ) : schedules.length === 0 ? (
            <div className="clinical-state"><CalendarClock size={30} /><h3>Chưa có khung giờ</h3><p>Hãy tạo lịch cho loại cận lâm sàng đang chọn.</p></div>
          ) : (
            <div className="table-wrapper">
              <table className="admin-table clinical-schedule-table">
                <thead>
                  <tr><th>Loại</th><th>Cơ sở</th><th>Ngày</th><th>Khung giờ</th><th>Số lượt</th><th>Trạng thái</th><th /></tr>
                </thead>
                <tbody>
                  {schedules.map((schedule) => (
                    <tr key={schedule.id}>
                      <td>
                        <span className={`clinical-catalog-type clinical-catalog-type--${schedule.service_type.toLowerCase()}`}>
                          <ClinicalTypeIcon type={schedule.service_type} size={16} />
                          {CLINICAL_TYPE_LABEL[schedule.service_type]}
                        </span>
                      </td>
                      <td><strong>{schedule.clinic_name}</strong><small className="staff-lab-clinic-address">{schedule.clinic_address}</small></td>
                      <td>{schedule.date_display}</td>
                      <td>{schedule.time}</td>
                      <td>{schedule.booked_orders}/{schedule.max_orders}</td>
                      <td>{schedule.is_active ? (schedule.available ? "Đang nhận lịch" : "Đã đầy") : "Tạm ngừng"}</td>
                      <td>
                        <div className="staff-lab-row-actions">
                          <button type="button" className="admin-btn admin-btn-secondary" onClick={() => startEditing(schedule)} disabled={saving}>Sửa</button>
                          <button type="button" className="admin-btn admin-btn-secondary" onClick={() => toggleSchedule(schedule)} disabled={saving}>{schedule.is_active ? "Tạm ngừng" : "Mở lại"}</button>
                          {schedule.order_count === 0 && (
                            <button type="button" className="admin-btn admin-btn-danger" onClick={() => removeSchedule(schedule)} disabled={saving}>Xóa</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </StaffLayout>
  );
}

export default StaffClinicalSchedules;
