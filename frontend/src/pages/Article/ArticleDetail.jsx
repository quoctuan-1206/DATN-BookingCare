import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { Calendar, ChevronRight, Home, UserRound } from "lucide-react";
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

function looksLikeHtml(value) {
  return /<\/?[a-z][\s\S]*>/i.test(value || "");
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
          toast.error(getApiErrorMessage(error, "Không tải được bài viết"));
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

  if (loading) {
    return (
      <>
        <Header />
        <section className="article-detail-page">
          <div className="article-detail-inner">
            <p>Đang tải bài viết...</p>
          </div>
        </section>
        <Footer />
      </>
    );
  }

  if (!article) {
    return (
      <>
        <Header />
        <section className="article-detail-page">
          <div className="article-detail-inner">
            <h1>Không tìm thấy bài viết</h1>
            <Link to="/articles" className="btn btn-primary">
              Quay lại danh sách
            </Link>
          </div>
        </section>
        <Footer />
      </>
    );
  }

  const content = article.content || "Nội dung đang được cập nhật.";
  const html = looksLikeHtml(content);

  return (
    <>
      <Header />
      <section className="article-detail-page">
        <div className="article-detail-inner">
          <nav className="doctor-breadcrumb">
            <Link to="/">
              <Home size={15} />
              Trang chủ
            </Link>
            <ChevronRight size={14} />
            <Link to="/articles">Bài viết</Link>
            <ChevronRight size={14} />
            <span>{article.title}</span>
          </nav>

          <article className="article-detail-card">
            {article.image ? (
              <img
                src={article.image}
                alt={article.title}
                className="article-detail-cover"
              />
            ) : null}

            <div className="article-detail-body">
              {article.category ? (
                <span className="doctor-profile__badge">{article.category}</span>
              ) : null}
              <h1>{article.title}</h1>

              <ul className="article-detail-meta">
                {article.author ? (
                  <li>
                    <UserRound size={15} />
                    {article.author}
                  </li>
                ) : null}
                {article.created_at ? (
                  <li>
                    <Calendar size={15} />
                    {formatDate(article.created_at)}
                  </li>
                ) : null}
              </ul>

              {article.description ? (
                <p className="article-detail-lead">{article.description}</p>
              ) : null}

              {html ? (
                <div
                  className="article-detail-content"
                  dangerouslySetInnerHTML={{ __html: content }}
                />
              ) : (
                <div className="article-detail-content article-detail-content--plain">
                  {content}
                </div>
              )}
            </div>
          </article>
        </div>
      </section>
      <Footer />
    </>
  );
}

export default ArticleDetail;
