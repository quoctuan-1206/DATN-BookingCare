import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import SectionHeader from "../../common/SectionHeader/SectionHeader";
import HomeCardSlider from "../HomeCardSlider/HomeCardSlider";
import articleService from "../../../services/article.service";

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
    <section className="section">
      <div className="home-section">
        <SectionHeader title="Bài viết nổi bật" viewMoreLink="/articles" />

        <HomeCardSlider>
          {articles.map((item) => (
            <Link
              key={item.id}
              to={`/articles/${item.id}`}
              className="card home-card"
            >
              <img src={item.image} alt={item.title} />
              <h3>{item.title}</h3>
            </Link>
          ))}
        </HomeCardSlider>
      </div>
    </section>
  );
}

export default ArticleSection;
