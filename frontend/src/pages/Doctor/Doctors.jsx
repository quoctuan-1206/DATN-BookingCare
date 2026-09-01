import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { Home, Search, X, ChevronDown } from "lucide-react";
import Header from "../../components/common/Header/Header";
import Footer from "../../components/common/Footer/Footer";
import DoctorCard from "../../components/doctor/DoctorCard";
import doctorService from "../../services/doctor.service";
import specialtyService from "../../services/specialty.service";
import { getApiErrorMessage } from "../../api/axios";

function Doctors() {
  const [searchParams] = useSearchParams();
  const [allDoctors, setAllDoctors] = useState([]);
  const [specialties, setSpecialties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [specialtyId, setSpecialtyId] = useState(
    searchParams.get("specialty_id") || searchParams.get("specialty") || "",
  );

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const [doctorsResult, specialtiesResult] = await Promise.all([
          doctorService.getDoctors({ page: 1, limit: 100 }),
          specialtyService.getSpecialties({ page: 1, limit: 100 }),
        ]);
        if (!cancelled) {
          setAllDoctors(doctorsResult.data || []);
          setSpecialties(specialtiesResult.data || []);
        }
      } catch (error) {
        if (!cancelled) {
          setAllDoctors([]);
          setSpecialties([]);
          toast.error(
            getApiErrorMessage(error, "Không tải được danh sách bác sĩ"),
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
    let list = allDoctors;

    if (search.trim()) {
      const kw = search.trim().toLowerCase();
      list = list.filter(
        (d) =>
          d.name?.toLowerCase().includes(kw) ||
          d.specialty?.toLowerCase().includes(kw) ||
          d.clinic?.toLowerCase().includes(kw),
      );
    }

    if (specialtyId) {
      list = list.filter((d) => d.specialty_id === Number(specialtyId));
    }

    return list;
  }, [allDoctors, search, specialtyId]);

  const clearFilters = () => {
    setSearch("");
    setSpecialtyId("");
  };

  const hasFilters = search.trim() || specialtyId;

  return (
    <>
      <Header />
      <div className="specialty-list-page">
        <div className="specialty-list-inner">
          <nav className="specialty-breadcrumb specialty-breadcrumb--list">
            <Link to="/">
              <Home size={16} />
            </Link>
            <span>/ Bác sĩ</span>
          </nav>

          <div className="specialty-toolbar">
            <div className="specialty-search-box">
              <Search size={18} className="specialty-search-icon" />
              <input
                type="text"
                className="specialty-search-input"
                placeholder="Tìm bác sĩ..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
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

            {!loading && specialties.length > 0 && (
              <div className="specialty-dropdown-wrap">
                <ChevronDown size={16} className="specialty-dropdown-icon" />
                <select
                  className="specialty-dropdown"
                  value={specialtyId}
                  onChange={(e) => setSpecialtyId(e.target.value)}
                >
                  <option value="">Tất cả chuyên khoa</option>
                  {specialties.map((s) => (
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
                Tìm thấy <strong>{filtered.length}</strong> bác sĩ
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
            <p>Đang tải danh sách bác sĩ...</p>
          ) : filtered.length === 0 ? (
            <p className="specialty-empty">Không tìm thấy bác sĩ phù hợp.</p>
          ) : (
            <div className="specialty-grid">
              {filtered.map((doctor) => (
                <DoctorCard key={doctor.id} doctor={doctor} />
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}

export default Doctors;
