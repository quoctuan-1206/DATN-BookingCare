import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import toast from "react-hot-toast";

import Header from "../../components/common/Header/Header";
import Footer from "../../components/common/Footer/Footer";

import SpecialtyProfile from "../../components/specialty/SpecialtyProfile";
import SpecialtyDoctors from "../../components/specialty/SpecialtyDoctors";
import SpecialtyClinics from "../../components/specialty/SpecialtyClinics";
import specialtyService from "../../services/specialty.service";
import doctorService from "../../services/doctor.service";
import { getApiErrorMessage } from "../../api/axios";

function SpecialtyDetail() {
  const { id } = useParams();
  const [specialty, setSpecialty] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const [specialtyData, doctorsResult] = await Promise.all([
          specialtyService.getSpecialtyById(id),
          doctorService.getDoctors({ specialty_id: Number(id), limit: 50 }),
        ]);

        if (!cancelled) {
          setSpecialty(specialtyData);
          setDoctors(
            doctorsResult.data.map((d) => ({
              id: d.id,
              name: d.name,
              hospital: d.clinic,
            })),
          );
        }
      } catch (error) {
        if (!cancelled) {
          setSpecialty(null);
          setDoctors([]);
          toast.error(
            getApiErrorMessage(error, "Không tải được chuyên khoa"),
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
  }, [id]);

  if (loading) {
    return (
      <>
        <Header />
        <section className="section">
          <div className="container">
            <p>Đang tải thông tin chuyên khoa...</p>
          </div>
        </section>
        <Footer />
      </>
    );
  }

  if (!specialty) {
    return (
      <>
        <Header />
        <section className="section">
          <div className="container">
            <h1>Không tìm thấy chuyên khoa</h1>
            <Link to="/specialties" className="btn btn-primary">
              Quay lại danh sách
            </Link>
          </div>
        </section>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <section className="section">
        <div className="container">
          <SpecialtyProfile specialty={specialty} />
          <SpecialtyDoctors doctors={doctors} />
          <SpecialtyClinics clinics={specialty.clinics || []} />
        </div>
      </section>
      <Footer />
    </>
  );
}

export default SpecialtyDetail;
