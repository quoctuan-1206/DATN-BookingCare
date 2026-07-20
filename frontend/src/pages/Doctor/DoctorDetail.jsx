import { useState } from "react";
import { useParams, Link } from "react-router-dom";

import Header from "../../components/common/Header/Header";
import Footer from "../../components/common/Footer/Footer";

import DoctorProfile from "../../components/doctor/DoctorProfile";
import DoctorBiography from "../../components/doctor/DoctorBiography";
import DoctorSchedule from "../../components/doctor/DoctorSchedule";
import DoctorReview from "../../components/doctor/DoctorReview";
import BookingPanel from "../../components/doctor/BookingPanel";

const doctors = [
    {
        id: 1,
        name: "TS.BS Nguyễn Văn A",
        specialty: "Tim mạch",
        clinic: "Bệnh viện Chợ Rẫy",
        image: "https://picsum.photos/300?1",
        price: "500.000đ",
    },
    {
        id: 2,
        name: "BS Trần Văn B",
        specialty: "Da liễu",
        clinic: "Vinmec",
        image: "https://picsum.photos/300?2",
        price: "500.000đ",
    },
];

function getEndTime(start) {
    const [hour] = start.split(":");
    return `${String(Number(hour) + 1).padStart(2, "0")}:00`;
}

function DoctorDetail() {
    const { id } = useParams();
    const doctor = doctors.find((item) => item.id === Number(id));

    const [selectedDate, setSelectedDate] = useState("20/07/2026");
    const [selectedSchedule, setSelectedSchedule] = useState(null);

    const handleSelectTime = (start) => {
        setSelectedSchedule({
            date: selectedDate,
            start,
            end: getEndTime(start),
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
                            selectedDate={selectedDate}
                            selectedSchedule={selectedSchedule}
                            onDateChange={handleDateChange}
                            onSelectTime={handleSelectTime}
                        />

                        <BookingPanel
                            doctor={doctor}
                            selectedSchedule={selectedSchedule}
                        />
                    </div>

                    <DoctorReview />
                </div>
            </section>

            <Footer />
        </>
    );
}

export default DoctorDetail;
