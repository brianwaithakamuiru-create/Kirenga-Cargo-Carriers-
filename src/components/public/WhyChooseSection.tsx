import React from 'react';
import { ShieldCheck, Clock, Compass, Sparkles, Award, PhoneCall, ArrowRight, Lock } from 'lucide-react';

interface WhyChooseSectionProps {
  onNavigate: (view: string) => void;
}

export const WhyChooseSection: React.FC<WhyChooseSectionProps> = ({ onNavigate }) => {
  const reasons = [
    {
      icon: <Clock className="w-6 h-6 text-[#D4A017]" />,
      title: 'Punctual Timetable Guarantee',
      desc: 'Our luxury passenger and courier coaches depart on strict schedules daily across all major East African trunk corridors. Your cargo travels with timetable precision.',
    },
    {
      icon: <Lock className="w-6 h-6 text-[#E6C76A]" />,
      title: 'Electronic Tamper-Evident Seals',
      desc: 'Every parcel container and luggage hold is secured with authenticated digital seals and barcode verification from departure loading to recipient sign-off.',
    },
    {
      icon: <Compass className="w-6 h-6 text-[#C2185B]" />,
      title: 'Frictionless Border Clearance',
      desc: 'Accredited under the COMESA Single Customs Territory framework. We bypass intermediate border delays with pre-filed bonded manifests.',
    },
    {
      icon: <Sparkles className="w-6 h-6 text-[#D4A017]" />,
      title: 'Luxury Fleet & Air-Ride Comfort',
      desc: 'Our modern coaches and vans feature advanced air-suspension chassis, ensuring delicate electronics, pharmaceuticals, and luxury items arrive in pristine condition.',
    },
    {
      icon: <ShieldCheck className="w-6 h-6 text-[#E6C76A]" />,
      title: '100% Comprehensive Cargo Insurance',
      desc: 'Peace of mind on every kilometer. All consignments are backed by comprehensive transit insurance policies against transit road perils.',
    },
    {
      icon: <PhoneCall className="w-6 h-6 text-[#C2185B]" />,
      title: '24/7 Dedicated Operations Desk',
      desc: 'Direct access to regional dispatch controllers and multilingual customer support across Kenya, Uganda, Tanzania, and Rwanda via WhatsApp and phone.',
    },
  ];

  return (
    <section className="py-20 md:py-28 bg-[#360810] text-[#F5E6D3] relative overflow-hidden border-t border-[#D4A017]/20">
      {/* Subtle luxury glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-[#D4A017]/5 rounded-full blur-[150px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 text-xs font-couriers uppercase tracking-[0.25em] text-[#E6C76A] font-semibold mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D4A017]" />
            <span>The KIRENGA Standard</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white font-['Montserrat'] tracking-tight">
            Why East Africa Entrusts <span className="text-[#D4A017]">KIRENGA</span>
          </h2>
          <p className="mt-4 text-sm sm:text-base text-[#F5E6D3]/85 leading-relaxed font-light">
            We are redefining regional road transit by infusing the punctuality and elegance of premium coach services with industrial-strength logistics security.
          </p>
        </div>

        {/* 6 Grid Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {reasons.map((r, idx) => (
            <div
              key={idx}
              className="p-7 rounded-2xl bg-gradient-to-br from-[#4A0E18]/70 via-[#5C0A0A]/40 to-[#5A174F]/30 border border-[#D4A017]/25 hover:border-[#D4A017] hover:shadow-xl hover:shadow-[#D4A017]/10 transition-all duration-300 flex flex-col justify-between group backdrop-blur-sm"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-[#360810] border border-[#D4A017]/40 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform shadow-md">
                  {r.icon}
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white font-['Montserrat'] mb-2.5 group-hover:text-[#E6C76A] transition-colors">
                  {r.title}
                </h3>
                <p className="text-xs sm:text-sm text-[#F5E6D3]/80 leading-relaxed font-light">
                  {r.desc}
                </p>
              </div>

              <div className="mt-5 pt-4 border-t border-[#D4A017]/15 flex items-center gap-1.5 text-xs text-[#E6C76A] font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-[#D4A017]" />
                <span>Verified Brand Standard</span>
              </div>
            </div>
          ))}
        </div>

        {/* CTA Bar */}
        <div className="mt-14 text-center">
          <button
            onClick={() => onNavigate('book')}
            className="px-8 py-3.5 rounded-xl bg-[#D4A017] hover:bg-[#E6C76A] text-[#4A0E18] font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-[#D4A017]/25 active:scale-95 inline-flex items-center gap-2"
          >
            <span>Book Your Consignment Now</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
};
