import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Boxes,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Package,
  PackageOpen,
  Pill,
  Plus,
  RefreshCw,
  Search,
  Truck,
  X,
  XCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import api, { getApiErrorMessage } from "../../api/axios";
import clinicService from "../../services/clinic.service";
import StaffLayout from "../../components/staff/StaffLayout";
import { useAuth } from "../../context/AuthContext";

const blank = {
  medicine_id: "",
  quantity: "",
  batch_code: "",
  expires_at: "",
  unit_cost: "",
  supplier: "",
  strategy: "FEFO",
};
const PAGE_SIZE = 10;
const previewTabs = [
  { id: "info", label: "Thông tin" },
  { id: "batches", label: "Lô hàng" },
  { id: "history", label: "Lịch sử" },
];

function getStockStatus(medicine) {
  if (Number(medicine.stock) <= 0) return { key: "empty", label: "Hết hàng" };
  if (Number(medicine.stock) <= Number(medicine.minimum_stock)) return { key: "low", label: "Tồn thấp" };
  return { key: "ok", label: "Đủ hàng" };
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString("vi-VN");
}

function formatMoney(value) {
  return `${Number(value || 0).toLocaleString("vi-VN")} ₫`;
}

function getBatchStatus(batch) {
  const expiry = batch.expires_at ? new Date(batch.expires_at) : null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (expiry && expiry < today) return { key: "expired", label: "Đã hết hạn" };
  if (Number(batch.quantity_remaining) <= 0) return { key: "empty", label: "Hết hàng" };
  if (batch.is_locked) return { key: "locked", label: "Đã khóa" };
  const edge = new Date(today);
  edge.setDate(edge.getDate() + 90);
  if (expiry && expiry <= edge) return { key: "soon", label: "Sắp hết hạn" };
  return { key: "available", label: "Khả dụng" };
}

function transactionLabel(kind) {
  return ({
    RECEIPT: "Nhập kho",
    ISSUE: "Xuất kho",
    ADJUSTMENT: "Điều chỉnh",
    EXPIRED: "Xử lý hết hạn",
    RETURN: "Hoàn trả",
  })[kind] || kind || "Khác";
}

