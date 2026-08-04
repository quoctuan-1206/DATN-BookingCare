import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import Header from "../../components/common/Header/Header";
import Footer from "../../components/common/Footer/Footer";
import PageBanner from "../../components/common/PageBanner/PageBanner";
import DoctorFilter from "../../components/doctor/DoctorFilter";
import DoctorCard from "../../components/doctor/DoctorCard";
import doctorService from "../../services/doctor.service";
import { getApiErrorMessage } from "../../api/axios";

function Doctors() {
  const [doctors, setDoctors] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [specialtyId, setSpecialtyId] = useState("");

  const fetchDoctors = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page: 1, limit: 50 };
      if (search.trim()) params.search = search.trim();
      if (specialtyId) params.specialty_id = Number(specialtyId);

      const result = await doctorService.getDoctors(params);
      setDoctors(result.data);
      setTotal(result.pagination?.total ?? result.data.length);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không tải được danh sách bác sĩ"));
      setDoctors([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [search, specialtyId]);

  useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors]);

  return (
    <>
      <Header />

      <div className="listing-page">
        <PageBanner
          variant="doctor"
          title="Danh sách bác sĩ"
          description="Tìm bác sĩ uy tín, xem hồ sơ chuyên môn và đặt lịch khám nhanh chóng."
        />

        <section className="listing-content">
          <div className="container listing-body">
            <div className="listing-toolbar">
              <DoctorFilter
                search={search}
                specialtyId={specialtyId}
                onSearchChange={setSearch}
                onSpecialtyChange={setSpecialtyId}
                onSubmit={fetchDoctors}
              />

              <div className="listing-meta">
                <span>
                  Tìm thấy <strong>{total}</strong> bác sĩ
                </span>
              </div>
            </div>

            <div className="listing-results">
              {loading ? (
                <p>Đang tải danh sách bác sĩ...</p>
              ) : doctors.length === 0 ? (
                <p>Không tìm thấy bác sĩ phù hợp.</p>
              ) : (
                <div className="listing-grid">
                  {doctors.map((doctor) => (
                    <DoctorCard key={doctor.id} doctor={doctor} />
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

export default Doctors;
