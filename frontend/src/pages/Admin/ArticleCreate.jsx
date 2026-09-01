import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import AdminLayout from "../../components/admin/layout/AdminLayout";
import articleService from "../../services/article.service";
import ImageUploadField from "../../components/admin/ImageUploadField";
import { getApiErrorMessage } from "../../api/axios";

const emptyForm = {
  title: "",
  description: "",
  image: "",
  article_type: "NEWS",
  reference_id: "",
  content: "",
};

function ArticleCreate() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(emptyForm);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const buildPayload = (isPublished) => {
    const payload = {
      title: formData.title.trim(),
      description: formData.description.trim() || undefined,
      image: formData.image.trim() || undefined,
      article_type: formData.article_type,
      content: formData.content,
      is_published: isPublished,
    };

    if (formData.reference_id) {
      payload.reference_id = Number(formData.reference_id);
    }

    return payload;
  };

  const handleSubmit = async (e, isPublished) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error("Vui lòng nhập tiêu đề");
      return;
    }

    setLoading(true);
    try {
      await articleService.createArticle(buildPayload(isPublished));
      toast.success(
        isPublished ? "Đăng bài viết thành công" : "Đã lưu nháp",
      );
      navigate("/admin/articles");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không tạo được bài viết"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout title="Viết bài mới">
      <div className="admin-page">
        <div className="admin-page-header">
          <div>
            <h3>Viết bài mới</h3>
            <p>Tạo nội dung bài viết cho hệ thống</p>
          </div>
          <div className="admin-page-actions">
            <Link
              to="/admin/articles"
              className="admin-btn admin-btn-secondary"
            >
              Quay lại
            </Link>
          </div>
        </div>

        <div className="dashboard-card">
          <form
            className="admin-form"
            onSubmit={(e) => handleSubmit(e, true)}
          >
            <div className="admin-form-group">
              <label htmlFor="title">Tiêu đề</label>
              <input
                id="title"
                name="title"
                className="admin-input"
                type="text"
                placeholder="Nhập tiêu đề bài viết"
                value={formData.title}
                onChange={handleChange}
                required
              />
            </div>

            <div className="admin-form-group">
              <label htmlFor="article_type">Loại bài viết</label>
              <select
                id="article_type"
                name="article_type"
                className="admin-select"
                value={formData.article_type}
                onChange={handleChange}
              >
                <option value="NEWS">Tin tức</option>
                <option value="SPECIALTY">Chuyên khoa</option>
                <option value="CLINIC">Phòng khám</option>
                <option value="DOCTOR">Bác sĩ</option>
              </select>
            </div>

            {formData.article_type !== "NEWS" && (
              <div className="admin-form-group">
                <label htmlFor="reference_id">
                  ID tham chiếu ({formData.article_type.toLowerCase()})
                </label>
                <input
                  id="reference_id"
                  name="reference_id"
                  className="admin-input"
                  type="number"
                  min="1"
                  placeholder="Ví dụ: 1"
                  value={formData.reference_id}
                  onChange={handleChange}
                />
              </div>
            )}

            <div className="admin-form-group">
              <label htmlFor="description">Mô tả ngắn</label>
              <input
                id="description"
                name="description"
                className="admin-input"
                type="text"
                placeholder="Tóm tắt bài viết"
                value={formData.description}
                onChange={handleChange}
              />
            </div>

            <ImageUploadField
              label="Ảnh"
              inputId="image"
              aspect={16 / 9}
              value={formData.image}
              onChange={(url) =>
                setFormData((prev) => ({ ...prev, image: url }))
              }
            />

            <div className="admin-form-group">
              <label htmlFor="content">Nội dung</label>
              <textarea
                id="content"
                name="content"
                className="admin-textarea"
                placeholder="Nhập nội dung bài viết"
                style={{ minHeight: 220 }}
                value={formData.content}
                onChange={handleChange}
              />
            </div>

            <div className="admin-form-actions">
              <button
                type="submit"
                className="admin-btn admin-btn-primary"
                disabled={loading}
              >
                {loading ? "Đang lưu..." : "Đăng bài"}
              </button>
              <button
                type="button"
                className="admin-btn admin-btn-warning"
                disabled={loading}
                onClick={(e) => handleSubmit(e, false)}
              >
                Lưu nháp
              </button>
              <Link
                to="/admin/articles"
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

export default ArticleCreate;
