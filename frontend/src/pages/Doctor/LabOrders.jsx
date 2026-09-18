import { useCallback, useEffect, useState } from "react";
import { Download } from "lucide-react";
import toast from "react-hot-toast";
import DoctorLayout from "../../components/doctor-dashboard/layout/DoctorLayout";
import appointmentService from "../../services/appointment.service";
import labService, { LAB_STATUS_LABEL } from "../../services/lab.service";
import { getApiErrorMessage } from "../../api/axios";

function LabOrders() {
  const [appointments, setAppointments] = useState([]);
  const [tests, setTests] = useState([]);
  const [orders, setOrders] = useState([]);
  const [appointmentId, setAppointmentId] = useState("");
  const [testIds, setTestIds] = useState([]);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const [appointmentData, testData, orderData] = await Promise.all([
        appointmentService.getAppointments({ page: 1, limit: 100 }),
        labService.getTests({ is_active: true }),
        labService.getOrders({ page: 1, limit: 100 }),
      ]);
      setAppointments(appointmentData.data.filter((item) => item.status !== "CANCELLED"));
      setTests(testData);
      setOrders(orderData.data || []);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không tải được dữ liệu xét nghiệm"));
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const downloadResultFile = async (order) => {
    try {
      await labService.downloadResultFile(order);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không tải được file kết quả"));
    }
  };

  const toggleTest = (id) => {
    setTestIds((current) => current.includes(id)
      ? current.filter((item) => item !== id)
      : [...current, id]);
  };

  const createOrder = async (event) => {
    event.preventDefault();
    if (!appointmentId || testIds.length === 0) {
      toast.error("Vui lòng chọn lịch khám và ít nhất một xét nghiệm");
      return;
    }
    setSaving(true);
    try {
      await labService.createOrder({ appointment_id: Number(appointmentId), test_ids: testIds });
      setAppointmentId("");
      setTestIds([]);
      toast.success("Đã tạo chỉ định xét nghiệm");
      load();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không tạo được chỉ định xét nghiệm"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <DoctorLayout title="Xét nghiệm">
      <div className="doctor-page">
        <div className="doctor-card" style={{ marginBottom: 20 }}>
          <h3>Chỉ định xét nghiệm</h3>
          <form className="admin-form" onSubmit={createOrder} style={{ marginTop: 16 }}>
            <div className="admin-form-group">
              <label>Lịch khám</label>
              <select className="admin-select" value={appointmentId} onChange={(e) => setAppointmentId(e.target.value)} required>
                <option value="">Chọn lịch khám...</option>
                {appointments.map((item) => <option key={item.id} value={item.id}>{item.booking_code} · {item.patient_name} · {item.date_display}</option>)}
              </select>
            </div>
            <div className="admin-form-group">
              <label>Danh mục xét nghiệm</label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10 }}>
                {tests.map((test) => <label key={test.id} style={{ display: "flex", gap: 8, alignItems: "center" }}><input type="checkbox" checked={testIds.includes(test.id)} onChange={() => toggleTest(test.id)} /><span>{test.name} ({Number(test.price).toLocaleString("vi-VN")} đ)</span></label>)}
              </div>
            </div>
            <div className="admin-form-actions"><button className="admin-btn admin-btn-primary" disabled={saving}>{saving ? "Đang tạo..." : "Tạo chỉ định"}</button></div>
          </form>
        </div>

        <div className="doctor-card">
          <h3 style={{ marginBottom: 16 }}>Các phiếu đã chỉ định</h3>
          {orders.length === 0 ? <p>Chưa có phiếu xét nghiệm.</p> : orders.map((order) => (
            <section key={order.id} style={{ borderTop: "1px solid #eee", padding: "16px 0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}><strong>#{order.id} · {order.patient_name} · {order.booking_code}</strong><span>{LAB_STATUS_LABEL[order.status]}</span></div>
              {order.result_file && (
                <button type="button" className="lab-result-file-link" onClick={() => downloadResultFile(order)}>
                  <Download size={17} /> Tải file kết quả: {order.result_file.name}
                </button>
              )}
              <div className="table-wrapper" style={{ marginTop: 10 }}><table className="admin-table"><thead><tr><th>Xét nghiệm</th><th>Kết quả</th><th>Đơn vị</th><th>Khoảng tham chiếu</th><th>Ghi chú</th></tr></thead><tbody>
                {order.results.map((item) => <tr key={item.id}><td>{item.test_name}</td><td>{order.result_file ? "Xem trong file kết quả" : item.result || "Chưa có"}</td><td>{item.unit || "—"}</td><td>{item.reference_range || "—"}</td><td>{item.note || "—"}</td></tr>)}
              </tbody></table></div>
            </section>
          ))}
        </div>
      </div>
    </DoctorLayout>
  );
}

export default LabOrders;
