import { useEffect, useRef } from "react";
import { RefreshCcw, ShieldCheck, X } from "lucide-react";
import {
  AUDIT_ACTION_LABELS,
  AUDIT_RESOURCE_LABELS,
  formatAuditDate,
  formatAuditJson,
  getAuditActionTone,
  getAuditActor,
} from "../../utils/audit-log";

function DetailItem({ label, children, wide = false }) {
  return (
    <div className={`audit-detail-item${wide ? " audit-detail-item--wide" : ""}`}>
      <span>{label}</span>
      <div>{children ?? "—"}</div>
    </div>
  );
}

function JsonPanel({ title, value }) {
  return (
    <section className="audit-json-panel">
      <h3>{title}</h3>
      <pre tabIndex={0}>{formatAuditJson(value)}</pre>
    </section>
  );
}

function AuditLogDetailDrawer({ auditLog, loading, error, onClose, onRetry }) {
  const drawerRef = useRef(null);
  const closeButtonRef = useRef(null);

  useEffect(() => {
    const previouslyFocused = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    const focusTimer = window.setTimeout(() => closeButtonRef.current?.focus(), 0);

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab") return;
      const focusable = drawerRef.current?.querySelectorAll(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable?.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus?.();
    };
  }, [onClose]);

  const actor = getAuditActor(auditLog);
  const actionTone = getAuditActionTone(auditLog?.action);

  return (
    <div
      className="audit-drawer-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <aside
        ref={drawerRef}
        className="audit-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="audit-detail-title"
        aria-describedby="audit-detail-description"
        aria-busy={loading}
      >
        <header className="audit-drawer-header">
          <span className="audit-drawer-icon" aria-hidden="true">
            <ShieldCheck size={22} />
          </span>
          <div>
            <span>Nhật ký hệ thống</span>
            <h2 id="audit-detail-title">
              Chi tiết log{auditLog?.id ? ` #${auditLog.id}` : ""}
            </h2>
            <p id="audit-detail-description">
              Dữ liệu chỉ đọc, được ghi nhận tại backend.
            </p>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Đóng chi tiết Audit Log"
          >
            <X size={20} />
          </button>
        </header>

        <div className="audit-drawer-body" aria-live="polite">
          {loading ? (
            <div className="audit-drawer-state">
              <span className="audit-spinner" aria-hidden="true" />
              <p>Đang tải chi tiết Audit Log...</p>
            </div>
          ) : error ? (
            <div className="audit-drawer-state audit-drawer-state--error">
              <h3>Không tải được chi tiết</h3>
              <p>{error}</p>
              <button
                type="button"
                className="admin-btn admin-btn-secondary"
                onClick={onRetry}
              >
                <RefreshCcw size={16} /> Thử lại
              </button>
            </div>
          ) : auditLog ? (
            <>
              <div className="audit-detail-summary">
                <span className={`audit-action-badge audit-action-badge--${actionTone}`}>
                  {auditLog.action || "—"}
                </span>
                <span className="audit-resource-badge">
                  {AUDIT_RESOURCE_LABELS[auditLog.resource] || auditLog.resource || "—"}
                </span>
                <span className="audit-detail-time">
                  {formatAuditDate(auditLog.createdAt)}
                </span>
              </div>

              <section className="audit-detail-section">
                <h3>Thông tin sự kiện</h3>
                <div className="audit-detail-grid">
                  <DetailItem label="Người thực hiện">
                    <strong>{actor.name}</strong>
                    {actor.detail && <small>{actor.detail}</small>}
                  </DetailItem>
                  <DetailItem label="User ID">
                    <code>{auditLog.userId ?? "—"}</code>
                  </DetailItem>
                  <DetailItem label="Hành động">
                    <strong>{AUDIT_ACTION_LABELS[auditLog.action] || auditLog.action || "—"}</strong>
                    {auditLog.action && <small>{auditLog.action}</small>}
                  </DetailItem>
                  <DetailItem label="Tài nguyên">
                    <strong>
                      {AUDIT_RESOURCE_LABELS[auditLog.resource] || auditLog.resource || "—"}
                    </strong>
                    {auditLog.resource && <small>{auditLog.resource}</small>}
                  </DetailItem>
                  <DetailItem label="Resource ID">
                    <code>{auditLog.resourceId ?? "—"}</code>
                  </DetailItem>
                  <DetailItem label="Địa chỉ IP">
                    <code>{auditLog.ipAddress || "—"}</code>
                  </DetailItem>
                  <DetailItem label="Thời gian">
                    {formatAuditDate(auditLog.createdAt)}
                  </DetailItem>
                  <DetailItem label="Vai trò">
                    {auditLog.user?.role || "—"}
                  </DetailItem>
                  <DetailItem label="User Agent" wide>
                    <span className="audit-user-agent">{auditLog.userAgent || "—"}</span>
                  </DetailItem>
                </div>
              </section>

              <div className="audit-json-grid">
                <JsonPanel title="Giá trị trước thay đổi" value={auditLog.oldValue} />
                <JsonPanel title="Giá trị sau thay đổi" value={auditLog.newValue} />
              </div>
              <JsonPanel title="Metadata" value={auditLog.metadata} />
            </>
          ) : (
            <div className="audit-drawer-state">
              <p>Không tìm thấy Audit Log.</p>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}

export default AuditLogDetailDrawer;
