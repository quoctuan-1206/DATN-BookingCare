import { Link } from "react-router-dom";

function SpecialtyClinics({ clinics = [] }) {
    return (
        <section className="specialty-clinics">
            <h2>Phòng khám áp dụng chuyên khoa này</h2>

            {clinics.map((clinic) => (
                <Link
                    key={clinic.id}
                    to={`/clinics/${clinic.id}`}
                    className="clinic-row"
                >
                    {clinic.name}
                </Link>
            ))}
        </section>
    );
}

export default SpecialtyClinics;
