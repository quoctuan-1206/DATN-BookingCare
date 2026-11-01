import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  Building2,
  CalendarDays,
  Check,
  Eye,
  EyeOff,
  GraduationCap,
  ImagePlus,
  KeyRound,
  LockKeyhole,
  Mail,
  MapPin,
  Phone,
  Plus,
  Save,
  ShieldCheck,
  Stethoscope,
  UserRound,
  X,
  XCircle,
} from "lucide-react";
import DoctorLayout from "../../components/doctor-dashboard/layout/DoctorLayout";
import doctorService from "../../services/doctor.service";
import clinicService from "../../services/clinic.service";
import specialtyService from "../../services/specialty.service";
import uploadService from "../../services/upload.service";
import { getApiErrorMessage } from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import authService from "../../services/auth.service";
import "../../styles/doctor-profile.css";

const emptyProfile = {
  first_name: "",
  last_name: "",
  phone: "",
  gender: "",
  date_of_birth: "",
  address: "",
  degree: "",
  position: "",
  biography: "",
};

const emptyWorkplace = {
  clinic_id: "",
  specialty_id: "",
  room: "",
  consultation_fee: "",
};

function getProfileForm(doctor) {
  return {
    first_name: doctor.first_name || "",
    last_name: doctor.last_name || "",
    phone: doctor.phone || "",
    gender: doctor.gender || "",
    date_of_birth: doctor.date_of_birth || "",
    address: doctor.address || "",
    degree: doctor.degree || "",
    position: doctor.position || "",
    biography: doctor.biography || "",
  };
}

function formatMoney(value) {
  return `${Number(value || 0).toLocaleString("vi-VN")} ₫`;
}

function getInitials(doctor) {
  const parts = [doctor?.last_name, doctor?.first_name].filter(Boolean);
  return parts.map((part) => part.trim().charAt(0)).join("").slice(0, 2).toUpperCase() || "BS";
}

function Field({ label, icon: Icon, className = "", children, ...props }) {
  return (
    <label className={`doctor-profile-field ${className}`}>
      <span className="doctor-profile-field__label">{label}</span>
      {Icon && <Icon className="doctor-profile-field__icon" size={17} aria-hidden="true" />}
      {children || <input {...props} className="doctor-profile-input" />}
    </label>
  );
}

function Modal({ title, description, onClose, children, className = "" }) {
  return (
    <div className="doctor-profile-modal-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section className={`doctor-profile-modal ${className}`} role="dialog" aria-modal="true" aria-labelledby="doctor-profile-modal-title">
        <header className="doctor-profile-modal__header">
          <div>
            <h2 id="doctor-profile-modal-title">{title}</h2>
            {description && <p>{description}</p>}
          </div>
          <button type="button" className="doctor-profile-icon-button" aria-label="Đóng" onClick={onClose}><X size={19} /></button>
        </header>
        {children}
      </section>
    </div>
  );
}

