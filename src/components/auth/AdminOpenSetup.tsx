import React, { useState } from 'react';
import { Shield, ArrowRight, Loader2, KeyRound } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { CompanyLogo } from '../common/CompanyLogo';

interface Props { onNavigate: (view: string) => void; }

export const AdminOpenSetup: React.FC<Props> = ({ onNavigate }) => {
  const { currentUser, userProfile, signInWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const continueWithAuthorizedIdentity = async () => {
    setLoading(true);
    setError(null);
    try {
      const profile = currentUser
        ? userProfile
        : await signInWithGoogle();

      if (!profile) throw new Error('Administrator profile could not be loaded.');
      if (profile.mustChangePassword) onNavigate('change-password');
      else onNavigate('admin');
    } catch (err: any) {
      setError(err?.message || 'Administrator identity verification failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 bg-[#030611]">
      <div className="w-full max-w-md rounded-3xl border border-cyan-500/20 bg-[#0A1024]/95 p-8 shadow-2xl">
        <div className="flex justify-center"><CompanyLogo size={54} variant="icon-only" /></div>
        <div className="mt-5 text-center">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-cyan-950/70 border border-cyan-500/30 flex items-center justify-center text-cyan-300">
            <Shield className="w-7 h-7" />
          </div>
          <div className="mt-4 text-[10px] font-mono uppercase tracking-[0.25em] text-cyan-400">Administrator Workplace</div>
          <h1 className="mt-2 text-2xl font-black text-white">Welcome to Central Command</h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-400">
            The Administrator workplace is open for setup. No administrator password is requested at this stage.
          </p>
        </div>

        {error && <div className="mt-5 rounded-xl border border-red-500/30 bg-red-950/40 p-3 text-xs text-red-200">{error}</div>}

        <button
          type="button"
          disabled={loading}
          onClick={() => void continueWithAuthorizedIdentity()}
          className="mt-6 w-full rounded-xl bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-500 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-cyan-900/30 disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
          {loading ? 'Opening secure setup…' : 'Continue to Administrator Setup'}
          {!loading && <ArrowRight className="w-4 h-4" />}
        </button>

        <p className="mt-4 text-center text-[11px] leading-relaxed text-slate-500">
          An authorized administrator identity is still required before protected company data can be changed. This prevents an open workplace from becoming an open database.
        </p>
      </div>
    </div>
  );
};
