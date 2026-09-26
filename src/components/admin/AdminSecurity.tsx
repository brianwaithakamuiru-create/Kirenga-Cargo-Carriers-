import React, { useState, useEffect } from 'react';
import {
  Shield,
  Key,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  FileText,
  Search,
  RefreshCw,
  Clock,
  User,
  Activity,
  Terminal,
  ShieldCheck,
  ShieldAlert,
  UserCheck,
  UserX,
  Sliders,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { db, COLLECTIONS } from '../../lib/firestoreService';
import { AuditLogEntry, UserProfile, SystemSettings } from '../../types';
import { EmptyState } from '../common/EmptyState';

interface AdminSecurityProps {
  initialSubTab?: 'users' | 'activity' | 'audit' | 'autolock' | 'password';
}

export const AdminSecurity: React.FC<AdminSecurityProps> = ({ initialSubTab = 'users' }) => {
  const { currentUser, userProfile, changePassword, linkGoogleAccount, linkAdminProvider, systemSettings } = useAuth();

  const [activeTab, setActiveTab] = useState<'users' | 'activity' | 'audit' | 'autolock' | 'password'>(initialSubTab);

  // Users state
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [userSearch, setUserSearch] = useState('');

  // Password Change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passSubmitting, setPassSubmitting] = useState(false);
  const [passSuccess, setPassSuccess] = useState<string | null>(null);
  const [passError, setPassError] = useState<string | null>(null);
  const [googleLinking, setGoogleLinking] = useState(false);
  const [googleLinkMessage, setGoogleLinkMessage] = useState<string | null>(null);
  const [googleLinkError, setGoogleLinkError] = useState<string | null>(null);
  const [identityLinking, setIdentityLinking] = useState<string | null>(null);
  const [identityLinkMessage, setIdentityLinkMessage] = useState<string | null>(null);
  const [identityLinkError, setIdentityLinkError] = useState<string | null>(null);

  // Audit Logs state
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [logSearch, setLogSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');

  // Auto-lock settings state
  const [timeoutSeconds, setTimeoutSeconds] = useState<number>(systemSettings.sessionTimeoutSeconds || 300);
  const [autoLockSaving, setAutoLockSaving] = useState(false);
  const [autoLockMsg, setAutoLockMsg] = useState<string | null>(null);

  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const data = await db.getAllUsers();
      setUsers(data);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const loadAuditLogs = async () => {
    setLoadingLogs(true);
    try {
      const data = await db.getAuditLogs();
      setLogs(data);
    } catch (err) {
      console.error('Error fetching audit logs:', err);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    loadUsers();
    loadAuditLogs();
    const unsubA = db.subscribe('activityLogs', loadAuditLogs);
    const unsubU = db.subscribe('users', loadUsers);
    return () => {
      unsubA();
      unsubU();
    };
  }, []);

  useEffect(() => {
    if (systemSettings.sessionTimeoutSeconds) {
      setTimeoutSeconds(systemSettings.sessionTimeoutSeconds);
    }
  }, [systemSettings.sessionTimeoutSeconds]);

  const handleLinkGoogleAccount = async () => {
    setGoogleLinking(true);
    setGoogleLinkMessage(null);
    setGoogleLinkError(null);
    try {
      await linkGoogleAccount();
      setGoogleLinkMessage('Google sign-in is linked to this administrator account.');
    } catch (err: any) {
      setGoogleLinkError(err.message || 'Could not link this Google account.');
    } finally {
      setGoogleLinking(false);
    }
  };

  const handleLinkAdminProvider = async (provider: 'apple.com' | 'microsoft.com') => {
    setIdentityLinking(provider);
    setIdentityLinkMessage(null);
    setIdentityLinkError(null);
    try {
      await linkAdminProvider(provider);
      setIdentityLinkMessage((provider === 'apple.com' ? 'Apple' : 'Microsoft') + ' sign-in is linked to this administrator account.');
    } catch (err: any) {
      setIdentityLinkError(err.message || 'Could not link this sign-in provider.');
    } finally {
      setIdentityLinking(null);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassSuccess(null);
    setPassError(null);

    if (newPassword.length < 6) {
      setPassError('Password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPassError('New passwords do not match.');
      return;
    }

    setPassSubmitting(true);
    try {
      await changePassword(newPassword, currentPassword || undefined);
      setPassSuccess('Administrator password changed successfully in Firebase Authentication!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      loadAuditLogs();
    } catch (err: any) {
      setPassError(err.message || 'Failed to update password. You may need to re-authenticate.');
    } finally {
      setPassSubmitting(false);
    }
  };

  const handleUpdateUserStatus = async (
    targetUser: UserProfile,
    newStatus: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'LOCKED'
  ) => {
    try {
      await db.updateUserProfile(targetUser.uid, {
        status: newStatus,
        failedLoginAttempts: newStatus === 'ACTIVE' ? 0 : targetUser.failedLoginAttempts,
        updatedAt: new Date().toISOString(),
      });

      await db.logAudit({
        actorUid: userProfile?.uid,
        actorRole: userProfile?.role || 'ADMIN',
        action: `USER_STATUS_${newStatus}`,
        targetUid: targetUser.uid,
        details: `Updated workforce status for ${targetUser.fullName} (${targetUser.email}) to ${newStatus}`,
      });

      loadUsers();
      loadAuditLogs();
    } catch (err: any) {
      alert(`Error updating user: ${err.message}`);
    }
  };

  const handleSaveAutoLock = async (sec: number) => {
    setAutoLockSaving(true);
    setAutoLockMsg(null);
    try {
      setTimeoutSeconds(sec);
      await db.saveSystemSettings({
        ...systemSettings,
        sessionTimeoutSeconds: sec,
      });

      await db.logAudit({
        actorUid: userProfile?.uid,
        actorRole: 'ADMIN',
        action: 'SECURITY_AUTOLOCK_UPDATED',
        targetUid: userProfile?.uid,
        details: `Workplace auto-lock policy updated to ${sec} seconds of inactivity.`,
      });

      setAutoLockMsg(`Workplace auto-lock policy set to ${sec} seconds.`);
      setTimeout(() => setAutoLockMsg(null), 4000);
    } catch (err: any) {
      setAutoLockMsg(`Error saving settings: ${err.message}`);
    } finally {
      setAutoLockSaving(false);
    }
  };

  // Filtered lists
  const filteredUsers = users.filter((u) => {
    const q = userSearch.toLowerCase();
    return (
      !userSearch ||
      u.fullName?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.role?.toLowerCase().includes(q) ||
      u.department?.toLowerCase().includes(q)
    );
  });

  const filteredLogs = logs.filter((l) => {
    const q = logSearch.toLowerCase();
    const matchesSearch =
      !logSearch ||
      l.userName?.toLowerCase().includes(q) ||
      l.action?.toLowerCase().includes(q) ||
      l.details?.toLowerCase().includes(q) ||
      l.actorUid?.toLowerCase().includes(q);

    const matchesAction = actionFilter === 'ALL' || l.action === actionFilter;
    return matchesSearch && matchesAction;
  });

  const loginSecurityLogs = logs.filter((l) =>
    ['USER_LOGIN', 'USER_LOGOUT', 'ACCOUNT_LOCKED', 'PASSWORD_CHANGED', 'TEMPORARY_PASSWORD_UPDATED', 'INITIAL_ADMIN_BOOTSTRAP'].includes(
      l.action
    )
  );

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Header */}
      <div className="bg-[#0A1024]/80 p-6 rounded-2xl border border-slate-800/80">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-cyan-400" />
          <span className="text-xs font-mono uppercase text-cyan-400 font-semibold tracking-wider">
            Security Center & Sentinel Policy
          </span>
        </div>
        <h2 className="text-2xl font-bold text-white font-['Poppins'] mt-1">
          Identity, Access Governance & Immutable Audit
        </h2>
        <p className="text-slate-400 text-xs mt-1">
          Role-based workforce governance, login event monitoring, administrator credential management, and inactivity lock configuration.
        </p>
      </div>

      {/* Sub-Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
        {[
          { key: 'users', label: `Users & Permissions (${users.length})`, icon: UserCheck },
          { key: 'password', label: 'Admin Password', icon: Key },
          { key: 'activity', label: `Login Activity (${loginSecurityLogs.length})`, icon: Activity },
          { key: 'audit', label: `Audit Logs (${logs.length})`, icon: Terminal },
          { key: 'autolock', label: 'Workplace Auto-Lock', icon: Lock },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-gradient-to-r from-blue-600/30 to-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: USERS & PERMISSIONS */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-[#0A1024]/60 p-3 rounded-xl border border-slate-800">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search user, email, role, department..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
              />
            </div>
            <button
              onClick={loadUsers}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {filteredUsers.length === 0 ? (
            <EmptyState
              title="No users found"
              description="Users created by the administrator will be listed here with role and account status controls."
              icon={<User className="w-8 h-8 text-cyan-400" />}
            />
          ) : (
            <div className="space-y-3">
              {filteredUsers.map((u) => (
                <div
                  key={u.uid || u.id}
                  className="bg-[#0A1024]/80 border border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2 font-mono text-xs">
                      <span className="text-cyan-400 font-bold uppercase">{u.role}</span>
                      <span className="text-slate-500">•</span>
                      <span className="text-white font-bold font-sans text-sm">{u.fullName}</span>
                      <span className="text-slate-500">•</span>
                      <span className="text-slate-300">{u.email}</span>
                    </div>

                    <div className="text-xs text-slate-400 mt-1">
                      Dept: <span className="text-slate-200">{u.department || 'Operations'}</span>
                      {u.position && ` • Position: ${u.position}`}
                      {u.lastLoginAt && ` • Last Login: ${u.lastLoginAt.slice(0, 16)}`}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap self-end md:self-auto">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase ${
                        u.status === 'ACTIVE' || u.status === 'active'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                          : u.status === 'LOCKED' || u.status === 'locked'
                          ? 'bg-red-950 text-red-300 border border-red-500/40'
                          : 'bg-amber-950 text-amber-300 border border-amber-500/40'
                      }`}
                    >
                      {u.status}
                    </span>

                    {/* Status Action Buttons */}
                    {u.status !== 'ACTIVE' && (
                      <button
                        onClick={() => handleUpdateUserStatus(u, 'ACTIVE')}
                        className="px-2.5 py-1 rounded-lg bg-emerald-950 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 text-[11px] font-medium"
                      >
                        Activate / Unlock
                      </button>
                    )}
                    {u.status === 'ACTIVE' && (
                      <button
                        onClick={() => handleUpdateUserStatus(u, 'SUSPENDED')}
                        className="px-2.5 py-1 rounded-lg bg-amber-950 hover:bg-amber-900 border border-amber-500/40 text-amber-300 text-[11px] font-medium"
                      >
                        Suspend
                      </button>
                    )}
                    {u.status !== 'LOCKED' && (
                      <button
                        onClick={() => handleUpdateUserStatus(u, 'LOCKED')}
                        className="px-2.5 py-1 rounded-lg bg-red-950 hover:bg-red-900 border border-red-500/40 text-red-300 text-[11px] font-medium"
                      >
                        Lock
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ADMIN PASSWORD */}
      {activeTab === 'password' && (
        <div className="max-w-xl bg-[#0A1024]/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
            <Key className="w-5 h-5 text-cyan-400" />
            <div>
              <h3 className="text-base font-bold text-white font-['Poppins']">Administrator Password</h3>
              <p className="text-xs text-slate-400">Update root administrator authentication credentials</p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-3">
            <div>
              <p className="text-sm font-semibold text-white">Google sign-in</p>
              <p className="mt-1 text-xs text-slate-400">
                Link Google to this existing admin account so future Google sign-ins keep the same administrator profile.
              </p>
            </div>
            {currentUser?.providerData.some((provider) => provider.providerId === 'google.com') ? (
              <p className="text-xs text-emerald-300">Google is linked to this account.</p>
            ) : (
              <button
                type="button"
                onClick={handleLinkGoogleAccount}
                disabled={googleLinking}
                className="rounded-lg bg-white px-4 py-2 text-xs font-semibold text-slate-900 disabled:opacity-60"
              >
                {googleLinking ? 'Linking Google…' : 'Link Google account'}
              </button>
            )}
            {googleLinkMessage && <p className="text-xs text-emerald-300">{googleLinkMessage}</p>}
            {googleLinkError && <p className="text-xs text-red-300">{googleLinkError}</p>}
            <div className="flex flex-wrap gap-2 pt-1">
              {([
                { id: 'apple.com', label: 'Apple' },
                { id: 'microsoft.com', label: 'Microsoft' },
              ] as const).map((item) => {
                const linked = currentUser?.providerData.some((provider) => provider.providerId === item.id);
                return linked ? (
                  <span key={item.id} className="rounded-lg border border-emerald-500/30 px-3 py-2 text-xs text-emerald-300">{item.label} linked</span>
                ) : (
                  <button key={item.id} type="button" onClick={() => void handleLinkAdminProvider(item.id)} disabled={Boolean(identityLinking)} className="rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-200 disabled:opacity-60">
                    {identityLinking === item.id ? 'Linking…' : 'Link ' + item.label}
                  </button>
                );
              })}
            </div>
            {identityLinkMessage && <p className="text-xs text-emerald-300">{identityLinkMessage}</p>}
            {identityLinkError && <p role="alert" className="text-xs text-red-300">{identityLinkError}</p>}
            <p className="text-[11px] leading-relaxed text-slate-500">Each provider must be enabled and configured in Firebase Authentication before it can be linked or used to sign in.</p>
          </div>

          {passSuccess && (
            <div className="p-3 rounded-xl bg-emerald-950/70 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{passSuccess}</span>
            </div>
          )}

          {passError && (
            <div className="p-3 rounded-xl bg-red-950/70 border border-red-500/40 text-red-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400" />
              <span>{passError}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 mb-1 font-mono">Current Password (Verification)</label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password if prompted"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-300 mb-1 font-mono">New Password *</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono pr-10"
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

            <div>
              <label className="block text-slate-300 mb-1 font-mono">Confirm New Password *</label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={passSubmitting}
              className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold rounded-xl shadow-lg shadow-cyan-600/30 disabled:opacity-50"
            >
              {passSubmitting ? 'Updating in Firebase...' : 'Update Admin Password'}
            </button>
          </form>
        </div>
      )}

      {/* TAB 3: LOGIN & SECURITY ACTIVITY */}
      {activeTab === 'activity' && (
        <div className="space-y-4">
          <div className="bg-[#0A1024]/60 p-3 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-400 font-mono">Real-Time Authentication, Logout & Lockout Audit Events</span>
          </div>

          {loginSecurityLogs.length === 0 ? (
            <EmptyState
              title="No security events recorded"
              description="Logins, logouts, lockout triggers, and password updates will be logged here."
              icon={<Activity className="w-8 h-8 text-cyan-400" />}
            />
          ) : (
            <div className="space-y-2">
              {loginSecurityLogs.map((l) => (
                <div
                  key={l.id}
                  className="bg-[#0A1024]/80 border border-slate-800 rounded-xl p-4 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2 font-mono">
                      <span className="text-cyan-400 font-bold">{l.action}</span>
                      <span className="text-slate-500">•</span>
                      <span className="text-slate-400">{l.createdAt?.slice(0, 19)}</span>
                    </div>
                    <div className="text-slate-300 mt-1">{l.details}</div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-950 text-blue-300 border border-blue-500/30">
                    {l.actorRole || 'AUTH'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: IMMUTABLE AUDIT LOGS */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#0A1024]/60 p-3 rounded-xl border border-slate-800">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search audit actions, actors, details..."
                value={logSearch}
                onChange={(e) => setLogSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
              />
            </div>
            <button
              onClick={loadAuditLogs}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {filteredLogs.length === 0 ? (
            <EmptyState
              title="No audit entries"
              description="System administrative operations and dispatch actions will record immutable audit entries."
              icon={<Terminal className="w-8 h-8 text-cyan-400" />}
            />
          ) : (
            <div className="space-y-2">
              {filteredLogs.map((l) => (
                <div
                  key={l.id}
                  className="bg-[#0A1024]/80 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2 font-mono">
                      <span className="text-cyan-400 font-bold">{l.action}</span>
                      <span className="text-slate-500">•</span>
                      <span className="text-slate-400 font-mono text-[11px]">{l.createdAt?.slice(0, 19)}</span>
                    </div>
                    <div className="text-slate-300 mt-1 font-sans">{l.details}</div>
                  </div>
                  <div className="text-right font-mono text-[11px] text-slate-500">
                    Actor: <span className="text-slate-300">{l.actorRole || 'ADMIN'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: WORKPLACE AUTO-LOCK */}
      {activeTab === 'autolock' && (
        <div className="max-w-xl bg-[#0A1024]/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
            <Lock className="w-5 h-5 text-cyan-400" />
            <div>
              <h3 className="text-base font-bold text-white font-['Poppins']">Workplace Auto-Lock Policy</h3>
              <p className="text-xs text-slate-400">
                Configure automatic inactivity screen lock to protect company workstations
              </p>
            </div>
          </div>

          {autoLockMsg && (
            <div className="p-3 rounded-xl bg-cyan-950 border border-cyan-500/40 text-cyan-200 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-cyan-400" />
              <span>{autoLockMsg}</span>
            </div>
          )}

          <div className="space-y-3 text-xs">
            <div className="text-slate-300">
              Select inactivity duration before displaying <span className="text-cyan-300 font-bold">"Workplace Locked"</span>:
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                { sec: 20, label: '20 Seconds (High Security)' },
                { sec: 30, label: '30 Seconds (Recommended)' },
                { sec: 40, label: '40 Seconds (Standard)' },
                { sec: 60, label: '1 Minute' },
                { sec: 300, label: '5 Minutes' },
                { sec: 600, label: '10 Minutes' },
              ].map((opt) => (
                <button
                  key={opt.sec}
                  type="button"
                  onClick={() => handleSaveAutoLock(opt.sec)}
                  className={`p-3 rounded-xl text-center border font-semibold transition-all ${
                    timeoutSeconds === opt.sec
                      ? 'bg-gradient-to-br from-blue-600 to-cyan-500 text-white border-cyan-400 shadow-md shadow-cyan-600/30'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <div className="text-sm font-bold font-mono">{opt.sec}s</div>
                  <div className="text-[10px] mt-1 opacity-80">{opt.label}</div>
                </button>
              ))}
            </div>

            <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 text-slate-400 text-xs leading-relaxed space-y-1">
              <div className="text-cyan-400 font-bold font-mono uppercase text-[10px]">Sentinel Invariant:</div>
              <p>
                When locked, the active session is guarded behind the password unlock modal without destroying unsaved form data.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
