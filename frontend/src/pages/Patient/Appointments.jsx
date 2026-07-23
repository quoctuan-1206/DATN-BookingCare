import { useState } from "react";
import { Link } from "react-router-dom";
import PatientLayout from "../../components/patient/PatientLayout";
import AppointmentCard from "../../components/patient/AppointmentCard";
import { db } from "../../data/patientMock";

const tabs = [
    { key: "ALL", label: "Tất cả" },
    { key: "PENDING", label: "Đang chờ" },
    { key: "CONFIRMED", label: "Đã xác nhận" },
    { key: "COMPLETED", label: "Hoàn thành" },
    { key: "CANCELLED", label: "Đã hủy" },
];

function Appointments() {
    const [activeTab, setActiveTab] = useState("ALL");

    const filtered =
        activeTab === "ALL"
            ? db.appointments
            : db.appointments.filter((item) => item.status === activeTab);

    return (
        <PatientLayout>
            <div className="page-header">
                <div>
                    <h1>Lịch hẹn</h1>
                    <p>Theo dõi và quản lý tất cả lịch khám (appointments).</p>
                </div>

                <Link to="/doctors" className="btn btn-primary">
                    Đặt lịch mới
                </Link>
            </div>

            <div className="appointment-tabs">
                {tabs.map((tab) => (
                    <button
                        key={tab.key}
                        type="button"
                        className={`appointment-tab${
                            activeTab === tab.key ? " active" : ""
                        }`}
                        onClick={() => setActiveTab(tab.key)}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="appointment-list">
                {filtered.length > 0 ? (
                    filtered.map((appointment) => (
                        <AppointmentCard
                            key={appointment.id}
                            appointment={appointment}
                        />
                    ))
                ) : (
                    <div className="empty-state">
                        <h3>Không có lịch hẹn.</h3>
                        <p>
                            <Link to="/doctors">Đặt lịch khám mới</Link>
                        </p>
                    </div>
                )}
            </div>
        </PatientLayout>
    );
}

export default Appointments;
