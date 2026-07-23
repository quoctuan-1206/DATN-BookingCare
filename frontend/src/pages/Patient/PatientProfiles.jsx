import { Link } from "react-router-dom";
import PatientLayout from "../../components/patient/PatientLayout";
import {
    GENDER_LABEL,
    RELATIONSHIP_LABEL,
    db,
    formatDate,
} from "../../data/patientMock";

function PatientProfiles() {
    const profiles = db.patient_profiles;

    return (
        <PatientLayout>
            <div className="page-header">
                <div>
                    <h1>Hồ sơ bệnh nhân</h1>
                    <p>Quản lý thông tin người khám (patient_profiles).</p>
                </div>

                <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() =>
                        alert("Thêm hồ sơ (fake) — sẽ nối API sau.")
                    }
                >
                    + Thêm hồ sơ
                </button>
            </div>

            <div className="profile-grid">
                {profiles.map((profile) => (
                    <article key={profile.id} className="profile-card">
                        <div className="profile-avatar">
                            {profile.full_name.charAt(0)}
                        </div>

                        <h3>{profile.full_name}</h3>

                        <span className="relationship">
                            {RELATIONSHIP_LABEL[profile.relationship] ||
                                profile.relationship}
                        </span>

                        <div className="profile-info">
                            <p>
                                <strong>Giới tính:</strong>{" "}
                                {GENDER_LABEL[profile.gender]}
                            </p>
                            <p>
                                <strong>Ngày sinh:</strong>{" "}
                                {formatDate(profile.date_of_birth)}
                            </p>
                            <p>
                                <strong>Điện thoại:</strong> {profile.phone}
                            </p>
                            <p>
                                <strong>Nhóm máu:</strong>{" "}
                                {profile.blood_type || "—"}
                            </p>
                            <p>
                                <strong>Chiều cao:</strong>{" "}
                                {profile.height ? `${profile.height} cm` : "—"}
                            </p>
                            <p>
                                <strong>Cân nặng:</strong>{" "}
                                {profile.weight ? `${profile.weight} kg` : "—"}
                            </p>
                        </div>

                        <div className="profile-actions">
                            <button
                                type="button"
                                className="btn btn-outline"
                                onClick={() =>
                                    alert("Chỉnh sửa hồ sơ (fake).")
                                }
                            >
                                Chỉnh sửa
                            </button>

                            <Link to="/doctors" className="btn btn-primary">
                                Đặt lịch
                            </Link>
                        </div>
                    </article>
                ))}
            </div>
        </PatientLayout>
    );
}

export default PatientProfiles;
