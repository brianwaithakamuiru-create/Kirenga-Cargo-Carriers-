import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { BrandingProvider } from './context/BrandingContext';
import { AnimationProvider } from './context/AnimationContext';
import { SessionLockScreen } from './components/auth/SessionLockScreen';
import { SharedLoginPortal } from './components/auth/SharedLoginPortal';
import { ChangePasswordScreen } from './components/auth/ChangePasswordScreen';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { Hero } from './components/public/Hero';
import { TrackingBox } from './components/public/TrackingBox';
import { BookingForm } from './components/public/BookingForm';
import { QuoteForm } from './components/public/QuoteForm';
import { ServicesSection } from './components/public/ServicesSection';
import { DestinationsSection } from './components/public/DestinationsSection';
import { FleetSection } from './components/public/FleetSection';
import { AboutSection } from './components/public/AboutSection';
import { ContactSection } from './components/public/ContactSection';
import { WhyChooseSection } from './components/public/WhyChooseSection';
import { HowItWorksSection } from './components/public/HowItWorksSection';
import { TestimonialsSection } from './components/public/TestimonialsSection';
import { CustomerPortal } from './components/customer/CustomerPortal';
import { DriverPortal } from './components/driver/DriverPortal';
import { WorkerPortal } from './components/worker/WorkerPortal';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { ShieldAlert, AlertTriangle, LogOut, ArrowRight, Headphones, Phone, Mail } from 'lucide-react';

