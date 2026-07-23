import Header from "../../components/common/Header/Header";
import Footer from "../../components/common/Footer/Footer";
import PageBanner from "../../components/common/PageBanner/PageBanner";

import SpecialtyFilter from "../../components/specialty/SpecialtyFilter";
import SpecialtyCard from "../../components/specialty/SpecialtyCard";
import { getSpecialties } from "../../data";

function Specialties() {
    const specialties = getSpecialties();

    return (
        <>
            <Header />

            <div className="listing-page">
                <PageBanner
                    variant="specialty"
                    title="Chuyên khoa"
                    description="Khám phá các chuyên khoa y tế và tìm dịch vụ phù hợp với nhu cầu của bạn."
                />

                <section className="listing-content">
                    <div className="container listing-body">
                        <div className="listing-toolbar">
                            <SpecialtyFilter />

                            <div className="listing-meta">
                                <span>
                                    Tìm thấy <strong>{specialties.length}</strong> chuyên khoa
                                </span>
                            </div>
                        </div>

                        <div className="listing-results">
                            <div className="listing-grid">
                                {specialties.map((specialty) => (
                                    <SpecialtyCard
                                        key={specialty.id}
                                        specialty={specialty}
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

export default Specialties;
