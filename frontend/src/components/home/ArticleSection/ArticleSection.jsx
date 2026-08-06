import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Card from "../../common/Card/Card";
import SectionHeader from "../../common/SectionHeader/SectionHeader";
import articleService from "../../../services/article.service";

function ArticleSection() {
  const [articles, setArticles] = useState([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const result = await articleService.getArticles({
          page: 1,
          limit: 4,
        });
        if (!cancelled) setArticles(result.data.slice(0, 4));
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
    <section className="section">
      <div className="container">
        <SectionHeader title="Bài viết nổi bật" viewMoreLink="/articles" />

        <div className="card-grid">
          {articles.map((item) => (
            <Link
              key={item.id}
              to={`/articles/${item.id}`}
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <Card image={item.image} title={item.title} />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export default ArticleSection;
