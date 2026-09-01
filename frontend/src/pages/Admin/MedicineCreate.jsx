import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import AdminLayout from "../../components/admin/layout/AdminLayout";
import medicineService from "../../services/medicine.service";
import { getApiErrorMessage } from "../../api/axios";

function MedicineCreate() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    unit: "",
    price: "",
    description: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await medicineService.create({
        name: formData.name,
        unit: formData.unit || null,
        price: formData.price === "" ? null : Number(formData.price),
        description: formData.description || null,
      });
      toast.success("Thêm thuốc thành công");
      navigate("/admin/medicines");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không thêm được thuốc"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout title="Thêm thuốc">
      <div className="admin-page">
        <div className="admin-page-header">
          <div>
            <h3>Thêm thuốc mới</h3>
            <p>Thuốc sẽ hiển thị trong danh sách kê đơn của bác sĩ</p>
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
          <form className="admin-form" onSubmit={handleSubmit}>
            <div className="admin-form-group">
              <label htmlFor="name">Tên thuốc</label>
              <input
                id="name"
                name="name"
                className="admin-input"
                type="text"
                placeholder="Ví dụ: Paracetamol 500mg"
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
                placeholder="Ví dụ: viên, chai, gói"
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
                placeholder="1500"
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
                placeholder="Ví dụ: Hạ sốt, giảm đau"
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
                {loading ? "Đang lưu..." : "Lưu thuốc"}
              </button>
              <Link
                to="/admin/medicines"
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

export default MedicineCreate;
