import { MapPinned } from "lucide-react";

function ClinicMap({ clinic, embedded = false }) {
  const query = clinic.mapQuery || encodeURIComponent(clinic.address || clinic.name);
  return (
    <section className={`clinic-map ${embedded ? "clinic-map--embedded" : "clinic-section"}`}>
      {!embedded && (
        <div className="clinic-section__heading clinic-section__heading--compact">
          <div><span>Vị trí</span><h2><MapPinned size={20} /> Bản đồ</h2></div>
        </div>
      )}
      <iframe
        title={`Bản đồ ${clinic.name}`}
        src={`https://www.google.com/maps?q=${query}&output=embed`}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
      {clinic.address && <p className="clinic-map__address">{clinic.address}</p>}
    </section>
  );
}

export default ClinicMap;
