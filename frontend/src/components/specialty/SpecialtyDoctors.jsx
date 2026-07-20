import { Link } from "react-router-dom";

function SpecialtyDoctors({ doctors = [] }) {
    return (
        <section className="specialty-doctors">
            <h2>Bác sĩ thuộc chuyên khoa</h2>

            {doctors.map((doctor) => (
                <div key={doctor.id} className="specialty-doctor-card">
                    <div>
                        <h3>{doctor.name}</h3>
                        <p>{doctor.hospital}</p>
                    </div>

                    <Link
                        to={`/doctors/${doctor.id}`}
                        className="btn btn-primary"
                    >
                        Xem hồ sơ
                    </Link>
                </div>
            ))}
        </section>
    );
}

export default SpecialtyDoctors;
