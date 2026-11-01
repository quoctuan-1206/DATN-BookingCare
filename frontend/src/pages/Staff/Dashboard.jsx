import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  ClipboardList,
  FlaskConical,
  Package,
  RefreshCw,
  UsersRound,
} from "lucide-react";
import api, { getApiErrorMessage } from "../../api/axios";
import StaffLayout from "../../components/staff/StaffLayout";
import clinicalService from "../../services/clinical.service";
import { CLINICAL_STATUS } from "../../components/clinical/clinical.constants";
import { useAuth } from "../../context/AuthContext";

const quickLinks = [
  {
    to: "/staff/appointments",
    title: "Check-in & hàng đợi",
    description: "Tiếp nhận và theo dõi lượt khám.",
    icon: UsersRound,
    tone: "blue",
  },
  {
    to: "/staff/inventory",
    title: "Kho dược",
    description: "Theo dõi tồn kho, lô và hạn dùng.",
    icon: Package,
    tone: "green",
  },
  {
    to: "/staff/clinical/orders",
    title: "Phiếu cận lâm sàng",
    description: "Tiếp nhận và cập nhật kết quả.",
    icon: ClipboardList,
    tone: "violet",
  },
  {
    to: "/staff/clinical/schedules",
    title: "Lịch cận lâm sàng",
    description: "Điều phối khung giờ thực hiện.",
    icon: CalendarDays,
    tone: "amber",
  },
];

function getPersonName(user) {
  return user?.name || [user?.last_name, user?.first_name].filter(Boolean).join(" ") || "Nhân viên";
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("vi-VN");
}

