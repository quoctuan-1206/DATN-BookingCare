import { useCallback, useEffect, useState } from "react";
import { CalendarClock, ClipboardPlus, ExternalLink, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { getApiErrorMessage } from "../../api/axios";
import clinicalService from "../../services/clinical.service";
import ClinicalOrderFormModal from "../clinical/ClinicalOrderFormModal";
import ClinicalStatusBadge from "../clinical/ClinicalStatusBadge";
import { ClinicalTypeIcon } from "../clinical/ClinicalOrderWorkspace";
import {
  CLINICAL_TYPE_LABEL,
  formatClinicalDate,
} from "../clinical/clinical.constants";

function serviceNames(order) {
  return (order.results || [])
    .map((item) => item.test_name || item.service_name)
    .filter(Boolean)
    .join(", ");
}

function AppointmentClinicalOrders({ appointment, onOrdersChange }) {
  const appointmentId = appointment?.id;
  const [orders, setOrders] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    if (!appointmentId) return;
    setLoading(true);
    setError("");
    try {
      const [serviceResult, orderResult] = await Promise.all([
        clinicalService.getServices({ page: 1, limit: 100, is_active: true }),
        clinicalService.getOrders({
          appointment_id: appointmentId,
          page: 1,
          limit: 100,
        }),
      ]);
      const loadedOrders = orderResult.data || [];
      setServices(serviceResult.data || []);
      setOrders(loadedOrders);
      onOrdersChange?.({ appointmentId, orders: loadedOrders });
    } catch (loadError) {
      setError(
        getApiErrorMessage(loadError, "Không tải được chỉ định cận lâm sàng"),
      );
    } finally {
      setLoading(false);
    }
  }, [appointmentId, onOrdersChange]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, [loadData]);

  const createOrder = async (payload) => {
    setSubmitting(true);
    try {
      await clinicalService.createOrder(payload);
      await loadData();
      setShowForm(false);
      toast.success("Đã tạo chỉ định cận lâm sàng");
    } catch (createError) {
      toast.error(
        getApiErrorMessage(createError, "Không tạo được chỉ định cận lâm sàng"),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const canCreate = appointment.status === "CONFIRMED" && services.length > 0;

  return (
    <>
      <section className="doctor-card doctor-clinical-orders">
        <div className="doctor-card-header doctor-clinical-orders__header">
          <div>
            <h3>Chỉ định cận lâm sàng</h3>
            <p>Chỉ định xét nghiệm, X-quang, siêu âm, nội soi hoặc điện tim cho buổi khám này.</p>
          </div>
          <button
            type="button"
            className="clinical-button clinical-button--primary"
            disabled={loading || !canCreate}
            onClick={() => setShowForm(true)}
          >
            <Plus size={17} /> Thêm chỉ định
          </button>
        </div>

        {loading ? (
          <div className="doctor-clinical-orders__state">Đang tải chỉ định...</div>
        ) : error ? (
          <div className="doctor-clinical-orders__state doctor-clinical-orders__state--error">
            <span>{error}</span>
            <button type="button" onClick={loadData}>Thử lại</button>
          </div>
        ) : orders.length === 0 ? (
          <div className="doctor-clinical-orders__empty">
            <ClipboardPlus size={28} />
            <div>
              <strong>Chưa có chỉ định</strong>
              <p>
                {services.length > 0
                  ? "Bác sĩ có thể tạo chỉ định ngay trong quá trình khám."
                  : "Chưa có dịch vụ cận lâm sàng đang hoạt động."}
              </p>
            </div>
          </div>
        ) : (
          <div className="doctor-clinical-orders__list">
            {orders.map((order) => (
              <Link
                className="doctor-clinical-order"
                key={order.id}
                to={`/doctor/clinical?orderId=${order.id}`}
                aria-label={`Xem chi tiết phiếu chỉ định ${serviceNames(order) || `#${order.id}`}`}
              >
                <div className={`clinical-type-mark clinical-type-mark--${order.service_type.toLowerCase()}`}>
                  <ClinicalTypeIcon type={order.service_type} size={19} />
                </div>
                <div className="doctor-clinical-order__content">
                  <div className="doctor-clinical-order__top">
                    <div>
                      <span>{CLINICAL_TYPE_LABEL[order.service_type] || order.service_type}</span>
                      <strong>{serviceNames(order) || `Phiếu #${order.id}`}</strong>
                    </div>
                    <ClinicalStatusBadge status={order.status} />
                  </div>
                  <p>{order.indication || "Chưa có nội dung chỉ định."}</p>
                  <small>
                    <CalendarClock size={14} /> Tạo lúc {formatClinicalDate(order.ordered_at, true)}
                  </small>
                </div>
              </Link>
            ))}
          </div>
        )}

        {orders.length > 0 && (
          <Link className="doctor-clinical-orders__link" to="/doctor/clinical">
            Quản lý tất cả phiếu <ExternalLink size={15} />
          </Link>
        )}
      </section>

      {showForm && (
        <ClinicalOrderFormModal
          appointments={[appointment]}
          fixedAppointment={appointment}
          services={services}
          submitting={submitting}
          onClose={() => {
            if (!submitting) setShowForm(false);
          }}
          onSubmit={createOrder}
        />
      )}
    </>
  );
}

export default AppointmentClinicalOrders;
