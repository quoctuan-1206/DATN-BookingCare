import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";

import Header from "../../components/common/Header/Header";
import Footer from "../../components/common/Footer/Footer";

import ClinicProfile from "../../components/clinic/ClinicProfile";
import ClinicDoctors from "../../components/clinic/ClinicDoctors";
import ClinicImages from "../../components/clinic/ClinicImages";
import ClinicMap from "../../components/clinic/ClinicMap";
import { getClinicDetail } from "../../data";
import doctorService from "../../services/doctor.service";

function ClinicDetail() {
  const { id } = useParams();
  const clinic = getClinicDetail(id);
  const [doctors, setDoctors] = useState([]);

  useEffect(() => {
    let cancelled = false;

    async function loadDoctors() {
      try {
        const result = await doctorService.getDoctors({
          clinic_id: Number(id),
          limit: 50,
        });
        if (!cancelled) setDoctors(result.data);
      } catch {
        if (!cancelled) setDoctors(clinic?.doctors || []);
      }
    }

    if (id) loadDoctors();
    return () => {
      cancelled = true;
    };
  }, [id, clinic?.doctors]);

  if (!clinic) {
    return (
      <>
        <Header />
        <section className="section">
          <div className="container">
            <h1>Không tìm thấy phòng khám</h1>
            <Link to="/clinics" className="btn btn-primary">
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
          <ClinicProfile clinic={clinic} />
          <ClinicDoctors doctors={doctors} />
          <ClinicImages images={clinic.images} />
          <ClinicMap clinic={clinic} />
        </div>
      </section>
      <Footer />
    </>
  );
}

export default ClinicDetail;
