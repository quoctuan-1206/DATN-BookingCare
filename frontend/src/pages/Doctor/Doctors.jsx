import Header from "../../components/common/Header/Header";
import Footer from "../../components/common/Footer/Footer";
import PageBanner from "../../components/common/PageBanner/PageBanner";

import DoctorFilter from "../../components/doctor/DoctorFilter";
import DoctorCard from "../../components/doctor/DoctorCard";

const doctors = [
    {
        id: 1,
        name: "TS.BS Nguyễn Văn A",
        specialty: "Tim mạch",
        clinic: "Bệnh viện Chợ Rẫy",
        image: "https://picsum.photos/300?1",
        rating: 4.9,
    },
    {
        id: 2,
        name: "BS Trần Văn B",
        specialty: "Da liễu",
        clinic: "Vinmec",
        image: "https://picsum.photos/300?2",
        rating: 4.8,
    },
    {
        id: 3,
        name: "BS Lê Văn C",
        specialty: "Nhi khoa",
        clinic: "Bệnh viện Nhi Đồng 1",
        image: "https://picsum.photos/300?3",
        rating: 4.7,
    },
    {
        id: 4,
        name: "BS Phạm Thị D",
        specialty: "Tai Mũi Họng",
        clinic: "Bệnh viện Bạch Mai",
        image: "https://picsum.photos/300?4",
        rating: 4.9,
    },
    {
        id: 5,
        name: "PGS.TS Hoàng Văn E",
        specialty: "Ngoại khoa",
        clinic: "Bệnh viện Đại học Y Dược",
        image: "https://picsum.photos/300?5",
        rating: 5.0,
    },
    {
        id: 6,
        name: "BS Nguyễn Thị F",
        specialty: "Răng Hàm Mặt",
        clinic: "Nha khoa Kim",
        image: "https://picsum.photos/300?6",
        rating: 4.6,
    },
];

function Doctors() {
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
