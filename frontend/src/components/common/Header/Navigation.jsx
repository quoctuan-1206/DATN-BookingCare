import { NavLink } from "react-router-dom";

const items = [
  { to: "/", label: "Trang chủ", end: true },
  { to: "/specialties", label: "Chuyên khoa" },
  { to: "/doctors", label: "Bác sĩ" },
  { to: "/clinics", label: "Cơ sở y tế" },
  { to: "/clinical-services", label: "Cận lâm sàng" },
  { to: "/articles", label: "Bài viết" },
  { to: "/help", label: "Hướng dẫn" },
];

function Navigation({ onNavigate }) {
  return (
    <nav className="navigation" aria-label="Điều hướng chính">
      <ul>
        {items.map(({ to, label, end }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={end}
              onClick={onNavigate}
              className={({ isActive }) => isActive ? "is-active" : undefined}
            >
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default Navigation;
