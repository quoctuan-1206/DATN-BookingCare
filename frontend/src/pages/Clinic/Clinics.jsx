import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import Header from "../../components/common/Header/Header";
import Footer from "../../components/common/Footer/Footer";
import PageBanner from "../../components/common/PageBanner/PageBanner";
import ClinicFilter from "../../components/clinic/ClinicFilter";
import ClinicCard from "../../components/clinic/ClinicCard";
import clinicService from "../../services/clinic.service";
import { getApiErrorMessage } from "../../api/axios";

function Clinics() {
  const [clinics, setClinics] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchClinics = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page: 1, limit: 50 };
      if (search.trim()) params.search = search.trim();

      const result = await clinicService.getClinics(params);
      setClinics(result.data);
      setTotal(result.pagination?.total ?? result.data.length);
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, "Không tải được danh sách phòng khám"),
      );
      setClinics([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchClinics();
  }, [fetchClinics]);

  return (
    <>
      <Header />

      <div className="listing-page">
        <PageBanner
          variant="clinic"
          title="Danh sách phòng khám"
          description="Khám phá các cơ sở y tế uy tín trên toàn quốc và đặt lịch khám dễ dàng."
        />

        <section className="listing-content">
          <div className="container listing-body">
            <div className="listing-toolbar">
              <ClinicFilter
                search={search}
                onSearchChange={setSearch}
                onSubmit={fetchClinics}
              />

              <div className="listing-meta">
                <span>
                  Tìm thấy <strong>{total}</strong> phòng khám
                </span>
              </div>
            </div>

            <div className="listing-results">
              {loading ? (
                <p>Đang tải danh sách phòng khám...</p>
              ) : clinics.length === 0 ? (
                <p>Không tìm thấy phòng khám phù hợp.</p>
              ) : (
                <div className="listing-grid">
                  {clinics.map((clinic) => (
                    <ClinicCard key={clinic.id} clinic={clinic} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      </div>

      <Footer />
    </>
  );
}

export default Clinics;
