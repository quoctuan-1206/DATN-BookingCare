import { UserRound } from "lucide-react";

function dash(value) {
  if (value == null || value === "") return "—";
  return value;
}

function DoctorPatientInfo({ data, title = "Thông tin bệnh nhân" }) {
  if (!data) return null;

  const name = data.patient_name || data.full_name || data.fullName;
  if (!name) return null;

  const rows = [
    { label: "Họ tên", value: name },
    {
      label: "Giới tính",
      value: data.patient_gender_label || data.gender_label || data.patient_gender,
    },
    { label: "Số điện thoại", value: data.patient_phone || data.phone },
    {
      label: "Ngày sinh",
      value: data.patient_date_of_birth || data.date_of_birth || data.dateOfBirth,
    },
    { label: "Nhóm máu", value: data.patient_blood_type || data.blood_type },
    {
      label: "Cân nặng",
      value:
        data.patient_weight != null
          ? `${data.patient_weight} kg`
          : data.weight != null
            ? `${data.weight} kg`
            : null,
    },
    {
      label: "Chiều cao",
      value:
        data.patient_height != null
          ? `${data.patient_height} cm`
          : data.height != null
            ? `${data.height} cm`
            : null,
    },
    {
      label: "BHYT",
      value: data.patient_insurance_number || data.insurance_number,
    },
  ];

  return (
    <section className="doctor-appointment-panel doctor-patient-info">
      <div className="doctor-appointment-panel-title">
        <span className="doctor-appointment-panel-icon" aria-hidden="true">
          <UserRound size={18} />
        </span>
        <h4>{title}</h4>
      </div>
      <div className="doctor-compact-info-list">
        {rows.map((row) => (
          <div className="doctor-compact-info-row" key={row.label}>
            <span>{row.label}</span>
            <strong>{dash(row.value)}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}

export default DoctorPatientInfo;
