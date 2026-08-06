import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Card from "../../common/Card/Card";
import SectionHeader from "../../common/SectionHeader/SectionHeader";
import specialtyService from "../../../services/specialty.service";

function SpecialtySection() {
  const [specialties, setSpecialties] = useState([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const result = await specialtyService.getSpecialties({
          page: 1,
          limit: 4,
        });
        if (!cancelled) setSpecialties(result.data.slice(0, 4));
      } catch {
        if (!cancelled) setSpecialties([]);
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
        <SectionHeader
          title="Chuyên khoa nổi bật"
          viewMoreLink="/specialties"
        />

        <div className="card-grid">
          {specialties.map((item) => (
            <Link
              key={item.id}
              to={`/specialties/${item.id}`}
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <Card image={item.image} title={item.name} />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export default SpecialtySection;
