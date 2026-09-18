import { useEffect, useMemo, useState } from "react";
import { ArrowRight, CircleDollarSign, FlaskConical, Home, Search, ShieldCheck, X } from "lucide-react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import Header from "../../components/common/Header/Header";
import Footer from "../../components/common/Footer/Footer";
import labService from "../../services/lab.service";
import { getApiErrorMessage } from "../../api/axios";
import { resolveMediaUrl } from "../../utils/media";

function LabTests() {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await labService.getPublicTests();
        if (!cancelled) setTests(data);
      } catch (error) {
        if (!cancelled) {
          setTests([]);
          toast.error(getApiErrorMessage(error, "Không tải được danh mục xét nghiệm"));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const filteredTests = useMemo(() => {
    const keyword = search.trim().toLocaleLowerCase("vi");
    if (!keyword) return tests;
    return tests.filter((test) =>
      [test.name, test.description].some((value) =>
        value?.toLocaleLowerCase("vi").includes(keyword),
      ),
    );
  }, [search, tests]);

  return (
    <>
      <Header />
      <main className="lab-catalog-page">
        <section className="lab-catalog-hero">
          <div className="lab-catalog-inner">
            <nav className="lab-breadcrumb" aria-label="Điều hướng">
              <Link to="/" aria-label="Trang chủ"><Home size={16} /></Link>
              <span>/ Xét nghiệm</span>
            </nav>
            <div className="lab-catalog-heading">
              <div>
                <span className="lab-catalog-eyebrow"><FlaskConical size={17} /> Dịch vụ xét nghiệm</span>
                <h1>Danh mục xét nghiệm</h1>
                <p>Tham khảo và tự chọn các xét nghiệm đang được cung cấp. Bạn cũng có thể thực hiện theo chỉ định của bác sĩ.</p>
                <Link className="lab-catalog-book-btn" to="/lab-booking">Đặt lịch xét nghiệm <ArrowRight size={18} /></Link>
              </div>
              <div className="lab-catalog-note">
                <ShieldCheck size={24} />
                <div><strong>Kết quả được bảo mật</strong><span>Bạn, bác sĩ phụ trách và nhân viên xét nghiệm được truy cập theo đúng quyền.</span></div>
              </div>
            </div>
          </div>
        </section>

        <section className="lab-catalog-content">
          <div className="lab-catalog-inner">
            <div className="lab-search-row">
              <div className="lab-search-box">
                <Search size={19} />
                <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm theo tên hoặc mô tả xét nghiệm..." aria-label="Tìm xét nghiệm" />
                {search && <button type="button" onClick={() => setSearch("")} aria-label="Xóa tìm kiếm"><X size={17} /></button>}
              </div>
              {!loading && <span className="lab-result-count"><strong>{filteredTests.length}</strong> xét nghiệm</span>}
            </div>

            {loading ? (
              <div className="lab-state"><span className="lab-spinner" />Đang tải danh mục xét nghiệm...</div>
            ) : filteredTests.length === 0 ? (
              <div className="lab-state lab-state--empty"><FlaskConical size={38} /><h2>Không tìm thấy xét nghiệm</h2><p>Hãy thử một từ khóa ngắn hoặc tên xét nghiệm khác.</p></div>
            ) : (
              <div className="lab-test-grid">
                {filteredTests.map((test) => (
                  <article className="lab-test-card" key={test.id}>
                    {test.image ? (
                      <Link className="lab-test-card__image" to={`/lab-tests/${test.id}`}>
                        <img src={resolveMediaUrl(test.image)} alt={test.name} />
                      </Link>
                    ) : null}
                    <div className="lab-test-card__top">
                      <span className="lab-test-card__icon"><FlaskConical size={23} /></span>
                      <span className="lab-test-card__status">Đang cung cấp</span>
                    </div>
                    <h2><Link to={`/lab-tests/${test.id}`}>{test.name}</Link></h2>
                    <p>{test.description || "Thông tin chi tiết sẽ được bác sĩ tư vấn khi chỉ định xét nghiệm."}</p>
                    <div className="lab-test-card__price">
                      <CircleDollarSign size={19} />
                      <span>Giá tham khảo</span>
                      <strong>{Number(test.price || 0).toLocaleString("vi-VN")} đ</strong>
                    </div>
                    <div className="lab-test-card__actions">
                      <Link to={`/lab-tests/${test.id}`}>Xem chi tiết</Link>
                      <Link to={`/lab-booking?test_ids=${test.id}`}>Đặt lịch <ArrowRight size={16} /></Link>
                    </div>
                  </article>
                ))}
              </div>
            )}

            <div className="lab-catalog-cta">
              <div><strong>Bạn muốn thực hiện xét nghiệm?</strong><p>Tự chọn dịch vụ và gửi phiếu trực tiếp tới bộ phận xét nghiệm.</p></div>
              <Link to="/lab-booking">Đặt lịch xét nghiệm <ArrowRight size={18} /></Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

export default LabTests;