function Dashboard() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [inventory, setInventory] = useState(null);
  const [orderTotal, setOrderTotal] = useState(null);
  const [scheduleTotal, setScheduleTotal] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const loadDashboard = useCallback(async () => {
    if (!user || (user?.role?.name === "STAFF" && !user?.clinic_id)) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const [orderData, scheduleData, inventoryResponse] = await Promise.all([
        clinicalService.getOrders({ page: 1, limit: 6 }),
        clinicalService.getSchedules({ page: 1, limit: 6 }),
        api.get("/inventory/summary"),
      ]);
      setOrders(orderData.data || []);
      setSchedules(scheduleData.data || []);
      setOrderTotal(orderData.pagination?.total ?? orderData.data?.length ?? 0);
      setScheduleTotal(scheduleData.pagination?.total ?? scheduleData.data?.length ?? 0);
      setInventory(inventoryResponse.data?.data || null);
    } catch (loadError) {
      setError(getApiErrorMessage(loadError, "Không tải được dữ liệu tổng quan"));
    } finally {
      setLoading(false);
    }
  }, [user?.role?.name, user?.clinic_id]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const resultCount = orders.reduce((count, order) => count + (order.results?.length || 0), 0);
  const staffName = getPersonName(user);
  const clinicName = user?.clinics?.name || inventory?.clinic_name || "Cơ sở làm việc";
  const stats = [
    { label: "Phiếu cận lâm sàng", value: orderTotal, detail: "Phiếu trong hệ thống", icon: ClipboardList, tone: "violet" },
    { label: "Lịch thực hiện", value: scheduleTotal, detail: "Khung giờ đã thiết lập", icon: CalendarDays, tone: "blue" },
    { label: "Kết quả trong phiếu", value: resultCount, detail: "Trong 6 phiếu gần đây", icon: CheckCircle2, tone: "green" },
    { label: "Tổng tồn tại cơ sở", value: inventory?.totals?.units, detail: "Đơn vị thuốc còn trong kho", icon: Package, tone: "amber" },
  ];

  return (
    <StaffLayout title="Tổng quan STAFF">
      <div className="staff-dashboard-page">
        <section className="staff-dashboard-hero">
          <div>
            <span className="staff-dashboard-eyebrow"><Activity size={15} /> TỔNG QUAN HOẠT ĐỘNG</span>
            <h1>Xin chào, {staffName}!</h1>
            <strong className="staff-dashboard-clinic">{clinicName}</strong>
            <p>Theo dõi hoạt động và điều phối dịch vụ tại cơ sở của bạn.</p>
          </div>
          <div className="staff-dashboard-hero-icon" aria-hidden="true"><Activity size={38} /></div>
        </section>

        {error && <div className="staff-dashboard-error" role="alert"><span>{error}</span><button type="button" onClick={loadDashboard}><RefreshCw size={15} /> Thử lại</button></div>}

        <section className="staff-dashboard-stats" aria-label="Chỉ số hoạt động">
          {stats.map(({ label, value, detail, icon: Icon, tone }) => <article className="staff-dashboard-stat" key={label}>
            <span className={`staff-dashboard-stat-icon staff-dashboard-stat-icon--${tone}`}><Icon size={20} /></span>
            <div><small>{label}</small><strong>{loading ? <i className="staff-dashboard-skeleton-value" /> : Number(value ?? 0).toLocaleString("vi-VN")}</strong><span>{detail}</span></div>
          </article>)}
        </section>

        <section className="staff-dashboard-quick" aria-labelledby="staff-dashboard-quick-title">
          <div className="staff-dashboard-section-heading"><div><span>ĐIỀU HƯỚNG</span><h2 id="staff-dashboard-quick-title">Truy cập nhanh</h2></div></div>
          <div className="staff-dashboard-quick-grid">
            {quickLinks.map(({ to, title, description, icon: Icon, tone }) => <Link className="staff-dashboard-quick-link" to={to} key={to}>
              <span className={`staff-dashboard-quick-icon staff-dashboard-quick-icon--${tone}`}><Icon size={19} /></span>
              <span className="staff-dashboard-quick-copy"><strong>{title}</strong><small>{description}</small></span>
              <ArrowUpRight className="staff-dashboard-quick-arrow" size={16} />
            </Link>)}
          </div>
        </section>

        <div className="staff-dashboard-data-grid">
          <section className="staff-dashboard-data-card" aria-labelledby="staff-dashboard-orders-title">
            <div className="staff-dashboard-card-heading"><div><span>HOẠT ĐỘNG GẦN ĐÂY</span><h2 id="staff-dashboard-orders-title">Phiếu gần đây</h2></div><Link to="/staff/clinical/orders">Xem tất cả <ArrowUpRight size={15} /></Link></div>
            {loading ? <DashboardListSkeleton /> : error ? <DashboardInlineError onRetry={loadDashboard} /> : orders.length === 0 ? <DashboardEmpty icon={ClipboardList} text="Chưa có phiếu tại cơ sở này." /> : <div className="staff-dashboard-order-list">{orders.map((order) => {
              const status = CLINICAL_STATUS[order.status] || { label: order.status || "Chưa rõ", tone: "pending" };
              return <article className="staff-dashboard-order" key={order.id}>
                <span className="staff-dashboard-order-icon"><FlaskConical size={18} /></span>
                <div className="staff-dashboard-order-main"><div><strong>{order.booking_code || `#${order.id}`}</strong><span className={`staff-dashboard-status staff-dashboard-status--${status.tone}`}>{status.label}</span></div><p>{order.patient_name || "Chưa có tên bệnh nhân"}</p><small>{order.service_type_label || order.service_type || "Cận lâm sàng"}</small></div>
                <span className="staff-dashboard-result-count">{order.results?.length || 0}<small>Kết quả</small></span>
              </article>;
            })}</div>}
          </section>

          <section className="staff-dashboard-data-card" aria-labelledby="staff-dashboard-schedules-title">
            <div className="staff-dashboard-card-heading"><div><span>ĐIỀU PHỐI</span><h2 id="staff-dashboard-schedules-title">Lịch cận lâm sàng</h2></div><Link to="/staff/clinical/schedules">Xem lịch <ArrowUpRight size={15} /></Link></div>
            {loading ? <DashboardListSkeleton /> : error ? <DashboardInlineError onRetry={loadDashboard} /> : schedules.length === 0 ? <DashboardEmpty icon={CalendarDays} text="Chưa có lịch tại cơ sở này." /> : <div className="staff-dashboard-schedule-list">{schedules.map((schedule) => {
              const booked = Number(schedule.booked_orders || 0);
              const capacity = Number(schedule.max_orders || 0);
              const progress = capacity > 0 ? Math.min(100, booked / capacity * 100) : 0;
              const isPaused = schedule.is_active === false;
              const isAvailable = Boolean(schedule.available);
              const status = isPaused ? "Tạm ngừng" : isAvailable ? "Đang nhận lịch" : "Đã đầy";
              const statusTone = isPaused ? "paused" : isAvailable ? "available" : "full";
              return <article className="staff-dashboard-schedule" key={schedule.id}>
                <div className="staff-dashboard-schedule-top"><span className="staff-dashboard-service"><FlaskConical size={15} />{schedule.service_type_label || schedule.service_type || "Cận lâm sàng"}</span><span className={`staff-dashboard-status staff-dashboard-status--${statusTone}`}>{status}</span></div>
                <div className="staff-dashboard-schedule-meta"><span><CalendarDays size={14} />{schedule.date_display || formatDate(schedule.work_date)}</span><span><Clock3 size={14} />{schedule.start_time && schedule.end_time ? `${schedule.start_time} – ${schedule.end_time}` : schedule.time || "—"}</span></div>
                <div className="staff-dashboard-capacity"><div><span>Số lượt đã đặt</span><strong>{booked} / {capacity}</strong></div><div className="staff-dashboard-progress"><span style={{ width: `${progress}%` }} /></div></div>
              </article>;
            })}</div>}
          </section>
        </div>
      </div>
    </StaffLayout>
  );
}

function DashboardListSkeleton() {
  return <div className="staff-dashboard-list-skeleton" aria-busy="true" aria-label="Đang tải dữ liệu">{[0, 1, 2].map((item) => <i key={item} />)}</div>;
}

function DashboardInlineError({ onRetry }) {
  return <div className="staff-dashboard-inline-error"><span>Không tải được nội dung.</span><button type="button" onClick={onRetry}>Thử lại</button></div>;
}

function DashboardEmpty({ icon: Icon, text }) {
  return <div className="staff-dashboard-empty"><Icon size={28} /><strong>{text}</strong></div>;
}

export default Dashboard;
