import { useEffect, useState } from "react";
import AdminLayout from "../../components/admin/layout/AdminLayout";
import StatCard from "../../components/admin/dashboard/StatCard";
import QuickActions from "../../components/admin/dashboard/QuickActions";
import RecentAppointments from "../../components/admin/dashboard/RecentAppointments";
import RecentUsers from "../../components/admin/dashboard/RecentUsers";
import OverviewChart from "../../components/admin/dashboard/OverviewChart";
import userService from "../../services/user.service";
import doctorService from "../../services/doctor.service";
import clinicService from "../../services/clinic.service";
import appointmentService from "../../services/appointment.service";
import { Users, UserRound, Hospital, CalendarCheck } from "lucide-react";

function Dashboard() {
  const [stats, setStats] = useState({
    users: 0,
    doctors: 0,
    clinics: 0,
    appointments: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const [users, doctors, clinics, appointments] = await Promise.all([
          userService.getUsers({ page: 1, limit: 1 }),
          doctorService.getDoctors({ page: 1, limit: 1 }),
          clinicService.getClinics({ page: 1, limit: 1 }),
          appointmentService.getAppointments({ page: 1, limit: 1 }),
        ]);

        if (!alive) return;

        setStats({
          users: users.pagination?.total ?? users.data?.length ?? 0,
          doctors: doctors.pagination?.total ?? doctors.data?.length ?? 0,
          clinics: clinics.pagination?.total ?? clinics.data?.length ?? 0,
          appointments:
            appointments.pagination?.total ?? appointments.data?.length ?? 0,
        });
      } catch {
        if (alive) {
          setStats({ users: 0, doctors: 0, clinics: 0, appointments: 0 });
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  const cards = [
    {
      title: "Người dùng",
      value: loading ? "…" : stats.users,
      icon: <Users size={28} />,
      color: "#3b82f6",
    },
    {
      title: "Bác sĩ",
      value: loading ? "…" : stats.doctors,
      icon: <UserRound size={28} />,
      color: "#10b981",
    },
    {
      title: "Phòng khám",
      value: loading ? "…" : stats.clinics,
      icon: <Hospital size={28} />,
      color: "#f59e0b",
    },
    {
      title: "Lịch hẹn",
      value: loading ? "…" : stats.appointments,
      icon: <CalendarCheck size={28} />,
      color: "#ef4444",
    },
  ];

  return (
    <AdminLayout title="Dashboard">
      <div className="dashboard">
        <div className="dashboard-stats">
          {cards.map((item) => (
            <StatCard key={item.title} {...item} />
          ))}
        </div>

        <OverviewChart />

        <div className="dashboard-bottom">
          <RecentAppointments />
          <RecentUsers />
        </div>

        <QuickActions />
      </div>
    </AdminLayout>
  );
}

export default Dashboard;
