import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import AdminLayout from "../../components/admin/layout/AdminLayout";
import articleService from "../../services/article.service";
import { getApiErrorMessage } from "../../api/axios";

function ArticleEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    image: "",
    article_type: "NEWS",
    reference_id: "",
    content: "",
    is_published: false,
  });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const article = await articleService.getArticleById(id);
        if (cancelled) return;

        setFormData({
          title: article.title || "",
          description: article.description || "",
          image: article.image || "",
          article_type: article.article_type || "NEWS",
          reference_id: article.reference_id || "",
          content: article.content || "",
          is_published: article.is_published === true,
        });
      } catch (error) {
        if (!cancelled) {
          toast.error(
            getApiErrorMessage(error, "Không tải được bài viết"),
          );
          navigate("/admin/articles");
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

  const buildPayload = (isPublished) => {
    const payload = {
      title: formData.title.trim(),
      description: formData.description.trim() || null,
      image: formData.image.trim() || null,
      article_type: formData.article_type,
      content: formData.content,
      is_published: isPublished,
      reference_id:
        formData.article_type !== "NEWS" && formData.reference_id
          ? Number(formData.reference_id)
          : null,
    };

    return payload;
  };

  const handleSubmit = async (e, isPublished) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error("Vui lòng nhập tiêu đề");
      return;
    }

    setSaving(true);
    try {
      await articleService.updateArticle(id, buildPayload(isPublished));
      toast.success(
        isPublished ? "Đã cập nhật và đăng bài" : "Đã lưu nháp",
      );
      navigate("/admin/articles");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không cập nhật được bài viết"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout title="Sửa bài viết">
      <div className="admin-page">
        <div className="admin-page-header">
          <div>
            <h3>Sửa bài viết</h3>
            <p>Cập nhật nội dung bài viết</p>
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
          {loading ? (
            <p>Đang tải...</p>
          ) : (
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
                  <label htmlFor="reference_id">ID tham chiếu</label>
                  <input
                    id="reference_id"
                    name="reference_id"
                    className="admin-input"
                    type="number"
                    min="1"
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
                  value={formData.description}
                  onChange={handleChange}
                />
              </div>

              <div className="admin-form-group">
                <label htmlFor="image">Ảnh (URL)</label>
                <input
                  id="image"
                  name="image"
                  className="admin-input"
                  type="text"
                  value={formData.image}
                  onChange={handleChange}
                />
              </div>

              <div className="admin-form-group">
                <label htmlFor="content">Nội dung</label>
                <textarea
                  id="content"
                  name="content"
                  className="admin-textarea"
                  style={{ minHeight: 220 }}
                  value={formData.content}
                  onChange={handleChange}
                />
              </div>

              <div className="admin-form-actions">
                <button
                  type="submit"
                  className="admin-btn admin-btn-primary"
                  disabled={saving}
                >
                  {saving ? "Đang lưu..." : "Cập nhật & đăng"}
                </button>
                <button
                  type="button"
                  className="admin-btn admin-btn-warning"
                  disabled={saving}
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
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

export default ArticleEdit;
