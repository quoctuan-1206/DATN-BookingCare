import { useCallback, useEffect, useRef, useState } from "react";
import { ClipboardPlus, Layers3, Plus, TimerReset } from "lucide-react";
import toast from "react-hot-toast";
import { Navigate, useSearchParams } from "react-router-dom";
import ClinicalOrderFormModal from "../../components/clinical/ClinicalOrderFormModal";
import ClinicalOrderWorkspace from "../../components/clinical/ClinicalOrderWorkspace";
import DoctorLayout from "../../components/doctor-dashboard/layout/DoctorLayout";
import { getApiErrorMessage } from "../../api/axios";
import appointmentService from "../../services/appointment.service";
import clinicalService from "../../services/clinical.service";
import { useAuth } from "../../context/AuthContext";

function DoctorClinicalOrders() {
  const { user, loading: authLoading } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [orders, setOrders] = useState([]);
  const [openedOrder, setOpenedOrder] = useState(null);
  const [services, setServices] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, total_pages: 1 });
  const [stats, setStats] = useState({ total: 0, pending: 0, completed: 0 });
  const [loading, setLoading] = useState(true);
  const [metadataLoading, setMetadataLoading] = useState(true);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const currentQuery = useRef({ page: 1, limit: 5 });
  const openedOrderId = searchParams.get("orderId");

  const loadOrders = useCallback(async (query) => {
    currentQuery.current = query;
    setLoading(true);
    setError("");
    try {
      const orderResult = await clinicalService.getOrders(query);
      setOrders(orderResult.data || []);
      setPagination(orderResult.pagination || { total: 0, page: query.page, total_pages: 1 });
    } catch (loadError) {
      const message = getApiErrorMessage(loadError, "Không tải được dữ liệu cận lâm sàng");
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMetadata = useCallback(async () => {
    setMetadataLoading(true);
    try {
      const [serviceResult, appointmentResult, statsResult] = await Promise.all([
        clinicalService.getServices({ page: 1, limit: 100, is_active: true }),
        appointmentService.getAppointments({ page: 1, limit: 100 }),
        clinicalService.getOrderStats(),
      ]);
      setServices(serviceResult.data || []);
      setAppointments(
        (appointmentResult.data || []).filter((item) => item.status !== "CANCELLED"),
      );
      setStats(statsResult);
    } catch (metadataError) {
      toast.error(getApiErrorMessage(metadataError, "Không tải được dữ liệu tạo chỉ định"));
    } finally {
      setMetadataLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.role?.name === "Doctor") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadMetadata();
    }
  }, [loadMetadata, user?.role?.name]);

  useEffect(() => {
    if (!openedOrderId || user?.role?.name !== "Doctor") {
      return undefined;
    }

    let active = true;
    clinicalService.getOrder(openedOrderId)
      .then((order) => {
        if (active) setOpenedOrder(order);
      })
      .catch((loadError) => {
        if (!active) return;
        toast.error(getApiErrorMessage(loadError, "Không tải được chi tiết phiếu chỉ định"));
        setOpenedOrder(null);
      });

    return () => {
      active = false;
    };
  }, [openedOrderId, user?.role?.name]);

  const closeOpenedOrder = () => {
    setOpenedOrder(null);
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      next.delete("orderId");
      return next;
    }, { replace: true });
  };

  const displayedOpenedOrder = String(openedOrder?.id) === String(openedOrderId)
    ? openedOrder
    : null;

  const createOrder = async (payload) => {
    setCreating(true);
    try {
      await clinicalService.createOrder(payload);
      const [, statsResult] = await Promise.all([
        loadOrders(currentQuery.current),
        clinicalService.getOrderStats(),
      ]);
      setStats(statsResult);
      setShowForm(false);
      toast.success("Đã tạo chỉ định cận lâm sàng");
    } catch (createError) {
      toast.error(getApiErrorMessage(createError, "Không tạo được chỉ định cận lâm sàng"));
    } finally {
      setCreating(false);
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
  if (user.role?.name !== "Doctor") return <Navigate to="/unauthorized" replace />;

  return (
    <DoctorLayout title="Cận lâm sàng">
      <div className="clinical-page">
        <section className="clinical-page-hero">
          <div>
            <span className="clinical-eyebrow"><Layers3 size={16} /> Trung tâm chỉ định</span>
            <h1>Quản lý cận lâm sàng</h1>
            <p>Tạo và theo dõi xét nghiệm, X-quang, siêu âm, nội soi và điện tim trên một luồng thống nhất.</p>
          </div>
          <button type="button" className="clinical-button clinical-button--primary" onClick={() => setShowForm(true)} disabled={metadataLoading || services.length === 0 || appointments.length === 0}>
            <Plus size={18} /> Tạo chỉ định
          </button>
        </section>

        <div className="clinical-summary-grid">
          <article className="clinical-summary-card">
            <ClipboardPlus size={21} />
            <div><strong>{stats.total}</strong><span>Tổng phiếu chỉ định</span></div>
          </article>
          <article className="clinical-summary-card clinical-summary-card--warning">
            <TimerReset size={21} />
            <div><strong>{stats.pending}</strong><span>Đang chờ tiếp nhận</span></div>
          </article>
          <article className="clinical-summary-card clinical-summary-card--success">
            <Layers3 size={21} />
            <div><strong>{stats.completed}</strong><span>Đã có kết quả</span></div>
          </article>
        </div>

        <ClinicalOrderWorkspace
          orders={orders}
          loading={loading}
          error={error}
          pagination={pagination}
          mode="doctor"
          onQueryChange={loadOrders}
          onOpenAttachment={openAttachment}
          openedOrder={displayedOpenedOrder}
          onCloseOpenedOrder={closeOpenedOrder}
        />
      </div>

      {showForm && (
        <ClinicalOrderFormModal
          appointments={appointments}
          services={services}
          submitting={creating}
          onClose={() => { if (!creating) setShowForm(false); }}
          onSubmit={createOrder}
        />
      )}
    </DoctorLayout>
  );
}

export default DoctorClinicalOrders;
