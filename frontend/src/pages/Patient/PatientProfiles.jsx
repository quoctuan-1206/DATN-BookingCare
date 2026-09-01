import { useCallback, useEffect, useState } from "react";
import { Plus, Users } from "lucide-react";
import toast from "react-hot-toast";
import PatientLayout from "../../components/patient/PatientLayout";
import PatientProfileCard from "../../components/patient/PatientProfileCard";
import patientProfileService, {
  GENDER_LABEL,
  RELATIONSHIP_LABEL,
} from "../../services/patient-profile.service";
import { getApiErrorMessage } from "../../api/axios";

const emptyForm = {
  full_name: "",
  phone: "",
  gender: "Male",
  birthDay: "",
  birthMonth: "",
  birthYear: "",
  relationship: "Self",
  blood_type: "",
  height: "",
  weight: "",
  insurance_number: "",
  emergency_contact: "",
};

function parseBirthday(dateStr) {
  if (!dateStr) return { day: "", month: "", year: "" };
  const [year, month, day] = String(dateStr).split("-");
  return {
    day: day || "",
    month: month || "",
    year: year || "",
  };
}

function buildDateOfBirth(formData) {
  const { birthDay, birthMonth, birthYear } = formData;
  if (!birthDay || !birthMonth || !birthYear) return "";
  return `${birthYear}-${String(birthMonth).padStart(2, "0")}-${String(birthDay).padStart(2, "0")}`;
}

