function DoctorBiography({ doctor }) {
    return (
        <div className="doctor-section">
            <h2>Giới thiệu</h2>
            <p>
                {doctor.biography ||
                    `${doctor.name} là bác sĩ chuyên khoa ${doctor.specialty} với ${doctor.experience_years || "nhiều"} năm kinh nghiệm khám và điều trị tại ${doctor.clinic}.`}
            </p>
        </div>
    );
}

export default DoctorBiography;
