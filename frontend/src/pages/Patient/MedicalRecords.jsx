import { useMemo, useState } from "react";
import PatientLayout from "../../components/patient/PatientLayout";
import MedicalRecordCard from "../../components/patient/MedicalRecordCard";
import { db, enrichMedicalRecord } from "../../data/patientMock";

function MedicalRecords() {
    const [keyword, setKeyword] = useState("");

    const records = useMemo(
        () => db.medical_records.map(enrichMedicalRecord),
        []
    );

    const filtered = records.filter((item) => {
        const q = keyword.toLowerCase().trim();
        if (!q) return true;
        return (
            item.doctor_name.toLowerCase().includes(q) ||
            item.diagnosis.toLowerCase().includes(q) ||
            item.patient_name.toLowerCase().includes(q) ||
            item.booking_code.toLowerCase().includes(q)
        );
    });

    return (
        <PatientLayout>
            <div className="page-header">
                <div>
                    <h1>Lịch sử khám bệnh</h1>
                    <p>Theo dõi bệnh án và kết quả khám (medical_records).</p>
                </div>
            </div>

            <div className="record-search">
                <input
                    type="text"
                    placeholder="Tìm theo bác sĩ, chẩn đoán, bệnh nhân, mã lịch..."
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                />
            </div>

            <div className="medical-record-list">
                {filtered.length > 0 ? (
                    filtered.map((record) => (
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
