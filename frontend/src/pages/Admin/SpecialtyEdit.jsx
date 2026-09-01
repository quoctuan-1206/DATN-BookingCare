import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import AdminLayout from "../../components/admin/layout/AdminLayout";
import specialtyService from "../../services/specialty.service";
import ImageUploadField from "../../components/admin/ImageUploadField";
import { getApiErrorMessage } from "../../api/axios";

function SpecialtyEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    image: "",
  });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const specialty = await specialtyService.getSpecialtyById(id);
        if (cancelled) return;
        setFormData({
          name: specialty.name || "",
          description: specialty.description || "",
          image: specialty.image || "",
        });
      } catch (error) {
        if (!cancelled) {
          toast.error(
            getApiErrorMessage(error, "Không tải được chuyên khoa"),
          );
          navigate("/admin/specialties");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [id, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      await specialtyService.updateSpecialty(id, {
        name: formData.name,
        description: formData.description || undefined,
        image: formData.image || undefined,
      });
      toast.success("Đã cập nhật chuyên khoa");
      navigate("/admin/specialties");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không cập nhật được chuyên khoa"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout title="Sửa chuyên khoa">
      <div className="admin-page">
        <div className="admin-page-header">
          <div>
            <h3>Sửa chuyên khoa</h3>
            <p>Cập nhật thông tin chuyên khoa</p>
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
          {loading ? (
            <p>Đang tải...</p>
          ) : (
            <form className="admin-form" onSubmit={handleSubmit}>
              <div className="admin-form-group">
                <label htmlFor="name">Tên chuyên khoa</label>
                <input
                  id="name"
                  name="name"
                  className="admin-input"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  required
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
                  value={formData.description}
                  onChange={handleChange}
                />
              </div>

              <div className="admin-form-actions">
                <button
                  type="submit"
                  className="admin-btn admin-btn-primary"
                  disabled={saving}
                >
                  {saving ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
                <Link
                  to="/admin/specialties"
                  className="admin-btn admin-btn-secondary"
                >
                  Hủy
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

export default SpecialtyEdit;
