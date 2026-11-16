import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertCircle,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  HeartPulse,
  ImageOff,
  Microscope,
  RotateCcw,
  ScanLine,
  Search,
  Stethoscope,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import { Link, useSearchParams } from "react-router-dom";
import Header from "../../components/common/Header/Header";
import Footer from "../../components/common/Footer/Footer";
import { CLINICAL_TYPES, CLINICAL_TYPE_LABEL } from "../../components/clinical/clinical.constants";
import { getApiErrorMessage } from "../../api/axios";
import clinicalService from "../../services/clinical.service";
import { resolveMediaUrl } from "../../utils/media";

const PAGE_SIZE = 9;
const CLINICAL_TYPE_ICONS = {
  LAB: Microscope,
  XRAY: ScanLine,
  ULTRASOUND: Activity,
  ENDOSCOPY: Stethoscope,
  ECG: HeartPulse,
};

function ServiceTypeIcon({ type, size = 18 }) {
  const Icon = CLINICAL_TYPE_ICONS[type] || Activity;
  return <Icon size={size} aria-hidden="true" />;
}

function formatPrice(value) {
  if (value === null || value === undefined || value === "") return "Giá chưa cập nhật";
  const price = Number(value);
  if (!Number.isFinite(price)) return "Giá chưa cập nhật";
  return `${price.toLocaleString("vi-VN")} đ`;
}

function ClinicalServiceCard({ service }) {
  const [imageAvailable, setImageAvailable] = useState(Boolean(service.image));
  const typeLabel =
    CLINICAL_TYPE_LABEL[service.service_type] ||
    service.service_type_label ||
    service.service_type ||
    "Cận lâm sàng";

  return (
    <Link
      className="clinical-public-card"
      to={`/clinical-services/${service.id}`}
      aria-label={`Xem chi tiết dịch vụ ${service.name}`}
    >
      <div className="clinical-public-card__image">
        {imageAvailable ? (
          <img
            src={resolveMediaUrl(service.image)}
            alt={service.name}
            loading="lazy"
            onError={() => setImageAvailable(false)}
          />
        ) : (
          <span className="clinical-public-card__image-fallback" aria-hidden="true">
            <ImageOff size={30} />
          </span>
        )}
      </div>

      <div className="clinical-public-card__body">
        <div className="clinical-public-card__details">
          <span className="clinical-public-card__type">
            <ServiceTypeIcon type={service.service_type} size={16} />
            {typeLabel}
          </span>
          {service.estimated_duration_minutes ? (
            <span className="clinical-public-card__duration">
              <CalendarClock size={15} />
              {service.estimated_duration_minutes} phút
            </span>
          ) : null}
        </div>
        <h2>{service.name}</h2>
        <div className="clinical-public-card__price">
          <span>Giá dịch vụ</span>
          <strong>{formatPrice(service.price)}</strong>
        </div>
        <span className="clinical-public-card__action">Xem chi tiết</span>
      </div>
    </Link>
  );
}

