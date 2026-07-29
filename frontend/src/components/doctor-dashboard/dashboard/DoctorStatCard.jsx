function DoctorStatCard({ title, value, icon, color = "#0d9488", note }) {
    return (
        <div className="doctor-stat-card">
            <div
                className="doctor-stat-icon"
                style={{ backgroundColor: color }}
            >
                {icon}
            </div>

            <div className="doctor-stat-content">
                <h4>{title}</h4>
                <h2>
                    {typeof value === "number"
                        ? value.toLocaleString("vi-VN")
                        : value}
                </h2>
                {note && <p className="doctor-stat-note">{note}</p>}
            </div>
        </div>
    );
}

export default DoctorStatCard;
