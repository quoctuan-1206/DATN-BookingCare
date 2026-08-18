import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import AdminLayout from "../../components/admin/layout/AdminLayout";
import specialtyService from "../../services/specialty.service";
import ImageUploadField from "../../components/admin/ImageUploadField";
import { getApiErrorMessage } from "../../api/axios";

function SpecialtyCreate() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
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
      await specialtyService.createSpecialty({
        name: formData.name,
        description: formData.description || undefined,
        image: formData.image || undefined,
      });
      toast.success("Tạo chuyên khoa thành công");
      navigate("/admin/specialties");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không tạo được chuyên khoa"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout title="Thêm chuyên khoa">
      <div className="admin-page">
        <div className="admin-page-header">
          <div>
            <h3>Thêm chuyên khoa mới</h3>
            <p>Nhập thông tin chuyên khoa</p>
          </div>
          <div className="admin-page-actions">
            <Link
              to="/admin/specialties"
              className="admin-btn admin-btn-secondary"
            >
              Quay lại
            </Link>
          </div>
        </div>

        <div className="dashboard-card">
          <form className="admin-form" onSubmit={handleSubmit}>
            <div className="admin-form-group">
              <label htmlFor="name">Tên chuyên khoa</label>
              <input
                id="name"
                name="name"
                className="admin-input"
                type="text"
                placeholder="Ví dụ: Tim mạch"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <ImageUploadField
              label="Ảnh"
              inputId="image"
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
                placeholder="Mô tả chuyên khoa"
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
                {loading ? "Đang lưu..." : "Lưu chuyên khoa"}
              </button>
              <Link
                to="/admin/specialties"
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

export default SpecialtyCreate;
