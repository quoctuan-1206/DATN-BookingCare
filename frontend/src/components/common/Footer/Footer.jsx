import "./Footer.css";

import { Link } from "react-router-dom";
import { ArrowUpRight, HelpCircle } from "lucide-react";

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-column">
          <Link to="/" className="footer-brand" aria-label="MediUTE - Trang chủ">
            <img src="/favicon.svg" alt="" aria-hidden="true" />
            <span>MediUTE</span>
          </Link>
          <p className="footer-description">
            Nền tảng đặt lịch khám bệnh trực tuyến, giúp kết nối người bệnh với
            bác sĩ và cơ sở y tế uy tín.
          </p>
        </div>

        <div className="footer-column">
          <h3>Khám và điều trị</h3>
          <ul>
            <li><Link to="/doctors">Bác sĩ</Link></li>
            <li>
              <Link to="/specialties">Chuyên khoa</Link>
            </li>
            <li>
              <Link to="/clinics">Cơ sở y tế</Link>
            </li>
            <li><Link to="/clinical-services">Cận lâm sàng</Link></li>
          </ul>
        </div>

        <div className="footer-column">
          <h3>Hỗ trợ</h3>
          <ul>
            <li><Link to="/help">Hướng dẫn đặt lịch</Link></li>
          </ul>
        </div>

        <div className="footer-column">
          <h3>Thông tin liên hệ</h3>
          <p className="footer-contact-note">
            <HelpCircle size={18} aria-hidden="true" />
            Xem hướng dẫn và thông tin hỗ trợ tại MediUTE.
          </p>
          <Link to="/help" className="footer-contact-link">
            Trung tâm hỗ trợ <ArrowUpRight size={15} aria-hidden="true" />
          </Link>
        </div>
      </div>

      <div className="footer-bottom">
        © {new Date().getFullYear()} MediUTE. All rights reserved.
      </div>
    </footer>
  );
}

export default Footer;
