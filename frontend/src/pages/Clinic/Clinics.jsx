import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Search } from "lucide-react";
import toast from "react-hot-toast";
import Header from "../../components/common/Header/Header";
import Footer from "../../components/common/Footer/Footer";
import ClinicFilter from "../../components/clinic/ClinicFilter";
import ClinicCard from "../../components/clinic/ClinicCard";
import clinicService from "../../services/clinic.service";
import { getApiErrorMessage } from "../../api/axios";

function Clinics() {
  const PAGE_SIZE = 6;
  const [allClinics, setAllClinics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [reload, setReload] = useState(0);
  const searchInputRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    async function loadClinics() {
      setLoading(true);
      setLoadError(false);
      try {
        const result = await clinicService.getClinics({ page: 1, limit: 100 });
        if (!cancelled) setAllClinics(result.data || []);
      } catch (error) {
        if (!cancelled) {
          setAllClinics([]);
          setLoadError(true);
          toast.error(
            getApiErrorMessage(error, "Không tải được danh sách cơ sở y tế"),
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadClinics();
    return () => {
      cancelled = true;
    };
  }, [reload]);

  const clinics = useMemo(() => {
    const keyword = search.trim().toLocaleLowerCase("vi");
    if (!keyword) return allClinics;

    return allClinics.filter((clinic) =>
      [clinic.name, clinic.address, clinic.email, clinic.phone].some((value) =>
        value?.toLocaleLowerCase("vi").includes(keyword),
      ),
    );
  }, [allClinics, search]);

  const pageCount = Math.max(1, Math.ceil(clinics.length / PAGE_SIZE));
  const visibleClinics = useMemo(
    () => clinics.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [clinics, page],
  );

  function submitSearch(event) {
    event.preventDefault();
    setSearch(searchInput.trim());
    setPage(1);
  }

  function clearSearch() {
    setSearchInput("");
    setSearch("");
    setPage(1);
  }

  return (
    <>
      <Header />

      <main className="clinic-list-page">
        <div className="clinic-list-inner">
          <nav className="clinic-breadcrumb" aria-label="Điều hướng">
            <Link to="/">Trang chủ</Link>
            <ChevronRight size={14} aria-hidden="true" />
            <span aria-current="page">Cơ sở y tế</span>
          </nav>

          <ClinicFilter
            search={searchInput}
            onSearchChange={setSearchInput}
            onClear={clearSearch}
            onSubmit={submitSearch}
            inputRef={searchInputRef}
          />

          {!loading && !loadError && (
            <div className="clinic-filter-info" aria-live="polite">
              <span>Tìm thấy <strong>{clinics.length}</strong> cơ sở y tế</span>
              {search && <button type="button" onClick={clearSearch}>Xóa tìm kiếm</button>}
            </div>
          )}

          {loading ? (
            <div className="clinic-skeleton-grid" role="status" aria-label="Đang tải cơ sở y tế">
              {Array.from({ length: PAGE_SIZE }, (_, index) => (
                <div className="clinic-skeleton-card" key={index} aria-hidden="true">
                  <span className="clinic-skeleton-image" />
                  <span className="clinic-skeleton-content">
                    <span className="clinic-skeleton-line clinic-skeleton-line--title" />
                    <span className="clinic-skeleton-line" />
                    <span className="clinic-skeleton-line clinic-skeleton-line--short" />
                    <span className="clinic-skeleton-line clinic-skeleton-line--link" />
                  </span>
                </div>
              ))}
            </div>
          ) : loadError ? (
            <div className="clinic-state clinic-list-state" role="alert">
              <h2>Chưa tải được danh sách cơ sở y tế</h2>
              <p>Vui lòng kiểm tra kết nối rồi thử lại.</p>
              <button className="clinic-retry-button" type="button" onClick={() => setReload((value) => value + 1)}>Thử lại</button>
            </div>
          ) : clinics.length === 0 ? (
            <div className="clinic-state clinic-list-state" role="status">
              <Search size={30} aria-hidden="true" />
              <h2>Không tìm thấy cơ sở y tế phù hợp</h2>
              <p>{search ? "Thử đổi từ khóa hoặc xóa nội dung tìm kiếm để xem lại danh sách." : "Hiện chưa có cơ sở y tế để hiển thị."}</p>
              <button
                className="clinic-retry-button"
                type="button"
                onClick={search ? clearSearch : () => searchInputRef.current?.focus()}
              >
                {search ? "Xóa tìm kiếm" : "Tìm kiếm lại"}
              </button>
            </div>
          ) : (
            <>
              <div className="clinic-grid">
                {visibleClinics.map((clinic) => (
                  <ClinicCard key={clinic.id} clinic={clinic} />
                ))}
              </div>
              {pageCount > 1 && (
                <nav className="clinic-pagination" aria-label="Phân trang danh sách cơ sở y tế">
                  <button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page === 1}>Trước</button>
                  {Array.from({ length: pageCount }, (_, index) => index + 1).map((pageNumber) => (
                    <button key={pageNumber} type="button" className={pageNumber === page ? "is-active" : ""} aria-current={pageNumber === page ? "page" : undefined} onClick={() => setPage(pageNumber)}>{pageNumber}</button>
                  ))}
                  <button type="button" onClick={() => setPage((current) => Math.min(pageCount, current + 1))} disabled={page === pageCount}>Tiếp</button>
                </nav>
              )}
            </>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}

export default Clinics;
