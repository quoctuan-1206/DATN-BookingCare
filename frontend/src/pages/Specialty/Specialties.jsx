import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { Home, Search, X, ChevronDown } from "lucide-react";
import Header from "../../components/common/Header/Header";
import Footer from "../../components/common/Footer/Footer";
import SpecialtyCard from "../../components/specialty/SpecialtyCard";
import specialtyService from "../../services/specialty.service";
import { getApiErrorMessage } from "../../api/axios";

function Specialties() {
  const [allSpecialties, setAllSpecialties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeId, setActiveId] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const result = await specialtyService.getSpecialties({
          page: 1,
          limit: 100,
        });
        if (!cancelled) setAllSpecialties(result.data || []);
      } catch (error) {
        if (!cancelled) {
          setAllSpecialties([]);
          toast.error(
            getApiErrorMessage(error, "Không tải được danh sách chuyên khoa"),
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    let list = allSpecialties;

    if (search.trim()) {
      const kw = search.trim().toLowerCase();
      list = list.filter((s) => s.name.toLowerCase().includes(kw));
    }

    if (activeId) {
      list = list.filter((s) => s.id === Number(activeId));
    }

    return list;
  }, [allSpecialties, search, activeId]);

  const clearFilters = () => {
    setSearch("");
    setActiveId("");
  };

  const hasFilters = search.trim() || activeId;

  return (
    <>
      <Header />
      <div className="specialty-list-page">
        <div className="specialty-list-inner">
          <nav className="specialty-breadcrumb specialty-breadcrumb--list">
            <Link to="/">
              <Home size={16} />
            </Link>
            <span>/ Khám Chuyên khoa</span>
          </nav>

          <div className="specialty-toolbar">
            <div className="specialty-search-box">
              <Search size={18} className="specialty-search-icon" />
              <input
                type="text"
                className="specialty-search-input"
                placeholder="Tìm chuyên khoa..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setActiveId(null);
                }}
              />
              {search && (
                <button
                  type="button"
                  className="specialty-search-clear"
                  onClick={() => setSearch("")}
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {!loading && allSpecialties.length > 0 && (
              <div className="specialty-dropdown-wrap">
                <ChevronDown size={16} className="specialty-dropdown-icon" />
                <select
                  className="specialty-dropdown"
                  value={activeId}
                  onChange={(e) => setActiveId(e.target.value)}
                >
                  <option value="">Tất cả chuyên khoa</option>
                  {allSpecialties.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {hasFilters && (
            <div className="specialty-filter-info">
              <span>
                Tìm thấy <strong>{filtered.length}</strong> chuyên khoa
              </span>
              <button
                type="button"
                className="specialty-clear-btn"
                onClick={clearFilters}
              >
                Xóa bộ lọc
              </button>
            </div>
          )}

          {loading ? (
            <p>Đang tải danh sách chuyên khoa...</p>
          ) : filtered.length === 0 ? (
            <p className="specialty-empty">
              Không tìm thấy chuyên khoa phù hợp.
            </p>
          ) : (
            <div className="specialty-grid">
              {filtered.map((specialty) => (
                <SpecialtyCard key={specialty.id} specialty={specialty} />
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}

export default Specialties;
