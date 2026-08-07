import { Link } from "react-router-dom";

function PatientSelector({ patients, selectedPatientId, onSelectPatient }) {
  return (
    <div className="booking-card">
      <div className="booking-card-head">
        <span className="booking-step">Bước 1</span>
        <h2>Hồ sơ bệnh nhân</h2>
        <p>Chọn người sẽ đi khám trong lần đặt lịch này.</p>
      </div>

      <div className="patient-list">
        {patients.length === 0 ? (
          <p>Chưa có hồ sơ. Vui lòng thêm hồ sơ trước khi đặt lịch.</p>
        ) : (
          patients.map((patient) => (
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
                  <h3>{patient.fullName || patient.full_name}</h3>
                  <span className="patient-badge">
                    {patient.relationship_label || patient.relationship}
                  </span>
                </div>

                <div className="patient-meta">
                  <span>
                    {patient.gender_label || patient.gender || "—"}
                  </span>
                  <span>
                    {patient.dateOfBirth || patient.date_of_birth || "—"}
                  </span>
                  <span>{patient.phone || "—"}</span>
                </div>
              </div>
            </label>
          ))
        )}
      </div>

      <Link to="/patient/profiles" className="btn btn-outline add-patient-btn">
        + Quản lý / thêm hồ sơ bệnh nhân
      </Link>
    </div>
  );
}

export default PatientSelector;
