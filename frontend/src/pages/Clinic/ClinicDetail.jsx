import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import toast from "react-hot-toast";

import Header from "../../components/common/Header/Header";
import Footer from "../../components/common/Footer/Footer";

import ClinicProfile from "../../components/clinic/ClinicProfile";
import ClinicDoctors from "../../components/clinic/ClinicDoctors";
import ClinicImages from "../../components/clinic/ClinicImages";
import ClinicMap from "../../components/clinic/ClinicMap";
import clinicService from "../../services/clinic.service";
import doctorService from "../../services/doctor.service";
import { getApiErrorMessage } from "../../api/axios";

function ClinicDetail() {
  const { id } = useParams();
  const [clinic, setClinic] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const [clinicData, doctorsResult] = await Promise.all([
          clinicService.getClinicById(id),
          doctorService.getDoctors({ clinic_id: Number(id), limit: 50 }),
        ]);

        if (!cancelled) {
          setClinic(clinicData);
          setDoctors(doctorsResult.data);
        }
      } catch (error) {
        if (!cancelled) {
          setClinic(null);
          setDoctors([]);
          toast.error(
            getApiErrorMessage(error, "Không tải được phòng khám"),
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
            <p>Đang tải thông tin phòng khám...</p>
          </div>
        </section>
        <Footer />
      </>
    );
  }

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
