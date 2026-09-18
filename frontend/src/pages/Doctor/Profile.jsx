import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import DoctorLayout from "../../components/doctor-dashboard/layout/DoctorLayout";
import doctorService from "../../services/doctor.service";
import clinicService from "../../services/clinic.service";
import specialtyService from "../../services/specialty.service";
import { getApiErrorMessage } from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import authService from "../../services/auth.service";

function Profile() {
  const navigate = useNavigate();
  const { user, updateCurrentUser, clearSession } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [addingWorkplace, setAddingWorkplace] = useState(false);
  const [doctor, setDoctor] = useState(null);
  const [clinics, setClinics] = useState([]);
  const [specialties, setSpecialties] = useState([]);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    gender: "",
    date_of_birth: "",
    address: "",
    degree: "",
    position: "",
    biography: "",
  });
  const [changingPassword, setChangingPassword] = useState(false);
  const [password, setPassword] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [workplaceForm, setWorkplaceForm] = useState({
    clinic_id: "",
    specialty_id: "",
    room: "",
    consultation_fee: "",
  });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!user?.id) return;
      setLoading(true);
      try {
        const [doctorData, clinicsResult, specialtiesResult] =
          await Promise.all([
            doctorService.getDoctorById(user.id),
            clinicService.getClinics({ page: 1, limit: 100 }),
            specialtyService.getSpecialties({ page: 1, limit: 100 }),
          ]);

        if (cancelled) return;

        setDoctor(doctorData);
        setClinics(clinicsResult.data || []);
        setSpecialties(specialtiesResult.data || []);
        setFormData({
          first_name: doctorData.first_name || "",
          last_name: doctorData.last_name || "",
          phone: doctorData.phone || "",
          gender: doctorData.gender || "",
          date_of_birth: doctorData.date_of_birth || "",
          address: doctorData.address || "",
          degree: doctorData.degree || "",
          position: doctorData.position || "",
          biography: doctorData.biography || "",
        });
      } catch (error) {
        if (!cancelled) {
          toast.error(
            getApiErrorMessage(error, "Không tải được hồ sơ bác sĩ"),
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleWorkplaceChange = (e) => {
    const { name, value } = e.target;
    setWorkplaceForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user?.id) return;

    setSaving(true);
    try {
      const res = await doctorService.updateDoctor(user.id, {
        ...formData,
        gender: formData.gender || null,
        date_of_birth: formData.date_of_birth || null,
      });

      const updated = res.data?.data;
      if (updated) {
        setDoctor(updated);
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

      toast.success("Đã cập nhật hồ sơ");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không cập nhật được hồ sơ"));
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (password.newPassword !== password.confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp");
      return;
    }

    setChangingPassword(true);
    try {
      await authService.changePassword(password);
      clearSession();
      toast.success("Đổi mật khẩu thành công. Vui lòng đăng nhập lại");
      navigate("/login", { replace: true });
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không đổi được mật khẩu"));
    } finally {
      setChangingPassword(false);
    }
  };

  const handleAddWorkplace = async (e) => {
    e.preventDefault();
    if (!user?.id) return;

    if (!workplaceForm.clinic_id || !workplaceForm.specialty_id) {
      toast.error("Chọn phòng khám và chuyên khoa");
      return;
    }

    setAddingWorkplace(true);
    try {
      const res = await doctorService.addWorkplace(user.id, {
        clinic_id: Number(workplaceForm.clinic_id),
        specialty_id: Number(workplaceForm.specialty_id),
        room: workplaceForm.room || undefined,
        consultation_fee:
          workplaceForm.consultation_fee !== ""
            ? Number(workplaceForm.consultation_fee)
            : 0,
      });

      setDoctor(res.data?.data || null);
      setWorkplaceForm({
        clinic_id: "",
        specialty_id: "",
        room: "",
        consultation_fee: "",
      });
      toast.success("Đã thêm phòng khám");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không thêm được phòng khám"));
    } finally {
      setAddingWorkplace(false);
    }
  };

  const handleUpdateWorkplaceFee = async (workplace) => {
    const value = window.prompt(
      `Giá khám tại ${workplace.clinic_name} (VNĐ)`,
      String(workplace.consultation_fee ?? 0),
    );
    if (value === null) return;

    const fee = Number(value);
    if (Number.isNaN(fee) || fee < 0) {
      toast.error("Giá khám không hợp lệ");
      return;
    }

    try {
      const res = await doctorService.updateWorkplace(user.id, workplace.id, {
        consultation_fee: fee,
      });
      setDoctor(res.data?.data || null);
      toast.success("Đã cập nhật giá khám");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không cập nhật được giá khám"));
    }
  };

  const handleRemoveWorkplace = async (workplace) => {
    const ok = window.confirm(
      `Ngưng đăng ký "${workplace.clinic_name} · ${workplace.specialty_name}"?`,
    );
    if (!ok) return;

    try {
      const res = await doctorService.removeWorkplace(user.id, workplace.id);
      setDoctor(res.data?.data || null);
      toast.success("Đã ngưng phòng khám");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không ngưng được phòng khám"));
    }
  };

  const workplaces = doctor?.workplaces || [];

  return (
    <DoctorLayout title="Hồ sơ">
      <div className="doctor-page">
        <div className="doctor-card" style={{ marginBottom: 20 }}>
          <h3 style={{ marginBottom: 8 }}>Hồ sơ bác sĩ</h3>
          <p style={{ marginBottom: 20, color: "#666" }}>
            Cập nhật thông tin chuyên môn. Giá khám đặt theo từng phòng khám.
          </p>

          {loading ? (
            <p>Đang tải...</p>
          ) : !doctor ? (
            <p>Không tìm thấy hồ sơ.</p>
          ) : (
            <form className="admin-form" onSubmit={handleSubmit}>
              <div className="admin-form-group">
                <label htmlFor="last_name">Họ</label>
                <input id="last_name" name="last_name" className="admin-input" value={formData.last_name} onChange={handleChange} required />
              </div>

              <div className="admin-form-group">
                <label htmlFor="first_name">Tên</label>
                <input id="first_name" name="first_name" className="admin-input" value={formData.first_name} onChange={handleChange} required />
              </div>

              <div className="admin-form-group">
                <label>Email</label>
                <input
                  className="admin-input"
                  value={doctor.email || ""}
                  readOnly
                />
              </div>

              <div className="admin-form-group">
                <label htmlFor="phone">Số điện thoại</label>
                <input
                  id="phone"
                  name="phone"
                  className="admin-input"
                  type="text"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>

              <div className="admin-form-group">
                <label htmlFor="gender">Giới tính</label>
                <select id="gender" name="gender" className="admin-select" value={formData.gender} onChange={handleChange}>
                  <option value="">Chưa chọn</option>
                  <option value="Male">Nam</option>
                  <option value="Female">Nữ</option>
                  <option value="Other">Khác</option>
                </select>
              </div>

              <div className="admin-form-group">
                <label htmlFor="date_of_birth">Ngày sinh</label>
                <input id="date_of_birth" name="date_of_birth" className="admin-input" type="date" value={formData.date_of_birth} onChange={handleChange} max={new Date().toISOString().slice(0, 10)} />
              </div>

              <div className="admin-form-group">
                <label htmlFor="address">Địa chỉ</label>
                <input id="address" name="address" className="admin-input" value={formData.address} onChange={handleChange} maxLength={255} />
              </div>

              <div className="admin-form-group">
                <label htmlFor="degree">Học vị</label>
                <input
                  id="degree"
                  name="degree"
                  className="admin-input"
                  type="text"
                  placeholder="TS.BS"
                  value={formData.degree}
                  onChange={handleChange}
                />
              </div>

              <div className="admin-form-group">
                <label htmlFor="position">Chức vụ</label>
                <input
                  id="position"
                  name="position"
                  className="admin-input"
                  type="text"
                  placeholder="Bác sĩ điều trị"
                  value={formData.position}
                  onChange={handleChange}
                />
              </div>

              <div className="admin-form-group">
                <label htmlFor="biography">Giới thiệu</label>
                <textarea
                  id="biography"
                  name="biography"
                  className="admin-textarea"
                  rows={4}
                  value={formData.biography}
                  onChange={handleChange}
                />
              </div>

              <div className="admin-form-actions">
                <button
                  type="submit"
                  className="admin-btn admin-btn-primary"
                  disabled={saving}
                >
                  {saving ? "Đang lưu..." : "Lưu hồ sơ"}
                </button>
              </div>
            </form>
          )}
        </div>

        {!loading && doctor && (
          <div className="doctor-card" style={{ marginBottom: 20 }}>
            <h3 style={{ marginBottom: 8 }}>Đổi mật khẩu</h3>
            <p style={{ marginBottom: 20, color: "#666" }}>
              Sau khi đổi mật khẩu, bạn cần đăng nhập lại để bảo vệ tài khoản.
            </p>
            <form className="admin-form" onSubmit={handleChangePassword}>
              <div className="admin-form-group">
                <label htmlFor="currentPassword">Mật khẩu hiện tại</label>
                <input id="currentPassword" className="admin-input" type="password" autoComplete="current-password" value={password.currentPassword} onChange={(e) => setPassword((current) => ({ ...current, currentPassword: e.target.value }))} required />
              </div>
              <div className="admin-form-group">
                <label htmlFor="newPassword">Mật khẩu mới</label>
                <input id="newPassword" className="admin-input" type="password" autoComplete="new-password" minLength={6} value={password.newPassword} onChange={(e) => setPassword((current) => ({ ...current, newPassword: e.target.value }))} required />
              </div>
              <div className="admin-form-group">
                <label htmlFor="confirmPassword">Xác nhận mật khẩu mới</label>
                <input id="confirmPassword" className="admin-input" type="password" autoComplete="new-password" minLength={6} value={password.confirmPassword} onChange={(e) => setPassword((current) => ({ ...current, confirmPassword: e.target.value }))} required />
              </div>
              <div className="admin-form-actions">
                <button type="submit" className="admin-btn admin-btn-primary" disabled={changingPassword}>
                  {changingPassword ? "Đang đổi..." : "Đổi mật khẩu"}
                </button>
              </div>
            </form>
          </div>
        )}

        {!loading && doctor && (
          <div className="doctor-card">
            <h3 style={{ marginBottom: 8 }}>Phòng khám đang làm việc</h3>
            <p style={{ marginBottom: 16, color: "#666" }}>
              Một bác sĩ có thể đăng ký nhiều phòng khám / chuyên khoa.
            </p>

            {workplaces.length === 0 ? (
              <p style={{ marginBottom: 16 }}>Chưa có phòng khám nào.</p>
            ) : (
              <div className="table-wrapper" style={{ marginBottom: 20 }}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Phòng khám</th>
                      <th>Chuyên khoa</th>
                      <th>Phòng</th>
                      <th>Giá khám</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {workplaces.map((w) => (
                      <tr key={w.id}>
                        <td>{w.clinic_name}</td>
                        <td>{w.specialty_name}</td>
                        <td>{w.room || "—"}</td>
                        <td>
                          {Number(w.consultation_fee || 0).toLocaleString(
                            "vi-VN",
                          )}{" "}
                          đ
                        </td>
                        <td style={{ display: "flex", gap: 8 }}>
                          <button
                            type="button"
                            className="admin-btn admin-btn-secondary"
                            onClick={() => handleUpdateWorkplaceFee(w)}
                          >
                            Đổi giá
                          </button>
                          <button
                            type="button"
                            className="admin-btn admin-btn-danger"
                            onClick={() => handleRemoveWorkplace(w)}
                            disabled={workplaces.length <= 1}
                          >
                            Ngưng
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <h4 style={{ marginBottom: 12 }}>Thêm phòng khám</h4>
            <form
              className="admin-form"
              onSubmit={handleAddWorkplace}
              style={{
                display: "grid",
                gap: 12,
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                alignItems: "end",
              }}
            >
              <label>
                Phòng khám
                <select
                  name="clinic_id"
                  className="admin-select"
                  value={workplaceForm.clinic_id}
                  onChange={handleWorkplaceChange}
                  required
                >
                  <option value="">Chọn...</option>
                  {clinics.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Chuyên khoa
                <select
                  name="specialty_id"
                  className="admin-select"
                  value={workplaceForm.specialty_id}
                  onChange={handleWorkplaceChange}
                  required
                >
                  <option value="">Chọn...</option>
                  {specialties.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Số phòng
                <input
                  name="room"
                  className="admin-input"
                  type="text"
                  placeholder="P.201"
                  value={workplaceForm.room}
                  onChange={handleWorkplaceChange}
                />
              </label>
              <label>
                Giá khám (VNĐ)
                <input
                  name="consultation_fee"
                  className="admin-input"
                  type="number"
                  min="0"
                  step="1000"
                  placeholder="300000"
                  value={workplaceForm.consultation_fee}
                  onChange={handleWorkplaceChange}
                />
              </label>
              <button
                type="submit"
                className="admin-btn admin-btn-primary"
                disabled={addingWorkplace}
              >
                {addingWorkplace ? "Đang thêm..." : "Thêm phòng khám"}
              </button>
            </form>
          </div>
        )}
      </div>
    </DoctorLayout>
  );
}

export default Profile;
