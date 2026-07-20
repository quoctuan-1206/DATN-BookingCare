import { Link } from "react-router-dom";

function Navigation() {
  return (
    <nav className="navigation">
      <ul>
        <li>
          <Link to="/">Trang chủ</Link>
        </li>
        <li>
          <Link to="/specialties">Chuyên khoa</Link>
        </li>
        <li>
          <Link to="/clinics">Cơ sở y tế</Link>
        </li>
        <li>
          <Link to="/doctors">Bác sĩ</Link>
        </li>
        <li>Cẩm nang</li>
      </ul>
    </nav>
  );
}

export default Navigation;
