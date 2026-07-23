import Card from "../../common/Card/Card";
import SectionHeader from "../../common/SectionHeader/SectionHeader";
import { getSpecialties } from "../../../data";

function SpecialtySection() {
    const specialties = getSpecialties()
        .slice(0, 4)
        .map((s) => ({
            id: s.id,
            title: s.name,
            image: s.image,
        }));

    return (
        <section className="section gray">
            <div className="container">
                <SectionHeader
                    title="Chuyên khoa nổi bật"
                    viewMoreLink="/specialties"
                />

                <div className="card-grid">
                    {specialties.map((item) => (
                        <Card
                            key={item.id}
                            image={item.image}
                            title={item.title}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
}

export default SpecialtySection;
