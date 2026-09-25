import { ChevronDown } from "lucide-react";

function CollapseToggle({ expanded, onToggle, label }) {
  return (
    <button
      type="button"
      className={`doctor-collapse-toggle${expanded ? " is-expanded" : ""}`}
      aria-expanded={expanded}
      aria-label={`${expanded ? "Thu gọn" : "Mở rộng"} ${label}`}
      title={expanded ? "Thu gọn" : "Mở rộng"}
      onClick={onToggle}
    >
      <ChevronDown size={19} aria-hidden="true" />
    </button>
  );
}

export default CollapseToggle;
