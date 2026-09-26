import React from 'react';
import { Truck, ShieldCheck, Gauge, CheckCircle2, Wrench, Sparkles, Navigation, Lock } from 'lucide-react';
import fleetCoachImg from '../../assets/images/kirenga_fleet_coach_1790368870850.jpg';
import expressVanImg from '../../assets/images/kirenga_express_van_1790368881014.jpg';

export const FleetSection: React.FC = () => {
  const fleetCategories = [
    {
      type: 'KIRENGA Luxury Coach Cargo Express',
      capacity: 'Up to 5 Tons Dedicated Luggage Hold',
      specs: 'Reinforced underfloor luggage holds, climate control, GPS telemetry, passenger-line express scheduling.',
      suitableFor: 'Urgent parcels, commercial retail inventory, e-commerce orders, fresh farm produce, medical supplies.',
      tag: 'Express Coach Fleet',
      highlight: 'Daily Scheduled Runs',
    },
    {
      type: 'Rapid Regional Express Couriers',
      capacity: '2.5 - 5.0 Ton Quick Dispatch',
      specs: 'High-speed intercity transit, automated tailgate lifts, internal racking systems, real-time satellite beacon.',
      suitableFor: 'High-value tech electronics, diplomatic pouches, priority banking parcels, last-mile hub feeder.',
      tag: 'Urgent Courier Fleet',
      highlight: 'Same-Day Intercity',
    },
    {
      type: 'Heavy Prime Movers & Semi-Trailers (6x4)',
      capacity: 'Up to 40 Ton Gross Payload',
      specs: 'Euro 5 high-torque engines, twin-steer configurations, multi-twistlock decks for 1x40ft or 2x20ft maritime containers.',
      suitableFor: 'Mombasa & Dar es Salaam port clearing, factory raw materials, palletized dry goods.',
      tag: 'Heavy Haulage',
      highlight: 'Maritime Corridor',
    },
    {
      type: 'Multi-Axle Specialized Lowbeds',
      capacity: 'Up to 60 Ton Gross Payload',
      specs: 'Hydraulic detachable goosenecks, rear steerable axles, wide-load escort certified, heavy tie-down anchors.',
      suitableFor: 'Mining excavators, industrial generators, civil construction boilers, structural steel beams.',
      tag: 'Specialized Heavy',
      highlight: 'Engineered Transport',
    },
  ];

  return (
    <section className="py-20 md:py-28 bg-gradient-to-b from-[#4A0E18] via-[#360810] to-[#4A0E18] text-[#F5E6D3] relative overflow-hidden border-t border-[#D4A017]/20">
      {/* Background Glows */}
      <div className="absolute top-1/2 right-10 w-96 h-96 bg-[#D4A017]/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-96 h-96 bg-[#C2185B]/10 rounded-full blur-[150px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 text-xs font-couriers uppercase tracking-[0.25em] text-[#E6C76A] font-semibold mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D4A017]" />
              <span>Engineered For East African Corridors</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white font-['Montserrat'] tracking-tight">
              The KIRENGA Fleet. <span className="text-[#D4A017]">Luxury & Power.</span>
            </h2>
          </div>
          <p className="text-sm sm:text-base text-[#F5E6D3]/85 max-w-md leading-relaxed font-light">
            Each vehicle embodies our distinctive deep burgundy, vibrant magenta, and luxury gold livery. Maintained under strict telemetry inspection and regional safety standards.
          </p>
        </div>

        {/* Cinematic Dual Fleet Showcase */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          {/* Card 1: Express Coach */}
          <div className="rounded-3xl overflow-hidden border-2 border-[#D4A017]/35 bg-[#360810]/90 shadow-2xl group flex flex-col justify-between">
            <div className="relative h-72 sm:h-80 overflow-hidden">
              <img
                src={fleetCoachImg}
                alt="KIRENGA Luxury Coach Bus & Parcel Delivery"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#360810] via-transparent to-transparent" />
              <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-[#D4A017] text-[#4A0E18] text-xs font-black uppercase tracking-wider shadow-md">
                Flagship Express Coach
              </div>
            </div>
            <div className="p-7">
              <div className="text-xs font-couriers uppercase tracking-widest text-[#E6C76A] font-semibold mb-1">
                High-Speed Intercity Network
              </div>
              <h3 className="text-2xl font-bold text-white font-['Montserrat'] mb-2">
                Luxury Coach Courier Service
              </h3>
              <p className="text-xs sm:text-sm text-[#F5E6D3]/85 leading-relaxed font-light mb-4">
                Combining high-frequency passenger coach timetables with dedicated, sealed lower cargo compartments. Guarantees same-day and next-morning parcel handovers between Nairobi, Kampala, Kigali, and Dar es Salaam.
              </p>
              <div className="flex flex-wrap gap-2 text-[11px] font-mono">
                <span className="px-2.5 py-1 rounded-lg bg-[#4A0E18] border border-[#D4A017]/30 text-[#E6C76A]">
                  Air-Suspension Ride
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-[#4A0E18] border border-[#D4A017]/30 text-[#E6C76A]">
                  GPS Monitored Holds
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-[#4A0E18] border border-[#D4A017]/30 text-[#E6C76A]">
                  Digital Barcode Check-in
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Express Van */}
          <div className="rounded-3xl overflow-hidden border-2 border-[#D4A017]/35 bg-[#360810]/90 shadow-2xl group flex flex-col justify-between">
            <div className="relative h-72 sm:h-80 overflow-hidden">
              <img
                src={expressVanImg}
                alt="KIRENGA Regional Express Courier Delivery Van"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#360810] via-transparent to-transparent" />
              <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-[#5A174F] border border-[#D4A017]/40 text-[#E6C76A] text-xs font-black uppercase tracking-wider shadow-md">
                Regional Rapid Sprinter
              </div>
            </div>
            <div className="p-7">
              <div className="text-xs font-couriers uppercase tracking-widest text-[#E6C76A] font-semibold mb-1">
                Fast Door-to-Door Dispatch
              </div>
              <h3 className="text-2xl font-bold text-white font-['Montserrat'] mb-2">
                Rapid Express Courier Fleet
              </h3>
              <p className="text-xs sm:text-sm text-[#F5E6D3]/85 leading-relaxed font-light mb-4">
                Engineered for rapid regional connectivity and urgent consignments. Custom-fitted with electronic cargo locks, thermal insulation, and direct driver-to-command dispatch channels.
              </p>
              <div className="flex flex-wrap gap-2 text-[11px] font-mono">
                <span className="px-2.5 py-1 rounded-lg bg-[#4A0E18] border border-[#D4A017]/30 text-[#E6C76A]">
                  Rapid Corridor Feeder
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-[#4A0E18] border border-[#D4A017]/30 text-[#E6C76A]">
                  Tamper-Evident Seals
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-[#4A0E18] border border-[#D4A017]/30 text-[#E6C76A]">
                  24/7 Mobile Command
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Fleet Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {fleetCategories.map((f, idx) => (
            <div
              key={idx}
              className="bg-gradient-to-br from-[#5C0A0A]/40 via-[#4A0E18]/60 to-[#5A174F]/30 border border-[#D4A017]/25 rounded-2xl p-7 relative overflow-hidden flex flex-col justify-between group hover:border-[#E6C76A] transition-all backdrop-blur-sm"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[11px] font-couriers uppercase tracking-widest text-[#E6C76A] font-bold">
                    {f.tag}
                  </span>
                  <span className="px-3 py-1 rounded-full bg-[#360810] border border-[#D4A017]/40 text-[#D4A017] text-xs font-bold font-mono">
                    {f.capacity}
                  </span>
                </div>

                <h4 className="text-xl font-bold text-white font-['Montserrat'] mb-2 group-hover:text-[#E6C76A] transition-colors">
                  {f.type}
                </h4>

                <p className="text-xs sm:text-sm text-[#F5E6D3]/85 mb-4 leading-relaxed font-light">
                  <span className="text-[#E6C76A] font-semibold">Specs: </span>
                  {f.specs}
                </p>
              </div>

              <div className="pt-4 border-t border-[#D4A017]/20 text-xs text-[#F5E6D3]/80">
                <span className="text-[#D4A017] font-semibold">Recommended Use: </span>
                {f.suitableFor}
              </div>
            </div>
          ))}
        </div>

        {/* Fleet Compliance & Safety Bar */}
        <div className="mt-12 p-6 sm:p-7 rounded-2xl bg-[#360810] border-2 border-[#D4A017]/35 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#4A0E18] border border-[#D4A017]/40 flex items-center justify-center text-[#D4A017] shrink-0 shadow-lg">
              <ShieldCheck className="w-6 h-6 text-[#E6C76A]" />
            </div>
            <div>
              <h5 className="text-base font-bold text-white font-['Montserrat']">
                Mandatory Pre-Trip Vehicle Diagnostic
              </h5>
              <p className="text-xs text-[#F5E6D3]/80 mt-0.5 font-light">
                Every bus, van, and prime mover undergoes pre-departure digital mechanical auditing before clearance to enter transit corridors.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="px-3.5 py-1.5 rounded-lg bg-[#4A0E18] border border-[#D4A017]/30 text-xs font-mono text-[#E6C76A] flex items-center gap-1.5">
              <Gauge className="w-4 h-4 text-[#D4A017]" />
              <span>EAC Axle-Load Certified</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
