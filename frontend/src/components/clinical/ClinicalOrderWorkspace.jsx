import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Ban,
  CalendarClock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  FileImage,
  FileText,
  HeartPulse,
  Microscope,
  Play,
  RotateCcw,
  Save,
  ScanLine,
  Search,
  Stethoscope,
  Upload,
  UserRound,
  X,
} from "lucide-react";
import ClinicalStatusBadge from "./ClinicalStatusBadge";
import {
  CLINICAL_STATUS_OPTIONS,
  CLINICAL_TYPES,
  CLINICAL_TYPE_LABEL,
  formatClinicalDate,
} from "./clinical.constants";

const PAGE_SIZE = 5;

export function ClinicalTypeIcon({ type, size = 18 }) {
  const icons = {
    LAB: Microscope,
    XRAY: ScanLine,
    ULTRASOUND: Activity,
    ENDOSCOPY: Stethoscope,
    ECG: HeartPulse,
  };
  const Icon = icons[type] || ClipboardList;
  return <Icon size={size} />;
}

function orderSearchText(order) {
  return [
    order.booking_code,
    order.patient_name,
    order.doctor_name,
    order.indication,
    ...(order.results || []).map((item) => item.test_name || item.service_name),
  ]
    .filter(Boolean)
    .join(" ")
    .toLocaleLowerCase("vi-VN");
}

