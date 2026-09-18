import { useCallback, useEffect, useState } from "react";
import { ArrowRight, CalendarClock, ClipboardList, Download, Eye, FileText, FlaskConical, MapPin, ReceiptText, X } from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import toast from "react-hot-toast";
import PatientLayout from "../../components/patient/PatientLayout";
import { useAuth } from "../../context/AuthContext";
import { getApiErrorMessage } from "../../api/axios";
import labService from "../../services/lab.service";

function PatientLabOrders() {
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState(null);
  const [previewingOrderId, setPreviewingOrderId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await labService.getOrders({ page: 1, limit: 100 });
      setOrders(response.data || []);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không tải được lịch xét nghiệm"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.role?.name === "Patient") load();
  }, [load, user?.role?.name]);

  useEffect(() => {
    if (!preview) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setPreview(null);
    };
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
      URL.revokeObjectURL(preview.url);
    };
  }, [preview]);

  const downloadResultFile = async (order) => {
    try {
      await labService.downloadResultFile(order);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không tải được file kết quả"));
    }
  };

  const previewResultFile = async (order) => {
    setPreviewingOrderId(order.id);
    try {
      const response = await labService.getResultFileBlob(order.id);
      setPreview({
        url: URL.createObjectURL(response.data),
        name: order.result_file.name,
        type: order.result_file.type || response.data.type,
        order,
      });
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không mở được file kết quả"));
    } finally {
      setPreviewingOrderId(null);
    }
  };

  if (authLoading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role?.name !== "Patient") return <Navigate to="/unauthorized" replace />;

  return (
    <PatientLayout>
      <div className="patient-lab-page">
        <section className="patient-lab-heading">
          <div>
            <span><FlaskConical size={17} /> Xét nghiệm của tôi</span>
            <h1>Lịch và kết quả xét nghiệm</h1>
            <p>Theo dõi thời gian, trạng thái thực hiện và kết quả của từng phiếu.</p>
          </div>
          <Link className="patient-lab-heading__action" to="/lab-booking">
            Đặt lịch mới <ArrowRight size={18} />
          </Link>
        </section>

        <section className="patient-lab-history">
          <div className="patient-lab-history__head">
            <div><ClipboardList size={21} /><h2>Danh sách phiếu xét nghiệm</h2></div>
            <span>{orders.length} phiếu</span>
          </div>
          {loading ? (
            <div className="lab-state"><span className="lab-spinner" />Đang tải...</div>
          ) : orders.length === 0 ? (
            <div className="patient-lab-empty">
              <ReceiptText size={34} />
              <p>Bạn chưa có phiếu xét nghiệm nào.</p>
              <Link className="btn btn-primary" to="/lab-booking">Đặt lịch xét nghiệm</Link>
            </div>
          ) : orders.map((order) => (
            <article className="patient-lab-order patient-lab-order--compact" key={order.id}>
              <div className="patient-lab-order__summary">
                <div className="patient-lab-detail-item">
                  <FlaskConical size={19} />
                  <div><span>Tên xét nghiệm</span><strong>{order.results.map((item) => item.test_name).join(", ") || "Xét nghiệm"}</strong></div>
                </div>
                <div className="patient-lab-detail-item">
                  <CalendarClock size={19} />
                  <div><span>Thời gian</span><strong>{order.schedule ? `${order.schedule.date_display} · ${order.schedule.time}` : new Date(order.ordered_at).toLocaleDateString("vi-VN")}</strong></div>
                </div>
                <div className="patient-lab-detail-item">
                  <MapPin size={19} />
                  <div><span>Nơi xét nghiệm</span><strong>{order.schedule?.clinic_name || "Chưa cập nhật"}</strong>{order.schedule?.clinic_address && <small>{order.schedule.clinic_address}</small>}</div>
                </div>
              </div>
              {order.result_file ? (
                <div className="patient-lab-result-actions">
                  <button type="button" className="btn btn-outline" disabled={previewingOrderId === order.id} onClick={() => previewResultFile(order)}>
                    <Eye size={17} /> {previewingOrderId === order.id ? "Đang mở..." : "Xem trước kết quả"}
                  </button>
                  <button type="button" className="btn btn-primary" onClick={() => downloadResultFile(order)}>
                    <Download size={17} /> Tải kết quả
                  </button>
                </div>
              ) : (
                <div className="patient-lab-result-pending"><FileText size={18} /> Kết quả chưa được tải lên</div>
              )}
            </article>
          ))}
        </section>
        {preview && (
          <div className="lab-preview-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setPreview(null); }}>
            <section className="lab-preview-dialog" role="dialog" aria-modal="true" aria-labelledby="lab-preview-title">
              <header>
                <div><FileText size={21} /><div><h2 id="lab-preview-title">Xem trước kết quả</h2><span>{preview.name}</span></div></div>
                <button type="button" autoFocus aria-label="Đóng cửa sổ xem trước" onClick={() => setPreview(null)}><X size={20} /></button>
              </header>
              <div className="lab-preview-content">
                {preview.type === "application/pdf" || preview.name.toLowerCase().endsWith(".pdf") ? (
                  <iframe src={preview.url} title={`Kết quả xét nghiệm ${preview.name}`} />
                ) : (
                  <div className="lab-preview-word-fallback"><FileText size={48} /><h3>{preview.name}</h3><p>Trình duyệt không hỗ trợ xem trực tiếp file Word. Vui lòng tải file về để xem đầy đủ nội dung.</p></div>
                )}
              </div>
              <footer>
                <button type="button" className="btn btn-outline" onClick={() => setPreview(null)}>Đóng</button>
                <button type="button" className="btn btn-primary" onClick={() => downloadResultFile(preview.order)}><Download size={17} /> Tải kết quả</button>
              </footer>
            </section>
          </div>
        )}
      </div>
    </PatientLayout>
  );
}

export default PatientLabOrders;
