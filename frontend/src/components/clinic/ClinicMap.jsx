function ClinicMap({ clinic }) {
    return (
        <section className="clinic-map">
            <h2>Bản đồ</h2>

            <iframe
                title={`Bản đồ ${clinic.name}`}
                src={`https://www.google.com/maps?q=${clinic.mapQuery}&output=embed`}
                loading="lazy"
            />
        </section>
    );
}

export default ClinicMap;
