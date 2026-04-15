import Navbar from '@/components/Navbar';
import LuceAIExperience from '@/components/LuceAIExperience';
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
        {/* 1400vh scroll-driven experience — covers entire site narrative */}
        <LuceAIExperience />
        {/* Contact form + footer after the experience */}
        <ContactForm />
      </main>
      <Footer />
    </>
  );
}
