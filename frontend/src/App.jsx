import { Routes, Route } from "react-router-dom";

import Home from "./pages/Home/Home";
import Doctors from "./pages/Doctor/Doctors";
import DoctorDetail from "./pages/Doctor/DoctorDetail";
import Clinics from "./pages/Clinic/Clinics";
import ClinicDetail from "./pages/Clinic/ClinicDetail";
import Specialties from "./pages/Specialty/Specialties";
import SpecialtyDetail from "./pages/Specialty/SpecialtyDetail";
import Articles from "./pages/Article/Articles";
import ArticleDetail from "./pages/Article/ArticleDetail";
import Booking from "./pages/Booking/Booking";
import BookingSuccess from "./pages/Booking/BookingSuccess";

import Dashboard from "./pages/Patient/Dashboard";
import PatientProfiles from "./pages/Patient/PatientProfiles";
import Appointments from "./pages/Patient/Appointments";
import AppointmentDetail from "./pages/Patient/AppointmentDetail";
import MedicalRecords from "./pages/Patient/MedicalRecords";
import Notifications from "./pages/Patient/Notifications";
import Profile from "./pages/Patient/Profile";

import Login from "./pages/Auth/Login";
import Register from "./pages/Auth/Register";
import ForgotPassword from "./pages/Auth/ForgotPassword";
import VerifyOTP from "./pages/Auth/VerifyOTP";
import ResetPassword from "./pages/Auth/ResetPassword";
import Unauthorized from "./pages/Auth/Unauthorized";

import AdminDashboard from "./pages/Admin/Dashboard";
import AdminDoctors from "./pages/Admin/Doctors";
import AdminDoctorCreate from "./pages/Admin/DoctorCreate";
import AdminClinics from "./pages/Admin/Clinics";
import AdminClinicCreate from "./pages/Admin/ClinicCreate";
import AdminSpecialties from "./pages/Admin/Specialties";
import AdminSpecialtyCreate from "./pages/Admin/SpecialtyCreate";
import AdminAppointments from "./pages/Admin/Appointments";
import AdminUsers from "./pages/Admin/Users";
import AdminUserDetail from "./pages/Admin/UserDetail";
import AdminArticles from "./pages/Admin/Articles";
import AdminArticleCreate from "./pages/Admin/ArticleCreate";
import AdminArticleEdit from "./pages/Admin/ArticleEdit";
import AdminReviews from "./pages/Admin/Reviews";
import AdminPayments from "./pages/Admin/Payments";
import AdminSettings from "./pages/Admin/Settings";
import AdminProfile from "./pages/Admin/Profile";

import DoctorDashboard from "./pages/Doctor/Dashboard";
import DoctorSchedule from "./pages/Doctor/Schedule";
import DoctorAppointments from "./pages/Doctor/Appointments";
import DoctorAppointmentDetail from "./pages/Doctor/AppointmentDetail";
import DoctorMedicalRecord from "./pages/Doctor/MedicalRecord";
import DoctorWorkingSchedule from "./pages/Doctor/WorkingSchedule";
import DoctorPrescriptions from "./pages/Doctor/Prescriptions";
import DoctorReviews from "./pages/Doctor/Reviews";
import DoctorProfile from "./pages/Doctor/Profile";

function App() {
    return (
        <Routes>
            <Route path="/" element={<Home />} />

            <Route path="/doctors" element={<Doctors />} />
            <Route path="/doctors/:id" element={<DoctorDetail />} />

            <Route path="/clinics" element={<Clinics />} />
            <Route path="/clinics/:id" element={<ClinicDetail />} />

            <Route path="/specialties" element={<Specialties />} />
            <Route path="/specialties/:id" element={<SpecialtyDetail />} />

            <Route path="/articles" element={<Articles />} />
            <Route path="/articles/:id" element={<ArticleDetail />} />

            <Route path="/booking" element={<Booking />} />
            <Route path="/booking/success" element={<BookingSuccess />} />

            <Route path="/patient" element={<Dashboard />} />
            <Route path="/patient/profiles" element={<PatientProfiles />} />
            <Route path="/patient/appointments" element={<Appointments />} />
            <Route
                path="/patient/appointments/:id"
                element={<AppointmentDetail />}
            />
            <Route
                path="/patient/medical-records"
                element={<MedicalRecords />}
            />
            <Route path="/patient/notifications" element={<Notifications />} />
            <Route path="/patient/profile" element={<Profile />} />

            <Route path="/doctor" element={<DoctorDashboard />} />
            <Route path="/doctor/schedule" element={<DoctorSchedule />} />
            <Route path="/doctor/appointments" element={<DoctorAppointments />} />
            <Route
                path="/doctor/appointments/:id"
                element={<DoctorAppointmentDetail />}
            />
            <Route
                path="/doctor/medical-records"
                element={<DoctorMedicalRecord />}
            />
            <Route
                path="/doctor/working-schedule"
                element={<DoctorWorkingSchedule />}
            />
            <Route
                path="/doctor/prescriptions"
                element={<DoctorPrescriptions />}
            />
            <Route path="/doctor/reviews" element={<DoctorReviews />} />
            <Route path="/doctor/profile" element={<DoctorProfile />} />

            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/doctors" element={<AdminDoctors />} />
            <Route path="/admin/doctors/create" element={<AdminDoctorCreate />} />
            <Route path="/admin/clinics" element={<AdminClinics />} />
            <Route path="/admin/clinics/create" element={<AdminClinicCreate />} />
            <Route path="/admin/specialties" element={<AdminSpecialties />} />
            <Route
                path="/admin/specialties/create"
                element={<AdminSpecialtyCreate />}
            />
            <Route path="/admin/appointments" element={<AdminAppointments />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/users/:id" element={<AdminUserDetail />} />
            <Route path="/admin/articles" element={<AdminArticles />} />
            <Route
                path="/admin/articles/create"
                element={<AdminArticleCreate />}
            />
            <Route
                path="/admin/articles/:id/edit"
                element={<AdminArticleEdit />}
            />
            <Route path="/admin/reviews" element={<AdminReviews />} />
            <Route path="/admin/payments" element={<AdminPayments />} />
            <Route path="/admin/settings" element={<AdminSettings />} />
            <Route path="/admin/profile" element={<AdminProfile />} />

            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/verify-otp" element={<VerifyOTP />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/unauthorized" element={<Unauthorized />} />
        </Routes>
    );
}

export default App;
