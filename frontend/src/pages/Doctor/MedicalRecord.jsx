import { Fragment, useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import DoctorLayout from "../../components/doctor-dashboard/layout/DoctorLayout";
import DoctorPrescriptionTable from "../../components/doctor-dashboard/DoctorPrescriptionTable";
import ClinicalRecordSection from "../../components/clinical/ClinicalRecordSection";
import medicalRecordService from "../../services/medical-record.service";
import clinicalService from "../../services/clinical.service";
import { getApiErrorMessage } from "../../api/axios";

function MedicalRecord() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [clinicalExpandedId, setClinicalExpandedId] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const recordsResult = await medicalRecordService.getRecords({
        page: 1,
        limit: 50,
      });
      setRecords(recordsResult.data || []);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không tải được bệnh án"));
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openClinicalAttachment = async (attachment) => {
    try {
      await clinicalService.openAttachment(attachment);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không mở được tệp cận lâm sàng"));
    }
  };

  return (
    <DoctorLayout title="Hồ sơ bệnh án">
      <div className="doctor-page">
        <div className="doctor-card">
          <div style={{ marginBottom: 12 }}>
            <h3>Danh sách bệnh án</h3>
            <p style={{ color: "#666", marginTop: 4 }}>
              Xem bệnh án đã tạo từ lịch khám.
            </p>
          </div>

          {loading ? (
            <p>Đang tải...</p>
          ) : records.length === 0 ? (
            <p>Chưa có bệnh án nào.</p>
          ) : (
            <div className="table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Mã lịch</th>
                    <th>Bệnh nhân</th>
                    <th>Ngày / giờ bắt đầu</th>
                    <th>Chẩn đoán</th>
                    <th>Đơn thuốc</th>
                    <th>Cận lâm sàng</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((item) => {
                    const isExpanded = expandedId === item.id;
                    const isClinicalExpanded = clinicalExpandedId === item.id;

                    return (
                      <Fragment key={item.id}>
                        <tr>
                          <td>{item.booking_code}</td>
                          <td>{item.patient_name}</td>
                          <td>
                            {item.date_display}
                            <br />
                            <strong>{item.start_time || "—"}</strong>
                          </td>
                          <td>{item.diagnosis}</td>
                          <td>
                            {item.has_prescription ? (
                              <button
                                type="button"
                                className="admin-btn admin-btn-secondary"
                                onClick={() => {
                                  setExpandedId(isExpanded ? null : item.id);
                                }}
                              >
                                {isExpanded ? "Ẩn đơn" : "Xem đơn"}
                              </button>
                            ) : (
                              <span className="doctor-muted">Chưa kê</span>
                            )}
                          </td>
                          <td>
                            {item.has_clinical_services || item.clinical_services?.length ? (
                              <button
                                type="button"
                                className="admin-btn admin-btn-secondary"
                                onClick={() => {
                                  setExpandedId(null);
                                  setClinicalExpandedId(isClinicalExpanded ? null : item.id);
                                }}
                              >
                                {isClinicalExpanded ? "Ẩn kết quả" : "Xem kết quả"}
                              </button>
                            ) : (
                              <span className="doctor-muted">Chưa có</span>
                            )}
                          </td>
                          <td>
                            <div
                              style={{
                                display: "flex",
                                gap: 8,
                                flexWrap: "wrap",
                              }}
                            >
                              <Link
                                to={`/doctor/appointments/${item.appointment_id}`}
                                className="admin-btn admin-btn-primary"
                              >
                                Chi tiết
                              </Link>
                            </div>
                          </td>
                        </tr>

                        {isExpanded && item.prescription ? (
                          <tr className="doctor-rx-expand-row">
                            <td colSpan={7}>
                              <DoctorPrescriptionTable
                                prescription={item.prescription}
                              />
                            </td>
                          </tr>
                        ) : null}

                        {isClinicalExpanded ? (
                          <tr className="doctor-rx-expand-row">
                            <td colSpan={7}>
                              <ClinicalRecordSection
                                orders={item.clinical_services || []}
                                onOpenAttachment={openClinicalAttachment}
                              />
                            </td>
                          </tr>
                        ) : null}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DoctorLayout>
  );
}

export default MedicalRecord;
