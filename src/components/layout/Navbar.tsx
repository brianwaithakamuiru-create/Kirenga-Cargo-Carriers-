import React, { useState } from 'react';
import { Menu, X, Shield, Compass, Briefcase, LogOut, Search, PackageCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { CompanyLogo } from '../common/CompanyLogo';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, onNavigate }) => {
  const { currentUser, role, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { id: 'home', label: 'Home' },
    { id: 'about', label: 'About Us' },
    { id: 'services', label: 'Services' },
    { id: 'track', label: 'Cargo Tracking' },
    { id: 'destinations', label: 'Destinations' },
    { id: 'fleet', label: 'Fleet' },
    { id: 'contact', label: 'Contact' },
  ];

  const handlePortalRedirect = () => {
    if (role === 'admin') onNavigate('admin');
    else if (role === 'driver') onNavigate('driver');
    else if (role === 'worker' || role === 'staff') onNavigate('staff');
    else onNavigate('home');
  };

  return (
    <header className="sticky top-0 z-50 bg-[#060B18]/95 backdrop-blur-md border-b border-cyan-500/20 shadow-xl shadow-black/50">
      {/* Top Operations & Corridors Status Strip */}
      <div className="bg-[#040814] border-b border-slate-800/80 px-4 py-1.5 text-xs text-slate-300">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-sm shadow-cyan-400" />
            <span className="font-semibold text-cyan-300 tracking-wider uppercase text-[11px] font-mono">
              East Africa Express Corridors Active
            </span>
            <span className="hidden md:inline text-slate-600">|</span>
            <span className="hidden md:inline text-slate-400 text-[11px]">
              Nairobi • Kampala • Kigali • Dar es Salaam • Goma • Mombasa
            </span>
          </div>

          <div className="flex items-center gap-3">
            {currentUser ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePortalRedirect}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-cyan-500 text-slate-950 hover:bg-cyan-400 transition-colors shadow-sm"
                >
                  {role === 'admin' && <Shield className="w-3.5 h-3.5" />}
                  {role === 'driver' && <Compass className="w-3.5 h-3.5" />}
                  {(role === 'worker' || role === 'staff') && <Briefcase className="w-3.5 h-3.5" />}
                  <span>
                    {role === 'admin'
                      ? 'Admin Central'
                      : role === 'driver'
                      ? 'Driver Portal'
                      : 'Staff Workplace'}
                  </span>
                </button>

                <button
                  onClick={async () => {
                    await signOut();
                    onNavigate('home');
                  }}
                  className="p-1 text-slate-400 hover:text-rose-400 transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Dynamic Admin-Managed Brand Logo */}
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center text-left focus:outline-none group py-2"
          >
            <CompanyLogo size={46} variant="full" />
          </button>

          {/* Desktop Nav Items */}
          <nav className="hidden lg:flex items-center space-x-7">
            {navLinks.map((link) => {
              const isActive = currentView === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => onNavigate(link.id)}
                  className={`text-sm font-medium transition-all relative py-1 ${
                    isActive
                      ? 'text-cyan-300 font-bold'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <span>{link.label}</span>
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 via-cyan-400 to-teal-400 rounded-full" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Action CTAs: Track + Book Delivery */}
          <div className="hidden sm:flex items-center space-x-3">
            <button
              onClick={() => onNavigate('track')}
              className="px-4 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-200 hover:text-cyan-300 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all"
            >
              <Search className="w-3.5 h-3.5 text-cyan-400" />
              <span>Track Cargo</span>
            </button>

            <button
              onClick={() => onNavigate('book')}
              className="px-4 py-2 rounded-xl btn-primary-cyan text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
            >
              <PackageCheck className="w-3.5 h-3.5" />
              <span>Book Cargo</span>
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="lg:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-white"
              aria-label="Toggle navigation"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#0A1024] border-b border-slate-800 px-4 pt-3 pb-6 space-y-3 animate-slideUp">
          <nav className="flex flex-col space-y-1">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => {
                  onNavigate(link.id);
                  setMobileMenuOpen(false);
                }}
                className={`text-left px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                  currentView === link.id
                    ? 'bg-cyan-950/60 text-cyan-300 border border-cyan-500/30'
                    : 'text-slate-300 hover:bg-slate-900/60'
                }`}
              >
                {link.label}
              </button>
            ))}
          </nav>

          <div className="pt-3 border-t border-slate-800 flex flex-col gap-2">
            <button
              onClick={() => {
                onNavigate('track');
                setMobileMenuOpen(false);
              }}
              className="w-full py-2.5 rounded-xl bg-slate-900 text-cyan-300 border border-slate-700 text-xs font-semibold flex items-center justify-center gap-2"
            >
              <Search className="w-4 h-4" />
              <span>Track Consignment</span>
            </button>
            <button
              onClick={() => {
                onNavigate('book');
                setMobileMenuOpen(false);
              }}
              className="w-full py-2.5 rounded-xl btn-primary-cyan text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-md"
            >
              <PackageCheck className="w-4 h-4" />
              <span>Book Delivery</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