function formatFileSize(value) {
  const size = Number(value || 0);
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function DetailLine({ label, children }) {
  return (
    <div className="clinical-detail-line">
      <span>{label}</span>
      <strong>{children || "—"}</strong>
    </div>
  );
}

function ResultEditor({ order, result, actionPending, onSaveResult }) {
  const [form, setForm] = useState({
    result: result.result || "",
    findings: result.findings || "",
    conclusion: result.conclusion || "",
    note: result.note || "",
    heartRate: result.measurements?.heart_rate || "",
    rhythm: result.measurements?.rhythm || "",
  });

  const update = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const submit = (event) => {
    event.preventDefault();
    onSaveResult?.(order.id, result.id, {
      result: form.result.trim() || null,
      findings: form.findings.trim() || null,
      conclusion: form.conclusion.trim() || null,
      note: form.note.trim() || null,
      measurements:
        order.service_type === "ECG"
          ? form.heartRate || form.rhythm.trim()
            ? {
                heart_rate: form.heartRate ? Number(form.heartRate) : null,
                rhythm: form.rhythm.trim() || null,
              }
            : null
          : result.measurements || null,
    });
  };

  return (
    <form className="clinical-result-editor" onSubmit={submit}>
      <div className="clinical-drawer-section-title">
        <span>Kết quả thực hiện</span>
        <small>{result.test_name || result.service_name}</small>
      </div>

      {order.service_type === "LAB" && (
        <label>
          Kết quả xét nghiệm
          <textarea
            rows={3}
            value={form.result}
            onChange={(event) => update("result", event.target.value)}
            placeholder="Nhập các chỉ số hoặc kết quả tổng hợp..."
          />
        </label>
      )}

      {order.service_type === "ECG" && (
        <div className="clinical-form-grid clinical-form-grid--two">
          <label>
            Tần số tim (bpm)
            <input
              type="number"
              min="1"
              max="300"
              value={form.heartRate}
              onChange={(event) => update("heartRate", event.target.value)}
              placeholder="72"
            />
          </label>
          <label>
            Nhịp tim
            <input
              value={form.rhythm}
              onChange={(event) => update("rhythm", event.target.value)}
              placeholder="Nhịp xoang"
            />
          </label>
        </div>
      )}

      {order.service_type !== "LAB" && (
        <label>
          Mô tả / phát hiện
          <textarea
            rows={4}
            value={form.findings}
            onChange={(event) => update("findings", event.target.value)}
            placeholder="Mô tả hình ảnh và các phát hiện..."
          />
        </label>
      )}

      <label>
        Kết luận
        <textarea
          rows={3}
          value={form.conclusion}
          onChange={(event) => update("conclusion", event.target.value)}
          placeholder="Nhập kết luận chuyên môn..."
        />
      </label>

      <label>
        Ghi chú
        <textarea
          rows={2}
          value={form.note}
          onChange={(event) => update("note", event.target.value)}
          placeholder="Ghi chú thêm nếu có..."
        />
      </label>

      <button type="submit" className="clinical-button clinical-button--primary" disabled={actionPending}>
        <Save size={17} /> {actionPending ? "Đang lưu..." : "Lưu kết quả"}
      </button>
    </form>
  );
}

function ResultView({ result }) {
  const measurements = Object.entries(result.measurements || {}).filter(
    ([, value]) => value !== null && value !== "",
  );

  return (
    <article className="clinical-result-card">
      <strong>{result.test_name || result.service_name || "Kết quả"}</strong>
      {result.result && <p>{result.result}</p>}
      {result.findings && (
        <DetailLine label="Mô tả">{result.findings}</DetailLine>
      )}
      {measurements.length > 0 && (
        <div className="clinical-measurements">
          {measurements.map(([key, value]) => (
            <span key={key}>
              <small>{key.replaceAll("_", " ")}</small>
              <strong>{String(value)}</strong>
            </span>
          ))}
        </div>
      )}
      <DetailLine label="Kết luận">{result.conclusion}</DetailLine>
      {result.note && <DetailLine label="Ghi chú">{result.note}</DetailLine>}
    </article>
  );
}

function OrderDrawer({
  order,
  mode,
  onClose,
  onStatusChange,
  onSaveResult,
  onAttach,
  onOpenAttachment,
  actionPending,
}) {
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

  const canEdit = mode === "staff" && order.status === "IN_PROGRESS";

  return (
    <div
      className="clinical-drawer-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <aside
        className="clinical-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="clinical-drawer-title"
      >
        <header className="clinical-drawer-header">
          <div className={`clinical-type-mark clinical-type-mark--${order.service_type.toLowerCase()}`}>
            <ClinicalTypeIcon type={order.service_type} size={22} />
          </div>
          <div>
            <span>{CLINICAL_TYPE_LABEL[order.service_type]}</span>
            <h2 id="clinical-drawer-title">Phiếu #{order.id}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Đóng chi tiết">
            <X size={20} />
          </button>
        </header>

        <div className="clinical-drawer-body">
          <div className="clinical-drawer-status-row">
            <ClinicalStatusBadge status={order.status} />
            <span>Tạo lúc {formatClinicalDate(order.ordered_at, true)}</span>
          </div>

          <section className="clinical-drawer-section">
            <div className="clinical-drawer-section-title">Thông tin phiếu</div>
            <div className="clinical-detail-grid">
              <DetailLine label="Mã lịch khám">{order.booking_code}</DetailLine>
              <DetailLine label="Bệnh nhân">{order.patient_name}</DetailLine>
              <DetailLine label="Bác sĩ chỉ định">{order.doctor_name}</DetailLine>
              <DetailLine label="Người thực hiện">{order.performed_by_name}</DetailLine>
              <DetailLine label="Bắt đầu">
                {formatClinicalDate(order.started_at, true)}
              </DetailLine>
              <DetailLine label="Hoàn thành">
                {formatClinicalDate(order.completed_at, true)}
              </DetailLine>
            </div>
          </section>

          <section className="clinical-drawer-section">
            <div className="clinical-drawer-section-title">Chỉ định</div>
            <p className="clinical-note-box">{order.indication || "Chưa có chỉ định."}</p>
            {order.preparation_note && (
              <p className="clinical-preparation-note">
                <strong>Chuẩn bị:</strong> {order.preparation_note}
              </p>
            )}
          </section>

          {canEdit ? (
            (order.results || []).map((result) => (
              <ResultEditor
                key={`${order.id}-${result.id}`}
                order={order}
                result={result}
                actionPending={actionPending}
                onSaveResult={onSaveResult}
              />
            ))
          ) : (
            <section className="clinical-drawer-section">
              <div className="clinical-drawer-section-title">Kết quả</div>
              {(order.results || []).some(
                (item) => item.result || item.findings || item.conclusion || item.measurements,
              ) ? (
                order.results.map((result) => (
                  <ResultView key={result.id} result={result} />
                ))
              ) : (
                <div className="clinical-inline-empty">
                  <FileText size={20} /> Chưa có kết quả được nhập.
                </div>
              )}
            </section>
          )}

          <section className="clinical-drawer-section">
            <div className="clinical-drawer-section-title">
              <span>Tệp đính kèm</span>
              <small>{order.attachments?.length || 0} tệp</small>
            </div>
            {order.attachments?.length ? (
              <div className="clinical-file-list">
                {order.attachments.map((attachment) => (
                  <button
                    type="button"
                    key={attachment.id}
                    onClick={() => onOpenAttachment?.(attachment)}
                  >
                    {attachment.kind === "IMAGE" ? (
                      <FileImage size={19} />
                    ) : (
                      <FileText size={19} />
                    )}
                    <span>
                      <strong>{attachment.name}</strong>
                      <small>{formatFileSize(attachment.size)}</small>
                    </span>
                    <ChevronRight size={17} />
                  </button>
                ))}
              </div>
            ) : (
              <div className="clinical-inline-empty">
                <FileImage size={20} /> Chưa có hình ảnh hoặc tài liệu.
              </div>
            )}
            {canEdit && (
              <label className="clinical-upload-button">
                <Upload size={17} /> Chọn tệp kết quả
                <input
                  type="file"
                  disabled={actionPending}
                  accept=".jpg,.jpeg,.png,.webp,.gif,.pdf,.doc,.docx,.mp4,.webm"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) onAttach?.(order.id, file);
                    event.target.value = "";
                  }}
                />
              </label>
            )}
          </section>
        </div>

        {mode === "staff" && (
          <footer className="clinical-drawer-footer">
            {order.status === "PENDING" && (
              <button
                type="button"
                className="clinical-button clinical-button--primary"
                disabled={actionPending}
                onClick={() => onStatusChange?.(order.id, "IN_PROGRESS")}
              >
                <Play size={17} /> Tiếp nhận
              </button>
            )}
            {order.status === "IN_PROGRESS" && (
              <button
                type="button"
                className="clinical-button clinical-button--primary"
                disabled={actionPending}
                onClick={() => onStatusChange?.(order.id, "COMPLETED")}
              >
                <CheckCircle2 size={17} /> Hoàn thành
              </button>
            )}
            {["PENDING", "IN_PROGRESS"].includes(order.status) && (
              <button
                type="button"
                className="clinical-button clinical-button--danger"
                disabled={actionPending}
                onClick={() => onStatusChange?.(order.id, "CANCELLED")}
              >
                <Ban size={17} /> Hủy phiếu
              </button>
            )}
          </footer>
        )}
      </aside>
    </div>
  );
}

