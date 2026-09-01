import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Check, Star } from "lucide-react";
import SectionHeader from "../../common/SectionHeader/SectionHeader";
import reviewService from "../../../services/review.service";

function formatRelativeTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "Vừa xong";
  if (minutes < 60) return `${minutes} phút trước`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} ngày trước`;

  return date.toLocaleDateString("vi-VN");
}

function initialOf(name) {
  const text = (name || "B").trim();
  return text.charAt(0).toUpperCase();
}

function LatestComments() {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const result = await reviewService.getReviews({ page: 1, limit: 20 });
        const withText = (result.data || []).filter(
          (item) => item.comment && item.comment.trim(),
        );
        const list = (withText.length ? withText : result.data || []).slice(
          0,
          8,
        );
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

  return (
    <aside className="home-comments-col">
      <SectionHeader title="Nhận xét mới nhất" />

      {loading ? (
        <p className="home-comments-empty">Đang tải nhận xét...</p>
      ) : comments.length === 0 ? (
        <p className="home-comments-empty">Chưa có nhận xét nào.</p>
      ) : (
        <div className="home-comments-list">
          {comments.map((item) => (
            <Link
              key={item.id}
              to={item.doctor_id ? `/doctors/${item.doctor_id}` : "/doctors"}
              className="home-comment"
            >
              <div className="home-comment-avatar" aria-hidden="true">
                {initialOf(item.patient_name)}
              </div>

              <div className="home-comment-head">
                <strong>{item.patient_name || "Bệnh nhân"}</strong>
                <span>{formatRelativeTime(item.created_at)}</span>
              </div>

              <div className="home-comment-rating">
                <div className="home-comment-stars">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={14}
                      fill={star <= item.rating ? "#f5a623" : "none"}
                      color={star <= item.rating ? "#f5a623" : "#cbd5e1"}
                    />
                  ))}
                </div>
                <em>{Number(item.rating || 0).toFixed(1)}</em>
              </div>

              <p>
                {item.comment?.trim() || `Đánh giá ${item.rating}/5 sao`}
              </p>

              <div className="home-comment-meta">
                <span className="home-comment-verified">
                  <Check size={14} strokeWidth={2.5} />
                  Đã khám
                </span>
                {item.doctor_name ? (
                  <span className="home-comment-doctor">
                    Bác sĩ {item.doctor_name}
                  </span>
                ) : null}
              </div>
            </Link>
          ))}
        </div>
      )}
    </aside>
  );
}

export default LatestComments;
