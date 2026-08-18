import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import SectionHeader from "../../common/SectionHeader/SectionHeader";
import HomeCardSlider from "../HomeCardSlider/HomeCardSlider";
import clinicService from "../../../services/clinic.service";

function ClinicSection() {
  const [clinics, setClinics] = useState([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const result = await clinicService.getClinics({ page: 1, limit: 12 });
        if (!cancelled) setClinics(result.data || []);
      } catch {
        if (!cancelled) setClinics([]);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="section gray">
      <div className="home-section">
        <SectionHeader title="Phòng khám nổi bật" viewMoreLink="/clinics" />

        <HomeCardSlider>
          {clinics.map((clinic) => (
            <Link
              key={clinic.id}
              to={`/clinics/${clinic.id}`}
              className="card home-card"
            >
              <img src={clinic.image} alt={clinic.name} />
              <h3>{clinic.name}</h3>
              {clinic.address && <p>{clinic.address}</p>}
            </Link>
          ))}
        </HomeCardSlider>
      </div>
    </section>
  );
}

export default ClinicSection;
