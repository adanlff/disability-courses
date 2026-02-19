import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import HeroSection from '@/components/home/hero-section';
import FeaturesSection from '@/components/home/features-section';
import StatsSection from '@/components/home/stats-section';
import TestimonialSection from '@/components/home/testimonial-section';
import FAQSection from '@/components/home/faq-section';
import CTASection from '@/components/home/cta-section';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <HeroSection />
        <FeaturesSection />
        <StatsSection />
        <TestimonialSection />
        <FAQSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}