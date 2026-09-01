import { Pencil, Trash2 } from "lucide-react";
import {
  GENDER_LABEL,
  RELATIONSHIP_LABEL,
} from "../../services/patient-profile.service";

function formatDateDisplay(value) {
  if (!value) return "—";
  const [y, m, d] = String(value).split("-");
  if (!y || !m || !d) return value;
  return `${d}/${m}/${y}`;
}

function ProfileField({ label, value }) {
  return (
    <div className="profile-field-row">
      <span className="profile-field-label">{label}</span>
      <span className="profile-field-value">{value || "—"}</span>
    </div>
  );
}

function PatientProfileCard({ profile, onEdit, onDelete, deleting }) {
  const isSelf =
    profile.relationship === "Self" ||
    profile.relationship_label === "Bản thân";

  return (
    <article className="patient-profile-card">
      <div className="patient-profile-card-head">
        <h3>{profile.full_name}</h3>
        <div className="patient-profile-card-head-actions">
          {isSelf ? (
            <span className="patient-profile-badge">Bản thân</span>
          ) : (
            <span className="patient-profile-badge patient-profile-badge--muted">
              {profile.relationship_label ||
                RELATIONSHIP_LABEL[profile.relationship] ||
                profile.relationship}
            </span>
          )}
          <div className="patient-profile-icon-actions">
            <button
              type="button"
              className="patient-profile-icon-btn"
              title="Chỉnh sửa"
              aria-label="Chỉnh sửa"
              onClick={() => onEdit(profile)}
            >
              <Pencil size={16} />
            </button>
            <button
              type="button"
              className="patient-profile-icon-btn patient-profile-icon-btn--danger"
              title="Xóa"
              aria-label="Xóa"
              disabled={deleting}
              onClick={() => onDelete(profile)}
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="patient-profile-card-body">
        <ProfileField
          label="Giới tính"
          value={profile.gender_label || GENDER_LABEL[profile.gender]}
        />
        <ProfileField
          label="Ngày sinh"
          value={formatDateDisplay(profile.date_of_birth)}
        />
        <ProfileField label="Số điện thoại" value={profile.phone} />
        <ProfileField label="Nhóm máu" value={profile.blood_type} />
        <ProfileField
          label="Chiều cao"
          value={profile.height ? `${profile.height} cm` : ""}
        />
        <ProfileField
          label="Cân nặng"
          value={profile.weight ? `${profile.weight} kg` : ""}
        />
        <ProfileField label="BHYT" value={profile.insurance_number} />
        <ProfileField
          label="Liên hệ khẩn cấp"
          value={profile.emergency_contact}
        />
      </div>
    </article>
  );
}

export default PatientProfileCard;
