import { useParams, Link } from "react-router-dom";

import Header from "../../components/common/Header/Header";
import Footer from "../../components/common/Footer/Footer";

import SpecialtyProfile from "../../components/specialty/SpecialtyProfile";
import SpecialtyDoctors from "../../components/specialty/SpecialtyDoctors";
import SpecialtyClinics from "../../components/specialty/SpecialtyClinics";

const specialties = [
    {
        id: 1,
        name: "Tim mạch",
        description:
            "Chuyên khoa Tim mạch tiếp nhận khám, điều trị các bệnh lý liên quan đến tim và hệ tuần hoàn.",
        image: "https://picsum.photos/1200/400?11",
        doctors: [
            { id: 1, name: "TS.BS Nguyễn Văn A", hospital: "Bệnh viện Chợ Rẫy" },
            { id: 2, name: "BS Trần Văn B", hospital: "Bệnh viện Đại học Y Dược" },
        ],
        clinics: [
            { id: 1, name: "Bệnh viện Chợ Rẫy" },
            { id: 3, name: "Bệnh viện Đại học Y Dược" },
        ],
    },
    {
        id: 2,
        name: "Tai Mũi Họng",
        description:
            "Khám và điều trị các bệnh lý về tai, mũi, họng và các cơ quan liên quan.",
        image: "https://picsum.photos/1200/400?12",
        doctors: [
            { id: 3, name: "BS Lê Văn C", hospital: "Bệnh viện Thống Nhất" },
        ],
        clinics: [
            { id: 2, name: "Bệnh viện Bạch Mai" },
            { id: 1, name: "Bệnh viện Chợ Rẫy" },
        ],
    },
    {
        id: 3,
        name: "Răng Hàm Mặt",
        description:
            "Điều trị và chăm sóc răng miệng, các bệnh lý về hàm mặt và nha khoa thẩm mỹ.",
        image: "https://picsum.photos/1200/400?13",
        doctors: [
            { id: 4, name: "BS Phạm Thị D", hospital: "Bệnh viện Bạch Mai" },
        ],
        clinics: [
            { id: 2, name: "Bệnh viện Bạch Mai" },
            { id: 3, name: "Bệnh viện Đại học Y Dược" },
        ],
    },
    {
        id: 4,
        name: "Da Liễu",
        description:
            "Khám và điều trị các bệnh lý về da, tóc, móng và các vấn đề thẩm mỹ da liễu.",
        image: "https://picsum.photos/1200/400?14",
        doctors: [
            { id: 2, name: "BS Trần Văn B", hospital: "Vinmec" },
        ],
        clinics: [
            { id: 1, name: "Bệnh viện Chợ Rẫy" },
            { id: 2, name: "Bệnh viện Bạch Mai" },
        ],
    },
];

function SpecialtyDetail() {
    const { id } = useParams();
    const specialty = specialties.find((item) => item.id === Number(id));

    if (!specialty) {
        return (
            <>
                <Header />

                <section className="section">
                    <div className="container">
                        <h1>Không tìm thấy chuyên khoa</h1>
                        <Link to="/specialties" className="btn btn-primary">
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
                <div className="container">
                    <SpecialtyProfile specialty={specialty} />
                    <SpecialtyDoctors doctors={specialty.doctors} />
                    <SpecialtyClinics clinics={specialty.clinics} />
                </div>
            </section>

            <Footer />
        </>
    );
}

export default SpecialtyDetail;
