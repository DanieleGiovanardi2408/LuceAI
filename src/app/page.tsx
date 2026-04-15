import Navbar from '@/components/Navbar';
import FullpageSlider from '@/components/FullpageSlider';
import Method from '@/components/Method';
import Services from '@/components/Services';
import WhyLuce from '@/components/WhyLuce';
import Metrics from '@/components/Metrics';
import FinalCTA from '@/components/FinalCTA';
import ContactForm from '@/components/ContactForm';
import Footer from '@/components/Footer';
import ScrollProgress from '@/components/ScrollProgress';
import Cursor from '@/components/Cursor';

export default function Home() {
  return (
    <>
      <Cursor />
      <ScrollProgress />
      <Navbar />
      <main>
        <FullpageSlider />
        <Method />
        <Services />
        <WhyLuce />
        <Metrics />
        <FinalCTA />
        <ContactForm />
      </main>
      <Footer />
    </>
  );
}
