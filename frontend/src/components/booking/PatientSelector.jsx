function PatientSelector({
    patients,
    selectedPatientId,
    onSelectPatient,
}) {
    return (
        <div className="booking-card">
            <div className="booking-card-head">
                <span className="booking-step">Bước 1</span>
                <h2>Hồ sơ bệnh nhân</h2>
                <p>Chọn người sẽ đi khám trong lần đặt lịch này.</p>
            </div>

            <div className="patient-list">
                {patients.map((patient) => (
                    <label
                        key={patient.id}
                        className={`patient-card ${
                            selectedPatientId === patient.id ? "active" : ""
                        }`}
                    >
                        <input
                            type="radio"
                            name="patient"
                            value={patient.id}
                            checked={selectedPatientId === patient.id}
                            onChange={() => onSelectPatient(patient.id)}
                        />

                        <div className="patient-info">
                            <div className="patient-info-top">
                                <h3>{patient.fullName}</h3>
                                <span className="patient-badge">
                                    {patient.relationship}
                                </span>
                            </div>

                            <div className="patient-meta">
                                <span>{patient.gender}</span>
                                <span>{patient.dateOfBirth}</span>
                                <span>{patient.phone}</span>
                            </div>
                        </div>
                    </label>
                ))}
            </div>

            <button
                type="button"
                className="btn btn-outline add-patient-btn"
                onClick={() =>
                    alert("Chức năng thêm hồ sơ sẽ được bổ sung sau.")
                }
            >
                + Thêm hồ sơ bệnh nhân
            </button>
        </div>
    );
}

export default PatientSelector;
