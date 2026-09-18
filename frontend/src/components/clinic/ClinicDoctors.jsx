import DoctorCard from "../doctor/DoctorCard";

function ClinicDoctors({ doctors = [] }) {
  return (
    <section className="clinic-section clinic-doctors">
      <div className="clinic-section__heading">
        <div><span>Đội ngũ chuyên môn</span><h2>Bác sĩ đang công tác</h2></div>
        <strong>{doctors.length} bác sĩ</strong>
      </div>
      {doctors.length === 0 ? (
        <p className="clinic-section__empty">Chưa có thông tin bác sĩ tại cơ sở này.</p>
      ) : (
        <div className="clinic-doctors__grid">
          {doctors.map((doctor) => <DoctorCard key={doctor.id} doctor={doctor} />)}
        </div>
      )}
    </section>
  );
}

export default ClinicDoctors;
