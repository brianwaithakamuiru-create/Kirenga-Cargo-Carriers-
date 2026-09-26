import React from 'react';
import { Hero } from './Hero';
import { TrackingBox } from './TrackingBox';
import { ServicesSection } from './ServicesSection';
import { DestinationsSection } from './DestinationsSection';
import { FleetSection } from './FleetSection';
import { AboutSection } from './AboutSection';
import { ContactSection } from './ContactSection';
import { WhyChooseSection } from './WhyChooseSection';
import { HowItWorksSection } from './HowItWorksSection';
import { TestimonialsSection } from './TestimonialsSection';

interface PublicHomeProps {
  onNavigate: (view: string) => void;
}

export const PublicHome: React.FC<PublicHomeProps> = ({ onNavigate }) => (
  <div>
    {/* 1. Hero Section */}
    <Hero onNavigate={onNavigate} />

    {/* 2. About KIRENGA */}
    <AboutSection />

    {/* 3. Our Services */}
    <ServicesSection onNavigate={onNavigate} />

    {/* 4. Cargo Tracking */}
    <section id="tracking" className="py-20 md:py-28 bg-[#360810] border-t border-[#D4A017]/20 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 text-xs font-couriers uppercase tracking-[0.25em] text-[#E6C76A] font-semibold mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D4A017]" />
            <span>Centralized Transit Telemetry</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white font-['Montserrat'] tracking-tight">
            Cargo <span className="text-[#D4A017]">Tracking System</span>
          </h2>
          <p className="text-sm text-[#F5E6D3]/80 mt-2 font-light">
            Real-time status updates and electronic corridor milestone verification across East Africa.
          </p>
        </div>
        <TrackingBox />
      </div>
    </section>

    {/* 5. Destinations / East Africa coverage */}
    <DestinationsSection onNavigate={onNavigate} />

    {/* 6. Our Fleet */}
    <FleetSection />

    {/* 7. Why Choose KIRENGA */}
    <WhyChooseSection onNavigate={onNavigate} />

    {/* 8. How It Works */}
    <HowItWorksSection onNavigate={onNavigate} />

    {/* 9. Customer Testimonials */}
    <TestimonialsSection />

    {/* 10. Contact / Booking Section */}
    <ContactSection onNavigate={onNavigate} />
  </div>
);
