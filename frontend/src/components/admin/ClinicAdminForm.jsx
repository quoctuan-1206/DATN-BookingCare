import { Link } from "react-router-dom";
import ImageUploadField from "./ImageUploadField";
import RichTextEditor from "./RichTextEditor";

function ClinicAdminForm({ formData, setFormData, onSubmit, saving, submitLabel }) {
  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
  };

  const setContent = (name) => (value) => {
    setFormData((previous) => ({ ...previous, [name]: value }));
  };

  return (
    <form className="admin-form admin-clinic-form" onSubmit={onSubmit}>
      <div className="admin-form-section">
        <div className="admin-form-section__heading">
          <h4>Thông tin cơ bản</h4>
          <p>Thông tin nhận diện và liên hệ của cơ sở khám.</p>
        </div>
        <div className="admin-clinic-form__grid">
          <div className="admin-form-group admin-clinic-form__wide">
            <label htmlFor="name">Tên cơ sở khám</label>
            <input id="name" name="name" className="admin-input" type="text"
              placeholder="Nhập tên cơ sở khám" value={formData.name} onChange={handleChange} required />
          </div>
          <div className="admin-form-group admin-clinic-form__wide">
            <label htmlFor="address">Địa chỉ</label>
            <input id="address" name="address" className="admin-input" type="text"
              placeholder="Nhập địa chỉ" value={formData.address} onChange={handleChange} required />
          </div>
          <div className="admin-form-group">
            <label htmlFor="phone">Số điện thoại</label>
            <input id="phone" name="phone" className="admin-input" type="text"
              placeholder="0281234567" value={formData.phone} onChange={handleChange} />
          </div>
          <div className="admin-form-group">
            <label htmlFor="email">Email</label>
            <input id="email" name="email" className="admin-input" type="email"
              placeholder="info@clinic.vn" value={formData.email} onChange={handleChange} />
          </div>
          <div className="admin-clinic-form__wide">
            <ImageUploadField label="Ảnh đại diện" inputId="image" aspect={3 / 2}
              value={formData.image}
              onChange={(url) => setFormData((previous) => ({ ...previous, image: url }))} />
          </div>
        </div>
      </div>

      <div className="admin-form-section">
        <div className="admin-form-section__heading">
          <h4>Nội dung trang cơ sở khám</h4>
          <p>Soạn và định dạng nội dung giống trình soạn thảo văn bản.</p>
        </div>
        <RichTextEditor id="description" label="Giới thiệu"
          placeholder="Nhập nội dung giới thiệu tổng quan về cơ sở khám..."
          value={formData.description} onChange={setContent("description")} />
        <RichTextEditor id="specialties_content" label="Thế mạnh chuyên môn"
          placeholder="Mô tả các chuyên khoa, kỹ thuật hoặc dịch vụ nổi bật..."
          value={formData.specialties_content} onChange={setContent("specialties_content")} />
        <RichTextEditor id="equipment_content" label="Trang thiết bị"
          placeholder="Mô tả máy móc, công nghệ và cơ sở vật chất..."
          value={formData.equipment_content} onChange={setContent("equipment_content")} />
      </div>

      <div className="admin-form-actions">
        <button type="submit" className="admin-btn admin-btn-primary" disabled={saving}>
          {saving ? "Đang lưu..." : submitLabel}
        </button>
        <Link to="/admin/clinics" className="admin-btn admin-btn-secondary">Hủy</Link>
      </div>
    </form>
  );
}

export default ClinicAdminForm;
