import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { Home, Search, X, ChevronDown } from "lucide-react";
import Header from "../../components/common/Header/Header";
import Footer from "../../components/common/Footer/Footer";
import ArticleCard from "../../components/article/ArticleCard";
import articleService from "../../services/article.service";
import { getApiErrorMessage } from "../../api/axios";

const ARTICLE_TYPES = [
  { value: "NEWS", label: "Tin tức" },
  { value: "SPECIALTY", label: "Chuyên khoa" },
  { value: "DOCTOR", label: "Bác sĩ" },
  { value: "CLINIC", label: "Phòng khám" },
];

function Articles() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [articleType, setArticleType] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const result = await articleService.getArticles({
          page: 1,
          limit: 100,
        });
        if (!cancelled) setArticles(result.data || []);
      } catch (error) {
        if (!cancelled) {
          setArticles([]);
          toast.error(
            getApiErrorMessage(error, "Không tải được danh sách bài viết"),
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    let list = articles;

    if (search.trim()) {
      const kw = search.trim().toLowerCase();
      list = list.filter(
        (item) =>
          item.title?.toLowerCase().includes(kw) ||
          item.description?.toLowerCase().includes(kw) ||
          item.category?.toLowerCase().includes(kw),
      );
    }

    if (articleType) {
      list = list.filter((item) => item.article_type === articleType);
    }

    return list;
  }, [articles, search, articleType]);

  const clearFilters = () => {
    setSearch("");
    setArticleType("");
  };

  const hasFilters = search.trim() || articleType;

  return (
    <>
      <Header />
      <div className="specialty-list-page">
        <div className="specialty-list-inner">
          <nav className="specialty-breadcrumb specialty-breadcrumb--list">
            <Link to="/">
              <Home size={16} />
            </Link>
            <span>/ Bài viết</span>
          </nav>

          <div className="specialty-toolbar">
            <div className="specialty-search-box">
              <Search size={18} className="specialty-search-icon" />
              <input
                type="text"
                className="specialty-search-input"
                placeholder="Tìm bài viết..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button
                  type="button"
                  className="specialty-search-clear"
                  onClick={() => setSearch("")}
                >
                  <X size={16} />
                </button>
              )}
            </div>

            <div className="specialty-dropdown-wrap">
              <ChevronDown size={16} className="specialty-dropdown-icon" />
              <select
                className="specialty-dropdown"
                value={articleType}
                onChange={(e) => setArticleType(e.target.value)}
              >
                <option value="">Tất cả loại bài</option>
                {ARTICLE_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {hasFilters && (
            <div className="specialty-filter-info">
              <span>
                Tìm thấy <strong>{filtered.length}</strong> bài viết
              </span>
              <button
                type="button"
                className="specialty-clear-btn"
                onClick={clearFilters}
              >
                Xóa bộ lọc
              </button>
            </div>
          )}

          {loading ? (
            <p>Đang tải danh sách bài viết...</p>
          ) : filtered.length === 0 ? (
            <p className="specialty-empty">Không tìm thấy bài viết phù hợp.</p>
          ) : (
            <div className="specialty-grid">
              {filtered.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}

export default Articles;
