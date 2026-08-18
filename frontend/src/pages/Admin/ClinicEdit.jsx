import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import AdminLayout from "../../components/admin/layout/AdminLayout";
import clinicService from "../../services/clinic.service";
import ImageUploadField from "../../components/admin/ImageUploadField";
import { getApiErrorMessage } from "../../api/axios";

function ClinicEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    phone: "",
    email: "",
    description: "",
    image: "",
  });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const clinic = await clinicService.getClinicById(id);
        if (cancelled) return;
        setFormData({
          name: clinic.name || "",
          address: clinic.address || "",
          phone: clinic.phone || "",
          email: clinic.email || "",
          description: clinic.description || "",
          image: clinic.image || "",
        });
      } catch (error) {
        if (!cancelled) {
          toast.error(
            getApiErrorMessage(error, "Không tải được phòng khám"),
          );
          navigate("/admin/clinics");
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
      await clinicService.updateClinic(id, {
        name: formData.name,
        address: formData.address,
        phone: formData.phone || undefined,
        email: formData.email || undefined,
        description: formData.description || undefined,
        image: formData.image || undefined,
      });
      toast.success("Đã cập nhật phòng khám");
      navigate("/admin/clinics");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không cập nhật được phòng khám"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout title="Sửa phòng khám">
      <div className="admin-page">
        <div className="admin-page-header">
          <div>
            <h3>Sửa phòng khám</h3>
            <p>Cập nhật thông tin phòng khám</p>
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
          {loading ? (
            <p>Đang tải...</p>
          ) : (
            <form className="admin-form" onSubmit={handleSubmit}>
              <div className="admin-form-group">
                <label htmlFor="name">Tên phòng khám</label>
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

              <div className="admin-form-group">
                <label htmlFor="address">Địa chỉ</label>
                <input
                  id="address"
                  name="address"
                  className="admin-input"
                  type="text"
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
                  value={formData.email}
                  onChange={handleChange}
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
                  to="/admin/clinics"
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

export default ClinicEdit;
