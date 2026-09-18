import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, ClipboardClock, Layers3, PlayCircle } from "lucide-react";
import toast from "react-hot-toast";
import { Navigate } from "react-router-dom";
import ClinicalOrderWorkspace from "../../components/clinical/ClinicalOrderWorkspace";
import StaffLayout from "../../components/staff/StaffLayout";
import { getApiErrorMessage } from "../../api/axios";
import clinicalService from "../../services/clinical.service";
import { useAuth } from "../../context/AuthContext";

const ALLOWED_FILE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "video/mp4",
  "video/webm",
];

function replaceOrder(orders, updated) {
  return orders.map((order) => order.id === updated.id ? updated : order);
}

function StaffClinical() {
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, total_pages: 1 });
  const [stats, setStats] = useState({ pending: 0, in_progress: 0, completed: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionPending, setActionPending] = useState(false);

  const loadOrders = useCallback(async (query) => {
    setLoading(true);
    setError("");
    try {
      const response = await clinicalService.getOrders(query);
      setOrders(response.data || []);
      setPagination(response.pagination || { total: 0, page: query.page, total_pages: 1 });
    } catch (loadError) {
      const message = getApiErrorMessage(loadError, "Không tải được danh sách phiếu cận lâm sàng");
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadStats = useCallback(async () => {
    try {
      setStats(await clinicalService.getOrderStats());
    } catch (statsError) {
      toast.error(getApiErrorMessage(statsError, "Không tải được thống kê phiếu"));
    }
  }, []);

  useEffect(() => {
    if (["STAFF", "Admin"].includes(user?.role?.name)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadStats();
    }
  }, [loadStats, user?.role?.name]);

  const changeStatus = async (orderId, status) => {
    let cancellationReason;
    if (status === "CANCELLED") {
      cancellationReason = window.prompt("Nhập lý do hủy phiếu:");
      if (cancellationReason === null) return;
      if (!cancellationReason.trim()) {
        toast.error("Vui lòng nhập lý do hủy phiếu");
        return;
      }
    }

    setActionPending(true);
    try {
      const updated = await clinicalService.updateOrderStatus(orderId, {
        status,
        ...(cancellationReason ? { cancellation_reason: cancellationReason.trim() } : {}),
      });
      setOrders((current) => replaceOrder(current, updated));
      await loadStats();
      toast.success(status === "IN_PROGRESS" ? "Đã tiếp nhận phiếu" : status === "COMPLETED" ? "Đã hoàn thành phiếu" : "Đã hủy phiếu");
    } catch (statusError) {
      toast.error(getApiErrorMessage(statusError, "Không cập nhật được trạng thái phiếu"));
    } finally {
      setActionPending(false);
    }
  };

  const saveResult = async (orderId, resultId, payload) => {
    setActionPending(true);
    try {
      const updated = await clinicalService.updateResult(orderId, resultId, payload);
      setOrders((current) => replaceOrder(current, updated));
      toast.success("Đã lưu kết quả");
    } catch (saveError) {
      toast.error(getApiErrorMessage(saveError, "Không lưu được kết quả"));
    } finally {
      setActionPending(false);
    }
  };

  const attachFile = async (orderId, file) => {
    if (file.size > 25 * 1024 * 1024) {
      toast.error("Tệp không được vượt quá 25 MB");
      return;
    }
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      toast.error("Định dạng tệp chưa được hỗ trợ");
      return;
    }

    setActionPending(true);
    try {
      const updated = await clinicalService.uploadAttachment(orderId, file);
      setOrders((current) => replaceOrder(current, updated));
      toast.success("Đã tải tệp kết quả lên");
    } catch (uploadError) {
      toast.error(getApiErrorMessage(uploadError, "Không tải được tệp kết quả lên"));
    } finally {
      setActionPending(false);
    }
  };

  const openAttachment = async (attachment) => {
    try {
      await clinicalService.openAttachment(attachment);
    } catch (openError) {
      toast.error(getApiErrorMessage(openError, "Không mở được tệp kết quả"));
    }
  };

  if (authLoading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (!["STAFF", "Admin"].includes(user.role?.name)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return (
    <StaffLayout title="Phiếu cận lâm sàng">
      <div className="clinical-page">
        <section className="clinical-page-hero">
          <div>
            <span className="clinical-eyebrow"><Layers3 size={16} /> Bàn làm việc</span>
            <h1>Phiếu cần thực hiện</h1>
            <p>Tiếp nhận, nhập kết quả và đính kèm tài liệu cho mọi dịch vụ cận lâm sàng.</p>
          </div>
        </section>

        <div className="clinical-summary-grid">
          <article className="clinical-summary-card clinical-summary-card--warning">
            <ClipboardClock size={21} /><div><strong>{stats.pending}</strong><span>Chờ tiếp nhận</span></div>
          </article>
          <article className="clinical-summary-card clinical-summary-card--info">
            <PlayCircle size={21} /><div><strong>{stats.in_progress}</strong><span>Đang thực hiện</span></div>
          </article>
          <article className="clinical-summary-card clinical-summary-card--success">
            <CheckCircle2 size={21} /><div><strong>{stats.completed}</strong><span>Đã hoàn thành</span></div>
          </article>
        </div>

        <ClinicalOrderWorkspace
          orders={orders}
          loading={loading}
          error={error}
          pagination={pagination}
          mode="staff"
          actionPending={actionPending}
          onQueryChange={loadOrders}
          onStatusChange={changeStatus}
          onSaveResult={saveResult}
          onAttach={attachFile}
          onOpenAttachment={openAttachment}
        />
      </div>
    </StaffLayout>
  );
}

export default StaffClinical;
