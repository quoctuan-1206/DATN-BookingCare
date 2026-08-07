import { useCallback, useEffect, useState } from "react";
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
      <div className="page-header">
        <div>
          <h1>Lịch sử khám bệnh</h1>
          <p>Theo dõi bệnh án và kết quả khám.</p>
        </div>
      </div>

      <div className="record-search">
        <input
          type="text"
          placeholder="Tìm theo bác sĩ, chẩn đoán, mã lịch..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") setSearch(keyword);
          }}
        />
        <button
          type="button"
          className="btn btn-primary"
          style={{ marginLeft: 8 }}
          onClick={() => setSearch(keyword)}
        >
          Tìm
        </button>
      </div>

      <div className="medical-record-list">
        {loading ? (
          <p>Đang tải...</p>
        ) : records.length > 0 ? (
          records.map((record) => (
            <MedicalRecordCard key={record.id} record={record} />
          ))
        ) : (
          <div className="empty-state">
            <h3>Không tìm thấy bệnh án.</h3>
          </div>
        )}
      </div>
    </PatientLayout>
  );
}

export default MedicalRecords;
