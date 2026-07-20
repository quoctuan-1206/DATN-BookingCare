import Card from "../../common/Card/Card";
import SectionHeader from "../../common/SectionHeader/SectionHeader";

const clinics = [
  {
    id: 1,
    image: "https://picsum.photos/300/200?9",
    title: "Bệnh viện Chợ Rẫy",
    subtitle: "TP. Hồ Chí Minh",
  },
  {
    id: 2,
    image: "https://picsum.photos/300/200?10",
    title: "Bệnh viện Bạch Mai",
    subtitle: "Hà Nội",
  },
  {
    id: 3,
    image: "https://picsum.photos/300/200?11",
    title: "Vinmec",
    subtitle: "Đà Nẵng",
  },
  {
    id: 4,
    image: "https://picsum.photos/300/200?12",
    title: "FV Hospital",
    subtitle: "TP. Hồ Chí Minh",
  },
];

function ClinicSection() {
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
