import React, { useState, useEffect, lazy, Suspense } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { BrandingProvider } from './context/BrandingContext';
import { AnimationProvider } from './context/AnimationContext';
import { SharedLoginPortal } from './components/auth/SharedLoginPortal';
import { ShieldAlert, AlertTriangle, LogOut, ArrowRight, Headphones, Phone, Mail } from 'lucide-react';

const SessionLockScreen = lazy(() => import('./components/auth/SessionLockScreen').then((m) => ({ default: m.SessionLockScreen })));
const ChangePasswordScreen = lazy(() => import('./components/auth/ChangePasswordScreen').then((m) => ({ default: m.ChangePasswordScreen })));
const Navbar = lazy(() => import('./components/layout/Navbar').then((m) => ({ default: m.Navbar })));
const Footer = lazy(() => import('./components/layout/Footer').then((m) => ({ default: m.Footer })));
const TrackingBox = lazy(() => import('./components/public/TrackingBox').then((m) => ({ default: m.TrackingBox })));
const BookingForm = lazy(() => import('./components/public/BookingForm').then((m) => ({ default: m.BookingForm })));
const QuoteForm = lazy(() => import('./components/public/QuoteForm').then((m) => ({ default: m.QuoteForm })));
const ServicesSection = lazy(() => import('./components/public/ServicesSection').then((m) => ({ default: m.ServicesSection })));
const WhyChooseSection = lazy(() => import('./components/public/WhyChooseSection').then((m) => ({ default: m.WhyChooseSection })));
const DestinationsSection = lazy(() => import('./components/public/DestinationsSection').then((m) => ({ default: m.DestinationsSection })));
const FleetSection = lazy(() => import('./components/public/FleetSection').then((m) => ({ default: m.FleetSection })));
const AboutSection = lazy(() => import('./components/public/AboutSection').then((m) => ({ default: m.AboutSection })));
const ContactSection = lazy(() => import('./components/public/ContactSection').then((m) => ({ default: m.ContactSection })));
const TestimonialsSection = lazy(() => import('./components/public/TestimonialsSection').then((m) => ({ default: m.TestimonialsSection })));
const DriverPortal = lazy(() => import('./components/driver/DriverPortal').then((m) => ({ default: m.DriverPortal })));
const WorkerPortal = lazy(() => import('./components/worker/WorkerPortal').then((m) => ({ default: m.WorkerPortal })));
const AdminDashboard = lazy(() => import('./components/admin/AdminDashboard').then((m) => ({ default: m.AdminDashboard })));
const PublicHome = lazy(() => import('./components/public/PublicHome').then((m) => ({ default: m.PublicHome })));


const VALID_VIEWS = new Set([
  'login', 'change-password', 'admin', 'admin/workforce',
  'admin/workforce/add-staff', 'admin/workforce/add-driver', 'admin/activity',
  'driver', 'staff', 'worker', 'book', 'quote', 'track', 'services',
  'destinations', 'fleet', 'about', 'contact',
]);

const getInitialView = (): string => {
  if (typeof window === 'undefined') return 'home';
  const hash = window.location.hash.replace(/^#\/?/, '');
  const path = window.location.pathname.replace(/^\//, '');
  const target = hash || path;
  return VALID_VIEWS.has(target) || target.startsWith('admin/') ? target : 'home';
};

const AppContent: React.FC = () => {
  const [currentView, setCurrentView] = useState<string>(getInitialView);
  const { currentUser, userProfile, role, signOut, isSessionLocked, mustChangePassword } = useAuth();

  // Handle URL hash and path routing (e.g. #/login, #/admin, #/driver, #/staff, #/change-password)
  useEffect(() => {
    const handleLocation = () => {
      setCurrentView(getInitialView());
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
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#060B18] text-slate-200"><span role="status" aria-live="polite">Opening Kirenga Cargo…</span></div>}>
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

            {/* Public homepage is loaded only for public entry routes. */}
            {currentView === 'home' && <PublicHome onNavigate={navigateTo} />}

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

          </>
        )}
      </main>

      {/* Global Footer (Rendered on public pages only) */}
      {!isDashboardView && currentView !== 'login' && currentView !== 'change-password' && (
        <Footer onNavigate={navigateTo} />
      )}
    </div>
    </Suspense>
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
