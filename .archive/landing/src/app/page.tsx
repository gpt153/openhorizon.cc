import Hero from '@/components/Hero';
import About from '@/components/About';
import Features from '@/components/Features';
import NewService from '@/components/NewService';
import WhyChooseUs from '@/components/WhyChooseUs';
import OurApproach from '@/components/OurApproach';
import CTA from '@/components/CTA';
import Footer from '@/components/Footer';

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <Hero />
      <About />
      <Features />
      <NewService />
      <WhyChooseUs />
      <OurApproach />
      <CTA />
      <Footer />
    </div>
  );
}
