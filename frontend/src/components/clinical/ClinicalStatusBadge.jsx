import { CLINICAL_STATUS } from "./clinical.constants";

function ClinicalStatusBadge({ status }) {
  const item = CLINICAL_STATUS[status] || {
    label: status || "Không xác định",
    tone: "pending",
  };

  return (
    <span className={`clinical-status clinical-status--${item.tone}`}>
      <span aria-hidden="true" />
      {item.label}
    </span>
  );
}

export default ClinicalStatusBadge;
