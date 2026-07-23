import Header from "../common/Header/Header";
import Footer from "../common/Footer/Footer";
import PatientSidebar from "./PatientSidebar";

function PatientLayout({ children }) {
    return (
        <>
            <Header />

            <section className="section patient-section">
                <div className="container patient-page">
                    <div className="patient-layout">
                        <PatientSidebar />
                        <main className="patient-content">{children}</main>
                    </div>
                </div>
            </section>

            <Footer />
        </>
    );
}

export default PatientLayout;
