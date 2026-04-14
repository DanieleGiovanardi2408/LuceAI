import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import ScrollTelling from '@/components/ScrollTelling';
import Method from '@/components/Method';
import Services from '@/components/Services';
import WhyLuce from '@/components/WhyLuce';
import Metrics from '@/components/Metrics';
import FinalCTA from '@/components/FinalCTA';
import ContactForm from '@/components/ContactForm';
import Footer from '@/components/Footer';
import ScrollProgress from '@/components/ScrollProgress';

export default function Home() {
  return (
    <>
      <ScrollProgress />
      <Navbar />
      <main>
        <Hero />
        <ScrollTelling />
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
