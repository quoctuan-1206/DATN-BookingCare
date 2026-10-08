import { useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";
import AdminHeader from "./AdminHeader";
import { useAuth } from "../../../context/AuthContext";

function AdminLayout({ children, title }) {
    const [collapsed, setCollapsed] = useState(false);
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) return null;
    if (!user) {
        return <Navigate to="/login" replace state={{ from: location.pathname }} />;
    }
    if ((user.role?.name || user.role) !== "Admin") {
        return <Navigate to="/unauthorized" replace />;
    }

    return (

        <div className="admin-layout">

            <AdminSidebar

                collapsed={collapsed}

                setCollapsed={setCollapsed}

            />

            <div
                className={
                    collapsed
                        ? "admin-main collapsed"
                        : "admin-main"
                }
            >

                <AdminHeader

                    title={title}

                    collapsed={collapsed}

                    setCollapsed={setCollapsed}

                />

                <main className="admin-content">

                    {children}

                </main>

            </div>

        </div>

    );

}

export default AdminLayout;
