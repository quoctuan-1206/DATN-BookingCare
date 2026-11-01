import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  CalendarCheck,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  DoorOpen,
  PhoneCall,
  RefreshCw,
  Search,
  Stethoscope,
  UserRound,
  UsersRound,
} from "lucide-react";
import toast from "react-hot-toast";
import StaffLayout from "../../components/staff/StaffLayout";
import appointmentService, {
  STATUS_CLASS,
  STATUS_LABEL,
} from "../../services/appointment.service";
import { getApiErrorMessage } from "../../api/axios";

function getVietnamToday() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
}

const today = getVietnamToday();
const actionsByStatus = {
  CONFIRMED: [
    { action: "check-in", label: "Check-in & cấp số", kind: "primary", icon: ClipboardCheck },
    { action: "no-show", label: "Không đến", kind: "danger", icon: AlertCircle },
  ],
  CHECKED_IN: [{ action: "enqueue", label: "Đưa vào hàng đợi", kind: "primary", icon: ArrowRight }],
  WAITING: [{ action: "call", label: "Gọi bệnh nhân", kind: "primary", icon: PhoneCall }],
};

const statusOptions = ["PENDING", "CONFIRMED", "CHECKED_IN", "WAITING", "CALLED", "IN_PROGRESS", "COMPLETED", "CANCELLED", "NO_SHOW"];

