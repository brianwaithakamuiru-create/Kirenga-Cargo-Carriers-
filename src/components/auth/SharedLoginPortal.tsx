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
  const { signIn, signInWithGoogle, signInWithAdminPin, signInWithAdminProvider, sendPasswordReset } = useAuth();

  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [adminPin, setAdminPin] = useState('');
  const [adminPinConfirmation, setAdminPinConfirmation] = useState('');
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

  const handleAdminPinSignIn = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signInWithAdminPin(adminPin, adminPinConfirmation);
      onNavigate('admin');
    } catch (err: any) {
      setError(err.message || 'PIN sign-in failed. Please try again.');
      setAdminPin('');
      setAdminPinConfirmation('');
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
                  if (item.id === 'admin') setEmailOrUsername('kirengacargo@gmail.com');
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
            <p className="mb-4 -mt-3 text-center text-xs text-cyan-200">
              Admin account: <strong>kirengacargo@gmail.com</strong>
            </p>
          )}

          {/* Validation / Error Banner */}
          {error && (
            <div className="mb-6 p-3.5 rounded-xl bg-red-950/70 border border-red-500/40 text-red-200 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400 mt-0.5" />
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          {selectedPortal !== 'admin' && <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email or Username */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 font-mono">
                Email address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={emailOrUsername}
                  onChange={(e) => setEmailOrUsername(e.target.value)}
                  placeholder={selectedPortal === 'admin' ? 'kirengacargo@gmail.com' : 'Enter your registered email address'}
                  className="w-full pl-10 pr-4 py-3 bg-[#050915] border border-slate-700/80 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all font-sans"
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setForgotInput(emailOrUsername);
                    setForgotError(null);
                    setForgotSuccess(null);
                    setForgotStatusType('idle');
                    setForgotModalOpen(true);
                  }}
                  className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter account password"
                  className="w-full pl-10 pr-11 py-3 bg-[#050915] border border-slate-700/80 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all font-sans"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Session */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-cyan-400 focus:ring-offset-slate-900"
                />
                <span className="text-xs text-slate-300">Remember session on this device</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-5 rounded-xl bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-sm shadow-xl shadow-cyan-600/30 flex items-center justify-center gap-2 transition-all transform active:scale-[0.99] disabled:opacity-60 cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Verifying credentials...</span>
                </>
              ) : (
                <>
                  <span>Login</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>}
          {selectedPortal === 'admin' && (
            <form onSubmit={handleAdminPinSignIn} className="space-y-4 mb-5">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Administrator PIN
                <input type="password" inputMode="numeric" pattern="[0-9]{5}" maxLength={5} autoComplete="current-password" value={adminPin} onChange={(event) => setAdminPin(event.target.value.replace(/\\D/g, '').slice(0, 5))} required aria-label="Five-digit administrator PIN" placeholder="Enter 5-digit PIN" className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-center text-lg font-mono tracking-[0.5em] text-white placeholder:text-slate-500 placeholder:tracking-normal" />
              </label>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Repeat administrator PIN
                <input type="password" inputMode="numeric" pattern="[0-9]{5}" maxLength={5} autoComplete="off" value={adminPinConfirmation} onChange={(event) => setAdminPinConfirmation(event.target.value.replace(/\\D/g, '').slice(0, 5))} required aria-label="Repeat five-digit administrator PIN" placeholder="Repeat 5-digit PIN" className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-center text-lg font-mono tracking-[0.5em] text-white placeholder:text-slate-500 placeholder:tracking-normal" />
              </label>
              <button type="submit" disabled={loading} className="w-full rounded-xl bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-500 px-5 py-3.5 text-sm font-bold text-white disabled:opacity-60">
                {loading ? 'Verifying PIN…' : 'Sign in with PIN'}
              </button>
            </form>
          )}
          {selectedPortal === 'admin' && (
            <div className="mt-5">
              <div className="flex items-center gap-3 mb-4 text-[10px] uppercase tracking-widest text-slate-500 font-mono">
                <span className="h-px flex-1 bg-slate-800" />
                <span>Administrator sign-in</span>
                <span className="h-px flex-1 bg-slate-800" />
              </div>
              <button
                type="button"
                onClick={() => void handleAdminProviderSignIn('google.com')}
                disabled={loading}
                className="w-full py-3 px-5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-semibold text-sm flex items-center justify-center gap-3 transition-colors disabled:opacity-60"
              >
                <span aria-hidden="true" className="text-lg font-bold text-blue-600">G</span>
                <span>{loading ? 'Connecting…' : 'Continue with Google'}</span>
              </button>
              <p className="mt-2 text-center text-[11px] leading-relaxed text-slate-500">
                Use an identity already linked to the active administrator account.
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button type="button" onClick={() => void handleAdminProviderSignIn('apple.com')} disabled={loading} className="rounded-xl border border-slate-700 bg-black px-3 py-3 text-sm font-semibold text-white disabled:opacity-60">Continue with Apple</button>
                <button type="button" onClick={() => void handleAdminProviderSignIn('microsoft.com')} disabled={loading} className="rounded-xl border border-slate-700 bg-white px-3 py-3 text-sm font-semibold text-slate-900 disabled:opacity-60">Continue with Microsoft</button>
              </div>
            </div>
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
