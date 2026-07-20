import { Link } from "react-router-dom";

function ClinicDoctors({ doctors = [] }) {
    return (
        <section className="clinic-doctors">
            <h2>Bác sĩ đang công tác</h2>

            {doctors.map((doctor) => (
                <div key={doctor.id} className="doctor-row">
                    <div>
                        <strong>{doctor.name}</strong>
                        <p>{doctor.specialty}</p>
                    </div>

                    <Link
                        to={`/doctors/${doctor.id}`}
                        className="btn btn-primary"
                    >
                        Xem bác sĩ
                    </Link>
                </div>
            ))}
        </section>
    );
}

export default ClinicDoctors;
