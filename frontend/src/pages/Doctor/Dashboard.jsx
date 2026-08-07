import { useEffect, useMemo, useState } from "react";
import DoctorLayout from "../../components/doctor-dashboard/layout/DoctorLayout";
import DoctorStatCard from "../../components/doctor-dashboard/dashboard/DoctorStatCard";
import TodayAppointments from "../../components/doctor-dashboard/dashboard/TodayAppointments";
import ScheduleCalendar from "../../components/doctor-dashboard/dashboard/ScheduleCalendar";
import PatientQueue from "../../components/doctor-dashboard/dashboard/PatientQueue";
import ReviewSummary from "../../components/doctor-dashboard/dashboard/ReviewSummary";
import { useAuth } from "../../context/AuthContext";
import appointmentService from "../../services/appointment.service";
import scheduleService from "../../services/schedule.service";
import { CalendarCheck, Users, Clock3, Star } from "lucide-react";

function toYMD(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function startOfWeek(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

function Dashboard() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);

  const today = toYMD(new Date());
  const weekStart = useMemo(() => startOfWeek(), []);
  const fromDate = toYMD(weekStart);
  const toDate = useMemo(() => {
    const end = new Date(weekStart);
    end.setDate(weekStart.getDate() + 6);
    return toYMD(end);
  }, [weekStart]);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const doctorId = user?.id;
        const [apptResult, scheduleResult] = await Promise.all([
          appointmentService.getAppointments({ page: 1, limit: 100 }),
          scheduleService.getSchedules({
            doctor_id: doctorId,
            from_date: fromDate,
            to_date: toDate,
            page: 1,
            limit: 200,
          }),
        ]);

        if (!alive) return;
        setAppointments(apptResult.data || []);
        setSchedules(scheduleResult.data || []);
      } catch {
        if (alive) {
          setAppointments([]);
          setSchedules([]);
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [user?.id, fromDate, toDate]);

  const todayAppointments = useMemo(
    () =>
      appointments
        .filter(
          (a) =>
            a.work_date === today &&
            a.status !== "CANCELLED",
        )
        .sort((a, b) =>
          String(a.start_time || "").localeCompare(String(b.start_time || "")),
        ),
    [appointments, today],
  );

  const weekAppointments = useMemo(
    () =>
      appointments.filter(
        (a) =>
          a.work_date >= fromDate &&
          a.work_date <= toDate &&
          a.status !== "CANCELLED",
      ),
    [appointments, fromDate, toDate],
  );

  const pendingToday = todayAppointments.filter(
    (a) => a.status === "PENDING" || a.status === "CONFIRMED",
  ).length;

  const todaySchedules = useMemo(
    () =>
      schedules
        .filter((s) => s.work_date === today)
        .sort((a, b) =>
          String(a.start_time || "").localeCompare(String(b.start_time || "")),
        ),
    [schedules, today],
  );

  const workingHours = useMemo(() => {
    if (!todaySchedules.length) return "Chưa có lịch";
    const starts = todaySchedules.map((s) => s.start_time).filter(Boolean);
    const ends = todaySchedules.map((s) => s.end_time).filter(Boolean);
    if (!starts.length || !ends.length) return "—";
    return `${starts[0]} - ${ends[ends.length - 1]}`;
  }, [todaySchedules]);

  const uniquePatientsWeek = useMemo(() => {
    const ids = new Set(
      weekAppointments
        .map((a) => a.patient_profile_id)
        .filter(Boolean),
    );
    return ids.size;
  }, [weekAppointments]);

  const stats = [
    {
      title: "Lịch hẹn hôm nay",
      value: loading ? "…" : todayAppointments.length,
      icon: <CalendarCheck size={26} />,
      color: "#0d9488",
      note: loading
        ? "Đang tải..."
        : `${pendingToday} đang chờ / đã xác nhận`,
    },
    {
      title: "Bệnh nhân trong tuần",
      value: loading ? "…" : uniquePatientsWeek,
      icon: <Users size={26} />,
      color: "#2563eb",
      note: loading
        ? "Đang tải..."
        : `${weekAppointments.length} lịch hẹn tuần này`,
    },
    {
      title: "Giờ làm việc hôm nay",
      value: loading ? "…" : workingHours,
      icon: <Clock3 size={26} />,
      color: "#f59e0b",
      note: `${todaySchedules.length} khung giờ`,
    },
    {
      title: "Đánh giá trung bình",
      value: "—",
      icon: <Star size={26} />,
      color: "#ef4444",
      note: "Chưa có API đánh giá",
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
          <TodayAppointments appointments={todayAppointments} loading={loading} />
          <ScheduleCalendar
            schedules={schedules}
            appointments={weekAppointments}
            weekStart={weekStart}
            selectedDate={today}
            loading={loading}
          />
        </div>

        <div className="doctor-dashboard-grid">
          <PatientQueue appointments={todayAppointments} loading={loading} />
          <ReviewSummary />
        </div>
      </div>
    </DoctorLayout>
  );
}

export default Dashboard;
