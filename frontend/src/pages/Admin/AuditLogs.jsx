import { useCallback, useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Eye, RotateCcw, Search } from "lucide-react";
import toast from "react-hot-toast";
import AdminLayout from "../../components/admin/layout/AdminLayout";
import AuditLogDetailDrawer from "../../components/admin/AuditLogDetailDrawer";
import auditLogService from "../../services/audit-log.service";
import { getApiErrorMessage } from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import {
  AUDIT_ACTIONS,
  AUDIT_ACTION_LABELS,
  AUDIT_RESOURCES,
  AUDIT_RESOURCE_LABELS,
  formatAuditDate,
  getAuditActionTone,
  getAuditActor,
  isCanceledRequest,
} from "../../utils/audit-log";

const EMPTY_FILTERS = Object.freeze({
  search: "",
  userId: "",
  action: "",
  resource: "",
  resourceId: "",
  dateFrom: "",
  dateTo: "",
  sortOrder: "desc",
});

function toIsoDateBound(value, endOfDay = false) {
  if (!value) return undefined;
  const date = new Date(`${value}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}`);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

function buildParams(filters, page, limit) {
  const params = { page, limit, sortOrder: filters.sortOrder };
  for (const key of ["search", "userId", "action", "resource", "resourceId"]) {
    const value = String(filters[key] || "").trim();
    if (value) params[key] = value;
  }
  const dateFrom = toIsoDateBound(filters.dateFrom);
  const dateTo = toIsoDateBound(filters.dateTo, true);
  if (dateFrom) params.dateFrom = dateFrom;
  if (dateTo) params.dateTo = dateTo;
  return params;
}

function AuditLogs() {
  const { user, loading: authLoading } = useAuth();
  const role = user?.role?.name || user?.role;
  const isAdmin = role === "Admin";
  const [draftFilters, setDraftFilters] = useState({ ...EMPTY_FILTERS });
  const [filters, setFilters] = useState({ ...EMPTY_FILTERS });
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
    total_pages: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [detailReloadKey, setDetailReloadKey] = useState(0);

  const params = useMemo(
    () => buildParams(filters, page, limit),
    [filters, page, limit],
  );

  useEffect(() => {
    if (!isAdmin) return undefined;
    const controller = new AbortController();
    setLoading(true);
    setError("");

    auditLogService
      .getAuditLogs(params, { signal: controller.signal })
      .then((result) => {
        setLogs(result.data);
        setPagination(result.pagination);
      })
      .catch((requestError) => {
        if (isCanceledRequest(requestError)) return;
        setLogs([]);
        setError(getApiErrorMessage(requestError, "Không tải được Audit Log"));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [isAdmin, params]);

  useEffect(() => {
    if (!selectedId || !isAdmin) return undefined;
    const controller = new AbortController();
    setDetail(null);
    setDetailError("");
    setDetailLoading(true);

    auditLogService
      .getAuditLogById(selectedId, { signal: controller.signal })
      .then(setDetail)
      .catch((requestError) => {
        if (!isCanceledRequest(requestError)) {
          setDetailError(
            getApiErrorMessage(requestError, "Không tải được chi tiết Audit Log"),
          );
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setDetailLoading(false);
      });

    return () => controller.abort();
  }, [detailReloadKey, isAdmin, selectedId]);

  const updateDraft = useCallback((key, value) => {
    setDraftFilters((current) => ({ ...current, [key]: value }));
  }, []);

  const applyFilters = (event) => {
    event.preventDefault();
    if (
      draftFilters.dateFrom &&
      draftFilters.dateTo &&
      draftFilters.dateFrom > draftFilters.dateTo
    ) {
      toast.error("Thời gian bắt đầu phải trước thời gian kết thúc");
      return;
    }
    setPage(1);
    setFilters({ ...draftFilters });
  };

  const clearFilters = () => {
    setDraftFilters({ ...EMPTY_FILTERS });
    setFilters({ ...EMPTY_FILTERS });
    setPage(1);
  };

  const totalPages = Math.max(1, Number(pagination.total_pages || 1));

  if (authLoading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/unauthorized" replace />;

  return (
    <AdminLayout title="Audit Log">
      <div className="admin-page audit-page">
        <div className="admin-page-header">
          <div>
            <h3>Nhật ký hệ thống</h3>
            <p>Theo dõi các thao tác quan trọng được ghi nhận tại backend.</p>
          </div>
          <span className="audit-readonly-label">Chỉ đọc</span>
        </div>

        <div className="dashboard-card">
          <form className="audit-filter-form" onSubmit={applyFilters}>
            <label className="audit-search-field">
              <span>Tìm kiếm</span>
              <div>
                <Search size={17} aria-hidden="true" />
                <input
                  type="search"
                  value={draftFilters.search}
                  onChange={(event) => updateDraft("search", event.target.value)}
                  placeholder="Action, resource, IP, email..."
                />
              </div>
            </label>

            <label>
              <span>Action</span>
              <select
                value={draftFilters.action}
                onChange={(event) => updateDraft("action", event.target.value)}
              >
                <option value="">Tất cả action</option>
                {AUDIT_ACTIONS.map((action) => (
                  <option key={action} value={action}>
                    {AUDIT_ACTION_LABELS[action] || action}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Resource</span>
              <select
                value={draftFilters.resource}
                onChange={(event) => updateDraft("resource", event.target.value)}
              >
                <option value="">Tất cả resource</option>
                {AUDIT_RESOURCES.map((resource) => (
                  <option key={resource} value={resource}>
                    {AUDIT_RESOURCE_LABELS[resource] || resource}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>User ID</span>
              <input
                type="number"
                min="1"
                value={draftFilters.userId}
                onChange={(event) => updateDraft("userId", event.target.value)}
                placeholder="VD: 42"
              />
            </label>

            <label>
              <span>Resource ID</span>
              <input
                value={draftFilters.resourceId}
                onChange={(event) => updateDraft("resourceId", event.target.value)}
                placeholder="ID đối tượng"
              />
            </label>

            <label>
              <span>Từ ngày</span>
              <input
                type="date"
                value={draftFilters.dateFrom}
                onChange={(event) => updateDraft("dateFrom", event.target.value)}
              />
            </label>

            <label>
              <span>Đến ngày</span>
              <input
                type="date"
                value={draftFilters.dateTo}
                onChange={(event) => updateDraft("dateTo", event.target.value)}
              />
            </label>

            <label>
              <span>Sắp xếp thời gian</span>
              <select
                value={draftFilters.sortOrder}
                onChange={(event) => updateDraft("sortOrder", event.target.value)}
              >
                <option value="desc">Mới nhất trước</option>
                <option value="asc">Cũ nhất trước</option>
              </select>
            </label>

            <div className="audit-filter-actions">
              <button type="submit" className="admin-btn admin-btn-primary">
                <Search size={16} /> Áp dụng
              </button>
              <button
                type="button"
                className="admin-btn admin-btn-secondary"
                onClick={clearFilters}
              >
                <RotateCcw size={16} /> Đặt lại
              </button>
            </div>
          </form>
        </div>

        <div className="dashboard-card audit-table-card">
          <div className="audit-table-meta">
            <span>
              Tổng cộng <strong>{Number(pagination.total || 0).toLocaleString("vi-VN")}</strong> log
            </span>
            <label>
              Hiển thị
              <select
                value={limit}
                onChange={(event) => {
                  setLimit(Number(event.target.value));
                  setPage(1);
                }}
              >
                <option value="20">20</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
            </label>
          </div>

          {error && <div className="audit-error" role="alert">{error}</div>}

          <div className="table-wrapper">
            <table className="admin-table audit-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Action</th>
                  <th>Resource</th>
                  <th>Resource ID</th>
                  <th>IP</th>
                  <th>Time</th>
                  <th>Detail</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="7" className="audit-table-state">Đang tải Audit Log...</td></tr>
                ) : logs.length === 0 ? (
                  <tr><td colSpan="7" className="audit-table-state">Không có Audit Log phù hợp.</td></tr>
                ) : (
                  logs.map((log) => {
                    const actor = getAuditActor(log);
                    return (
                      <tr key={log.id}>
                        <td>
                          <div className="audit-actor">
                            <strong>{actor.name}</strong>
                            {actor.detail && <span>{actor.detail}</span>}
                          </div>
                        </td>
                        <td>
                          <span className={`audit-action-badge audit-action-badge--${getAuditActionTone(log.action)}`}>
                            {log.action}
                          </span>
                        </td>
                        <td>
                          <span className="audit-resource-badge">{log.resource}</span>
                        </td>
                        <td><code>{log.resourceId ?? "—"}</code></td>
                        <td><code>{log.ipAddress || "—"}</code></td>
                        <td className="audit-time">{formatAuditDate(log.createdAt)}</td>
                        <td>
                          <button
                            type="button"
                            className="audit-detail-button"
                            onClick={() => setSelectedId(log.id)}
                          >
                            <Eye size={16} /> Chi tiết
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="audit-pagination" aria-label="Phân trang Audit Log">
            <span>Trang {page} / {totalPages}</span>
            <div>
              <button
                type="button"
                disabled={page <= 1 || loading}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                aria-label="Trang trước"
              >
                <ChevronLeft size={17} /> Trước
              </button>
              <button
                type="button"
                disabled={page >= totalPages || loading}
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                aria-label="Trang sau"
              >
                Sau <ChevronRight size={17} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {selectedId && (
        <AuditLogDetailDrawer
          auditLog={detail}
          loading={detailLoading}
          error={detailError}
          onRetry={() => setDetailReloadKey((key) => key + 1)}
          onClose={() => {
            setSelectedId(null);
            setDetail(null);
            setDetailError("");
          }}
        />
      )}
    </AdminLayout>
  );
}

export default AuditLogs;
