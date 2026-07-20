function ClinicProfile({ clinic }) {
    return (
        <section className="clinic-profile">
            <img src={clinic.image} alt={clinic.name} />

            <h1>{clinic.name}</h1>

            <p>📍 {clinic.address}</p>

            <p>☎ {clinic.phone}</p>

            <p>{clinic.description}</p>
        </section>
    );
}

export default ClinicProfile;
