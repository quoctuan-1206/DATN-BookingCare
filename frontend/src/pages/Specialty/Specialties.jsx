import Header from "../../components/common/Header/Header";
import Footer from "../../components/common/Footer/Footer";
import PageBanner from "../../components/common/PageBanner/PageBanner";

import SpecialtyFilter from "../../components/specialty/SpecialtyFilter";
import SpecialtyCard from "../../components/specialty/SpecialtyCard";

const specialties = [
    {
        id: 1,
        name: "Tim mạch",
        description: "Khám và điều trị các bệnh về tim, huyết áp và hệ tuần hoàn.",
        image: "https://picsum.photos/600/400?11",
    },
    {
        id: 2,
        name: "Tai Mũi Họng",
        description: "Khám và điều trị bệnh tai, mũi, họng và các cơ quan liên quan.",
        image: "https://picsum.photos/600/400?12",
    },
    {
        id: 3,
        name: "Răng Hàm Mặt",
        description: "Điều trị và chăm sóc răng miệng, nha khoa thẩm mỹ.",
        image: "https://picsum.photos/600/400?13",
    },
    {
        id: 4,
        name: "Da Liễu",
        description: "Khám các bệnh về da, tóc, móng và thẩm mỹ da liễu.",
        image: "https://picsum.photos/600/400?14",
    },
    {
        id: 5,
        name: "Nhi khoa",
        description: "Chăm sóc sức khỏe trẻ em từ sơ sinh đến tuổi vị thành niên.",
        image: "https://picsum.photos/600/400?15",
    },
    {
        id: 6,
        name: "Nội tổng quát",
        description: "Khám và điều trị các bệnh lý nội khoa phổ biến.",
        image: "https://picsum.photos/600/400?16",
    },
];

function Specialties() {
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
