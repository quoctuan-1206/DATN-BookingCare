import { useLayoutEffect, useRef, useState } from "react";
import { Hospital, Stethoscope } from "lucide-react";

function SpecialtyProfile({ specialty }) {
  const [expanded, setExpanded] = useState(false);
  const scrollYRef = useRef(null);
  const description = specialty.description || "";
  const longText = description.length > 220;
  const shown =
    !expanded && longText ? `${description.slice(0, 220).trim()}...` : description;

  useLayoutEffect(() => {
    if (scrollYRef.current == null) return;
    window.scrollTo(0, scrollYRef.current);
    scrollYRef.current = null;
  }, [expanded]);

  return (
    <section className="doctor-profile specialty-profile">
      <img
        src={specialty.image}
        alt={specialty.name}
        className="doctor-profile__image"
      />

      <div className="doctor-profile__info">
        <span className="doctor-profile__badge">Chuyên khoa</span>
        <h1>{specialty.name}</h1>

        <ul className="doctor-profile__meta">
          <li>
            <Stethoscope size={16} />
            <span>{specialty.doctor_count || 0} bác sĩ</span>
          </li>
          <li>
            <Hospital size={16} />
            <span>{specialty.clinic_count || 0} cơ sở y tế</span>
          </li>
        </ul>

        {description ? (
          <p className="specialty-hero-desc">
            {shown}{" "}
            {longText ? (
              <button
                type="button"
                className="specialty-more-btn"
                onClick={(e) => {
                  scrollYRef.current = window.scrollY;
                  e.currentTarget.blur();
                  setExpanded((v) => !v);
                }}
              >
                {expanded ? "Thu gọn" : "Xem thêm"}
              </button>
            ) : null}
          </p>
        ) : null}
      </div>
    </section>
  );
}

export default SpecialtyProfile;
