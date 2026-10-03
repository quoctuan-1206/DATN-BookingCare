import { UserRound, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

function PatientQueue({ appointments = [], loading = false }) {
  const queue = appointments
    .filter((a) => ["WAITING", "CALLED", "IN_PROGRESS"].includes(a.status))
    .sort((a, b) => (a.queue_number || Number.MAX_SAFE_INTEGER) - (b.queue_number || Number.MAX_SAFE_INTEGER));

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
          queue.map((patient) => {
            const status = patient.status === "IN_PROGRESS"
              ? "examining"
              : patient.status === "CALLED"
                ? "next"
                : "waiting";
            const statusLabel = {
              examining: "Đang khám",
              waiting: "Đang chờ",
              next: "Đã gọi",
            };

            return (
              <Link
                key={patient.id}
                to={`/doctor/appointments/${patient.id}`}
                className={`doctor-queue-item ${status}`}
              >
                <div className="doctor-queue-order">{patient.queue_number || "—"}</div>

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
