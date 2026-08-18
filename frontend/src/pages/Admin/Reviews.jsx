import { useEffect, useState } from "react";
import { Star, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import AdminLayout from "../../components/admin/layout/AdminLayout";
import reviewService from "../../services/review.service";
import { getApiErrorMessage } from "../../api/axios";

function formatDate(value) {
  if (!value) return "";
  try {
    return new Date(value).toLocaleDateString("vi-VN");
  } catch {
    return String(value).slice(0, 10);
  }
}

function Reviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);

  async function load(p = page) {
    setLoading(true);
    try {
      const result = await reviewService.getReviews({ page: p, limit: 20 });
      setReviews(result.data || []);
      setTotalPages(result.pagination?.total_pages || 0);
      setTotal(result.pagination?.total || 0);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không tải được đánh giá"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(page);
  }, [page]);

  const handleDelete = async (id) => {
    const ok = window.confirm("Xóa đánh giá này?");
    if (!ok) return;

    try {
      await reviewService.deleteReview(id);
      toast.success("Đã xóa đánh giá");
      load(page);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không xóa được"));
    }
  };

  return (
    <AdminLayout title="Đánh giá">
      <div className="admin-page">
        <div className="admin-page-header">
          <div>
            <h3>Quản lý đánh giá</h3>
            <p>
              Theo dõi đánh giá của bệnh nhân — {total} đánh giá
            </p>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Bệnh nhân</th>
                  <th>Bác sĩ</th>
                  <th>Điểm</th>
                  <th>Nội dung</th>
                  <th>Mã lịch hẹn</th>
                  <th>Ngày</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center" }}>
                      Đang tải...
                    </td>
                  </tr>
                ) : reviews.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", color: "#999" }}>
                      Chưa có đánh giá nào
                    </td>
                  </tr>
                ) : (
                  reviews.map((review) => (
                    <tr key={review.id}>
                      <td>{review.patient_name || "—"}</td>
                      <td>{review.doctor_name || "—"}</td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              size={14}
                              fill={s <= review.rating ? "#f5a623" : "none"}
                              color={s <= review.rating ? "#f5a623" : "#cbd5e1"}
                            />
                          ))}
                        </div>
                      </td>
                      <td>
                        <span
                          style={{
                            maxWidth: 280,
                            display: "inline-block",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {review.comment || "—"}
                        </span>
                      </td>
                      <td>{review.booking_code || "—"}</td>
                      <td>{formatDate(review.created_at)}</td>
                      <td>
                        <button
                          type="button"
                          className="admin-btn admin-btn-danger"
                          onClick={() => handleDelete(review.id)}
                          title="Xóa đánh giá"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: 12,
                marginTop: 16,
              }}
            >
              <button
                type="button"
                className="admin-btn admin-btn-secondary"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Trước
              </button>
              <span>
                Trang {page} / {totalPages}
              </span>
              <button
                type="button"
                className="admin-btn admin-btn-secondary"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Sau
              </button>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

export default Reviews;
