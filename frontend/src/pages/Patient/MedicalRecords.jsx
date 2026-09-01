import { useCallback, useEffect, useState } from "react";
import { ClipboardList } from "lucide-react";
import toast from "react-hot-toast";
import PatientLayout from "../../components/patient/PatientLayout";
import MedicalRecordCard from "../../components/patient/MedicalRecordCard";
import medicalRecordService from "../../services/medical-record.service";
import { getApiErrorMessage } from "../../api/axios";

function MedicalRecords() {
  const [keyword, setKeyword] = useState("");
  const [search, setSearch] = useState("");
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page: 1, limit: 50 };
      if (search.trim()) params.search = search.trim();
      const result = await medicalRecordService.getRecords(params);
      setRecords(result.data || []);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không tải được bệnh án"));
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  return (
    <PatientLayout>
      <div className="patient-content-card">
        <div className="patient-content-card-head">
          <h1 className="patient-content-card-title">Lịch sử khám bệnh</h1>
        </div>

        <div className="patient-content-card-toolbar">
          <input
            type="text"
            className="patient-search-input"
            placeholder="Tìm theo bác sĩ, chẩn đoán, mã lịch..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") setSearch(keyword);
            }}
          />
          <button
            type="button"
            className="patient-profile-save-btn"
            style={{ marginTop: 0, minWidth: 88 }}
            onClick={() => setSearch(keyword)}
          >
            Tìm
          </button>
        </div>

        <div className="patient-content-card-body">
          {loading ? (
            <p className="patient-page-loading">Đang tải...</p>
          ) : records.length > 0 ? (
            <div className="medical-records-grid">
              {records.map((record) => (
                <MedicalRecordCard key={record.id} record={record} />
              ))}
            </div>
          ) : (
            <div className="patient-panel-empty">
              <ClipboardList size={48} strokeWidth={1.75} />
              <p>
                {search.trim()
                  ? "Không tìm thấy bệnh án. Vui lòng thử từ khóa khác."
                  : "Chưa có bệnh án nào."}
              </p>
            </div>
          )}
        </div>
      </div>
    </PatientLayout>
  );
}

export default MedicalRecords;
