import { useCallback, useEffect, useState } from "react";
import { FileCheck2, Layers3, ShieldCheck } from "lucide-react";
import { Navigate } from "react-router-dom";
import toast from "react-hot-toast";
import ClinicalOrderWorkspace from "../../components/clinical/ClinicalOrderWorkspace";
import PatientLayout from "../../components/patient/PatientLayout";
import { useAuth } from "../../context/AuthContext";
import { getApiErrorMessage } from "../../api/axios";
import clinicalService from "../../services/clinical.service";

function PatientClinicalOrders() {
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, total_pages: 1 });
  const [stats, setStats] = useState({ total: 0, completed: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadOrders = useCallback(async (query) => {
    setLoading(true);
    setError("");
    try {
      const response = await clinicalService.getOrders(query);
      setOrders(response.data || []);
      setPagination(response.pagination || { total: 0, page: query.page, total_pages: 1 });
    } catch (loadError) {
      const message = getApiErrorMessage(loadError, "Không tải được kết quả cận lâm sàng");
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
      toast.error(getApiErrorMessage(statsError, "Không tải được thống kê cận lâm sàng"));
    }
  }, []);

  useEffect(() => {
    if (user?.role?.name === "Patient") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadStats();
    }
  }, [loadStats, user?.role?.name]);

  const openAttachment = async (attachment) => {
    try {
      await clinicalService.openAttachment(attachment);
    } catch (openError) {
      toast.error(getApiErrorMessage(openError, "Không mở được tệp kết quả"));
    }
  };

  if (authLoading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role?.name !== "Patient") return <Navigate to="/unauthorized" replace />;

  return (
    <PatientLayout>
      <div className="clinical-page clinical-page--patient">
        <section className="clinical-page-hero">
          <div>
            <span className="clinical-eyebrow"><Layers3 size={16} /> Hồ sơ của tôi</span>
            <h1>Kết quả cận lâm sàng</h1>
            <p>Theo dõi chỉ định và xem kết quả xét nghiệm, chẩn đoán hình ảnh, nội soi, điện tim.</p>
          </div>
        </section>

        <div className="clinical-summary-grid clinical-summary-grid--compact">
          <article className="clinical-summary-card">
            <Layers3 size={21} /><div><strong>{stats.total}</strong><span>Tổng số phiếu</span></div>
          </article>
          <article className="clinical-summary-card clinical-summary-card--success">
            <FileCheck2 size={21} /><div><strong>{stats.completed}</strong><span>Kết quả đã trả</span></div>
          </article>
          <article className="clinical-summary-card clinical-summary-card--info">
            <ShieldCheck size={21} /><div><strong>Riêng tư</strong><span>Chỉ bạn và nhân viên y tế</span></div>
          </article>
        </div>

        <ClinicalOrderWorkspace
          orders={orders}
          loading={loading}
          error={error}
          pagination={pagination}
          mode="patient"
          onQueryChange={loadOrders}
          onOpenAttachment={openAttachment}
        />
      </div>
    </PatientLayout>
  );
}

export default PatientClinicalOrders;
