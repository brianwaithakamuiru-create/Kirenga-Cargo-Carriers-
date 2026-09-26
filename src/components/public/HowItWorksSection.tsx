import React from 'react';
import { PackagePlus, QrCode, Truck, CheckCircle, ArrowRight } from 'lucide-react';

interface HowItWorksSectionProps {
  onNavigate: (view: string) => void;
}

export const HowItWorksSection: React.FC<HowItWorksSectionProps> = ({ onNavigate }) => {
  const steps = [
    {
      num: '01',
      title: 'Book & Register Consignment',
      desc: 'Book your delivery online in seconds, or hand over your cargo at any certified KIRENGA city terminal or partner depot across East Africa.',
      icon: <PackagePlus className="w-6 h-6 text-[#D4A017]" />,
      detail: 'Instant digital waybill generation',
    },
    {
      num: '02',
      title: 'Barcode Tag & Tamper-Proof Seal',
      desc: 'Your shipment is weighed, inspected, assigned a unique tracking number, and secured with an electronic tamper-evident seal before loading.',
      icon: <QrCode className="w-6 h-6 text-[#E6C76A]" />,
      detail: 'Chain of custody established',
    },
    {
      num: '03',
      title: 'Scheduled Express Corridor Dispatch',
      desc: 'Loaded onto the next scheduled KIRENGA luxury coach or linehaul carrier. Continuous satellite telemetry tracks its corridor progress 24/7.',
      icon: <Truck className="w-6 h-6 text-[#C2185B]" />,
      detail: 'Live checkpoint milestones',
    },
    {
      num: '04',
      title: 'Secure Handover & Digital POD',
      desc: 'Recipient receives an automated delivery arrival alert, verifies the security PIN, and completes digital Proof of Delivery at collection.',
      icon: <CheckCircle className="w-6 h-6 text-[#D4A017]" />,
      detail: 'Instant signed proof archived',
    },
  ];

  return (
    <section className="py-20 md:py-28 bg-[#4A0E18] text-[#F5E6D3] relative overflow-hidden border-t border-[#D4A017]/20">
      {/* Background Glows */}
      <div className="absolute top-1/2 left-10 w-96 h-96 bg-[#5A174F]/20 rounded-full blur-[160px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 text-xs font-couriers uppercase tracking-[0.25em] text-[#E6C76A] font-semibold mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D4A017]" />
            <span>Effortless Dispatch Workflow</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white font-['Montserrat'] tracking-tight">
            How KIRENGA <span className="text-[#D4A017]">Moves Your Cargo</span>
          </h2>
          <p className="mt-4 text-sm sm:text-base text-[#F5E6D3]/85 leading-relaxed font-light">
            Four transparent steps from your pickup request to secure destination delivery across national borders.
          </p>
        </div>

        {/* 4 Steps Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((st, idx) => (
            <div
              key={idx}
              className="p-7 rounded-2xl bg-gradient-to-br from-[#5C0A0A]/50 via-[#360810]/70 to-[#5A174F]/30 border border-[#D4A017]/25 hover:border-[#D4A017] hover:shadow-xl hover:shadow-[#D4A017]/10 transition-all duration-300 relative flex flex-col justify-between group backdrop-blur-sm"
            >
              <div>
                {/* Step Number & Icon */}
                <div className="flex items-center justify-between mb-5">
                  <div className="w-12 h-12 rounded-xl bg-[#360810] border border-[#D4A017]/40 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                    {st.icon}
                  </div>
                  <span className="text-2xl font-black font-couriers text-[#D4A017]/40 group-hover:text-[#D4A017] transition-colors">
                    {st.num}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-white font-['Montserrat'] mb-2.5 group-hover:text-[#E6C76A] transition-colors">
                  {st.title}
                </h3>

                <p className="text-xs sm:text-sm text-[#F5E6D3]/80 leading-relaxed font-light">
                  {st.desc}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-[#D4A017]/15 text-[11px] font-mono text-[#E6C76A] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#D4A017]" />
                <span>{st.detail}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Tracking CTA Strip */}
        <div className="mt-14 p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-[#360810] via-[#5C0A0A]/60 to-[#4A0E18] border border-[#D4A017]/35 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
          <div>
            <h4 className="text-base sm:text-lg font-bold text-white font-['Montserrat']">
              Already have a consignment en route?
            </h4>
            <p className="text-xs sm:text-sm text-[#F5E6D3]/75 mt-0.5 font-light">
              Enter your consignment code on our live corridor map to see instantaneous milestone timestamps.
            </p>
          </div>
          <button
            onClick={() => onNavigate('track')}
            className="px-6 py-3 rounded-xl bg-[#D4A017] hover:bg-[#E6C76A] text-[#4A0E18] font-bold text-xs uppercase tracking-wider whitespace-nowrap transition-colors shadow-md active:scale-95"
          >
            Track My Consignment
          </button>
        </div>
      </div>
    </section>
  );
};
