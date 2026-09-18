import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
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

function ClinicEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState(emptyClinic);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const clinic = await clinicService.getClinicById(id);
        if (!cancelled) {
          setFormData({
            name: clinic.name || "",
            address: clinic.address || "",
            phone: clinic.phone || "",
            email: clinic.email || "",
            description: clinic.description || "",
            specialties_content: clinic.specialties_content || "",
            equipment_content: clinic.equipment_content || "",
            image: clinic.image || "",
          });
        }
      } catch (error) {
        if (!cancelled) {
          toast.error(getApiErrorMessage(error, "Không tải được cơ sở khám"));
          navigate("/admin/clinics");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [id, navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await clinicService.updateClinic(id, {
        ...formData,
        phone: formData.phone || null,
        email: formData.email || null,
        image: formData.image || null,
      });
      toast.success("Đã cập nhật cơ sở khám");
      navigate("/admin/clinics");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không cập nhật được cơ sở khám"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout title="Sửa cơ sở khám">
      <div className="admin-page">
        <div className="admin-page-header">
          <div>
            <h3>Sửa cơ sở khám</h3>
            <p>Cập nhật thông tin và nội dung hiển thị của cơ sở khám.</p>
          </div>
          <div className="admin-page-actions">
            <Link to="/admin/clinics" className="admin-btn admin-btn-secondary">Quay lại</Link>
          </div>
        </div>
        <div className="dashboard-card">
          {loading ? (
            <p>Đang tải...</p>
          ) : (
            <ClinicAdminForm formData={formData} setFormData={setFormData}
              onSubmit={handleSubmit} saving={saving} submitLabel="Lưu thay đổi" />
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

export default ClinicEdit;
