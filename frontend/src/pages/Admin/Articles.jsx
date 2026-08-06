import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import toast from "react-hot-toast";
import AdminLayout from "../../components/admin/layout/AdminLayout";
import articleService from "../../services/article.service";
import { getApiErrorMessage } from "../../api/axios";

function formatDate(value) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString("vi-VN");
  } catch {
    return "—";
  }
}

function Articles() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [articleType, setArticleType] = useState("");
  const [status, setStatus] = useState("");
  const [filters, setFilters] = useState({
    search: "",
    article_type: "",
    status: "",
  });

  const fetchArticles = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page: 1, limit: 100 };
      if (filters.search.trim()) params.search = filters.search.trim();
      if (filters.article_type) params.article_type = filters.article_type;
      if (filters.status === "published") params.is_published = "true";
      if (filters.status === "draft") params.is_published = "false";

      const result = await articleService.getArticles(params);
      setArticles(result.data.filter((a) => a.is_active !== false));
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, "Không tải được danh sách bài viết"),
      );
      setArticles([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  const applyFilters = () => {
    setFilters({
      search,
      article_type: articleType,
      status,
    });
  };

  const handleDelete = async (article) => {
    const ok = window.confirm(`Xóa bài viết "${article.title}"?`);
    if (!ok) return;

    try {
      await articleService.deleteArticle(article.id);
      toast.success("Đã xóa bài viết");
      fetchArticles();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không xóa được bài viết"));
    }
  };

  return (
    <AdminLayout title="Bài viết">
      <div className="admin-page">
        <div className="admin-page-header">
          <div>
            <h3>Quản lý bài viết</h3>
            <p>Danh sách bài viết trên hệ thống</p>
          </div>
          <div className="admin-page-actions">
            <Link
              to="/admin/articles/create"
              className="admin-btn admin-btn-primary"
            >
              <Plus size={16} />
              Viết bài mới
            </Link>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="admin-toolbar">
            <input
              className="admin-input"
              type="text"
              placeholder="Tìm bài viết..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") applyFilters();
              }}
            />
            <select
              className="admin-select"
              style={{ maxWidth: 180 }}
              value={articleType}
              onChange={(e) => setArticleType(e.target.value)}
            >
              <option value="">Tất cả loại</option>
              <option value="NEWS">Tin tức</option>
              <option value="SPECIALTY">Chuyên khoa</option>
              <option value="CLINIC">Phòng khám</option>
              <option value="DOCTOR">Bác sĩ</option>
            </select>
            <select
              className="admin-select"
              style={{ maxWidth: 160 }}
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">Tất cả trạng thái</option>
              <option value="published">Đã đăng</option>
              <option value="draft">Nháp</option>
            </select>
            <button
              type="button"
              className="admin-btn admin-btn-primary"
              onClick={applyFilters}
            >
              Tìm
            </button>
          </div>

          <div className="table-wrapper">
            {loading ? (
              <p>Đang tải...</p>
            ) : articles.length === 0 ? (
              <p>Không có bài viết nào.</p>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Tiêu đề</th>
                    <th>Tác giả</th>
                    <th>Loại</th>
                    <th>Ngày</th>
                    <th>Trạng thái</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {articles.map((article) => (
                    <tr key={article.id}>
                      <td>
                        <strong>{article.title}</strong>
                      </td>
                      <td>{article.author}</td>
                      <td>{article.category}</td>
                      <td>{formatDate(article.created_at)}</td>
                      <td>
                        <span
                          className={`status ${
                            article.status === "published"
                              ? "confirmed"
                              : "pending"
                          }`}
                        >
                          {article.status === "published"
                            ? "Đã đăng"
                            : "Nháp"}
                        </span>
                      </td>
                      <td style={{ display: "flex", gap: 8 }}>
                        <Link
                          to={`/admin/articles/${article.id}/edit`}
                          className="admin-btn admin-btn-secondary"
                        >
                          Sửa
                        </Link>
                        <button
                          type="button"
                          className="admin-btn admin-btn-danger"
                          onClick={() => handleDelete(article)}
                        >
                          Xóa
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

export default Articles;
