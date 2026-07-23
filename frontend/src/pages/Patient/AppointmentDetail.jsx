import { Link, useParams } from "react-router-dom";
import {
    Calendar,
    Clock,
    Hospital,
    NotebookPen,
    Pill,
    Stethoscope,
    User,
    Wallet,
} from "lucide-react";
import PatientLayout from "../../components/patient/PatientLayout";
import {
    STATUS_CLASS,
    STATUS_LABEL,
    enrichAppointment,
    formatMoney,
    getAppointmentById,
    getMedicalRecordByAppointmentId,
} from "../../data/patientMock";

function AppointmentDetail() {
    const { id } = useParams();
    const raw = getAppointmentById(id);

    if (!raw) {
        return (
            <PatientLayout>
                <div className="empty-state">
                    <h3>Không tìm thấy lịch hẹn.</h3>
                    <Link to="/patient/appointments" className="btn btn-outline">
                        Quay lại danh sách
                    </Link>
                </div>
            </PatientLayout>
        );
    }

    const appointment = enrichAppointment(raw);
    const medical = getMedicalRecordByAppointmentId(appointment.id);
    const statusClass = STATUS_CLASS[appointment.status] || "pending";

    return (
        <PatientLayout>
            <div className="page-header">
                <div>
                    <h1>Chi tiết lịch hẹn</h1>
                    <p>
                        Mã lịch hẹn: <strong>{appointment.booking_code}</strong>
                    </p>
                </div>

                <span className={`appointment-status ${statusClass}`}>
                    {STATUS_LABEL[appointment.status]}
                </span>
            </div>

            <div className="detail-card">
                <h2>Thông tin bác sĩ</h2>
                <div className="detail-grid">
                    <p>
                        <Stethoscope size={16} />
                        <strong>Bác sĩ</strong>
                        {appointment.doctor_name}
                    </p>
                    <p>
                        <Hospital size={16} />
                        <strong>Phòng khám</strong>
                        {appointment.clinic}
                    </p>
                    <p>
                        <NotebookPen size={16} />
                        <strong>Chuyên khoa</strong>
                        {appointment.specialty}
                    </p>
                </div>
            </div>

            <div className="detail-card">
                <h2>Thông tin lịch khám</h2>
                <div className="detail-grid">
                    <p>
                        <Calendar size={16} />
                        <strong>Ngày khám</strong>
                        {appointment.date_display}
                    </p>
                    <p>
                        <Clock size={16} />
                        <strong>Giờ khám</strong>
                        {appointment.time}
                    </p>
                    <p>
                        <User size={16} />
                        <strong>Bệnh nhân</strong>
                        {appointment.patient_name}
                    </p>
                    <p>
                        <User size={16} />
                        <strong>Số điện thoại</strong>
                        {appointment.patient_phone}
                    </p>
                </div>
            </div>

            <div className="detail-card">
                <h2>Lý do khám</h2>
                <p className="detail-text">{appointment.reason || "—"}</p>
            </div>

            <div className="detail-card">
                <h2>Kết quả khám</h2>
                {medical ? (
                    <div className="detail-grid">
                        <p>
                            <NotebookPen size={16} />
                            <strong>Chẩn đoán</strong>
                            {medical.diagnosis}
                        </p>
                        <p>
                            <Pill size={16} />
                            <strong>Đơn thuốc</strong>
                            {medical.has_prescription
                                ? "Có đơn thuốc"
                                : "Chưa có"}
                        </p>
                        <p>
                            <NotebookPen size={16} />
                            <strong>Kết luận</strong>
                            {medical.conclusion || "—"}
                        </p>
                    </div>
                ) : (
                    <p className="detail-text">Chưa có kết quả khám.</p>
                )}
            </div>

            <div className="detail-card">
                <h2>Thanh toán</h2>
                <div className="detail-grid">
                    <p>
                        <Wallet size={16} />
                        <strong>Phí khám</strong>
                        {formatMoney(appointment.consultation_fee)}
                    </p>
                    <p>
                        <Wallet size={16} />
                        <strong>Phương thức</strong>
                        {appointment.payment_method}
                    </p>
                    <p>
                        <Wallet size={16} />
                        <strong>Trạng thái</strong>
                        {appointment.payment_status}
                    </p>
                </div>
            </div>

            <div className="detail-actions">
                <Link to="/patient/appointments" className="btn btn-outline">
                    Quay lại
                </Link>

                {(appointment.status === "PENDING" ||
                    appointment.status === "CONFIRMED") && (
                    <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => alert("Hủy lịch (fake).")}
                    >
                        Hủy lịch
                    </button>
                )}
            </div>
        </PatientLayout>
    );
}

export default AppointmentDetail;
