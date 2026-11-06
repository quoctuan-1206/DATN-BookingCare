function DoctorBiography({ doctor, activeTab }) {
  let title;
  let content;

  if (activeTab === "specialty") {
    title = "Chuyên môn";
    const specialties = [...new Set([doctor.specialty, doctor.position].filter(Boolean))];
    content = specialties.length ? (
      <ul className="doctor-info-list">
        {specialties.map((item) => <li key={item}>{item}</li>)}
      </ul>
    ) : (
      <p>Thông tin chuyên môn đang được cập nhật.</p>
    );
  } else if (activeTab === "experience") {
    title = "Kinh nghiệm";
    content = doctor.experience_years ? (
      <p>{doctor.experience_years} năm kinh nghiệm.</p>
    ) : (
      <p>Thông tin kinh nghiệm đang được cập nhật.</p>
    );
  } else if (activeTab === "education") {
    title = "Học vấn";
    content = doctor.degree ? (
      <p>{doctor.degree}</p>
    ) : (
      <p>Thông tin học vấn đang được cập nhật.</p>
    );
  } else {
    title = "Giới thiệu";
    content = (
      <p>{doctor.biography || "Thông tin giới thiệu đang được cập nhật."}</p>
    );
  }

  return (
    <section className="doctor-biography doctor-info-section" aria-live="polite">
      <h2>{title}</h2>
      {content}
    </section>
  );
}

export default DoctorBiography;
