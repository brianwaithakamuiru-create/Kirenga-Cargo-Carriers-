import React from 'react';
import { Target, Award, ShieldCheck, Compass, CheckCircle2, Building2, Truck, ArrowRight } from 'lucide-react';
import hubImage from '../../assets/images/kirenga_hub_logistics_1790368896857.jpg';

export const AboutSection: React.FC = () => {
  return (
    <section className="py-20 md:py-28 bg-gradient-to-b from-[#4A0E18] via-[#360810] to-[#4A0E18] text-[#F5E6D3] relative overflow-hidden border-t border-[#D4A017]/20">
      {/* Subtle Gold Background Glows */}
      <div className="absolute top-1/2 left-0 w-96 h-96 bg-[#D4A017]/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#C2185B]/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 text-xs font-couriers uppercase tracking-[0.25em] text-[#E6C76A] font-semibold mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D4A017]" />
              <span>About KIRENGA CARGO COURIERS</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white font-['Montserrat'] tracking-tight">
              A New Era of <span className="text-[#D4A017]">Modern African Logistics</span>
            </h2>
          </div>
          <p className="text-sm sm:text-base text-[#F5E6D3]/85 max-w-md leading-relaxed font-light">
            Rooted in the spirit of African commerce and connectivity. We unite five sovereign nations with rapid parcel dispatches, luxury express coaches, and secure cross-border supply chains.
          </p>
        </div>

        {/* Narrative & Cinematic Image Showcase */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center mb-16">
          {/* Story & Values */}
          <div className="lg:col-span-6 space-y-6">
            <div className="p-8 rounded-2xl bg-[#5C0A0A]/40 border border-[#D4A017]/25 backdrop-blur-sm shadow-xl">
              <h3 className="text-xl sm:text-2xl font-bold text-white font-['Montserrat'] mb-3 flex items-center gap-2">
                <span className="text-[#D4A017]">Trust. Precision.</span> Speed.
              </h3>
              <p className="text-sm text-[#F5E6D3]/90 leading-relaxed font-light mb-4">
                Founded to bridge the vital commercial arteries between the Indian Ocean coast and Central Africa, KIRENGA CARGO COURIERS pairs state-of-the-art long-distance express coaches with sealed heavy cargo transit.
              </p>
              <p className="text-sm text-[#F5E6D3]/80 leading-relaxed font-light">
                Whether transporting time-critical medical supplies from Nairobi to Kigali, high-value commercial tech parcels to Kampala, or heavy machinery parts across the Tanzania-DRC border, our dispatches maintain verified chain-of-custody and real-time electronic milestone tracking.
              </p>
            </div>

            {/* Strategic Pillars */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-5 rounded-xl bg-[#5A174F]/30 border border-[#D4A017]/20 flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#360810] border border-[#D4A017]/40 flex items-center justify-center text-[#D4A017] shrink-0">
                  <Target className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white font-['Montserrat']">Our Mission</h4>
                  <p className="text-xs text-[#F5E6D3]/75 mt-1 leading-normal">
                    Deliver cross-border consignments faster, safer, and with unprecedented transparency across East Africa.
                  </p>
                </div>
              </div>

              <div className="p-5 rounded-xl bg-[#5A174F]/30 border border-[#D4A017]/20 flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#360810] border border-[#D4A017]/40 flex items-center justify-center text-[#E6C76A] shrink-0">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white font-['Montserrat']">Our Vision</h4>
                  <p className="text-xs text-[#F5E6D3]/75 mt-1 leading-normal">
                    Stand as the most prestigious and dependable express logistics and transit institution in Africa.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Cinematic Hub Visual */}
          <div className="lg:col-span-6">
            <div className="relative rounded-3xl overflow-hidden border-2 border-[#D4A017]/35 shadow-2xl group">
              <img
                src={hubImage}
                alt="KIRENGA Logistics Terminal & Transit Hub"
                referrerPolicy="no-referrer"
                className="w-full h-[420px] object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#360810] via-transparent to-black/30" />
              <div className="absolute bottom-6 left-6 right-6 p-4 rounded-xl bg-[#360810]/90 border border-[#D4A017]/30 backdrop-blur-md">
                <div className="text-xs font-couriers uppercase tracking-widest text-[#E6C76A] font-bold">
                  Centralized Transit Hubs
                </div>
                <div className="text-sm font-semibold text-white mt-1">
                  Connecting Mombasa • Nairobi • Kampala • Kigali • Goma • Dar es Salaam
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Brand Promises Badges */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-10 border-t border-[#D4A017]/20">
          <div className="p-6 rounded-2xl bg-[#5C0A0A]/35 border border-[#D4A017]/20 flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#360810] border border-[#D4A017]/40 flex items-center justify-center text-[#D4A017] shrink-0 shadow-md">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-bold text-white font-['Montserrat']">
                Complete Safety Protocol
              </h4>
              <p className="text-xs text-[#F5E6D3]/75 mt-1.5 leading-relaxed">
                Zero tolerance for transit negligence. Complete compliance with regional axle-load laws, tamper-proof electronic seals, and pre-departure inspections.
              </p>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-[#5C0A0A]/35 border border-[#D4A017]/20 flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#360810] border border-[#D4A017]/40 flex items-center justify-center text-[#C2185B] shrink-0 shadow-md">
              <Compass className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-bold text-white font-['Montserrat']">
                Regional Connectivity
              </h4>
              <p className="text-xs text-[#F5E6D3]/75 mt-1.5 leading-relaxed">
                Seamless COMESA customs clearance, dedicated border escort support, and expedited transit times through Malaba, Busia, Gatuna, and Rusumo.
              </p>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-[#5C0A0A]/35 border border-[#D4A017]/20 flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#360810] border border-[#D4A017]/40 flex items-center justify-center text-[#E6C76A] shrink-0 shadow-md">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-bold text-white font-['Montserrat']">
                Luxury Modern Fleet
              </h4>
              <p className="text-xs text-[#F5E6D3]/75 mt-1.5 leading-relaxed">
                Pristine, state-of-the-art vehicles in KIRENGA's signature deep burgundy and gold livery, fitted with satellite telemetry and climate-controlled holds.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

