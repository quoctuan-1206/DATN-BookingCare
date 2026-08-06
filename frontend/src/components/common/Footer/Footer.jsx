import "./Footer.css";

import { Link } from "react-router-dom";
import { Globe, PlayCircle, Mail, Phone, MapPin } from "lucide-react";

function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-container">
        <div className="footer-column">
          <h2>BookingCare</h2>

          <p>
            Nền tảng đặt lịch khám bệnh trực tuyến, giúp người bệnh dễ dàng kết
            nối với bác sĩ và cơ sở y tế uy tín trên toàn quốc.
          </p>
        </div>

        <div className="footer-column">
          <h3>Liên kết</h3>

          <ul>
            <li>
              <Link to="/specialties">Chuyên khoa</Link>
            </li>
            <li>
              <Link to="/doctors">Bác sĩ</Link>
            </li>
            <li>
              <Link to="/clinics">Phòng khám</Link>
            </li>
            <li>
              <Link to="/articles">Bài viết</Link>
            </li>
          </ul>
        </div>

        <div className="footer-column">
          <h3>Hỗ trợ</h3>

          <ul>
            <li>Điều khoản sử dụng</li>
            <li>Chính sách bảo mật</li>
            <li>Hướng dẫn đặt lịch</li>
            <li>Liên hệ</li>
          </ul>
        </div>

        <div className="footer-column">
          <h3>Thông tin</h3>

          <p>
            <MapPin size={18} />
            TP. Hồ Chí Minh
          </p>

          <p>
            <Phone size={18} />
            0123 456 789
          </p>

          <p>
            <Mail size={18} />
            bookingcare@gmail.com
          </p>

          <div className="footer-social">
            <Globe />
            <PlayCircle />
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        © 2026 BookingCare. All Rights Reserved.
      </div>
    </footer>
  );
}

export default Footer;