const AppContent: React.FC = () => {
  const [currentView, setCurrentView] = useState<string>('home');
  const { currentUser, userProfile, role, signOut, isSessionLocked, mustChangePassword } = useAuth();

  // Handle URL hash and path routing (e.g. #/login, #/admin, #/driver, #/staff, #/change-password)
  useEffect(() => {
    const handleLocation = () => {
      const hash = window.location.hash.replace(/^#\/?/, '');
      const path = window.location.pathname.replace(/^\//, '');
      const target = hash || path;

      if (
        [
          'login',
          'change-password',
          'admin',
          'admin/workforce',
          'admin/workforce/add-staff',
          'admin/workforce/add-driver',
          'admin/activity',
          'driver',
          'staff',
          'worker',
          'customer',
          'book',
          'quote',
          'track',
          'services',
          'destinations',
          'fleet',
          'about',
          'contact',
        ].includes(target) ||
        target.startsWith('admin/')
      ) {
        setCurrentView(target);
      } else {
        setCurrentView('home');
      }
    };

    handleLocation();
    window.addEventListener('hashchange', handleLocation);
    window.addEventListener('popstate', handleLocation);
    return () => {
      window.removeEventListener('hashchange', handleLocation);
      window.removeEventListener('popstate', handleLocation);
    };
  }, []);

  const navigateTo = (view: string) => {
    setCurrentView(view);
    window.location.hash = `/${view}`;
    window.scrollTo({ top: 0, behavior: 'auto' });
  };

  // Check account deactivation / suspension / lockout status across all portals
  const isAccountUnavailable =
    currentUser &&
    userProfile &&
    ['inactive', 'suspended', 'locked'].includes((userProfile.status || '').toLowerCase());

  const renderUnavailableScreen = () => (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-[#0A1024] border border-red-500/40 rounded-3xl p-8 text-center shadow-2xl space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-red-950/80 border border-red-500/40 flex items-center justify-center text-red-400 mx-auto shadow-lg shadow-red-950/40">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white font-['Poppins']">Access Restricted</h2>
        <div className="p-4 bg-red-950/50 border border-red-500/30 rounded-2xl text-xs text-red-200 leading-relaxed font-medium">
          "Your account is currently unavailable. Contact the Kirenga Cargo Carriers administrator."
        </div>

        {/* Administrator Contact Info */}
        <div className="text-left bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-2 text-xs text-slate-300">
          <div className="text-[10px] font-mono text-cyan-400 uppercase font-semibold">Central Command Support</div>
          <div className="flex items-center gap-2">
            <Phone className="w-3.5 h-3.5 text-slate-400" />
            <span>+256 700 000 000 (Operations Desk)</span>
          </div>
          <div className="flex items-center gap-2">
            <Mail className="w-3.5 h-3.5 text-slate-400" />
            <span>operations@kirengacargo.com</span>
          </div>
        </div>

        <div className="pt-2">
          <button
            onClick={async () => {
              await signOut();
              navigateTo('home');
            }}
            className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border border-slate-800"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out and Return to Homepage</span>
          </button>
        </div>
      </div>
    </div>
  );

  const renderRoleMismatch = (expectedRole: string) => (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-[#0A1024] border border-amber-500/40 rounded-3xl p-8 text-center shadow-2xl space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-amber-950/80 border border-amber-500/40 flex items-center justify-center text-amber-400 mx-auto">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white font-['Poppins']">Access Restricted</h2>
        <p className="text-xs text-slate-300 leading-relaxed">
          Your authenticated role is <strong className="text-cyan-400 uppercase font-mono">{role}</strong>. This workplace requires <strong className="text-amber-400 uppercase font-mono">{expectedRole}</strong> authorization.
        </p>
        <div className="space-y-2 pt-2">
          <button
            onClick={() => {
              if (role === 'admin') navigateTo('admin');
              else if (role === 'driver') navigateTo('driver');
              else if (role === 'staff' || role === 'worker') navigateTo('staff');
              else if (role === 'customer') navigateTo('customer');
              else navigateTo('home');
            }}
            className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl text-xs font-bold shadow-lg flex items-center justify-center gap-2"
          >
            <span>Proceed to My Designated Workplace</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={async () => {
              await signOut();
              navigateTo('login');
            }}
            className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl text-xs font-medium border border-slate-800"
          >
            Sign In with Different Account
          </button>
        </div>
      </div>
    </div>
  );

  const isAdminView = currentView === 'admin' || currentView.startsWith('admin/');
  const isDashboardView = isAdminView || ['driver', 'staff', 'worker'].includes(currentView);

  return (
    <div className="min-h-screen flex flex-col bg-[#060B18] text-[#F8FAFC] selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Inactivity Screen Lock */}
      {isSessionLocked && <SessionLockScreen />}

      {/* Global Navbar (Always available on public pages, hidden on fullscreen dashboards) */}
      {!isDashboardView && currentView !== 'login' && currentView !== 'change-password' && (
        <Navbar currentView={currentView} onNavigate={navigateTo} />
      )}

      {/* Main Routed Views */}
      <main className="flex-grow">
        {/* Temporary Password Forced Change Flow */}
        {currentUser && mustChangePassword ? (
          <ChangePasswordScreen
            onSuccess={() => {
              const r = (userProfile?.role || '').toLowerCase();
              if (r === 'admin') navigateTo('admin');
              else if (r === 'driver') navigateTo('driver');
              else if (r === 'customer') navigateTo('customer');
              else navigateTo('staff');
            }}
            onSignOut={() => navigateTo('login')}
          />
        ) : (
          <>
            {/* VIEW: Login Portal */}
            {currentView === 'login' && <SharedLoginPortal onNavigate={navigateTo} />}

            {/* VIEW: Change Password */}
            {currentView === 'change-password' && (
              <ChangePasswordScreen
                onSuccess={() => {
                  const r = (userProfile?.role || '').toLowerCase();
                  if (r === 'admin') navigateTo('admin');
                  else if (r === 'driver') navigateTo('driver');
                  else navigateTo('staff');
                }}
                onSignOut={() => navigateTo('login')}
              />
            )}

            {/* VIEW: Admin Central Command & Sub-routes */}
            {isAdminView && (
              <>
                {!currentUser ? (
                  <SharedLoginPortal onNavigate={navigateTo} />
                ) : isAccountUnavailable ? (
                  renderUnavailableScreen()
                ) : role !== 'admin' ? (
                  renderRoleMismatch('admin')
                ) : (
                  <AdminDashboard onNavigate={navigateTo} initialNav={currentView} />
                )}
              </>
            )}

            {/* VIEW: Driver Workplace */}
            {currentView === 'driver' && (
              <>
                {!currentUser ? (
                  <SharedLoginPortal onNavigate={navigateTo} />
                ) : isAccountUnavailable ? (
                  renderUnavailableScreen()
                ) : role !== 'driver' && role !== 'admin' ? (
                  renderRoleMismatch('driver')
                ) : (
                  <DriverPortal onNavigate={navigateTo} />
                )}
              </>
            )}

            {/* VIEW: Staff Workplace (also supports /worker) */}
            {(currentView === 'staff' || currentView === 'worker') && (
              <>
                {!currentUser ? (
                  <SharedLoginPortal onNavigate={navigateTo} />
                ) : isAccountUnavailable ? (
                  renderUnavailableScreen()
                ) : role !== 'staff' && role !== 'worker' && role !== 'admin' ? (
                  renderRoleMismatch('staff')
                ) : (
                  <WorkerPortal onNavigate={navigateTo} />
                )}
              </>
            )}

            {/* VIEW: Public Homepage - Exact 11 Requested Sections */}
            {currentView === 'home' && (
              <div>
                {/* 1. Hero Section */}
                <Hero onNavigate={navigateTo} />

                {/* 2. About KIRENGA */}
                <AboutSection />

                {/* 3. Our Services */}
                <ServicesSection onNavigate={navigateTo} />

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
                <DestinationsSection onNavigate={navigateTo} />

                {/* 6. Our Fleet */}
                <FleetSection />

                {/* 7. Why Choose KIRENGA */}
                <WhyChooseSection onNavigate={navigateTo} />

                {/* 8. How It Works */}
                <HowItWorksSection onNavigate={navigateTo} />

                {/* 9. Customer Testimonials */}
                <TestimonialsSection />

                {/* 10. Contact / Booking Section */}
                <ContactSection onNavigate={navigateTo} />
              </div>
            )}

            {/* VIEW: Book Cargo */}
            {currentView === 'book' && (
              <div className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                <BookingForm onNavigate={navigateTo} />
              </div>
            )}

            {/* VIEW: Request Quote */}
            {currentView === 'quote' && (
              <div className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                <QuoteForm />
              </div>
            )}

            {/* VIEW: Track Cargo Dedicated Route */}
            {currentView === 'track' && (
              <div className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                <div className="text-center max-w-2xl mx-auto mb-10">
                  <div className="inline-flex items-center gap-2 text-xs font-couriers uppercase tracking-[0.25em] text-[#E6C76A] font-semibold mb-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#D4A017]" />
                    <span>Real-Time Milestone Verification</span>
                  </div>
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white font-['Montserrat'] tracking-tight">
                    Track Your <span className="text-[#D4A017]">Consignment</span>
                  </h1>
                  <p className="text-[#F5E6D3]/80 text-sm mt-2 font-light">
                    Enter your waybill or tracking reference to inspect corridor checkpoints and verified driver telemetry.
                  </p>
                </div>
                <TrackingBox />
              </div>
            )}

            {/* VIEW: Services Dedicated Route */}
            {currentView === 'services' && (
              <div>
                <ServicesSection onNavigate={navigateTo} />
                <WhyChooseSection onNavigate={navigateTo} />
              </div>
            )}

            {/* VIEW: Destinations Dedicated Route */}
            {currentView === 'destinations' && (
              <div>
                <DestinationsSection onNavigate={navigateTo} />
              </div>
            )}

            {/* VIEW: Fleet Dedicated Route */}
            {currentView === 'fleet' && (
              <div>
                <FleetSection />
              </div>
            )}

            {/* VIEW: About Dedicated Route */}
            {currentView === 'about' && (
              <div>
                <AboutSection />
                <TestimonialsSection />
              </div>
            )}

            {/* VIEW: Contact Dedicated Route */}
            {currentView === 'contact' && (
              <div>
                <ContactSection onNavigate={navigateTo} />
              </div>
            )}

            {/* VIEW: Customer Portal */}
            {currentView === 'customer' && (
              !currentUser ? (
                <SharedLoginPortal onNavigate={navigateTo} />
              ) : isAccountUnavailable ? (
                renderUnavailableScreen()
              ) : role !== 'customer' && role !== 'admin' ? (
                renderRoleMismatch('customer')
              ) : (
                <CustomerPortal onNavigate={navigateTo} />
              )
            )}
          </>
        )}
      </main>

      {/* Global Footer (Rendered on public pages only) */}
      {!isDashboardView && currentView !== 'login' && currentView !== 'change-password' && (
        <Footer onNavigate={navigateTo} />
      )}
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <BrandingProvider>
        <AnimationProvider>
          <AppContent />
        </AnimationProvider>
      </BrandingProvider>
    </AuthProvider>
  );
}
