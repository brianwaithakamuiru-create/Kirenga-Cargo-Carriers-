import React from 'react';
import { MapPin, Globe2, ArrowRight, ShieldCheck, CheckCircle2, Navigation } from 'lucide-react';

interface DestinationsSectionProps {
  onNavigate: (view: string) => void;
}

export const DestinationsSection: React.FC<DestinationsSectionProps> = ({ onNavigate }) => {
  const destinations = [
    {
      country: 'Kenya',
      code: 'KE',
      hubs: 'Mombasa Port • Nairobi ICD • Nakuru • Eldoret • Malaba Border',
      corridor: 'Northern Transit Gateway',
      transitTime: '24 - 48 Hours Express',
      description: 'Primary maritime ocean gate with automated container terminal clearance and high-capacity dispatch routes.',
      activeRoutes: 18,
    },
    {
      country: 'Uganda',
      code: 'UG',
      hubs: 'Kampala • Jinja • Entebbe Airport • Tororo • Busia • Malaba',
      corridor: 'Central Northern Artery',
      transitTime: '2 - 3 Days Transit',
      description: 'Major transshipment hub connecting Northern Corridor maritime flows to Western Uganda and DR Congo.',
      activeRoutes: 14,
    },
    {
      country: 'Tanzania',
      code: 'TZ',
      hubs: 'Dar es Salaam Port • Arusha • Moshi • Dodoma • Mwanza',
      corridor: 'Central Freight Corridor',
      transitTime: '2 - 4 Days Transit',
      description: 'Direct maritime corridor serving southern Lake Victoria distribution and Great Lakes inland border posts.',
      activeRoutes: 12,
    },
    {
      country: 'Rwanda',
      code: 'RW',
      hubs: 'Kigali Free Trade Zone • Gatuna / Katuna • Rusumo • Rubavu',
      corridor: 'Kigali Intermodal Artery',
      transitTime: '3 - 5 Days from Coast',
      description: 'High-efficiency customs border posts with electronic cargo tracking seal compatibility and single territory clearance.',
      activeRoutes: 10,
    },
    {
      country: 'Democratic Republic of Congo',
      code: 'CD',
      hubs: 'Goma • Bukavu • Beni • Bunia • Lubumbashi Corridor',
      corridor: 'Eastern DRC Mining & Commercial',
      transitTime: '5 - 8 Days',
      description: 'Specialized heavy equipment, mining logistics, and essential goods transport with secured convoy tracking.',
      activeRoutes: 8,
    },
    {
      country: 'South Sudan',
      code: 'SS',
      hubs: 'Nimule Border Post • Juba Central Distribution Hub',
      corridor: 'Upper Nile Cross-Border',
      transitTime: '4 - 6 Days',
      description: 'Essential goods, construction materials, and humanitarian relief freight with verified border clearance.',
      activeRoutes: 6,
    },
  ];

  return (
    <section className="py-20 md:py-28 bg-[#360810] text-[#F5E6D3] relative overflow-hidden border-t border-[#D4A017]/20">
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#4A0E18] rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#5A174F]/25 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 text-xs font-couriers uppercase tracking-[0.25em] text-[#E6C76A] font-semibold mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D4A017]" />
              <span>Regional Coverage & Connectivity</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white font-['Montserrat'] tracking-tight">
              Cross-Border Corridors <span className="text-[#D4A017]">Across East Africa</span>
            </h2>
          </div>
          <p className="text-sm sm:text-base text-[#F5E6D3]/85 max-w-md leading-relaxed font-light">
            Scheduled coach courier departures and heavy freight convoys linking Indian Ocean sea hubs to Great Lakes commercial metropolises.
          </p>
        </div>

        {/* Coverage Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {destinations.map((dest, idx) => (
            <div
              key={idx}
              className="p-7 rounded-2xl bg-gradient-to-br from-[#4A0E18]/80 via-[#5C0A0A]/40 to-[#5A174F]/40 border border-[#D4A017]/25 hover:border-[#D4A017] hover:shadow-2xl hover:shadow-[#D4A017]/10 transition-all duration-300 relative overflow-hidden flex flex-col justify-between group backdrop-blur-sm"
            >
              {/* Country Code Watermark */}
              <div className="absolute -top-3 -right-2 text-6xl font-black text-[#D4A017]/10 select-none font-mono pointer-events-none group-hover:text-[#D4A017]/20 transition-colors">
                {dest.code}
              </div>

              <div>
                {/* Header */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-[#360810] border border-[#D4A017]/40 flex items-center justify-center text-[#E6C76A] font-black text-xs font-mono shadow-md">
                    {dest.code}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white font-['Montserrat'] group-hover:text-[#E6C76A] transition-colors">
                      {dest.country}
                    </h3>
                    <div className="text-[11px] font-couriers uppercase tracking-wider text-[#D4A017] font-semibold">
                      {dest.corridor}
                    </div>
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs sm:text-sm text-[#F5E6D3]/80 leading-relaxed font-light mb-5">
                  {dest.description}
                </p>

                {/* Key Hubs */}
                <div className="p-3 rounded-xl bg-[#360810]/70 border border-[#D4A017]/20 mb-5 text-xs text-[#F5E6D3]/75">
                  <span className="text-[#E6C76A] font-semibold block mb-1">Key Corridors & Hubs:</span>
                  <div className="leading-relaxed font-light">{dest.hubs}</div>
                </div>
              </div>

              {/* Transit Time & Route Status */}
              <div className="pt-4 border-t border-[#D4A017]/20 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-[#E6C76A] font-mono">
                  <Navigation className="w-3.5 h-3.5 text-[#D4A017]" />
                  <span>{dest.transitTime}</span>
                </div>
                <button
                  onClick={() => onNavigate('book')}
                  className="text-white hover:text-[#D4A017] font-semibold flex items-center gap-1 text-xs transition-colors"
                >
                  <span>Dispatch</span>
                  <ArrowRight className="w-3 h-3 text-[#D4A017]" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Customs & COMESA Seal Strip */}
        <div className="mt-12 p-6 rounded-2xl bg-[#4A0E18]/70 border border-[#D4A017]/30 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-7 h-7 text-[#D4A017] shrink-0" />
            <div className="text-xs sm:text-sm text-[#F5E6D3]">
              <span className="text-white font-bold block">COMESA Single Customs Territory Accredited</span>
              Seamless cross-border clearance without offloading at borders. Certified electronic tamper seals applied at origin.
            </div>
          </div>
          <button
            onClick={() => onNavigate('track')}
            className="px-5 py-2.5 rounded-xl bg-[#D4A017] text-[#4A0E18] text-xs font-bold uppercase tracking-wider whitespace-nowrap hover:bg-[#E6C76A] transition-colors"
          >
            Track Active Corridor
          </button>
        </div>
      </div>
    </section>
  );
};

