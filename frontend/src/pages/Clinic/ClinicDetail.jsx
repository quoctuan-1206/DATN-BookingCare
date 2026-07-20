import { useParams, Link } from "react-router-dom";

import Header from "../../components/common/Header/Header";
import Footer from "../../components/common/Footer/Footer";

import ClinicProfile from "../../components/clinic/ClinicProfile";
import ClinicDoctors from "../../components/clinic/ClinicDoctors";
import ClinicImages from "../../components/clinic/ClinicImages";
import ClinicMap from "../../components/clinic/ClinicMap";

const clinics = [
    {
        id: 1,
        name: "Bệnh viện Chợ Rẫy",
        address: "TP Hồ Chí Minh",
        phone: "02838554137",
        description: "Bệnh viện tuyến cuối với nhiều chuyên khoa.",
        image: "https://picsum.photos/900/350?1",
        mapQuery: "Cho+Ray+Hospital",
        images: [
            "https://picsum.photos/400/300?11",
            "https://picsum.photos/400/300?12",
            "https://picsum.photos/400/300?13",
        ],
        doctors: [
            { id: 1, name: "TS.BS Nguyễn Văn A", specialty: "Tim mạch" },
            { id: 2, name: "BS Trần Văn B", specialty: "Da liễu" },
        ],
    },
    {
        id: 2,
        name: "Bệnh viện Bạch Mai",
        address: "Hà Nội",
        phone: "02438693731",
        description: "Bệnh viện đa khoa hạng đặc biệt tại Hà Nội.",
        image: "https://picsum.photos/900/350?2",
        mapQuery: "Bach+Mai+Hospital",
        images: [
            "https://picsum.photos/400/300?21",
            "https://picsum.photos/400/300?22",
            "https://picsum.photos/400/300?23",
        ],
        doctors: [
            { id: 3, name: "BS Lê Văn C", specialty: "Nội tổng quát" },
            { id: 4, name: "BS Phạm Thị D", specialty: "Nhi khoa" },
        ],
    },
    {
        id: 3,
        name: "Bệnh viện Đại học Y Dược",
        address: "TP Hồ Chí Minh",
        phone: "02838554269",
        description: "Cơ sở y tế gắn với đào tạo và nghiên cứu.",
        image: "https://picsum.photos/900/350?3",
        mapQuery: "University+Medical+Center+Ho+Chi+Minh",
        images: [
            "https://picsum.photos/400/300?31",
            "https://picsum.photos/400/300?32",
            "https://picsum.photos/400/300?33",
        ],
        doctors: [
            { id: 5, name: "PGS.TS Hoàng Văn E", specialty: "Ngoại khoa" },
            { id: 1, name: "TS.BS Nguyễn Văn A", specialty: "Tim mạch" },
        ],
    },
];

function ClinicDetail() {
    const { id } = useParams();
    const clinic = clinics.find((item) => item.id === Number(id));

    if (!clinic) {
        return (
            <>
                <Header />

                <section className="section">
                    <div className="container">
                        <h1>Không tìm thấy phòng khám</h1>
                        <Link to="/clinics" className="btn btn-primary">
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
                    <ClinicProfile clinic={clinic} />
                    <ClinicDoctors doctors={clinic.doctors} />
                    <ClinicImages images={clinic.images} />
                    <ClinicMap clinic={clinic} />
                </div>
            </section>

            <Footer />
        </>
    );
}

export default ClinicDetail;
