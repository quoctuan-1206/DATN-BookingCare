import Header from "../../components/common/Header/Header";
import Hero from "../../components/home/Hero/Hero";
import SpecialtySection from "../../components/home/SpecialtySection/SpecialtySection";
import ClinicalSection from "../../components/home/ClinicalSection/ClinicalSection";
import DoctorSection from "../../components/home/DoctorSection/DoctorSection";
import ClinicSection from "../../components/home/ClinicSection/ClinicSection";
import ArticleSection from "../../components/home/ArticleSection/ArticleSection";
import LatestComments from "../../components/home/LatestComments/LatestComments";
import Footer from "../../components/common/Footer/Footer";

function Home() {
  return (
    <>
      <Header />
      <Hero />
      <div className="home-layout">
        <div className="home-layout-main">
          <SpecialtySection />
          <ClinicalSection />
          <DoctorSection />
          <ClinicSection />
          <ArticleSection />
          <LatestComments />
        </div>
      </div>
      <Footer />
    </>
  );
}

export default Home;