function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [dayStats, setDayStats] = useState({ total: 0, checkIn: 0, waiting: 0, inProgress: 0, completed: 0 });
  const [currentCalling, setCurrentCalling] = useState([]);
  const [waitingQueue, setWaitingQueue] = useState([]);
  const [filteredTotal, setFilteredTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [queueLoading, setQueueLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [searchValue, setSearchValue] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [date, setDate] = useState(today);
  const [error, setError] = useState("");
  const [queueError, setQueueError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = { page: 1, limit: 100 };
      if (search.trim()) params.search = search.trim();
      if (status) params.status = status;
      const result = date === today
        ? await appointmentService.getToday(params)
        : await appointmentService.getAppointments({ ...params, date });
      setAppointments(result.data || []);
      setFilteredTotal(result.pagination?.total ?? result.data?.length ?? 0);
    } catch (loadError) {
      setError(getApiErrorMessage(loadError, "Không tải được danh sách lịch khám"));
      setAppointments([]);
      setFilteredTotal(0);
    } finally {
      setLoading(false);
    }
  }, [search, status, date]);

  const loadDayAppointments = useCallback(async () => {
    setQueueLoading(true);
    setQueueError("");
    try {
      const fetchByStatus = (status, limit = 1) => {
        const params = { page: 1, limit, ...(status ? { status } : {}) };
        return date === today
          ? appointmentService.getToday(params)
          : appointmentService.getAppointments({ ...params, date });
      };
      const [all, confirmed, waiting, called, inProgress, completed] = await Promise.all([
        fetchByStatus("", 1),
        fetchByStatus("CONFIRMED", 100),
        fetchByStatus("WAITING", 100),
        fetchByStatus("CALLED", 100),
        fetchByStatus("IN_PROGRESS"),
        fetchByStatus("COMPLETED"),
      ]);
      setDayStats({
        total: all.pagination?.total ?? 0,
        checkIn: (confirmed.data || []).filter((item) => item.consultation_type !== "ONLINE").length,
        waiting: waiting.pagination?.total ?? waiting.data?.length ?? 0,
        inProgress: inProgress.pagination?.total ?? inProgress.data?.length ?? 0,
        completed: completed.pagination?.total ?? completed.data?.length ?? 0,
      });
      setWaitingQueue((waiting.data || []).filter((item) => item.queue_number != null));
      setCurrentCalling(called.data || []);
    } catch (loadError) {
      setQueueError(getApiErrorMessage(loadError, "Không tải được thông tin hàng đợi"));
      setDayStats({ total: 0, checkIn: 0, waiting: 0, inProgress: 0, completed: 0 });
      setWaitingQueue([]);
      setCurrentCalling([]);
    } finally {
      setQueueLoading(false);
    }
  }, [date]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { loadDayAppointments(); }, [loadDayAppointments]);

  const stats = dayStats;
  const orderedWaitingQueue = useMemo(() => [...waitingQueue]
    .sort((a, b) => Number(a.queue_number) - Number(b.queue_number)), [waitingQueue]);
  const waitingQueueGroups = useMemo(() => {
    const groups = new Map();
    for (const item of orderedWaitingQueue) {
      const key = `${item.clinic_id || item.clinic || "clinic"}:${item.doctor_id || item.doctor_name || "doctor"}`;
      if (!groups.has(key)) groups.set(key, { key, doctorName: item.doctor_name || "Bác sĩ", room: item.room || null, items: [] });
      groups.get(key).items.push(item);
    }
    return [...groups.values()];
  }, [orderedWaitingQueue]);

  async function runAction(item, action) {
    if (busyId !== null || date !== today) return;
    if (action === "no-show" && !window.confirm(`Xác nhận đánh dấu lịch ${item.booking_code || `#${item.id}`} là “Không đến”?`)) return;

    setBusyId(item.id);
    try {
      await appointmentService.performAction(item.id, action);
      const successMessage = {
        "check-in": "Đã check-in và cấp số thứ tự",
        "no-show": "Đã đánh dấu bệnh nhân không đến",
        enqueue: "Đã đưa bệnh nhân vào hàng đợi",
        call: "Đã gọi bệnh nhân",
      }[action] || "Đã cập nhật lượt khám";
      toast.success(successMessage);
      await Promise.all([load(), loadDayAppointments()]);
    } catch (actionError) {
      toast.error(getApiErrorMessage(actionError, "Không thể cập nhật lượt khám"));
    } finally {
      setBusyId(null);
    }
  }

  const submitSearch = (event) => {
    event.preventDefault();
    setSearch(searchValue.trim());
  };

  const clearFilters = () => {
    setSearchValue("");
    setSearch("");
    setStatus("");
    setDate(today);
  };

  return (
    <StaffLayout title="Check-in & hàng đợi khám">
      <div className="staff-appointments-page">
        <section className="staff-appointments-hero">
          <div><span className="staff-appointments-eyebrow"><ClipboardCheck size={15} /> TIẾP NHẬN BỆNH NHÂN</span><h1>Check-in & hàng đợi khám</h1><p>Check-in, cấp số và gọi bệnh nhân theo đúng thứ tự. Quản lý danh sách lịch khám trong ngày.</p></div>
          <span className="staff-appointments-hero-icon" aria-hidden="true"><CalendarCheck size={36} /></span>
        </section>

        <section className="staff-appointments-stats" aria-label="Thống kê lịch khám hôm nay">
          <AppointmentStat icon={CalendarDays} tone="blue" label={date === today ? "Tổng lịch khám hôm nay" : "Tổng lịch khám ngày đang xem"} detail="Tất cả trạng thái trong ngày" value={stats.total} loading={queueLoading} />
          <AppointmentStat icon={Clock3} tone="amber" label="Đang chờ check-in" detail="Lịch đã xác nhận, khám trực tiếp" value={stats.checkIn} loading={queueLoading} />
          <AppointmentStat icon={UsersRound} tone="green" label="Đang chờ khám" detail="Đã được xếp số vào hàng đợi" value={stats.waiting} loading={queueLoading} />
          <AppointmentStat icon={Stethoscope} tone="violet" label="Đang khám" detail="Đang trong lượt khám" value={stats.inProgress} loading={queueLoading} />
          <AppointmentStat icon={CheckCircle2} tone="emerald" label="Đã hoàn thành" detail="Lượt khám đã kết thúc" value={stats.completed} loading={queueLoading} />
        </section>

        <section className="staff-appointments-filter-card">
          <form className="staff-appointments-filters" onSubmit={submitSearch}>
            <label className="staff-appointments-search"><Search size={17} /><input aria-label="Tìm kiếm lịch khám" placeholder="Nhập mã lịch, tên bệnh nhân hoặc số điện thoại..." value={searchValue} onChange={(event) => setSearchValue(event.target.value)} /></label>
            <label className="staff-appointments-date"><span>Ngày khám</span><input type="date" value={date} onChange={(event) => setDate(event.target.value)} /></label>
            <label className="staff-appointments-status"><span>Trạng thái</span><select value={status} onChange={(event) => setStatus(event.target.value)}><option value="">Tất cả trạng thái</option>{statusOptions.map((value) => <option key={value} value={value}>{STATUS_LABEL[value]}</option>)}</select></label>
            <div className="staff-appointments-filter-actions"><button type="submit" className="staff-appointments-search-button"><Search size={15} /> Tìm kiếm</button><button type="button" className="staff-appointments-today-button" onClick={() => setDate(today)}>Hôm nay</button>{(search || status || date !== today || searchValue) && <button type="button" className="staff-appointments-clear-button" onClick={clearFilters}>Xóa lọc</button>}</div>
          </form>
        </section>

        <div className="staff-appointments-workspace">
          <main className="staff-appointments-list-card">
            <div className="staff-appointments-card-heading"><div><span>DANH SÁCH</span><h2>Danh sách lịch khám</h2><p>{date === today ? "Lịch khám hôm nay" : `Lịch khám ngày ${date}`} · {filteredTotal.toLocaleString("vi-VN")} lịch</p></div><button type="button" aria-label="Tải lại danh sách" onClick={() => { load(); loadDayAppointments(); }} disabled={loading || queueLoading}><RefreshCw size={16} /></button></div>
            {loading ? <AppointmentTableSkeleton /> : error ? <AppointmentError message={error} onRetry={load} /> : appointments.length === 0 ? <AppointmentEmpty filtered={Boolean(search || status)} date={date} onClear={clearFilters} /> : <>
              <div className="staff-appointments-table-wrap"><table className="staff-appointments-table"><thead><tr><th>STT</th><th>Bệnh nhân</th><th>Bác sĩ</th><th>Giờ khám</th><th>Phòng</th><th>Trạng thái</th><th>Thao tác</th></tr></thead><tbody>
                {appointments.map((item) => {
                  const actions = (actionsByStatus[item.status] || []).filter((action) => item.consultation_type !== "ONLINE" || !["check-in", "enqueue"].includes(action.action));
                  return <tr key={item.id}>
                    <td><span className={`staff-appointments-queue-number${item.queue_number ? " is-assigned" : ""}`}>{item.queue_number ? `#${String(item.queue_number).padStart(2, "0")}` : "—"}</span></td>
                    <td><div className="staff-appointments-patient"><span><UserRound size={17} /></span><div><strong>{item.patient_name || "—"}</strong><small>{item.booking_code || `#${item.id}`} · {item.patient_phone || "—"}</small></div></div></td>
                    <td>{item.doctor_name || "—"}</td><td><span className="staff-appointments-time"><Clock3 size={14} />{item.start_time || item.time || "—"}</span></td><td>{item.room || "—"}</td>
                    <td><AppointmentStatus status={item.status} /></td>
                    <td><div className="staff-appointments-row-actions">{actions.length ? actions.map(({ action, label, kind, icon: Icon }) => <span className="staff-appointments-action-wrap" key={action} title={date !== today ? "Chỉ có thể thao tác với lịch khám hôm nay" : undefined}><button type="button" className={`staff-appointments-action staff-appointments-action--${kind}`} disabled={busyId === item.id || busyId !== null || date !== today} onClick={() => runAction(item, action)}>{busyId === item.id ? <span className="staff-appointments-spinner" /> : <Icon size={14} />}{busyId === item.id ? "Đang xử lý" : label}</button></span>) : <span className="staff-appointments-no-action">—</span>}</div></td>
                  </tr>;
                })}
              </tbody></table></div>
              <div className="staff-appointments-table-footer">Đang hiển thị {appointments.length} / {filteredTotal.toLocaleString("vi-VN")} lịch khám</div>
            </>}
          </main>

          <aside className="staff-appointments-queue-column">
            <section className="staff-appointments-queue-card staff-appointments-calling-card">
              <div className="staff-appointments-card-heading"><div><span>ĐIỀU PHỐI</span><h2>Đang gọi bệnh nhân</h2></div><span className="staff-appointments-live-dot" title="Trạng thái hiện tại từ dữ liệu lịch khám" /></div>
              {queueLoading ? <AppointmentQueueSkeleton /> : queueError ? <AppointmentError message={queueError} onRetry={loadDayAppointments} /> : currentCalling.length === 0 ? <div className="staff-appointments-calling-empty"><PhoneCall size={23} /><strong>Chưa có bệnh nhân đang được gọi</strong></div> : <div className="staff-appointments-current-list">{currentCalling.map((item) => <article className="staff-appointments-current" key={item.id}><span className="staff-appointments-current-number">{item.queue_number ? `#${String(item.queue_number).padStart(2, "0")}` : "—"}</span><div><strong>{item.patient_name || "—"}</strong><small>{item.doctor_name || "Chưa có bác sĩ"}</small><small><DoorOpen size={13} /> {item.room || "Chưa có phòng"}</small><AppointmentStatus status={item.status} /></div></article>)}</div>}
            </section>

            <section className="staff-appointments-queue-card">
              <div className="staff-appointments-card-heading"><div><span>{date === today ? "HÔM NAY" : date}</span><h2>Hàng đợi khám</h2></div><span className="staff-appointments-queue-count">{queueLoading ? "—" : stats.waiting}</span></div>
              {queueLoading ? <AppointmentQueueSkeleton /> : queueError ? <AppointmentError message={queueError} onRetry={loadDayAppointments} /> : waitingQueueGroups.length === 0 ? <div className="staff-appointments-queue-empty"><UsersRound size={21} /><span>Chưa có bệnh nhân trong hàng đợi.</span></div> : <div className="staff-appointments-queue-groups">{waitingQueueGroups.map((group) => <section className="staff-appointments-queue-group" key={group.key}><h3><Stethoscope size={13} />{group.doctorName}{group.room ? ` · ${group.room}` : ""}</h3><ol className="staff-appointments-queue-list">{group.items.map((item) => <li key={item.id}><span className="staff-appointments-queue-list-number">#{String(item.queue_number).padStart(2, "0")}</span><div><strong>{item.patient_name || "—"}</strong><small><Clock3 size={12} /> {item.start_time || item.time || "—"} · {item.room || "Chưa có phòng"}</small></div><AppointmentStatus status={item.status} /></li>)}</ol></section>)}</div>}
            </section>

            <section className="staff-appointments-guidance"><h2>Lưu ý</h2><ul><li>Chỉ thao tác với lịch khám hôm nay.</li><li>Bệnh nhân cần check-in và được cấp số trước khi vào hàng đợi.</li><li>Gọi bệnh nhân theo số thứ tự do hệ thống cấp.</li></ul></section>
          </aside>
        </div>
      </div>
    </StaffLayout>
  );
}

function AppointmentStat({ icon: Icon, tone, label, detail, value, loading }) {
  return <article className="staff-appointments-stat"><span className={`staff-appointments-stat-icon staff-appointments-stat-icon--${tone}`}><Icon size={19} /></span><div><small>{label}</small><strong>{loading ? <i /> : Number(value || 0).toLocaleString("vi-VN")}</strong><span>{detail}</span></div></article>;
}

function AppointmentStatus({ status }) {
  const label = STATUS_LABEL[status] || status || "Chưa rõ";
  const tone = STATUS_CLASS[status] || "pending";
  return <span className={`staff-appointments-status staff-appointments-status--${tone}`}><i />{label}</span>;
}

function AppointmentTableSkeleton() {
  return <div className="staff-appointments-skeleton" aria-busy="true" aria-label="Đang tải lịch khám">{[0, 1, 2, 3, 4].map((item) => <i key={item} />)}</div>;
}

function AppointmentQueueSkeleton() {
  return <div className="staff-appointments-queue-skeleton" aria-busy="true" aria-label="Đang tải hàng đợi">{[0, 1].map((item) => <i key={item} />)}</div>;
}

function AppointmentError({ message, onRetry }) {
  return <div className="staff-appointments-error" role="alert"><span>{message}</span><button type="button" onClick={onRetry}><RefreshCw size={14} /> Thử lại</button></div>;
}

function AppointmentEmpty({ filtered, date, onClear }) {
  return <div className="staff-appointments-empty"><CalendarDays size={30} /><strong>{filtered ? "Không tìm thấy lịch khám phù hợp" : "Không có lịch khám"}</strong><span>{filtered ? "Thử xóa hoặc thay đổi bộ lọc." : date === today ? "Hôm nay chưa có lịch khám cần tiếp nhận." : `Không có lịch khám ngày ${date}.`}</span>{filtered && <button type="button" onClick={onClear}>Xóa bộ lọc</button>}</div>;
}

export default Appointments;
