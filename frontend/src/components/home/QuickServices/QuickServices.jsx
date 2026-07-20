import { HeartPulse, Hospital, CalendarCheck, Stethoscope } from "lucide-react";

const services = [
  {
    id: 1,
    icon: <HeartPulse size={40} />,
    title: "Chuyên khoa",
  },
  {
    id: 2,
    icon: <Stethoscope size={40} />,
    title: "Bác sĩ",
  },
  {
    id: 3,
    icon: <Hospital size={40} />,
    title: "Phòng khám",
  },
  {
    id: 4,
    icon: <CalendarCheck size={40} />,
    title: "Đặt lịch",
  },
];

function QuickServices() {
  return (
    <section className="section">
      <div className="container">
        <div className="card-grid">
          {services.map((item) => (
            <div
              key={item.id}
              className="card"
              style={{
                textAlign: "center",
                padding: "30px",
              }}
            >
              {item.icon}

              <h3
                style={{
                  marginTop: "20px",
                }}
              >
                {item.title}
              </h3>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default QuickServices;
