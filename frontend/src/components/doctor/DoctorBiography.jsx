import { useState } from "react";

const TABS = [
  { id: "intro", label: "Giới thiệu" },
  { id: "skill", label: "Chuyên môn" },
  { id: "exp", label: "Kinh nghiệm" },
  { id: "edu", label: "Học vấn" },
];

function DoctorBiography({ doctor }) {
  const [tab, setTab] = useState("intro");

  const intro =
    doctor.biography ||
    `${doctor.name} là bác sĩ chuyên khoa ${doctor.specialty || "đa khoa"} với ${
      doctor.experience_years || "nhiều"
    } năm kinh nghiệm khám và điều trị tại ${doctor.clinic || "phòng khám"}.`;

  const skills = [doctor.specialty, doctor.position].filter(Boolean);

  return (
    <section className="doctor-intro">
      <aside className="doctor-intro-tabs">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={tab === item.id ? "active" : ""}
            onClick={() => setTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </aside>

      <div className="doctor-intro-content">
        {tab === "intro" ? (
          <>
            <h2>Giới thiệu</h2>
            <p>{intro}</p>
          </>
        ) : null}

        {tab === "skill" ? (
          <>
            <h2>Chuyên môn</h2>
            {skills.length > 0 ? (
              <ul>
                {skills.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : (
              <p>Đang cập nhật.</p>
            )}
          </>
        ) : null}

        {tab === "exp" ? (
          <>
            <h2>Kinh nghiệm</h2>
            <p>
              {doctor.experience_years
                ? `${doctor.experience_years}+ năm kinh nghiệm tại ${doctor.clinic || "cơ sở y tế"}.`
                : "Đang cập nhật."}
            </p>
          </>
        ) : null}

        {tab === "edu" ? (
          <>
            <h2>Học vấn</h2>
            <p>{doctor.degree || "Đang cập nhật."}</p>
          </>
        ) : null}
      </div>
    </section>
  );
}

export default DoctorBiography;
