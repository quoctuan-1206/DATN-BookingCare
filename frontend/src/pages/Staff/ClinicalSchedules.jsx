import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  Clock3,
  MapPin,
  PauseCircle,
  PlayCircle,
  Plus,
  RefreshCcw,
  Search,
  UsersRound,
  X,
} from "lucide-react";
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
  const [statsSchedules, setStatsSchedules] = useState([]);
  const [type, setType] = useState("ALL");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedScheduleId, setSelectedScheduleId] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const staffUser = user?.role?.name === "STAFF";
      const [clinicResponse, scheduleResponse, statsResponse] = await Promise.all([
        staffUser
          ? Promise.resolve({ data: user?.clinics ? [user.clinics] : [] })
          : clinicService.getClinics({ page: 1, limit: 100 }),
        clinicalService.getSchedules({
          page: 1,
          limit: 200,
          ...(type !== "ALL" ? { service_type: type } : {}),
        }),
        type === "ALL"
          ? Promise.resolve(null)
          : clinicalService.getSchedules({ page: 1, limit: 200 }),
      ]);
      const clinicData = (clinicResponse.data || []).filter((clinic) => clinic.is_active !== false);
      setClinics(clinicData);
      setSchedules(scheduleResponse.data || []);
      setStatsSchedules((statsResponse || scheduleResponse).data || []);
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
  }, [type, user?.role?.name, user?.clinic_id, user?.clinics?.name]);

  useEffect(() => {
    if (["STAFF", "Admin"].includes(user?.role?.name)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadData();
    }
  }, [loadData, user?.role?.name]);

  const counts = useMemo(() => ({
    total: statsSchedules.length,
    active: statsSchedules.filter((item) => item.is_active).length,
    paused: statsSchedules.filter((item) => !item.is_active).length,
    available: statsSchedules.filter((item) => item.available).length,
  }), [statsSchedules]);

  const visibleSchedules = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("vi");
    return schedules.filter((schedule) => {
      const matchesSearch = !query || [
        schedule.clinic_name,
        schedule.clinic_address,
        schedule.date_display,
        schedule.time,
        CLINICAL_TYPE_LABEL[schedule.service_type],
      ].some((value) => String(value || "").toLocaleLowerCase("vi").includes(query));
      const matchesStatus = statusFilter === "ALL"
        || (statusFilter === "ACTIVE" && schedule.is_active)
        || (statusFilter === "PAUSED" && !schedule.is_active)
        || (statusFilter === "AVAILABLE" && schedule.is_active && schedule.available)
        || (statusFilter === "FULL" && schedule.is_active && !schedule.available);
      return matchesSearch && matchesStatus;
    });
  }, [schedules, search, statusFilter]);

  const pageSize = 10;
  const pageCount = Math.max(1, Math.ceil(visibleSchedules.length / pageSize));
  const pageSchedules = visibleSchedules.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const selectedSchedule = schedules.find((item) => item.id === selectedScheduleId) || null;

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
      if (selectedScheduleId === schedule.id) setSelectedScheduleId(null);
      await loadData();
    } catch (deleteError) {
      toast.error(
        getApiErrorMessage(deleteError, "Không xóa được khung giờ"),
      );
    } finally {
      setSaving(false);
    }
  };

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("ALL");
    setType("ALL");
    setCurrentPage(1);
  };

  if (authLoading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (!["STAFF", "Admin"].includes(user.role?.name)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return (
    <StaffLayout title="Lịch cận lâm sàng">
      <div className="clinical-page clinical-schedule-page">
        <section className="clinical-page-hero clinical-schedule-hero">
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

        <div className="clinical-summary-grid clinical-summary-grid--admin clinical-schedule-stats">
          <article className="clinical-summary-card">
            <CalendarDays size={21} />
            <div><strong>{loading ? <i className="clinical-schedule-skeleton-number" /> : counts.total}</strong><span>Tổng khung giờ</span></div>
          </article>
          <article className="clinical-summary-card clinical-summary-card--success">
            <PlayCircle size={21} />
            <div><strong>{loading ? <i className="clinical-schedule-skeleton-number" /> : counts.active}</strong><span>Đang hoạt động</span></div>
          </article>
          <article className="clinical-summary-card clinical-summary-card--warning">
            <PauseCircle size={21} />
            <div><strong>{loading ? <i className="clinical-schedule-skeleton-number" /> : counts.paused}</strong><span>Tạm ngưng</span></div>
          </article>
          <article className="clinical-summary-card clinical-summary-card--info">
            <CheckCircle2 size={21} />
            <div><strong>{loading ? <i className="clinical-schedule-skeleton-number" /> : counts.available}</strong><span>Còn nhận lượt</span></div>
          </article>
        </div>

        <div className="clinical-schedule-workspace">
          <main className="clinical-schedule-content">
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
                disabled={user?.role?.name === "STAFF" || !clinics.length}
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
            <div className="clinical-schedule-filters">
              <label className="clinical-schedule-search"><Search size={16} /><input aria-label="Tìm khung giờ" placeholder="Tìm cơ sở, ngày, dịch vụ" value={search} onChange={(event) => { setSearch(event.target.value); setCurrentPage(1); }} /></label>
              <select className="admin-select" aria-label="Lọc loại cận lâm sàng" value={type} onChange={(event) => { setType(event.target.value); setCurrentPage(1); }}>
                {CLINICAL_TYPES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
              <select className="admin-select" aria-label="Lọc trạng thái" value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setCurrentPage(1); }}>
                <option value="ALL">Tất cả trạng thái</option><option value="AVAILABLE">Đang nhận lịch</option><option value="ACTIVE">Đang hoạt động</option><option value="PAUSED">Tạm ngưng</option><option value="FULL">Đã đầy</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="clinical-schedule-table-skeleton" aria-label="Đang tải danh sách khung giờ" aria-busy="true">{Array.from({ length: 5 }, (_, index) => <i key={index} />)}</div>
          ) : error ? (
            <div className="clinical-state clinical-state--error">
              <CalendarClock size={30} /><h3>Không tải được lịch</h3><p>{error}</p>
              <button type="button" className="clinical-button clinical-button--secondary" onClick={loadData}>
                <RefreshCcw size={16} /> Thử lại
              </button>
            </div>
          ) : schedules.length === 0 ? (
            <div className="clinical-state"><CalendarClock size={30} /><h3>Chưa có khung giờ</h3><p>Hãy tạo lịch cho loại cận lâm sàng đang chọn.</p></div>
          ) : visibleSchedules.length === 0 ? (
            <div className="clinical-state clinical-schedule-no-results"><Search size={28} /><h3>Không tìm thấy khung giờ phù hợp</h3><p>Thử thay đổi từ khóa hoặc bộ lọc.</p><button type="button" className="clinical-button clinical-button--secondary" onClick={clearFilters}>Xóa bộ lọc</button></div>
          ) : (
            <div className="table-wrapper">
              <table className="admin-table clinical-schedule-table">
                <thead>
                  <tr><th>STT</th><th>Loại</th><th>Cơ sở</th><th>Ngày</th><th>Khung giờ</th><th>Số lượt</th><th>Trạng thái</th><th>Thao tác</th></tr>
                </thead>
                <tbody>
                  {pageSchedules.map((schedule, index) => (
                    <tr key={schedule.id} className={schedule.id === selectedScheduleId ? "is-selected" : ""} onClick={() => { setSelectedScheduleId(schedule.id); setPreviewOpen(true); }}>
                      <td>{(currentPage - 1) * pageSize + index + 1}</td>
                      <td>
                        <span className={`clinical-catalog-type clinical-catalog-type--${schedule.service_type.toLowerCase()}`}>
                          <ClinicalTypeIcon type={schedule.service_type} size={16} />
                          {schedule.service_type_label || CLINICAL_TYPE_LABEL[schedule.service_type]}
                        </span>
                      </td>
                      <td><strong>{schedule.clinic_name}</strong><small className="staff-lab-clinic-address">{schedule.clinic_address}</small></td>
                      <td>{schedule.date_display}</td>
                      <td>{schedule.time}</td>
                      <td>{schedule.booked_orders}/{schedule.max_orders}</td>
                      <td><span className={`clinical-schedule-status clinical-schedule-status--${!schedule.is_active ? "paused" : schedule.available ? "available" : "full"}`}>{!schedule.is_active ? "Tạm ngừng" : schedule.available ? "Đang nhận lịch" : "Đã đầy"}</span></td>
                      <td onClick={(event) => event.stopPropagation()}>
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
              <div className="clinical-schedule-table-pagination">
                <span>Hiển thị {Math.min((currentPage - 1) * pageSize + 1, visibleSchedules.length)}–{Math.min(currentPage * pageSize, visibleSchedules.length)} trên {visibleSchedules.length} khung giờ</span>
                <div><button type="button" onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} disabled={currentPage <= 1}>Trước</button><span>Trang {currentPage} / {pageCount}</span><button type="button" onClick={() => setCurrentPage((page) => Math.min(pageCount, page + 1))} disabled={currentPage >= pageCount}>Sau</button></div>
              </div>
            </div>
          )}
        </section>
          </main>
          <SchedulePreview
            schedule={selectedSchedule}
            open={previewOpen}
            loading={loading}
            onClose={() => setPreviewOpen(false)}
            onEdit={startEditing}
            onToggle={toggleSchedule}
            onDelete={removeSchedule}
            saving={saving}
          />
        </div>
      </div>
    </StaffLayout>
  );
}

