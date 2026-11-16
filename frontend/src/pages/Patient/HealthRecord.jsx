import { useCallback, useEffect, useMemo, useState } from "react";
import { Activity, AlertCircle, CalendarDays, ClipboardList, FlaskConical, HeartPulse, Pill, Plus, RefreshCw, Stethoscope, Trash2 } from "lucide-react";
import PatientLayout from "../../components/patient/PatientLayout";
import patientProfileService from "../../services/patient-profile.service";
import healthRecordService from "../../services/health-record.service";
import { getApiErrorMessage } from "../../api/axios";
import "../../styles/health-record.css";

const sections = [
  { id: "overview", label: "Tổng quan", icon: HeartPulse },
  { id: "timeline", label: "Dòng thời gian", icon: Activity },
  { id: "medications", label: "Đơn thuốc", icon: Pill },
  { id: "tests", label: "Xét nghiệm", icon: FlaskConical },
  { id: "history", label: "Tiền sử", icon: ClipboardList },
  { id: "allergies", label: "Dị ứng", icon: AlertCircle },
  { id: "conditions", label: "Theo dõi", icon: Stethoscope },
  { id: "vitals", label: "Chỉ số", icon: Activity },
];

const formatDate = (value) => value ? new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium" }).format(new Date(value)) : "—";
const displayValue = (value) => value == null || value === "" ? "Chưa có dữ liệu" : value;

