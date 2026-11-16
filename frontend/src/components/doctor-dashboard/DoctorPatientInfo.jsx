import { useState } from "react";
import { UserRound } from "lucide-react";
import CollapseToggle from "./CollapseToggle";

function dash(value) {
  if (value == null || value === "") return "—";
  return value;
}

function DoctorPatientInfo({ data, title = "Thông tin bệnh nhân" }) {
  const [expanded, setExpanded] = useState(true);

  if (!data) return null;

  const name = data.patient_name || data.full_name || data.fullName;
  if (!name) return null;

  const rows = [
    { label: "Họ tên", value: name },
    { label: "Mã hồ sơ", value: data.patient_profile_id ?? data.patient_id ?? data.id },
    {
      label: "Giới tính",
      value: data.patient_gender_label || data.gender_label || data.patient_gender,
    },
    {
      label: "Ngày sinh",
      value: data.patient_date_of_birth || data.date_of_birth || data.dateOfBirth,
    },
    { label: "Số điện thoại", value: data.patient_phone || data.phone },
  ];

  return (
    <section className="doctor-appointment-panel doctor-patient-info">
      <div className="doctor-appointment-panel-title">
        <span className="doctor-appointment-panel-icon" aria-hidden="true">
          <UserRound size={18} />
        </span>
        <h4>{title}</h4>
        <CollapseToggle
          expanded={expanded}
          label={title}
          onToggle={() => setExpanded((value) => !value)}
        />
      </div>
      <div className="doctor-compact-info-list" hidden={!expanded}>
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
