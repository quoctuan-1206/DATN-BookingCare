import { Link } from "react-router-dom";
import { HeartPulse, Hospital, Stethoscope } from "lucide-react";

const services = [
  {
    id: 1,
    icon: <HeartPulse size={40} />,
    title: "Chuyên khoa",
    to: "/specialties",
  },
  {
    id: 2,
    icon: <Stethoscope size={40} />,
    title: "Bác sĩ",
    to: "/doctors",
  },
  {
    id: 3,
    icon: <Hospital size={40} />,
    title: "Phòng khám",
    to: "/clinics",
  },
];

function QuickServices() {
  return (
    <section className="section">
      <div className="quick-services-section">
        <div className="quick-services-grid">
          {services.map((item) => (
            <Link key={item.id} to={item.to} className="card quick-service-card">
              {item.icon}
              <h3>{item.title}</h3>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export default QuickServices;
