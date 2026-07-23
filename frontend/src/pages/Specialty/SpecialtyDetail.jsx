import { useParams, Link } from "react-router-dom";

import Header from "../../components/common/Header/Header";
import Footer from "../../components/common/Footer/Footer";

import SpecialtyProfile from "../../components/specialty/SpecialtyProfile";
import SpecialtyDoctors from "../../components/specialty/SpecialtyDoctors";
import SpecialtyClinics from "../../components/specialty/SpecialtyClinics";
import { getSpecialtyDetail } from "../../data";

function SpecialtyDetail() {
    const { id } = useParams();
    const specialty = getSpecialtyDetail(id);

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
