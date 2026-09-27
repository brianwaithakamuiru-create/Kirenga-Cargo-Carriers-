import React, { useEffect, useState } from 'react';
import { ArrowLeft, BriefcaseBusiness, CheckCircle2, Lock, Shield, Truck, Users, Settings2, Unlock, Loader2, KeyRound } from 'lucide-react';
import { db } from '../../lib/firestoreService';
import { CompanyLogo } from '../common/CompanyLogo';

export type WorkplaceId = 'admin' | 'driver' | 'staff';
export interface WorkplaceAccess { id: WorkplaceId; name: string; description: string; locked: boolean; updatedAt: string; }

const DEFAULT_WORKPLACES: WorkplaceAccess[] = [
  { id: 'admin', name: 'Administrator', description: 'Central Command and system administration', locked: true, updatedAt: '' },
  { id: 'driver', name: 'Driver Workplace', description: 'Fleet, trips, inspections and driver operations', locked: false, updatedAt: '' },
  { id: 'staff', name: 'Staff Workplace', description: 'Operations, cargo, customers and support work', locked: false, updatedAt: '' },
];

export const getWorkplaces = async (): Promise<WorkplaceAccess[]> => {
  try {
    const saved = await db.getAll<Partial<WorkplaceAccess>>('workplaceAccess');
    const byId = new Map(saved.map((item) => [item.id as WorkplaceId, item]));
    return DEFAULT_WORKPLACES.map((item) => ({
      ...item, ...(byId.get(item.id) || {}),
      id: item.id, name: item.name, description: item.description,
      locked: item.id === 'admin' ? true : Boolean(byId.get(item.id)?.locked ?? item.locked),
    }));
  } catch { return DEFAULT_WORKPLACES; }
};

interface WorkplaceSelectorProps { onNavigate: (view: string) => void; }

export const WorkplaceSelector: React.FC<WorkplaceSelectorProps> = ({ onNavigate }) => {
  const [workplaces, setWorkplaces] = useState<WorkplaceAccess[]>(DEFAULT_WORKPLACES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    void getWorkplaces().then((items) => { if (mounted) { setWorkplaces(items); setLoading(false); } });
    return () => { mounted = false; };
  }, []);

  const openWorkplace = (workplace: WorkplaceAccess) => {
    if (workplace.id === 'admin' || workplace.locked) { onNavigate(workplace.id); return; }
    window.sessionStorage.setItem('kcc-selected-workplace', workplace.id);
    onNavigate(workplace.id);
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 bg-[#030611] relative overflow-hidden">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[500px] rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[300px] rounded-full bg-blue-700/10 blur-3xl pointer-events-none" />
      <div className="w-full max-w-5xl relative z-10">
        <button onClick={() => onNavigate('home')} className="mb-6 inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-cyan-300"><ArrowLeft className="w-4 h-4" /> Back to Public Website</button>
        <div className="bg-[#0A1024]/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl">
          <div className="flex flex-col items-center text-center mb-9">
            <CompanyLogo size={54} variant="icon-only" /><div className="mt-4"><CompanyLogo size={38} variant="compact" /></div>
            <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-950/30 px-3 py-1.5 text-[10px] uppercase tracking-[0.22em] font-mono text-cyan-300"><BriefcaseBusiness className="w-3.5 h-3.5" /> Select Workplace</div>
            <h1 className="mt-4 text-2xl sm:text-4xl font-black text-white font-['Poppins']">Where do you want to work?</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-400">Select your Kirenga Cargo workplace. Open workplaces launch directly; locked workplaces require credentials issued by Central Administration.</p>
          </div>
          {loading ? <div className="flex items-center justify-center py-16 text-cyan-300"><Loader2 className="w-6 h-6 animate-spin" /></div> : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {workplaces.map((workplace) => {
                const locked = workplace.id === 'admin' || workplace.locked;
                const Icon = workplace.id === 'admin' ? Shield : workplace.id === 'driver' ? Truck : Users;
                return (
                  <button key={workplace.id} type="button" onClick={() => openWorkplace(workplace)} className="group text-left rounded-2xl border border-slate-800 bg-slate-950/70 hover:bg-slate-900/80 hover:border-cyan-500/40 p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-cyan-950/20">
                    <div className="flex items-start justify-between gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600/20 to-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-300"><Icon className="w-6 h-6" /></div>
                      <span className={locked ? 'inline-flex items-center gap-1 rounded-full border border-amber-500/20 bg-amber-950/30 px-2 py-1 text-[9px] font-mono uppercase text-amber-300' : 'inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-950/30 px-2 py-1 text-[9px] font-mono uppercase text-emerald-300'}>{locked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />} {locked ? 'Locked' : 'Open'}</span>
                    </div>
                    <h2 className="mt-6 text-lg font-bold text-white group-hover:text-cyan-300">{workplace.name}</h2>
                    <p className="mt-2 min-h-10 text-xs leading-relaxed text-slate-400">{workplace.description}</p>
                    <div className="mt-6 flex items-center justify-between text-xs"><span className="text-slate-500">{locked ? 'Credentials required' : 'Direct entry'}</span><span className="font-semibold text-cyan-300">{locked ? 'Sign in →' : 'Enter workplace →'}</span></div>
                  </button>
                );
              })}
            </div>
          )}
          <div className="mt-7 p-4 rounded-2xl border border-slate-800 bg-slate-950/60 text-[11px] leading-relaxed text-slate-500 flex gap-3"><CheckCircle2 className="w-4 h-4 text-cyan-500 shrink-0 mt-0.5" /><span>Workplace access is controlled from Central Command. Administrators can open or lock Driver and Staff workplaces and provision individual employee accounts from the website.</span></div>
        </div>
      </div>
    </div>
  );
};

