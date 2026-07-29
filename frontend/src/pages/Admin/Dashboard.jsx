import AdminLayout from "../../components/admin/layout/AdminLayout";

import StatCard from "../../components/admin/dashboard/StatCard";
import QuickActions from "../../components/admin/dashboard/QuickActions";
import RecentAppointments from "../../components/admin/dashboard/RecentAppointments";
import RecentUsers from "../../components/admin/dashboard/RecentUsers";
import OverviewChart from "../../components/admin/dashboard/OverviewChart";

import {
    Users,
    UserRound,
    Hospital,
    CalendarCheck,
} from "lucide-react";

function Dashboard() {

    const stats = [

        {
            title: "Người dùng",
            value: 1258,
            icon: <Users size={28} />,
            color: "#3b82f6",
            change: "+12%"
        },

        {
            title: "Bác sĩ",
            value: 86,
            icon: <UserRound size={28} />,
            color: "#10b981",
            change: "+5%"
        },

        {
            title: "Phòng khám",
            value: 18,
            icon: <Hospital size={28} />,
            color: "#f59e0b",
            change: "+2%"
        },

        {
            title: "Lịch hẹn",
            value: 356,
            icon: <CalendarCheck size={28} />,
            color: "#ef4444",
            change: "+18%"
        }

    ];

    return (

        <AdminLayout title="Dashboard">

            <div className="dashboard">

                {/* Stat Cards */}

                <div className="dashboard-stats">

                    {

                        stats.map((item, index) => (

                            <StatCard
                                key={index}
                                {...item}
                            />

                        ))

                    }

                </div>

                {/* Chart */}

                <OverviewChart />

                {/* Bottom */}

                <div className="dashboard-bottom">

                    <RecentAppointments />

                    <RecentUsers />

                </div>

                {/* Quick Actions */}

                <QuickActions />

            </div>

        </AdminLayout>

    );

}

export default Dashboard;