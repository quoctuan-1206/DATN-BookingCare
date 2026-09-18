import { useEffect, useState } from "react";
import { Pill } from "lucide-react";
import prescriptionService from "../../services/prescription.service";
import { getApiErrorMessage } from "../../api/axios";

function PatientPrescriptionView({ medicalRecordId, hasPrescription = false }) {
  const [prescription, setPrescription] = useState(null);
  const [loading, setLoading] = useState(Boolean(hasPrescription));
  const [error, setError] = useState("");

  useEffect(() => {
    if (!medicalRecordId || !hasPrescription) {
      setLoading(false);
      setPrescription(null);
      return;
    }

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const data = await prescriptionService.getByMedicalRecordId(
          medicalRecordId,
        );
        if (!cancelled) setPrescription(data);
      } catch (err) {
        if (!cancelled) {
          setPrescription(null);
          if (err?.response?.status !== 404) {
            setError(getApiErrorMessage(err, "Không tải được đơn thuốc"));
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [medicalRecordId, hasPrescription]);

  return (
    <div className="detail-card patient-prescription-card">
      <h2>
        <Pill size={20} style={{ verticalAlign: "middle", marginRight: 8 }} />
        Đơn thuốc
      </h2>

      {loading ? (
        <p>Đang tải đơn thuốc...</p>
      ) : error ? (
        <p className="patient-muted">{error}</p>
      ) : !hasPrescription || !prescription ? (
        <p className="patient-muted">
          Bác sĩ chưa kê đơn thuốc cho lần khám này.
        </p>
      ) : (
        <>
          <div className="patient-prescription-table-wrap">
            <table className="patient-prescription-table">
              <thead>
                <tr>
                  <th>Thuốc</th>
                  <th>Số lượng</th>
                  <th>Liều dùng</th>
                  <th>Hướng dẫn</th>
                </tr>
              </thead>
              <tbody>
                {prescription.items.map((item) => (
                  <tr key={item.id || `${item.medicine_id}-${item.dosage}`}>
                    <td>{item.medicine_name}</td>
                    <td>
                      {item.quantity}
                      {item.unit ? ` ${item.unit}` : ""}
                    </td>
                    <td>{item.dosage || "—"}</td>
                    <td>{item.instruction || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {prescription.note && (
            <p className="patient-prescription-note">
              <strong>Ghi chú đơn:</strong> {prescription.note}
            </p>
          )}

          {prescription.follow_up_days != null && (
            <p className="patient-prescription-follow-up">
              <strong>Tái khám:</strong> sau {prescription.follow_up_days} ngày
              {prescription.follow_up_date_display
                ? ` (dự kiến ${prescription.follow_up_date_display})`
                : ""}
            </p>
          )}

          <p className="patient-prescription-total">
            Tổng tiền thuốc:{" "}
            <strong>
              {Number(prescription.total_amount || 0).toLocaleString("vi-VN")} đ
            </strong>
          </p>
        </>
      )}
    </div>
  );
}

export default PatientPrescriptionView;
