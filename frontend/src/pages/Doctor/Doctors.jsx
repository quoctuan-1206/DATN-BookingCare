import Header from "../../components/common/Header/Header";
import Footer from "../../components/common/Footer/Footer";
import PageBanner from "../../components/common/PageBanner/PageBanner";

import DoctorFilter from "../../components/doctor/DoctorFilter";
import DoctorCard from "../../components/doctor/DoctorCard";
import { getDoctors } from "../../data";

function Doctors() {
    const doctors = getDoctors();

    return (
        <>
            <Header />

            <div className="listing-page">
                <PageBanner
                    variant="doctor"
                    title="Danh sách bác sĩ"
                    description="Tìm bác sĩ uy tín, xem hồ sơ chuyên môn và đặt lịch khám nhanh chóng."
                />

                <section className="listing-content">
                    <div className="container listing-body">
                        <div className="listing-toolbar">
                            <DoctorFilter />

                            <div className="listing-meta">
                                <span>
                                    Tìm thấy <strong>{doctors.length}</strong> bác sĩ
                                </span>
                            </div>
                        </div>

                        <div className="listing-results">
                            <div className="listing-grid">
                                {doctors.map((doctor) => (
                                    <DoctorCard
                                        key={doctor.id}
                                        doctor={doctor}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </section>
            </div>

            <Footer />
        </>
    );
}

export default Doctors;
