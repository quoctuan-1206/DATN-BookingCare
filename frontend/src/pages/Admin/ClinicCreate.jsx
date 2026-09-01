import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import AdminLayout from "../../components/admin/layout/AdminLayout";
import clinicService from "../../services/clinic.service";
import ImageUploadField from "../../components/admin/ImageUploadField";
import { getApiErrorMessage } from "../../api/axios";

function ClinicCreate() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    phone: "",
    email: "",
    description: "",
    image: "",
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
        name: formData.name,
        address: formData.address,
        phone: formData.phone || undefined,
        email: formData.email || undefined,
        description: formData.description || undefined,
        image: formData.image || undefined,
      };

      await clinicService.createClinic(payload);
      toast.success("Tạo phòng khám thành công");
      navigate("/admin/clinics");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không tạo được phòng khám"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout title="Thêm phòng khám">
      <div className="admin-page">
        <div className="admin-page-header">
          <div>
            <h3>Thêm phòng khám mới</h3>
            <p>Nhập thông tin phòng khám</p>
          </div>
          <div className="admin-page-actions">
            <Link
              to="/admin/clinics"
              className="admin-btn admin-btn-secondary"
            >
              Quay lại
            </Link>
          </div>
        </div>

        <div className="dashboard-card">
          <form className="admin-form" onSubmit={handleSubmit}>
            <div className="admin-form-group">
              <label htmlFor="name">Tên phòng khám</label>
              <input
                id="name"
                name="name"
                className="admin-input"
                type="text"
                placeholder="Nhập tên phòng khám"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="admin-form-group">
              <label htmlFor="address">Địa chỉ</label>
              <input
                id="address"
                name="address"
                className="admin-input"
                type="text"
                placeholder="Nhập địa chỉ"
                value={formData.address}
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
                type="text"
                placeholder="0281234567"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>

            <div className="admin-form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                name="email"
                className="admin-input"
                type="email"
                placeholder="info@clinic.vn"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <ImageUploadField
              label="Ảnh"
              inputId="image"
              aspect={3 / 2}
              value={formData.image}
              onChange={(url) =>
                setFormData((prev) => ({ ...prev, image: url }))
              }
            />

            <div className="admin-form-group">
              <label htmlFor="description">Mô tả</label>
              <textarea
                id="description"
                name="description"
                className="admin-textarea"
                placeholder="Mô tả ngắn về phòng khám"
                value={formData.description}
                onChange={handleChange}
              />
            </div>

            <div className="admin-form-actions">
              <button
                type="submit"
                className="admin-btn admin-btn-primary"
                disabled={loading}
              >
                {loading ? "Đang lưu..." : "Lưu phòng khám"}
              </button>
              <Link
                to="/admin/clinics"
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

export default ClinicCreate;
