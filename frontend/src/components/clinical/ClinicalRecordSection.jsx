import { useState } from "react";
import { ChevronDown, ExternalLink, FileText } from "lucide-react";
import ClinicalStatusBadge from "./ClinicalStatusBadge";
import { ClinicalTypeIcon } from "./ClinicalOrderWorkspace";
import {
  CLINICAL_TYPE_LABEL,
  formatClinicalDate,
} from "./clinical.constants";

function ClinicalRecordSection({ orders = [], onOpenAttachment }) {
  const [expandedId, setExpandedId] = useState(null);

  return (
    <section className="clinical-record-section">
      <div className="clinical-record-section__heading">
        <div>
          <span>Cận lâm sàng</span>
          <h3>Kết quả liên quan đến lượt khám</h3>
        </div>
        <strong>{orders.length} phiếu</strong>
      </div>

      {orders.length === 0 ? (
        <div className="clinical-inline-empty">
          <FileText size={20} /> Chưa có chỉ định cận lâm sàng cho lượt khám này.
        </div>
      ) : (
        <div className="clinical-record-list">
          {orders.map((order) => {
            const expanded = expandedId === order.id;
            return (
              <article key={order.id}>
                <button
                  type="button"
                  className="clinical-record-row"
                  aria-expanded={expanded}
                  onClick={() => setExpandedId(expanded ? null : order.id)}
                >
                  <span className={`clinical-type-mark clinical-type-mark--${String(order.service_type || "LAB").toLowerCase()}`}>
                    <ClinicalTypeIcon type={order.service_type || "LAB"} size={18} />
                  </span>
                  <span>
                    <small>Loại</small>
                    <strong>{order.service_type_label || CLINICAL_TYPE_LABEL[order.service_type] || "Xét nghiệm"}</strong>
                  </span>
                  <span>
                    <small>Dịch vụ</small>
                    <strong>{order.results?.map((item) => item.service_name || item.test_name).join(", ") || "—"}</strong>
                  </span>
                  <span>
                    <small>Ngày thực hiện</small>
                    <strong>{formatClinicalDate(order.performed_at || order.ordered_at)}</strong>
                  </span>
                  <ClinicalStatusBadge status={order.status} />
                  <ChevronDown className={expanded ? "open" : ""} size={18} />
                </button>

                {expanded && (
                  <div className="clinical-record-detail">
                    {order.indication && <p><strong>Chỉ định:</strong> {order.indication}</p>}
                    {(order.results || []).map((result) => (
                      <div key={result.id} className="clinical-record-result">
                        <strong>{result.service_name || result.test_name}</strong>
                        {result.result && <p>{result.result}</p>}
                        {result.findings && <p><span>Mô tả:</span> {result.findings}</p>}
                        {result.conclusion && <p><span>Kết luận:</span> {result.conclusion}</p>}
                        {result.note && <p><span>Ghi chú:</span> {result.note}</p>}
                      </div>
                    ))}
                    {order.attachments?.length > 0 && (
                      <div className="clinical-record-files">
                        {order.attachments.map((attachment) => (
                          <button type="button" key={attachment.id} onClick={() => onOpenAttachment?.(attachment)}>
                            <FileText size={16} /> {attachment.name} <ExternalLink size={14} />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default ClinicalRecordSection;
