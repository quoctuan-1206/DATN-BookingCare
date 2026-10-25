import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import AdminLayout from "../../components/admin/layout/AdminLayout";
import userService from "../../services/user.service";
import clinicService from "../../services/clinic.service";
import { getApiErrorMessage } from "../../api/axios";

const roleLabel = {
  Admin: "Admin",
  Doctor: "Bác sĩ",
  Patient: "Bệnh nhân",
  Receptionist: "Tiếp tân",
  STAFF: "Nhân viên xét nghiệm",
};

const genderLabel = {
  Male: "Nam",
  Female: "Nữ",
  Other: "Khác",
};

function formatDate(value) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString("vi-VN");
  } catch {
    return "—";
  }
}

function UserDetail() {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [clinics, setClinics] = useState([]);
  const [clinicId, setClinicId] = useState("");
  const [savingClinic, setSavingClinic] = useState(false);

  const loadUser = async () => {
    setLoading(true);
    try {
      const data = await userService.getUserById(id);
      setUser(data);
      setClinicId(data.clinic_id ? String(data.clinic_id) : "");
    } catch (error) {
      setUser(null);
      toast.error(
        getApiErrorMessage(error, "Không tải được thông tin người dùng"),
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    clinicService.getClinics({ page: 1, limit: 100 })
      .then((result) => setClinics((result.data || []).filter((clinic) => clinic.is_active !== false)))
      .catch(() => setClinics([]));
  }, []);

  const saveClinic = async () => {
    if (!user || user.role !== "STAFF") return;
    setSavingClinic(true);
    try {
      await userService.assignStaffClinic(user.id, clinicId ? Number(clinicId) : null);
      toast.success("Đã cập nhật cơ sở làm việc");
      await loadUser();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không cập nhật được cơ sở làm việc"));
    } finally {
      setSavingClinic(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!user) return;

    const nextActive = user.status !== "active";
    const action = nextActive ? "mở khóa" : "khóa";
    const ok = window.confirm(
      `Bạn có chắc muốn ${action} tài khoản "${user.name}"?`,
    );
    if (!ok) return;

    setToggling(true);
    try {
      await userService.updateUserStatus(user.id, nextActive);
      toast.success(nextActive ? "Đã mở khóa tài khoản" : "Đã khóa tài khoản");
      await loadUser();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không cập nhật được trạng thái"));
    } finally {
      setToggling(false);
    }
  };

  return (
    <AdminLayout title="Chi tiết người dùng">
      <div className="admin-page">
        <div className="admin-page-header">
          <div>
            <h3>Chi tiết người dùng</h3>
            <p>Thông tin tài khoản trên hệ thống</p>
          </div>
          <div className="admin-page-actions">
            <Link to="/admin/users" className="admin-btn admin-btn-secondary">
              Quay lại
            </Link>
          </div>
        </div>

        <div className="dashboard-card">
          {loading ? (
            <p>Đang tải...</p>
          ) : !user ? (
            <p>Không tìm thấy người dùng.</p>
          ) : (
            <>
              <div className="table-user" style={{ marginBottom: 24 }}>
                <img
                  className="table-avatar"
                  src={user.avatar}
                  alt={user.name}
                  style={{ width: 64, height: 64 }}
                />
                <div className="table-user-info">
                  <strong style={{ fontSize: 18 }}>{user.name}</strong>
                  <span>{user.email}</span>
                </div>
              </div>

              <div className="admin-form" style={{ maxWidth: 640 }}>
                {user.role === "STAFF" && (
                  <div className="admin-form-group">
                    <label>Cơ sở làm việc</label>
                    <select className="admin-select" value={clinicId} onChange={(event) => setClinicId(event.target.value)}>
                      <option value="">Chưa phân công</option>
                      {clinics.map((clinic) => <option key={clinic.id} value={clinic.id}>{clinic.name}</option>)}
                    </select>
                    <button type="button" className="admin-btn admin-btn-primary" onClick={saveClinic} disabled={savingClinic}>
                      {savingClinic ? "Đang lưu..." : "Lưu cơ sở"}
                    </button>
                  </div>
                )}
                <div className="admin-form-group">
                  <label>Vai trò</label>
                  <input
                    className="admin-input"
                    value={roleLabel[user.role] || user.role || "—"}
                    readOnly
                  />
                </div>
                <div className="admin-form-group">
                  <label>Số điện thoại</label>
                  <input
                    className="admin-input"
                    value={user.phone || "—"}
                    readOnly
                  />
                </div>
                <div className="admin-form-group">
                  <label>Giới tính</label>
                  <input
                    className="admin-input"
                    value={genderLabel[user.gender] || user.gender || "—"}
                    readOnly
                  />
                </div>
                <div className="admin-form-group">
                  <label>Ngày sinh</label>
                  <input
                    className="admin-input"
                    value={formatDate(user.date_of_birth)}
                    readOnly
                  />
                </div>
                <div className="admin-form-group">
                  <label>Địa chỉ</label>
                  <input
                    className="admin-input"
                    value={user.address || "—"}
                    readOnly
                  />
                </div>
                <div className="admin-form-group">
                  <label>Trạng thái</label>
                  <input
                    className="admin-input"
                    value={
                      user.status === "active" ? "Hoạt động" : "Tạm khóa"
                    }
                    readOnly
                  />
                </div>
                <div className="admin-form-group">
                  <label>Ngày tạo</label>
                  <input
                    className="admin-input"
                    value={formatDate(user.created_at)}
                    readOnly
                  />
                </div>

                {user.doctor_profile && (
                  <div className="admin-form-group">
                    <label>Hồ sơ bác sĩ</label>
                    <input
                      className="admin-input"
                      value={`${user.doctor_profile.position || "Bác sĩ"} · ${user.doctor_profile.degree || "—"} · ${user.doctor_profile.experience_years ?? 0} năm KN`}
                      readOnly
                    />
                  </div>
                )}

                <div className="admin-form-actions">
                  <button
                    type="button"
                    className={`admin-btn ${
                      user.status === "active"
                        ? "admin-btn-danger"
                        : "admin-btn-primary"
                    }`}
                    onClick={handleToggleStatus}
                    disabled={toggling}
                  >
                    {toggling
                      ? "Đang xử lý..."
                      : user.status === "active"
                        ? "Khóa tài khoản"
                        : "Mở khóa tài khoản"}
                  </button>
                  <Link
                    to="/admin/users"
                    className="admin-btn admin-btn-secondary"
                  >
                    Quay lại danh sách
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

export default UserDetail;
