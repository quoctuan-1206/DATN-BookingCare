import { useState } from "react";
import AdminSidebar from "./AdminSidebar";
import AdminHeader from "./AdminHeader";

function AdminLayout({ children, title }) {

    const [collapsed, setCollapsed] = useState(false);

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