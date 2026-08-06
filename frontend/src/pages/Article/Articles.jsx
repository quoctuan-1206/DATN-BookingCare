import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import Header from "../../components/common/Header/Header";
import Footer from "../../components/common/Footer/Footer";
import PageBanner from "../../components/common/PageBanner/PageBanner";
import articleService from "../../services/article.service";
import { getApiErrorMessage } from "../../api/axios";

function Articles() {
  const [articles, setArticles] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [keyword, setKeyword] = useState("");

  const fetchArticles = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page: 1, limit: 50 };
      if (keyword.trim()) params.search = keyword.trim();

      const result = await articleService.getArticles(params);
      setArticles(result.data);
      setTotal(result.pagination?.total ?? result.data.length);
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, "Không tải được danh sách bài viết"),
      );
      setArticles([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [keyword]);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  return (
    <>
      <Header />

      <div className="listing-page">
        <PageBanner
          variant="specialty"
          title="Bài viết"
          description="Tin tức và kiến thức sức khỏe từ hệ thống BookingCare."
        />

        <section className="listing-content">
          <div className="container listing-body">
            <div className="listing-toolbar">
              <form
                className="listing-filter"
                onSubmit={(e) => {
                  e.preventDefault();
                  setKeyword(search);
                }}
              >
                <div className="listing-filter__field">
                  <input
                    type="text"
                    placeholder="Tìm kiếm bài viết..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <div className="listing-filter__row">
                  <button
                    type="submit"
                    className="btn btn-primary listing-filter__btn"
                  >
                    Tìm kiếm
                  </button>
                </div>
              </form>

              <div className="listing-meta">
                <span>
                  Tìm thấy <strong>{total}</strong> bài viết
                </span>
              </div>
            </div>

            <div className="listing-results">
              {loading ? (
                <p>Đang tải danh sách bài viết...</p>
              ) : articles.length === 0 ? (
                <p>Không tìm thấy bài viết phù hợp.</p>
              ) : (
                <div className="listing-grid">
                  {articles.map((article) => (
                    <article key={article.id} className="listing-card">
                      <div className="listing-card__media">
                        <img src={article.image} alt={article.title} />
                        <span className="listing-card__badge">
                          {article.category}
                        </span>
                      </div>
                      <div className="listing-card__body">
                        <h3 className="listing-card__title">{article.title}</h3>
                        <p className="listing-card__desc">
                          {article.description || "Xem chi tiết bài viết."}
                        </p>
                        <div className="listing-card__footer">
                          <Link
                            to={`/articles/${article.id}`}
                            className="btn btn-primary"
                          >
                            Đọc bài
                          </Link>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      </div>

      <Footer />
    </>
  );
}

export default Articles;
