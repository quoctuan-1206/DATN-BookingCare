import { Link } from "react-router-dom";
import { Calendar, ChevronRight } from "lucide-react";

function formatDate(value) {
  if (!value) return "";
  try {
    return new Date(value).toLocaleDateString("vi-VN");
  } catch {
    return "";
  }
}

function ArticleCard({ article }) {
  const desc = article.description || "";
  const shortDesc = desc.length > 90 ? `${desc.slice(0, 90).trim()}...` : desc;

  return (
    <Link to={`/articles/${article.id}`} className="specialty-card">
      <div className="specialty-card-image">
        <img src={article.image} alt={article.title} />
      </div>

      <div className="specialty-card-body">
        <h3 className="specialty-card-title">{article.title}</h3>

        {shortDesc ? <p className="specialty-card-desc">{shortDesc}</p> : null}

        <div className="specialty-card-stats">
          {article.category ? (
            <span className="specialty-card-stat">{article.category}</span>
          ) : null}
          {article.created_at ? (
            <span className="specialty-card-stat">
              <Calendar size={14} />
              {formatDate(article.created_at)}
            </span>
          ) : null}
        </div>

        <span className="specialty-card-link">
          Đọc bài <ChevronRight size={14} />
        </span>
      </div>
    </Link>
  );
}

export default ArticleCard;