function HealthRecord() {
  const [profiles, setProfiles] = useState([]);
  const [patientId, setPatientId] = useState("");
  const [section, setSection] = useState("overview");
  const [timelineFilter, setTimelineFilter] = useState("ALL");
  const [timelinePage, setTimelinePage] = useState(1);
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({});

  const selectedProfile = useMemo(() => profiles.find((profile) => String(profile.id) === String(patientId)), [profiles, patientId]);
  const load = useCallback(async (id) => {
    if (!id) return;
    setLoading(true);
    setError("");
    try {
      const [summary, timeline, medications, tests, history, allergies, conditions, vitals] = await Promise.all([
        healthRecordService.summary(id), healthRecordService.timeline(id, { page: 1, limit: 30 }),
        healthRecordService.medications(id), healthRecordService.tests(id),
        healthRecordService.list(id, "history"), healthRecordService.list(id, "allergies"),
        healthRecordService.list(id, "conditions"), healthRecordService.list(id, "vitals"),
      ]);
      setData({ summary, timeline, medications, tests, history, allergies, conditions, vitals });
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "Không tải được hồ sơ sức khỏe."));
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    let active = true;
    patientProfileService.getMyProfiles().then((items) => {
      if (!active) return;
      setProfiles(items);
      const selected = items[0]?.id;
      if (selected) {
        setPatientId(String(selected));
        load(String(selected));
      }
      else setLoading(false);
    }).catch((requestError) => {
      if (active) { setError(getApiErrorMessage(requestError, "Không tải được hồ sơ bệnh nhân.")); setLoading(false); }
    });
    return () => { active = false; };
  }, [load]);

  async function submit(event, kind) {
    event.preventDefault();
    setSaving(true);
    try {
      const fields = {
        history: ["title", "discovered_at", "description", "surgery_history", "family_history"],
        allergies: ["allergen", "allergy_type", "reaction", "severity", "no_known_allergies"],
        conditions: ["name", "recorded_at", "note", "medical_record_id"],
        vitals: ["type", "value", "secondary_value", "unit", "measured_at"],
      }[kind];
      const payload = Object.fromEntries(fields.filter((key) => form[key] !== undefined && form[key] !== "").map((key) => [key, form[key]]));
      if (kind === "allergies" && payload.no_known_allergies) delete payload.allergen;
      if (kind === "vitals") payload.value = Number(payload.value);
      await healthRecordService.create(patientId, kind, payload);
      setForm({});
      setTimelinePage(1);
      await load(patientId);
    } catch (requestError) { setError(getApiErrorMessage(requestError, "Không lưu được thông tin.")); }
    finally { setSaving(false); }
  }

  async function remove(kind, entry) {
    if (!window.confirm("Xóa mục này khỏi hồ sơ sức khỏe? Mục sẽ được ẩn khỏi danh sách.")) return;
    try { await healthRecordService.remove(patientId, kind, entry.id); await load(patientId); }
    catch (requestError) { setError(getApiErrorMessage(requestError, "Không xóa được thông tin.")); }
  }

  const list = (key) => Array.isArray(data[key]) ? data[key] : [];
  const summary = data.summary || {};

  return (
    <PatientLayout>
      <div className="health-record-page">
        <header className="health-record-header">
          <div>
            <span className="health-record-eyebrow">HỒ SƠ CÁ NHÂN</span>
            <h1>Hồ sơ sức khỏe</h1>
            <p>Theo dõi lịch sử khám và thông tin sức khỏe theo từng hồ sơ.</p>
          </div>
          {profiles.length > 1 && <label className="health-profile-select">Hồ sơ người khám
            <select value={patientId} onChange={(event) => { setPatientId(event.target.value); setForm({}); setTimelinePage(1); setTimelineFilter("ALL"); load(event.target.value); }}>
              {profiles.map((profile) => <option key={profile.id} value={profile.id}>{profile.full_name || profile.fullName} · {profile.relationship_label || profile.relationship}</option>)}
            </select>
          </label>}
        </header>

        {selectedProfile && <div className="health-patient-strip">
          <div className="health-avatar">{(selectedProfile.full_name || selectedProfile.fullName || "?").slice(0, 1)}</div>
          <div><strong>{selectedProfile.full_name || selectedProfile.fullName}</strong><span>{selectedProfile.gender_label || selectedProfile.gender} · {formatDate(selectedProfile.date_of_birth || selectedProfile.dateOfBirth)} · {selectedProfile.relationship_label || selectedProfile.relationship}</span></div>
          <button type="button" className="health-refresh" onClick={() => load(patientId)} aria-label="Tải lại"><RefreshCw size={17} /></button>
        </div>}

        <nav className="health-tabs" aria-label="Mục hồ sơ sức khỏe">
          {sections.map(({ id, label, icon: Icon }) => <button type="button" key={id} className={section === id ? "active" : ""} onClick={() => { setSection(id); setForm({}); }}><Icon size={17} /><span>{label}</span></button>)}
        </nav>

        {error && <div className="health-error" role="alert"><AlertCircle size={18} />{error}<button type="button" onClick={() => setError("")}>Đóng</button></div>}
        {loading ? <div className="health-state"><span className="health-spinner" />Đang tải hồ sơ sức khỏe…</div> : !selectedProfile ? <div className="health-state">Tài khoản chưa có hồ sơ người khám.</div> : (
          <main className="health-panel">
            {section === "overview" && <>
              <div className="health-stat-grid">
                <Stat icon={CalendarDays} label="Lần khám hoàn tất" value={summary.completed_visits ?? 0} />
                <Stat icon={ClipboardList} label="Đơn thuốc" value={summary.prescription_count ?? 0} />
                <Stat icon={FlaskConical} label="Xét nghiệm / cận lâm sàng" value={summary.test_count ?? 0} />
                <Stat icon={Stethoscope} label="Bệnh đang theo dõi" value={summary.conditions?.length ?? 0} />
              </div>
              <div className="health-two-col">
                <article className="health-card"><h2>Lần khám gần nhất</h2>{summary.last_visit ? <><strong>{formatDate(summary.last_visit.date)}</strong><p>{summary.last_visit.doctor || "Chưa có thông tin bác sĩ"}</p><span>{summary.last_visit.clinic || "Chưa có thông tin cơ sở"}</span></> : <Empty text="Chưa có lần khám hoàn tất." />}</article>
                <article className="health-card"><h2>Lịch hẹn sắp tới</h2>{summary.next_appointment ? <><strong>{formatDate(summary.next_appointment.date)}</strong><p>{summary.next_appointment.time || ""}</p><span>{summary.next_appointment.clinic || ""}</span></> : <Empty text="Chưa có lịch hẹn sắp tới." />}</article>
              </div>
              <article className="health-card"><h2>Thông tin sức khỏe đã ghi nhận</h2><div className="health-facts"><Fact label="Nhóm máu" value={summary.patient?.blood_type} /><Fact label="Chiều cao" value={summary.patient?.height ? `${summary.patient.height} cm` : null} /><Fact label="Cân nặng" value={summary.patient?.weight ? `${summary.patient.weight} kg` : null} /><Fact label="Dị ứng khai báo" value={summary.allergies?.length ? summary.allergies.every((item) => item.confirmation_status === "PATIENT_REPORTED_NONE") ? "Bệnh nhân khai báo không có dị ứng đã biết" : `${summary.allergies.length} mục khai báo; cần xem trạng thái xác nhận` : "Chưa có thông tin"} /></div></article>
            </>}
            {section === "timeline" && <><SectionTitle title="Dòng thời gian sức khỏe" /><div className="health-toolbar"><select aria-label="Lọc sự kiện" value={timelineFilter} onChange={(event) => { setTimelineFilter(event.target.value); setTimelinePage(1); healthRecordService.timeline(patientId, { page: 1, limit: 30, type: event.target.value }).then((timeline) => setData((previous) => ({ ...previous, timeline }))).catch((requestError) => setError(getApiErrorMessage(requestError))); }}><option value="ALL">Tất cả sự kiện</option><option value="APPOINTMENT">Lịch khám</option><option value="MEDICAL_RECORD">Bệnh án</option><option value="PRESCRIPTION">Đơn thuốc</option><option value="LAB">Xét nghiệm</option><option value="CLINICAL">Cận lâm sàng</option></select></div><Timeline items={data.timeline?.data || []} /><div className="health-pagination"><span>Trang {data.timeline?.page || 1} / {data.timeline?.total_pages || 0}</span><button type="button" disabled={!data.timeline?.page || data.timeline.page <= 1} onClick={() => changeTimelinePage(timelinePage - 1, timelineFilter, patientId, setTimelinePage, setData, setError)}>Trước</button><button type="button" disabled={!data.timeline?.total_pages || data.timeline.page >= data.timeline.total_pages} onClick={() => changeTimelinePage(timelinePage + 1, timelineFilter, patientId, setTimelinePage, setData, setError)}>Tiếp</button></div></>}
            {section === "medications" && <><SectionTitle title="Đơn thuốc đã kê" /><p className="health-note">Đơn thuốc đã kê không đồng nghĩa với việc người bệnh đang sử dụng thuốc.</p><div className="health-list">{(data.medications || []).map((item) => <article className="health-card" key={item.id}><div className="health-item-head"><div><h3>Đơn thuốc · {formatDate(item.date)}</h3><span>Bác sĩ: {displayValue(item.doctor)}</span></div><Pill size={20} /></div>{item.note && <p>{item.note}</p>}<ul>{item.items?.map((medicine) => <li key={medicine.id}><strong>{medicine.name}</strong> · {medicine.quantity} {medicine.unit || ""}<br /><small>{[medicine.dosage, medicine.instruction].filter(Boolean).join(" · ") || "Không có hướng dẫn chi tiết"}</small></li>)}</ul></article>)}{!(data.medications || []).length && <Empty text="Chưa có đơn thuốc." />}</div></>}
            {section === "tests" && <><SectionTitle title="Xét nghiệm và cận lâm sàng" /><div className="health-list">{(data.tests || []).map((item) => <article className="health-card" key={item.id}><div className="health-item-head"><div><h3>{item.service_type === "LAB" ? "Xét nghiệm" : "Dịch vụ cận lâm sàng"} · {formatDate(item.performed_at || item.ordered_at)}</h3><span>{item.clinics?.name || "Chưa có cơ sở thực hiện"} · {item.status}</span></div><FlaskConical size={20} /></div><p>{item.indication || "Không có mô tả"}</p>{item.lab_results?.length > 0 && <ul>{item.lab_results.map((result) => <li key={result.id}><strong>{result.service_name_snapshot || result.lab_tests?.name || "Kết quả"}</strong>{result.result != null ? `: ${result.result}${result.unit ? ` ${result.unit}` : ""}` : " · Kết quả chưa được công bố"}</li>)}</ul>}{item.clinical_attachments?.length > 0 && <p>{item.clinical_attachments.length} tệp đính kèm trong chi tiết dịch vụ.</p>}</article>)}{!(data.tests || []).length && <Empty text="Chưa có xét nghiệm hoặc dịch vụ cận lâm sàng." />}</div></>}
            {section === "history" && <><SectionTitle title="Tiền sử bệnh" /><EntryForm onSubmit={(event) => submit(event, "history")} saving={saving}><Field label="Bệnh hoặc vấn đề sức khỏe *"><input required maxLength="255" value={form.title || ""} onChange={field(setForm, form, "title")} /></Field><Field label="Thời điểm phát hiện"><input type="date" value={form.discovered_at || ""} onChange={field(setForm, form, "discovered_at")} /></Field><Field label="Mô tả"><textarea value={form.description || ""} onChange={field(setForm, form, "description")} /></Field><Field label="Tiền sử phẫu thuật"><textarea value={form.surgery_history || ""} onChange={field(setForm, form, "surgery_history")} /></Field><Field label="Tiền sử gia đình"><textarea value={form.family_history || ""} onChange={field(setForm, form, "family_history")} /></Field></EntryForm><EntryList items={list("history")} onRemove={(item) => remove("history", item)} render={(item) => <><strong>{item.title}</strong><p>{item.description || "Không có mô tả"}</p><span>{formatDate(item.discovered_at)} · {confirmation(item.confirmation_status)}</span></>} /></>}
            {section === "allergies" && <><EntryForm className="health-form health-allergy-form" onSubmit={(event) => submit(event, "allergies")} saving={saving}><div className="health-allergy-heading"><span className="health-allergy-icon"><HeartPulse size={21} /></span><div><h2>Dị ứng</h2><p>Ghi nhận thông tin dị ứng để hỗ trợ chăm sóc an toàn. Nội dung khai báo sẽ chờ nhân viên y tế xác nhận.</p></div></div><label className="health-check health-allergy-check"><input type="checkbox" checked={Boolean(form.no_known_allergies)} onChange={(event) => setForm({ ...form, no_known_allergies: event.target.checked, allergen: "" })} /><span>Tôi không biết mình có dị ứng</span></label>{!form.no_known_allergies && <div className="health-allergy-grid"><Field label="Tác nhân dị ứng *"><input required placeholder="Ví dụ: Penicillin, hải sản, phấn hoa" value={form.allergen || ""} onChange={field(setForm, form, "allergen")} /></Field><Field label="Loại dị ứng"><select value={form.allergy_type || "OTHER"} onChange={field(setForm, form, "allergy_type")}><option value="MEDICATION">Thuốc</option><option value="FOOD">Thực phẩm</option><option value="ENVIRONMENT">Môi trường</option><option value="OTHER">Khác</option></select></Field><Field label="Phản ứng"><textarea placeholder="Mô tả phản ứng đã gặp (nếu có)" value={form.reaction || ""} onChange={field(setForm, form, "reaction")} /></Field><Field label="Mức độ nghiêm trọng"><select value={form.severity || "UNKNOWN"} onChange={field(setForm, form, "severity")}><option value="MILD">Nhẹ</option><option value="MODERATE">Trung bình</option><option value="SEVERE">Nặng</option><option value="UNKNOWN">Chưa rõ</option></select></Field></div>}</EntryForm><EntryList items={list("allergies")} onRemove={(item) => remove("allergies", item)} render={(item) => <><strong>{item.confirmation_status === "PATIENT_REPORTED_NONE" ? "Bệnh nhân khai báo không có dị ứng đã biết" : item.allergen}</strong><p>{item.reaction || "Chưa có mô tả phản ứng"}</p><span>{item.allergy_type} · {item.severity || "Chưa rõ mức độ"} · {confirmation(item.confirmation_status)}</span></>} /></>}
            {section === "conditions" && <><SectionTitle title="Bệnh đang theo dõi" /><p className="health-note">Mục do bệnh nhân khai báo không thay thế chẩn đoán hoặc xác nhận của bác sĩ.</p><EntryForm onSubmit={(event) => submit(event, "conditions")} saving={saving}><Field label="Bệnh hoặc tình trạng sức khỏe *"><input required maxLength="255" value={form.name || ""} onChange={field(setForm, form, "name")} /></Field><Field label="Bệnh án liên quan"><select value={form.medical_record_id || ""} onChange={field(setForm, form, "medical_record_id")}><option value="">Không liên kết</option>{(data.timeline?.data || []).filter((item) => item.type === "MEDICAL_RECORD").map((item) => <option key={item.source_id} value={item.source_id}>{item.description} · {formatDate(item.date)}</option>)}</select></Field><Field label="Ghi chú"><textarea value={form.note || ""} onChange={field(setForm, form, "note")} /></Field></EntryForm><EntryList items={list("conditions")} onRemove={(item) => remove("conditions", item)} render={(item) => <><strong>{item.name}</strong><p>{item.note || ""}</p><span>{formatDate(item.recorded_at)} · {item.status === "MONITORING" ? "Đang theo dõi" : item.status}{item.confirmation_status === "CONFIRMED" ? " · Đã xác nhận y tế" : " · Chưa xác nhận y tế"}</span>{item.medical_record_id && <p><a href={`/patient/medical-records/${item.medical_record_id}`}>Mở bệnh án liên quan</a></p>}</>} /></>}
            {section === "vitals" && <><SectionTitle title="Chỉ số sức khỏe" /><EntryForm onSubmit={(event) => submit(event, "vitals")} saving={saving}><Field label="Loại chỉ số"><select value={form.type || "BLOOD_PRESSURE"} onChange={(event) => { const type = event.target.value; const units = { BLOOD_PRESSURE: "mmHg", HEART_RATE: "bpm", WEIGHT: "kg", HEIGHT: "cm", TEMPERATURE: "°C", BLOOD_GLUCOSE: "mmol/L", SPO2: "%" }; setForm({ ...form, type, unit: units[type], secondary_value: type === "BLOOD_PRESSURE" ? form.secondary_value : "" }); }}><option value="BLOOD_PRESSURE">Huyết áp</option><option value="HEART_RATE">Nhịp tim</option><option value="WEIGHT">Cân nặng</option><option value="HEIGHT">Chiều cao</option><option value="TEMPERATURE">Nhiệt độ</option><option value="BLOOD_GLUCOSE">Đường huyết</option><option value="SPO2">SpO2</option></select></Field><Field label={form.type === "BLOOD_PRESSURE" ? "Tâm thu (mmHg) *" : "Giá trị *"}><input required type="number" step="0.1" value={form.value || ""} onChange={field(setForm, form, "value")} /></Field>{form.type === "BLOOD_PRESSURE" && <Field label="Tâm trương (mmHg) *"><input required type="number" value={form.secondary_value || ""} onChange={field(setForm, form, "secondary_value")} /></Field>}<Field label="Đơn vị"><input required value={form.unit || "mmHg"} onChange={field(setForm, form, "unit")} /></Field><Field label="Thời gian đo"><input required type="datetime-local" value={form.measured_at || ""} onChange={field(setForm, form, "measured_at")} /></Field></EntryForm><div className="health-table-wrap"><table className="health-vitals-table"><thead><tr><th>Thời gian đo</th><th>Chỉ số</th><th>Giá trị</th><th>Nguồn</th><th /></tr></thead><tbody>{list("vitals").map((item) => <tr key={item.id}><td>{formatDate(item.measured_at)}</td><td>{item.type}</td><td>{item.type === "BLOOD_PRESSURE" ? `${item.value}/${item.secondary_value}` : item.value} {item.unit}</td><td>{item.source === "PATIENT" ? "Bệnh nhân khai báo" : "Nhân viên y tế"}</td><td><button type="button" aria-label="Xóa chỉ số" onClick={() => remove("vitals", item)}><Trash2 size={16} /></button></td></tr>)}</tbody></table>{!list("vitals").length && <Empty text="Chưa có chỉ số sức khỏe." />}</div></>}
          </main>
        )}
      </div>
    </PatientLayout>
  );
}

