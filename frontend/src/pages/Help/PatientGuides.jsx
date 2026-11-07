import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, BookOpenText, CalendarCheck2, ChevronRight, CircleHelp, FileHeart, Search, Stethoscope, Video } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import Header from "../../components/common/Header/Header";
import Footer from "../../components/common/Footer/Footer";
import patientGuideService from "../../services/patient-guide.service.js";
import { getApiErrorMessage } from "../../api/axios.js";
import "./patient-guides.css";

const CATEGORY_ICONS = {
  "Tài khoản": CircleHelp,
  "Tìm dịch vụ": Stethoscope,
  "Đặt lịch": CalendarCheck2,
  "Lịch hẹn": CalendarCheck2,
  "Tư vấn trực tuyến": Video,
  "Hồ sơ sức khỏe": FileHeart,
  "Đánh giá": BookOpenText,
  "Trợ giúp": CircleHelp,
};

function PatientGuides() {
  const { guideId } = useParams();
  const [guides, setGuides] = useState([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Tất cả");
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    let mounted = true;
    patientGuideService.list()
      .then((items) => {
        if (!mounted) return;
        setGuides(items);
        setStatus("ready");
      })
      .catch((error) => {
        if (!mounted) return;
        setStatus(getApiErrorMessage(error, "Không tải được nội dung hướng dẫn."));
      });
    return () => { mounted = false; };
  }, []);

  const activeGuide = guides.find((item) => item.id === guideId);
  const categories = useMemo(() => ["Tất cả", ...new Set(guides.map((item) => item.category))], [guides]);
  const results = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("vi");
    return guides.filter((item) => {
      if (category !== "Tất cả" && item.category !== category) return false;
      if (!needle) return true;
      const body = [item.title, item.description, ...item.sections.flatMap((section) => [section.title, section.content]), ...item.faqs.flatMap((faq) => [faq.question, faq.answer])].join(" ").toLocaleLowerCase("vi");
      return body.includes(needle);
    });
  }, [guides, query, category]);

  return (
    <>
      <Header />
      <main className="patient-help">
        <div className="patient-help__container">
          <nav className="patient-help__breadcrumb" aria-label="Đường dẫn">
            <Link to="/">Trang chủ</Link><ChevronRight size={15} aria-hidden="true" />
            {activeGuide ? <><Link to="/help">Hướng dẫn sử dụng</Link><ChevronRight size={15} aria-hidden="true" /><span>{activeGuide.title}</span></> : <span>Hướng dẫn sử dụng</span>}
          </nav>

          {!activeGuide ? <>
            <section className="patient-help__hero">
              <span className="patient-help__eyebrow"><BookOpenText size={16} /> TRUNG TÂM TRỢ GIÚP</span>
              <h1>Hướng dẫn sử dụng Booking Care</h1>
              <p>Tìm câu trả lời và các bước sử dụng dịch vụ dành cho bệnh nhân.</p>
              <label className="patient-help__search">
                <Search size={20} aria-hidden="true" />
                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Bạn cần trợ giúp về điều gì?" aria-label="Tìm kiếm hướng dẫn" />
                {query && <button type="button" onClick={() => setQuery("")}>Xóa</button>}
              </label>
            </section>

            {status === "loading" ? <div className="patient-help__state" role="status">Đang tải hướng dẫn…</div>
              : status !== "ready" ? <div className="patient-help__state patient-help__state--error" role="alert"><p>{status}</p><button type="button" onClick={() => window.location.reload()}>Tải lại</button></div>
                : <>
                  <div className="patient-help__categories" aria-label="Lọc theo chủ đề">
                    {categories.map((item) => <button className={category === item ? "is-active" : ""} type="button" key={item} onClick={() => setCategory(item)}>{item}</button>)}
                  </div>
                  {results.length ? <section className="patient-help__grid" aria-label="Các bài hướng dẫn">
                    {results.map((item) => {
                      const Icon = CATEGORY_ICONS[item.category] || BookOpenText;
                      return <Link className="patient-help-card" to={`/help/${item.id}`} key={item.id}>
                        <span className="patient-help-card__icon"><Icon size={22} aria-hidden="true" /></span>
                        <span className="patient-help-card__category">{item.category}</span>
                        <h2>{item.title}</h2><p>{item.description}</p>
                        <span className="patient-help-card__link">Đọc hướng dẫn <ChevronRight size={16} /></span>
                      </Link>;
                    })}
                  </section> : <div className="patient-help__state"><CircleHelp size={25} /><strong>Chưa tìm thấy hướng dẫn phù hợp</strong><span>Thử từ khóa khác hoặc chọn chủ đề “Tất cả”.</span></div>}
                  <aside className="patient-help__contact"><div><strong>Vẫn cần trợ giúp?</strong><span>Hỏi MediUTE AI về cách sử dụng website.</span></div><span className="patient-help__contact-tip">Mở biểu tượng trò chuyện ở góc màn hình</span></aside>
                </>}
          </> : <article className="patient-guide">
            <Link className="patient-guide__back" to="/help"><ArrowLeft size={17} /> Tất cả hướng dẫn</Link>
            <header className="patient-guide__header"><span>{activeGuide.category}</span><h1>{activeGuide.title}</h1><p>{activeGuide.description}</p></header>
            {activeGuide.sections.length > 3 && <nav className="patient-guide__toc" aria-label="Trong bài viết"><strong>Trong bài viết</strong>{activeGuide.sections.map((section) => <a href={`#${section.id}`} key={section.id}>{section.title}</a>)}</nav>}
            <div className="patient-guide__content">
              {activeGuide.sections.map((section, index) => <section className="patient-guide__section" id={section.id} key={section.id}>
                <span className="patient-guide__step">{String(index + 1).padStart(2, "0")}</span><div><h2>{section.title}</h2><p>{section.content}</p></div>
              </section>)}
              {activeGuide.faqs.length > 0 && <section className="patient-guide__faq"><h2>Câu hỏi thường gặp</h2>{activeGuide.faqs.map((faq) => <details key={faq.question}><summary>{faq.question}</summary><p>{faq.answer}</p></details>)}</section>}
              <aside className="patient-guide__notice"><CircleHelp size={19} /><p>Hướng dẫn này chỉ mô tả cách sử dụng website. Nội dung không thay thế tư vấn, chẩn đoán hoặc điều trị y tế.</p></aside>
            </div>
          </article>}
        </div>
      </main>
      <Footer />
    </>
  );
}

export default PatientGuides;
