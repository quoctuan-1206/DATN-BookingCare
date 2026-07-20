import Card from "../../common/Card/Card";
import SectionHeader from "../../common/SectionHeader/SectionHeader";

const handbooks = [
  {
    id: 1,
    image: "https://picsum.photos/300/200?13",
    title: "10 dấu hiệu bệnh tim cần lưu ý",
  },
  {
    id: 2,
    image: "https://picsum.photos/300/200?14",
    title: "Khám sức khỏe định kỳ có cần thiết?",
  },
  {
    id: 3,
    image: "https://picsum.photos/300/200?15",
    title: "Những lưu ý trước khi xét nghiệm máu",
  },
  {
    id: 4,
    image: "https://picsum.photos/300/200?16",
    title: "Chế độ ăn uống giúp tăng sức đề kháng",
  },
];

function HandbookSection() {
  return (
    <section className="section">
      <div className="container">
        <SectionHeader title="Cẩm nang sức khỏe" />

        <div className="card-grid">
          {handbooks.map((item) => (
            <Card key={item.id} image={item.image} title={item.title} />
          ))}
        </div>
      </div>
    </section>
  );
}

export default HandbookSection;
