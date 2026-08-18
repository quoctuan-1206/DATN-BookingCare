import { useState } from "react";
import { Link } from "react-router-dom";
import { Home, ChevronRight } from "lucide-react";

function SpecialtyProfile({ specialty }) {
  const [expanded, setExpanded] = useState(false);
  const description = specialty.description || "";
  const longText = description.length > 220;
  const shown =
    !expanded && longText ? `${description.slice(0, 220).trim()}...` : description;

  return (
    <section className="specialty-hero">
      <nav className="specialty-breadcrumb">
        <Link to="/">
          <Home size={16} />
        </Link>
        <ChevronRight size={14} />
        <Link to="/specialties">Khám chuyên khoa</Link>
        <ChevronRight size={14} />
        <span>{specialty.name}</span>
      </nav>

      <h1>{specialty.name}</h1>
      <p className="specialty-hero-sub">Bác sĩ Chuyên khoa {specialty.name}</p>

      {description ? (
        <p className="specialty-hero-desc">
          {shown}{" "}
          {longText ? (
            <button
              type="button"
              className="specialty-more-btn"
              onClick={() => setExpanded((v) => !v)}
            >
              {expanded ? "Thu gọn" : "Xem thêm"}
            </button>
          ) : null}
        </p>
      ) : null}
    </section>
  );
}

export default SpecialtyProfile;
