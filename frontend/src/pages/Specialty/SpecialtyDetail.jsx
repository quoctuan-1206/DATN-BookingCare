import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";

import Header from "../../components/common/Header/Header";
import Footer from "../../components/common/Footer/Footer";

import SpecialtyProfile from "../../components/specialty/SpecialtyProfile";
import SpecialtyDoctors from "../../components/specialty/SpecialtyDoctors";
import SpecialtyClinics from "../../components/specialty/SpecialtyClinics";
import { getSpecialtyDetail } from "../../data";
import doctorService from "../../services/doctor.service";

function SpecialtyDetail() {
  const { id } = useParams();
  const specialty = getSpecialtyDetail(id);
  const [doctors, setDoctors] = useState([]);

  useEffect(() => {
    let cancelled = false;

    async function loadDoctors() {
      try {
        const result = await doctorService.getDoctors({
          specialty_id: Number(id),
          limit: 50,
        });
        if (!cancelled) {
          setDoctors(
            result.data.map((d) => ({
              id: d.id,
              name: d.name,
              hospital: d.clinic,
            })),
          );
        }
      } catch {
        if (!cancelled) setDoctors(specialty?.doctors || []);
      }
    }

    if (id) loadDoctors();
    return () => {
      cancelled = true;
    };
  }, [id, specialty?.doctors]);

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
          <SpecialtyClinics clinics={specialty.clinics} />
        </div>
      </section>
      <Footer />
    </>
  );
}

export default SpecialtyDetail;
