import { useId, useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Plus } from "lucide-react";
import { Link } from "react-router-dom";

function PatientSelector({
  patients,
  selectedPatientId,
  onSelectPatient,
  loading = false,
  title = "Hồ sơ bệnh nhân",
  description = "Chọn người sẽ đi khám trong lần đặt lịch này.",
}) {
  const [isChoosing, setIsChoosing] = useState(false);
  const patientListId = useId();
  const selectedPatient = useMemo(
    () => patients.find((patient) => patient.id === selectedPatientId),
    [patients, selectedPatientId],
  );

  const selectPatient = (patientId) => {
    onSelectPatient(patientId);
    setIsChoosing(false);
  };

  return (
    <div className="booking-card">
      <div className="booking-card-head booking-card-head--with-action">
        <span className="booking-step-num">1</span>
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
        <Link
          to="/patient/profiles"
          className="btn btn-outline add-patient-btn"
          aria-label="Quản lý hồ sơ"
          title="Quản lý hồ sơ"
        >
          <Plus size={16} />
        </Link>
      </div>

      {loading ? (
        <p>Đang tải hồ sơ...</p>
      ) : patients.length === 0 ? (
        <div className="patient-selector-empty">
          <p>Chưa có hồ sơ. Vui lòng thêm hồ sơ trước khi đặt lịch.</p>
          <Link to="/patient/profiles" className="btn btn-primary">
            Thêm hồ sơ
          </Link>
        </div>
      ) : (
        <div className="patient-selector">
          <div className="selected-patient">
            <div>
              <strong>
                {selectedPatient?.fullName ||
                  selectedPatient?.full_name ||
                  "Chưa chọn"}
              </strong>
            </div>
            <button
              type="button"
              className="btn btn-outline change-patient-btn"
              aria-expanded={isChoosing}
              aria-controls={patientListId}
              onClick={() => setIsChoosing((current) => !current)}
            >
              {isChoosing ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              {/* {isChoosing ? "Đóng" : "Đổi người khác"} */}
            </button>
          </div>

          {isChoosing && (
            <div className="patient-list" id={patientListId}>
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
                    onChange={() => selectPatient(patient.id)}
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
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default PatientSelector;
