import Card from "../../common/Card/Card";
import SectionHeader from "../../common/SectionHeader/SectionHeader";
import { getDoctors } from "../../../data";

function DoctorSection() {
    const doctors = getDoctors()
        .slice(0, 4)
        .map((d) => ({
            id: d.id,
            image: d.image,
            title: d.name,
            subtitle: d.specialty,
        }));

    return (
        <section className="section">
            <div className="container">
                <SectionHeader title="Bác sĩ nổi bật" viewMoreLink="/doctors" />

                <div className="card-grid">
                    {doctors.map((doctor) => (
                        <Card
                            key={doctor.id}
                            image={doctor.image}
                            title={doctor.title}
                            subtitle={doctor.subtitle}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
}

export default DoctorSection;
