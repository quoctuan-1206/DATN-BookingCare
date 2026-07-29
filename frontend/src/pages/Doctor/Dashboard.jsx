import DoctorLayout from "../../components/doctor-dashboard/layout/DoctorLayout";
import DoctorStatCard from "../../components/doctor-dashboard/dashboard/DoctorStatCard";
import TodayAppointments from "../../components/doctor-dashboard/dashboard/TodayAppointments";
import ScheduleCalendar from "../../components/doctor-dashboard/dashboard/ScheduleCalendar";
import PatientQueue from "../../components/doctor-dashboard/dashboard/PatientQueue";
import ReviewSummary from "../../components/doctor-dashboard/dashboard/ReviewSummary";
import {
    CalendarCheck,
    Users,
    Clock3,
    Star,
} from "lucide-react";

function Dashboard() {
    const stats = [
        {
            title: "Lịch hẹn hôm nay",
            value: 8,
            icon: <CalendarCheck size={26} />,
            color: "#0d9488",
            note: "3 đang chờ khám",
        },
        {
            title: "Bệnh nhân trong tuần",
            value: 42,
            icon: <Users size={26} />,
            color: "#2563eb",
            note: "+6 so với tuần trước",
        },
        {
            title: "Giờ làm việc",
            value: "08:00 - 17:00",
            icon: <Clock3 size={26} />,
            color: "#f59e0b",
            note: "Thứ 2 - Thứ 6",
        },
        {
            title: "Đánh giá trung bình",
            value: "4.8",
            icon: <Star size={26} />,
            color: "#ef4444",
            note: "128 lượt đánh giá",
        },
    ];

    return (
        <DoctorLayout title="Dashboard">
            <div className="doctor-dashboard">
                <div className="doctor-dashboard-stats">
                    {stats.map((item) => (
                        <DoctorStatCard key={item.title} {...item} />
                    ))}
                </div>

                <div className="doctor-dashboard-grid">
                    <TodayAppointments />
                    <ScheduleCalendar />
                </div>

                <div className="doctor-dashboard-grid">
                    <PatientQueue />
                    <ReviewSummary />
                </div>
            </div>
        </DoctorLayout>
    );
}

export default Dashboard;