function field(setter, current, name) { return (event) => setter({ ...current, [name]: event.target.value }); }
function changeTimelinePage(page, type, patientId, setPage, setData, setError) { setPage(page); healthRecordService.timeline(patientId, { page, limit: 30, type }).then((timeline) => setData((previous) => ({ ...previous, timeline }))).catch((requestError) => setError(getApiErrorMessage(requestError))); }
function confirmation(status) { return ({ PENDING: "Chờ xác nhận y tế", CONFIRMED: "Đã xác nhận", REJECTED: "Không được xác nhận", PATIENT_REPORTED_NONE: "Bệnh nhân khai báo" }[status] || "Chưa xác nhận"); }
function Empty({ text }) { return <p className="health-empty">{text}</p>; }
function SectionTitle({ title }) { return <div className="health-section-title"><h2>{title}</h2></div>; }
function Stat({ icon: Icon, label, value }) { return <article className="health-stat"><span><Icon size={20} /></span><div><small>{label}</small><strong>{value}</strong></div></article>; }
function Fact({ label, value }) { return <div><small>{label}</small><strong>{displayValue(value)}</strong></div>; }
function Field({ label, children }) { return <label className="health-field"><span>{label}</span>{children}</label>; }
function EntryForm({ onSubmit, saving, children, className = "health-form" }) { return <form className={className} onSubmit={onSubmit}>{children}<button className="health-submit" type="submit" disabled={saving}><Plus size={16} />{saving ? "Đang lưu…" : "Lưu thông tin"}</button></form>; }
function EntryList({ items, render, onRemove }) { return <div className="health-list">{items.map((item) => <article className="health-entry" key={item.id}><div>{render(item)}</div><button type="button" aria-label="Xóa mục" onClick={() => onRemove(item)}><Trash2 size={16} /></button></article>)}{!items.length && <Empty text="Chưa có dữ liệu được ghi nhận." />}</div>; }
function Timeline({ items }) { return <div className="health-timeline">{items.map((item) => <article key={item.id}><span className="health-timeline-dot" /><div><small>{formatDate(item.date)} · {item.type}</small><h3>{item.description || "Sự kiện sức khỏe"}</h3><p>{item.doctor || ""}{item.clinic ? ` · ${item.clinic}` : ""}</p>{item.diagnosis && <p>Chẩn đoán: {item.diagnosis}</p>}<span className="health-status">{item.status || ""}</span></div><a href={item.detail_url}>Xem chi tiết</a></article>)}{!items.length && <Empty text="Chưa có sự kiện sức khỏe." />}</div>; }

export default HealthRecord;
