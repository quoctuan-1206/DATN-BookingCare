import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  CalendarDays,
  CalendarX2,
  ClipboardList,
  Plus,
  Search,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import PatientLayout from "../../components/patient/PatientLayout";
import PatientAppointmentCard from "../../components/patient/PatientAppointmentCard";
import AppointmentPreview from "../../components/patient/AppointmentPreview";
import appointmentService from "../../services/appointment.service";
import { getApiErrorMessage } from "../../api/axios";

const tabs = [
  { key: "ALL", label: "Tất cả" },
  { key: "PENDING", label: "Đang chờ" },
  { key: "CONFIRMED", label: "Đã xác nhận" },
  { key: "COMPLETED", label: "Hoàn thành" },
  { key: "CANCELLED", label: "Đã hủy" },
];

function getAppointmentTimestamp(appointment) {
  const date = appointment.work_date || "";
  const time = appointment.start_time || appointment.time?.split(" - ")[0] || "";
  return `${date}T${time || "00:00"}`;
}

function Appointments() {
  const [activeTab, setActiveTab] = useState("ALL");
  const [appointments, setAppointments] = useState([]);
  const [counts, setCounts] = useState({});
  const [selectedId, setSelectedId] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = { page: 1, limit: 100 };
      if (activeTab !== "ALL") params.status = activeTab;
      const firstPage = await appointmentService.getAppointments(params);
      const totalPages = Number(firstPage.total_pages || 1);
      const remainingPages = await Promise.all(
        Array.from({ length: Math.max(0, totalPages - 1) }, (_, index) =>
          appointmentService.getAppointments({ ...params, page: index + 2 }),
        ),
      );
      setAppointments([
        ...(firstPage.data || []),
        ...remainingPages.flatMap((page) => page.data || []),
      ]);
    } catch (requestError) {
      const message = getApiErrorMessage(requestError, "Không tải được lịch hẹn");
      setError(message);
      setAppointments([]);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  const fetchCounts = useCallback(async () => {
    try {
      const entries = await Promise.all(
        tabs.map(async (tab) => {
          const params = { page: 1, limit: 1 };
          if (tab.key !== "ALL") params.status = tab.key;
          const result = await appointmentService.getAppointments(params);
          return [tab.key, Number(result.total ?? result.pagination?.total ?? result.data?.length ?? 0)];
        }),
      );
      setCounts(Object.fromEntries(entries));
    } catch {
      setCounts({});
    }
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  useEffect(() => {
    fetchCounts();
  }, [fetchCounts]);

  const filteredAppointments = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("vi");
    return [...appointments]
      .filter((appointment) => {
        const searchable = [appointment.doctor_name, appointment.specialty, appointment.clinic]
          .filter(Boolean)
          .join(" ")
          .toLocaleLowerCase("vi");
        const date = appointment.work_date || "";
        return (
          (!query || searchable.includes(query)) &&
          (!dateFrom || date >= dateFrom) &&
          (!dateTo || date <= dateTo)
        );
      })
      .sort((a, b) => {
        const aTime = new Date(getAppointmentTimestamp(a)).getTime();
        const bTime = new Date(getAppointmentTimestamp(b)).getTime();
        const now = Date.now();
        const aUpcoming = aTime >= now;
        const bUpcoming = bTime >= now;
        if (aUpcoming !== bUpcoming) return aUpcoming ? -1 : 1;
        return aUpcoming ? aTime - bTime : bTime - aTime;
      });
  }, [appointments, dateFrom, dateTo, search]);

  useEffect(() => {
    if (!filteredAppointments.length) {
      setSelectedId(null);
      return;
    }
    if (!filteredAppointments.some((appointment) => appointment.id === selectedId)) {
      setSelectedId(filteredAppointments[0].id);
      setPreviewOpen(true);
    }
  }, [filteredAppointments, selectedId]);

  const selectedAppointment = filteredAppointments.find((item) => item.id === selectedId) || null;
  const hasFilters = Boolean(search.trim() || dateFrom || dateTo);
  const hasPreview = previewOpen && (selectedAppointment || loading);

  const clearFilters = () => {
    setSearch("");
    setDateFrom("");
    setDateTo("");
  };

  const cancelAppointment = async (appointment) => {
    if (!appointment || cancelling) return;
    const bookingCode = appointment.booking_code ? ` (${appointment.booking_code})` : "";
    if (!window.confirm(`Bạn có chắc muốn hủy lịch hẹn${bookingCode}?`)) return;

    setCancelling(true);
    try {
      await appointmentService.updateStatus(appointment.id, "CANCELLED");
      toast.success("Đã hủy lịch hẹn");
      await Promise.all([fetchAppointments(), fetchCounts()]);
    } catch (requestError) {
      toast.error(getApiErrorMessage(requestError, "Không hủy được lịch hẹn"));
    } finally {
      setCancelling(false);
    }
  };

  return (
    <PatientLayout>
      <div className={`patient-appointments-layout${hasPreview ? " has-preview" : ""}`}>
        <section className="patient-content-card patient-appointments-list-card" aria-label="Danh sách lịch hẹn">
          <header className="patient-appointments-header">
            <div>
              <p className="patient-appointments-eyebrow">CHĂM SÓC SỨC KHỎE</p>
              <h1 className="patient-content-card-title">Lịch hẹn</h1>
              <p className="patient-appointments-description">
                Quản lý các lịch hẹn khám bệnh của bạn
              </p>
            </div>
            <Link to="/doctors" className="patient-appointments-book-button">
              <Plus size={18} aria-hidden="true" />
              Đặt lịch mới
            </Link>
          </header>

          <nav className="patient-appointments-tabs" aria-label="Lọc lịch hẹn theo trạng thái">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                className={`patient-appointments-tab patient-appointments-tab--${tab.key.toLowerCase()}${
                  activeTab === tab.key ? " is-active" : ""
                }`}
                aria-pressed={activeTab === tab.key}
                onClick={() => setActiveTab(tab.key)}
              >
                <span>{tab.label}</span>
                <span className="patient-appointments-tab-count" aria-label={`${counts[tab.key] ?? ""} lịch hẹn`}>
                  {counts[tab.key] ?? "—"}
                </span>
              </button>
            ))}
          </nav>

          <div className="patient-appointments-filters">
            <label className="patient-appointments-search">
              <Search size={18} aria-hidden="true" />
              <span className="patient-appointments-sr-only">Tìm theo tên bác sĩ, chuyên khoa hoặc cơ sở</span>
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Tìm kiếm theo tên bác sĩ, chuyên khoa..."
              />
              {search && (
                <button type="button" onClick={() => setSearch("")} aria-label="Xóa từ khóa tìm kiếm">
                  <X size={16} />
                </button>
              )}
            </label>

            <div className="patient-appointments-date-filter">
              <CalendarDays size={18} aria-hidden="true" />
              <label>
                <span className="patient-appointments-sr-only">Từ ngày</span>
                <input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} />
              </label>
              <span className="patient-appointments-date-separator">đến</span>
              <label>
                <span className="patient-appointments-sr-only">Đến ngày</span>
                <input type="date" value={dateTo} min={dateFrom || undefined} onChange={(event) => setDateTo(event.target.value)} />
              </label>
            </div>
          </div>

          <div className="patient-appointments-results-heading">
            <div>
              <h2>Danh sách lịch khám</h2>
              <p>{loading ? "Đang cập nhật lịch hẹn..." : `${filteredAppointments.length} lịch hẹn`}</p>
            </div>
            {hasFilters && (
              <button type="button" className="patient-appointments-clear" onClick={clearFilters}>
                Xóa bộ lọc
              </button>
            )}
          </div>

          {loading ? (
            <div className="patient-appointments-skeleton-list" aria-label="Đang tải lịch hẹn" aria-busy="true">
              {[0, 1, 2].map((item) => (
                <div className="patient-appointment-skeleton" key={item}>
                  <i />
                  <span><b /><b /><b /></span>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="patient-appointments-empty">
              <CalendarX2 size={42} aria-hidden="true" />
              <h2>Chưa thể tải lịch hẹn</h2>
              <p>{error}</p>
              <button type="button" className="patient-appointments-book-button" onClick={fetchAppointments}>Thử lại</button>
            </div>
          ) : filteredAppointments.length ? (
            <div className="patient-appointments-list" aria-live="polite">
              {filteredAppointments.map((appointment) => (
                <PatientAppointmentCard
                  key={appointment.id}
                  appointment={appointment}
                  selected={appointment.id === selectedId}
                  onSelect={() => {
                    setSelectedId(appointment.id);
                    setPreviewOpen(true);
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="patient-appointments-empty">
              <CalendarX2 size={42} aria-hidden="true" />
              <h2>{hasFilters ? "Không tìm thấy lịch hẹn phù hợp" : "Không có lịch hẹn"}</h2>
              <p>
                {hasFilters
                  ? "Hãy thử đổi từ khóa hoặc khoảng ngày đã chọn."
                  : "Bạn chưa có lịch hẹn nào trong mục này."}
              </p>
              {hasFilters ? (
                <button type="button" className="patient-appointments-book-button patient-appointments-book-button--secondary" onClick={clearFilters}>
                  Xóa bộ lọc
                </button>
              ) : (
                <Link to="/doctors" className="patient-appointments-book-button">
                  <Plus size={18} aria-hidden="true" />
                  Đặt lịch mới
                </Link>
              )}
            </div>
          )}
        </section>

        {loading && previewOpen && (
          <aside className="patient-appointment-preview appointment-preview-skeleton" aria-label="Đang tải chi tiết lịch hẹn" aria-busy="true">
            <div className="appointment-preview-skeleton-line" />
            <div className="appointment-preview-skeleton-doctor"><i /><span><b /><b /></span></div>
            <div className="appointment-preview-skeleton-box" />
            <div className="appointment-preview-skeleton-box appointment-preview-skeleton-box-tall" />
          </aside>
        )}

        {previewOpen && selectedAppointment && !loading && (
          <>
            <button
              type="button"
              className="patient-appointment-preview-backdrop"
              aria-label="Đóng xem nhanh lịch hẹn"
              onClick={() => setPreviewOpen(false)}
            />
            <AppointmentPreview
              appointment={selectedAppointment}
              cancelling={cancelling}
              onClose={() => setPreviewOpen(false)}
              onCancel={() => cancelAppointment(selectedAppointment)}
            />
          </>
        )}

        {!selectedAppointment && !loading && !error && filteredAppointments.length > 0 && (
          <aside className="patient-appointment-preview-placeholder">
            <ClipboardList size={34} aria-hidden="true" />
            <p>Chọn một lịch hẹn để xem thông tin.</p>
          </aside>
        )}
      </div>
    </PatientLayout>
  );
}

export default Appointments;