function ClinicalServiceCatalog() {
  const [searchParams, setSearchParams] = useSearchParams();
  const serviceType = searchParams.get("service_type") || "";
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("default");
  const [page, setPage] = useState(1);
  const activeServiceType = CLINICAL_TYPES.some((type) => type.value === serviceType)
    ? serviceType
    : "";

  useEffect(() => {
    let cancelled = false;

    async function loadServices() {
      setLoading(true);
      setError("");
      try {
        const data = await clinicalService.getPublicServices({
          booking_mode: "SELF_BOOKING",
        });
        if (!cancelled) setServices(data);
      } catch (loadError) {
        if (!cancelled) {
          const message = getApiErrorMessage(
            loadError,
            "Không tải được danh sách dịch vụ cận lâm sàng",
          );
          setError(message);
          toast.error(message);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadServices();
    return () => {
      cancelled = true;
    };
  }, [reload]);

  const filteredServices = useMemo(() => {
    const keyword = search.trim().toLocaleLowerCase("vi-VN");
    const matching = services.filter((service) => {
      const matchesType = !activeServiceType || service.service_type === activeServiceType;
      const matchesName = !keyword ||
        String(service.name || "").toLocaleLowerCase("vi-VN").includes(keyword);
      return matchesType && matchesName;
    });

    if (sortBy === "price-asc") {
      matching.sort((left, right) => Number(left.price ?? Infinity) - Number(right.price ?? Infinity));
    } else if (sortBy === "price-desc") {
      matching.sort((left, right) => Number(right.price ?? -Infinity) - Number(left.price ?? -Infinity));
    } else if (sortBy === "name") {
      matching.sort((left, right) => String(left.name || "").localeCompare(String(right.name || ""), "vi"));
    }

    return matching;
  }, [services, activeServiceType, search, sortBy]);

  const pageCount = Math.ceil(filteredServices.length / PAGE_SIZE);
  const visibleServices = filteredServices.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function selectType(value) {
    setPage(1);
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      if (value === "ALL") next.delete("service_type");
      else next.set("service_type", value);
      return next;
    }, { replace: true });
  }

  function submitSearch(event) {
    event.preventDefault();
    setSearch(searchInput.trim());
    setPage(1);
  }

  function clearFilters() {
    setSearchInput("");
    setSearch("");
    setSortBy("default");
    setPage(1);
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      next.delete("service_type");
      return next;
    }, { replace: true });
  }

  const selectedType = activeServiceType || "ALL";

  return (
    <>
      <Header />
      <main className="clinical-public-page">
        <div className="clinical-public-container">
          <nav className="clinical-public-breadcrumb" aria-label="Điều hướng">
            <Link to="/">Trang chủ</Link>
            <ChevronRight size={14} aria-hidden="true" />
            <span aria-current="page">Cận lâm sàng</span>
          </nav>

          <div className="clinical-public-categories" aria-label="Danh mục dịch vụ">
            {CLINICAL_TYPES.map((type) => {
              const isActive = selectedType === type.value;
              const Icon = type.value === "ALL" ? Activity : null;
              return (
                <button
                  className={`clinical-public-category${isActive ? " is-active" : ""}`}
                  key={type.value}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => selectType(type.value)}
                >
                  {Icon ? <Icon size={19} aria-hidden="true" /> : <ServiceTypeIcon type={type.value} size={19} />}
                  <span>{type.label}</span>
                </button>
              );
            })}
          </div>

          <form className="clinical-public-search" role="search" onSubmit={submitSearch}>
            <Search size={19} aria-hidden="true" />
            <input
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Tìm theo tên dịch vụ..."
              aria-label="Tìm theo tên dịch vụ"
            />
            {searchInput ? (
              <button
                className="clinical-public-search__clear"
                type="button"
                aria-label="Xóa từ khóa"
                onClick={() => {
                  setSearchInput("");
                  setSearch("");
                  setPage(1);
                }}
              >
                <X size={17} />
              </button>
            ) : null}
            <button className="clinical-public-search__submit" type="submit">Tìm kiếm</button>
          </form>

          {!loading && !error ? (
            <div className="clinical-public-results">
              <p aria-live="polite">Tìm thấy <strong>{filteredServices.length}</strong> dịch vụ</p>
              <label>
                <span>Sắp xếp</span>
                <select
                  value={sortBy}
                  onChange={(event) => {
                    setSortBy(event.target.value);
                    setPage(1);
                  }}
                  aria-label="Sắp xếp dịch vụ"
                >
                  <option value="default">Mặc định</option>
                  <option value="price-asc">Giá thấp đến cao</option>
                  <option value="price-desc">Giá cao đến thấp</option>
                  <option value="name">Tên A–Z</option>
                </select>
              </label>
            </div>
          ) : null}

          <section className="clinical-public-content" aria-live="polite">
            {loading ? (
              <div className="clinical-public-grid" role="status" aria-label="Đang tải dịch vụ">
                {Array.from({ length: PAGE_SIZE }, (_, index) => (
                  <div className="clinical-public-card clinical-public-card--skeleton" key={index} aria-hidden="true">
                    <span className="clinical-public-card__skeleton-image" />
                    <span className="clinical-public-card__skeleton-body">
                      <span />
                      <span />
                      <span />
                    </span>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="clinical-catalog-state clinical-catalog-state--error" role="alert">
                <AlertCircle size={34} />
                <h2>Không tải được dịch vụ</h2>
                <p>{error}</p>
                <button type="button" onClick={() => setReload((value) => value + 1)}>
                  <RotateCcw size={16} /> Thử lại
                </button>
              </div>
            ) : filteredServices.length === 0 ? (
              <div className="clinical-catalog-state" role="status">
                <Search size={34} />
                <h2>Không tìm thấy dịch vụ phù hợp</h2>
                <p>Thử đổi từ khóa hoặc xóa bộ lọc để xem các dịch vụ khác.</p>
                <button type="button" onClick={clearFilters}>Xóa bộ lọc</button>
              </div>
            ) : (
              <div className="clinical-public-grid">
                {visibleServices.map((service) => (
                  <ClinicalServiceCard key={service.id} service={service} />
                ))}
              </div>
            )}
          </section>

          {!loading && !error && pageCount > 1 ? (
            <nav className="clinical-public-pagination" aria-label="Phân trang dịch vụ">
              <button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page === 1} aria-label="Trang trước">
                <ChevronLeft size={17} /> <span>Trước</span>
              </button>
              {Array.from({ length: pageCount }, (_, index) => index + 1).map((pageNumber) => (
                <button
                  key={pageNumber}
                  type="button"
                  className={pageNumber === page ? "is-active" : ""}
                  aria-current={pageNumber === page ? "page" : undefined}
                  onClick={() => setPage(pageNumber)}
                >
                  {pageNumber}
                </button>
              ))}
              <button type="button" onClick={() => setPage((current) => Math.min(pageCount, current + 1))} disabled={page === pageCount} aria-label="Trang tiếp theo">
                <span>Tiếp</span> <ChevronRight size={17} />
              </button>
            </nav>
          ) : null}
        </div>
      </main>
      <Footer />
    </>
  );
}

export default ClinicalServiceCatalog;
