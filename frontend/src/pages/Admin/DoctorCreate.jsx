import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import AdminLayout from "../../components/admin/layout/AdminLayout";
import doctorService from "../../services/doctor.service";
import { getApiErrorMessage } from "../../api/axios";

function DoctorCreate() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    last_name: "",
    first_name: "",
    email: "",
    phone: "",
    password: "123456",
    specialty_id: "",
    clinic_id: "",
    degree: "",
    position: "",
    room: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        email: formData.email,
        password: formData.password || "123456",
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: formData.phone || undefined,
        degree: formData.degree || undefined,
        position: formData.position || undefined,
        room: formData.room || undefined,
      };

      if (formData.specialty_id) {
        payload.specialty_id = Number(formData.specialty_id);
      }
      if (formData.clinic_id) {
        payload.clinic_id = Number(formData.clinic_id);
      }

      await doctorService.createDoctor(payload);
      toast.success("Tạo tài khoản bác sĩ thành công");
      navigate("/admin/doctors");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không tạo được bác sĩ"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout title="Thêm bác sĩ">
      <div className="admin-page">
        <div className="admin-page-header">
          <div>
            <h3>Cấp tài khoản bác sĩ</h3>
            <p>Admin tạo tài khoản đăng nhập và hồ sơ bác sĩ</p>
          </div>
          <div className="admin-page-actions">
            <Link
              to="/admin/doctors"
              className="admin-btn admin-btn-secondary"
            >
              Quay lại
            </Link>
          </div>
        </div>

        <div className="dashboard-card">
          <form className="admin-form" onSubmit={handleSubmit}>
            <div className="admin-form-group">
              <label htmlFor="last_name">Họ</label>
              <input
                id="last_name"
                name="last_name"
                className="admin-input"
                type="text"
                placeholder="Nguyễn"
                value={formData.last_name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="admin-form-group">
              <label htmlFor="first_name">Tên</label>
              <input
                id="first_name"
                name="first_name"
                className="admin-input"
                type="text"
                placeholder="Văn A"
                value={formData.first_name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="admin-form-group">
              <label htmlFor="email">Email đăng nhập</label>
              <input
                id="email"
                name="email"
                className="admin-input"
                type="email"
                placeholder="bs.moi@gmail.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="admin-form-group">
              <label htmlFor="password">Mật khẩu tạm</label>
              <input
                id="password"
                name="password"
                className="admin-input"
                type="text"
                placeholder="123456"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={6}
              />
            </div>

            <div className="admin-form-group">
              <label htmlFor="phone">Số điện thoại</label>
              <input
                id="phone"
                name="phone"
                className="admin-input"
                type="text"
                placeholder="0901234567"
                value={formData.phone}
                onChange={handleChange}
              />
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
              <label htmlFor="specialty_id">Chuyên khoa</label>
              <select
                id="specialty_id"
                name="specialty_id"
                className="admin-select"
                value={formData.specialty_id}
                onChange={handleChange}
              >
                <option value="">Chọn chuyên khoa</option>
                <option value="1">Tim mạch</option>
                <option value="2">Da liễu</option>
                <option value="3">Nhi khoa</option>
                <option value="4">Tai Mũi Họng</option>
              </select>
            </div>

            <div className="admin-form-group">
              <label htmlFor="clinic_id">Phòng khám</label>
              <select
                id="clinic_id"
                name="clinic_id"
                className="admin-select"
                value={formData.clinic_id}
                onChange={handleChange}
              >
                <option value="">Chọn phòng khám</option>
                <option value="1">Bệnh viện Chợ Rẫy</option>
                <option value="2">Bệnh viện Bạch Mai</option>
                <option value="3">Bệnh viện Đại học Y Dược</option>
              </select>
            </div>

            <div className="admin-form-group">
              <label htmlFor="room">Phòng khám</label>
              <input
                id="room"
                name="room"
                className="admin-input"
                type="text"
                placeholder="P.201"
                value={formData.room}
                onChange={handleChange}
              />
            </div>

            <div className="admin-form-actions">
              <button
                type="submit"
                className="admin-btn admin-btn-primary"
                disabled={loading}
              >
                {loading ? "Đang tạo..." : "Cấp tài khoản bác sĩ"}
              </button>
              <Link
                to="/admin/doctors"
                className="admin-btn admin-btn-secondary"
              >
                Hủy
              </Link>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
}

export default DoctorCreate;
