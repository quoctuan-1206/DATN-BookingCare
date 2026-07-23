import Header from "../../components/common/Header/Header";
import Footer from "../../components/common/Footer/Footer";
import PageBanner from "../../components/common/PageBanner/PageBanner";

import ClinicFilter from "../../components/clinic/ClinicFilter";
import ClinicCard from "../../components/clinic/ClinicCard";
import { getClinics } from "../../data";

function Clinics() {
    const clinics = getClinics();

    return (
        <>
            <Header />

            <div className="listing-page">
                <PageBanner
                    variant="clinic"
                    title="Danh sách phòng khám"
                    description="Khám phá các cơ sở y tế uy tín trên toàn quốc và đặt lịch khám dễ dàng."
                />

                <section className="listing-content">
                    <div className="container listing-body">
                        <div className="listing-toolbar">
                            <ClinicFilter />

                            <div className="listing-meta">
                                <span>
                                    Tìm thấy <strong>{clinics.length}</strong> phòng khám
                                </span>
                            </div>
                        </div>

                        <div className="listing-results">
                            <div className="listing-grid">
                                {clinics.map((clinic) => (
                                    <ClinicCard
                                        key={clinic.id}
                                        clinic={clinic}
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

export default Clinics;
