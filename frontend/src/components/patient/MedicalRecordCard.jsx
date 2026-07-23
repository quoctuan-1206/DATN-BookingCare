import {
    Calendar,
    ChevronRight,
    ClipboardPlus,
    Hospital,
    Pill,
    Stethoscope,
} from "lucide-react";
import { Link } from "react-router-dom";
import { enrichMedicalRecord } from "../../data/patientMock";

function MedicalRecordCard({ record }) {
    if (!record) return null;

    const data = enrichMedicalRecord(record);

    return (
        <div className="medical-card">
            <div className="medical-top">
                <div>
                    <h3>{data.doctor_name}</h3>
                    <p>
                        <Hospital size={14} />
                        {data.clinic}
                    </p>
                    <p>
                        <Stethoscope size={14} />
                        {data.specialty}
                    </p>
                </div>

                <div className="medical-date">
                    <Calendar size={14} />
                    {data.date_display}
                </div>
            </div>

            <div className="medical-body">
                <div className="medical-diagnosis">
                    <ClipboardPlus size={16} />
                    <div>
                        <strong>Chẩn đoán</strong>
                        <p>{data.diagnosis}</p>
                    </div>
                </div>

                <div className="medical-prescription">
                    <Pill size={16} />
                    <span>
                        {data.has_prescription
                            ? "Có đơn thuốc"
                            : "Không có đơn thuốc"}
                    </span>
                </div>
            </div>

            <div className="medical-footer">
                <span className="patient-muted">{data.booking_code}</span>
                <Link
                    to={`/patient/appointments/${data.appointment_id}`}
                    className="medical-detail-btn"
                >
                    Xem lịch hẹn
                    <ChevronRight size={14} />
                </Link>
            </div>
        </div>
    );
}

export default MedicalRecordCard;
