import {
  Building2,
  Clock3,
  ExternalLink,
  Mail,
  MapPin,
  MapPinned,
  Phone,
  Users,
} from "lucide-react";

function ClinicProfile({ clinic }) {
  const mapQuery = encodeURIComponent(
    [clinic.name, clinic.address].filter(Boolean).join(", "),
  );

  return (
    <div className="clinic-profile">
      <div className="clinic-profile__image">
        <img src={clinic.image} alt={clinic.name} />
      </div>

      <div className="clinic-profile__content">
        <div className="clinic-profile__heading">
          <span className="clinic-profile__type">
            <Building2 size={14} /> Cơ sở khám
          </span>
          <h1>{clinic.name}</h1>
        </div>

        <ul className="clinic-profile__meta">
          <li className="clinic-profile__address">
            <MapPin size={15} />
            <span>{clinic.address || "Đang cập nhật địa chỉ"}</span>
          </li>
          {clinic.phone && (
            <li><Phone size={15} /><a href={`tel:${clinic.phone}`}>{clinic.phone}</a></li>
          )}
          {clinic.email && (
            <li><Mail size={15} /><a href={`mailto:${clinic.email}`}>{clinic.email}</a></li>
          )}
          <li><Users size={15} /><span>{clinic.doctor_count || 0} bác sĩ</span></li>
          <li><Clock3 size={15} /><span>Lịch khám theo từng bác sĩ</span></li>
        </ul>
      </div>

      <a
        className="clinic-profile__map-link"
        href={`https://www.google.com/maps/search/?api=1&query=${mapQuery}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Xem ${clinic.name} trên Google Maps`}
      >
        <MapPinned size={18} />
        <span>Xem trên Google Maps</span>
        <ExternalLink size={14} />
      </a>
    </div>
  );
}

export default ClinicProfile;
