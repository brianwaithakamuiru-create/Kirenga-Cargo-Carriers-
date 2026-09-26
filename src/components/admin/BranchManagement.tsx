import React, { useEffect, useMemo, useState } from 'react';
import { Building2, MapPin, Phone, Mail, Plus, Search, Pencil, Archive, RotateCcw, RefreshCw, X, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { COLLECTIONS, db } from '../../lib/firestoreService';

type BranchStatus = 'ACTIVE' | 'INACTIVE';

interface CompanyBranch {
  id: string;
  name: string;
  code: string;
  country: string;
  city: string;
  address?: string;
  phone?: string;
  email?: string;
  notes?: string;
  status: BranchStatus;
  createdAt: string;
  updatedAt: string;
}

type BranchForm = Omit<CompanyBranch, 'id' | 'createdAt' | 'updatedAt'>;

const emptyForm: BranchForm = {
  name: '',
  code: '',
  country: '',
  city: '',
  address: '',
  phone: '',
  email: '',
  notes: '',
  status: 'ACTIVE',
};

export const BranchManagement: React.FC = () => {
  const { currentUser, userProfile } = useAuth();
  const [branches, setBranches] = useState<CompanyBranch[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [queryText, setQueryText] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | BranchStatus>('ALL');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<CompanyBranch | null>(null);
  const [form, setForm] = useState<BranchForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [notice, setNotice] = useState('');

  const loadBranches = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const records = await db.getAll<CompanyBranch>(COLLECTIONS.BRANCHES);
      setBranches(records);
    } catch {
      setLoadError('Branches could not be loaded. Check the connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadBranches();
    const unsubscribe = db.subscribe(COLLECTIONS.BRANCHES, loadBranches);
    return unsubscribe;
  }, []);

  const visibleBranches = useMemo(() => {
    const term = queryText.trim().toLowerCase();
    return branches.filter((branch) => {
      const matchesStatus = statusFilter === 'ALL' || branch.status === statusFilter;
      const matchesText = !term || [branch.name, branch.code, branch.country, branch.city, branch.address]
        .some((value) => value?.toLowerCase().includes(term));
      return matchesStatus && matchesText;
    });
  }, [branches, queryText, statusFilter]);

  const startCreate = () => {
    setEditingBranch(null);
    setForm(emptyForm);
    setFormError('');
    setDialogOpen(true);
  };

  const startEdit = (branch: CompanyBranch) => {
    setEditingBranch(branch);
    setForm({
      name: branch.name,
      code: branch.code,
      country: branch.country,
      city: branch.city,
      address: branch.address || '',
      phone: branch.phone || '',
      email: branch.email || '',
      notes: branch.notes || '',
      status: branch.status,
    });
    setFormError('');
    setDialogOpen(true);
  };

  const submitBranch = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError('');
    const name = form.name.trim();
    const code = form.code.trim().toUpperCase();
    const country = form.country.trim();
    const city = form.city.trim();
    if (!name || !code || !country || !city) {
      setFormError('Enter the branch name, code, country, and city.');
      return;
    }
    if (!/^[A-Z0-9-]{2,16}$/.test(code)) {
      setFormError('Use 2–16 letters, numbers, or hyphens for the branch code.');
      return;
    }
    const duplicate = branches.some((branch) =>
      branch.id !== editingBranch?.id && branch.code.toUpperCase() === code
    );
    if (duplicate) {
      setFormError('That branch code is already in use.');
      return;
    }

    setSaving(true);
    const details: BranchForm = {
      ...form,
      name,
      code,
      country,
      city,
      address: form.address?.trim() || '',
      phone: form.phone?.trim() || '',
      email: form.email?.trim() || '',
      notes: form.notes?.trim() || '',
    };
    try {
      let recordId = editingBranch?.id;
      if (editingBranch) {
        await db.update<CompanyBranch>(COLLECTIONS.BRANCHES, editingBranch.id, details);
      } else {
        const saved = await db.add<CompanyBranch>(COLLECTIONS.BRANCHES, {
          ...details,
          createdBy: currentUser?.uid || '',
        } as CompanyBranch);
        recordId = saved.id;
      }
      try {
        await db.logAudit({
          actorUid: userProfile?.uid,
          actorRole: userProfile?.role || 'ADMIN',
          action: editingBranch ? 'BRANCH_UPDATED' : 'BRANCH_CREATED',
          targetUid: recordId,
          details: editingBranch
            ? 'Updated branch ' + code + ' (' + name + ').'
            : 'Registered branch ' + code + ' (' + name + ') in ' + city + ', ' + country + '.',
        });
      } catch (auditError) {
        console.error('Branch saved but audit record failed:', auditError);
      }
      setDialogOpen(false);
      setNotice(editingBranch ? 'Branch details updated.' : 'Branch registered.');
      window.setTimeout(() => setNotice(''), 4000);
      await loadBranches();
    } catch (error: any) {
      setFormError(error?.message || 'The branch could not be saved. Check access and try again.');
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (branch: CompanyBranch) => {
    const nextStatus: BranchStatus = branch.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    if (nextStatus === 'INACTIVE' && !window.confirm('Deactivate ' + branch.name + '? It will remain in the branch record.')) return;
    try {
      await db.update<CompanyBranch>(COLLECTIONS.BRANCHES, branch.id, { status: nextStatus });
      try {
        await db.logAudit({
          actorUid: userProfile?.uid,
          actorRole: userProfile?.role || 'ADMIN',
          action: nextStatus === 'ACTIVE' ? 'BRANCH_REACTIVATED' : 'BRANCH_DEACTIVATED',
          targetUid: branch.id,
          details: (nextStatus === 'ACTIVE' ? 'Reactivated ' : 'Deactivated ') + branch.code + ' (' + branch.name + ').',
        });
      } catch (auditError) {
        console.error('Branch status changed but audit record failed:', auditError);
      }
      setNotice(nextStatus === 'ACTIVE' ? 'Branch reactivated.' : 'Branch deactivated.');
      window.setTimeout(() => setNotice(''), 4000);
      await loadBranches();
    } catch (error: any) {
      setLoadError(error?.message || 'Branch status could not be changed. Check access and try again.');
    }
  };

  const activeCount = branches.filter((branch) => branch.status === 'ACTIVE').length;

  return (
    <section className="space-y-6">
      {notice && (
        <div role="status" className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-950/30 px-4 py-3 text-sm text-emerald-200">
          <CheckCircle2 className="h-4 w-4" />{notice}
        </div>
      )}
      <header className="flex flex-col gap-4 rounded-2xl border border-slate-800 bg-[#0A1024]/85 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-mono uppercase tracking-[0.18em] text-cyan-300">
            <Building2 className="h-4 w-4" />Company Network
          </div>
          <h1 className="text-2xl font-bold text-white">Branches & Offices</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-400">
            Maintain the company’s actual offices and operating locations. New branches appear only after an administrator registers them.
          </p>
        </div>
        <button onClick={startCreate} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-cyan-500 px-4 py-3 text-sm font-bold text-slate-950 hover:bg-cyan-400">
          <Plus className="h-4 w-4" />Register branch
        </button>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
          <div className="text-xs uppercase tracking-wider text-slate-500">Branches on record</div>
          <div className="mt-2 text-2xl font-semibold text-white">{branches.length}</div>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
          <div className="text-xs uppercase tracking-wider text-slate-500">Active locations</div>
          <div className="mt-2 text-2xl font-semibold text-cyan-300">{activeCount}</div>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
          <div className="text-xs uppercase tracking-wider text-slate-500">Inactive locations</div>
          <div className="mt-2 text-2xl font-semibold text-slate-300">{branches.length - activeCount}</div>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <label className="flex flex-1 items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/70 px-3 py-2.5">
          <Search className="h-4 w-4 text-slate-500" />
          <span className="sr-only">Search company branches</span>
          <input value={queryText} onChange={(event) => setQueryText(event.target.value)} placeholder="Search name, code, country, or city" className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-600" />
        </label>
        <select aria-label="Filter branch status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)} className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-sm text-slate-200">
          <option value="ALL">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
        <button onClick={() => void loadBranches()} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-sm text-slate-300 hover:text-white">
          <RefreshCw className="h-4 w-4" />Refresh
        </button>
      </div>

      {loadError && (
        <div role="alert" className="rounded-xl border border-rose-500/30 bg-rose-950/30 p-4 text-sm text-rose-200">{loadError}</div>
      )}

      {loading ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-10 text-center text-sm text-slate-400">Loading branches from Firestore…</div>
      ) : visibleBranches.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/50 px-6 py-12 text-center">
          <Building2 className="mx-auto h-9 w-9 text-slate-500" />
          <h2 className="mt-4 text-lg font-semibold text-white">{branches.length === 0 ? 'No company branches registered.' : 'No branches match this search.'}</h2>
          <p className="mx-auto mt-2 max-w-lg text-sm text-slate-400">
            {branches.length === 0 ? 'Register an actual office or operating branch to build the company network.' : 'Change the search or status filter to see other branch records.'}
          </p>
          {branches.length === 0 && <button onClick={startCreate} className="mt-5 rounded-xl bg-cyan-500 px-4 py-2.5 text-sm font-bold text-slate-950">Register the first branch</button>}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visibleBranches.map((branch) => (
            <article key={branch.id} className="rounded-2xl border border-slate-800 bg-[#0A1024]/75 p-5 shadow-lg shadow-black/10">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="truncate text-lg font-semibold text-white">{branch.name}</h2>
                    <span className="rounded-md border border-slate-700 px-2 py-0.5 text-[10px] font-mono text-cyan-300">{branch.code}</span>
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-sm text-slate-300">
                    <MapPin className="h-4 w-4 shrink-0 text-cyan-400" />{branch.city}, {branch.country}
                  </div>
                </div>
                <span className={branch.status === 'ACTIVE' ? 'rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold text-emerald-300' : 'rounded-full bg-slate-800 px-2.5 py-1 text-[10px] font-semibold text-slate-400'}>{branch.status}</span>
              </div>
              {branch.address && <p className="mt-3 text-sm text-slate-400">{branch.address}</p>}
              <div className="mt-4 space-y-2 border-t border-slate-800 pt-4 text-xs text-slate-300">
                {branch.phone && <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-slate-500" />{branch.phone}</div>}
                {branch.email && <div className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-slate-500" />{branch.email}</div>}
                {branch.notes && <p className="leading-relaxed text-slate-400">{branch.notes}</p>}
              </div>
              <div className="mt-5 flex gap-2">
                <button onClick={() => startEdit(branch)} className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-200 hover:border-cyan-500/50">
                  <Pencil className="h-3.5 w-3.5" />Edit
                </button>
                <button onClick={() => void toggleStatus(branch)} className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-300 hover:border-amber-500/50 hover:text-amber-200">
                  {branch.status === 'ACTIVE' ? <Archive className="h-3.5 w-3.5" /> : <RotateCcw className="h-3.5 w-3.5" />}
                  {branch.status === 'ACTIVE' ? 'Deactivate' : 'Reactivate'}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {dialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/80 p-4 backdrop-blur-sm">
          <div role="dialog" aria-modal="true" aria-labelledby="branch-dialog-title" className="my-auto max-h-[95vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-700 bg-[#0A1024] p-5 shadow-2xl sm:p-7">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 id="branch-dialog-title" className="text-xl font-bold text-white">{editingBranch ? 'Edit company branch' : 'Register company branch'}</h2>
                <p className="mt-1 text-xs text-slate-400">Only the details entered here will be saved to the company network.</p>
              </div>
              <button onClick={() => setDialogOpen(false)} aria-label="Close branch form" className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={submitBranch} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-1.5 text-xs text-slate-300">Branch name *
                  <input required maxLength={120} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white" />
                </label>
                <label className="space-y-1.5 text-xs text-slate-300">Branch code *
                  <input required maxLength={16} value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value.toUpperCase() })} placeholder="For example: NBO-01" className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm font-mono text-white" />
                </label>
                <label className="space-y-1.5 text-xs text-slate-300">Country *
                  <input required maxLength={80} value={form.country} onChange={(event) => setForm({ ...form, country: event.target.value })} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white" />
                </label>
                <label className="space-y-1.5 text-xs text-slate-300">City *
                  <input required maxLength={120} value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white" />
                </label>
                <label className="space-y-1.5 text-xs text-slate-300 sm:col-span-2">Office address
                  <input maxLength={240} value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white" />
                </label>
                <label className="space-y-1.5 text-xs text-slate-300">Phone
                  <input type="tel" maxLength={40} value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white" />
                </label>
                <label className="space-y-1.5 text-xs text-slate-300">Email
                  <input type="email" maxLength={254} value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white" />
                </label>
              </div>
              <label className="block space-y-1.5 text-xs text-slate-300">Operating notes
                <textarea rows={3} maxLength={1000} value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white" />
              </label>
              {formError && <p role="alert" className="rounded-lg border border-rose-500/30 bg-rose-950/30 px-3 py-2 text-sm text-rose-200">{formError}</p>}
              <div className="flex justify-end gap-2 border-t border-slate-800 pt-4">
                <button type="button" onClick={() => setDialogOpen(false)} className="rounded-lg border border-slate-700 px-4 py-2.5 text-sm text-slate-300">Cancel</button>
                <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-4 py-2.5 text-sm font-bold text-slate-950 disabled:opacity-50">
                  {saving ? 'Saving…' : editingBranch ? 'Save changes' : 'Register branch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};
