import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Shield,
  Compass,
  Briefcase,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Key,
  Trash2,
  Edit2,
  Eye,
  Building,
  Plus,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Lock,
  EyeOff,
  Truck,
  RefreshCw,
  Unlock,
  Send,
  FileBadge,
  UserCheck,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../lib/firestoreService';
import { createSecondaryAuthUser } from '../../lib/firebase';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { UserProfile, Department, Vehicle, Driver } from '../../types';

interface WorkforceManagementProps {
  initialTab?: 'directory' | 'add-staff' | 'add-driver';
  onNavigate?: (view: string) => void;
}

export const WorkforceManagement: React.FC<WorkforceManagementProps> = ({
  initialTab = 'directory',
  onNavigate,
}) => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'directory' | 'add-staff' | 'add-driver'>(initialTab);

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'driver' | 'staff'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'suspended' | 'locked'>('all');

  // Add Staff Form State (/admin/workforce/add-staff)
  const [staffFullName, setStaffFullName] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffPhone, setStaffPhone] = useState('');
  const [staffUsername, setStaffUsername] = useState('');
  const [staffDepartment, setStaffDepartment] = useState('Operations');
  const [staffPosition, setStaffPosition] = useState('Logistics Coordinator');
  const [staffTempPassword, setStaffTempPassword] = useState('');
  const [staffStatus, setStaffStatus] = useState<'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'LOCKED'>('ACTIVE');
  const [showStaffPassword, setShowStaffPassword] = useState(false);
  const [staffSubmitting, setStaffSubmitting] = useState(false);
  const [staffError, setStaffError] = useState<string | null>(null);
  const [staffSuccess, setStaffSuccess] = useState<string | null>(null);

  // Add Driver Form State (/admin/workforce/add-driver)
  const [driverFullName, setDriverFullName] = useState('');
  const [driverEmail, setDriverEmail] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [driverUsername, setDriverUsername] = useState('');
  const [driverRefNumber, setDriverRefNumber] = useState('');
  const [driverLicenseInfo, setDriverLicenseInfo] = useState('Class CE (Heavy Articulated & Trailer)');
  const [driverLicenseExpiry, setDriverLicenseExpiry] = useState('');
  const [driverAssignedVehicle, setDriverAssignedVehicle] = useState('');
  const [driverAssignedRoute, setDriverAssignedRoute] = useState('Northern Corridor (Mombasa - Kampala - Kigali)');
  const [driverEmergencyContact, setDriverEmergencyContact] = useState('');
  const [driverEmploymentStatus, setDriverEmploymentStatus] = useState('FULL_TIME');
  const [driverTempPassword, setDriverTempPassword] = useState('');
  const [driverStatus, setDriverStatus] = useState<'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'LOCKED'>('ACTIVE');
  const [showDriverPassword, setShowDriverPassword] = useState(false);
  const [driverSubmitting, setDriverSubmitting] = useState(false);
  const [driverError, setDriverError] = useState<string | null>(null);
  const [driverSuccess, setDriverSuccess] = useState<string | null>(null);

  // Department Modal State
  const [deptModalOpen, setDeptModalOpen] = useState(false);
  const [newDeptName, setNewDeptName] = useState('');
  const [newDeptDesc, setNewDeptDesc] = useState('');
  const [deptSubmitting, setDeptSubmitting] = useState(false);

  // User Actions State
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [resetPassModalOpen, setResetPassModalOpen] = useState(false);
  const [resetPassSuccess, setResetPassSuccess] = useState<string | null>(null);
  const [resetPassError, setResetPassError] = useState<string | null>(null);
  const [resetPassSubmitting, setResetPassSubmitting] = useState(false);

  // Edit User Form State
  const [editFullName, setEditFullName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editDepartment, setEditDepartment] = useState('');
  const [editPosition, setEditPosition] = useState('');
  const [editAssignedVehicle, setEditAssignedVehicle] = useState('');
  const [editAssignedRoute, setEditAssignedRoute] = useState('');
  const [editEmergencyContact, setEditEmergencyContact] = useState('');
  const [editStatus, setEditStatus] = useState<string>('ACTIVE');
  const [editSubmitting, setEditSubmitting] = useState(false);

  // Action status progress
  const [actionSubmitting, setActionSubmitting] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [u, d, v] = await Promise.all([
        db.getAllUsers(),
        db.getDepartments(),
        db.getAll<Vehicle>('vehicles'),
      ]);
      setUsers(u);
      setDepartments(d);
      setVehicles(v);
    } catch (err) {
      console.error('Error loading workforce data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const unsub = db.subscribe('users', loadData);
    return () => unsub();
  }, []);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Handle Add Staff Submission
  const handleAddStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStaffError(null);
    setStaffSuccess(null);

    const cleanName = staffFullName.trim();
    const cleanEmail = staffEmail.trim().toLowerCase();
    const cleanPhone = staffPhone.trim();
    const cleanUsername = staffUsername.trim().toLowerCase().replace(/\s+/g, '');
    const cleanDept = staffDepartment.trim();
    const cleanPos = staffPosition.trim();
    const cleanPass = staffTempPassword.trim();

    if (!cleanName || !cleanEmail || !cleanPhone || !cleanUsername || !cleanDept || !cleanPos || !cleanPass) {
      setStaffError('Please complete all required fields.');
      return;
    }

    if (cleanPass.length < 6) {
      setStaffError('Temporary password must be at least 6 characters long.');
      return;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setStaffError('Please enter a valid corporate email address.');
      return;
    }

    // Check duplicate username
    const duplicateUsername = users.find((u) => u.username?.toLowerCase() === cleanUsername);
    if (duplicateUsername) {
      setStaffError(`Username "${cleanUsername}" is already taken by another workforce member.`);
      return;
    }

    // Check duplicate email
    const duplicateEmail = users.find((u) => u.email?.toLowerCase() === cleanEmail);
    if (duplicateEmail) {
      setStaffError(`Email address "${cleanEmail}" is already registered in the system.`);
      return;
    }

    setStaffSubmitting(true);
    try {
      // 1. Create Firebase Authentication account via secondary app
      const authUser = await createSecondaryAuthUser(cleanEmail, cleanPass);

      // 2. Prepare Staff Firestore user document
      const now = new Date().toISOString();
      const newStaffDoc: UserProfile = {
        id: authUser.uid,
        uid: authUser.uid,
        fullName: cleanName,
        username: cleanUsername,
        email: cleanEmail,
        phone: cleanPhone,
        role: 'STAFF',
        department: cleanDept,
        position: cleanPos,
        jobTitle: cleanPos,
        employeeId: `KCC-STF-${Date.now().toString().slice(-4)}`,
        status: staffStatus,
        mustChangePassword: true,
        failedLoginAttempts: 0,
        createdBy: currentUser?.uid || 'admin',
        createdAt: now,
        updatedAt: now,
      };

      // 3. Save to Firestore
      await db.saveUserProfile(newStaffDoc);

      // 4. Log Audit Event
      await db.logAudit({
        actorUid: currentUser?.uid || 'admin',
        actorRole: 'ADMIN',
        action: 'USER_CREATED',
        targetUid: authUser.uid,
        details: `Created STAFF account for ${cleanName} (${cleanEmail}) in department ${cleanDept}`,
      });

      setStaffSuccess(
        `Staff account successfully created! Temporary password assigned. User will be prompted to choose a permanent password on first login.`
      );

      // Reset form
      setStaffFullName('');
      setStaffEmail('');
      setStaffPhone('');
      setStaffUsername('');
      setStaffTempPassword('');

      await loadData();
    } catch (err: any) {
      setStaffError(err.message || 'Failed to create staff account. Please verify credentials.');
    } finally {
      setStaffSubmitting(false);
    }
  };

  // Handle Add Driver Submission
  const handleAddDriverSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDriverError(null);
    setDriverSuccess(null);

    const cleanName = driverFullName.trim();
    const cleanEmail = driverEmail.trim().toLowerCase();
    const cleanPhone = driverPhone.trim();
    const cleanUsername = driverUsername.trim().toLowerCase().replace(/\s+/g, '');
    const cleanRef = driverRefNumber.trim() || `KCC-DRV-${Date.now().toString().slice(-4)}`;
    const cleanLicense = driverLicenseInfo.trim();
    const cleanPass = driverTempPassword.trim();

    if (!cleanName || !cleanEmail || !cleanPhone || !cleanUsername || !cleanLicense || !cleanPass) {
      setDriverError('Please complete all required fields.');
      return;
    }

    if (cleanPass.length < 6) {
      setDriverError('Temporary password must be at least 6 characters long.');
      return;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setDriverError('Please enter a valid driver email address.');
      return;
    }

    // Duplicate username check
    const duplicateUsername = users.find((u) => u.username?.toLowerCase() === cleanUsername);
    if (duplicateUsername) {
      setDriverError(`Username "${cleanUsername}" is already taken.`);
      return;
    }

    // Duplicate email check
    const duplicateEmail = users.find((u) => u.email?.toLowerCase() === cleanEmail);
    if (duplicateEmail) {
      setDriverError(`Email address "${cleanEmail}" is already registered.`);
      return;
    }

    setDriverSubmitting(true);
    try {
      // 1. Create Firebase Authentication account via secondary app
      const authUser = await createSecondaryAuthUser(cleanEmail, cleanPass);

      const now = new Date().toISOString();
      const selectedVehicleDoc = vehicles.find((v) => v.id === driverAssignedVehicle);

      // 2. Prepare Driver Firestore user document
      const newDriverDoc: UserProfile = {
        id: authUser.uid,
        uid: authUser.uid,
        fullName: cleanName,
        username: cleanUsername,
        email: cleanEmail,
        phone: cleanPhone,
        role: 'DRIVER',
        department: 'Transport',
        position: 'Commercial Heavy Haulage Driver',
        driverReferenceNumber: cleanRef,
        employeeId: cleanRef,
        licenseNumber: cleanLicense,
        licenseExpiryDate: driverLicenseExpiry,
        assignedVehicleId: driverAssignedVehicle || '',
        assignedVehicleReg: selectedVehicleDoc?.registrationNumber || '',
        assignedRoute: driverAssignedRoute,
        emergencyContact: driverEmergencyContact,
        employmentStatus: driverEmploymentStatus,
        status: driverStatus,
        mustChangePassword: true,
        failedLoginAttempts: 0,
        createdBy: currentUser?.uid || 'admin',
        createdAt: now,
        updatedAt: now,
      };

      // 3. Save to /users/{uid}
      await db.saveUserProfile(newDriverDoc);

      // 4. Save to /drivers/{uid}
      await db.add('drivers', {
        id: authUser.uid,
        userId: authUser.uid,
        driverId: cleanRef,
        fullName: cleanName,
        email: cleanEmail,
        phone: cleanPhone,
        licenseNumber: cleanLicense,
        licenseExpiryDate: driverLicenseExpiry,
        assignedVehicleId: driverAssignedVehicle || '',
        assignedVehicleReg: selectedVehicleDoc?.registrationNumber || '',
        status: driverStatus === 'ACTIVE' ? 'AVAILABLE' : 'INACTIVE',
        employmentType: driverEmploymentStatus,
        country: 'Uganda',
        joinedDate: now.split('T')[0],
        createdAt: now,
        updatedAt: now,
      });

      // 5. If vehicle was assigned, link vehicle to driver
      if (selectedVehicleDoc) {
        await db.update<Vehicle>('vehicles', selectedVehicleDoc.id, {
          assignedDriverId: authUser.uid,
          assignedDriverName: cleanName,
          status: 'ASSIGNED',
        });
      }

      // 6. Log Audit Event
      await db.logAudit({
        actorUid: currentUser?.uid || 'admin',
        actorRole: 'ADMIN',
        action: 'DRIVER_CREATED',
        targetUid: authUser.uid,
        details: `Created DRIVER account for ${cleanName} (${cleanEmail}) with License ${cleanLicense}`,
      });

      setDriverSuccess(
        `Commercial Driver successfully registered! Assigned Reference: ${cleanRef}. Temporary password set (must change on first login).`
      );

      // Reset form
      setDriverFullName('');
      setDriverEmail('');
      setDriverPhone('');
      setDriverUsername('');
      setDriverRefNumber('');
      setDriverLicenseExpiry('');
      setDriverAssignedVehicle('');
      setDriverEmergencyContact('');
      setDriverTempPassword('');

      await loadData();
    } catch (err: any) {
      setDriverError(err.message || 'Failed to register driver.');
    } finally {
      setDriverSubmitting(false);
    }
  };

  // Status Change (Activate, Deactivate, Suspend, Unlock)
  const handleStatusChange = async (
    userId: string,
    newStatus: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED',
    isUnlock: boolean = false
  ) => {
    setActionSubmitting(true);
    try {
      const updates: Partial<UserProfile> = {
        status: newStatus,
      };
      if (isUnlock) {
        updates.failedLoginAttempts = 0;
      }

      await db.updateUserProfile(userId, updates);

      const actionName = isUnlock
        ? 'ACCOUNT_UNLOCKED'
        : newStatus === 'ACTIVE'
        ? 'ACCOUNT_ACTIVATED'
        : newStatus === 'SUSPENDED'
        ? 'ACCOUNT_SUSPENDED'
        : 'ACCOUNT_DEACTIVATED';

      await db.logAudit({
        actorUid: currentUser?.uid || 'admin',
        actorRole: 'ADMIN',
        action: actionName,
        targetUid: userId,
        details: `Account status updated to ${newStatus}${isUnlock ? ' (Lock cleared)' : ''}`,
      });

      await loadData();
    } catch (err) {
      console.error('Error changing account status:', err);
    } finally {
      setActionSubmitting(false);
    }
  };

  // Trigger Password Reset Email
  const handleResetPassword = async (user: UserProfile) => {
    setSelectedUser(user);
    setResetPassSuccess(null);
    setResetPassError(null);
    setResetPassModalOpen(true);
  };

  const handleSendResetEmail = async () => {
    if (!selectedUser?.email) return;
    setResetPassSubmitting(true);
    setResetPassError(null);
    try {
      await sendPasswordResetEmail(auth, selectedUser.email);
      setResetPassSuccess(
        `Firebase password reset link successfully dispatched to ${selectedUser.email}.`
      );

      await db.logAudit({
        actorUid: currentUser?.uid || 'admin',
        actorRole: 'ADMIN',
        action: 'PASSWORD_RESET_INITIATED',
        targetUid: selectedUser.uid,
        details: `Administrator initiated password reset email to ${selectedUser.email}`,
      });
    } catch (err: any) {
      setResetPassError(err.message || 'Failed to dispatch password reset email.');
    } finally {
      setResetPassSubmitting(false);
    }
  };

  // Open Edit Worker Modal
  const openEditModal = (u: UserProfile) => {
    setSelectedUser(u);
    setEditFullName(u.fullName || '');
    setEditPhone(u.phone || '');
    setEditDepartment(u.department || 'Operations');
    setEditPosition(u.position || u.jobTitle || '');
    setEditAssignedVehicle(u.assignedVehicleId || '');
    setEditAssignedRoute(u.assignedRoute || '');
    setEditEmergencyContact(u.emergencyContact || '');
    setEditStatus((u.status || 'ACTIVE').toUpperCase());
    setEditModalOpen(true);
  };

  // Handle Edit Worker Submit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    setEditSubmitting(true);
    try {
      const selectedVeh = vehicles.find((v) => v.id === editAssignedVehicle);

      const updates: Partial<UserProfile> = {
        fullName: editFullName.trim(),
        phone: editPhone.trim(),
        department: editDepartment.trim(),
        position: editPosition.trim(),
        jobTitle: editPosition.trim(),
        assignedVehicleId: editAssignedVehicle,
        assignedVehicleReg: selectedVeh?.registrationNumber || '',
        assignedRoute: editAssignedRoute.trim(),
        emergencyContact: editEmergencyContact.trim(),
        status: editStatus as any,
      };

      await db.updateUserProfile(selectedUser.uid, updates);

      // If driver vehicle assignment changed, update vehicle
      if (editAssignedVehicle && editAssignedVehicle !== selectedUser.assignedVehicleId && selectedVeh) {
        await db.update<Vehicle>('vehicles', selectedVeh.id, {
          assignedDriverId: selectedUser.uid,
          assignedDriverName: editFullName.trim(),
          status: 'ASSIGNED',
        });
      }

      await db.logAudit({
        actorUid: currentUser?.uid || 'admin',
        actorRole: 'ADMIN',
        action: 'USER_UPDATED',
        targetUid: selectedUser.uid,
        details: `Updated workforce record for ${editFullName.trim()} (${selectedUser.email})`,
      });

      setEditModalOpen(false);
      await loadData();
    } catch (err) {
      console.error('Error updating worker profile:', err);
    } finally {
      setEditSubmitting(false);
    }
  };

  // Filtered Users List
  const filteredUsers = users.filter((u) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      !searchTerm ||
      u.fullName.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.username && u.username.toLowerCase().includes(q)) ||
      (u.employeeId && u.employeeId.toLowerCase().includes(q)) ||
      (u.department && u.department.toLowerCase().includes(q));

    const roleNorm = (u.role || '').toLowerCase();
    const matchesRole =
      roleFilter === 'all' ||
      (roleFilter === 'driver' && roleNorm === 'driver') ||
      (roleFilter === 'staff' && roleNorm !== 'driver');

    const statusNorm = (u.status || 'ACTIVE').toLowerCase();
    const matchesStatus =
      statusFilter === 'all' ||
      statusNorm === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Command Strip & Tab Switcher */}
      <div className="bg-[#0A1024]/80 p-6 rounded-2xl border border-slate-800/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800/70">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-xs font-mono uppercase text-cyan-400 font-semibold tracking-wider">
                Kirenga Central Command • Workforce Division
              </span>
            </div>
            <h2 className="text-2xl font-bold text-white font-['Poppins'] mt-1">
              Workforce Access & Account Control
            </h2>
            <p className="text-slate-400 text-xs mt-1">
              Administer staff and commercial driver credentials, department assignments, and security statuses.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setDeptModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700/80 hover:border-slate-600 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-2 transition-colors"
            >
              <Building className="w-3.5 h-3.5 text-cyan-400" />
              <span>Departments ({departments.length})</span>
            </button>
            <button
              onClick={loadData}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
              title="Refresh Firestore"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Tab Navigation (/admin/workforce, /admin/workforce/add-staff, /admin/workforce/add-driver) */}
        <div className="flex items-center gap-2 pt-4">
          <button
            onClick={() => setActiveTab('directory')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'directory'
                ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md shadow-cyan-600/25'
                : 'bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Workforce Directory ({users.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('add-staff')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'add-staff'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/25'
                : 'bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            <span>Add Staff (/admin/workforce/add-staff)</span>
          </button>

          <button
            onClick={() => setActiveTab('add-driver')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'add-driver'
                ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-md shadow-cyan-600/25'
                : 'bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>Add Driver (/admin/workforce/add-driver)</span>
          </button>
        </div>
      </div>

      {/* ============================================================
          TAB 1: WORKFORCE DIRECTORY
          ============================================================ */}
      {activeTab === 'directory' && (
        <div className="space-y-4">
          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-[#0A1024]/60 border border-slate-800/80 rounded-xl p-4">
              <div className="text-xs text-slate-400">Total Workforce</div>
              <div className="text-2xl font-bold text-white font-mono mt-1">{users.length}</div>
              <div className="text-[11px] text-cyan-400 mt-1">Firebase Auth + Firestore</div>
            </div>
            <div className="bg-[#0A1024]/60 border border-slate-800/80 rounded-xl p-4">
              <div className="text-xs text-slate-400">Active Drivers</div>
              <div className="text-2xl font-bold text-teal-400 font-mono mt-1">
                {users.filter((u) => (u.role || '').toLowerCase() === 'driver' && (u.status || '').toLowerCase() === 'active').length}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">Commercial Licenses</div>
            </div>
            <div className="bg-[#0A1024]/60 border border-slate-800/80 rounded-xl p-4">
              <div className="text-xs text-slate-400">Staff Personnel</div>
              <div className="text-2xl font-bold text-blue-400 font-mono mt-1">
                {users.filter((u) => (u.role || '').toLowerCase() !== 'driver').length}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">Operations & Admin</div>
            </div>
            <div className="bg-[#0A1024]/60 border border-slate-800/80 rounded-xl p-4">
              <div className="text-xs text-slate-400">Suspended / Locked</div>
              <div className="text-2xl font-bold text-amber-400 font-mono mt-1">
                {users.filter((u) => {
                  const s = (u.status || '').toLowerCase();
                  return s === 'suspended' || s === 'locked' || s === 'inactive';
                }).length}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">Restricted Access</div>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#0A1024]/60 p-4 rounded-xl border border-slate-800/80">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, email, username, ID..."
                className="w-full pl-9 pr-4 py-2 bg-slate-950/80 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
              {/* Role filter */}
              <div className="flex rounded-lg bg-slate-900 border border-slate-800 p-1 text-xs">
                <button
                  onClick={() => setRoleFilter('all')}
                  className={`px-3 py-1 rounded-md transition-colors ${
                    roleFilter === 'all' ? 'bg-cyan-600 text-white font-medium' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  All ({users.length})
                </button>
                <button
                  onClick={() => setRoleFilter('driver')}
                  className={`px-3 py-1 rounded-md transition-colors ${
                    roleFilter === 'driver' ? 'bg-teal-600 text-white font-medium' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Drivers ({users.filter((u) => (u.role || '').toLowerCase() === 'driver').length})
                </button>
                <button
                  onClick={() => setRoleFilter('staff')}
                  className={`px-3 py-1 rounded-md transition-colors ${
                    roleFilter === 'staff' ? 'bg-blue-600 text-white font-medium' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Staff ({users.filter((u) => (u.role || '').toLowerCase() !== 'driver').length})
                </button>
              </div>

              {/* Status filter */}
              <select
                value={statusFilter}
                onChange={(e: any) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-cyan-400"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
                <option value="locked">Locked</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="bg-[#0A1024]/80 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
            {filteredUsers.length === 0 ? (
              <div className="py-16 px-4 text-center">
                <Users className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                <h3 className="text-base font-semibold text-white font-['Poppins']">
                  {users.length === 0 ? 'No workforce accounts created yet' : 'No matching personnel found'}
                </h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 leading-relaxed">
                  {users.length === 0
                    ? 'Only the administrator controls workforce accounts. Click "Add Staff" or "Add Driver" above to begin.'
                    : 'Try adjusting your search criteria.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-[#080D1D] text-slate-400 uppercase tracking-wider text-[11px] font-mono border-b border-slate-800">
                    <tr>
                      <th className="py-3.5 px-4">Worker</th>
                      <th className="py-3.5 px-4">Role & Dept</th>
                      <th className="py-3.5 px-4">Credentials & Ref</th>
                      <th className="py-3.5 px-4">Assigned Asset / Position</th>
                      <th className="py-3.5 px-4">Account Status</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredUsers.map((u) => {
                      const roleNorm = (u.role || '').toLowerCase();
                      const statusNorm = (u.status || 'ACTIVE').toLowerCase();
                      const isDriver = roleNorm === 'driver';
                      const isAdmin = roleNorm === 'admin';
                      const isLocked = statusNorm === 'locked';
                      const isSuspended = statusNorm === 'suspended';
                      const isInactive = statusNorm === 'inactive';

                      return (
                        <tr key={u.id || u.uid} className="hover:bg-slate-900/50 transition-colors">
                          {/* Worker Column */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-xs ${
                                  isAdmin
                                    ? 'bg-gradient-to-br from-amber-500 to-rose-600'
                                    : isDriver
                                    ? 'bg-gradient-to-br from-teal-500 to-cyan-600'
                                    : 'bg-gradient-to-br from-blue-600 to-indigo-600'
                                }`}
                              >
                                {u.fullName ? u.fullName.charAt(0).toUpperCase() : 'W'}
                              </div>
                              <div>
                                <div className="font-semibold text-white flex items-center gap-1.5">
                                  <span>{u.fullName}</span>
                                  {isAdmin && (
                                    <span className="px-1.5 py-0.2 rounded text-[9px] bg-amber-500/20 text-amber-300 font-mono">
                                      ADMIN
                                    </span>
                                  )}
                                  {u.mustChangePassword && (
                                    <span className="px-1.5 py-0.2 rounded text-[9px] bg-amber-500/10 text-amber-400 font-mono border border-amber-500/30">
                                      TEMP PWD
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                                  <span>{u.email}</span>
                                  <span>•</span>
                                  <span>{u.phone || 'No phone'}</span>
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Role & Dept */}
                          <td className="py-3.5 px-4">
                            <div className="font-semibold uppercase tracking-wider text-[11px] font-mono flex items-center gap-1.5">
                              {isDriver ? (
                                <Compass className="w-3.5 h-3.5 text-teal-400" />
                              ) : (
                                <Briefcase className="w-3.5 h-3.5 text-blue-400" />
                              )}
                              <span className={isDriver ? 'text-teal-300' : 'text-blue-300'}>
                                {u.role}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-400 mt-0.5 font-sans">
                              {u.department || 'Operations'}
                            </div>
                          </td>

                          {/* Credentials & Ref */}
                          <td className="py-3.5 px-4 font-mono">
                            <div className="text-cyan-400 font-semibold text-xs">
                              {u.driverReferenceNumber || u.employeeId || 'KCC-ORG'}
                            </div>
                            <div className="text-[11px] text-slate-400">@{u.username || 'unassigned'}</div>
                          </td>

                          {/* Position / Asset */}
                          <td className="py-3.5 px-4">
                            {isDriver ? (
                              <div>
                                <div className="text-slate-200 font-medium flex items-center gap-1.5">
                                  <Truck className="w-3.5 h-3.5 text-teal-400" />
                                  <span>{u.assignedVehicleReg || 'No Vehicle Assigned'}</span>
                                </div>
                                <div className="text-[11px] text-slate-400 mt-0.5 truncate max-w-[200px]">
                                  {u.assignedRoute || 'All Corridors'}
                                </div>
                              </div>
                            ) : (
                              <div>
                                <div className="text-slate-200 font-medium">
                                  {u.position || u.jobTitle || 'Logistics Coordinator'}
                                </div>
                                <div className="text-[11px] text-slate-400 mt-0.5">
                                  {u.assignedLocation || 'Kampala Central'}
                                </div>
                              </div>
                            )}
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold font-mono tracking-wider uppercase ${
                                statusNorm === 'active'
                                  ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/30'
                                  : isLocked
                                  ? 'bg-red-950/90 text-red-300 border border-red-500/40 animate-pulse'
                                  : isSuspended
                                  ? 'bg-amber-950/80 text-amber-300 border border-amber-500/30'
                                  : 'bg-slate-800 text-slate-400 border border-slate-700'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  statusNorm === 'active'
                                    ? 'bg-emerald-400'
                                    : isLocked
                                    ? 'bg-red-400'
                                    : isSuspended
                                    ? 'bg-amber-400'
                                    : 'bg-slate-400'
                                }`}
                              />
                              <span>{u.status || 'ACTIVE'}</span>
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* View Dossier */}
                              <button
                                onClick={() => {
                                  setSelectedUser(u);
                                  setViewModalOpen(true);
                                }}
                                title="View Personnel Dossier"
                                className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>

                              {/* Edit Worker */}
                              <button
                                onClick={() => openEditModal(u)}
                                title="Edit Worker Details"
                                className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-cyan-400 hover:text-cyan-300 hover:border-cyan-500/30"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              {/* Reset Password */}
                              <button
                                onClick={() => handleResetPassword(u)}
                                title="Send Password Reset Email"
                                className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-amber-400 hover:text-amber-300 hover:border-amber-500/30"
                              >
                                <Key className="w-3.5 h-3.5" />
                              </button>

                              {/* Status Action: Unlock / Activate / Suspend / Deactivate */}
                              {!isAdmin && (
                                <>
                                  {isLocked || isSuspended || isInactive ? (
                                    <button
                                      onClick={() => handleStatusChange(u.uid, 'ACTIVE', isLocked)}
                                      title={isLocked ? 'Unlock Account' : 'Activate Account'}
                                      className="p-1.5 rounded-lg bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/80"
                                    >
                                      {isLocked ? <Unlock className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => handleStatusChange(u.uid, 'SUSPENDED')}
                                      title="Suspend Account"
                                      className="p-1.5 rounded-lg bg-amber-950/60 border border-amber-500/30 text-amber-400 hover:bg-amber-900/60"
                                    >
                                      <XCircle className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================
          TAB 2: ADD STAFF (/admin/workforce/add-staff)
          ============================================================ */}
      {activeTab === 'add-staff' && (
        <div className="bg-[#0A1024]/90 border border-slate-800/90 rounded-2xl p-6 sm:p-8 max-w-3xl shadow-xl">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-800">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/25">
              <Briefcase className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-mono text-cyan-400 uppercase tracking-wider font-semibold">
                Workforce Provisioning • /admin/workforce/add-staff
              </span>
              <h3 className="text-xl font-bold text-white font-['Poppins']">Register New Staff Account</h3>
              <p className="text-xs text-slate-400">
                Create authorized company staff profile with assigned department, role, and temporary credentials.
              </p>
            </div>
          </div>

          {staffError && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-950/70 border border-red-500/40 text-red-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
              <span>{staffError}</span>
            </div>
          )}

          {staffSuccess && (
            <div className="mb-5 p-4 rounded-xl bg-emerald-950/70 border border-emerald-500/40 text-emerald-200 text-xs flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400 mt-0.5" />
              <div className="leading-relaxed">
                <div className="font-semibold text-white">Staff Member Successfully Enrolled</div>
                <div>{staffSuccess}</div>
              </div>
            </div>
          )}

          <form onSubmit={handleAddStaffSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 font-mono">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={staffFullName}
                  onChange={(e) => setStaffFullName(e.target.value)}
                  placeholder="e.g. Grace Nakato"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                  required
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 font-mono">
                  Email *
                </label>
                <input
                  type="email"
                  value={staffEmail}
                  onChange={(e) => setStaffEmail(e.target.value)}
                  placeholder="e.g. g.nakato@kerengacargo.com"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                  required
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 font-mono">
                  Phone *
                </label>
                <input
                  type="text"
                  value={staffPhone}
                  onChange={(e) => setStaffPhone(e.target.value)}
                  placeholder="+256 700 112 233"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                  required
                />
              </div>

              {/* Username */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 font-mono">
                  Username *
                </label>
                <input
                  type="text"
                  value={staffUsername}
                  onChange={(e) => setStaffUsername(e.target.value.replace(/\s+/g, ''))}
                  placeholder="e.g. gnakato"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono"
                  required
                />
              </div>

              {/* Department */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 font-mono">
                  Department *
                </label>
                <select
                  value={staffDepartment}
                  onChange={(e) => setStaffDepartment(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-white text-xs focus:outline-none focus:border-cyan-400"
                  required
                >
                  {departments.length > 0 ? (
                    departments.map((d) => (
                      <option key={d.id} value={d.name}>
                        {d.name}
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="Operations">Operations</option>
                      <option value="Dispatch & Tracking">Dispatch & Tracking</option>
                      <option value="Logistics">Logistics</option>
                      <option value="Finance & Invoicing">Finance & Invoicing</option>
                      <option value="Customer Support">Customer Support</option>
                      <option value="Human Resources">Human Resources</option>
                    </>
                  )}
                </select>
              </div>

              {/* Position */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 font-mono">
                  Position *
                </label>
                <input
                  type="text"
                  value={staffPosition}
                  onChange={(e) => setStaffPosition(e.target.value)}
                  placeholder="e.g. Transit Operations Officer"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                  required
                />
              </div>

              {/* Temporary Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 font-mono">
                  Temporary Password *
                </label>
                <div className="relative">
                  <input
                    type={showStaffPassword ? 'text' : 'password'}
                    value={staffTempPassword}
                    onChange={(e) => setStaffTempPassword(e.target.value)}
                    placeholder="Initial password (min 6 chars)"
                    className="w-full pl-3.5 pr-10 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowStaffPassword(!showStaffPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showStaffPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-amber-400/90 mt-1">
                  Worker will be required to change this password upon first successful login.
                </p>
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 font-mono">
                  Initial Status
                </label>
                <select
                  value={staffStatus}
                  onChange={(e: any) => setStaffStatus(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-white text-xs focus:outline-none focus:border-cyan-400 font-mono"
                >
                  <option value="ACTIVE">ACTIVE (Access Authorized)</option>
                  <option value="INACTIVE">INACTIVE (Pending Deployment)</option>
                  <option value="SUSPENDED">SUSPENDED</option>
                  <option value="LOCKED">LOCKED</option>
                </select>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setActiveTab('directory')}
                className="px-4 py-2 text-xs text-slate-400 hover:text-white"
              >
                Back to Directory
              </button>
              <button
                type="submit"
                disabled={staffSubmitting}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {staffSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Provisioning Firebase Account...</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Create Staff Account</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ============================================================
          TAB 3: ADD DRIVER (/admin/workforce/add-driver)
          ============================================================ */}
      {activeTab === 'add-driver' && (
        <div className="bg-[#0A1024]/90 border border-slate-800/90 rounded-2xl p-6 sm:p-8 max-w-3xl shadow-xl">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-800">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-600 to-cyan-600 flex items-center justify-center text-white shadow-lg shadow-teal-600/25">
              <Compass className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-mono text-teal-400 uppercase tracking-wider font-semibold">
                Commercial Driver Registry • /admin/workforce/add-driver
              </span>
              <h3 className="text-xl font-bold text-white font-['Poppins']">Register Commercial Freight Driver</h3>
              <p className="text-xs text-slate-400">
                Enroll driver with driving license credentials, assigned prime mover, and corridor transit authorization.
              </p>
            </div>
          </div>

          {driverError && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-950/70 border border-red-500/40 text-red-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
              <span>{driverError}</span>
            </div>
          )}

          {driverSuccess && (
            <div className="mb-5 p-4 rounded-xl bg-emerald-950/70 border border-emerald-500/40 text-emerald-200 text-xs flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400 mt-0.5" />
              <div className="leading-relaxed">
                <div className="font-semibold text-white">Driver Enrolled Successfully</div>
                <div>{driverSuccess}</div>
              </div>
            </div>
          )}

          <form onSubmit={handleAddDriverSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 font-mono">
                  Full Legal Name *
                </label>
                <input
                  type="text"
                  value={driverFullName}
                  onChange={(e) => setDriverFullName(e.target.value)}
                  placeholder="e.g. Peter Omondi"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:border-teal-400"
                  required
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 font-mono">
                  Driver Work Email *
                </label>
                <input
                  type="email"
                  value={driverEmail}
                  onChange={(e) => setDriverEmail(e.target.value)}
                  placeholder="e.g. p.omondi@kerengacargo.com"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:border-teal-400"
                  required
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 font-mono">
                  Mobile / WhatsApp Phone *
                </label>
                <input
                  type="text"
                  value={driverPhone}
                  onChange={(e) => setDriverPhone(e.target.value)}
                  placeholder="+254 711 000 111"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:border-teal-400"
                  required
                />
              </div>

              {/* Username */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 font-mono">
                  Workforce Username *
                </label>
                <input
                  type="text"
                  value={driverUsername}
                  onChange={(e) => setDriverUsername(e.target.value.replace(/\s+/g, ''))}
                  placeholder="e.g. pomondi"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:border-teal-400 font-mono"
                  required
                />
              </div>

              {/* Driver Reference Number */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 font-mono">
                  Driver Reference Number
                </label>
                <input
                  type="text"
                  value={driverRefNumber}
                  onChange={(e) => setDriverRefNumber(e.target.value)}
                  placeholder="e.g. KCC-DRV-042 (Auto-generated if empty)"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:border-teal-400 font-mono"
                />
              </div>

              {/* Driving License Information */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 font-mono">
                  Driving Licence Information *
                </label>
                <input
                  type="text"
                  value={driverLicenseInfo}
                  onChange={(e) => setDriverLicenseInfo(e.target.value)}
                  placeholder="e.g. Class CE (Commercial Heavy Combination)"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:border-teal-400"
                  required
                />
              </div>

              {/* Licence Expiry Date */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 font-mono">
                  Licence Expiry Date
                </label>
                <input
                  type="date"
                  value={driverLicenseExpiry}
                  onChange={(e) => setDriverLicenseExpiry(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-white text-xs focus:outline-none focus:border-teal-400"
                />
              </div>

              {/* Assigned Vehicle */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 font-mono">
                  Assigned Vehicle
                </label>
                <select
                  value={driverAssignedVehicle}
                  onChange={(e) => setDriverAssignedVehicle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-white text-xs focus:outline-none focus:border-teal-400"
                >
                  <option value="">-- No Vehicle Assigned (Pool Driver) --</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.registrationNumber} • {v.make} {v.model} ({v.vehicleType})
                    </option>
                  ))}
                </select>
              </div>

              {/* Assigned Route / Region */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 font-mono">
                  Assigned Route / Region
                </label>
                <input
                  type="text"
                  value={driverAssignedRoute}
                  onChange={(e) => setDriverAssignedRoute(e.target.value)}
                  placeholder="e.g. Mombasa - Malaba - Kampala - Kigali"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:border-teal-400"
                />
              </div>

              {/* Emergency Contact */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 font-mono">
                  Emergency Contact
                </label>
                <input
                  type="text"
                  value={driverEmergencyContact}
                  onChange={(e) => setDriverEmergencyContact(e.target.value)}
                  placeholder="Next of Kin: Mary Omondi (+254 722 ...)"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:border-teal-400"
                />
              </div>

              {/* Employment Status */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 font-mono">
                  Employment Status
                </label>
                <select
                  value={driverEmploymentStatus}
                  onChange={(e) => setDriverEmploymentStatus(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-white text-xs focus:outline-none focus:border-teal-400"
                >
                  <option value="FULL_TIME">Permanent Full-Time</option>
                  <option value="CONTRACT">Corridor Contract (Annual)</option>
                  <option value="PER_TRIP">Per-Trip Long-Haul</option>
                </select>
              </div>

              {/* Initial Account Status */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 font-mono">
                  Account Status
                </label>
                <select
                  value={driverStatus}
                  onChange={(e: any) => setDriverStatus(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-white text-xs focus:outline-none focus:border-teal-400 font-mono"
                >
                  <option value="ACTIVE">ACTIVE (Deployable)</option>
                  <option value="INACTIVE">INACTIVE (Standby)</option>
                  <option value="SUSPENDED">SUSPENDED</option>
                </select>
              </div>

              {/* Temporary Password */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 font-mono">
                  Temporary Password *
                </label>
                <div className="relative">
                  <input
                    type={showDriverPassword ? 'text' : 'password'}
                    value={driverTempPassword}
                    onChange={(e) => setDriverTempPassword(e.target.value)}
                    placeholder="Assign temporary password (driver will change on first login)"
                    className="w-full pl-3.5 pr-10 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:border-teal-400 font-mono"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowDriverPassword(!showDriverPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showDriverPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-amber-400/90 mt-1">
                  Worker mustChangePassword flag will be set to true automatically.
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setActiveTab('directory')}
                className="px-4 py-2 text-xs text-slate-400 hover:text-white"
              >
                Back to Directory
              </button>
              <button
                type="submit"
                disabled={driverSubmitting}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white font-bold text-xs shadow-lg shadow-teal-600/30 flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {driverSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Enrolling Driver in Firebase...</span>
                  </>
                ) : (
                  <>
                    <Compass className="w-4 h-4" />
                    <span>Register Driver Account</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ============================================================
          MODAL: VIEW WORKER DOSSIER
          ============================================================ */}
      {viewModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-xl bg-[#0A1024] border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center text-white font-bold text-lg">
                  {selectedUser.fullName?.charAt(0)}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white font-['Poppins']">{selectedUser.fullName}</h3>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span className="font-mono text-cyan-400 font-semibold">{selectedUser.role}</span>
                    <span>•</span>
                    <span>{selectedUser.department || 'Operations'}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setViewModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs mb-5">
              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl">
                <div className="text-slate-500 font-mono text-[10px]">USERNAME</div>
                <div className="text-white font-mono mt-0.5">@{selectedUser.username || 'unassigned'}</div>
              </div>
              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl">
                <div className="text-slate-500 font-mono text-[10px]">ACCOUNT STATUS</div>
                <div className="text-cyan-400 font-mono font-bold mt-0.5 uppercase">{selectedUser.status}</div>
              </div>
              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl">
                <div className="text-slate-500 font-mono text-[10px]">EMAIL</div>
                <div className="text-white mt-0.5 truncate">{selectedUser.email}</div>
              </div>
              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl">
                <div className="text-slate-500 font-mono text-[10px]">PHONE</div>
                <div className="text-white mt-0.5">{selectedUser.phone || 'N/A'}</div>
              </div>
              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl">
                <div className="text-slate-500 font-mono text-[10px]">POSITION / TITLE</div>
                <div className="text-white mt-0.5">{selectedUser.position || selectedUser.jobTitle || 'Staff'}</div>
              </div>
              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl">
                <div className="text-slate-500 font-mono text-[10px]">ID / DRIVER REF</div>
                <div className="text-cyan-400 font-mono mt-0.5">{selectedUser.driverReferenceNumber || selectedUser.employeeId || 'KCC-ORG'}</div>
              </div>
              {selectedUser.assignedVehicleReg && (
                <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl col-span-2">
                  <div className="text-slate-500 font-mono text-[10px]">ASSIGNED VEHICLE</div>
                  <div className="text-teal-400 font-semibold mt-0.5 flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5" />
                    <span>{selectedUser.assignedVehicleReg}</span>
                  </div>
                </div>
              )}
              {selectedUser.licenseNumber && (
                <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl">
                  <div className="text-slate-500 font-mono text-[10px]">DRIVING LICENCE</div>
                  <div className="text-white mt-0.5">{selectedUser.licenseNumber}</div>
                </div>
              )}
              {selectedUser.licenseExpiryDate && (
                <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl">
                  <div className="text-slate-500 font-mono text-[10px]">LICENCE EXPIRY</div>
                  <div className="text-amber-400 font-mono mt-0.5">{selectedUser.licenseExpiryDate}</div>
                </div>
              )}
              {selectedUser.emergencyContact && (
                <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl col-span-2">
                  <div className="text-slate-500 font-mono text-[10px]">EMERGENCY CONTACT</div>
                  <div className="text-white mt-0.5">{selectedUser.emergencyContact}</div>
                </div>
              )}
              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl">
                <div className="text-slate-500 font-mono text-[10px]">LAST LOGIN</div>
                <div className="text-slate-300 font-mono mt-0.5">
                  {selectedUser.lastLoginAt ? new Date(selectedUser.lastLoginAt).toLocaleString() : 'Never'}
                </div>
              </div>
              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl">
                <div className="text-slate-500 font-mono text-[10px]">PASSWORD STATUS</div>
                <div className="text-slate-300 font-mono mt-0.5">
                  {selectedUser.mustChangePassword ? 'Temporary (Change Pending)' : 'Permanent & Secure'}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setViewModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          MODAL: EDIT WORKER
          ============================================================ */}
      {editModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-lg bg-[#0A1024] border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <Edit2 className="w-5 h-5 text-cyan-400" />
                <h3 className="text-lg font-bold text-white font-['Poppins']">Edit Workforce Details</h3>
              </div>
              <button onClick={() => setEditModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-medium text-slate-300 mb-1">Full Legal Name</label>
                <input
                  type="text"
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-400"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-400"
                    required
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Account Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-400 font-mono"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                    <option value="SUSPENDED">SUSPENDED</option>
                    <option value="LOCKED">LOCKED</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Department</label>
                  <select
                    value={editDepartment}
                    onChange={(e) => setEditDepartment(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-400"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.name}>{d.name}</option>
                    ))}
                    {!departments.some((d) => d.name === editDepartment) && (
                      <option value={editDepartment}>{editDepartment}</option>
                    )}
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Position / Title</label>
                  <input
                    type="text"
                    value={editPosition}
                    onChange={(e) => setEditPosition(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              {(selectedUser.role || '').toLowerCase() === 'driver' && (
                <>
                  <div>
                    <label className="block font-medium text-slate-300 mb-1">Assign Vehicle</label>
                    <select
                      value={editAssignedVehicle}
                      onChange={(e) => setEditAssignedVehicle(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-teal-400"
                    >
                      <option value="">-- No Vehicle Assigned --</option>
                      {vehicles.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.registrationNumber} • {v.make} {v.model} ({v.vehicleType})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-medium text-slate-300 mb-1">Assigned Route / Region</label>
                    <input
                      type="text"
                      value={editAssignedRoute}
                      onChange={(e) => setEditAssignedRoute(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-teal-400"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-slate-300 mb-1">Emergency Contact</label>
                    <input
                      type="text"
                      value={editEmergencyContact}
                      onChange={(e) => setEditEmergencyContact(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-teal-400"
                    />
                  </div>
                </>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSubmitting}
                  className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold shadow-md shadow-cyan-600/30"
                >
                  {editSubmitting ? 'Saving Changes...' : 'Update Worker Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================
          MODAL: RESET WORKER PASSWORD
          ============================================================ */}
      {resetPassModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="w-full max-w-md bg-[#0A1024] border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-950/80 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white font-['Poppins']">Reset Worker Password</h3>
                <p className="text-xs text-slate-400">Trigger recovery email for {selectedUser.fullName}</p>
              </div>
            </div>

            {resetPassError && (
              <div className="mb-4 p-3 rounded-lg bg-red-950/70 border border-red-500/40 text-red-200 text-xs">
                {resetPassError}
              </div>
            )}

            {resetPassSuccess ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-emerald-950/70 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>{resetPassSuccess}</span>
                </div>
                <button
                  onClick={() => setResetPassModalOpen(false)}
                  className="w-full py-2.5 rounded-xl bg-slate-800 text-white text-xs font-semibold"
                >
                  Close
                </button>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                <p className="text-slate-300 leading-relaxed">
                  A password reset link will be sent to the worker's registered corporate email:{' '}
                  <strong className="text-white font-mono">{selectedUser.email}</strong>.
                </p>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-400 text-[11px]">
                  The user can click the secure Firebase recovery link to establish a new password.
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setResetPassModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSendResetEmail}
                    disabled={resetPassSubmitting}
                    className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold shadow-md shadow-amber-600/30 flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{resetPassSubmitting ? 'Sending...' : 'Send Reset Link'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================
          MODAL: DEPARTMENTS MANAGEMENT
          ============================================================ */}
      {deptModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-[#0A1024] border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <Building className="w-5 h-5 text-cyan-400" />
                <h3 className="text-lg font-bold text-white font-['Poppins']">Company Departments</h3>
              </div>
              <button onClick={() => setDeptModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="space-y-2 mb-5 max-h-48 overflow-y-auto">
              {departments.length === 0 ? (
                <div className="text-xs text-slate-500 py-3 text-center">No custom departments yet. Add one below.</div>
              ) : (
                departments.map((d) => (
                  <div key={d.id} className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <div className="text-white font-semibold">{d.name}</div>
                      {d.description && <div className="text-[11px] text-slate-400">{d.description}</div>}
                    </div>
                  </div>
                ))
              )}
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!newDeptName.trim()) return;
                setDeptSubmitting(true);
                try {
                  await db.saveDepartment({
                    id: `dept_${Date.now()}`,
                    name: newDeptName.trim(),
                    description: newDeptDesc.trim(),
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                  });
                  setNewDeptName('');
                  setNewDeptDesc('');
                  await loadData();
                } catch (err) {
                  console.error(err);
                } finally {
                  setDeptSubmitting(false);
                }
              }}
              className="space-y-3 pt-3 border-t border-slate-800"
            >
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">New Department Name</label>
                <input
                  type="text"
                  value={newDeptName}
                  onChange={(e) => setNewDeptName(e.target.value)}
                  placeholder="e.g. Cross-Border Customs Clearance"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-400"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Department Description</label>
                <input
                  type="text"
                  value={newDeptDesc}
                  onChange={(e) => setNewDeptDesc(e.target.value)}
                  placeholder="Responsibilities, corridor jurisdiction..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDeptModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={deptSubmitting}
                  className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs shadow-md shadow-cyan-600/30"
                >
                  {deptSubmitting ? 'Creating...' : 'Create Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
