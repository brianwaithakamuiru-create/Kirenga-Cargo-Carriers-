import React, { useState } from 'react';
import {
  Truck,
  Shield,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  Phone,
  Mail,
  Building,
  Globe2,
  Headphones,
  Send,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../lib/firestoreService';
import { CompanyLogo } from '../common/CompanyLogo';
import { useBranding } from '../../context/BrandingContext';

interface SharedLoginPortalProps {
  onNavigate: (view: string) => void;
}

export const SharedLoginPortal: React.FC<SharedLoginPortalProps> = ({ onNavigate }) => {
  const { signIn, signInWithGoogle, signInWithAdminProvider, signInWithAdminPin, sendPasswordReset } = useAuth();

  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [adminPin, setAdminPin] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [selectedPortal, setSelectedPortal] = useState<'driver' | 'staff' | 'admin'>('staff');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Forgot password modal state
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [forgotInput, setForgotInput] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState<string | null>(null);
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [forgotStatusType, setForgotStatusType] = useState<
    'idle' | 'email-sent' | 'invalid-email' | 'not-found' | 'too-many-requests' | 'network-error'
  >('idle');

  // Contact Administrator modal state
  const [contactAdminModalOpen, setContactAdminModalOpen] = useState(false);
  const [contactName, setContactName] = useState('');
  const [contactPhoneOrEmail, setContactPhoneOrEmail] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactSubmitting, setContactSubmitting] = useState(false);
  const [contactSuccess, setContactSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanIdentifier = emailOrUsername.trim();
    if (!cleanIdentifier) {
      setError('Please enter your registered email address.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setLoading(true);
    try {
      const expectedRole = selectedPortal;
      const profile = await signIn(cleanIdentifier, password, rememberMe, expectedRole);

      // Check temporary password flow first
      if (profile.mustChangePassword) {
        onNavigate('change-password');
        return;
      }

      const role = (profile.role || '').toLowerCase();
      // Automated role-based routing directly verified from Firestore
      if (role === 'admin') {
        onNavigate('admin');
      } else if (role === 'driver') {
        onNavigate('driver');
      } else if (role === 'staff' || role === 'worker' || role === 'operations' || role === 'finance' || role === 'support') {
        onNavigate('staff');
      } else if (role === 'customer') {
        onNavigate('customer');
      } else {
        onNavigate('home');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleAdminPinSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const pin = adminPin.replace(/\\D/g, '').slice(0, 5);
    if (!/^\\d{5}$/.test(pin)) {
      setError('Enter the five-digit administrator PIN.');
      return;
    }

    setLoading(true);
    try {
      const profile = await signInWithAdminPin(pin);
      if (profile.mustChangePassword) {
        onNavigate('change-password');
        return;
      }
      onNavigate('admin');
    } catch (err: any) {
      setError(err.message || 'Administrator PIN sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAdminProviderSignIn = async (provider: 'google.com' | 'apple.com' | 'microsoft.com') => {
    setError(null);
    setLoading(true);
    try {
      const profile = provider === 'google.com'
        ? await signInWithGoogle()
        : await signInWithAdminProvider(provider);
      if (profile.mustChangePassword) {
        onNavigate('change-password');
        return;
      }
      onNavigate('admin');
    } catch (err: any) {
      setError(err.message || 'Administrator sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);
    setForgotSuccess(null);
    setForgotStatusType('idle');

    const target = forgotInput.trim();
    if (!target) {
      setForgotError('Please enter your registered email address.');
      setForgotStatusType('invalid-email');
      return;
    }

    // Basic email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(target) && !target.includes('@')) {
      // Username lookup is allowed in sendPasswordReset
    }

    setForgotLoading(true);
    try {
      await sendPasswordReset(target);
      setForgotStatusType('email-sent');
      setForgotSuccess(
        'Password reset email sent. If an account is associated with this address, you will receive instructions shortly.'
      );
    } catch (err: any) {
      const code = err.code || '';
      const msg = err.message || '';

      if (code === 'auth/invalid-email' || msg.includes('invalid-email')) {
        setForgotStatusType('invalid-email');
        setForgotError('Invalid email address format. Please enter a valid corporate or registered email.');
      } else if (code === 'auth/user-not-found' || msg.includes('not found')) {
        setForgotStatusType('not-found');
        setForgotError('Account not found. Please verify your email or contact the administrator.');
      } else if (code === 'auth/too-many-requests' || msg.includes('too-many-requests')) {
        setForgotStatusType('too-many-requests');
        setForgotError('Too many requests. Please wait a few moments before requesting another reset email.');
      } else if (code === 'auth/network-request-failed' || msg.includes('network')) {
        setForgotStatusType('network-error');
        setForgotError('Network error. Please check your internet connection and try again.');
      } else {
        setForgotStatusType('not-found');
        setForgotError('Unable to process password reset. Please contact your company administrator.');
      }
    } finally {
      setForgotLoading(false);
    }
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName.trim() || !contactMessage.trim()) return;

    setContactSubmitting(true);
    try {
      await db.add<any>('contactMessages', {
        name: contactName.trim(),
        email: contactPhoneOrEmail.trim(),
        phone: contactPhoneOrEmail.trim(),
        subject: 'Workforce Portal Access Assistance Request',
        message: contactMessage.trim(),
        status: 'NEW',
        createdAt: new Date().toISOString(),
      });
      setContactSuccess(true);
      setTimeout(() => {
        setContactAdminModalOpen(false);
        setContactSuccess(false);
        setContactName('');
        setContactPhoneOrEmail('');
        setContactMessage('');
      }, 2000);
    } catch (err) {
      console.error('Error dispatching contact message:', err);
    } finally {
      setContactSubmitting(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-[#030611]">
      {/* Ambient background lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] bg-gradient-to-tr from-blue-700/15 via-cyan-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -right-20 w-[450px] h-[450px] bg-blue-900/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Top Back to Website link */}
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => onNavigate('home')}
            className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-cyan-400 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Public Website</span>
          </button>
          <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider">
            Secured via Firebase
          </span>
        </div>

        {/* Main Card */}
        <div className="bg-[#0A1024]/90 backdrop-blur-xl border border-slate-800/90 rounded-2xl p-8 sm:p-10 shadow-2xl shadow-blue-950/40 relative">
          {/* Brand Logo */}
          <div className="flex flex-col items-center justify-center mb-6">
            <CompanyLogo size={52} variant="icon-only" />
            <div className="text-center mt-3">
              <CompanyLogo size={36} variant="compact" />
            </div>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-white font-['Poppins'] tracking-tight">
              Kirenga Cargo Portal
            </h1>
            <p className="text-slate-400 text-xs mt-2 leading-relaxed">
              Staff and drivers use accounts issued by an administrator. Customers book and track shipments without an account.
            </p>
          </div>


          <div className="mb-6 grid grid-cols-2 gap-2" role="group" aria-label="Choose your portal">
            {[
              { id: 'driver', label: 'Driver' },
              { id: 'staff', label: 'Staff' },
              { id: 'admin', label: 'Administrator' },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setSelectedPortal(item.id as typeof selectedPortal);
                  setError(null);
                }}
                aria-pressed={selectedPortal === item.id}
                className={selectedPortal === item.id
                  ? 'rounded-xl border border-cyan-400 bg-cyan-950/60 px-3 py-2.5 text-xs font-bold text-cyan-200'
                  : 'rounded-xl border border-slate-800 bg-slate-950/50 px-3 py-2.5 text-xs font-semibold text-slate-400 hover:text-white'}
              >{item.label}</button>
            ))}
          </div>


          {selectedPortal === 'admin' && (
            <form onSubmit={handleAdminPinSignIn} className="mt-5 space-y-5">
              <div className="flex items-center gap-3 mb-2 text-[10px] uppercase tracking-widest text-slate-500 font-mono">
                <span className="h-px flex-1 bg-slate-800" />
                <span>Administrator PIN</span>
                <span className="h-px flex-1 bg-slate-800" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 font-mono">
                  Administrator PIN
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Shield className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    inputMode="numeric"
                    pattern="[0-9]{5}"
                    maxLength={5}
                    value={adminPin}
                    onChange={(e) => setAdminPin(e.target.value.replace(/\\D/g, '').slice(0, 5))}
                    placeholder="Enter 5-digit PIN"
                    autoComplete="one-time-code"
                    className="w-full pl-10 pr-4 py-3 bg-[#050915] border border-slate-700/80 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all font-mono tracking-[0.35em]"
                    required
                  />
                </div>
                <p className="mt-2 text-[11px] text-slate-500 text-center">
                  Use the administrator PIN assigned to the workplace.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-5 rounded-xl bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-sm shadow-xl shadow-cyan-600/30 flex items-center justify-center gap-2 transition-all transform active:scale-[0.99] disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Connecting to workplace...</span>
                  </>
                ) : (
                  <>
                    <span>Enter Administrator Workplace</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <p className="text-center text-[11px] leading-relaxed text-slate-500">
                Secure PIN authentication is verified by the server and Firebase.
              </p>
            </form>
          )}


          {(selectedPortal === 'driver' || selectedPortal === 'staff') && (
            <p className="mt-4 text-center text-[11px] leading-relaxed text-slate-500">Your account and temporary password are provided by a Kirenga Cargo administrator.</p>
          )}
          {/* Contact Administrator Link */}
          <div className="mt-6 pt-5 border-t border-slate-800/80 flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={() => setContactAdminModalOpen(true)}
              className="text-xs text-slate-400 hover:text-cyan-400 font-medium inline-flex items-center gap-1.5 transition-colors"
            >
              <Headphones className="w-3.5 h-3.5 text-cyan-400" />
              <span>Contact Administrator</span>
            </button>
            <p className="text-[11px] text-slate-500 text-center leading-relaxed">
              Worker accounts are provisioned exclusively by Kirenga Cargo Carriers administration. Self-registration is restricted.
            </p>
          </div>
        </div>

        {/* Bottom Corridor Badges */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-[11px] text-slate-500">
          <span className="flex items-center gap-1">
            <Globe2 className="w-3 h-3 text-cyan-500/70" /> Uganda
          </span>
          <span>•</span>
          <span>Kenya</span>
          <span>•</span>
          <span>Tanzania</span>
          <span>•</span>
          <span>Rwanda</span>
          <span>•</span>
          <span>DR Congo</span>
          <span>•</span>
          <span>South Sudan</span>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {forgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="w-full max-w-md bg-[#0A1024] border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-cyan-950/80 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <HelpCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white font-['Poppins']">Workforce Password Recovery</h3>
                <p className="text-xs text-slate-400">Enter your registered email address to receive a secure password reset link.</p>
              </div>
            </div>

            {forgotError && (
              <div className="mb-4 p-3 rounded-lg bg-red-950/60 border border-red-500/30 text-red-300 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400 mt-0.5" />
                <span className="leading-relaxed">{forgotError}</span>
              </div>
            )}

            {forgotSuccess ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400 mt-0.5" />
                  <span className="leading-relaxed">{forgotSuccess}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setForgotModalOpen(false);
                    setForgotSuccess(null);
                    setForgotStatusType('idle');
                  }}
                  className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
                >
                  Close & Return to Login
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Registered Email Address
                  </label>
                  <input
                    type="email"
                    value={forgotInput}
                    onChange={(e) => setForgotInput(e.target.value)}
                    placeholder="e.g. driver@kirengacargo.com"
                    className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-700 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                    required
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setForgotModalOpen(false);
                      setForgotError(null);
                      setForgotStatusType('idle');
                    }}
                    className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs shadow-md shadow-cyan-600/30 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                  >
                    {forgotLoading ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Sending Link...</span>
                      </>
                    ) : (
                      <span>Send Password Reset</span>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Contact Administrator Modal */}
      {contactAdminModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="w-full max-w-lg bg-[#0A1024] border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl relative">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-11 h-11 rounded-xl bg-cyan-950/80 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Headphones className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white font-['Poppins']">Contact Administrator</h3>
                <p className="text-xs text-slate-400">Kirenga Cargo Carriers Central Command Support</p>
              </div>
            </div>

            {/* Direct Contact Channels */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl flex items-center gap-3">
                <Phone className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                <div className="text-xs">
                  <div className="text-slate-400 font-mono text-[10px]">OPERATIONS DESK</div>
                  <div className="text-white font-semibold">+256 700 000 000</div>
                </div>
              </div>
              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl flex items-center gap-3">
                <Mail className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                <div className="text-xs">
                  <div className="text-slate-400 font-mono text-[10px]">ADMINISTRATOR EMAIL</div>
                  <div className="text-white font-semibold truncate">kirengacargo@gmail.com</div>
                </div>
              </div>
            </div>

            {contactSuccess ? (
              <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Your message has been dispatched to Central Administration.</span>
              </div>
            ) : (
              <form onSubmit={handleContactSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Your Full Name</label>
                  <input
                    type="text"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="e.g. John Bosco"
                    className="w-full px-3 py-2 bg-slate-950/80 border border-slate-700 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Email or Phone Number</label>
                  <input
                    type="text"
                    value={contactPhoneOrEmail}
                    onChange={(e) => setContactPhoneOrEmail(e.target.value)}
                    placeholder="e.g. j.bosco@gmail.com or +256 750..."
                    className="w-full px-3 py-2 bg-slate-950/80 border border-slate-700 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Issue or Assistance Needed</label>
                  <textarea
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)}
                    rows={3}
                    placeholder="Provide details about your account lockout, password issue, or department assignment request."
                    className="w-full px-3 py-2 bg-slate-950/80 border border-slate-700 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:border-cyan-400 resize-none"
                    required
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setContactAdminModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={contactSubmitting}
                    className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs shadow-md shadow-cyan-600/30 disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{contactSubmitting ? 'Submitting...' : 'Submit Request'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
