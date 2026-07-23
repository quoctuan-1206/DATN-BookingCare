import { Routes, Route } from "react-router-dom";

import Home from "./pages/Home/Home";
import Doctors from "./pages/Doctor/Doctors";
import DoctorDetail from "./pages/Doctor/DoctorDetail";
import Clinics from "./pages/Clinic/Clinics";
import ClinicDetail from "./pages/Clinic/ClinicDetail";
import Specialties from "./pages/Specialty/Specialties";
import SpecialtyDetail from "./pages/Specialty/SpecialtyDetail";
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
