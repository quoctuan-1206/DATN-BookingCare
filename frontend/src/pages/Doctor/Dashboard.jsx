import { useEffect, useMemo, useState } from "react";
import DoctorLayout from "../../components/doctor-dashboard/layout/DoctorLayout";
import DoctorStatCard from "../../components/doctor-dashboard/dashboard/DoctorStatCard";
import TodayAppointments from "../../components/doctor-dashboard/dashboard/TodayAppointments";
import TodayTasks from "../../components/doctor-dashboard/dashboard/TodayTasks";
import ScheduleCalendar from "../../components/doctor-dashboard/dashboard/ScheduleCalendar";
import { useAuth } from "../../context/AuthContext";
import appointmentService from "../../services/appointment.service";
import scheduleService from "../../services/schedule.service";
import medicalRecordService from "../../services/medical-record.service";
import reviewService from "../../services/review.service";
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

function isSameDay(value, ymd) {
  if (!value) return false;
  return String(value).slice(0, 10) === ymd;
}

function Dashboard() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [records, setRecords] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [reviewStats, setReviewStats] = useState({
    average_rating: 0,
    total_reviews: 0,
  });
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
        const [apptResult, scheduleResult, recordResult, reviewResult, stats] =
          await Promise.all([
            appointmentService.getAppointments({ page: 1, limit: 100 }),
            scheduleService.getSchedules({
              doctor_id: doctorId,
              from_date: fromDate,
              to_date: toDate,
              page: 1,
              limit: 200,
            }),
            medicalRecordService.getRecords({ page: 1, limit: 100 }),
            doctorId
              ? reviewService.getReviews({ doctor_id: doctorId, page: 1, limit: 20 })
              : Promise.resolve({ data: [] }),
            doctorId
              ? reviewService.getDoctorStats(doctorId)
              : Promise.resolve({ average_rating: 0, total_reviews: 0 }),
          ]);

        if (!alive) return;
        setAppointments(apptResult.data || []);
        setSchedules(scheduleResult.data || []);
        setRecords(recordResult.data || []);
        setReviews(reviewResult.data || []);
        setReviewStats(stats);
      } catch {
        if (alive) {
          setAppointments([]);
          setSchedules([]);
          setRecords([]);
          setReviews([]);
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
        .filter((a) => a.work_date === today && a.status !== "CANCELLED")
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

  const waitingToday = todayAppointments.filter(
    (a) => a.status === "PENDING" || a.status === "CONFIRMED",
  );

  const recordedAppointmentIds = useMemo(
    () => new Set(records.map((record) => Number(record.appointment_id))),
    [records],
  );

  const recordsNeeded = todayAppointments.filter(
    (a) =>
      (a.status === "CONFIRMED" || a.status === "COMPLETED") &&
      !recordedAppointmentIds.has(Number(a.id)),
  ).length;

  const prescriptionsNeeded = records.filter((record) => {
    const matchesToday =
      isSameDay(record.created_at, today) ||
      isSameDay(record.work_date, today) ||
      todayAppointments.some((a) => Number(a.id) === Number(record.appointment_id));
    return matchesToday && !record.has_prescription;
  }).length;

  const newReviews = reviews.filter((review) =>
    isSameDay(review.created_at, today),
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
      weekAppointments.map((a) => a.patient_profile_id).filter(Boolean),
    );
    return ids.size;
  }, [weekAppointments]);

  const avgRating = Number(reviewStats.average_rating || 0);

  const stats = [
    {
      title: "Lịch hẹn hôm nay",
      value: loading ? "…" : todayAppointments.length,
      icon: <CalendarCheck size={26} />,
      color: "#0d9488",
      note: loading
        ? "Đang tải..."
        : `${waitingToday.length} đang chờ / đã xác nhận`,
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
      value: loading ? "…" : avgRating > 0 ? avgRating.toFixed(1) : "—",
      icon: <Star size={26} />,
      color: "#ef4444",
      note: `${reviewStats.total_reviews || 0} đánh giá`,
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

        <div className="doctor-dashboard-main">
          <TodayAppointments
            appointments={todayAppointments}
            loading={loading}
          />
          <TodayTasks
            waitingCount={waitingToday.length}
            recordCount={recordsNeeded}
            prescriptionCount={prescriptionsNeeded}
            reviewCount={newReviews}
          />
        </div>

        <ScheduleCalendar
          schedules={schedules}
          appointments={weekAppointments}
          weekStart={weekStart}
          selectedDate={today}
          loading={loading}
        />
      </div>
    </DoctorLayout>
  );
}

export default Dashboard;
