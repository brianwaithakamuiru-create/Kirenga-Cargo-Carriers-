import React, { useState, useEffect, useRef } from 'react';
import {
  Compass,
  User,
  Truck,
  FileText,
  Route as RouteIcon,
  Package,
  CheckCircle2,
  FileCheck,
  Bell,
  HelpCircle,
  Shield,
  LogOut,
  MapPin,
  Clock,
  Calendar,
  Phone,
  AlertTriangle,
  Send,
  Eye,
  Menu,
  X,
  Lock,
  RefreshCw,
  ArrowRight,
  ExternalLink,
  Navigation,
  Radio,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { db, COLLECTIONS } from '../../lib/firestoreService';
import { Trip, Vehicle, DriverExpense, DriverNotification, SupportTicket, Shipment } from '../../types';
import { CompanyLogo } from '../common/CompanyLogo';

interface DriverPortalProps {
  onNavigate?: (view: string) => void;
}

export const DriverPortal: React.FC<DriverPortalProps> = ({ onNavigate }) => {
  const { currentUser, userProfile, role, signOut, changePassword, updateProfile } = useAuth();

  type DriverNavKey =
    | 'driver-command'
    | 'my-profile'
    | 'my-vehicle'
    | 'vehicle-documents'
    | 'assigned-trips'
    | 'routes'
    | 'cargo'
    | 'delivery-status'
    | 'trip-documents'
    | 'notifications'
    | 'support'
    | 'security';

  const [activeNav, setActiveNav] = useState<DriverNavKey>('driver-command');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Real Driver Data from Firestore
  const [assignedTrips, setAssignedTrips] = useState<Trip[]>([]);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [notifications, setNotifications] = useState<DriverNotification[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);

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

  // Status Update modal / action
  const [updatingTripId, setUpdatingTripId] = useState<string | null>(null);
  const [newTripStatus, setNewTripStatus] = useState<string>('IN_TRANSIT');

  // GPS Tracking Session State (Section 2 & 7)
  const [activeTrackingTripId, setActiveTrackingTripId] = useState<string | null>(null);
  const [currentGps, setCurrentGps] = useState<{ lat: number; lng: number; time: string; accuracy?: number } | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [gpsSuccessMsg, setGpsSuccessMsg] = useState<string | null>(null);
  const [checkpointModalTrip, setCheckpointModalTrip] = useState<Trip | null>(null);
  const [checkpointName, setCheckpointName] = useState('');
  const [checkpointAction, setCheckpointAction] = useState<'REACHED' | 'DEPARTED'>('REACHED');

  const watchIdRef = useRef<number | null>(null);
  const syncIntervalRef = useRef<any>(null);

  // Cleanup GPS watching on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, []);

  // Transmit real GPS coordinates to Firestore
  const transmitGpsTelemetry = async (trip: Trip, lat: number, lng: number, timestamp: string) => {
    try {
      // 1. Update Trip document
      await db.update(COLLECTIONS.TRIPS, trip.id, {
        currentLatitude: lat,
        currentLongitude: lng,
        lastLocationUpdate: timestamp,
      });

      // 2. Update assigned Vehicle
      if (trip.vehicleId) {
        await db.update(COLLECTIONS.VEHICLES, trip.vehicleId, {
          currentLatitude: lat,
          currentLongitude: lng,
          lastLocationUpdate: timestamp,
        });
      }

      // 3. Update Shipment
      if (trip.shipmentId) {
        await db.update(COLLECTIONS.SHIPMENTS, trip.shipmentId, {
          currentLatitude: lat,
          currentLongitude: lng,
          lastLocationUpdate: timestamp,
        });
      }

      // 4. Log to gpsUpdates collection for telemetry history
      await db.add('gpsUpdates', {
        latitude: lat,
        longitude: lng,
        timestamp,
        driverId: currentUser?.uid || 'driver',
        vehicleId: trip.vehicleId || '',
        shipmentId: trip.shipmentId || '',
        tripId: trip.id,
      });
    } catch (err) {
      console.error('Error transmitting GPS telemetry:', err);
    }
  };

  // Start GPS tracking session on user action with explicit permission request
  const startGpsTracking = (trip: Trip) => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by this device.');
      return;
    }
    setGpsError(null);
    setGpsSuccessMsg('Requesting device location permission...');

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const now = new Date().toISOString();
        setCurrentGps({ lat, lng, time: now, accuracy: pos.coords.accuracy });
        setActiveTrackingTripId(trip.id);

        await transmitGpsTelemetry(trip, lat, lng, now);
        setGpsSuccessMsg('GPS Tracking session active. Telemetry securely streaming to Central Command.');

        // Set up continuous watch
        watchIdRef.current = navigator.geolocation.watchPosition(
          (watchPos) => {
            const wLat = watchPos.coords.latitude;
            const wLng = watchPos.coords.longitude;
            const wNow = new Date().toISOString();
            setCurrentGps({ lat: wLat, lng: wLng, time: wNow, accuracy: watchPos.coords.accuracy });
          },
          (err) => {
            console.warn('GPS Watch error:', err);
          },
          { enableHighAccuracy: true, maximumAge: 30000, timeout: 27000 }
        );

        // Transmit periodic update every 45s
        syncIntervalRef.current = setInterval(() => {
          navigator.geolocation.getCurrentPosition(
            (p) => {
              transmitGpsTelemetry(trip, p.coords.latitude, p.coords.longitude, new Date().toISOString());
            },
            (err) => console.warn('Periodic GPS error:', err)
          );
        }, 45000);
      },
      (err) => {
        setGpsError(`Location permission required: ${err.message}. Please allow location access to stream transit GPS.`);
        setGpsSuccessMsg(null);
      },
      { enableHighAccuracy: true }
    );
  };

  // Stop GPS tracking session
  const stopGpsTracking = () => {
    if (watchIdRef.current !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (syncIntervalRef.current) {
      clearInterval(syncIntervalRef.current);
      syncIntervalRef.current = null;
    }
    setActiveTrackingTripId(null);
    setCurrentGps(null);
    setGpsSuccessMsg('GPS tracking session ended.');
    setTimeout(() => setGpsSuccessMsg(null), 3000);
  };

  // Handle Checkpoint Reached / Departed logging
  const handleLogCheckpoint = async (trip: Trip) => {
    if (!checkpointName.trim()) return;
    const now = new Date().toISOString();
    const lat = currentGps?.lat;
    const lng = currentGps?.lng;
    const eventNotes = `Checkpoint ${checkpointName} ${checkpointAction} by ${userProfile?.fullName || 'Driver'}`;

    try {
      if (trip.shipmentId) {
        const s = await db.getById<Shipment>(COLLECTIONS.SHIPMENTS, trip.shipmentId);
        if (s) {
          const updatedTimeline = [
            ...(s.timeline || []),
            {
              stage: checkpointAction === 'REACHED' ? `Reached Checkpoint: ${checkpointName}` : `Departed Checkpoint: ${checkpointName}`,
              timestamp: now,
              completed: true,
              location: checkpointName,
              notes: eventNotes,
              updatedBy: userProfile?.fullName || 'Driver',
            },
          ];
          await db.update(COLLECTIONS.SHIPMENTS, trip.shipmentId, {
            status: checkpointAction === 'REACHED' ? 'AT_CHECKPOINT' : 'IN_TRANSIT',
            timeline: updatedTimeline,
            ...(lat && lng ? { currentLatitude: lat, currentLongitude: lng } : {}),
            lastLocationUpdate: now,
          });
        }
      }

      await db.logAudit({
        actorUid: currentUser?.uid,
        actorRole: 'DRIVER',
        action: `CHECKPOINT_${checkpointAction}`,
        targetUid: trip.id,
        details: `${eventNotes} at ${lat && lng ? `${lat.toFixed(4)}, ${lng.toFixed(4)}` : 'unrecorded GPS'}`,
      });

      setCheckpointModalTrip(null);
      setCheckpointName('');
      await loadDriverData();
    } catch (err: any) {
      console.error('Error logging checkpoint:', err);
    }
  };

  const loadDriverData = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      // 1. Fetch all trips for this driver
      const allTrips = await db.getAll<Trip>(COLLECTIONS.TRIPS);
      const driverTrips = allTrips.filter(
        (t) => t.driverId === currentUser.uid || t.driverName === userProfile?.fullName
      );
      setAssignedTrips(driverTrips);

      // 2. Fetch assigned vehicle
      const allVehicles = await db.getAll<Vehicle>(COLLECTIONS.VEHICLES);
      const driverVehicle = allVehicles.find(
        (v) =>
          v.id === userProfile?.assignedVehicleId ||
          v.assignedDriverId === currentUser.uid ||
          (userProfile?.assignedVehicleReg && v.registrationNumber === userProfile.assignedVehicleReg)
      );
      setVehicle(driverVehicle || null);

      // 3. Fetch legacy trip notices and account-addressed admin broadcasts.
      const [driverNotifs, accountNotifs] = await Promise.all([
        db.getAll<DriverNotification>(COLLECTIONS.DRIVER_NOTIFICATIONS),
        db.getAll<any>(COLLECTIONS.NOTIFICATIONS),
      ]);
      const myNotifs: DriverNotification[] = [
        ...driverNotifs.filter((n) => n.driverId === currentUser.uid || n.driverId === '*'),
        ...accountNotifs
          .filter((n) => n.userId === currentUser.uid)
          .map((n) => ({
            id: n.id,
            driverId: currentUser.uid,
            title: n.title,
            message: n.message,
            type: 'SYSTEM' as const,
            read: Boolean(n.read),
            createdAt: n.createdAt,
          })),
      ];
      setNotifications(myNotifs);

      // 4. Fetch trip/vehicle documents
      const allDocs = await db.getAll<any>('documents');
      const myDocs = allDocs.filter(
        (d) => d.uploadedBy === currentUser.uid || d.driverId === currentUser.uid
      );
      setDocuments(myDocs);
    } catch (err) {
      console.error('Error fetching driver workplace data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDriverData();
    const unsub = db.subscribe('*', loadDriverData);
    return () => unsub();
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

  const handleUpdateTripStatus = async (tripId: string, status: any) => {
    try {
      await db.updateTripStatus({
        tripId,
        status,
        actorName: userProfile?.fullName || 'Driver',
        notes: `Status updated by assigned driver via Driver Command.`,
      });
      setUpdatingTripId(null);
      await loadDriverData();
    } catch (err) {
      console.error('Error updating trip status:', err);
    }
  };

  const handleLogout = async () => {
    await signOut();
    if (onNavigate) onNavigate('home');
  };

  const navItems: { key: DriverNavKey; label: string; icon: React.ComponentType<{ className?: string }>; count?: number }[] = [
    { key: 'driver-command', label: 'Driver Command', icon: Compass },
    { key: 'my-profile', label: 'My Profile', icon: User },
    { key: 'my-vehicle', label: 'My Vehicle', icon: Truck },
    { key: 'vehicle-documents', label: 'Vehicle Documents', icon: FileText },
    { key: 'assigned-trips', label: 'Assigned Trips', icon: RouteIcon, count: assignedTrips.length },
    { key: 'routes', label: 'Routes', icon: MapPin },
    { key: 'cargo', label: 'Cargo', icon: Package },
    { key: 'delivery-status', label: 'Delivery Status', icon: CheckCircle2 },
    { key: 'trip-documents', label: 'Trip Documents', icon: FileCheck, count: documents.length },
    { key: 'notifications', label: 'Notifications', icon: Bell, count: notifications.length },
    { key: 'support', label: 'Support', icon: HelpCircle },
    { key: 'security', label: 'Security', icon: Shield },
  ];

  return (
    <div className="min-h-screen bg-[#030712] text-[#F8FAFC] flex flex-col md:flex-row">
      {/* Mobile Header Bar */}
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
            Driver Navigation
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
                    ? 'bg-gradient-to-r from-teal-600/30 to-cyan-500/20 text-teal-300 border border-teal-500/40 font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive ? 'text-teal-400' : 'text-slate-500 group-hover:text-slate-300'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.count !== undefined && item.count > 0 && (
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                      isActive ? 'bg-teal-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Bottom Driver Identity Card & Logout */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/40">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-600 to-cyan-600 flex items-center justify-center text-white font-bold text-xs">
              {userProfile?.fullName ? userProfile.fullName.charAt(0).toUpperCase() : 'D'}
            </div>
            <div className="overflow-hidden flex-1">
              <div className="text-xs font-semibold text-white truncate">{userProfile?.fullName || 'Driver'}</div>
              <div className="text-[10px] text-teal-400 font-mono">ID: {userProfile?.employeeId || 'KCC-DRV'}</div>
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
        {/* VIEW: Driver Command (Dashboard Overview) */}
        {activeNav === 'driver-command' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Top Driver Header */}
            <div className="bg-[#0A1024]/80 p-6 rounded-2xl border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-teal-400 animate-pulse" />
                  <span className="text-xs font-mono uppercase text-teal-400 font-semibold tracking-wider">
                    Driver Duty Status: Active
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-white font-['Poppins'] mt-1">
                  Driver Command Center
                </h2>
                <p className="text-slate-400 text-xs mt-1">
                  Welcome back, {userProfile?.fullName}. Review your active transit manifests and assigned fleet asset.
                </p>
              </div>

              <button
                onClick={loadDriverData}
                className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white self-start sm:self-auto"
                title="Sync database"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-[#0A1024]/80 border border-slate-800/80 rounded-2xl p-5">
                <div className="text-xs text-slate-400">Assigned Trips</div>
                <div className="text-3xl font-bold text-teal-400 font-mono mt-1">{assignedTrips.length}</div>
                <div className="text-[11px] text-slate-500 mt-1">Active transit dispatches</div>
              </div>

              <div className="bg-[#0A1024]/80 border border-slate-800/80 rounded-2xl p-5">
                <div className="text-xs text-slate-400">Assigned Fleet Asset</div>
                <div className="text-xl font-bold text-white font-mono mt-2 truncate">
                  {vehicle ? vehicle.registrationNumber : 'No vehicle assigned.'}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  {vehicle ? `${vehicle.make} ${vehicle.model}` : 'Contact administrator for dispatch'}
                </div>
              </div>

              <div className="bg-[#0A1024]/80 border border-slate-800/80 rounded-2xl p-5">
                <div className="text-xs text-slate-400">Trip & Customs Documents</div>
                <div className="text-3xl font-bold text-cyan-400 font-mono mt-1">{documents.length}</div>
                <div className="text-[11px] text-slate-500 mt-1">Digital transit records</div>
              </div>
            </div>

            {/* Current Active Trip Card */}
            <div className="bg-[#0A1024]/80 border border-slate-800/80 rounded-2xl p-6 shadow-xl">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <RouteIcon className="w-4 h-4 text-teal-400" />
                  <h3 className="text-base font-bold text-white font-['Poppins']">Current Dispatched Trip</h3>
                </div>
                <span className="text-xs font-mono text-slate-400">REAL DATABASE DATA</span>
              </div>

              {assignedTrips.length === 0 ? (
                <div className="py-12 text-center">
                  <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 mx-auto mb-3">
                    <RouteIcon className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-semibold text-white font-['Poppins']">No trips assigned yet.</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    When central dispatch assigns a shipment corridor to your account, full route details will appear here.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {assignedTrips.map((t) => (
                    <div key={t.id} className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <span className="text-xs font-mono font-bold text-teal-400">{t.tripReference}</span>
                          <span className="text-slate-500 mx-2">•</span>
                          <span className="text-xs text-white font-semibold">{t.shipmentNumber}</span>
                        </div>
                        <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-teal-950 text-teal-300 border border-teal-500/30 self-start sm:self-auto">
                          STATUS: {t.status}
                        </span>
                      </div>

                      <div className="text-xs text-slate-300 flex items-center gap-2">
                        <span>{t.originCity || 'Kampala'}, {t.originCountry || 'Uganda'}</span>
                        <span className="text-teal-400">➔</span>
                        <span>{t.destinationCity || 'Kigali'}, {t.destinationCountry || 'Rwanda'}</span>
                      </div>

                      <div className="text-[11px] text-slate-400 flex flex-wrap gap-4 pt-1">
                        <div>Vehicle: <span className="text-white font-mono">{t.vehicleRegistration}</span></div>
                        <div>Scheduled Pickup: <span className="text-white">{t.scheduledPickupDate || 'Immediate'}</span></div>
                        {t.expectedDeliveryDate && <div>ETA: <span className="text-white">{t.expectedDeliveryDate}</span></div>}
                      </div>

                      {/* GPS Telemetry Session & Checkpoint Control (Section 2 & 7) */}
                      <div className="pt-3 border-t border-slate-800/80 space-y-3">
                        {gpsError && (
                          <div className="p-3 bg-red-950/70 border border-red-500/40 rounded-xl text-xs text-red-200 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                            <span>{gpsError}</span>
                          </div>
                        )}
                        {gpsSuccessMsg && (
                          <div className="p-3 bg-emerald-950/70 border border-emerald-500/40 rounded-xl text-xs text-emerald-200 flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                            <span>{gpsSuccessMsg}</span>
                          </div>
                        )}

                        <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                          <div>
                            <div className="flex items-center gap-2">
                              <Radio className={`w-3.5 h-3.5 ${activeTrackingTripId === t.id ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`} />
                              <span className="text-xs font-semibold text-white">Transit GPS Telemetry:</span>
                              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                                activeTrackingTripId === t.id
                                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                                  : 'bg-slate-950 text-slate-400 border border-slate-800'
                              }`}>
                                {activeTrackingTripId === t.id ? 'LIVE TRANSMITTING' : 'OFFLINE'}
                              </span>
                            </div>
                            {currentGps && activeTrackingTripId === t.id && (
                              <div className="text-[10px] text-cyan-400 font-mono mt-1">
                                Coordinates: {currentGps.lat.toFixed(4)}, {currentGps.lng.toFixed(4)} • Streamed to Central Command
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            {activeTrackingTripId === t.id ? (
                              <button
                                onClick={stopGpsTracking}
                                className="px-3 py-1.5 rounded-xl bg-red-950 hover:bg-red-900 border border-red-500/40 text-red-200 text-xs font-semibold transition-colors"
                              >
                                Stop Tracking
                              </button>
                            ) : (
                              <button
                                onClick={() => startGpsTracking(t)}
                                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white text-xs font-semibold shadow-md shadow-cyan-600/20 flex items-center gap-1.5"
                              >
                                <Navigation className="w-3.5 h-3.5" />
                                <span>Start Trip GPS</span>
                              </button>
                            )}

                            <button
                              onClick={() => {
                                setCheckpointModalTrip(t);
                                setCheckpointName('');
                              }}
                              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-medium flex items-center gap-1.5"
                            >
                              <MapPin className="w-3 h-3 text-cyan-400" />
                              <span>Checkpoint</span>
                            </button>

                            {t.destinationCity && (
                              <a
                                href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                                  `${t.destinationCity}, ${t.destinationCountry || ''}`
                                )}`}
                                target="_blank"
                                rel="noreferrer"
                                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1.5"
                                title="Open Google Maps Navigation"
                              >
                                <ExternalLink className="w-3 h-3 text-slate-400" />
                                <span>Directions</span>
                              </a>
                            )}
                          </div>
                        </div>

                        {/* Driver Status Update Actions */}
                        <div className="flex items-center justify-between pt-1">
                          <span className="text-[11px] text-slate-400 font-mono">Update Corridor Progress:</span>
                          <div className="flex items-center gap-2">
                            {['IN_TRANSIT', 'BORDER_CUSTOMS', 'DELIVERED'].map((st) => (
                              <button
                                key={st}
                                onClick={() => handleUpdateTripStatus(t.id, st)}
                                disabled={t.status === st}
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold border transition-colors ${
                                  t.status === st
                                    ? 'bg-teal-600 border-teal-500 text-white'
                                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                                }`}
                              >
                                {st}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* CHECKPOINT MODAL (Section 7) */}
        {checkpointModalTrip && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#0A1024] border border-cyan-500/40 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-base font-bold text-white font-['Poppins']">Record Checkpoint Event</h3>
                </div>
                <button
                  onClick={() => setCheckpointModalTrip(null)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-300 mb-1">Checkpoint Status *</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setCheckpointAction('REACHED')}
                      className={`py-2 rounded-xl text-xs font-bold border ${
                        checkpointAction === 'REACHED'
                          ? 'bg-cyan-600 border-cyan-500 text-white'
                          : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}
                    >
                      CHECKPOINT REACHED
                    </button>
                    <button
                      type="button"
                      onClick={() => setCheckpointAction('DEPARTED')}
                      className={`py-2 rounded-xl text-xs font-bold border ${
                        checkpointAction === 'DEPARTED'
                          ? 'bg-emerald-600 border-emerald-500 text-white'
                          : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}
                    >
                      CHECKPOINT DEPARTED
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 mb-1">Checkpoint Name / Border Post *</label>
                  <input
                    type="text"
                    required
                    value={checkpointName}
                    onChange={(e) => setCheckpointName(e.target.value)}
                    placeholder="e.g. Namanga Border, Busia OSBP, Arusha, Moshi..."
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  />
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] text-slate-400 space-y-1">
                  <div>Timestamp: <span className="text-white font-mono">{new Date().toLocaleTimeString()}</span></div>
                  <div>Driver: <span className="text-cyan-400">{userProfile?.fullName}</span></div>
                  <div>GPS: <span className="text-emerald-400 font-mono">
                    {currentGps ? `${currentGps.lat.toFixed(4)}, ${currentGps.lng.toFixed(4)}` : 'Captured on submit'}
                  </span></div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setCheckpointModalTrip(null)}
                    className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLogCheckpoint(checkpointModalTrip)}
                    className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-xl"
                  >
                    Confirm Event
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW: My Profile */}
        {activeNav === 'my-profile' && (
          <div className="space-y-6 animate-fadeIn max-w-2xl">
            <div className="bg-[#0A1024]/80 p-6 rounded-2xl border border-slate-800/80">
              <h2 className="text-2xl font-bold text-white font-['Poppins']">Driver Profile</h2>
              <p className="text-slate-400 text-xs mt-1">Official driver credentials and verified account details.</p>
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
                  <div className="text-[10px] font-mono text-slate-400 uppercase">System Username</div>
                  <div className="text-teal-400 font-mono mt-1">@{userProfile?.username}</div>
                </div>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">Driver License / ID</div>
                  <div className="text-cyan-400 font-mono mt-1">{userProfile?.employeeId || 'KCC-DRV-001'}</div>
                </div>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">Role (Verified)</div>
                  <div className="text-emerald-400 font-mono mt-1 uppercase">driver</div>
                </div>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">Registered Email</div>
                  <div className="text-white mt-1 truncate">{userProfile?.email}</div>
                </div>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">Account Status</div>
                  <div className="text-emerald-400 font-mono mt-1 capitalize">{userProfile?.status || 'active'}</div>
                </div>
              </div>

              {/* Editable profile fields */}
              <form onSubmit={handleUpdateProfile} className="space-y-4 pt-4 border-t border-slate-800">
                <div className="text-xs font-semibold text-slate-300 font-mono uppercase tracking-wider">
                  Permitted Updates
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
                    <label className="block text-xs text-slate-400 mb-1">Operating Country</label>
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
                    className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs rounded-xl shadow-md shadow-teal-600/30"
                  >
                    {profileLoading ? 'Saving...' : 'Save Profile Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* VIEW: My Vehicle */}
        {activeNav === 'my-vehicle' && (
          <div className="space-y-6 animate-fadeIn max-w-2xl">
            <div className="bg-[#0A1024]/80 p-6 rounded-2xl border border-slate-800/80">
              <h2 className="text-2xl font-bold text-white font-['Poppins']">Assigned Vehicle Asset</h2>
              <p className="text-slate-400 text-xs mt-1">Prime mover and trailer specifications assigned to your dispatches.</p>
            </div>

            {!vehicle ? (
              <div className="bg-[#0A1024]/80 border border-slate-800 rounded-2xl p-12 text-center">
                <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 mx-auto mb-3">
                  <Truck className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-white font-['Poppins']">No vehicle assigned.</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Central administration has not assigned a commercial fleet asset to your profile yet.
                </p>
              </div>
            ) : (
              <div className="bg-[#0A1024]/80 border border-slate-800/80 rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                  <div>
                    <span className="text-xl font-bold text-white font-mono">{vehicle.registrationNumber}</span>
                    <div className="text-xs text-teal-400">{vehicle.make} {vehicle.model}</div>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-teal-950 text-teal-300 border border-teal-500/30">
                    {vehicle.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs text-slate-300">
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                    <span className="text-slate-500 block text-[10px] font-mono">VEHICLE TYPE</span>
                    <span className="font-semibold text-white mt-1 block">{vehicle.vehicleType}</span>
                  </div>
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                    <span className="text-slate-500 block text-[10px] font-mono">PAYLOAD CAPACITY</span>
                    <span className="font-semibold text-cyan-400 font-mono mt-1 block">
                      {vehicle.capacityKg?.toLocaleString()} KG
                    </span>
                  </div>
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                    <span className="text-slate-500 block text-[10px] font-mono">CURRENT BASE LOCATION</span>
                    <span className="font-semibold text-white mt-1 block">{vehicle.currentLocation || 'Central Yard'}</span>
                  </div>
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                    <span className="text-slate-500 block text-[10px] font-mono">LAST SERVICE INSPECTION</span>
                    <span className="font-semibold text-white mt-1 block">{vehicle.lastServiceDate || 'Verified'}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* VIEW: Vehicle Documents */}
        {activeNav === 'vehicle-documents' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-[#0A1024]/80 p-6 rounded-2xl border border-slate-800/80">
              <h2 className="text-2xl font-bold text-white font-['Poppins']">Vehicle Documents</h2>
              <p className="text-slate-400 text-xs mt-1">Insurance cards, roadworthiness certificates, and COMESA yellow cards.</p>
            </div>
            <div className="bg-[#0A1024]/80 border border-slate-800 rounded-2xl p-12 text-center">
              <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 mx-auto mb-3">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white font-['Poppins']">No documents available.</h3>
              <p className="text-xs text-slate-400 mt-1">Vehicle documentation will be archived here upon upload by administration.</p>
            </div>
          </div>
        )}

        {/* VIEW: Assigned Trips */}
        {activeNav === 'assigned-trips' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-[#0A1024]/80 p-6 rounded-2xl border border-slate-800/80">
              <h2 className="text-2xl font-bold text-white font-['Poppins']">Assigned Trips & Corridors</h2>
              <p className="text-slate-400 text-xs mt-1">Active and historical dispatches assigned to your driver ID.</p>
            </div>

            {assignedTrips.length === 0 ? (
              <div className="bg-[#0A1024]/80 border border-slate-800 rounded-2xl p-12 text-center">
                <h3 className="text-base font-bold text-white font-['Poppins']">No trips assigned yet.</h3>
              </div>
            ) : (
              <div className="space-y-4">
                {assignedTrips.map((t) => (
                  <div key={t.id} className="bg-[#0A1024]/80 border border-slate-800 rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-teal-400 font-mono font-bold text-sm">{t.tripReference}</span>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-teal-950 text-teal-300 border border-teal-500/30">
                        {t.status}
                      </span>
                    </div>
                    <div className="text-xs text-white font-medium">Shipment: {t.shipmentNumber}</div>
                    <div className="text-xs text-slate-400 mt-1">Vehicle Asset: {t.vehicleRegistration}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* VIEW: Routes */}
        {activeNav === 'routes' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-[#0A1024]/80 p-6 rounded-2xl border border-slate-800/80">
              <h2 className="text-2xl font-bold text-white font-['Poppins']">Regional Freight Routes</h2>
              <p className="text-slate-400 text-xs mt-1">Designated transit corridors across East & Central Africa.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { name: 'Northern Corridor', origin: 'Mombasa Port', dest: 'Kampala / Kigali', restStops: 'Voi, Nakuru, Eldoret, Malaba, Jinja' },
                { name: 'Central Corridor', origin: 'Dar es Salaam', dest: 'Kigali / Bujumbura', restStops: 'Morogoro, Dodoma, Singida, Kahama' },
                { name: 'Albertine Link', origin: 'Kampala', dest: 'Beni / Bunia (Congo)', restStops: 'Mityana, Fort Portal, Mpondwe Border' },
              ].map((r, i) => (
                <div key={i} className="bg-[#0A1024]/80 border border-slate-800 rounded-2xl p-5 text-xs">
                  <div className="font-bold text-white text-sm mb-1">{r.name}</div>
                  <div className="text-teal-400 font-medium">{r.origin} ➔ {r.dest}</div>
                  <div className="text-slate-400 mt-2">Rest & Fuel Waypoints: {r.restStops}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VIEW: Cargo */}
        {activeNav === 'cargo' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-[#0A1024]/80 p-6 rounded-2xl border border-slate-800/80">
              <h2 className="text-2xl font-bold text-white font-['Poppins']">Assigned Cargo Jobs</h2>
              <p className="text-slate-400 text-xs mt-1">Consignment manifests and bill of lading records.</p>
            </div>
            {assignedTrips.length === 0 ? (
              <div className="bg-[#0A1024]/80 border border-slate-800 rounded-2xl p-12 text-center text-slate-400 text-xs">
                No active cargo consignments assigned to your profile.
              </div>
            ) : (
              <div className="space-y-3">
                {assignedTrips.map((t) => (
                  <div key={t.id} className="p-4 bg-[#0A1024]/80 border border-slate-800 rounded-xl text-xs">
                    <div className="font-mono text-cyan-400 font-bold">{t.shipmentNumber}</div>
                    <div className="text-slate-300 mt-1">Assigned Trip: {t.tripReference}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* VIEW: Delivery Status */}
        {activeNav === 'delivery-status' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-[#0A1024]/80 p-6 rounded-2xl border border-slate-800/80">
              <h2 className="text-2xl font-bold text-white font-['Poppins']">Delivery Progress Updates</h2>
              <p className="text-slate-400 text-xs mt-1">Live waypoint milestone notifications.</p>
            </div>
            {assignedTrips.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">No trips assigned yet.</div>
            ) : (
              <div className="space-y-4">
                {assignedTrips.map((t) => (
                  <div key={t.id} className="p-4 bg-[#0A1024]/80 border border-slate-800 rounded-xl text-xs space-y-3">
                    <div className="font-bold text-white">{t.tripReference} ({t.shipmentNumber})</div>
                    <div className="text-teal-400 font-mono">Current Status: {t.status}</div>
                    <div className="flex gap-2">
                      {['DEPARTED', 'IN_TRANSIT', 'BORDER_CUSTOMS', 'ARRIVED', 'DELIVERED'].map((st) => (
                        <button
                          key={st}
                          onClick={() => handleUpdateTripStatus(t.id, st)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold ${
                            t.status === st ? 'bg-teal-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'
                          }`}
                        >
                          {st}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* VIEW: Trip Documents */}
        {activeNav === 'trip-documents' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-[#0A1024]/80 p-6 rounded-2xl border border-slate-800/80">
              <h2 className="text-2xl font-bold text-white font-['Poppins']">Trip Documents & Manifests</h2>
              <p className="text-slate-400 text-xs mt-1">PODs, signed receipts, and customs clearances.</p>
            </div>
            {documents.length === 0 ? (
              <div className="bg-[#0A1024]/80 border border-slate-800 rounded-2xl p-12 text-center">
                <h3 className="text-base font-bold text-white font-['Poppins']">No documents available.</h3>
              </div>
            ) : (
              <div className="space-y-2">
                {documents.map((d) => (
                  <div key={d.id} className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs flex justify-between">
                    <span>{d.title || d.fileName}</span>
                    <span className="font-mono text-cyan-400">{d.type}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* VIEW: Notifications */}
        {activeNav === 'notifications' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-[#0A1024]/80 p-6 rounded-2xl border border-slate-800/80">
              <h2 className="text-2xl font-bold text-white font-['Poppins']">Driver Notifications</h2>
              <p className="text-slate-400 text-xs mt-1">Dispatches, route diversions, and transit alerts.</p>
            </div>
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">No active notifications.</div>
            ) : (
              <div className="space-y-2">
                {notifications.map((n) => (
                  <div key={n.id} className="p-3 bg-[#0A1024]/80 border border-slate-800 rounded-xl text-xs">
                    <div className="font-semibold text-white">{n.title}</div>
                    <div className="text-slate-400 mt-1">{n.message}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* VIEW: Support */}
        {activeNav === 'support' && (
          <div className="space-y-6 animate-fadeIn max-w-2xl">
            <div className="bg-[#0A1024]/80 p-6 rounded-2xl border border-slate-800/80">
              <h2 className="text-2xl font-bold text-white font-['Poppins']">Driver Operational Support</h2>
              <p className="text-slate-400 text-xs mt-1">24/7 central dispatch control contact.</p>
            </div>
            <div className="bg-[#0A1024]/80 border border-slate-800 rounded-2xl p-6 space-y-4 text-xs">
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
                <div>
                  <div className="text-white font-semibold">Central Emergency Dispatch Desk</div>
                  <div className="text-teal-400 font-mono mt-1">+256 700 000 000</div>
                </div>
                <Phone className="w-5 h-5 text-teal-400" />
              </div>
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
                <div>
                  <div className="text-white font-semibold">Operations VHF & Corridor Helpline</div>
                  <div className="text-cyan-400 font-mono mt-1">operations@kerengacargo.com</div>
                </div>
                <HelpCircle className="w-5 h-5 text-cyan-400" />
              </div>
            </div>
          </div>
        )}

        {/* VIEW: Security */}
        {activeNav === 'security' && (
          <div className="space-y-6 animate-fadeIn max-w-md">
            <div className="bg-[#0A1024]/80 p-6 rounded-2xl border border-slate-800/80">
              <h2 className="text-2xl font-bold text-white font-['Poppins']">Driver Account Security</h2>
              <p className="text-slate-400 text-xs mt-1">Update your Firebase authentication password.</p>
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
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-teal-400 font-mono"
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
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-teal-400 font-mono"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={passLoading}
                className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs shadow-lg shadow-teal-600/30 disabled:opacity-50"
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
