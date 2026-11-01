import { useCallback, useEffect, useState } from "react";
import { ClipboardList, Search, X } from "lucide-react";
import toast from "react-hot-toast";
import PatientLayout from "../../components/patient/PatientLayout";
import MedicalRecordCard from "../../components/patient/MedicalRecordCard";
import MedicalRecordPreview from "../../components/patient/MedicalRecordPreview";
import medicalRecordService from "../../services/medical-record.service";
import { getApiErrorMessage } from "../../api/axios";

function MedicalRecords() {
  const [keyword, setKeyword] = useState("");
  const [search, setSearch] = useState("");
  const [records, setRecords] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = { page: 1, limit: 50 };
      if (search.trim()) params.search = search.trim();
      const result = await medicalRecordService.getRecords(params);
      setRecords(result.data || []);
    } catch (requestError) {
      const message = getApiErrorMessage(requestError, "Không tải được bệnh án");
      setError(message);
      setRecords([]);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  useEffect(() => {
    if (!records.length) {
      setSelectedId(null);
      return;
    }
    if (!records.some((record) => record.id === selectedId)) {
      setSelectedId(records[0].id);
      setPreviewOpen(true);
    }
  }, [records, selectedId]);

  const selectedRecord = records.find((record) => record.id === selectedId) || null;
  const hasPreview = previewOpen && (selectedRecord || loading);
  const runSearch = () => setSearch(keyword);
  const clearSearch = () => {
    setKeyword("");
    setSearch("");
  };

  return (
    <PatientLayout>
      <div className={`medical-records-layout${hasPreview ? " has-preview" : ""}`}>
        <section className="patient-content-card medical-records-list-card" aria-label="Lịch sử khám bệnh">
          <header className="medical-records-header">
            <div>
              <p className="medical-records-eyebrow">HỒ SƠ SỨC KHỎE CỦA BẠN</p>
              <h1 className="patient-content-card-title">Lịch sử khám bệnh</h1>
              <p className="medical-records-description">
                Xem lại các lần khám bệnh, chẩn đoán và điều trị của bạn.
              </p>
            </div>
            <span className="medical-records-total">
              <ClipboardList size={17} aria-hidden="true" />
              {loading ? "Đang tải" : `${records.length} lần khám`}
            </span>
          </header>

          <label className="medical-records-search">
            <Search size={19} aria-hidden="true" />
            <span className="medical-records-sr-only">Tìm bệnh án theo bác sĩ, chẩn đoán hoặc mã lịch khám</span>
            <input
              type="search"
              placeholder="Tìm theo bác sĩ, chẩn đoán hoặc mã lịch khám..."
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") runSearch();
              }}
            />
            {keyword && (
              <button type="button" className="medical-records-clear-search" onClick={clearSearch} aria-label="Xóa từ khóa">
                <X size={17} />
              </button>
            )}
            <button type="button" className="medical-records-search-button" onClick={runSearch}>
              Tìm kiếm
            </button>
          </label>

          <div className="medical-records-list-heading">
            <div>
              <h2>Các lần khám</h2>
              <p>{loading ? "Đang tải hồ sơ của bạn" : "Chọn một lần khám để xem thông tin"}</p>
            </div>
            {!loading && records.length > 0 && <span>{records.length} hồ sơ</span>}
          </div>

          {loading ? (
            <div className="medical-records-skeleton-list" aria-label="Đang tải bệnh án" aria-busy="true">
              {[0, 1, 2].map((item) => (
                <div className="medical-record-skeleton" key={item}>
                  <span className="medical-record-skeleton-date" />
                  <span className="medical-record-skeleton-lines"><i /><i /><i /></span>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="medical-records-empty">
              <ClipboardList size={42} aria-hidden="true" />
              <h2>Không tải được lịch sử khám</h2>
              <p>{error}</p>
              <button type="button" className="medical-records-retry" onClick={fetchRecords}>Thử tải lại</button>
            </div>
          ) : records.length ? (
            <div className="medical-record-list">
              {records.map((record) => (
                <MedicalRecordCard
                  key={record.id}
                  record={record}
                  selected={record.id === selectedId}
                  onSelect={() => {
                    setSelectedId(record.id);
                    setPreviewOpen(true);
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="medical-records-empty">
              <ClipboardList size={42} aria-hidden="true" />
              <h2>{search.trim() ? "Không tìm thấy bệnh án" : "Chưa có lịch sử khám bệnh"}</h2>
              <p>
                {search.trim()
                  ? "Không có kết quả phù hợp với từ khóa tìm kiếm."
                  : "Các lần khám bệnh của bạn sẽ được hiển thị tại đây."}
              </p>
              {search.trim() && (
                <button type="button" className="medical-records-retry" onClick={clearSearch}>Xóa từ khóa</button>
              )}
            </div>
          )}
        </section>

        {loading && (
          <aside className="medical-records-preview medical-record-preview medical-record-preview-skeleton" aria-label="Đang tải xem nhanh bệnh án" aria-busy="true">
            <div className="medical-preview-skeleton-line medical-preview-skeleton-title" />
            <div className="medical-preview-skeleton-doctor"><i /><span><b /><b /></span></div>
            <div className="medical-preview-skeleton-box" />
            <div className="medical-preview-skeleton-box medical-preview-skeleton-box-tall" />
            <div className="medical-preview-skeleton-line" />
          </aside>
        )}

        {previewOpen && selectedRecord && !loading && (
          <>
            <button
              type="button"
              className="medical-record-preview-backdrop"
              aria-label="Đóng xem nhanh bệnh án"
              onClick={() => setPreviewOpen(false)}
            />
            <MedicalRecordPreview
              record={selectedRecord}
              onClose={() => setPreviewOpen(false)}
            />
          </>
        )}

        {!selectedRecord && !loading && !error && records.length > 0 && (
          <aside className="medical-records-preview medical-record-preview-placeholder">
            <ClipboardList size={34} aria-hidden="true" />
            <p>Chọn một lần khám để xem thông tin.</p>
          </aside>
        )}
      </div>
    </PatientLayout>
  );
}

export default MedicalRecords;
