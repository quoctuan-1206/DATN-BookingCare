import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import "./SectionHeader.css";

function SectionHeader({ title, viewMoreLink, viewMoreLabel = "Xem thêm" }) {
  return (
    <div className="section-header">
      <h2>{title}</h2>

      {viewMoreLink && (
        <Link to={viewMoreLink} className="section-header__link">
          {viewMoreLabel}
          <ChevronRight size={18} />
        </Link>
      )}
    </div>
  );
}

export default SectionHeader;
