import { UserRound, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

function PatientQueue({ appointments = [], loading = false }) {
  const queue = appointments.filter(
    (a) => a.status === "PENDING" || a.status === "CONFIRMED",
  );

  const clinic =
    queue[0]?.clinic ||
    appointments.find((a) => a.clinic)?.clinic ||
    "Phòng khám";

  return (
    <div className="doctor-card doctor-patient-queue">
      <div className="doctor-card-header">
        <div>
          <h3>Hàng chờ bệnh nhân</h3>
          <p>
            {loading
              ? "Đang tải..."
              : `${clinic} · ${queue.length} đang chờ`}
          </p>
        </div>
      </div>

      <div className="doctor-queue-list">
        {loading ? (
          <p>Đang tải...</p>
        ) : queue.length === 0 ? (
          <p>Không có bệnh nhân đang chờ hôm nay.</p>
        ) : (
          queue.map((patient, index) => {
            const status =
              index === 0
                ? "examining"
                : index === 1
                  ? "next"
                  : "waiting";
            const statusLabel = {
              examining: "Ưu tiên",
              waiting: "Đang chờ",
              next: "Tiếp theo",
            };

            return (
              <Link
                key={patient.id}
                to={`/doctor/appointments/${patient.id}`}
                className={`doctor-queue-item ${status}`}
              >
                <div className="doctor-queue-order">{index + 1}</div>

                <div className="doctor-queue-avatar">
                  <UserRound size={18} />
                </div>

                <div className="doctor-queue-info">
                  <strong>{patient.patient_name || "Bệnh nhân"}</strong>
                  <span>
                    {patient.start_time || "—"}
                    {patient.reason ? ` · ${patient.reason}` : ""}
                  </span>
                </div>

                <span className={`doctor-status ${status}`}>
                  {statusLabel[status]}
                </span>

                <ChevronRight size={16} className="doctor-queue-arrow" />
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}

export default PatientQueue;
