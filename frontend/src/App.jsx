import { Routes, Route } from "react-router-dom";

import Home from "./pages/Home/Home";
import Doctors from "./pages/Doctor/Doctors";
import DoctorDetail from "./pages/Doctor/DoctorDetail";
import Clinics from "./pages/Clinic/Clinics";
import ClinicDetail from "./pages/Clinic/ClinicDetail";
import Specialties from "./pages/Specialty/Specialties";
import SpecialtyDetail from "./pages/Specialty/SpecialtyDetail";

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
        </Routes>
    );
}

export default App;
