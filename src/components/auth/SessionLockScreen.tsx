import React, { useState } from 'react';
import { Shield, Lock, ArrowRight, LogOut, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const SessionLockScreen: React.FC = () => {
  const { userProfile, unlockSession, signOut } = useAuth();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError('Please enter your password to unlock your session.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const ok = await unlockSession(password);
      if (!ok) {
        setError('Incorrect password. Please try again or log out.');
      }
    } catch (err: any) {
      setError(err.message || 'Verification failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#030611]/95 backdrop-blur-xl p-4">
      <div className="w-full max-w-md bg-[#0A1024] border border-slate-800/80 rounded-2xl p-8 shadow-2xl shadow-cyan-950/40 relative">
        {/* Glowing badge */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 mx-auto flex items-center justify-center text-white shadow-xl shadow-cyan-500/20 mb-6">
          <Lock className="w-8 h-8" />
        </div>

        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-950/80 border border-cyan-500/30 text-cyan-400 text-xs font-mono mb-3">
            <Shield className="w-3.5 h-3.5" />
            <span>SESSION INACTIVITY LOCK</span>
          </div>
          <h2 className="text-2xl font-bold text-white font-['Poppins']">Workplace Locked</h2>
          <p className="text-slate-400 text-xs mt-1">
            Session timed out due to inactivity policy. Confirm password to resume.
          </p>
        </div>

        {/* User Card */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-600 to-blue-700 flex items-center justify-center text-white font-bold text-base">
            {userProfile?.fullName ? userProfile.fullName.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="overflow-hidden">
            <div className="text-sm font-semibold text-white truncate">{userProfile?.fullName || 'Authenticated User'}</div>
            <div className="text-xs text-slate-400 truncate">{userProfile?.email}</div>
            <div className="text-[10px] font-mono uppercase text-cyan-400 font-semibold mt-0.5">
              Role: {userProfile?.role}
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-950/60 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleUnlock} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password to unlock"
                className="w-full px-4 py-2.5 bg-slate-950/80 border border-slate-700 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-semibold text-sm shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {submitting ? (
              <span>Verifying credentials...</span>
            ) : (
              <>
                <span>Unlock Session</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs">
          <button
            onClick={() => signOut()}
            className="text-slate-400 hover:text-red-400 flex items-center gap-1.5 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Switch Account / Sign Out</span>
          </button>
          <span className="text-slate-500 text-[11px]">Kirenga Security Sentinel</span>
        </div>
      </div>
    </div>
  );
};
