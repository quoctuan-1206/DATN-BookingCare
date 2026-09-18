import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import AdminLayout from "../../components/admin/layout/AdminLayout";
import userService from "../../services/user.service";
import { getApiErrorMessage } from "../../api/axios";

const roleClass = {
  Admin: "admin",
  Doctor: "doctor",
  Patient: "patient",
  Receptionist: "patient",
  STAFF: "doctor",
};

const roleLabel = {
  Admin: "Admin",
  Doctor: "Bác sĩ",
  Patient: "Bệnh nhân",
  Receptionist: "Tiếp tân",
  STAFF: "Nhân viên xét nghiệm",
};

function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const [filters, setFilters] = useState({
    search: "",
    role: "",
    status: "",
  });
  const [showStaffForm, setShowStaffForm] = useState(false);
  const [staffForm, setStaffForm] = useState({ email: "", password: "", first_name: "", last_name: "", phone: "" });

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page: 1, limit: 100 };
      if (filters.search.trim()) params.search = filters.search.trim();
      if (filters.role) params.role = filters.role;
      if (filters.status === "active") params.is_active = "true";
      if (filters.status === "inactive") params.is_active = "false";

      const result = await userService.getUsers(params);
      setUsers(result.data);
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, "Không tải được danh sách người dùng"),
      );
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const applyFilters = () => {
    setFilters({ search, role, status });
  };

  const handleToggleStatus = async (user) => {
    const nextActive = user.status !== "active";
    const action = nextActive ? "mở khóa" : "khóa";
    const ok = window.confirm(
      `Bạn có chắc muốn ${action} tài khoản "${user.name}"?`,
    );
    if (!ok) return;

    try {
      await userService.updateUserStatus(user.id, nextActive);
      toast.success(nextActive ? "Đã mở khóa tài khoản" : "Đã khóa tài khoản");
      fetchUsers();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không cập nhật được trạng thái"));
    }
  };

  const handleCreateStaff = async (event) => {
    event.preventDefault();
    try {
      await userService.createStaff({ ...staffForm, phone: staffForm.phone || null });
      setStaffForm({ email: "", password: "", first_name: "", last_name: "", phone: "" });
      setShowStaffForm(false);
      toast.success("Đã tạo tài khoản STAFF");
      fetchUsers();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không tạo được tài khoản STAFF"));
    }
  };

  return (
    <AdminLayout title="Người dùng">
      <div className="admin-page">
        <div className="admin-page-header">
          <div>
            <h3>Quản lý người dùng</h3>
            <p>Xem, tìm kiếm và khóa/mở tài khoản</p>
          </div>
          <button type="button" className="admin-btn admin-btn-primary" onClick={() => setShowStaffForm((value) => !value)}>
            {showStaffForm ? "Đóng" : "Thêm STAFF"}
          </button>
        </div>

        {showStaffForm && (
          <div className="dashboard-card" style={{ marginBottom: 20 }}>
            <h3 style={{ marginBottom: 16 }}>Tạo nhân viên xét nghiệm</h3>
            <form className="admin-form" onSubmit={handleCreateStaff}>
              <div className="admin-form-group"><label>Họ</label><input className="admin-input" value={staffForm.last_name} onChange={(e) => setStaffForm((v) => ({ ...v, last_name: e.target.value }))} required /></div>
              <div className="admin-form-group"><label>Tên</label><input className="admin-input" value={staffForm.first_name} onChange={(e) => setStaffForm((v) => ({ ...v, first_name: e.target.value }))} required /></div>
              <div className="admin-form-group"><label>Email</label><input className="admin-input" type="email" value={staffForm.email} onChange={(e) => setStaffForm((v) => ({ ...v, email: e.target.value }))} required /></div>
              <div className="admin-form-group"><label>Mật khẩu</label><input className="admin-input" type="password" minLength={6} value={staffForm.password} onChange={(e) => setStaffForm((v) => ({ ...v, password: e.target.value }))} required /></div>
              <div className="admin-form-group"><label>Số điện thoại</label><input className="admin-input" value={staffForm.phone} onChange={(e) => setStaffForm((v) => ({ ...v, phone: e.target.value }))} /></div>
              <div className="admin-form-actions"><button className="admin-btn admin-btn-primary">Tạo tài khoản</button></div>
            </form>
          </div>
        )}

        <div className="dashboard-card">
          <div className="admin-toolbar">
            <input
              className="admin-input"
              type="text"
              placeholder="Tìm theo tên, email, SĐT..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") applyFilters();
              }}
            />
            <select
              className="admin-select"
              style={{ maxWidth: 180 }}
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="">Tất cả vai trò</option>
              <option value="Admin">Admin</option>
              <option value="Doctor">Bác sĩ</option>
              <option value="Patient">Bệnh nhân</option>
              <option value="Receptionist">Tiếp tân</option>
              <option value="STAFF">Nhân viên xét nghiệm</option>
            </select>
            <select
              className="admin-select"
              style={{ maxWidth: 160 }}
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">Tất cả trạng thái</option>
              <option value="active">Hoạt động</option>
              <option value="inactive">Tạm khóa</option>
            </select>
            <button
              type="button"
              className="admin-btn admin-btn-primary"
              onClick={applyFilters}
            >
              Tìm
            </button>
          </div>

          <div className="table-wrapper">
            {loading ? (
              <p>Đang tải...</p>
            ) : users.length === 0 ? (
              <p>Không tìm thấy người dùng.</p>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Người dùng</th>
                    <th>Vai trò</th>
                    <th>Trạng thái</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td>
                        <div className="table-user">
                          <img
                            className="table-avatar"
                            src={user.avatar}
                            alt={user.name}
                          />
                          <div className="table-user-info">
                            <strong>{user.name}</strong>
                            <span>{user.email}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span
                          className={`role ${roleClass[user.role] || "patient"}`}
                        >
                          {roleLabel[user.role] || user.role}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`status ${
                            user.status === "active"
                              ? "confirmed"
                              : "cancelled"
                          }`}
                        >
                          {user.status === "active"
                            ? "Hoạt động"
                            : "Tạm khóa"}
                        </span>
                      </td>
                      <td style={{ display: "flex", gap: 8 }}>
                        <Link
                          to={`/admin/users/${user.id}`}
                          className="admin-btn admin-btn-secondary"
                        >
                          Xem
                        </Link>
                        <button
                          type="button"
                          className={`admin-btn ${
                            user.status === "active"
                              ? "admin-btn-danger"
                              : "admin-btn-primary"
                          }`}
                          onClick={() => handleToggleStatus(user)}
                        >
                          {user.status === "active" ? "Khóa" : "Mở khóa"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

export default Users;
