import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";

import Header from "../../components/common/Header/Header";
import Footer from "../../components/common/Footer/Footer";

import DoctorProfile from "../../components/doctor/DoctorProfile";
import DoctorBiography from "../../components/doctor/DoctorBiography";
import DoctorSchedule from "../../components/doctor/DoctorSchedule";
import DoctorReview from "../../components/doctor/DoctorReview";
import BookingPanel from "../../components/doctor/BookingPanel";
import {
    getClinicById,
    getDoctorById,
    getScheduleDateOptions,
    getSlotsByDoctorAndDate,
} from "../../data";

function DoctorDetail() {
    const { id } = useParams();
    const doctor = useMemo(() => getDoctorById(id), [id]);

    const dateOptions = useMemo(
        () => (doctor ? getScheduleDateOptions(doctor.id) : []),
        [doctor]
    );

    const [selectedDate, setSelectedDate] = useState("");
    const [selectedSchedule, setSelectedSchedule] = useState(null);

    useEffect(() => {
        if (!doctor) {
            setSelectedDate("");
            setSelectedSchedule(null);
            return;
        }
        const options = getScheduleDateOptions(doctor.id);
        setSelectedDate(options[0]?.value || "");
        setSelectedSchedule(null);
    }, [doctor]);

    const slots = useMemo(() => {
        if (!doctor || !selectedDate) return [];
        return getSlotsByDoctorAndDate(doctor.id, selectedDate);
    }, [doctor, selectedDate]);

    const clinic = doctor?.clinic_id
        ? getClinicById(doctor.clinic_id)
        : null;

    const handleSelectSlot = (slot) => {
        setSelectedSchedule({
            id: slot.id,
            date: slot.date_display,
            work_date: slot.work_date,
            start: slot.start_time,
            end: slot.end_time,
        });
    };

    const handleDateChange = (date) => {
        setSelectedDate(date);
        setSelectedSchedule(null);
    };

    if (!doctor) {
        return (
            <>
                <Header />

                <section className="section">
                    <div className="container doctor-detail">
                        <h1>Không tìm thấy bác sĩ</h1>
                        <Link to="/doctors" className="btn btn-primary">
                            Quay lại danh sách
                        </Link>
                    </div>
                </section>

                <Footer />
            </>
        );
    }

    return (
        <>
            <Header />

            <section className="section">
                <div className="container doctor-detail">
                    <DoctorProfile doctor={doctor} />
                    <DoctorBiography doctor={doctor} />

                    <div className="doctor-booking-flow">
                        <DoctorSchedule
                            doctor={doctor}
                            clinic={clinic}
                            dateOptions={dateOptions}
                            slots={slots}
                            selectedDate={selectedDate}
                            selectedSchedule={selectedSchedule}
                            onDateChange={handleDateChange}
                            onSelectSlot={handleSelectSlot}
                        />

                        <BookingPanel
                            doctor={doctor}
                            selectedSchedule={selectedSchedule}
                        />
                    </div>

                    <DoctorReview doctorId={doctor.id} />
                </div>
            </section>

            <Footer />
        </>
    );
}

export default DoctorDetail;
