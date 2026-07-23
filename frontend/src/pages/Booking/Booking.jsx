import { useMemo, useState } from "react";
import { useLocation } from "react-router-dom";

import Header from "../../components/common/Header/Header";
import Footer from "../../components/common/Footer/Footer";

import BookingDoctor from "../../components/booking/BookingDoctor";
import PatientSelector from "../../components/booking/PatientSelector";
import BookingForm from "../../components/booking/BookingForm";
import BookingSummary from "../../components/booking/BookingSummary";
import BookingConfirm from "../../components/booking/BookingConfirm";
import { getBookingPatients, getDefaultBookingPayload } from "../../data";

function Booking() {
    const location = useLocation();
    const defaults = getDefaultBookingPayload();
    const incoming = location.state;

    const doctor = incoming?.doctor || defaults.doctor;
    const schedule = incoming?.schedule || defaults.schedule;
    const patients = getBookingPatients();

    const [selectedPatientId, setSelectedPatientId] = useState(patients[0]?.id);
    const [formData, setFormData] = useState({
        reason: "",
        note: "",
    });

    const selectedPatient = useMemo(
        () => patients.find((p) => p.id === selectedPatientId) || patients[0],
        [patients, selectedPatientId]
    );

    return (
        <>
            <Header />

            <section className="section booking-section">
                <div className="container booking-page">
                    <header className="booking-page-header">
                        <p className="booking-eyebrow">Booking Care</p>
                        <h1 className="page-title">Đặt lịch khám</h1>
                        <p className="booking-page-desc">
                            Kiểm tra thông tin bác sĩ, chọn hồ sơ bệnh nhân và
                            xác nhận lịch khám của bạn.
                        </p>
                    </header>

                    <div className="booking-layout">
                        <div className="booking-main">
                            <PatientSelector
                                patients={patients}
                                selectedPatientId={selectedPatientId}
                                onSelectPatient={setSelectedPatientId}
                            />

                            <BookingForm
                                formData={formData}
                                onChange={setFormData}
                            />
                        </div>

                        <aside className="booking-aside">
                            <BookingDoctor
                                doctor={doctor}
                                schedule={schedule}
                            />

                            <div className="booking-card booking-aside-panel">
                                <BookingSummary
                                    doctor={doctor}
                                    schedule={schedule}
                                    patient={selectedPatient}
                                    embedded
                                />

                                <BookingConfirm
                                    doctor={doctor}
                                    schedule={schedule}
                                    patient={selectedPatient}
                                    formData={formData}
                                    embedded
                                />
                            </div>
                        </aside>
                    </div>
                </div>
            </section>

            <Footer />
        </>
    );
}

export default Booking;
