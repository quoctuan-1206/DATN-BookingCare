import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Check, ChevronLeft, ChevronRight, Star } from "lucide-react";
import reviewService from "../../../services/review.service";

function formatReviewDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("vi-VN");
}

function getItemsPerPage() {
  if (typeof window === "undefined") return 3;
  if (window.innerWidth <= 700) return 1;
  if (window.innerWidth <= 1050) return 2;
  return 3;
}

function initialOf(name) {
  const text = (name || "B").trim();
  return text.charAt(0).toUpperCase();
}

function LatestComments() {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(getItemsPerPage);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const result = await reviewService.getReviews({ page: 1, limit: 20 });
        const withText = (result.data || []).filter(
          (item) => item.comment && item.comment.trim(),
        );
        const list = (withText.length ? withText : result.data || []).slice(0, 5);
        if (!cancelled) setComments(list);
      } catch {
        if (!cancelled) setComments([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const updateItemsPerPage = () => setItemsPerPage(getItemsPerPage());
    window.addEventListener("resize", updateItemsPerPage);
    return () => window.removeEventListener("resize", updateItemsPerPage);
  }, []);

  const maxIndex = Math.max(0, comments.length - itemsPerPage);
  const safeIndex = Math.min(activeIndex, maxIndex);
  const visibleComments = useMemo(
    () => comments.slice(safeIndex, safeIndex + itemsPerPage),
    [comments, itemsPerPage, safeIndex],
  );

  function changeSlide(direction) {
    setActiveIndex(() => {
      if (maxIndex === 0) return 0;
      if (direction > 0) return safeIndex >= maxIndex ? 0 : safeIndex + 1;
      return safeIndex <= 0 ? maxIndex : safeIndex - 1;
    });
  }

  return (
    <section className="section home-modern-section home-comments-section">
      <div className="home-content-container">
        <div className="home-comments-heading">
          <h2>Người dùng nói gì về MediUTE?</h2>
          <p>Những trải nghiệm thực tế từ người dùng đã sử dụng dịch vụ.</p>
        </div>

        {loading ? (
          <p className="home-section-empty">Đang tải bình luận...</p>
        ) : comments.length === 0 ? (
          <p className="home-section-empty">Chưa có bình luận nào.</p>
        ) : (
          <div className="home-comments-carousel">
            <button
              type="button"
              className="home-comments-arrow home-comments-arrow--prev"
              onClick={() => changeSlide(-1)}
              disabled={maxIndex === 0}
              aria-label="Xem bình luận trước"
            >
              <ChevronLeft size={22} />
            </button>

            <div className="home-comments-grid" aria-live="polite">
              {visibleComments.map((item) => (
                <Link
                  key={item.id}
                  to={item.doctor_id ? `/doctors/${item.doctor_id}` : "/doctors"}
                  className="home-review-card"
                >
                  <div className="home-review-head">
                    <div className="home-review-avatar" aria-hidden="true">
                      {initialOf(item.patient_name)}
                    </div>
                    <div className="home-review-user">
                      <strong>{item.patient_name || "Bệnh nhân"}</strong>
                    </div>
                    <time dateTime={item.created_at || undefined}>
                      {formatReviewDate(item.created_at)}
                    </time>
                  </div>

                  <div className="home-review-rating" aria-label={`${item.rating || 0} trên 5 sao`}>
                    <span className="home-review-stars">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          size={16}
                          fill={star <= item.rating ? "currentColor" : "none"}
                        />
                      ))}
                    </span>
                    <strong>{Number(item.rating || 0).toFixed(1)}</strong>
                  </div>

                  <p className="home-review-content">
                    “{item.comment?.trim() || `Đánh giá ${item.rating}/5 sao`}”
                  </p>

                  <div className="home-review-footer">
                    <span className="home-review-verified">
                      <Check size={14} strokeWidth={2.8} />
                      Đã khám
                    </span>
                    {item.doctor_name ? (
                      <span className="home-review-doctor">
                        BS. {item.doctor_name}
                      </span>
                    ) : null}
                  </div>
                </Link>
              ))}
            </div>

            <button
              type="button"
              className="home-comments-arrow home-comments-arrow--next"
              onClick={() => changeSlide(1)}
              disabled={maxIndex === 0}
              aria-label="Xem bình luận tiếp theo"
            >
              <ChevronRight size={22} />
            </button>
          </div>
        )}

        {!loading && comments.length > 0 && maxIndex > 0 ? (
          <div className="home-comments-dots" aria-label="Chọn trang bình luận">
            {Array.from({ length: maxIndex + 1 }, (_, index) => (
              <button
                key={index}
                type="button"
                className={index === safeIndex ? "active" : ""}
                onClick={() => setActiveIndex(index)}
                aria-label={`Trang bình luận ${index + 1}`}
                aria-current={index === safeIndex ? "page" : undefined}
              />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}

export default LatestComments;