function ClinicalOrderWorkspace({
  orders,
  loading = false,
  error = "",
  pagination = null,
  mode = "patient",
  onRetry,
  onQueryChange,
  onStatusChange,
  onSaveResult,
  onAttach,
  onOpenAttachment,
  openedOrder = null,
  onCloseOpenedOrder,
  actionPending = false,
}) {
  const [type, setType] = useState("ALL");
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState(null);
  const remote = typeof onQueryChange === "function";

  const query = useMemo(() => ({
    page,
    limit: PAGE_SIZE,
    ...(type !== "ALL" ? { service_type: type } : {}),
    ...(status ? { status } : {}),
    ...(search.trim() ? { search: search.trim() } : {}),
    ...(fromDate ? { from_date: fromDate } : {}),
    ...(toDate ? { to_date: toDate } : {}),
  }), [fromDate, page, search, status, toDate, type]);

  useEffect(() => {
    if (!remote) return undefined;
    const timer = window.setTimeout(
      () => onQueryChange(query),
      search.trim() ? 300 : 0,
    );
    return () => window.clearTimeout(timer);
  }, [onQueryChange, query, remote, search]);

  const filtered = useMemo(() => {
    if (remote) return orders;
    const keyword = search.trim().toLocaleLowerCase("vi-VN");
    return orders.filter((order) => {
      if (type !== "ALL" && order.service_type !== type) return false;
      if (status && order.status !== status) return false;
      if (keyword && !orderSearchText(order).includes(keyword)) return false;
      const date = String(order.ordered_at || "").slice(0, 10);
      if (fromDate && date < fromDate) return false;
      if (toDate && date > toDate) return false;
      return true;
    });
  }, [fromDate, orders, remote, search, status, toDate, type]);

  const pageCount = remote
    ? Math.max(1, Number(pagination?.total_pages || 1))
    : Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = remote
    ? Number(pagination?.page || page)
    : Math.min(page, pageCount);
  const visibleOrders = remote
    ? orders
    : filtered.slice(
        (currentPage - 1) * PAGE_SIZE,
        currentPage * PAGE_SIZE,
      );
  const totalOrders = remote ? Number(pagination?.total || orders.length) : filtered.length;
  const selectedOrder = openedOrder
    || orders.find((order) => order.id === selectedId)
    || null;

  const setFilter = (setter) => (value) => {
    setter(value);
    setPage(1);
  };

  const clearFilters = () => {
    setType("ALL");
    setStatus("");
    setSearch("");
    setFromDate("");
    setToDate("");
    setPage(1);
  };

  return (
    <div className="clinical-workspace">
      <div className="clinical-tabs" role="tablist" aria-label="Loại cận lâm sàng">
        {CLINICAL_TYPES.map((item) => (
          <button
            type="button"
            role="tab"
            aria-selected={type === item.value}
            className={type === item.value ? "active" : ""}
            key={item.value}
            onClick={() => setFilter(setType)(item.value)}
          >
            {item.value !== "ALL" && <ClinicalTypeIcon type={item.value} size={17} />}
            {item.label}
            {(!remote || item.value === type) && (
              <span>
                {remote
                  ? totalOrders
                  : item.value === "ALL"
                    ? orders.length
                    : orders.filter((order) => order.service_type === item.value).length}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="clinical-filter-bar">
        <label className="clinical-search">
          <Search size={18} />
          <input
            value={search}
            onChange={(event) => setFilter(setSearch)(event.target.value)}
            placeholder="Tìm mã phiếu, bệnh nhân, dịch vụ..."
          />
        </label>
        <select value={status} onChange={(event) => setFilter(setStatus)(event.target.value)}>
          {CLINICAL_STATUS_OPTIONS.map((item) => (
            <option key={item.value} value={item.value}>{item.label}</option>
          ))}
        </select>
        <label className="clinical-date-field">
          <span>Từ</span>
          <input type="date" value={fromDate} onChange={(event) => setFilter(setFromDate)(event.target.value)} />
        </label>
        <label className="clinical-date-field">
          <span>Đến</span>
          <input type="date" value={toDate} onChange={(event) => setFilter(setToDate)(event.target.value)} />
        </label>
        {(type !== "ALL" || status || search || fromDate || toDate) && (
          <button type="button" className="clinical-clear-filter" onClick={clearFilters}>
            <RotateCcw size={16} /> Đặt lại
          </button>
        )}
      </div>

      {loading ? (
        <div className="clinical-order-grid" aria-label="Đang tải dữ liệu">
          {[1, 2, 3].map((item) => <div className="clinical-order-skeleton" key={item} />)}
        </div>
      ) : error ? (
        <div className="clinical-state clinical-state--error">
          <Activity size={32} />
          <h3>Không tải được dữ liệu</h3>
          <p>{error}</p>
          <button type="button" className="clinical-button clinical-button--secondary" onClick={remote ? () => onQueryChange(query) : onRetry}>Thử lại</button>
        </div>
      ) : visibleOrders.length === 0 ? (
        <div className="clinical-state">
          <ClipboardList size={36} />
          <h3>Không có phiếu phù hợp</h3>
          <p>Thử thay đổi bộ lọc hoặc khoảng thời gian đang chọn.</p>
          <button type="button" className="clinical-button clinical-button--secondary" onClick={clearFilters}>Xóa bộ lọc</button>
        </div>
      ) : (
        <div className="clinical-order-grid">
          {visibleOrders.map((order) => (
            <button
              type="button"
              className="clinical-order-card"
              key={order.id}
              onClick={() => setSelectedId(order.id)}
            >
              <div className="clinical-order-card__top">
                <div className={`clinical-type-mark clinical-type-mark--${order.service_type.toLowerCase()}`}>
                  <ClinicalTypeIcon type={order.service_type} size={20} />
                </div>
                <div>
                  <span>{CLINICAL_TYPE_LABEL[order.service_type]}</span>
                  <strong>Phiếu #{order.id}</strong>
                </div>
                <ClinicalStatusBadge status={order.status} />
              </div>
              <h3>{order.results?.map((item) => item.test_name || item.service_name).join(", ")}</h3>
              <div className="clinical-order-card__meta">
                <span><UserRound size={16} /> {order.patient_name}</span>
                <span><CalendarClock size={16} /> {formatClinicalDate(order.ordered_at, true)}</span>
              </div>
              <p>{order.indication || "Chưa có nội dung chỉ định."}</p>
              <div className="clinical-order-card__footer">
                <span>{order.booking_code}</span>
                <span>Xem chi tiết <ChevronRight size={16} /></span>
              </div>
            </button>
          ))}
        </div>
      )}

      {!loading && !error && totalOrders > 0 && (
        <div className="clinical-pagination">
          <span>Hiển thị {visibleOrders.length} / {totalOrders} phiếu</span>
          <div>
            <button type="button" disabled={currentPage === 1} onClick={() => setPage((value) => Math.max(1, value - 1))} aria-label="Trang trước"><ChevronLeft size={17} /></button>
            <span>{currentPage} / {pageCount}</span>
            <button type="button" disabled={currentPage === pageCount} onClick={() => setPage((value) => Math.min(pageCount, value + 1))} aria-label="Trang sau"><ChevronRight size={17} /></button>
          </div>
        </div>
      )}

      {selectedOrder && (
        <OrderDrawer
          order={selectedOrder}
          mode={mode}
          onClose={() => {
            if (openedOrder) {
              onCloseOpenedOrder?.();
              return;
            }
            setSelectedId(null);
          }}
          onStatusChange={onStatusChange}
          onSaveResult={onSaveResult}
          onAttach={onAttach}
          onOpenAttachment={onOpenAttachment}
          actionPending={actionPending}
        />
      )}
    </div>
  );
}

export default ClinicalOrderWorkspace;