function Profile() {
  const navigate = useNavigate();
  const { user, updateCurrentUser, clearSession } = useAuth();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [addingWorkplace, setAddingWorkplace] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [doctor, setDoctor] = useState(null);
  const [clinics, setClinics] = useState([]);
  const [specialties, setSpecialties] = useState([]);
  const [formData, setFormData] = useState(emptyProfile);
  const [savedProfile, setSavedProfile] = useState(emptyProfile);
  const [password, setPassword] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [visiblePasswords, setVisiblePasswords] = useState({});
  const [workplaceForm, setWorkplaceForm] = useState(emptyWorkplace);
  const [workplaceModalOpen, setWorkplaceModalOpen] = useState(false);
  const [editingWorkplace, setEditingWorkplace] = useState(null);
  const [feeValue, setFeeValue] = useState("");
  const [removingWorkplace, setRemovingWorkplace] = useState(null);
  const avatarInput = useRef(null);

  const load = useCallback(async () => {
    await Promise.resolve();
    if (!user?.id) {
      setLoading(false);
      setLoadError("Không tìm thấy tài khoản đang đăng nhập.");
      return;
    }
    setLoading(true);
    setLoadError("");
    try {
      const [doctorData, clinicsResult, specialtiesResult] = await Promise.all([
        doctorService.getDoctorById(user.id),
        clinicService.getClinics({ page: 1, limit: 100 }),
        specialtyService.getSpecialties({ page: 1, limit: 100 }),
      ]);
      if (!doctorData) throw new Error("Không tìm thấy hồ sơ bác sĩ.");
      setDoctor(doctorData);
      setClinics((clinicsResult.data || []).filter((clinic) => clinic.is_active !== false));
      setSpecialties((specialtiesResult.data || []).filter((specialty) => specialty.is_active !== false));
      const profile = getProfileForm(doctorData);
      setFormData(profile);
      setSavedProfile(profile);
    } catch (error) {
      setLoadError(getApiErrorMessage(error, "Không tải được hồ sơ bác sĩ."));
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    const task = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(task);
  }, [load]);

  const profileChanged = useMemo(
    () => JSON.stringify(formData) !== JSON.stringify(savedProfile),
    [formData, savedProfile],
  );
  const workplaces = doctor?.workplaces || [];

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!user?.id || !profileChanged) return;
    setSaving(true);
    try {
      const response = await doctorService.updateDoctor(user.id, {
        ...formData,
        gender: formData.gender || null,
        date_of_birth: formData.date_of_birth || null,
      });
      const updated = response.data?.data;
      if (updated) {
        setDoctor(updated);
        const nextProfile = getProfileForm(updated);
        setFormData(nextProfile);
        setSavedProfile(nextProfile);
        updateCurrentUser({
          ...user,
          first_name: updated.first_name,
          last_name: updated.last_name,
          phone: updated.phone,
          gender: updated.gender,
          date_of_birth: updated.date_of_birth,
          address: updated.address,
          avatar: updated.avatar,
        });
      }
      toast.success("Đã cập nhật hồ sơ bác sĩ.");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không cập nhật được hồ sơ."));
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !user?.id) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ảnh đại diện tối đa 5 MB.");
      return;
    }
    setAvatarBusy(true);
    try {
      const avatar = await uploadService.uploadImage(file);
      const response = await doctorService.updateDoctor(user.id, { avatar });
      const updated = response.data?.data;
      if (updated) {
        setDoctor(updated);
        updateCurrentUser({ ...user, avatar: updated.avatar });
      }
      toast.success("Đã cập nhật ảnh đại diện.");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không cập nhật được ảnh đại diện."));
    } finally {
      setAvatarBusy(false);
    }
  };

  const handleChangePassword = async (event) => {
    event.preventDefault();
    if (password.newPassword !== password.confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp.");
      return;
    }
    if (profileChanged && !window.confirm("Thông tin hồ sơ đang chỉnh sửa chưa được lưu. Bạn vẫn muốn đổi mật khẩu và đăng xuất?")) return;
    setChangingPassword(true);
    try {
      await authService.changePassword(password);
      clearSession();
      toast.success("Đổi mật khẩu thành công. Vui lòng đăng nhập lại.");
      navigate("/login", { replace: true });
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không đổi được mật khẩu."));
    } finally {
      setChangingPassword(false);
    }
  };

  const showPassword = (name) => setVisiblePasswords((current) => ({ ...current, [name]: !current[name] }));

  const openAddWorkplace = () => {
    setEditingWorkplace(null);
    setWorkplaceForm(emptyWorkplace);
    setWorkplaceModalOpen(true);
  };

  const handleWorkplaceChange = (event) => {
    const { name, value } = event.target;
    setWorkplaceForm((current) => ({ ...current, [name]: value }));
  };

  const handleAddWorkplace = async (event) => {
    event.preventDefault();
    if (!user?.id || !workplaceForm.clinic_id || !workplaceForm.specialty_id) return;
    setAddingWorkplace(true);
    try {
      const response = await doctorService.addWorkplace(user.id, {
        clinic_id: Number(workplaceForm.clinic_id),
        specialty_id: Number(workplaceForm.specialty_id),
        room: workplaceForm.room || undefined,
        consultation_fee: workplaceForm.consultation_fee !== "" ? Number(workplaceForm.consultation_fee) : 0,
      });
      setDoctor(response.data?.data || doctor);
      setWorkplaceModalOpen(false);
      setWorkplaceForm(emptyWorkplace);
      toast.success("Đã thêm nơi làm việc.");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không thêm được nơi làm việc."));
    } finally {
      setAddingWorkplace(false);
    }
  };

  const openEditFee = (workplace) => {
    setEditingWorkplace(workplace);
    setFeeValue(String(workplace.consultation_fee ?? 0));
  };

  const handleUpdateWorkplaceFee = async (event) => {
    event.preventDefault();
    const fee = Number(feeValue);
    if (!editingWorkplace || !Number.isFinite(fee) || fee < 0) {
      toast.error("Giá khám không hợp lệ.");
      return;
    }
    setSaving(true);
    try {
      const response = await doctorService.updateWorkplace(user.id, editingWorkplace.id, { consultation_fee: fee });
      setDoctor(response.data?.data || doctor);
      setEditingWorkplace(null);
      toast.success("Đã cập nhật giá khám.");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không cập nhật được giá khám."));
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveWorkplace = async () => {
    if (!removingWorkplace || workplaces.length <= 1) return;
    setSaving(true);
    try {
      const response = await doctorService.removeWorkplace(user.id, removingWorkplace.id);
      setDoctor(response.data?.data || doctor);
      setRemovingWorkplace(null);
      toast.success("Đã ngừng đăng ký nơi làm việc.");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không ngừng được nơi làm việc."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <DoctorLayout title="Hồ sơ">
      <div className="doctor-profile-page">
        <section className="doctor-profile-banner">
          <div className="doctor-profile-banner__copy">
            <span className="doctor-profile-eyebrow"><span /> THÔNG TIN BÁC SĨ</span>
            <h1>Quản lý hồ sơ cá nhân</h1>
            <p>Cập nhật thông tin cá nhân, chuyên môn, nơi làm việc và bảo mật tài khoản.</p>
          </div>
          <div className="doctor-profile-banner__art" aria-hidden="true">
            <span className="doctor-profile-banner__circle doctor-profile-banner__circle--one" />
            <span className="doctor-profile-banner__circle doctor-profile-banner__circle--two" />
            <div className="doctor-profile-banner__icon"><Stethoscope size={34} /></div>
            <div className="doctor-profile-banner__mini doctor-profile-banner__mini--cross">+</div>
            <div className="doctor-profile-banner__mini doctor-profile-banner__mini--check"><Check size={16} /></div>
          </div>
        </section>

        {loading ? (
          <>
          <div className="doctor-profile-workspace">
            <div className="doctor-profile-card doctor-profile-skeleton"><div /><div /><div /><div /></div>
            <div className="doctor-profile-card doctor-profile-skeleton"><div /><div /><div /></div>
          </div>
          <div className="doctor-profile-card doctor-profile-skeleton doctor-profile-skeleton--workplaces"><div /><div /><div /><div /></div>
          </>
        ) : loadError ? (
          <div className="doctor-profile-load-error" role="alert">
            <AlertCircle size={22} /><div><strong>Không tải được hồ sơ</strong><p>{loadError}</p></div>
            <button type="button" className="doctor-profile-button doctor-profile-button--secondary" onClick={load}>Thử lại</button>
          </div>
        ) : doctor && (
          <>
            <div className="doctor-profile-workspace">
              <section className="doctor-profile-card doctor-profile-information">
                <header className="doctor-profile-card__header">
                  <div className="doctor-profile-card__icon"><UserRound size={20} /></div>
                  <div><h2>Thông tin cá nhân và chuyên môn</h2><p>Cập nhật thông tin hiển thị trong hệ thống. Email không thể chỉnh sửa.</p></div>
                </header>

                <div className="doctor-profile-avatar-row">
                  <div className="doctor-profile-avatar">
                    {doctor.avatar || doctor.image ? <img src={doctor.avatar || doctor.image} alt={`${doctor.last_name || "Bác sĩ"} ${doctor.first_name || ""}`} /> : <span>{getInitials(doctor)}</span>}
                    <span className="doctor-profile-avatar__status" aria-label="Tài khoản bác sĩ" />
                  </div>
                  <div className="doctor-profile-avatar-copy"><strong>{[doctor.last_name, doctor.first_name].filter(Boolean).join(" ") || "Bác sĩ"}</strong><span>{doctor.degree || "Bác sĩ"}{doctor.position ? ` · ${doctor.position}` : ""}</span></div>
                  <input ref={avatarInput} className="doctor-profile-visually-hidden" type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleAvatarChange} />
                  <button type="button" className="doctor-profile-button doctor-profile-button--secondary doctor-profile-avatar-button" onClick={() => avatarInput.current?.click()} disabled={avatarBusy}>
                    <ImagePlus size={16} />{avatarBusy ? "Đang tải…" : "Đổi ảnh"}
                  </button>
                </div>

                <form onSubmit={handleSubmit}>
                  <div className="doctor-profile-section-label"><span>Thông tin cá nhân</span><i /></div>
                  <div className="doctor-profile-form-grid">
                    <Field label="Họ" name="last_name" value={formData.last_name} onChange={handleChange} required placeholder="Nhập họ" />
                    <Field label="Tên" name="first_name" value={formData.first_name} onChange={handleChange} required placeholder="Nhập tên" />
                    <Field label="Email" icon={Mail} value={doctor.email || ""} readOnly className="is-readonly" />
                    <Field label="Số điện thoại" icon={Phone} name="phone" value={formData.phone} onChange={handleChange} maxLength={20} placeholder="Nhập số điện thoại" />
                    <Field label="Giới tính" className="doctor-profile-select-field">
                      <select name="gender" value={formData.gender} onChange={handleChange} className="doctor-profile-input">
                        <option value="">Chưa chọn</option><option value="Male">Nam</option><option value="Female">Nữ</option><option value="Other">Khác</option>
                      </select>
                    </Field>
                    <Field label="Ngày sinh" icon={CalendarDays} name="date_of_birth" type="date" value={formData.date_of_birth} onChange={handleChange} max={new Date().toISOString().slice(0, 10)} />
                    <Field label="Địa chỉ" icon={MapPin} name="address" value={formData.address} onChange={handleChange} maxLength={255} className="doctor-profile-field--full" placeholder="Nhập địa chỉ" />
                  </div>

                  <div className="doctor-profile-section-label doctor-profile-section-label--spaced"><span>Thông tin chuyên môn</span><i /></div>
                  <div className="doctor-profile-form-grid">
                    <Field label="Học vị" icon={GraduationCap} name="degree" value={formData.degree} onChange={handleChange} placeholder="Ví dụ: Thạc sĩ, Tiến sĩ" />
                    <Field label="Chức vụ" icon={Stethoscope} name="position" value={formData.position} onChange={handleChange} placeholder="Ví dụ: Bác sĩ điều trị" />
                    <Field label="Giới thiệu bản thân" className="doctor-profile-field--full">
                      <textarea name="biography" value={formData.biography} onChange={handleChange} rows={4} maxLength={3000} className="doctor-profile-input doctor-profile-textarea" placeholder="Chia sẻ kinh nghiệm và lĩnh vực chuyên môn của bạn…" />
                    </Field>
                  </div>
                  <footer className="doctor-profile-form-footer">
                    {profileChanged && <span className="doctor-profile-unsaved"><span /> Có thay đổi chưa lưu</span>}
                    <button type="submit" className="doctor-profile-button doctor-profile-button--primary" disabled={saving || !profileChanged}>
                      <Save size={16} />{saving ? "Đang lưu…" : "Lưu hồ sơ"}
                    </button>
                  </footer>
                </form>
              </section>

              <aside className="doctor-profile-card doctor-profile-security">
                <header className="doctor-profile-card__header">
                  <div className="doctor-profile-card__icon doctor-profile-card__icon--security"><LockKeyhole size={20} /></div>
                  <div><h2>Đổi mật khẩu</h2><p>Dùng mật khẩu mạnh để bảo vệ tài khoản.</p></div>
                </header>
                <form className="doctor-profile-password-form" onSubmit={handleChangePassword}>
                  {[
                    ["currentPassword", "Mật khẩu hiện tại", "Nhập mật khẩu hiện tại"],
                    ["newPassword", "Mật khẩu mới", "Tối thiểu 6 ký tự"],
                    ["confirmPassword", "Xác nhận mật khẩu mới", "Nhập lại mật khẩu mới"],
                  ].map(([name, label, placeholder]) => (
                    <div key={name} className="doctor-profile-field doctor-profile-password-field">
                      <span className="doctor-profile-field__label">{label}</span>
                      <input
                        name={name}
                        type={visiblePasswords[name] ? "text" : "password"}
                        autoComplete={name === "currentPassword" ? "current-password" : "new-password"}
                        value={password[name]}
                        onChange={(event) => setPassword((current) => ({ ...current, [name]: event.target.value }))}
                        required minLength={name === "currentPassword" ? undefined : 6} maxLength={128}
                        className="doctor-profile-input doctor-profile-input--password"
                        placeholder={placeholder}
                        aria-label={label}
                      />
                      <button type="button" className="doctor-profile-password-toggle" onClick={() => showPassword(name)} aria-label={visiblePasswords[name] ? "Ẩn mật khẩu" : "Hiện mật khẩu"}>
                        {visiblePasswords[name] ? <EyeOff size={17} /> : <Eye size={17} />}
                      </button>
                    </div>
                  ))}
                  {password.confirmPassword && password.newPassword !== password.confirmPassword && <p className="doctor-profile-field-error">Mật khẩu xác nhận chưa khớp.</p>}
                  <div className="doctor-profile-security-note"><ShieldCheck size={18} /><div><strong>Lưu ý bảo mật</strong><p>Sau khi đổi mật khẩu thành công, hệ thống sẽ đăng xuất và chuyển về trang đăng nhập.</p></div></div>
                  {profileChanged && <p className="doctor-profile-password-warning"><AlertCircle size={15} /> Hồ sơ còn thay đổi chưa lưu. Bạn sẽ được hỏi xác nhận trước khi đăng xuất.</p>}
                  <button type="submit" className="doctor-profile-button doctor-profile-button--primary doctor-profile-button--wide" disabled={changingPassword || Boolean(password.confirmPassword && password.newPassword !== password.confirmPassword)}>
                    <KeyRound size={16} />{changingPassword ? "Đang cập nhật…" : "Đổi mật khẩu"}
                  </button>
                </form>
              </aside>
            </div>

            <section className="doctor-profile-card doctor-profile-workplaces">
              <header className="doctor-profile-card__header doctor-profile-workplaces__header">
                <div className="doctor-profile-card__icon doctor-profile-card__icon--work"><Building2 size={20} /></div>
                <div><h2>Phòng khám đang làm việc</h2><p>Quản lý nơi làm việc, chuyên khoa và giá khám của bạn.</p></div>
                <button type="button" className="doctor-profile-button doctor-profile-button--primary doctor-profile-add-button" onClick={openAddWorkplace}><Plus size={17} /> Thêm nơi làm việc</button>
              </header>

              {workplaces.length === 0 ? (
                <div className="doctor-profile-empty"><Building2 size={24} /><strong>Chưa có nơi làm việc</strong><span>Thêm cơ sở và chuyên khoa để quản lý lịch khám của bạn.</span><button type="button" className="doctor-profile-button doctor-profile-button--secondary" onClick={openAddWorkplace}><Plus size={16} /> Thêm nơi làm việc</button></div>
              ) : (
                <>
                  <div className="doctor-profile-table-wrap">
                    <table className="doctor-profile-table">
                      <thead><tr><th>STT</th><th>Cơ sở</th><th>Chuyên khoa</th><th>Phòng khám</th><th>Giá khám</th><th>Thao tác</th></tr></thead>
                      <tbody>{workplaces.map((workplace, index) => (
                        <tr key={workplace.id}>
                          <td className="doctor-profile-table__number">{String(index + 1).padStart(2, "0")}</td>
                          <td><div className="doctor-profile-clinic-name"><span><Building2 size={16} /></span><strong>{workplace.clinic_name || "—"}</strong></div>{workplace.clinic_address && <small className="doctor-profile-address">{workplace.clinic_address}</small>}</td>
                          <td><span className="doctor-profile-specialty"><Stethoscope size={14} />{workplace.specialty_name || "—"}</span></td>
                          <td>{workplace.room || <span className="doctor-profile-muted">Chưa có</span>}</td>
                          <td><strong className="doctor-profile-fee">{formatMoney(workplace.consultation_fee)}</strong></td>
                          <td><div className="doctor-profile-row-actions">
                            <button type="button" className="doctor-profile-button doctor-profile-button--secondary doctor-profile-button--small" onClick={() => openEditFee(workplace)}>Sửa giá</button>
                            <button type="button" className="doctor-profile-remove-button" onClick={() => setRemovingWorkplace(workplace)} disabled={workplaces.length <= 1} title={workplaces.length <= 1 ? "Bạn phải có ít nhất một nơi làm việc." : `Ngừng đăng ký ${workplace.clinic_name}`} aria-label={`Ngừng đăng ký ${workplace.clinic_name}`}><XCircle size={17} /><span>Ngừng</span></button>
                          </div></td>
                        </tr>
                      ))}</tbody>
                    </table>
                  </div>
                  <div className="doctor-profile-workplace-cards">
                    {workplaces.map((workplace, index) => (
                      <article className="doctor-profile-workplace-card" key={`mobile-${workplace.id}`}>
                        <header><span className="doctor-profile-workplace-card__number">{String(index + 1).padStart(2, "0")}</span><div><strong>{workplace.clinic_name || "—"}</strong>{workplace.clinic_address && <small>{workplace.clinic_address}</small>}</div><Building2 size={18} /></header>
                        <div className="doctor-profile-workplace-card__details"><span>Chuyên khoa<strong>{workplace.specialty_name || "—"}</strong></span><span>Phòng khám<strong>{workplace.room || "Chưa có"}</strong></span><span>Giá khám<strong className="doctor-profile-fee">{formatMoney(workplace.consultation_fee)}</strong></span></div>
                        <div className="doctor-profile-row-actions"><button type="button" className="doctor-profile-button doctor-profile-button--secondary doctor-profile-button--small" onClick={() => openEditFee(workplace)}>Sửa giá</button><button type="button" className="doctor-profile-remove-button" onClick={() => setRemovingWorkplace(workplace)} disabled={workplaces.length <= 1} title={workplaces.length <= 1 ? "Bạn phải có ít nhất một nơi làm việc." : `Ngừng đăng ký ${workplace.clinic_name}`}><XCircle size={17} /><span>Ngừng đăng ký</span></button></div>
                      </article>
                    ))}
                  </div>
                  <div className="doctor-profile-workplaces-foot"><span><Check size={15} /> {workplaces.length} nơi làm việc đã đăng ký</span><span>Giá khám được cấu hình riêng theo từng cơ sở.</span></div>
                </>
              )}
            </section>
          </>
        )}
      </div>

      {workplaceModalOpen && <Modal title="Thêm nơi làm việc" description="Chọn cơ sở và chuyên khoa bạn đăng ký khám." onClose={() => setWorkplaceModalOpen(false)}>
        <form className="doctor-profile-modal__body" onSubmit={handleAddWorkplace}>
          <Field label="Cơ sở khám" className="doctor-profile-select-field"><select name="clinic_id" value={workplaceForm.clinic_id} onChange={handleWorkplaceChange} required className="doctor-profile-input"><option value="">Chọn cơ sở</option>{clinics.map((clinic) => <option key={clinic.id} value={clinic.id}>{clinic.name}</option>)}</select></Field>
          <Field label="Chuyên khoa" className="doctor-profile-select-field"><select name="specialty_id" value={workplaceForm.specialty_id} onChange={handleWorkplaceChange} required className="doctor-profile-input"><option value="">Chọn chuyên khoa</option>{specialties.map((specialty) => <option key={specialty.id} value={specialty.id}>{specialty.name}</option>)}</select></Field>
          <div className="doctor-profile-modal__grid">
            <Field label="Số phòng" name="room" value={workplaceForm.room} onChange={handleWorkplaceChange} maxLength={100} placeholder="Ví dụ: P.201" />
            <Field label="Giá khám (VNĐ)" name="consultation_fee" type="number" min="0" step="1000" value={workplaceForm.consultation_fee} onChange={handleWorkplaceChange} placeholder="0" />
          </div>
          <footer className="doctor-profile-modal__actions"><button type="button" className="doctor-profile-button doctor-profile-button--secondary" onClick={() => setWorkplaceModalOpen(false)}>Hủy</button><button type="submit" className="doctor-profile-button doctor-profile-button--primary" disabled={addingWorkplace}><Plus size={16} />{addingWorkplace ? "Đang thêm…" : "Thêm nơi làm việc"}</button></footer>
        </form>
      </Modal>}

      {editingWorkplace && <Modal title="Cập nhật giá khám" description={`${editingWorkplace.clinic_name || "Cơ sở"} · ${editingWorkplace.specialty_name || "Chuyên khoa"}`} onClose={() => setEditingWorkplace(null)}>
        <form className="doctor-profile-modal__body" onSubmit={handleUpdateWorkplaceFee}>
          <div className="doctor-profile-modal-context"><MapPin size={17} /><span>Giá hiện tại <strong>{formatMoney(editingWorkplace.consultation_fee)}</strong></span></div>
          <Field label="Giá khám mới (VNĐ)" name="consultation_fee" type="number" min="0" step="1000" value={feeValue} onChange={(event) => setFeeValue(event.target.value)} required />
          <footer className="doctor-profile-modal__actions"><button type="button" className="doctor-profile-button doctor-profile-button--secondary" onClick={() => setEditingWorkplace(null)}>Hủy</button><button type="submit" className="doctor-profile-button doctor-profile-button--primary" disabled={saving}><Save size={16} />{saving ? "Đang lưu…" : "Lưu thay đổi"}</button></footer>
        </form>
      </Modal>}

      {removingWorkplace && <Modal title="Ngừng đăng ký nơi làm việc?" description="Nơi làm việc này sẽ được gỡ khỏi hồ sơ bác sĩ." onClose={() => setRemovingWorkplace(null)} className="doctor-profile-modal--confirm">
        <div className="doctor-profile-confirm"><div className="doctor-profile-confirm__icon"><XCircle size={23} /></div><p>Bạn muốn ngừng đăng ký tại <strong>{removingWorkplace.clinic_name}</strong> — {removingWorkplace.specialty_name}?</p><span>Thao tác này dùng quy trình hiện tại để gỡ nơi làm việc khỏi hồ sơ.</span></div>
        <footer className="doctor-profile-modal__actions"><button type="button" className="doctor-profile-button doctor-profile-button--secondary" onClick={() => setRemovingWorkplace(null)}>Giữ lại</button><button type="button" className="doctor-profile-button doctor-profile-button--danger" onClick={handleRemoveWorkplace} disabled={saving || workplaces.length <= 1}><XCircle size={16} />{saving ? "Đang xử lý…" : "Ngừng đăng ký"}</button></footer>
      </Modal>}
    </DoctorLayout>
  );
}

export default Profile;
