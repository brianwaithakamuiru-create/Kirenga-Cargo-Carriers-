import React from 'react';
import { Quote, Star, Building2, MapPin } from 'lucide-react';

export const TestimonialsSection: React.FC = () => {
  const testimonials = [
    {
      name: 'Amina Mwangi',
      role: 'Head of Regional Supply Chain',
      company: 'Equator Pharmaceuticals',
      corridor: 'Nairobi ↔ Kampala',
      quote:
        'Transporting temperature-sensitive medical supplies across borders requires zero failure tolerance. KIRENGA luxury coach express service has maintained a 100% on-time record for our critical consignments over the past eighteen months.',
      stars: 5,
    },
    {
      name: 'Jean-Paul Habimana',
      role: 'Managing Director',
      company: 'Great Lakes Electronics & Tech',
      corridor: 'Mombasa Port → Kigali Free Zone',
      quote:
        'Clearing containers from Mombasa Port all the way to Kigali used to take over 10 days with constant blind spots. With KIRENGA electronic seal tracking and dedicated linehauls, our cargo reaches Kigali in under 4 days with verifiable chain-of-custody.',
      stars: 5,
    },
    {
      name: 'Emmanuel Kasongo',
      role: 'Heavy Machinery Fleet Director',
      company: 'Kivu Industrial & Mining Supplies',
      corridor: 'Dar es Salaam ↔ Goma / Eastern DRC',
      quote:
        'Moving 45-ton heavy plant equipment along the Central Corridor demands immense mechanical reliability and route experience. KIRENGA drivers and multi-axle lowbeds handled the route flawlessly with complete convoy insurance.',
      stars: 5,
    },
    {
      name: 'Zainab Rashid',
      role: 'Commercial Trade Coordinator',
      company: 'Swahili Agro-Trading Ltd',
      corridor: 'Dar es Salaam ↔ Nairobi',
      quote:
        'The express coach parcel service is exceptional. We dispatch perishable agricultural samples and customs trade documents daily, and our clients in Nairobi receive them the following morning at the city terminal.',
      stars: 5,
    },
  ];

  return (
    <section className="py-20 md:py-28 bg-[#360810] text-[#F5E6D3] relative overflow-hidden border-t border-[#D4A017]/20">
      {/* Background Glows */}
      <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-[#4A0E18] rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-80 h-80 bg-[#D4A017]/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 text-xs font-couriers uppercase tracking-[0.25em] text-[#E6C76A] font-semibold mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D4A017]" />
            <span>Trusted By Regional Industry Leaders</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white font-['Montserrat'] tracking-tight">
            Client Voices Across <span className="text-[#D4A017]">The East African Network</span>
          </h2>
          <p className="mt-4 text-sm sm:text-base text-[#F5E6D3]/85 leading-relaxed font-light">
            Hear from multinational manufacturers, importers, and regional trading houses who rely on KIRENGA daily.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {testimonials.map((t, idx) => (
            <div
              key={idx}
              className="p-8 rounded-3xl bg-gradient-to-br from-[#4A0E18]/70 via-[#5C0A0A]/40 to-[#5A174F]/30 border border-[#D4A017]/25 hover:border-[#D4A017] hover:shadow-xl hover:shadow-[#D4A017]/10 transition-all duration-300 flex flex-col justify-between group backdrop-blur-sm relative"
            >
              <div>
                {/* Top: Quote Icon & Stars */}
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-[#360810] border border-[#D4A017]/30 flex items-center justify-center text-[#D4A017]">
                    <Quote className="w-5 h-5 text-[#E6C76A]" />
                  </div>
                  <div className="flex items-center gap-1">
                    {[...Array(t.stars)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-[#D4A017] text-[#D4A017]" />
                    ))}
                  </div>
                </div>

                {/* Quote Text */}
                <p className="text-sm sm:text-base text-[#F5E6D3]/90 italic font-light leading-relaxed mb-6">
                  "{t.quote}"
                </p>
              </div>

              {/* Author & Corridor */}
              <div className="pt-4 border-t border-[#D4A017]/20 flex items-center justify-between">
                <div>
                  <h4 className="text-base font-bold text-white font-['Montserrat']">
                    {t.name}
                  </h4>
                  <div className="text-xs text-[#E6C76A] font-medium">
                    {t.role} · <span className="text-[#F5E6D3]/75">{t.company}</span>
                  </div>
                </div>
                <div className="hidden sm:flex items-center gap-1 text-[11px] font-mono text-[#D4A017] bg-[#360810] px-2.5 py-1 rounded-lg border border-[#D4A017]/25">
                  <MapPin className="w-3 h-3 text-[#E6C76A]" />
                  <span>{t.corridor}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
