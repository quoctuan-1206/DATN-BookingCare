import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import SectionHeader from "../../common/SectionHeader/SectionHeader";
import HomeCardSlider from "../HomeCardSlider/HomeCardSlider";
import specialtyService from "../../../services/specialty.service";

function SpecialtySection() {
  const [specialties, setSpecialties] = useState([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const result = await specialtyService.getSpecialties({
          page: 1,
          limit: 12,
        });
        if (!cancelled) setSpecialties(result.data || []);
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
      <div className="home-section">
        <SectionHeader
          title="Chuyên khoa nổi bật"
          viewMoreLink="/specialties"
        />

        <HomeCardSlider>
          {specialties.map((item) => (
            <Link
              key={item.id}
              to={`/specialties/${item.id}`}
              className="card home-card"
            >
              <img src={item.image} alt={item.name} />
              <h3>{item.name}</h3>
            </Link>
          ))}
        </HomeCardSlider>
      </div>
    </section>
  );
}

export default SpecialtySection;