export const WorkplaceAccessControl: React.FC = () => {
  const [workplaces, setWorkplaces] = useState<WorkplaceAccess[]>(DEFAULT_WORKPLACES);
  const [saving, setSaving] = useState<WorkplaceId | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [adminPin, setAdminPin] = useState('');
  const [pinSaving, setPinSaving] = useState(false);
  const load = async () => setWorkplaces(await getWorkplaces());
  useEffect(() => { void load(); }, []);

  const toggle = async (workplace: WorkplaceAccess) => {
    if (workplace.id === 'admin') return;
    setSaving(workplace.id);
    setMessage(null);
    try {
      const existing = await db.getById<WorkplaceAccess>('workplaceAccess', workplace.id);
      const nextLocked = !workplace.locked;
      const payload = {
        id: workplace.id,
        name: workplace.name,
        description: workplace.description,
        locked: nextLocked,
        updatedAt: new Date().toISOString(),
        updatedBy: 'admin',
      };

      if (existing) {
        await db.update('workplaceAccess', workplace.id, payload);
      } else {
        await db.add('workplaceAccess', payload);
      }

      await load();
      setMessage(workplace.name + ' is now ' + (nextLocked ? 'locked.' : 'open.'));
    } catch (error: any) {
      setMessage(error?.message || 'Unable to update workplace access.');
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="bg-[#0A1024]/80 border border-slate-800 rounded-2xl p-6">
        <div className="inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.2em] text-cyan-400"><Settings2 className="w-3.5 h-3.5" /> Workplace Access Control</div>
        <h2 className="mt-2 text-xl font-bold text-white">Open or lock workplace entry</h2>
        <p className="mt-1 text-xs text-slate-400 max-w-2xl">Open means the selector sends the user straight into the workplace. Locked means the employee must use the account and password assigned by administration.</p>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {workplaces.map((workplace) => {
            const locked = workplace.id === 'admin' || workplace.locked;
            const Icon = workplace.id === 'admin' ? Shield : workplace.id === 'driver' ? Truck : Users;
            return (
              <div key={workplace.id} className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
                <div className="flex items-center justify-between gap-3"><div className="w-10 h-10 rounded-xl bg-cyan-950/60 border border-cyan-500/20 flex items-center justify-center text-cyan-300"><Icon className="w-5 h-5" /></div><span className={locked ? 'text-amber-300 text-[10px] font-mono uppercase' : 'text-emerald-300 text-[10px] font-mono uppercase'}>{locked ? 'Locked' : 'Open'}</span></div>
                <h3 className="mt-4 font-bold text-white">{workplace.name}</h3><p className="mt-1 text-xs text-slate-500">{workplace.description}</p>
                <button type="button" disabled={workplace.id === 'admin' || saving === workplace.id} onClick={() => void toggle(workplace)} className="mt-5 w-full rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-2.5 text-xs font-semibold text-slate-200 hover:border-cyan-500/40 disabled:opacity-50 flex items-center justify-center gap-2">
                  {saving === workplace.id ? <Loader2 className="w-4 h-4 animate-spin" /> : locked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                  {workplace.id === 'admin' ? 'Always protected' : locked ? 'Open Workplace' : 'Lock Workplace'}
                </button>
              </div>
            );
          })}
        </div>
        <div className="mt-6 rounded-2xl border border-cyan-500/20 bg-cyan-950/20 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-950/70 border border-cyan-500/20 flex items-center justify-center text-cyan-300"><KeyRound className="w-5 h-5" /></div>
            <div>
              <h3 className="font-bold text-white text-sm">Administrator PIN</h3>
              <p className="text-[11px] text-slate-500">Set or replace the five-digit Admin PIN directly from the website. The PIN itself is never stored in the browser or Firestore.</p>
            </div>
          </div>
          <div className="mt-4 flex flex-col sm:flex-row gap-2">
            <input
              value={adminPin}
              onChange={(e) => setAdminPin(e.target.value.replace(/\D/g, '').slice(0, 5))}
              inputMode="numeric"
              maxLength={5}
              type="password"
              placeholder="New 5-digit PIN"
              className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-white tracking-[0.35em] focus:outline-none focus:border-cyan-400"
            />
            <button
              type="button"
              disabled={pinSaving || adminPin.length !== 5}
              onClick={async () => {
                setPinSaving(true);
                setMessage(null);
                try {
                  const token = await import('firebase/auth').then(({ getIdToken }) => getIdToken((await import('../../lib/firebase')).auth.currentUser!));
                  const response = await fetch('/api/admin-pin-config', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
                    body: JSON.stringify({ pin: adminPin }),
                  });
                  const result = await response.json().catch(() => ({}));
                  if (!response.ok || result.success !== true) throw new Error(result.error || 'Unable to update Admin PIN.');
                  setAdminPin('');
                  setMessage('Administrator PIN updated successfully from the website.');
                } catch (error: any) {
                  setMessage(error?.message || 'Unable to update Admin PIN.');
                } finally {
                  setPinSaving(false);
                }
              }}
              className="rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 px-5 py-2.5 text-xs font-bold text-white disabled:opacity-50"
            >
              {pinSaving ? 'Updating…' : 'Set Admin PIN'}
            </button>
          </div>
        </div>
        {message && <div className="mt-5 rounded-xl border border-cyan-500/20 bg-cyan-950/30 px-4 py-3 text-xs text-cyan-200">{message}</div>}
      </div>
    </div>
  );
};