function Inventory() {
  const { user } = useAuth();
  const isAdmin = user?.role?.name === "Admin";
  const [clinics, setClinics] = useState([]);
  const [clinicId, setClinicId] = useState("");
  const [data, setData] = useState(null);
  const [form, setForm] = useState(blank);
  const [transactionKind, setTransactionKind] = useState("receipt");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [stockFilter, setStockFilter] = useState("ALL");
  const [selectedMedicineId, setSelectedMedicineId] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(() => typeof window === "undefined" || window.innerWidth >= 1440);
  const [activeTab, setActiveTab] = useState("info");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (isAdmin) {
      clinicService.getClinics({ page: 1, limit: 100 })
        .then((response) => setClinics((response.data || []).filter((clinic) => clinic.is_active !== false)))
        .catch(() => setClinics([]));
    }
  }, [isAdmin]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/inventory/summary", {
        params: isAdmin && clinicId ? { clinic_id: Number(clinicId) } : {},
      });
      setData(response.data.data);
    } catch (requestError) {
      const message = getApiErrorMessage(requestError, "Không tải được kho dược");
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [isAdmin, clinicId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    try {
      const payload = {
        medicine_id: Number(form.medicine_id),
        quantity: Number(form.quantity),
        ...(isAdmin && clinicId ? { clinic_id: Number(clinicId) } : {}),
      };
      if (transactionKind === "receipt") {
        Object.assign(payload, {
          batch_code: form.batch_code,
          expires_at: form.expires_at || null,
          unit_cost: Number(form.unit_cost || 0),
          supplier: form.supplier,
        });
      } else {
        payload.strategy = form.strategy;
      }
      await api.post(`/inventory/${transactionKind === "receipt" ? "receipts" : "issues"}`, payload);
      toast.success(transactionKind === "receipt" ? "Đã nhập kho" : "Đã xuất kho");
      setForm(blank);
      await refresh();
    } catch (requestError) {
      toast.error(getApiErrorMessage(requestError, "Thao tác thất bại"));
    } finally {
      setBusy(false);
    }
  };

  const processExpired = async () => {
    if (!window.confirm("Xác nhận loại bỏ toàn bộ số lượng còn lại của các lô đã hết hạn?")) return;
    setBusy(true);
    try {
      const response = await api.post("/inventory/expired/process", null, {
        params: isAdmin && clinicId ? { clinic_id: Number(clinicId) } : {},
      });
      toast.success(`Đã xử lý ${response.data.data.count} lô hết hạn`);
      await refresh();
    } catch (requestError) {
      toast.error(getApiErrorMessage(requestError, "Không xử lý được lô hết hạn"));
    } finally {
      setBusy(false);
    }
  };

  const medicines = data?.medicines || [];
  const filteredMedicines = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("vi");
    return medicines.filter((medicine) => {
      const matchesSearch = !query
        || medicine.name.toLocaleLowerCase("vi").includes(query)
        || String(medicine.id).includes(query);
      const status = getStockStatus(medicine).key;
      const matchesStatus = stockFilter === "ALL" || stockFilter === status;
      return matchesSearch && matchesStatus;
    });
  }, [medicines, search, stockFilter]);
  const pageCount = Math.max(1, Math.ceil(filteredMedicines.length / PAGE_SIZE));
  const pageMedicines = filteredMedicines.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const selectedMedicine = medicines.find((medicine) => medicine.id === selectedMedicineId) || null;
  const selectedBatches = (data?.batches || []).filter((batch) => batch.medicine_id === selectedMedicineId);
  const selectedStock = selectedBatches.reduce((sum, batch) => sum + Number(batch.quantity_remaining || 0), 0);
  const averageUnitCost = selectedStock > 0
    ? selectedBatches.reduce((sum, batch) => sum + Number(batch.unit_cost || 0) * Number(batch.quantity_remaining || 0), 0) / selectedStock
    : null;
  const selectedTransactions = (data?.transactions || []).filter((transaction) => transaction.medicine_id === selectedMedicineId);

  const resetFilters = () => {
    setSearch("");
    setStockFilter("ALL");
    setCurrentPage(1);
  };

  const selectMedicine = (medicine) => {
    setSelectedMedicineId(medicine.id);
    setActiveTab("info");
    setPreviewOpen(true);
  };

  const totals = data?.totals || {};

  return (
    <StaffLayout title="Quản lý kho dược">
      <div className="inventory-page">
        <section className="inventory-hero">
          <div>
            <span className="inventory-eyebrow"><Package size={15} /> QUẢN LÝ DƯỢC PHẨM</span>
            <h1>Quản lý kho dược</h1>
            <p>Theo dõi tồn kho, nhập – xuất, lô hàng và hạn sử dụng. Đảm bảo cung ứng thuốc an toàn và hiệu quả.</p>
          </div>
          <div className="inventory-hero-mark" aria-hidden="true"><Package size={44} /></div>
        </section>

        {isAdmin && <div className="inventory-clinic-filter">
          <label htmlFor="inventory-clinic">Cơ sở kho</label>
          <select id="inventory-clinic" className="admin-select" value={clinicId} onChange={(event) => { setClinicId(event.target.value); setCurrentPage(1); setSelectedMedicineId(null); }}>
            <option value="">Tất cả cơ sở</option>
            {clinics.map((clinic) => <option key={clinic.id} value={clinic.id}>{clinic.name}</option>)}
          </select>
        </div>}

        <section className="inventory-stats" aria-label="Thống kê kho dược">
          <InventoryStat icon={Package} tone="green" label="Mặt hàng" value={totals.items} detail="Loại thuốc đang quản lý" loading={loading} />
          <InventoryStat icon={Boxes} tone="blue" label="Tổng số lượng" value={totals.units} detail="Đơn vị còn trong kho" loading={loading} />
          <InventoryStat icon={AlertTriangle} tone="amber" label="Tồn thấp" value={totals.low_stock} detail="Đạt ngưỡng tồn tối thiểu" loading={loading} />
          <InventoryStat icon={CalendarClock} tone="violet" label="Sắp hết hạn" value={totals.expiring} detail="Lô trong 90 ngày tới" loading={loading} />
          <InventoryStat icon={XCircle} tone="red" label="Đã hết hạn" value={totals.expired} detail="Lô cần xử lý" loading={loading} />
        </section>

        {error && !data && <div className="inventory-error" role="alert"><p>{error}</p><button type="button" onClick={refresh}><RefreshCw size={15} /> Thử lại</button></div>}

        <div className={`inventory-workspace${previewOpen ? " inventory-workspace--preview-open" : ""}`}>
          <main className="inventory-content">
            <section className="inventory-card inventory-transaction-card">
              <div className="inventory-section-heading">
                <div><span className="inventory-section-kicker">THAO TÁC KHO</span><h2>Nhập / xuất kho</h2><p>Thực hiện nhập hoặc xuất kho theo lô, nhà cung cấp và FEFO.</p></div>
              </div>
              <div className="inventory-kind-switch" role="tablist" aria-label="Loại giao dịch kho">
                <button type="button" role="tab" aria-selected={transactionKind === "receipt"} className={transactionKind === "receipt" ? "active" : ""} onClick={() => setTransactionKind("receipt")}><Truck size={16} /> Nhập kho</button>
                <button type="button" role="tab" aria-selected={transactionKind === "issue"} className={transactionKind === "issue" ? "active" : ""} onClick={() => setTransactionKind("issue")}><Boxes size={16} /> Xuất kho</button>
              </div>
              <form className="inventory-form" onSubmit={submit}>
                <div className="inventory-field inventory-field--wide"><label htmlFor="inventory-medicine">Mặt hàng</label><select id="inventory-medicine" value={form.medicine_id} onChange={(event) => setForm((current) => ({ ...current, medicine_id: event.target.value }))} required><option value="">Chọn thuốc</option>{medicines.map((medicine) => <option key={medicine.id} value={medicine.id}>{medicine.name} · tồn {medicine.stock} {medicine.unit || ""}</option>)}</select></div>
                <div className="inventory-field"><label htmlFor="inventory-quantity">Số lượng {transactionKind === "receipt" ? "nhập" : "xuất"}</label><input id="inventory-quantity" type="number" min="1" step="1" inputMode="numeric" placeholder="Nhập số lượng" value={form.quantity} onChange={(event) => setForm((current) => ({ ...current, quantity: event.target.value }))} required /></div>
                {transactionKind === "receipt" ? <>
                  <div className="inventory-field"><label htmlFor="inventory-batch">Mã lô</label><input id="inventory-batch" placeholder="Nhập mã lô" value={form.batch_code} onChange={(event) => setForm((current) => ({ ...current, batch_code: event.target.value }))} required /></div>
                  <div className="inventory-field"><label htmlFor="inventory-expiry">Hạn sử dụng</label><input id="inventory-expiry" type="date" value={form.expires_at} onChange={(event) => setForm((current) => ({ ...current, expires_at: event.target.value }))} /></div>
                  <div className="inventory-field"><label htmlFor="inventory-cost">Giá nhập / đơn vị</label><div className="inventory-input-icon"><CircleDollarSign size={16} /><input id="inventory-cost" type="number" min="0" step="0.01" placeholder="0" value={form.unit_cost} onChange={(event) => setForm((current) => ({ ...current, unit_cost: event.target.value }))} /></div></div>
                  <div className="inventory-field inventory-field--wide"><label htmlFor="inventory-supplier">Nhà cung cấp</label><input id="inventory-supplier" placeholder="Tên nhà cung cấp (nếu có)" value={form.supplier} onChange={(event) => setForm((current) => ({ ...current, supplier: event.target.value }))} /></div>
                </> : <div className="inventory-field"><label htmlFor="inventory-strategy">Phương pháp xuất kho</label><select id="inventory-strategy" value={form.strategy} onChange={(event) => setForm((current) => ({ ...current, strategy: event.target.value }))}><option value="FEFO">FEFO · hết hạn trước, xuất trước</option><option value="FIFO">FIFO · nhập trước, xuất trước</option></select></div>}
                <div className="inventory-form-actions"><button type="submit" className={`inventory-submit inventory-submit--${transactionKind}`} disabled={busy || loading || !form.medicine_id || !form.quantity || (isAdmin && !clinicId)}>{busy ? <span className="inventory-button-spinner" /> : transactionKind === "receipt" ? <Plus size={16} /> : <Boxes size={16} />}{busy ? "Đang xử lý…" : transactionKind === "receipt" ? "Nhập kho" : "Xuất kho"}</button>{isAdmin && !clinicId && <small>Chọn cơ sở để thực hiện giao dịch.</small>}</div>
              </form>
            </section>

            <section className="inventory-card inventory-medicine-card">
              <div className="inventory-section-heading inventory-table-heading">
                <div><span className="inventory-section-kicker">TỒN KHO</span><h2>Danh sách thuốc</h2><p>Chọn một mặt hàng để xem tồn kho, lô hàng và lịch sử giao dịch.</p></div>
                <div className="inventory-table-filters"><label className="inventory-search"><Search size={16} /><input aria-label="Tìm thuốc" placeholder="Tìm theo tên hoặc mã" value={search} onChange={(event) => { setSearch(event.target.value); setCurrentPage(1); }} /></label><select aria-label="Lọc trạng thái tồn kho" value={stockFilter} onChange={(event) => { setStockFilter(event.target.value); setCurrentPage(1); }}><option value="ALL">Tất cả trạng thái</option><option value="ok">Đủ hàng</option><option value="low">Tồn thấp</option><option value="empty">Hết hàng</option></select></div>
              </div>
              {loading && !data ? <InventoryTableSkeleton /> : error && !data ? null : medicines.length === 0 ? <div className="inventory-empty"><PackageOpen size={32} /><strong>Chưa có thuốc trong kho</strong><span>Danh mục thuốc sẽ xuất hiện tại đây khi có dữ liệu.</span></div> : filteredMedicines.length === 0 ? <div className="inventory-empty"><Search size={30} /><strong>Không tìm thấy thuốc phù hợp</strong><span>Thử đổi từ khóa hoặc trạng thái tồn kho.</span><button type="button" onClick={resetFilters}>Xóa bộ lọc</button></div> : <>
                <div className="inventory-table-wrap"><table className="inventory-table"><thead><tr><th>STT</th><th>Mặt hàng</th><th>Đơn vị</th><th>Tồn kho</th><th>Mức tối thiểu</th><th>Chiến lược</th><th>Trạng thái</th></tr></thead><tbody>{pageMedicines.map((medicine, index) => {
                  const stockStatus = getStockStatus(medicine);
                  return <tr key={medicine.id} className={medicine.id === selectedMedicineId ? "is-selected" : ""} onClick={() => selectMedicine(medicine)} tabIndex={0} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); selectMedicine(medicine); } }}>
                    <td>{(currentPage - 1) * PAGE_SIZE + index + 1}</td><td><span className="inventory-medicine-name"><span><Pill size={17} /></span><strong>{medicine.name}</strong><small>Mã thuốc #{medicine.id}</small></span></td><td>{medicine.unit || "—"}</td><td><strong>{Number(medicine.stock).toLocaleString("vi-VN")}</strong></td><td>{Number(medicine.minimum_stock).toLocaleString("vi-VN")}</td><td>{medicine.issue_strategy || "—"}</td><td><span className={`inventory-status inventory-status--${stockStatus.key}`}>{stockStatus.label}</span></td>
                  </tr>;
                })}</tbody></table></div>
                <div className="inventory-pagination"><span>{filteredMedicines.length ? `Hiển thị ${(currentPage - 1) * PAGE_SIZE + 1}–${Math.min(currentPage * PAGE_SIZE, filteredMedicines.length)} trên ${filteredMedicines.length} mặt hàng` : "Không có mặt hàng"}</span><div><button type="button" aria-label="Trang trước" disabled={currentPage <= 1} onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}><ChevronLeft size={16} /></button><span>{currentPage} / {pageCount}</span><button type="button" aria-label="Trang sau" disabled={currentPage >= pageCount} onClick={() => setCurrentPage((page) => Math.min(pageCount, page + 1))}><ChevronRight size={16} /></button></div></div>
              </>}
            </section>
          </main>

          {previewOpen && <div className="inventory-preview-backdrop" onClick={() => setPreviewOpen(false)}>
            <aside className="inventory-preview" aria-label="Chi tiết thuốc" onClick={(event) => event.stopPropagation()}>
              <div className="inventory-preview-heading"><div><span>CHI TIẾT TỒN KHO</span><h2>Chi tiết thuốc</h2></div><button type="button" aria-label="Đóng chi tiết thuốc" onClick={() => setPreviewOpen(false)}><X size={18} /></button></div>
              {selectedMedicine ? <>
                <div className="inventory-preview-medicine"><span><Pill size={22} /></span><div><strong>{selectedMedicine.name}</strong><small>Mã thuốc #{selectedMedicine.id}</small></div><span className={`inventory-status inventory-status--${getStockStatus(selectedMedicine).key}`}>{getStockStatus(selectedMedicine).label}</span></div>
                <div className="inventory-preview-tabs" role="tablist" aria-label="Thông tin thuốc">{previewTabs.map((tab) => <button key={tab.id} type="button" role="tab" aria-selected={activeTab === tab.id} className={activeTab === tab.id ? "active" : ""} onClick={() => setActiveTab(tab.id)}>{tab.label}</button>)}</div>
                {activeTab === "info" && <div className="inventory-preview-info"><InventoryDetail label="Đơn vị tính" value={selectedMedicine.unit} /><InventoryDetail label="Tồn kho hiện tại" value={`${Number(selectedMedicine.stock).toLocaleString("vi-VN")} ${selectedMedicine.unit || "đơn vị"}`} /><InventoryDetail label="Mức tồn tối thiểu" value={`${selectedMedicine.minimum_stock ?? "—"} ${selectedMedicine.unit || ""}`} /><InventoryDetail label="Giá nhập bình quân (tồn hiện tại)" value={averageUnitCost === null ? "Chưa có thông tin" : formatMoney(averageUnitCost)} /><InventoryDetail label="Chiến lược xuất kho" value={selectedMedicine.issue_strategy || "Chưa có thông tin"} /><InventoryDetail label="Trạng thái tồn" value={getStockStatus(selectedMedicine).label} /></div>}
                {activeTab === "batches" && <div className="inventory-preview-records">{selectedBatches.length ? selectedBatches.map((batch) => <BatchPreview key={batch.id} batch={batch} />) : <InventoryTabEmpty text="Chưa có thông tin lô hàng của thuốc này." />}</div>}
                {activeTab === "history" && <div className="inventory-preview-records">{selectedTransactions.length ? selectedTransactions.map((transaction) => <TransactionPreview key={transaction.id} transaction={transaction} />) : <InventoryTabEmpty text="Chưa có giao dịch gần đây cho thuốc này." />}</div>}
              </> : <div className="inventory-preview-empty"><PackageOpen size={32} /><strong>Chọn một mặt hàng</strong><p>Chọn thuốc trong danh sách để xem thông tin, lô hàng và lịch sử.</p></div>}
            </aside>
          </div>}
        </div>

        <section className="inventory-card inventory-batches-card">
          <div className="inventory-section-heading inventory-section-heading--inline"><div><span className="inventory-section-kicker">THEO DÕI HẠN DÙNG</span><h2>Lô hàng và hạn sử dụng</h2><p>Các lô đang có trong kho, sắp hết hạn hoặc đã quá hạn.</p></div><button type="button" className="inventory-expired-button" disabled={busy || loading || !totals.expired} onClick={processExpired}><RefreshCw size={15} /> Xử lý hàng hết hạn</button></div>
          {loading && !data ? <InventoryTableSkeleton rows={4} /> : <div className="inventory-table-wrap"><table className="inventory-table inventory-batch-table"><thead><tr><th>Mặt hàng</th><th>Mã lô</th><th>Hạn sử dụng</th><th>Số lượng còn</th><th>Nhà cung cấp</th><th>Trạng thái</th></tr></thead><tbody>{(data?.batches || []).map((batch) => { const status = getBatchStatus(batch); return <tr key={batch.id}><td>{batch.medicines?.name || "—"}</td><td>{batch.batch_code || "—"}</td><td>{formatDate(batch.expires_at)}</td><td>{Number(batch.quantity_remaining).toLocaleString("vi-VN")}</td><td>{batch.supplier || "—"}</td><td><span className={`inventory-status inventory-status--${status.key}`}>{status.label}</span></td></tr>; })}</tbody></table>{data?.batches?.length === 0 && <InventoryTabEmpty text="Chưa có lô hàng trong kho." />}</div>}
        </section>

        <section className="inventory-card inventory-transactions-card">
          <div className="inventory-section-heading"><div><span className="inventory-section-kicker">NHẬP XUẤT</span><h2>Giao dịch gần đây</h2><p>10 giao dịch gần nhất trong kho được chọn.</p></div></div>
          {loading && !data ? <InventoryTableSkeleton rows={4} /> : <div className="inventory-table-wrap"><table className="inventory-table inventory-transactions-table"><thead><tr><th>Thời gian</th><th>Mặt hàng</th><th>Loại giao dịch</th><th>Số lượng</th><th>Phân bổ lô</th></tr></thead><tbody>{(data?.transactions || []).map((transaction) => <tr key={transaction.id}><td>{new Date(transaction.created_at).toLocaleString("vi-VN")}</td><td>{transaction.medicines?.name || "—"}</td><td><span className={`inventory-transaction-kind inventory-transaction-kind--${transaction.kind?.toLowerCase()}`}>{transactionLabel(transaction.kind)}</span></td><td>{Number(transaction.quantity).toLocaleString("vi-VN")}</td><td>{(transaction.allocations || []).map((allocation) => `${allocation.inventory_batches?.batch_code || "—"}: ${allocation.quantity}`).join(", ") || "—"}</td></tr>)}</tbody></table>{data?.transactions?.length === 0 && <InventoryTabEmpty text="Chưa có giao dịch kho." />}</div>}
        </section>
      </div>
    </StaffLayout>
  );
}

