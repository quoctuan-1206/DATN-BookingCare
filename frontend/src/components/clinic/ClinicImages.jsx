function ClinicImages({ images = [] }) {
    return (
        <section className="clinic-images">
            <h2>Hình ảnh phòng khám</h2>

            <div className="gallery">
                {images.map((src, index) => (
                    <img
                        key={src}
                        src={src}
                        alt={`Hình ảnh phòng khám ${index + 1}`}
                    />
                ))}
            </div>
        </section>
    );
}

export default ClinicImages;
