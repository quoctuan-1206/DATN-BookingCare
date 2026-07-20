import Header from "../../components/common/Header/Header";
import Footer from "../../components/common/Footer/Footer";
import PageBanner from "../../components/common/PageBanner/PageBanner";

import ClinicFilter from "../../components/clinic/ClinicFilter";
import ClinicCard from "../../components/clinic/ClinicCard";

const clinics = [
    {
        id: 1,
        name: "Bệnh viện Chợ Rẫy",
        address: "TP Hồ Chí Minh",
        phone: "02838554137",
        image: "https://picsum.photos/600/400?1",
    },
    {
        id: 2,
        name: "Bệnh viện Bạch Mai",
        address: "Hà Nội",
        phone: "02438693731",
        image: "https://picsum.photos/600/400?2",
    },
    {
        id: 3,
        name: "Bệnh viện Đại học Y Dược",
        address: "TP Hồ Chí Minh",
        phone: "02838554269",
        image: "https://picsum.photos/600/400?3",
    },
    {
        id: 4,
        name: "Vinmec Central Park",
        address: "TP Hồ Chí Minh",
        phone: "02836221166",
        image: "https://picsum.photos/600/400?4",
    },
    {
        id: 5,
        name: "FV Hospital",
        address: "TP Hồ Chí Minh",
        phone: "02854113333",
        image: "https://picsum.photos/600/400?5",
    },
    {
        id: 6,
        name: "Bệnh viện Nhi Đồng 1",
        address: "TP Hồ Chí Minh",
        phone: "02839271144",
        image: "https://picsum.photos/600/400?6",
    },
];

function Clinics() {
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
