import React from 'react';
import { ShieldCheck, MapPin, Phone, Mail, MessageSquare, ArrowRight } from 'lucide-react';
import { CompanyLogo } from '../common/CompanyLogo';
import { useBranding } from '../../context/BrandingContext';

interface FooterProps {
  onNavigate: (view: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const { companyName, tagline, branding } = useBranding();

  return (
    <footer className="bg-[#040814] border-t border-slate-800 text-slate-400 text-sm relative overflow-hidden">
      {/* Subtle top edge glow */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent" />

      {/* Ambient background glow */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-900/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-14">
          {/* Brand Col */}
          <div className="lg:col-span-2 space-y-4">
            <button onClick={() => onNavigate('home')} className="text-left">
              <CompanyLogo size={44} variant="full" />
            </button>

            <p className="text-xs sm:text-sm text-slate-400 max-w-sm leading-relaxed font-light font-['Poppins']">
              {tagline || 'Reliable Cargo Transportation Across East Africa and Beyond. Heavy haulage, port transit, and single-window customs clearance.'}
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <a
                href={`https://wa.me/${(branding.supportPhone || '+256700000000').replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900 border border-cyan-500/30 text-cyan-300 text-xs font-semibold hover:bg-cyan-950 transition-colors shadow-sm"
              >
                <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
                <span>WhatsApp Operations</span>
              </a>
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/60 border border-slate-800 text-slate-400 text-xs">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>EAC & COMESA Licensed Carrier</span>
              </div>
            </div>
          </div>

          {/* Quick Navigation */}
          <div>
            <h4 className="text-white font-bold font-['Montserrat'] text-xs tracking-wider uppercase mb-4 text-cyan-400">
              Quick Navigation
            </h4>
            <ul className="space-y-2.5 text-xs font-light">
              <li>
                <button onClick={() => onNavigate('home')} className="hover:text-cyan-300 transition-colors text-left">
                  Home
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('about')} className="hover:text-cyan-300 transition-colors text-left">
                  About Us
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('services')} className="hover:text-cyan-300 transition-colors text-left">
                  Services Catalog
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('track')} className="hover:text-cyan-300 transition-colors text-left">
                  Cargo Tracking
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('destinations')} className="hover:text-cyan-300 transition-colors text-left">
                  Destinations & Corridors
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('fleet')} className="hover:text-cyan-300 transition-colors text-left">
                  Fleet Registry
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('contact')} className="hover:text-cyan-300 transition-colors text-left">
                  Contact & Inquiries
                </button>
              </li>
            </ul>
          </div>

          {/* Core Services */}
          <div>
            <h4 className="text-white font-bold font-['Montserrat'] text-xs tracking-wider uppercase mb-4 text-cyan-400">
              Services
            </h4>
            <ul className="space-y-2.5 text-xs font-light">
              <li>
                <button onClick={() => onNavigate('services')} className="hover:text-cyan-300 transition-colors text-left">
                  Cargo Transportation
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('services')} className="hover:text-cyan-300 transition-colors text-left">
                  Cross-Border Transport
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('services')} className="hover:text-cyan-300 transition-colors text-left">
                  Container Transportation
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('services')} className="hover:text-cyan-300 transition-colors text-left">
                  Freight Services
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('services')} className="hover:text-cyan-300 transition-colors text-left">
                  Transit Warehousing
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('services')} className="hover:text-cyan-300 transition-colors text-left">
                  Customs & Border Clearing
                </button>
              </li>
            </ul>
          </div>

          {/* Central Contact */}
          <div>
            <h4 className="text-white font-bold font-['Montserrat'] text-xs tracking-wider uppercase mb-4 text-cyan-400">
              Operations Desk
            </h4>
            <ul className="space-y-3 text-xs">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <span>{branding.headquartersAddress || 'Plot 42, Logistics Park, Kampala / Nairobi Express Corridor'}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>{branding.supportPhone || '+256 700 000 000'}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-cyan-400 shrink-0" />
                <span className="truncate">{branding.supportEmail || 'operations@kirengacargo.com'}</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Strip */}
        <div className="border-t border-slate-800/80 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            © {new Date().getFullYear()} {companyName || 'KIRENGA CARGO CARRIERS'}. All rights reserved.
          </div>
          <div className="flex items-center gap-6">
            <span>Security Sealed Corridors</span>
            <span>COMESA Bonded</span>
            <span>Single Customs Territory</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
