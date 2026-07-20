function SpecialtyProfile({ specialty }) {
    return (
        <section className="specialty-profile">
            <img src={specialty.image} alt={specialty.name} />

            <h1>Chuyên khoa {specialty.name}</h1>

            <p className="specialty-description">
                {specialty.description}
            </p>
        </section>
    );
}

export default SpecialtyProfile;
