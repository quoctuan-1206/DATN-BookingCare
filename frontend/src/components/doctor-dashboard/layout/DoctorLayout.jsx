import { useState } from "react";
import DoctorSidebar from "./DoctorSidebar";
import DoctorHeader from "./DoctorHeader";

function DoctorLayout({ children, title }) {
    const [collapsed, setCollapsed] = useState(false);

    return (
        <div className="doctor-layout">
            <DoctorSidebar
                collapsed={collapsed}
                setCollapsed={setCollapsed}
            />

            <div
                className={
                    collapsed ? "doctor-main collapsed" : "doctor-main"
                }
            >
                <DoctorHeader title={title} />

                <main className="doctor-content">{children}</main>
            </div>
        </div>
    );
}

export default DoctorLayout;
