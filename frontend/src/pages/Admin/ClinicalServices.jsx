import { useCallback, useEffect, useMemo, useState } from "react";
import { Activity, CircleDollarSign, ClipboardList, Pencil, Plus, RefreshCcw, Search, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";
import { Navigate } from "react-router-dom";
import AdminLayout from "../../components/admin/layout/AdminLayout";
import ClinicalServiceFormModal from "../../components/clinical/ClinicalServiceFormModal";
import { ClinicalTypeIcon } from "../../components/clinical/ClinicalOrderWorkspace";
import {
  CLINICAL_BOOKING_MODE_LABEL,
  CLINICAL_TYPES,
  CLINICAL_TYPE_LABEL,
  formatClinicalPrice,
} from "../../components/clinical/clinical.constants";
import { getApiErrorMessage } from "../../api/axios";
import clinicalService from "../../services/clinical.service";
import { useAuth } from "../../context/AuthContext";
import { resolveMediaUrl } from "../../utils/media";

function AdminClinicalServices() {
  const { user, loading: authLoading } = useAuth();
  const [services, setServices] = useState([]);
  const [statistics, setStatistics] = useState({ total_orders: 0 });
  const [type, setType] = useState("ALL");
  const [activity, setActivity] = useState("ALL");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const loadServices = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [response, stats] = await Promise.all([
        clinicalService.getServices({ page: 1, limit: 100 }),
        clinicalService.getStatistics(),
      ]);
      setServices(response.data || []);
      setStatistics(stats);
    } catch (loadError) {
      const message = getApiErrorMessage(loadError, "Không tải được danh mục cận lâm sàng");
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.role?.name === "Admin") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadServices();
    }
  }, [loadServices, user?.role?.name]);

  const filtered = useMemo(() => {
    const keyword = search.trim().toLocaleLowerCase("vi-VN");
    return services.filter((service) => {
      if (type !== "ALL" && service.service_type !== type) return false;
      if (activity === "ACTIVE" && !service.is_active) return false;
      if (activity === "INACTIVE" && service.is_active) return false;
      if (keyword && !`${service.name} ${service.description || ""}`.toLocaleLowerCase("vi-VN").includes(keyword)) return false;
      return true;
    });
  }, [activity, search, services, type]);

  const openCreate = () => {
    setEditing(null);
    setShowForm(true);
  };

  const openEdit = (service) => {
    setEditing(service);
    setShowForm(true);
  };

  const saveService = async (payload) => {
    setSaving(true);
    try {
      if (editing) {
        const updated = await clinicalService.updateService(editing.id, payload);
        setServices((current) => current.map((item) =>
          item.id === updated.id ? updated : item,
        ));
        toast.success("Đã cập nhật dịch vụ");
      } else {
        const created = await clinicalService.createService(payload);
        setServices((current) => [created, ...current]);
        toast.success("Đã thêm dịch vụ");
      }
      setShowForm(false);
      setEditing(null);
    } catch (saveError) {
      toast.error(getApiErrorMessage(saveError, "Không lưu được dịch vụ"));
    } finally {
      setSaving(false);
    }
  };

  const toggleActivity = async (service) => {
    setSaving(true);
    try {
      const updated = service.is_active
        ? await clinicalService.deactivateService(service.id)
        : await clinicalService.updateService(service.id, { is_active: true });
      setServices((current) => current.map((item) =>
        item.id === updated.id ? updated : item,
      ));
      toast.success(service.is_active ? "Đã tạm ngừng dịch vụ" : "Đã kích hoạt dịch vụ");
    } catch (toggleError) {
      toast.error(getApiErrorMessage(toggleError, "Không cập nhật được trạng thái dịch vụ"));
    } finally {
      setSaving(false);
    }
  };

  const activeCount = services.filter((item) => item.is_active).length;
  const averagePrice = services.length
    ? services.reduce((sum, item) => sum + Number(item.price || 0), 0) / services.length
    : 0;

  if (authLoading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role?.name !== "Admin") return <Navigate to="/unauthorized" replace />;

  return (
    <AdminLayout title="Danh mục cận lâm sàng">
      <div className="clinical-page">
        <section className="clinical-page-hero">
          <div>
            <span className="clinical-eyebrow"><Activity size={16} /> Cấu hình hệ thống</span>
            <h1>Dịch vụ cận lâm sàng</h1>
            <p>Quản lý loại dịch vụ, hình thức đặt, mức giá, thời lượng và trạng thái cung cấp.</p>
          </div>
          <button type="button" className="clinical-button clinical-button--primary" onClick={openCreate} disabled={loading || saving}>
            <Plus size={18} /> Thêm dịch vụ
          </button>
        </section>

        <div className="clinical-summary-grid clinical-summary-grid--admin">
          <article className="clinical-summary-card">
            <Activity size={21} /><div><strong>{services.length}</strong><span>Tổng dịch vụ</span></div>
          </article>
          <article className="clinical-summary-card clinical-summary-card--success">
            <ShieldCheck size={21} /><div><strong>{activeCount}</strong><span>Đang hoạt động</span></div>
          </article>
          <article className="clinical-summary-card clinical-summary-card--info">
            <CircleDollarSign size={21} /><div><strong>{formatClinicalPrice(averagePrice)}</strong><span>Giá trung bình</span></div>
          </article>
          <article className="clinical-summary-card clinical-summary-card--warning">
            <ClipboardList size={21} /><div><strong>{statistics.total_orders || 0}</strong><span>Tổng phiếu chỉ định</span></div>
          </article>
        </div>

        <section className="clinical-catalog">
          <div className="clinical-catalog-filters">
            <label className="clinical-search">
              <Search size={18} />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm tên dịch vụ..." />
            </label>
            <select value={type} onChange={(event) => setType(event.target.value)}>
              {CLINICAL_TYPES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
            <select value={activity} onChange={(event) => setActivity(event.target.value)}>
              <option value="ALL">Tất cả trạng thái</option>
              <option value="ACTIVE">Đang hoạt động</option>
              <option value="INACTIVE">Tạm ngừng</option>
            </select>
          </div>

          {loading ? (
            <div className="clinical-state"><span className="clinical-loading-spinner" /><p>Đang tải danh mục...</p></div>
          ) : error ? (
            <div className="clinical-state clinical-state--error"><Activity size={30} /><h3>Không tải được danh mục</h3><p>{error}</p><button type="button" className="clinical-button clinical-button--secondary" onClick={loadServices}><RefreshCcw size={16} /> Thử lại</button></div>
          ) : filtered.length ? (
            <div className="clinical-catalog-table-wrap">
              <table className="clinical-catalog-table">
                <thead><tr><th>Dịch vụ</th><th>Loại</th><th>Thời lượng</th><th>Đơn giá</th><th>Trạng thái</th><th /></tr></thead>
                <tbody>
                  {filtered.map((service) => (
                    <tr key={service.id}>
                      <td>
                        <div className="clinical-service-cell">
                          {service.image ? (
                            <img src={resolveMediaUrl(service.image)} alt="" />
                          ) : (
                            <span className="clinical-service-cell__placeholder"><ClinicalTypeIcon type={service.service_type} size={19} /></span>
                          )}
                          <div><strong>{service.name}</strong><small>{service.description || "Chưa có mô tả"}</small></div>
                        </div>
                      </td>
                      <td>
                        <span className={`clinical-catalog-type clinical-catalog-type--${service.service_type.toLowerCase()}`}><ClinicalTypeIcon type={service.service_type} size={16} /> {CLINICAL_TYPE_LABEL[service.service_type]}</span>
                        <span className={`clinical-booking-mode clinical-booking-mode--${(service.booking_mode || "DOCTOR_ORDER").toLowerCase()}`}>{CLINICAL_BOOKING_MODE_LABEL[service.booking_mode || "DOCTOR_ORDER"]}</span>
                      </td>
                      <td>{service.estimated_duration_minutes || "—"} phút</td>
                      <td><strong>{formatClinicalPrice(service.price)}</strong></td>
                      <td><button type="button" disabled={saving} className={`clinical-activity-toggle${service.is_active ? " active" : ""}`} onClick={() => toggleActivity(service)}><span /> {service.is_active ? "Hoạt động" : "Tạm ngừng"}</button></td>
                      <td><button type="button" disabled={saving} className="clinical-icon-button" onClick={() => openEdit(service)} aria-label={`Sửa ${service.name}`}><Pencil size={17} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="clinical-state"><Search size={30} /><h3>Không tìm thấy dịch vụ</h3><p>Thử thay đổi từ khóa hoặc bộ lọc.</p></div>
          )}
        </section>
      </div>

      {showForm && (
        <ClinicalServiceFormModal
          service={editing}
          submitting={saving}
          onClose={() => { if (!saving) { setShowForm(false); setEditing(null); } }}
          onSubmit={saveService}
        />
      )}
    </AdminLayout>
  );
}

export default AdminClinicalServices;
