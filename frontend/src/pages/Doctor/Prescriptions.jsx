import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import DoctorLayout from "../../components/doctor-dashboard/layout/DoctorLayout";
import medicalRecordService from "../../services/medical-record.service";
import { getApiErrorMessage } from "../../api/axios";

function Prescriptions() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadRecords = useCallback(async () => {
    setLoading(true);
    try {
      const result = await medicalRecordService.getRecords({ page: 1, limit: 100 });
      setRecords((result.data || []).filter((item) => !item.has_prescription));
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không tải được danh sách đơn thuốc"));
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

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
              <h3>Đơn thuốc cần kê</h3>
              <p style={{ margin: "6px 0 0", color: "#64748b", fontSize: 14 }}>
                Bệnh án đã lưu nhưng chưa có đơn thuốc.
              </p>
            </div>
            <Link to="/doctor/medical-records" className="admin-btn admin-btn-secondary">
              Quản lý bệnh án
            </Link>
          </div>

          {loading ? (
            <p>Đang tải...</p>
          ) : records.length === 0 ? (
            <p>Không còn bệnh án nào cần kê đơn thuốc.</p>
          ) : (
            <div className="table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Mã lịch</th>
                    <th>Bệnh nhân</th>
                    <th>Ngày</th>
                    <th>Chẩn đoán</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((item) => (
                    <tr key={item.id}>
                      <td>{item.booking_code}</td>
                      <td>{item.patient_name}</td>
                      <td>
                        {item.date_display} {item.start_time}
                      </td>
                      <td>{item.diagnosis}</td>
                      <td>
                        <Link
                          to={`/doctor/appointments/${item.appointment_id}?prescribe=1`}
                          className="admin-btn admin-btn-primary"
                        >
                          Kê đơn thuốc
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DoctorLayout>
  );
}

export default Prescriptions;
