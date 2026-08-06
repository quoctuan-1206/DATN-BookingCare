import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Card from "../../common/Card/Card";
import SectionHeader from "../../common/SectionHeader/SectionHeader";
import clinicService from "../../../services/clinic.service";

function ClinicSection() {
  const [clinics, setClinics] = useState([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const result = await clinicService.getClinics({ page: 1, limit: 4 });
        if (!cancelled) setClinics(result.data.slice(0, 4));
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
      <div className="container">
        <SectionHeader title="Phòng khám nổi bật" viewMoreLink="/clinics" />

        <div className="card-grid">
          {clinics.map((clinic) => (
            <Link
              key={clinic.id}
              to={`/clinics/${clinic.id}`}
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <Card
                image={clinic.image}
                title={clinic.name}
                subtitle={clinic.address}
              />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export default ClinicSection;
