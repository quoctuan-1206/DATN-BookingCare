import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import Header from "../../components/common/Header/Header";
import Footer from "../../components/common/Footer/Footer";
import PageBanner from "../../components/common/PageBanner/PageBanner";
import SpecialtyFilter from "../../components/specialty/SpecialtyFilter";
import SpecialtyCard from "../../components/specialty/SpecialtyCard";
import specialtyService from "../../services/specialty.service";
import { getApiErrorMessage } from "../../api/axios";

function Specialties() {
  const [specialties, setSpecialties] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchSpecialties = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page: 1, limit: 50 };
      if (search.trim()) params.search = search.trim();

      const result = await specialtyService.getSpecialties(params);
      setSpecialties(result.data);
      setTotal(result.pagination?.total ?? result.data.length);
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, "Không tải được danh sách chuyên khoa"),
      );
      setSpecialties([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchSpecialties();
  }, [fetchSpecialties]);

  return (
    <>
      <Header />

      <div className="listing-page">
        <PageBanner
          variant="specialty"
          title="Chuyên khoa"
          description="Khám phá các chuyên khoa y tế và tìm dịch vụ phù hợp với nhu cầu của bạn."
        />

        <section className="listing-content">
          <div className="container listing-body">
            <div className="listing-toolbar">
              <SpecialtyFilter
                search={search}
                onSearchChange={setSearch}
                onSubmit={fetchSpecialties}
              />

              <div className="listing-meta">
                <span>
                  Tìm thấy <strong>{total}</strong> chuyên khoa
                </span>
              </div>
            </div>

            <div className="listing-results">
              {loading ? (
                <p>Đang tải danh sách chuyên khoa...</p>
              ) : specialties.length === 0 ? (
                <p>Không tìm thấy chuyên khoa phù hợp.</p>
              ) : (
                <div className="listing-grid">
                  {specialties.map((specialty) => (
                    <SpecialtyCard
                      key={specialty.id}
                      specialty={specialty}
                    />
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

export default Specialties;
