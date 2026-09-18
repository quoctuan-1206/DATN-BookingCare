import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Home } from "lucide-react";
import toast from "react-hot-toast";
import Header from "../../components/common/Header/Header";
import Footer from "../../components/common/Footer/Footer";
import ClinicFilter from "../../components/clinic/ClinicFilter";
import ClinicCard from "../../components/clinic/ClinicCard";
import clinicService from "../../services/clinic.service";
import { getApiErrorMessage } from "../../api/axios";

function Clinics() {
  const [allClinics, setAllClinics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const result = await clinicService.getClinics({ page: 1, limit: 100 });
        if (!cancelled) setAllClinics(result.data || []);
      } catch (error) {
        if (!cancelled) {
          setAllClinics([]);
          toast.error(
            getApiErrorMessage(error, "Không tải được danh sách phòng khám"),
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

  const clinics = useMemo(() => {
    const keyword = search.trim().toLocaleLowerCase("vi");
    if (!keyword) return allClinics;

    return allClinics.filter((clinic) =>
      [clinic.name, clinic.address, clinic.email, clinic.phone].some((value) =>
        value?.toLocaleLowerCase("vi").includes(keyword),
      ),
    );
  }, [allClinics, search]);

  return (
    <>
      <Header />

      <main className="clinic-list-page">
        <div className="clinic-list-inner">
          <nav className="clinic-breadcrumb" aria-label="Điều hướng">
            <Link to="/" aria-label="Trang chủ">
              <Home size={16} />
            </Link>
            <span>/ Phòng khám</span>
          </nav>
          <ClinicFilter
            search={search}
            onSearchChange={setSearch}
            onClear={() => setSearch("")}
          />

          {search.trim() && !loading && (
            <div className="clinic-filter-info">
              <span>
                Tìm thấy <strong>{clinics.length}</strong> phòng khám
              </span>
              <button type="button" onClick={() => setSearch("")}>
                Xóa bộ lọc
              </button>
            </div>
          )}

          {loading ? (
            <div className="clinic-state">Đang tải danh sách phòng khám...</div>
          ) : clinics.length === 0 ? (
            <div className="clinic-state clinic-state--empty">
              <h2>Không tìm thấy phòng khám</h2>
              <p>Hãy thử tìm bằng tên, địa chỉ hoặc số điện thoại khác.</p>
            </div>
          ) : (
            <div className="clinic-grid">
              {clinics.map((clinic) => (
                <ClinicCard key={clinic.id} clinic={clinic} />
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}

export default Clinics;
