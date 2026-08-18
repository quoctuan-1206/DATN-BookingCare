import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import AdminLayout from "../../components/admin/layout/AdminLayout";
import doctorService from "../../services/doctor.service";
import ImageUploadField from "../../components/admin/ImageUploadField";
import { getApiErrorMessage } from "../../api/axios";

function DoctorEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    last_name: "",
    first_name: "",
    phone: "",
    degree: "",
    position: "",
    biography: "",
    avatar: "",
  });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const doctor = await doctorService.getDoctorById(id);
        if (cancelled) return;
        setFormData({
          last_name: doctor.last_name || "",
          first_name: doctor.first_name || "",
          phone: doctor.phone || "",
          degree: doctor.degree || "",
          position: doctor.position || "",
          biography: doctor.biography || "",
          avatar: doctor.avatar || doctor.image || "",
        });
      } catch (error) {
        if (!cancelled) {
          toast.error(getApiErrorMessage(error, "Không tải được bác sĩ"));
          navigate("/admin/doctors");
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
      await doctorService.updateDoctor(id, {
        last_name: formData.last_name,
        first_name: formData.first_name,
        phone: formData.phone || undefined,
        degree: formData.degree || undefined,
        position: formData.position || undefined,
        biography: formData.biography || undefined,
        avatar: formData.avatar || undefined,
      });
      toast.success("Đã cập nhật bác sĩ");
      navigate("/admin/doctors");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không cập nhật được bác sĩ"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout title="Sửa bác sĩ">
      <div className="admin-page">
        <div className="admin-page-header">
          <div>
            <h3>Sửa thông tin bác sĩ</h3>
            <p>Cập nhật hồ sơ bác sĩ</p>
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
          {loading ? (
            <p>Đang tải...</p>
          ) : (
            <form className="admin-form" onSubmit={handleSubmit}>
              <div className="admin-form-group">
                <label htmlFor="last_name">Họ</label>
                <input
                  id="last_name"
                  name="last_name"
                  className="admin-input"
                  type="text"
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
                  value={formData.first_name}
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
                <label htmlFor="degree">Học vị</label>
                <input
                  id="degree"
                  name="degree"
                  className="admin-input"
                  type="text"
                  value={formData.degree}
                  onChange={handleChange}
                />
              </div>

              <div className="admin-form-group">
                <label htmlFor="position">Chức danh</label>
                <input
                  id="position"
                  name="position"
                  className="admin-input"
                  type="text"
                  value={formData.position}
                  onChange={handleChange}
                />
              </div>

              <ImageUploadField
                label="Ảnh đại diện"
                inputId="avatar"
                value={formData.avatar}
                onChange={(url) =>
                  setFormData((prev) => ({ ...prev, avatar: url }))
                }
              />

              <div className="admin-form-group">
                <label htmlFor="biography">Tiểu sử</label>
                <textarea
                  id="biography"
                  name="biography"
                  className="admin-textarea"
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
                  {saving ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
                <Link
                  to="/admin/doctors"
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

export default DoctorEdit;
