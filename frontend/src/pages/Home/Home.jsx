import Header from "../../components/common/Header/Header";
import Hero from "../../components/home/Hero/Hero";
import QuickServices from "../../components/home/QuickServices/QuickServices";
import SpecialtySection from "../../components/home/SpecialtySection/SpecialtySection";
import DoctorSection from "../../components/home/DoctorSection/DoctorSection";
import ClinicSection from "../../components/home/ClinicSection/ClinicSection";
import HandbookSection from "../../components/home/HandbookSection/HandbookSection";
import Footer from "../../components/common/Footer/Footer";
function Home() {
  return (
    <>
      <Header />
      <Hero />
      <QuickServices />
      <SpecialtySection />
      <DoctorSection />
      <ClinicSection />
      <HandbookSection />
      <Footer />
    </>
  );
}

export default Home;
