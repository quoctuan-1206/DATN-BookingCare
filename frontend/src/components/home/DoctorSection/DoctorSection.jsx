import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Card from "../../common/Card/Card";
import SectionHeader from "../../common/SectionHeader/SectionHeader";
import doctorService from "../../../services/doctor.service";

function DoctorSection() {
  const [doctors, setDoctors] = useState([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const result = await doctorService.getDoctors({ page: 1, limit: 4 });
        if (!cancelled) setDoctors(result.data.slice(0, 4));
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
      <div className="container">
        <SectionHeader title="Bác sĩ nổi bật" viewMoreLink="/doctors" />

        <div className="card-grid">
          {doctors.map((doctor) => (
            <Link
              key={doctor.id}
              to={`/doctors/${doctor.id}`}
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <Card
                image={doctor.image}
                title={doctor.name}
                subtitle={doctor.specialty}
              />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export default DoctorSection;