function SchedulePreview({ schedule, open, loading, onClose, onEdit, onToggle, onDelete, saving }) {
  if (!open) return null;
  if (loading) {
    return <aside className="clinical-schedule-preview" aria-label="Đang tải chi tiết khung giờ" aria-busy="true">
      <div className="clinical-schedule-preview-head"><div><span>THÔNG TIN ĐANG CHỌN</span><h2>Chi tiết khung giờ</h2></div><button type="button" aria-label="Đóng chi tiết" onClick={onClose}><X size={18} /></button></div>
      <div className="clinical-schedule-preview-loading"><i /><i /><i /><i /></div>
    </aside>;
  }
  if (!schedule) {
    return (
      <aside className="clinical-schedule-preview" aria-label="Chi tiết khung giờ">
        <div className="clinical-schedule-preview-head">
          <div><span>THÔNG TIN ĐANG CHỌN</span><h2>Chi tiết khung giờ</h2></div>
          <button type="button" aria-label="Đóng chi tiết" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="clinical-schedule-preview-empty"><CalendarClock size={30} /><strong>Chọn một khung giờ</strong><p>Thông tin chi tiết và thao tác sẽ hiển thị tại đây.</p></div>
      </aside>
    );
  }

  const status = !schedule.is_active ? "paused" : schedule.available ? "available" : "full";
  const serviceLabel = schedule.service_type_label || CLINICAL_TYPE_LABEL[schedule.service_type] || "Cận lâm sàng";
  const progress = schedule.max_orders ? Math.min(100, (schedule.booked_orders / schedule.max_orders) * 100) : 0;

  return (
    <aside className="clinical-schedule-preview" aria-label="Chi tiết khung giờ">
      <div className="clinical-schedule-preview-head">
        <div><span>THÔNG TIN ĐANG CHỌN</span><h2>Chi tiết khung giờ</h2></div>
        <button type="button" aria-label="Đóng chi tiết" onClick={onClose}><X size={18} /></button>
      </div>
      <div className="clinical-schedule-preview-service">
        <span className={`clinical-schedule-preview-icon clinical-catalog-type--${schedule.service_type.toLowerCase()}`}><ClinicalTypeIcon type={schedule.service_type} size={22} /></span>
        <div><strong>{serviceLabel}</strong><span className={`clinical-schedule-status clinical-schedule-status--${status}`}>{status === "paused" ? "Tạm ngưng" : status === "available" ? "Đang nhận lịch" : "Đã đầy"}</span></div>
      </div>
      <div className="clinical-schedule-preview-progress">
        <div><span>Chỗ đã đăng ký</span><strong>{schedule.booked_orders}/{schedule.max_orders}</strong></div>
        <div className="clinical-schedule-progress-track"><span style={{ width: `${progress}%` }} /></div>
        <small>Còn {schedule.remaining} lượt</small>
      </div>
      <div className="clinical-schedule-preview-details">
        <div><MapPin size={17} /><span><small>Cơ sở</small><strong>{schedule.clinic_name || "Chưa có thông tin"}</strong>{schedule.clinic_address && <em>{schedule.clinic_address}</em>}</span></div>
        <div><CalendarDays size={17} /><span><small>Ngày thực hiện</small><strong>{schedule.date_display || "Chưa có thông tin"}</strong></span></div>
        <div><Clock3 size={17} /><span><small>Khung giờ</small><strong>{schedule.start_time || "—"} – {schedule.end_time || "—"}</strong></span></div>
        <div><UsersRound size={17} /><span><small>Lượt đăng ký</small><strong>{schedule.booked_orders} đã đăng ký · {schedule.max_orders} tối đa</strong></span></div>
      </div>
      <div className="clinical-schedule-preview-state"><strong>Trạng thái hiện tại</strong><p>{status === "paused" ? "Khung giờ đang tạm ngừng nhận lịch." : status === "available" ? "Khung giờ đang mở và còn khả năng tiếp nhận đăng ký." : "Khung giờ đã đạt sức chứa tối đa."}</p></div>
      {(schedule.created_at || schedule.updated_at) && <div className="clinical-schedule-preview-times">
        {schedule.created_at && <p>Tạo lúc <span>{new Date(schedule.created_at).toLocaleString("vi-VN")}</span></p>}
        {schedule.updated_at && <p>Cập nhật <span>{new Date(schedule.updated_at).toLocaleString("vi-VN")}</span></p>}
      </div>}
      <div className="clinical-schedule-preview-actions">
        <button type="button" className="clinical-button clinical-button--primary" onClick={() => onEdit(schedule)} disabled={saving}>Sửa khung giờ</button>
        <button type="button" className="clinical-button clinical-button--secondary" onClick={() => onToggle(schedule)} disabled={saving}>{schedule.is_active ? "Tạm ngừng" : "Kích hoạt lại"}</button>
        {schedule.order_count === 0 && <button type="button" className="clinical-button clinical-button--danger" onClick={() => onDelete(schedule)} disabled={saving}>Xóa khung giờ</button>}
      </div>
    </aside>
  );
}

export default StaffClinicalSchedules;
