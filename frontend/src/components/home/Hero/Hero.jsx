import "./Hero.css";

function Hero() {
  return (
    <section className="hero">
      <div className="hero-content">
        <h1>Chăm sóc sức khỏe toàn diện</h1>

        <p>Đặt lịch khám nhanh chóng - Tiện lợi - Uy tín</p>

        <div className="search-box">
          <input type="text" placeholder="Tìm bác sĩ, chuyên khoa..." />

          <button>Tìm kiếm</button>
        </div>
      </div>
    </section>
  );
}

export default Hero;
