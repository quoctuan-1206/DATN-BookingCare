import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import PatientLayout from "../../components/patient/PatientLayout";
import patientProfileService, {
  GENDER_LABEL,
  RELATIONSHIP_LABEL,
} from "../../services/patient-profile.service";
import { getApiErrorMessage } from "../../api/axios";

const emptyForm = {
  full_name: "",
  phone: "",
  gender: "Male",
  date_of_birth: "",
  relationship: "Self",
  blood_type: "",
  height: "",
  weight: "",
  insurance_number: "",
  emergency_contact: "",
};

function formatDateDisplay(value) {
  if (!value) return "—";
  const [y, m, d] = String(value).split("-");
  if (!y || !m || !d) return value;
  return `${d}/${m}/${y}`;
}

function PatientProfiles() {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(emptyForm);

  const loadProfiles = async () => {
    setLoading(true);
    try {
      const list = await patientProfileService.getMyProfiles();
      setProfiles(list);
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, "Không tải được hồ sơ bệnh nhân"),
      );
      setProfiles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfiles();
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setFormData(emptyForm);
    setShowForm(true);
  };

  const openEdit = (profile) => {
    setEditingId(profile.id);
    setFormData({
      full_name: profile.full_name || "",
      phone: profile.phone || "",
      gender: profile.gender || "Male",
      date_of_birth: profile.date_of_birth || "",
      relationship: profile.relationship || "Self",
      blood_type: profile.blood_type || "",
      height: profile.height != null ? String(profile.height) : "",
      weight: profile.weight != null ? String(profile.weight) : "",
      insurance_number: profile.insurance_number || "",
      emergency_contact: profile.emergency_contact || "",
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData(emptyForm);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const buildPayload = () => {
    const payload = {
      full_name: formData.full_name.trim(),
      phone: formData.phone.trim() || null,
      gender: formData.gender,
      date_of_birth: formData.date_of_birth,
      relationship: formData.relationship || "Self",
      blood_type: formData.blood_type.trim() || null,
      insurance_number: formData.insurance_number.trim() || null,
      emergency_contact: formData.emergency_contact.trim() || null,
    };

    if (formData.height !== "") payload.height = Number(formData.height);
    else payload.height = null;

    if (formData.weight !== "") payload.weight = Number(formData.weight);
    else payload.weight = null;

    return payload;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.full_name.trim()) {
      toast.error("Vui lòng nhập họ tên");
      return;
    }
    if (!formData.date_of_birth) {
      toast.error("Vui lòng chọn ngày sinh");
      return;
    }

    setSaving(true);
    try {
      const payload = buildPayload();

      if (editingId) {
        await patientProfileService.updateProfile(editingId, payload);
        toast.success("Đã cập nhật hồ sơ");
      } else {
        await patientProfileService.createProfile(payload);
        toast.success("Đã thêm hồ sơ");
      }

      closeForm();
      await loadProfiles();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không lưu được hồ sơ"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <PatientLayout>
      <div className="page-header">
        <div>
          <h1>Hồ sơ bệnh nhân</h1>
          <p>Quản lý thông tin người khám trong tài khoản của bạn.</p>
        </div>

        <button type="button" className="btn btn-primary" onClick={openCreate}>
          + Thêm hồ sơ
        </button>
      </div>

      {showForm && (
        <div className="detail-card" style={{ marginBottom: 24 }}>
          <h2 style={{ marginBottom: 16 }}>
            {editingId ? "Chỉnh sửa hồ sơ" : "Thêm hồ sơ bệnh nhân"}
          </h2>

          <form className="admin-form" onSubmit={handleSubmit}>
            <div
              style={{
                display: "grid",
                gap: 12,
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              }}
            >
              <div className="admin-form-group">
                <label htmlFor="full_name">Họ và tên</label>
                <input
                  id="full_name"
                  name="full_name"
                  className="admin-input"
                  value={formData.full_name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="admin-form-group">
                <label htmlFor="relationship">Quan hệ</label>
                <select
                  id="relationship"
                  name="relationship"
                  className="admin-select"
                  value={formData.relationship}
                  onChange={handleChange}
                >
                  {Object.entries(RELATIONSHIP_LABEL).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="admin-form-group">
                <label htmlFor="gender">Giới tính</label>
                <select
                  id="gender"
                  name="gender"
                  className="admin-select"
                  value={formData.gender}
                  onChange={handleChange}
                  required
                >
                  {Object.entries(GENDER_LABEL).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="admin-form-group">
                <label htmlFor="date_of_birth">Ngày sinh</label>
                <input
                  id="date_of_birth"
                  name="date_of_birth"
                  className="admin-input"
                  type="date"
                  value={formData.date_of_birth}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="admin-form-group">
                <label htmlFor="phone">Số điện thoại</label>
                <input
                  id="phone"
                  name="phone"
                  className="admin-input"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>

              <div className="admin-form-group">
                <label htmlFor="blood_type">Nhóm máu</label>
                <select
                  id="blood_type"
                  name="blood_type"
                  className="admin-select"
                  value={formData.blood_type}
                  onChange={handleChange}
                >
                  <option value="">—</option>
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="AB">AB</option>
                  <option value="O">O</option>
                </select>
              </div>

              <div className="admin-form-group">
                <label htmlFor="height">Chiều cao (cm)</label>
                <input
                  id="height"
                  name="height"
                  className="admin-input"
                  type="number"
                  min="1"
                  step="0.1"
                  value={formData.height}
                  onChange={handleChange}
                />
              </div>

              <div className="admin-form-group">
                <label htmlFor="weight">Cân nặng (kg)</label>
                <input
                  id="weight"
                  name="weight"
                  className="admin-input"
                  type="number"
                  min="1"
                  step="0.1"
                  value={formData.weight}
                  onChange={handleChange}
                />
              </div>

              <div className="admin-form-group">
                <label htmlFor="insurance_number">Số BHYT</label>
                <input
                  id="insurance_number"
                  name="insurance_number"
                  className="admin-input"
                  value={formData.insurance_number}
                  onChange={handleChange}
                />
              </div>

              <div className="admin-form-group">
                <label htmlFor="emergency_contact">Liên hệ khẩn cấp</label>
                <input
                  id="emergency_contact"
                  name="emergency_contact"
                  className="admin-input"
                  value={formData.emergency_contact}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="admin-form-actions" style={{ marginTop: 16 }}>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving}
              >
                {saving
                  ? "Đang lưu..."
                  : editingId
                    ? "Lưu thay đổi"
                    : "Thêm hồ sơ"}
              </button>
              <button
                type="button"
                className="btn btn-outline"
                onClick={closeForm}
                disabled={saving}
              >
                Hủy
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <p>Đang tải hồ sơ...</p>
      ) : profiles.length === 0 ? (
        <div className="empty-state">
          <h3>Chưa có hồ sơ bệnh nhân</h3>
          <p>Thêm hồ sơ để đặt lịch khám cho bản thân hoặc người thân.</p>
          <button type="button" className="btn btn-primary" onClick={openCreate}>
            + Thêm hồ sơ
          </button>
        </div>
      ) : (
        <div className="profile-grid">
          {profiles.map((profile) => (
            <article key={profile.id} className="profile-card">
              <div className="profile-avatar">
                {(profile.full_name || "?").charAt(0)}
              </div>

              <h3>{profile.full_name}</h3>

              <span className="relationship">
                {profile.relationship_label ||
                  RELATIONSHIP_LABEL[profile.relationship] ||
                  profile.relationship}
              </span>

              <div className="profile-info">
                <p>
                  <strong>Giới tính:</strong>{" "}
                  {profile.gender_label || GENDER_LABEL[profile.gender]}
                </p>
                <p>
                  <strong>Ngày sinh:</strong>{" "}
                  {formatDateDisplay(profile.date_of_birth)}
                </p>
                <p>
                  <strong>Điện thoại:</strong> {profile.phone || "—"}
                </p>
                <p>
                  <strong>Nhóm máu:</strong> {profile.blood_type || "—"}
                </p>
                <p>
                  <strong>Chiều cao:</strong>{" "}
                  {profile.height ? `${profile.height} cm` : "—"}
                </p>
                <p>
                  <strong>Cân nặng:</strong>{" "}
                  {profile.weight ? `${profile.weight} kg` : "—"}
                </p>
                <p>
                  <strong>BHYT:</strong> {profile.insurance_number || "—"}
                </p>
              </div>

              <div className="profile-actions">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => openEdit(profile)}
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
      )}
    </PatientLayout>
  );
}

export default PatientProfiles;
