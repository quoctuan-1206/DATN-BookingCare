import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import "./SectionHeader.css";

function SectionHeader({ title, viewMoreLink }) {
  return (
    <div className="section-header">
      <h2>{title}</h2>

      {viewMoreLink && (
        <Link to={viewMoreLink} className="section-header__link">
          Xem thêm
          <ChevronRight size={18} />
        </Link>
      )}
    </div>
  );
}

export default SectionHeader;
