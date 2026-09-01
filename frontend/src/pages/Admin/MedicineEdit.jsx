import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import AdminLayout from "../../components/admin/layout/AdminLayout";
import medicineService from "../../services/medicine.service";
import { getApiErrorMessage } from "../../api/axios";

function MedicineEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    unit: "",
    price: "",
    description: "",
  });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const medicine = await medicineService.getById(id);
        if (cancelled) return;
        setFormData({
          name: medicine.name || "",
          unit: medicine.unit || "",
          price: medicine.price != null ? String(medicine.price) : "",
          description: medicine.description || "",
        });
      } catch (error) {
        if (!cancelled) {
          toast.error(getApiErrorMessage(error, "Không tải được thuốc"));
          navigate("/admin/medicines");
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
      await medicineService.update(id, {
        name: formData.name,
        unit: formData.unit || null,
        price: formData.price === "" ? null : Number(formData.price),
        description: formData.description || null,
      });
      toast.success("Đã cập nhật thuốc");
      navigate("/admin/medicines");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không cập nhật được thuốc"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout title="Sửa thuốc">
      <div className="admin-page">
        <div className="admin-page-header">
          <div>
            <h3>Sửa thuốc</h3>
            <p>Cập nhật thông tin thuốc trong danh mục</p>
          </div>
          <div className="admin-page-actions">
            <Link
              to="/admin/medicines"
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
                <label htmlFor="name">Tên thuốc</label>
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
                <label htmlFor="unit">Đơn vị</label>
                <input
                  id="unit"
                  name="unit"
                  className="admin-input"
                  type="text"
                  value={formData.unit}
                  onChange={handleChange}
                />
              </div>

              <div className="admin-form-group">
                <label htmlFor="price">Giá (VNĐ)</label>
                <input
                  id="price"
                  name="price"
                  className="admin-input"
                  type="number"
                  min={0}
                  step={100}
                  value={formData.price}
                  onChange={handleChange}
                />
              </div>

              <div className="admin-form-group">
                <label htmlFor="description">Mô tả / công dụng</label>
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
                  to="/admin/medicines"
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

export default MedicineEdit;
