import Card from "../../common/Card/Card";
import SectionHeader from "../../common/SectionHeader/SectionHeader";
import { getClinics } from "../../../data";

function ClinicSection() {
    const clinics = getClinics()
        .slice(0, 4)
        .map((c) => ({
            id: c.id,
            image: c.image,
            title: c.name,
            subtitle: c.address,
        }));

    return (
        <section className="section gray">
            <div className="container">
                <SectionHeader
                    title="Phòng khám nổi bật"
                    viewMoreLink="/clinics"
                />

                <div className="card-grid">
                    {clinics.map((clinic) => (
                        <Card
                            key={clinic.id}
                            image={clinic.image}
                            title={clinic.title}
                            subtitle={clinic.subtitle}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
}

export default ClinicSection;
