import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import AdminLayout from "../../components/admin/layout/AdminLayout";
import ClinicAdminForm from "../../components/admin/ClinicAdminForm";
import clinicService from "../../services/clinic.service";
import { getApiErrorMessage } from "../../api/axios";

const emptyClinic = {
  name: "",
  address: "",
  phone: "",
  email: "",
  description: "",
  specialties_content: "",
  equipment_content: "",
  image: "",
};

function ClinicCreate() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState(emptyClinic);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await clinicService.createClinic({
        ...formData,
        phone: formData.phone || undefined,
        email: formData.email || undefined,
        image: formData.image || undefined,
      });
      toast.success("Tạo cơ sở khám thành công");
      navigate("/admin/clinics");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không tạo được cơ sở khám"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout title="Thêm cơ sở khám">
      <div className="admin-page">
        <div className="admin-page-header">
          <div>
            <h3>Thêm cơ sở khám mới</h3>
            <p>Nhập thông tin và biên soạn nội dung hiển thị cho cơ sở khám.</p>
          </div>
          <div className="admin-page-actions">
            <Link to="/admin/clinics" className="admin-btn admin-btn-secondary">Quay lại</Link>
          </div>
        </div>
        <div className="dashboard-card">
          <ClinicAdminForm formData={formData} setFormData={setFormData}
            onSubmit={handleSubmit} saving={saving} submitLabel="Lưu cơ sở khám" />
        </div>
      </div>
    </AdminLayout>
  );
}

export default ClinicCreate;