function InventoryStat({ icon: Icon, tone, label, value, detail, loading }) {
  return <article className="inventory-stat"><span className={`inventory-stat-icon inventory-stat-icon--${tone}`}><Icon size={20} /></span><div><small>{label}</small><strong>{loading ? <i className="inventory-skeleton-value" /> : Number(value ?? 0).toLocaleString("vi-VN")}</strong><span>{detail}</span></div></article>;
}

function InventoryDetail({ label, value }) {
  return <div className="inventory-detail-row"><span>{label}</span><strong>{value || "Chưa có thông tin"}</strong></div>;
}

function BatchPreview({ batch }) {
  const status = getBatchStatus(batch);
  return <article className="inventory-preview-record"><div><strong>{batch.batch_code || "Lô chưa có mã"}</strong><span className={`inventory-status inventory-status--${status.key}`}>{status.label}</span></div><p>Hạn sử dụng <strong>{formatDate(batch.expires_at)}</strong></p><p>Số lượng còn <strong>{Number(batch.quantity_remaining).toLocaleString("vi-VN")}</strong></p><p>Giá nhập / đơn vị <strong>{formatMoney(batch.unit_cost)}</strong></p><p>Nhà cung cấp <strong>{batch.supplier || "Chưa có thông tin"}</strong></p></article>;
}

function TransactionPreview({ transaction }) {
  const allocations = transaction.allocations || [];
  return <article className="inventory-preview-record"><div><strong>{transactionLabel(transaction.kind)}</strong><span className={`inventory-transaction-kind inventory-transaction-kind--${transaction.kind?.toLowerCase()}`}>{Number(transaction.quantity).toLocaleString("vi-VN")}</span></div><p>Thời gian <strong>{new Date(transaction.created_at).toLocaleString("vi-VN")}</strong></p><p>Phân bổ lô <strong>{allocations.map((allocation) => `${allocation.inventory_batches?.batch_code || "—"}: ${allocation.quantity}`).join(", ") || "Chưa có thông tin"}</strong></p></article>;
}

function InventoryTabEmpty({ text }) {
  return <div className="inventory-tab-empty"><PackageOpen size={24} /><span>{text}</span></div>;
}

function InventoryTableSkeleton({ rows = 5 }) {
  return <div className="inventory-table-skeleton" aria-busy="true" aria-label="Đang tải dữ liệu">{Array.from({ length: rows }, (_, index) => <i key={index} />)}</div>;
}

export default Inventory;
