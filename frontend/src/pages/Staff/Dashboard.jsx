import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api, { getApiErrorMessage } from "../../api/axios";
import StaffLayout from "../../components/staff/StaffLayout";
import clinicalService from "../../services/clinical.service";
import { useAuth } from "../../context/AuthContext";

function Dashboard() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [inventory, setInventory] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user?.role?.name === "STAFF" && !user?.clinic_id) return;
    let active = true;
    Promise.all([
      clinicalService.getOrders({ page: 1, limit: 6 }),
      clinicalService.getSchedules({ page: 1, limit: 6 }),
      api.get("/inventory/summary"),
    ]).then(([orderData, scheduleData, inventoryResponse]) => {
      if (!active) return;
      setOrders(orderData.data || []);
      setSchedules(scheduleData.data || []);
      setInventory(inventoryResponse.data?.data || null);
    }).catch((loadError) => {
      if (active) setError(getApiErrorMessage(loadError, "Không tải được dữ liệu tổng quan"));
    });
    return () => { active = false; };
  }, [user?.role?.name, user?.clinic_id]);

  const resultCount = orders.reduce((count, order) => count + (order.results?.length || 0), 0);
  return (
    <StaffLayout title="Tổng quan STAFF">
      <div className="admin-page">
        <div className="admin-page-header">
          <div>
            <h3>{user?.clinics?.name || "Tổng quan công việc"}</h3>
            <p>{user?.name || [user?.last_name, user?.first_name].filter(Boolean).join(" ")}</p>
          </div>
        </div>
        {error && <div className="dashboard-card" role="alert">{error}</div>}
        <div className="dashboard-grid">
          {[
            ["Phiếu cận lâm sàng", orders.length],
            ["Lịch thực hiện", schedules.length],
            ["Kết quả trong phiếu", resultCount],
            ["Tổng tồn tại cơ sở", inventory?.totals?.units ?? "—"],
          ].map(([label, value]) => <div className="dashboard-card" key={label}><p>{label}</p><h2>{value}</h2></div>)}
        </div>
        <div className="dashboard-card">
          <div className="admin-page-header"><h3>Phiếu gần đây</h3><Link className="admin-btn admin-btn-secondary" to="/staff/clinical/orders">Mở danh sách</Link></div>
          <div className="table-wrapper"><table className="admin-table"><thead><tr><th>Mã phiếu</th><th>Bệnh nhân</th><th>Loại</th><th>Trạng thái</th><th>Kết quả</th></tr></thead><tbody>
            {orders.map((order) => <tr key={order.id}><td>{order.booking_code || `#${order.id}`}</td><td>{order.patient_name || "—"}</td><td>{order.service_type_label || order.service_type}</td><td>{order.status}</td><td>{order.results?.length || 0}</td></tr>)}
            {!orders.length && <tr><td colSpan="5">Chưa có phiếu tại cơ sở này.</td></tr>}
          </tbody></table></div>
        </div>
        <div className="dashboard-card">
          <div className="admin-page-header"><h3>Lịch cận lâm sàng</h3><Link className="admin-btn admin-btn-secondary" to="/staff/clinical/schedules">Mở lịch</Link></div>
          <div className="table-wrapper"><table className="admin-table"><thead><tr><th>Ngày</th><th>Thời gian</th><th>Dịch vụ</th><th>Đã đặt / sức chứa</th></tr></thead><tbody>
            {schedules.map((schedule) => <tr key={schedule.id}><td>{schedule.date_display || schedule.work_date}</td><td>{schedule.time}</td><td>{schedule.service_type_label || schedule.service_type}</td><td>{schedule.booked_orders} / {schedule.max_orders}</td></tr>)}
            {!schedules.length && <tr><td colSpan="4">Chưa có lịch tại cơ sở này.</td></tr>}
          </tbody></table></div>
        </div>
      </div>
    </StaffLayout>
  );
}

export default Dashboard;
