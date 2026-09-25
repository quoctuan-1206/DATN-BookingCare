import { Link } from "react-router-dom";
import {
  Activity,
  ArrowRight,
  FlaskConical,
  HeartPulse,
  ScanLine,
  Waves,
} from "lucide-react";
import SectionHeader from "../../common/SectionHeader/SectionHeader";

const clinicalCategories = [
  {
    id: "LAB",
    name: "Xét nghiệm",
    description: "Kiểm tra các chỉ số sức khỏe",
    icon: FlaskConical,
    tone: "blue",
  },
  {
    id: "XRAY",
    name: "X-quang",
    description: "Chẩn đoán hình ảnh chính xác",
    icon: ScanLine,
    tone: "violet",
  },
  {
    id: "ULTRASOUND",
    name: "Siêu âm",
    description: "Khảo sát cơ quan không xâm lấn",
    icon: Waves,
    tone: "teal",
  },
  {
    id: "ENDOSCOPY",
    name: "Nội soi",
    description: "Quan sát và phát hiện tổn thương",
    icon: Activity,
    tone: "orange",
  },
  {
    id: "ECG",
    name: "Điện tim",
    description: "Theo dõi hoạt động của tim",
    icon: HeartPulse,
    tone: "rose",
  },
];

function ClinicalSection() {
  return (
    <section className="section home-modern-section home-clinical-section">
      <div className="home-content-container">
        <SectionHeader
          title="Cận lâm sàng"
          viewMoreLink="/clinical-services"
          viewMoreLabel="Xem tất cả"
        />

        <div className="home-clinical-grid">
          {clinicalCategories.map(({ id, name, description, icon: Icon, tone }) => (
            <Link
              key={id}
              to={`/clinical-services?service_type=${id}`}
              className="home-clinical-card"
              aria-label={`Xem dịch vụ ${name}`}
            >
              <span className={`home-clinical-icon home-clinical-icon--${tone}`}>
                <Icon size={23} strokeWidth={1.9} />
              </span>
              <span className="home-clinical-copy">
                <strong>{name}</strong>
                <small>{description}</small>
              </span>
              <ArrowRight className="home-clinical-arrow" size={18} />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export default ClinicalSection;
