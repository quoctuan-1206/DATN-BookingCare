import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2,
  CalendarDays,
  Lock,
  Search,
  ShieldCheck,
  Stethoscope,
} from "lucide-react";
import "./Hero.css";

const FEATURES = [
  {
    icon: ShieldCheck,
    title: "Uy tín",
    text: "Bác sĩ và cơ sở y tế được xác thực",
  },
  {
    icon: CalendarDays,
    title: "Nhanh chóng",
    text: "Đặt lịch chỉ trong vài bước đơn giản",
  },
  {
    icon: Lock,
    title: "Bảo mật",
    text: "Thông tin cá nhân được bảo vệ tuyệt đối",
  },
];

const STATS = [
  {
    icon: ShieldCheck,
    value: "10.000+",
    label: "Lượt đặt khám thành công",
  },
  {
    icon: Stethoscope,
    value: "500+",
    label: "Bác sĩ chuyên môn cao",
  },
  {
    icon: Building2,
    value: "200+",
    label: "Cơ sở y tế uy tín",
  },
];

function Hero() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  const handleSearch = (event) => {
    event.preventDefault();
    const q = query.trim();
    navigate(q ? `/doctors?search=${encodeURIComponent(q)}` : "/doctors");
  };

  return (
    <section className="hero">
      <div className="hero-inner">
        <div className="hero-copy">
          <span className="hero-badge">
            <ShieldCheck size={16} />
            Nền tảng đặt lịch khám uy tín hàng đầu
          </span>

          <h1>
            Chăm sóc sức khỏe
            <span> toàn diện</span>
          </h1>

          <p>Đặt lịch khám nhanh chóng với bác sĩ giỏi, cơ sở y tế uy tín.</p>
          <p>Tiện lợi – Nhanh chóng – An toàn.</p>  

          <form className="hero-search" onSubmit={handleSearch}>
            <Search size={20} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm bác sĩ, chuyên khoa, cơ sở y tế..."
            />
            <button type="submit">Tìm kiếm</button>
          </form>

          <div className="hero-features">
            {FEATURES.map((item) => (
              <div className="hero-feature" key={item.title}>
                <item.icon size={22} />
                <div>
                  <strong>{item.title}</strong>
                  <span>{item.text}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="hero-visual">
          <div className="hero-stats">
            {STATS.map((item) => (
              <article className="hero-stat" key={item.label}>
                <item.icon size={22} />
                <div>
                  <strong>{item.value}</strong>
                  <span>{item.label}</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero;
