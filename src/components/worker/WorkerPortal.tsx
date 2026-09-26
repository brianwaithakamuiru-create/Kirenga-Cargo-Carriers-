import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  User,
  Building,
  CheckSquare,
  FileText,
  Bell,
  BarChart3,
  HelpCircle,
  Shield,
  LogOut,
  Clock,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Menu,
  X,
  Lock,
  RefreshCw,
  Search,
  Phone,
  Mail,
  MapPin,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../lib/firestoreService';
import { EmptyState } from '../common/EmptyState';
import { CompanyLogo } from '../common/CompanyLogo';

interface WorkerPortalProps {
  onNavigate?: (view: string) => void;
}

export const WorkerPortal: React.FC<WorkerPortalProps> = ({ onNavigate }) => {
  const { currentUser, userProfile, role, signOut, changePassword, updateProfile } = useAuth();

  type WorkerNavKey =
    | 'staff-command'
    | 'my-profile'
    | 'my-department'
    | 'assigned-work'
    | 'documents'
    | 'notifications'
    | 'reports'
    | 'support'
    | 'security';

  const [activeNav, setActiveNav] = useState<WorkerNavKey>('staff-command');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // State
  const [assignedTasks, setAssignedTasks] = useState<any[]>([]);
  const [departmentDocs, setDepartmentDocs] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);

  // Profile Form state
  const [phone, setPhone] = useState(userProfile?.phone || '');
  const [country, setCountry] = useState(userProfile?.country || 'Uganda');
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  // Password Security state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passSuccess, setPassSuccess] = useState<string | null>(null);
  const [passError, setPassError] = useState<string | null>(null);
  const [passLoading, setPassLoading] = useState(false);

  const loadWorkerData = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      // In a real system with empty database, starts with real Firestore state
      const [allDocs, allNotifs] = await Promise.all([
        db.getAll<any>('documents'),
        db.getAll<any>('notifications'),
      ]);
      const myDocs = allDocs.filter(
        (d) => d.uploadedBy === currentUser.uid || d.department === userProfile?.department
      );
      const myNotifs = allNotifs.filter(
        (n) => n.userId === currentUser.uid || n.department === userProfile?.department
      );
      setDepartmentDocs(myDocs);
      setNotifications(myNotifs);
    } catch (err) {
      console.error('Error fetching worker data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkerData();
  }, [currentUser]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileSuccess(null);
    try {
      await updateProfile({ phone, country });
      setProfileSuccess('Profile contact details updated successfully.');
      setTimeout(() => setProfileSuccess(null), 3500);
    } catch (err) {
      console.error(err);
    } finally {
      setProfileLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError(null);
    setPassSuccess(null);

    if (newPassword.length < 6) {
      setPassError('Password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPassError('Passwords do not match.');
      return;
    }

    setPassLoading(true);
    try {
      await changePassword(newPassword);
      setPassSuccess('Password successfully updated!');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPassError(err.message || 'Failed to update password.');
    } finally {
      setPassLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    if (onNavigate) onNavigate('home');
  };

  const navItems: { key: WorkerNavKey; label: string; icon: React.ComponentType<{ className?: string }>; count?: number }[] = [
    { key: 'staff-command', label: 'Staff Command', icon: Briefcase },
    { key: 'my-profile', label: 'My Profile', icon: User },
    { key: 'my-department', label: 'My Department', icon: Building },
    { key: 'assigned-work', label: 'Assigned Work', icon: CheckSquare, count: assignedTasks.length },
    { key: 'documents', label: 'Documents', icon: FileText, count: departmentDocs.length },
    { key: 'notifications', label: 'Notifications', icon: Bell, count: notifications.length },
    { key: 'reports', label: 'Reports', icon: BarChart3 },
    { key: 'support', label: 'Support', icon: HelpCircle },
    { key: 'security', label: 'Security', icon: Shield },
  ];

  return (
    <div className="min-h-screen bg-[#030712] text-[#F8FAFC] flex flex-col md:flex-row">
      {/* Mobile Top Bar */}
      <div className="md:hidden flex items-center justify-between p-4 bg-[#0A1024] border-b border-slate-800">
        <CompanyLogo size={32} variant="compact" />
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* ============================================================
          VERTICAL NAVIGATION BAR: TOP TO BOTTOM
          ============================================================ */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-40 h-screen w-64 bg-[#0A1024] border-r border-slate-800 flex flex-col justify-between transition-transform duration-200 ease-in-out ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand Banner */}
        <div className="p-4 border-b border-slate-800/80">
          <CompanyLogo size={36} variant="compact" />
        </div>

        {/* Vertical Nav List */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <div className="px-3 pb-2 text-[10px] font-mono uppercase text-slate-500 tracking-wider">
            Staff Navigation
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeNav === item.key;
            return (
              <button
                key={item.key}
                onClick={() => {
                  setActiveNav(item.key);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all group ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-600/30 to-indigo-500/20 text-cyan-300 border border-blue-500/40 font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive ? 'text-cyan-400' : 'text-slate-500 group-hover:text-slate-300'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.count !== undefined && item.count > 0 && (
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                      isActive ? 'bg-cyan-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* User Card & Logout */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/40">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xs">
              {userProfile?.fullName ? userProfile.fullName.charAt(0).toUpperCase() : 'W'}
            </div>
            <div className="overflow-hidden flex-1">
              <div className="text-xs font-semibold text-white truncate">{userProfile?.fullName || 'Worker'}</div>
              <div className="text-[10px] text-blue-400 font-mono">{userProfile?.department || 'Operations'}</div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-red-950/60 border border-slate-800 hover:border-red-500/40 text-slate-400 hover:text-red-300 text-xs font-medium flex items-center justify-center gap-2 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* ============================================================
          MAIN WORKPLACE CONTENT
          ============================================================ */}
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 overflow-y-auto">
        {/* VIEW: Staff Command */}
        {activeNav === 'staff-command' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-[#0A1024]/80 p-6 rounded-2xl border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-pulse" />
                  <span className="text-xs font-mono uppercase text-blue-400 font-semibold tracking-wider">
                    Staff Workplace Active
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-white font-['Poppins'] mt-1">Staff Command Center</h2>
                <p className="text-slate-400 text-xs mt-1">
                  Welcome, {userProfile?.fullName}. Department: {userProfile?.department || 'Operations'}.
                </p>
              </div>
              <button
                onClick={loadWorkerData}
                className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-[#0A1024]/80 border border-slate-800/80 rounded-2xl p-5">
                <div className="text-xs text-slate-400">Department</div>
                <div className="text-xl font-bold text-blue-400 font-mono mt-1">
                  {userProfile?.department || 'Operations'}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">{userProfile?.jobTitle || 'Logistics Staff'}</div>
              </div>

              <div className="bg-[#0A1024]/80 border border-slate-800/80 rounded-2xl p-5">
                <div className="text-xs text-slate-400">Assigned Tasks</div>
                <div className="text-3xl font-bold text-white font-mono mt-1">{assignedTasks.length}</div>
                <div className="text-[11px] text-slate-500 mt-1">Active departmental work</div>
              </div>

              <div className="bg-[#0A1024]/80 border border-slate-800/80 rounded-2xl p-5">
                <div className="text-xs text-slate-400">Department Documents</div>
                <div className="text-3xl font-bold text-cyan-400 font-mono mt-1">{departmentDocs.length}</div>
                <div className="text-[11px] text-slate-500 mt-1">Authorized access files</div>
              </div>
            </div>

            <div className="bg-[#0A1024]/80 border border-slate-800/80 rounded-2xl p-6 shadow-xl">
              <h3 className="text-base font-bold text-white font-['Poppins'] mb-3">Workplace Noticeboard</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                You are logged into the authorized Kirenga Cargo Carriers workplace. Role permissions restrict access exclusively to your designated department and company tasks. Contact administration for elevated permissions.
              </p>
            </div>
          </div>
        )}

        {/* VIEW: My Profile */}
        {activeNav === 'my-profile' && (
          <div className="space-y-6 animate-fadeIn max-w-2xl">
            <div className="bg-[#0A1024]/80 p-6 rounded-2xl border border-slate-800/80">
              <h2 className="text-2xl font-bold text-white font-['Poppins']">Staff Profile</h2>
              <p className="text-slate-400 text-xs mt-1">Employee details and authorized department records.</p>
            </div>

            {profileSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-950/70 border border-emerald-500/40 text-emerald-200 text-xs">
                {profileSuccess}
              </div>
            )}

            <div className="bg-[#0A1024]/80 border border-slate-800/80 rounded-2xl p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">Full Name</div>
                  <div className="text-white font-semibold mt-1">{userProfile?.fullName}</div>
                </div>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">Username</div>
                  <div className="text-blue-400 font-mono mt-1">@{userProfile?.username}</div>
                </div>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">Employee ID</div>
                  <div className="text-cyan-400 font-mono mt-1">{userProfile?.employeeId || 'KCC-EMP'}</div>
                </div>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">Department</div>
                  <div className="text-white mt-1">{userProfile?.department || 'Operations'}</div>
                </div>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">Email</div>
                  <div className="text-white mt-1 truncate">{userProfile?.email}</div>
                </div>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">Status</div>
                  <div className="text-emerald-400 font-mono mt-1 capitalize">{userProfile?.status}</div>
                </div>
              </div>

              <form onSubmit={handleUpdateProfile} className="space-y-4 pt-4 border-t border-slate-800">
                <div className="text-xs font-semibold text-slate-300 font-mono uppercase tracking-wider">
                  Contact Information
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Phone Number</label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Country</label>
                    <input
                      type="text"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={profileLoading}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow-md"
                  >
                    {profileLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* VIEW: My Department */}
        {activeNav === 'my-department' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-[#0A1024]/80 p-6 rounded-2xl border border-slate-800/80">
              <h2 className="text-2xl font-bold text-white font-['Poppins']">Department Overview</h2>
              <p className="text-slate-400 text-xs mt-1">
                Assigned Unit: <strong>{userProfile?.department || 'Operations'}</strong>
              </p>
            </div>
            <div className="bg-[#0A1024]/80 border border-slate-800 rounded-2xl p-6 text-xs text-slate-300 space-y-3">
              <div>Job Title: <strong className="text-white">{userProfile?.jobTitle || 'Logistics Coordinator'}</strong></div>
              <div>Station: <strong className="text-white">{userProfile?.assignedLocation || 'Kampala Office'}</strong></div>
              <div>Operating Countries: <strong className="text-cyan-400">Uganda, Tanzania, Kenya, Rwanda, Congo</strong></div>
            </div>
          </div>
        )}

        {/* VIEW: Assigned Work */}
        {activeNav === 'assigned-work' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-[#0A1024]/80 p-6 rounded-2xl border border-slate-800/80">
              <h2 className="text-2xl font-bold text-white font-['Poppins']">Assigned Work & Tasks</h2>
              <p className="text-slate-400 text-xs mt-1">Operational tasks and freight coordination items.</p>
            </div>
            <EmptyState
              title="No work currently assigned"
              description="Your supervisor or administrator has not assigned active tasks to your queue."
              icon={<CheckSquare className="w-7 h-7 text-cyan-400" />}
            />
          </div>
        )}

        {/* VIEW: Documents */}
        {activeNav === 'documents' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-[#0A1024]/80 p-6 rounded-2xl border border-slate-800/80">
              <h2 className="text-2xl font-bold text-white font-['Poppins']">Department Documents</h2>
              <p className="text-slate-400 text-xs mt-1">Authorized company files and operating manuals.</p>
            </div>
            <EmptyState
              title="No documents available"
              description="Authorized documents for your department will appear here."
              icon={<FileText className="w-7 h-7 text-cyan-400" />}
            />
          </div>
        )}

        {/* VIEW: Notifications */}
        {activeNav === 'notifications' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-[#0A1024]/80 p-6 rounded-2xl border border-slate-800/80">
              <h2 className="text-2xl font-bold text-white font-['Poppins']">Staff Notifications</h2>
              <p className="text-slate-400 text-xs mt-1">Department broadcasts and announcements.</p>
            </div>
            <EmptyState
              title="No notifications"
              description="No recent notices for your workplace queue."
              icon={<Bell className="w-7 h-7 text-cyan-400" />}
            />
          </div>
        )}

        {/* VIEW: Reports */}
        {activeNav === 'reports' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-[#0A1024]/80 p-6 rounded-2xl border border-slate-800/80">
              <h2 className="text-2xl font-bold text-white font-['Poppins']">Department Reports</h2>
              <p className="text-slate-400 text-xs mt-1">Performance summaries and shipment milestones.</p>
            </div>
            <EmptyState
              title="No report records available"
              description="Departmental KPI reports will be compiled here."
              icon={<BarChart3 className="w-7 h-7 text-cyan-400" />}
            />
          </div>
        )}

        {/* VIEW: Support */}
        {activeNav === 'support' && (
          <div className="space-y-6 animate-fadeIn max-w-2xl">
            <div className="bg-[#0A1024]/80 p-6 rounded-2xl border border-slate-800/80">
              <h2 className="text-2xl font-bold text-white font-['Poppins']">Staff Support</h2>
              <p className="text-slate-400 text-xs mt-1">Internal IT and administration support channels.</p>
            </div>
            <div className="bg-[#0A1024]/80 border border-slate-800 rounded-2xl p-6 space-y-4 text-xs">
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl">
                <div className="text-white font-semibold">IT & System Administrator Desk</div>
                <div className="text-blue-400 font-mono mt-1">operations@kerengacargo.com</div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW: Security */}
        {activeNav === 'security' && (
          <div className="space-y-6 animate-fadeIn max-w-md">
            <div className="bg-[#0A1024]/80 p-6 rounded-2xl border border-slate-800/80">
              <h2 className="text-2xl font-bold text-white font-['Poppins']">Account Security</h2>
              <p className="text-slate-400 text-xs mt-1">Update your personal account password.</p>
            </div>

            {passSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-950/70 border border-emerald-500/40 text-emerald-200 text-xs">
                {passSuccess}
              </div>
            )}
            {passError && (
              <div className="p-3.5 rounded-xl bg-red-950/70 border border-red-500/40 text-red-200 text-xs">
                {passError}
              </div>
            )}

            <form onSubmit={handleChangePassword} className="bg-[#0A1024]/80 border border-slate-800 rounded-2xl p-6 space-y-4">
              <div>
                <label className="block text-xs text-slate-300 mb-1.5 font-mono">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-400 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1.5 font-mono">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-400 font-mono"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={passLoading}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-lg shadow-blue-600/30 disabled:opacity-50"
              >
                {passLoading ? 'Updating Password...' : 'Change Password'}
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
};