function PatientProfiles() {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(emptyForm);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const profileList = await patientProfileService.getMyProfiles();
      setProfiles(profileList);
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, "Không tải được hồ sơ bệnh nhân"),
      );
      setProfiles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openCreate = () => {
    setEditingId(null);
    setFormData(emptyForm);
    setShowForm(true);
  };

  const openEdit = (profile) => {
    const birthday = parseBirthday(profile.date_of_birth);
    setEditingId(profile.id);
    setFormData({
      full_name: profile.full_name || "",
      phone: profile.phone || "",
      gender: profile.gender || "Male",
      birthDay: birthday.day,
      birthMonth: birthday.month,
      birthYear: birthday.year,
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
      date_of_birth: buildDateOfBirth(formData),
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
    if (!buildDateOfBirth(formData)) {
      toast.error("Vui lòng nhập đầy đủ ngày sinh");
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
      await loadData();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không lưu được hồ sơ"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (profile) => {
    const name = profile.full_name || "hồ sơ này";
    const confirmed = window.confirm(
      `Bạn có chắc muốn xóa hồ sơ "${name}"?`,
    );
    if (!confirmed) return;

    setDeletingId(profile.id);
    try {
      await patientProfileService.deleteProfile(profile.id);
      toast.success("Đã xóa hồ sơ");
      if (editingId === profile.id) {
        closeForm();
      }
      await loadData();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không xóa được hồ sơ"));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <PatientLayout>
      {showForm ? (
        <div className="patient-profiles-card">
          <h1 className="patient-profiles-title">
            {editingId ? "Chỉnh sửa hồ sơ" : "Thêm hồ sơ bệnh nhân"}
          </h1>

          <form
            className="patient-profiles-form"
            autoComplete="off"
            onSubmit={handleSubmit}
          >
            <div className="patient-profiles-fields">
              <div className="profile-field-row">
                <label htmlFor="full_name">
                  Họ và tên<span className="profile-required">*</span>
                </label>
                <input
                  id="full_name"
                  name="full_name"
                  className="profile-field-input"
                  value={formData.full_name}
                  onChange={handleChange}
                  placeholder="Họ và tên"
                  required
                />
              </div>

              <div className="profile-field-row">
                <label htmlFor="relationship">Quan hệ</label>
                <select
                  id="relationship"
                  name="relationship"
                  className="profile-field-input"
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

              <div className="profile-field-row">
                <span className="profile-field-label">
                  Giới tính<span className="profile-required">*</span>
                </span>
                <div className="profile-gender-options">
                  {[
                    ["Male", GENDER_LABEL.Male],
                    ["Female", GENDER_LABEL.Female],
                  ].map(([value, label]) => (
                    <label key={value} className="profile-gender-option">
                      <input
                        type="radio"
                        name="gender"
                        value={value}
                        checked={formData.gender === value}
                        onChange={handleChange}
                      />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="profile-field-row">
                <span className="profile-field-label">
                  Ngày sinh<span className="profile-required">*</span>
                </span>
                <div className="profile-birthday-inputs">
                  <input
                    name="birthDay"
                    className="profile-field-input profile-birthday-input"
                    value={formData.birthDay}
                    onChange={handleChange}
                    placeholder="Ngày"
                    inputMode="numeric"
                    maxLength={2}
                  />
                  <input
                    name="birthMonth"
                    className="profile-field-input profile-birthday-input"
                    value={formData.birthMonth}
                    onChange={handleChange}
                    placeholder="Tháng"
                    inputMode="numeric"
                    maxLength={2}
                  />
                  <input
                    name="birthYear"
                    className="profile-field-input profile-birthday-input profile-birthday-input--year"
                    value={formData.birthYear}
                    onChange={handleChange}
                    placeholder="Năm"
                    inputMode="numeric"
                    maxLength={4}
                  />
                </div>
              </div>

              <div className="profile-field-row">
                <label htmlFor="phone">Số điện thoại</label>
                <input
                  id="phone"
                  name="phone"
                  className="profile-field-input"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Số điện thoại"
                />
              </div>

              <div className="profile-field-row">
                <label htmlFor="blood_type">Nhóm máu</label>
                <select
                  id="blood_type"
                  name="blood_type"
                  className="profile-field-input"
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

              <div className="profile-field-row">
                <label htmlFor="height">Chiều cao (cm)</label>
                <input
                  id="height"
                  name="height"
                  className="profile-field-input"
                  type="number"
                  min="1"
                  step="0.1"
                  value={formData.height}
                  onChange={handleChange}
                  placeholder="Chiều cao"
                />
              </div>

              <div className="profile-field-row">
                <label htmlFor="weight">Cân nặng (kg)</label>
                <input
                  id="weight"
                  name="weight"
                  className="profile-field-input"
                  type="number"
                  min="1"
                  step="0.1"
                  value={formData.weight}
                  onChange={handleChange}
                  placeholder="Cân nặng"
                />
              </div>

              <div className="profile-field-row">
                <label htmlFor="insurance_number">Số BHYT</label>
                <input
                  id="insurance_number"
                  name="insurance_number"
                  className="profile-field-input"
                  value={formData.insurance_number}
                  onChange={handleChange}
                  placeholder="Số BHYT"
                />
              </div>

              <div className="profile-field-row">
                <label htmlFor="emergency_contact">Liên hệ khẩn cấp</label>
                <input
                  id="emergency_contact"
                  name="emergency_contact"
                  className="profile-field-input"
                  value={formData.emergency_contact}
                  onChange={handleChange}
                  placeholder="Liên hệ khẩn cấp"
                />
              </div>
            </div>

            <div className="patient-profiles-actions">
              <button
                type="submit"
                className="patient-profile-save-btn"
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
                className="patient-profile-secondary-btn"
                onClick={closeForm}
                disabled={saving}
              >
                Hủy
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="patient-profiles-card">
          <div className="patient-profiles-card-head">
            <h1 className="patient-profiles-title">Hồ sơ bệnh nhân</h1>
            <button
              type="button"
              className="patient-profiles-add-btn"
              onClick={openCreate}
            >
              <Plus size={16} />
              Thêm hồ sơ
            </button>
          </div>

          {loading ? (
            <p className="patient-profiles-loading">Đang tải hồ sơ...</p>
          ) : profiles.length === 0 ? (
            <div className="profiles-empty-state">
              <Users size={48} strokeWidth={1.75} />
              <p>Chưa có hồ sơ bệnh nhân</p>
              <button
                type="button"
                className="patient-profile-save-btn"
                onClick={openCreate}
              >
                <Plus size={16} />
                Thêm hồ sơ
              </button>
            </div>
          ) : (
            <div className="profiles-list">
              {profiles.map((profile) => (
                <PatientProfileCard
                  key={profile.id}
                  profile={profile}
                  onEdit={openEdit}
                  onDelete={handleDelete}
                  deleting={deletingId === profile.id}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </PatientLayout>
  );
}

export default PatientProfiles;
