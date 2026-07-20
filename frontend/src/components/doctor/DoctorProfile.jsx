function DoctorProfile({ doctor }) {
    return (
        <div className="doctor-profile">
            <img
                src={doctor.image}
                alt={doctor.name}
                className="doctor-profile__image"
            />

            <div className="doctor-profile__info">
                <h1>{doctor.name}</h1>
                <p className="doctor-specialty">{doctor.specialty}</p>
                <p className="doctor-clinic">{doctor.clinic}</p>
                <span className="doctor-rating">⭐⭐⭐⭐⭐</span>
            </div>
        </div>
    );
}

export default DoctorProfile;
