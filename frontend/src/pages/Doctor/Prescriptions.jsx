import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import DoctorLayout from "../../components/doctor-dashboard/layout/DoctorLayout";
import DoctorPrescriptionTable from "../../components/doctor-dashboard/DoctorPrescriptionTable";
import medicalRecordService from "../../services/medical-record.service";
import { getApiErrorMessage } from "../../api/axios";

function Prescriptions() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("pending");

  const loadRecords = useCallback(async () => {
    setLoading(true);
    try {
      const result = await medicalRecordService.getRecords({
        page: 1,
        limit: 100,
      });
      setRecords(result.data || []);
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, "Không tải được danh sách đơn thuốc"),
      );
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  const pendingRecords = useMemo(
    () => records.filter((item) => !item.has_prescription),
    [records],
  );

  const issuedRecords = useMemo(
    () => records.filter((item) => item.has_prescription),
    [records],
  );

  const visibleRecords = tab === "pending" ? pendingRecords : issuedRecords;

  return (
    <DoctorLayout title="Đơn thuốc">
      <div className="doctor-page">
        <div className="doctor-card">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
              marginBottom: 16,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <div>
              <h3>Đơn thuốc</h3>
              <p style={{ margin: "6px 0 0", color: "#64748b", fontSize: 14 }}>
                Theo dõi đơn cần kê và đơn đã kê chi tiết theo từng thuốc.
              </p>
            </div>
            <Link
              to="/doctor/medical-records"
              className="admin-btn admin-btn-secondary"
            >
              Quản lý bệnh án
            </Link>
          </div>

          <div className="doctor-tabs">
            <button
              type="button"
              className={`doctor-tab ${tab === "pending" ? "active" : ""}`}
              onClick={() => setTab("pending")}
            >
              Cần kê ({pendingRecords.length})
            </button>
            <button
              type="button"
              className={`doctor-tab ${tab === "issued" ? "active" : ""}`}
              onClick={() => setTab("issued")}
            >
              Đã kê ({issuedRecords.length})
            </button>
          </div>

          {loading ? (
            <p>Đang tải...</p>
          ) : visibleRecords.length === 0 ? (
            <p>
              {tab === "pending"
                ? "Không còn bệnh án nào cần kê đơn thuốc."
                : "Chưa có đơn thuốc nào được kê."}
            </p>
          ) : (
            <div className="doctor-prescription-list">
              {visibleRecords.map((item) => (
                <div key={item.id} className="doctor-prescription-card">
                  <div className="doctor-prescription-card-head">
                    <div>
                      <h4>
                        {item.booking_code} · {item.patient_name}
                      </h4>
                      <p>
                        {item.date_display} · Giờ bắt đầu{" "}
                        <strong>{item.start_time || "—"}</strong>
                      </p>
                      <p>
                        Chẩn đoán: <strong>{item.diagnosis}</strong>
                      </p>
                    </div>
                    <div className="doctor-prescription-card-actions">
                      {tab === "pending" ? (
                        <Link
                          to={`/doctor/appointments/${item.appointment_id}?prescribe=1`}
                          className="admin-btn admin-btn-primary"
                        >
                          Kê đơn thuốc
                        </Link>
                      ) : (
                        <Link
                          to={`/doctor/appointments/${item.appointment_id}`}
                          className="admin-btn admin-btn-primary"
                        >
                          Mở lịch hẹn
                        </Link>
                      )}
                    </div>
                  </div>

                  {tab === "issued" && item.prescription ? (
                    <div style={{ marginTop: 12 }}>
                      <h5 style={{ margin: "0 0 10px" }}>Chi tiết đơn thuốc</h5>
                      <DoctorPrescriptionTable
                        prescription={item.prescription}
                      />
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DoctorLayout>
  );
}

export default Prescriptions;
