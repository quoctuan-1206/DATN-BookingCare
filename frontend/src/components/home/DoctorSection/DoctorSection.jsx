import Card from "../../common/Card/Card";
import SectionHeader from "../../common/SectionHeader/SectionHeader";

const doctors = [
  {
    id: 1,
    image: "https://picsum.photos/300/200?5",
    title: "TS. Nguyễn Văn A",
    subtitle: "Tim mạch",
  },
  {
    id: 2,
    image: "https://picsum.photos/300/200?6",
    title: "BS. Trần Văn B",
    subtitle: "Da liễu",
  },
  {
    id: 3,
    image: "https://picsum.photos/300/200?7",
    title: "BS. Lê Văn C",
    subtitle: "Nhi khoa",
  },
  {
    id: 4,
    image: "https://picsum.photos/300/200?8",
    title: "BS. Phạm Văn D",
    subtitle: "Tai mũi họng",
  },
];

function DoctorSection() {
  return (
    <section className="section">
      <div className="container">
        <SectionHeader
          title="Bác sĩ nổi bật"
          viewMoreLink="/doctors"
        />

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
