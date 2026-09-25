import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarDays } from "lucide-react";
import SectionHeader from "../../common/SectionHeader/SectionHeader";
import articleService from "../../../services/article.service";

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("vi-VN");
}

function ArticleSection() {
  const [articles, setArticles] = useState([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const result = await articleService.getArticles({
          page: 1,
          limit: 12,
        });
        if (!cancelled) setArticles(result.data || []);
      } catch {
        if (!cancelled) setArticles([]);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="section home-modern-section home-article-section">
      <div className="home-content-container">
        <SectionHeader
          title="Bài viết"
          viewMoreLink="/articles"
          viewMoreLabel="Xem tất cả"
        />

        {articles.length === 0 ? (
          <p className="home-section-empty">Các bài viết mới đang được cập nhật.</p>
        ) : (
          <div className="home-article-grid">
            {articles.slice(0, 3).map((item) => (
              <article key={item.id} className="home-article-card">
                <Link className="home-article-photo" to={`/articles/${item.id}`}>
                  <img src={item.image} alt={item.title} loading="lazy" />
                </Link>

                <div className="home-article-body">
                  <span className="home-article-category">
                    {item.category || "Sức khỏe"}
                  </span>
                  <Link className="home-card-title" to={`/articles/${item.id}`}>
                    {item.title}
                  </Link>
                  <p className="home-article-description">
                    {item.description || "Cập nhật kiến thức chăm sóc sức khỏe hữu ích cùng MediUTE."}
                  </p>
                  <time className="home-article-date" dateTime={item.created_at || undefined}>
                    <CalendarDays size={15} />
                    {formatDate(item.created_at) || "Mới cập nhật"}
                  </time>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default ArticleSection;
