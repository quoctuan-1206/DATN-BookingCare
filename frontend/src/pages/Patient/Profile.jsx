import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useLocation, useNavigate } from "react-router-dom";
import PatientLayout from "../../components/patient/PatientLayout";
import { getApiErrorMessage } from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import authService from "../../services/auth.service";

const EMPTY_PROFILE = {
  first_name: "",
  last_name: "",
  phone: "",
  gender: "",
  date_of_birth: "",
  address: "",
};

function Profile() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, updateCurrentUser, clearSession } = useAuth();
  const isPasswordPage = location.pathname.endsWith("/password");
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState(EMPTY_PROFILE);
  const [password, setPassword] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    if (!user) return;
    setFormData({
      first_name: user.first_name || "",
      last_name: user.last_name || "",
      phone: user.phone || "",
      gender: user.gender || "",
      date_of_birth: user.date_of_birth ? String(user.date_of_birth).slice(0, 10) : "",
      address: user.address || "",
    });
  }, [user]);

  const handleChange = ({ target: { name, value } }) => {
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const response = await authService.updateProfile({
        ...formData,
        phone: formData.phone || null,
        gender: formData.gender || null,
        date_of_birth: formData.date_of_birth || null,
        address: formData.address || null,
      });
      const updatedUser = response.data?.data;
      if (updatedUser) updateCurrentUser(updatedUser);
      toast.success("Đã cập nhật thông tin cá nhân");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không cập nhật được thông tin"));
    } finally {
      setSaving(false);
    }
  };

  const handlePassword = async (event) => {
    event.preventDefault();
    if (password.newPassword !== password.confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp");
      return;
    }
    setSaving(true);
    try {
      await authService.changePassword(password);
      clearSession();
      toast.success("Đổi mật khẩu thành công. Vui lòng đăng nhập lại");
      navigate("/login", { replace: true });
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không đổi được mật khẩu"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <PatientLayout>
      {isPasswordPage ? (
        <div className="patient-password-card">
          <h1 className="patient-password-title">Đổi mật khẩu</h1>
          <form className="patient-password-form" onSubmit={handlePassword}>
            <div className="patient-password-fields">
              <PasswordField
                id="currentPassword"
                label="Mật khẩu hiện tại"
                autoComplete="current-password"
                value={password.currentPassword}
                onChange={(value) => setPassword((current) => ({ ...current, currentPassword: value }))}
              />
              <PasswordField
                id="newPassword"
                label="Mật khẩu mới"
                value={password.newPassword}
                onChange={(value) => setPassword((current) => ({ ...current, newPassword: value }))}
                minLength={6}
              />
              <PasswordField
                id="confirmPassword"
                label="Xác nhận mật khẩu mới"
                value={password.confirmPassword}
                onChange={(value) => setPassword((current) => ({ ...current, confirmPassword: value }))}
                minLength={6}
              />
            </div>
            <div className="patient-password-actions">
              <button type="submit" className="patient-profile-save-btn" disabled={saving}>
                {saving ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="patient-profile-info-card">
          <h2 className="patient-profile-info-title">Hồ sơ cá nhân</h2>
          <form className="patient-profile-info-form" onSubmit={handleSave}>
            <ProfileField id="last_name" label="Họ" required value={formData.last_name} onChange={handleChange} />
            <ProfileField id="first_name" label="Tên" required value={formData.first_name} onChange={handleChange} />
            <ProfileField id="phone" label="Số điện thoại" value={formData.phone} onChange={handleChange} maxLength={20} />
            <ProfileField id="email" label="Email" value={user?.email || ""} readOnly />
            <div className="profile-field-row">
              <label htmlFor="gender">Giới tính</label>
              <select id="gender" name="gender" className="profile-field-input" value={formData.gender} onChange={handleChange}>
                <option value="">Chưa chọn</option>
                <option value="Male">Nam</option>
                <option value="Female">Nữ</option>
                <option value="Other">Khác</option>
              </select>
            </div>
            <ProfileField id="date_of_birth" label="Ngày sinh" type="date" value={formData.date_of_birth} onChange={handleChange} max={new Date().toISOString().slice(0, 10)} />
            <ProfileField id="address" label="Địa chỉ" value={formData.address} onChange={handleChange} maxLength={255} />
            <button type="submit" className="patient-profile-save-btn" disabled={saving}>
              {saving ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
          </form>
        </div>
      )}
    </PatientLayout>
  );
}

function ProfileField({ id, label, required = false, ...inputProps }) {
  return (
    <div className="profile-field-row">
      <label htmlFor={id}>
        {label}{required && <span className="profile-required">*</span>}
      </label>
      <input id={id} name={id} className="profile-field-input" required={required} {...inputProps} />
    </div>
  );
}

function PasswordField({ id, label, value, onChange, autoComplete = "new-password", minLength }) {
  return (
    <div className="profile-field-row">
      <label htmlFor={id}>{label}<span className="profile-required">*</span></label>
      <input id={id} className="profile-field-input" type="password" autoComplete={autoComplete} value={value} onChange={(event) => onChange(event.target.value)} minLength={minLength} required />
    </div>
  );
}

export default Profile;
