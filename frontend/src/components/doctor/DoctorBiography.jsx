function DoctorBiography({ doctor }) {
    return (
        <div className="doctor-section">
            <h2>Giới thiệu</h2>
            <p>
                {doctor.name} là bác sĩ chuyên khoa {doctor.specialty} với nhiều năm kinh nghiệm
                khám và điều trị tại {doctor.clinic}. Bác sĩ tận tâm, chuyên môn cao và luôn
                đặt sức khỏe bệnh nhân lên hàng đầu.
            </p>
        </div>
    );
}

export default DoctorBiography;
