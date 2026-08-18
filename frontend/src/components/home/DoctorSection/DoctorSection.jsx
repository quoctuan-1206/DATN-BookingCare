import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import SectionHeader from "../../common/SectionHeader/SectionHeader";
import HomeCardSlider from "../HomeCardSlider/HomeCardSlider";
import doctorService from "../../../services/doctor.service";

function DoctorSection() {
  const [doctors, setDoctors] = useState([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const result = await doctorService.getDoctors({ page: 1, limit: 12 });
        if (!cancelled) setDoctors(result.data || []);
      } catch {
        if (!cancelled) setDoctors([]);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="section">
      <div className="home-section">
        <SectionHeader title="Bác sĩ nổi bật" viewMoreLink="/doctors" />

        <HomeCardSlider>
          {doctors.map((doctor) => (
            <Link
              key={doctor.id}
              to={`/doctors/${doctor.id}`}
              className="card home-card"
            >
              <img src={doctor.image} alt={doctor.name} />
              <h3>{doctor.name}</h3>
              {doctor.specialty && <p>{doctor.specialty}</p>}
            </Link>
          ))}
        </HomeCardSlider>
      </div>
    </section>
  );
}

export default DoctorSection;
