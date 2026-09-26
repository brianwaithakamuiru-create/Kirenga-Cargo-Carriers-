import React, { useState } from 'react';
import { CompanyLogo } from '../common/CompanyLogo';
import { AnimatedTruck } from '../common/AnimatedTruck';
import { useAnimations } from '../../context/AnimationContext';
import { useBranding } from '../../context/BrandingContext';
import { Search, ArrowRight, ShieldCheck, Clock, MapPin, Package, CheckCircle2, ChevronRight, Globe2 } from 'lucide-react';

interface HeroProps {
  onNavigate: (view: string) => void;
}

export const Hero: React.FC<HeroProps> = ({ onNavigate }) => {
  const [trackingNumber, setTrackingNumber] = useState('');
  const { heroAnimationEnabled, reducedMotion } = useAnimations();
  const { companyName, tagline } = useBranding();

  const handleQuickTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (trackingNumber.trim()) {
      window.location.hash = `/track?code=${encodeURIComponent(trackingNumber.trim())}`;
      onNavigate('track');
    } else {
      onNavigate('track');
    }
  };

  const shouldAnimate = heroAnimationEnabled && !reducedMotion;

  return (
    <section className="relative min-h-[92vh] flex items-center justify-center overflow-hidden bg-[#060B18] text-[#F8FAFC]">
      {/* 1. DARK LOGISTICS BACKGROUND & 2. ANIMATED WORLD/MAP GRID */}
      <div className="absolute inset-0 pointer-events-none z-0">
        {/* Deep navy radial gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0B1530]/70 via-[#060B18] to-[#040814]" />
        
        {/* Subtle grid pattern */}
        <div
          className={`absolute inset-0 opacity-[0.14] bg-[radial-gradient(#38BDF8_1px,transparent_1px)] [background-size:32px_32px] ${
            shouldAnimate ? 'animate-pulse-glow' : ''
          }`}
        />

        {/* 3. CARGO ROUTE LINES & 4. GLOWING ROUTE POINTS (Interactive Vector Overlay) */}
        <svg
          viewBox="0 0 1200 600"
          className="w-full h-full object-cover absolute inset-0 opacity-40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="routeGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0284C7" stopOpacity="0.2" />
              <stop offset="50%" stopColor="#06B6D4" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.3" />
            </linearGradient>
            <linearGradient id="routeGradient2" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.1" />
              <stop offset="50%" stopColor="#0EA5E9" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#10B981" stopOpacity="0.4" />
            </linearGradient>
          </defs>

          {/* East Africa Corridor Haulage Arcs */}
          {/* Mombasa -> Nairobi -> Kampala -> Kigali */}
          <path
            d="M 980,480 Q 750,380 580,310 T 380,240 T 260,260"
            stroke="url(#routeGradient1)"
            strokeWidth="2.5"
            strokeDasharray={shouldAnimate ? '6 6' : 'none'}
            className={shouldAnimate ? 'animate-pulse' : ''}
          />
          {/* Dar es Salaam -> Dodoma -> Kigali -> Goma */}
          <path
            d="M 920,540 Q 680,440 460,340 T 220,290"
            stroke="url(#routeGradient2)"
            strokeWidth="2"
            strokeDasharray={shouldAnimate ? '4 8' : 'none'}
          />

          {/* Glowing Hub Nodes */}
          {/* Mombasa */}
          <circle cx="980" cy="480" r="6" fill="#06B6D4" />
          <circle cx="980" cy="480" r="14" stroke="#38BDF8" strokeWidth="1" opacity="0.4" className="animate-ping" />
          {/* Nairobi */}
          <circle cx="680" cy="350" r="5" fill="#38BDF8" />
          {/* Kampala */}
          <circle cx="480" cy="280" r="6" fill="#0EA5E9" />
          <circle cx="480" cy="280" r="12" stroke="#06B6D4" strokeWidth="1" opacity="0.4" className="animate-ping" />
          {/* Kigali */}
          <circle cx="260" cy="260" r="5" fill="#10B981" />

          {/* Small glowing points moving along route (animated circles) */}
          {shouldAnimate && (
            <>
              <circle cx="780" cy="410" r="3.5" fill="#F8FAFC" className="animate-pulse" />
              <circle cx="390" cy="255" r="3.5" fill="#F8FAFC" className="animate-pulse" />
            </>
          )}
        </svg>

        {/* 6. FLOATING CARGO CONTAINERS (Subtle Parallax) */}
        <div
          className={`absolute top-20 right-[8%] w-36 h-20 rounded-xl bg-gradient-to-br from-blue-900/25 to-slate-900/40 border border-cyan-500/20 hidden lg:flex flex-col justify-center px-4 backdrop-blur-sm ${
            shouldAnimate ? 'animate-float-soft' : ''
          }`}
          style={{ animationDelay: '0.8s' }}
        >
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-cyan-400 font-bold">
            <Package className="w-3.5 h-3.5" />
            <span>KCC-40FT-HC</span>
          </div>
          <div className="text-[11px] font-semibold text-slate-200 mt-1">Cross-Border Seal</div>
          <div className="text-[9px] text-emerald-400 font-mono mt-0.5">● Cleared for Transit</div>
        </div>

        <div
          className={`absolute top-44 left-[6%] w-40 h-22 rounded-xl bg-gradient-to-br from-slate-900/40 to-cyan-950/20 border border-slate-700/40 hidden lg:flex flex-col justify-center px-4 backdrop-blur-sm ${
            shouldAnimate ? 'animate-float-soft' : ''
          }`}
          style={{ animationDelay: '2.2s' }}
        >
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-amber-400 font-bold">
            <Globe2 className="w-3.5 h-3.5" />
            <span>EXPRESS CORRIDOR</span>
          </div>
          <div className="text-[11px] font-semibold text-slate-200 mt-1">Mombasa ➔ Kampala</div>
          <div className="text-[9px] text-cyan-400 font-mono mt-0.5">● 24/7 Satellite Telemetry</div>
        </div>
      </div>

      {/* MAIN HERO CONTENT */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 text-center flex flex-col items-center">
        {/* 7. COMPANY LOGO (Smooth Fade & Scale Animation) */}
        <div
          className={`mb-6 transform transition-all duration-700 ${
            shouldAnimate ? 'animate-fadeIn' : ''
          }`}
        >
          <CompanyLogo size={60} variant="full" light={true} />
        </div>

        {/* Kicker badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-semibold tracking-wider uppercase mb-6 backdrop-blur-md shadow-lg shadow-cyan-950/30">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span>Regional Freight Corridors • East Africa & Beyond</span>
        </div>

        {/* 8. MAIN HEADING (Clean Slide / Fade Animation) */}
        <div className={`space-y-4 max-w-4xl mx-auto ${shouldAnimate ? 'animate-slideUp' : ''}`}>
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight font-['Montserrat'] leading-tight drop-shadow-2xl">
            {companyName || 'KIRENGA CARGO CARRIERS'}
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl text-cyan-200/90 font-light font-['Poppins'] max-w-3xl mx-auto leading-relaxed">
            {tagline || 'Reliable Cargo Transportation Across East Africa and Beyond'}
          </p>
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Heavy freight haulage, container logistics, cross-border customs handling, and real-time electronic seal tracking spanning Kenya, Uganda, Tanzania, Rwanda, and DR Congo.
          </p>
        </div>

        {/* 9. BUTTONS (Staggered Animation) */}
        <div className="flex flex-wrap items-center justify-center gap-4 mt-8 mb-10">
          <button
            onClick={() => onNavigate('track')}
            className="px-7 py-3.5 rounded-xl btn-primary-cyan text-sm tracking-wider uppercase font-bold flex items-center gap-2.5 active:scale-95 group shadow-lg"
          >
            <Search className="w-4 h-4 text-white group-hover:scale-110 transition-transform" />
            <span>Track Cargo</span>
          </button>

          <button
            onClick={() => onNavigate('quote')}
            className="px-7 py-3.5 rounded-xl btn-secondary-dark text-sm tracking-wider uppercase font-bold flex items-center gap-2.5 active:scale-95 group"
          >
            <span>Request a Quote</span>
            <ChevronRight className="w-4 h-4 text-cyan-400 group-hover:translate-x-1 transition-transform" />
          </button>

          <button
            onClick={() => onNavigate('book')}
            className="px-7 py-3.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700 text-sm tracking-wider uppercase font-bold flex items-center gap-2 active:scale-95 transition-all"
          >
            <span>Book Cargo</span>
          </button>
        </div>

        {/* FAST TRACKING SEARCH INPUT WIDGET */}
        <div className="w-full max-w-xl mx-auto bg-slate-900/80 border border-slate-700/80 p-2 sm:p-2.5 rounded-2xl shadow-2xl backdrop-blur-xl mb-12">
          <form onSubmit={handleQuickTrack} className="flex flex-col sm:flex-row items-center gap-2">
            <div className="relative flex-grow w-full">
              <Search className="w-4 h-4 text-cyan-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="Enter Waybill or Consignment Reference (e.g. KCC-2026-000001)"
                className="w-full pl-10 pr-4 py-3 bg-slate-950/80 border border-slate-700 rounded-xl text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 transition-colors"
              />
            </div>
            <button
              type="submit"
              className="w-full sm:w-auto px-6 py-3 rounded-xl btn-primary-cyan text-xs tracking-wider uppercase font-bold flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <span>Track Now</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>

        {/* 5. MODERN CARGO TRUCK ANIMATION (Moving across lower hero) */}
        <div className="w-full max-w-3xl mt-2 overflow-hidden">
          <div className="w-full">
            <AnimatedTruck
              variant="drive-through"
              size="lg"
              showRoad={true}
              glow={true}
              speed="normal"
            />
          </div>
        </div>

        {/* Operational Highlights Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl w-full mt-10 text-left text-xs">
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-cyan-400 font-bold mb-1">
              <ShieldCheck className="w-4 h-4" />
              <span>Full Transit Insurance</span>
            </div>
            <p className="text-slate-400 text-[11px]">Comprehensive carrier liability on all corridor movements.</p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-cyan-400 font-bold mb-1">
              <Clock className="w-4 h-4" />
              <span>99.8% On-Time Delivery</span>
            </div>
            <p className="text-slate-400 text-[11px]">Guaranteed transit milestones & zero border dwell time.</p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-cyan-400 font-bold mb-1">
              <MapPin className="w-4 h-4" />
              <span>7 Transit Nations</span>
            </div>
            <p className="text-slate-400 text-[11px]">Kenya, Uganda, Tanzania, Rwanda, Burundi, DRC, South Sudan.</p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-cyan-400 font-bold mb-1">
              <CheckCircle2 className="w-4 h-4" />
              <span>Verified Fleet Assets</span>
            </div>
            <p className="text-slate-400 text-[11px]">Strict pre-departure maintenance and telematic audits.</p>
          </div>
        </div>
      </div>
    </section>
  );
};
