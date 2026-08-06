import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import Header from "../../components/common/Header/Header";
import Footer from "../../components/common/Footer/Footer";
import articleService from "../../services/article.service";
import { getApiErrorMessage } from "../../api/axios";

function formatDate(value) {
  if (!value) return "";
  try {
    return new Date(value).toLocaleDateString("vi-VN");
  } catch {
    return "";
  }
}

function ArticleDetail() {
  const { id } = useParams();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const data = await articleService.getArticleById(id);
        if (!cancelled) setArticle(data);
      } catch (error) {
        if (!cancelled) {
          setArticle(null);
          toast.error(
            getApiErrorMessage(error, "Không tải được bài viết"),
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
  }, [id]);

  return (
    <>
      <Header />
      <section className="section">
        <div className="container" style={{ maxWidth: 860 }}>
          {loading ? (
            <p>Đang tải bài viết...</p>
          ) : !article ? (
            <>
              <h1>Không tìm thấy bài viết</h1>
              <Link to="/articles" className="btn btn-primary">
                Quay lại danh sách
              </Link>
            </>
          ) : (
            <>
              <p style={{ marginBottom: 8 }}>
                <Link to="/articles">← Bài viết</Link>
              </p>
              <img
                src={article.image}
                alt={article.title}
                style={{
                  width: "100%",
                  maxHeight: 420,
                  objectFit: "cover",
                  borderRadius: 12,
                  marginBottom: 20,
                }}
              />
              <h1 style={{ marginBottom: 8 }}>{article.title}</h1>
              <p style={{ color: "#666", marginBottom: 24 }}>
                {article.category}
                {article.author ? ` · ${article.author}` : ""}
                {article.created_at
                  ? ` · ${formatDate(article.created_at)}`
                  : ""}
              </p>
              {article.description && (
                <p style={{ fontSize: 18, marginBottom: 20 }}>
                  {article.description}
                </p>
              )}
              <div
                style={{ lineHeight: 1.7, whiteSpace: "pre-wrap" }}
              >
                {article.content || "Nội dung đang được cập nhật."}
              </div>
            </>
          )}
        </div>
      </section>
      <Footer />
    </>
  );
}

export default ArticleDetail;
