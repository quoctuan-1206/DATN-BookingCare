import Card from "../../common/Card/Card";
import SectionHeader from "../../common/SectionHeader/SectionHeader";

const specialties = [
  {
    id: 1,
    title: "Tim mạch",
    image: "https://picsum.photos/300/200?1",
  },
  {
    id: 2,
    title: "Nhi khoa",
    image: "https://picsum.photos/300/200?2",
  },
  {
    id: 3,
    title: "Da liễu",
    image: "https://picsum.photos/300/200?3",
  },
  {
    id: 4,
    title: "Răng hàm mặt",
    image: "https://picsum.photos/300/200?4",
  },
];

function SpecialtySection() {
  return (
    <section className="section gray">
      <div className="container">
        <SectionHeader
          title="Chuyên khoa nổi bật"
          viewMoreLink="/specialties"
        />

        <div className="card-grid">
          {specialties.map((item) => (
            <Card key={item.id} image={item.image} title={item.title} />
          ))}
        </div>
      </div>
    </section>
  );
}

export default SpecialtySection;
