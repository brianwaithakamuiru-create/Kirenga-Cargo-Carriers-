import React, { useState, useEffect, useMemo } from 'react';
import {
  LayoutDashboard,
  Users,
  Compass,
  Briefcase,
  Truck,
  Package,
  Route as RouteIcon,
  Navigation,
  FileText,
  BarChart3,
  Bell,
  Settings,
  Shield,
  LogOut,
  Menu,
  X,
  RefreshCw,
  Search,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Phone,
  Calendar,
  Globe,
  DollarSign,
  ArrowRight,
  ExternalLink,
  UserPlus,
  Activity,
  Send,
  Lock,
  Layers,
  FileCheck,
  Eye,
  Filter,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { db, COLLECTIONS } from '../../lib/firestoreService';
import {
  Shipment,
  Trip,
  Driver,
  Vehicle,
  Booking,
  Quote,
  Invoice,
  DriverExpense,
  VehicleIssue,
  SupportTicket,
  ContactMessage,
  ActivityLog,
  Client,
  LogisticsDocument,
} from '../../types';
import { EmptyState } from '../common/EmptyState';
import { WorkforceManagement } from './WorkforceManagement';
import { AdminSettings } from './AdminSettings';
import { AdminSecurity } from './AdminSecurity';
import { WebsiteManagement } from './WebsiteManagement';
import { FleetOperations } from './FleetOperations';
import { CargoOperations } from './CargoOperations';
import { CommercialManagement } from './CommercialManagement';
import { OperationsRoutes } from './OperationsRoutes';
import { WarehouseManagement } from './WarehouseManagement';
import { CentralDocumentManager } from './CentralDocumentManager';
import { CentralReports } from './CentralReports';
import { LiveTrackingMap } from './LiveTrackingMap';
import { CompanyLogo } from '../common/CompanyLogo';

interface AdminDashboardProps {
  onNavigate?: (view: string) => void;
  initialNav?: string;
}

export type AdminNavKey =
  | 'dashboard'
  | 'shipments'
  | 'tracking'
  | 'fleet'
  | 'drivers'
  | 'staff'
  | 'customers'
  | 'finance'
  | 'documents'
  | 'routes'
  | 'reports'
  | 'notifications'
  | 'website'
  | 'settings'
  | 'security'
  | 'workforce'
  | 'add-staff'
  | 'add-driver'
  | 'warehouse';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate, initialNav }) => {
  const { currentUser, userProfile, role, signOut, lockSession } = useAuth();

  const determineInitialNav = (): AdminNavKey => {
    if (!initialNav) return 'dashboard';
    const clean = initialNav.replace(/^admin\//, '').trim();
    if (clean === 'workforce/add-staff' || clean === 'add-staff') return 'add-staff';
    if (clean === 'workforce/add-driver' || clean === 'add-driver') return 'add-driver';
    if (clean === 'activity' || clean === 'security') return 'security';
    if (clean === 'workforce') return 'workforce';
    if (clean === 'shipments') return 'shipments';
    if (clean === 'tracking') return 'tracking';
    if (clean === 'fleet') return 'fleet';
    if (clean === 'drivers') return 'drivers';
    if (clean === 'staff') return 'staff';
    if (clean === 'customers') return 'customers';
    if (clean === 'finance') return 'finance';
    if (clean === 'documents') return 'documents';
    if (clean === 'routes') return 'routes';
    if (clean === 'reports') return 'reports';
    if (clean === 'notifications') return 'notifications';
    if (clean === 'website') return 'website';
    if (clean === 'settings') return 'settings';
    return 'dashboard';
  };

  const [activeNav, setActiveNav] = useState<AdminNavKey>(determineInitialNav());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);
  const triggerToast = (message: string) => {
    setNotificationMsg(message);
    window.setTimeout(() => setNotificationMsg(null), 4000);
  };

  // Global search state
  const [globalSearch, setGlobalSearch] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);

  // Firestore Datasets
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [expenses, setExpenses] = useState<DriverExpense[]>([]);
  const [vehicleIssues, setVehicleIssues] = useState<VehicleIssue[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [contactMessages, setContactMessages] = useState<ContactMessage[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [documents, setDocuments] = useState<LogisticsDocument[]>([]);

  // Dispatch Trip Modal State
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [selectedShipmentId, setSelectedShipmentId] = useState('');
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [scheduledPickupDate, setScheduledPickupDate] = useState(new Date().toISOString().split('T')[0]);
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('');

  // Add Vehicle Modal State
  const [showAddVehicleModal, setShowAddVehicleModal] = useState(false);
  const [newReg, setNewReg] = useState('');
  const [newType, setNewType] = useState('Heavy Prime Mover (6x4)');
  const [newMake, setNewMake] = useState('Scania');
  const [newModel, setNewModel] = useState('R500');
  const [newCapacity, setNewCapacity] = useState('38000');

  // Notification Composer Modal/Form State
  const [composeTitle, setComposeTitle] = useState('');
  const [composeMessage, setComposeMessage] = useState('');
  const [composeTarget, setComposeTarget] = useState<'ALL' | 'DRIVERS' | 'STAFF' | 'CUSTOMERS'>('ALL');
  const [composePriority, setComposePriority] = useState<'NORMAL' | 'HIGH' | 'URGENT'>('NORMAL');
  const [sendingNotification, setSendingNotification] = useState(false);

  // Load the data needed for the dashboard first. Secondary collections load
  // afterward so the interface becomes usable without waiting for every module.
  const loadAllData = async () => {
    try {
      const [bList, sList, tList, dList, vList] = await Promise.all([
        db.getAll<Booking>(COLLECTIONS.BOOKINGS),
        db.getAll<Shipment>(COLLECTIONS.SHIPMENTS),
        db.getAll<Trip>(COLLECTIONS.TRIPS),
        db.getAll<Driver>(COLLECTIONS.DRIVERS),
        db.getAll<Vehicle>(COLLECTIONS.VEHICLES),
      ]);

      setBookings(bList);
      setShipments(sList);
      setTrips(tList);
      setDrivers(dList);
      setVehicles(vList);
      setLoading(false);

      // Do not block the dashboard on finance, documents, support and reporting data.
      void Promise.all([
        db.getAll<Quote>(COLLECTIONS.QUOTES),
        db.getAll<Invoice>(COLLECTIONS.INVOICES),
        db.getAll<DriverExpense>(COLLECTIONS.DRIVER_EXPENSES),
        db.getAll<VehicleIssue>(COLLECTIONS.VEHICLE_ISSUES),
        db.getAll<SupportTicket>(COLLECTIONS.SUPPORT_TICKETS),
        db.getAll<ContactMessage>(COLLECTIONS.CONTACT_MESSAGES),
        db.getAll<ActivityLog>(COLLECTIONS.ACTIVITY_LOGS),
        db.getAll<Client>(COLLECTIONS.CLIENTS),
        db.getAll<LogisticsDocument>(COLLECTIONS.DOCUMENTS),
      ]).then(([qList, iList, eList, viList, tckList, cmList, logList, cList, docList]) => {
        setQuotes(qList);
        setInvoices(iList);
        setExpenses(eList);
        setVehicleIssues(viList);
        setTickets(tckList);
        setContactMessages(cmList);
        setActivityLogs(logList);
        setClients(cList);
        setDocuments(docList);
      }).catch((e) => {
        console.error('Error loading secondary admin data:', e);
      });
    } catch (e) {
      console.error('Error loading critical admin data:', e);
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAllData();
    // A wildcard Firestore subscription caused unnecessary full refreshes and
    // attempted to subscribe to a non-existent "*" collection. Use the manual
    // refresh action instead of repeatedly downloading every collection.
    return undefined;
  }, []);

  // Convert Customer Booking to Official Shipment
  const handleConvertBooking = async (booking: Booking) => {
    try {
      const year = new Date().getFullYear();
      const count = shipments.length + 1;
      const shipmentNumber = `KCC-${year}-${String(count).padStart(6, '0')}`;

      const newShipment: Shipment = {
        id: `sh_${Date.now()}`,
        shipmentNumber,
        bookingId: booking.id,
        bookingReference: booking.bookingReference,
        customerName: booking.fullName,
        customerPhone: booking.phone,
        customerEmail: booking.email,
        originCountry: booking.pickupCountry,
        originCity: booking.pickupLocation,
        destinationCountry: booking.deliveryCountry,
        destinationCity: booking.deliveryLocation,
        cargoType: booking.cargoType,
        cargoDescription: booking.cargoDescription,
        weightKg: booking.weightKg,
        quantity: booking.quantity,
        status: 'BOOKED',
        pickupDate: booking.pickupDate,
        timeline: [
          {
            stage: 'Booking Approved',
            timestamp: new Date().toISOString(),
            completed: true,
            notes: `Converted from Booking Ref ${booking.bookingReference}`,
          },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await db.add(COLLECTIONS.SHIPMENTS, newShipment);
      await db.update<Booking>(COLLECTIONS.BOOKINGS, booking.id, {
        status: 'CONFIRMED',
        shipmentNumber,
      });

      await db.logActivity({
        action: 'Booking Converted to Shipment',
        actor: userProfile?.fullName || 'Admin',
        role: 'ADMIN',
        relatedRecordType: 'SHIPMENT',
        relatedRecordId: newShipment.id,
        details: `Booking ${booking.bookingReference} converted to Shipment ${shipmentNumber}`,
      });

      triggerToast(`Booking converted into Shipment ${shipmentNumber}`);
      loadAllData();
    } catch (err: any) {
      triggerToast(`Error: ${err.message}`);
    }
  };

  // Dispatch Trip
  const handleCreateDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShipmentId || !selectedDriverId || !selectedVehicleId) {
      triggerToast('Please select shipment, driver, and vehicle');
      return;
    }

    try {
      const createdTrip = await db.createDispatch({
        shipmentId: selectedShipmentId,
        driverId: selectedDriverId,
        vehicleId: selectedVehicleId,
        scheduledPickupDate,
        expectedDeliveryDate,
        specialInstructions: 'Cross-border corridor transport. Verify seal number at departure.',
      });

      setShowDispatchModal(false);
      triggerToast(`Trip ${createdTrip.tripReference} dispatched successfully!`);
      loadAllData();
    } catch (err: any) {
      triggerToast(`Dispatch error: ${err.message}`);
    }
  };

  // Add Vehicle
  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const now = new Date().toISOString();
      await db.add<Vehicle>(COLLECTIONS.VEHICLES, {
        id: `veh_${Date.now()}`,
        registrationNumber: newReg.trim().toUpperCase(),
        vehicleType: newType,
        make: newMake,
        model: newModel,
        capacityKg: Number(newCapacity),
        status: 'AVAILABLE',
        currentLocation: 'Kampala Yard',
        operatingCountries: ['Uganda', 'Tanzania', 'Kenya', 'Rwanda', 'Congo'],
        lastServiceDate: now.split('T')[0],
        createdAt: now,
      });
      setShowAddVehicleModal(false);
      setNewReg('');
      triggerToast('Vehicle registered in Fleet Management');
      loadAllData();
    } catch (err: any) {
      triggerToast(`Error: ${err.message}`);
    }
  };

  // Send Authorized Broadcast / Notification
  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!composeTitle.trim() || !composeMessage.trim()) {
      triggerToast('Please provide both title and message.');
      return;
    }
    setSendingNotification(true);
    try {
      const now = new Date().toISOString();
      await db.logActivity({
        action: `Notification: ${composeTitle.trim()}`,
        actor: userProfile?.fullName || 'Administrator',
        role: 'ADMIN',
        relatedRecordType: 'OPERATION',
        details: `[Target: ${composeTarget} | Priority: ${composePriority}] ${composeMessage.trim()}`,
      });

      triggerToast(`Broadcast notification dispatched to ${composeTarget}.`);
      setComposeTitle('');
      setComposeMessage('');
      loadAllData();
    } catch (err: any) {
      triggerToast(`Failed to send notification: ${err.message}`);
    } finally {
      setSendingNotification(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    if (onNavigate) {
      onNavigate('home');
    } else {
      window.location.hash = '/home';
    }
  };

  // KPI Calculations
  const activeShipments = useMemo(
    () => shipments.filter((s) => s.status !== 'DELIVERED' && s.status !== 'CANCELLED'),
    [shipments]
  );
  const deliveredShipments = useMemo(() => shipments.filter((s) => s.status === 'DELIVERED'), [shipments]);
  const activeVehicles = useMemo(
    () => vehicles.filter((v) => v.status === 'ASSIGNED' || (v.status as any) === 'ON_TRIP' || v.status === 'IN_TRANSIT'),
    [vehicles]
  );
  const availableVehicles = useMemo(() => vehicles.filter((v) => v.status === 'AVAILABLE'), [vehicles]);
  const assignedDrivers = useMemo(() => drivers.filter((d) => d.status === 'ON_TRIP'), [drivers]);
  const availableDrivers = useMemo(() => drivers.filter((d) => d.status === 'AVAILABLE'), [drivers]);
  const pendingQuotes = useMemo(() => quotes.filter((q) => q.status === 'DRAFT' || q.status === 'SENT'), [quotes]);
  const pendingDeliveries = useMemo(
    () => shipments.filter((s) => s.status === 'IN_TRANSIT' || s.status === 'AT_CHECKPOINT' || s.status === 'BORDER_CUSTOMS'),
    [shipments]
  );
  const unpaidInvoices = useMemo(() => invoices.filter((i) => i.status === 'PENDING' || i.status === 'PROCESSING'), [invoices]);
  const outstandingAmount = useMemo(
    () => unpaidInvoices.reduce((acc, i) => acc + (i.amount || 0), 0),
    [unpaidInvoices]
  );
  const pendingBookings = useMemo(() => bookings.filter((b) => b.status === 'PENDING'), [bookings]);

  // Actual Document Expiry Warning (within 30 days or expired)
  const expiringDocs = useMemo(() => {
    const now = new Date().getTime();
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    return documents.filter((d) => {
      if (!d.expiryDate) return false;
      const exp = new Date(d.expiryDate).getTime();
      return !isNaN(exp) && exp - now <= thirtyDaysMs;
    });
  }, [documents]);

  // Global Command Search Computation
  const searchResults = useMemo(() => {
    const q = globalSearch.trim().toLowerCase();
    if (!q) return null;

    const matchedShipments = shipments.filter(
      (s) =>
        s.shipmentNumber?.toLowerCase().includes(q) ||
        s.customerName?.toLowerCase().includes(q) ||
        s.originCity?.toLowerCase().includes(q) ||
        s.destinationCity?.toLowerCase().includes(q)
    );

    const matchedVehicles = vehicles.filter(
      (v) =>
        v.registrationNumber?.toLowerCase().includes(q) ||
        v.make?.toLowerCase().includes(q) ||
        v.model?.toLowerCase().includes(q)
    );

    const matchedDrivers = drivers.filter(
      (d) =>
        d.fullName?.toLowerCase().includes(q) ||
        d.licenseNumber?.toLowerCase().includes(q) ||
        d.phone?.toLowerCase().includes(q)
    );

    const matchedCustomers = clients.filter(
      (c) =>
        c.fullName?.toLowerCase().includes(q) ||
        c.companyName?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q)
    );

    const matchedInvoices = invoices.filter(
      (i) => i.invoiceReference?.toLowerCase().includes(q) || i.customerName?.toLowerCase().includes(q)
    );

    const matchedDocuments = documents.filter(
      (doc) => doc.title?.toLowerCase().includes(q) || doc.category?.toLowerCase().includes(q)
    );

    return {
      shipments: matchedShipments.slice(0, 3),
      vehicles: matchedVehicles.slice(0, 3),
      drivers: matchedDrivers.slice(0, 3),
      customers: matchedCustomers.slice(0, 3),
      invoices: matchedInvoices.slice(0, 3),
      documents: matchedDocuments.slice(0, 3),
      totalMatches:
        matchedShipments.length +
        matchedVehicles.length +
        matchedDrivers.length +
        matchedCustomers.length +
        matchedInvoices.length +
        matchedDocuments.length,
    };
  }, [globalSearch, shipments, vehicles, drivers, clients, invoices, documents]);

  // Strict Top-to-Bottom Vertical Navigation
  const navItems: {
    key: AdminNavKey;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
  }[] = [
    { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { key: 'shipments', label: 'Shipments', icon: Package, badge: activeShipments.length },
    { key: 'tracking', label: 'Live Tracking', icon: Navigation },
    { key: 'fleet', label: 'Fleet', icon: Truck, badge: vehicles.length },
    { key: 'drivers', label: 'Drivers', icon: Compass, badge: drivers.length },
    { key: 'staff', label: 'Staff', icon: Briefcase },
    { key: 'customers', label: 'Customers', icon: Users, badge: clients.length },
    { key: 'finance', label: 'Finance', icon: DollarSign, badge: unpaidInvoices.length },
    { key: 'documents', label: 'Documents', icon: FileText, badge: expiringDocs.length },
    { key: 'routes', label: 'Routes', icon: RouteIcon },
    { key: 'reports', label: 'Reports', icon: BarChart3 },
    { key: 'notifications', label: 'Notifications', icon: Bell, badge: pendingBookings.length },
    { key: 'website', label: 'Website Control', icon: Globe },
    { key: 'settings', label: 'Settings', icon: Settings },
    { key: 'security', label: 'Security', icon: Shield },
  ];

  return (
    <div className="min-h-screen bg-[#050816] text-[#F8FAFC] flex flex-col md:flex-row">
      {/* Toast Notification */}
      {notificationMsg && (
        <div className="fixed top-5 right-5 z-50 p-4 rounded-xl bg-cyan-950 border border-cyan-500/40 text-cyan-200 text-xs shadow-2xl flex items-center gap-2.5 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>{notificationMsg}</span>
        </div>
      )}

      {/* MOBILE TOP BAR (Visible only on small screens) */}
      <div className="md:hidden flex items-center justify-between p-4 bg-[#0A1024] border-b border-slate-800 sticky top-0 z-50">
        <CompanyLogo size={32} variant="compact" />
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* ============================================================
          VERTICAL NAVIGATION SIDEBAR: STRICTLY TOP TO BOTTOM
          ============================================================ */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-40 h-screen w-64 bg-[#0A1024] border-r border-slate-800 flex flex-col justify-between transition-transform duration-200 ease-in-out ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Top Header Branding */}
        <div className="p-4 border-b border-slate-800/80">
          <CompanyLogo size={38} variant="compact" />
        </div>

        {/* Vertical Nav List (TOP TO BOTTOM) */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1 scrollbar-thin scrollbar-thumb-slate-800">
          <div className="px-3 pb-2 text-[10px] font-mono uppercase text-slate-500 tracking-wider">
            Operational Navigation
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              activeNav === item.key ||
              (item.key === 'staff' && activeNav === 'workforce') ||
              (item.key === 'staff' && activeNav === 'add-staff') ||
              (item.key === 'drivers' && activeNav === 'add-driver');

            return (
              <button
                key={item.key}
                onClick={() => {
                  setActiveNav(item.key);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all group ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-600/30 to-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-semibold shadow-sm'
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
                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                      isActive ? 'bg-cyan-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Bottom Profile, Workplace Lock & Logout */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/50 space-y-2.5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-rose-600 flex items-center justify-center text-white font-bold text-xs">
              {userProfile?.fullName ? userProfile.fullName.charAt(0).toUpperCase() : 'A'}
            </div>
            <div className="overflow-hidden flex-1">
              <div className="text-xs font-semibold text-white truncate">
                {userProfile?.fullName || 'Administrator'}
              </div>
              <div className="text-[10px] text-cyan-400 font-mono">role: admin</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={() => lockSession && lockSession()}
              className="py-1.5 px-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white text-[11px] font-medium flex items-center justify-center gap-1.5 transition-colors"
              title="Lock Workplace Screen"
            >
              <Lock className="w-3 h-3 text-amber-400" />
              <span>Lock</span>
            </button>

            <button
              onClick={handleLogout}
              className="py-1.5 px-2 rounded-lg bg-slate-900 hover:bg-red-950/60 border border-slate-800 hover:border-red-500/40 text-slate-400 hover:text-red-300 text-[11px] font-medium flex items-center justify-center gap-1.5 transition-colors"
            >
              <LogOut className="w-3 h-3" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* ============================================================
          MAIN WORKPLACE VIEW AREA
          ============================================================ */}
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 overflow-y-auto">
        {/* GLOBAL COMMAND SEARCH STRIP */}
        <div className="mb-6 relative">
          <div className="flex items-center gap-3 bg-[#0A1024]/90 border border-slate-800 rounded-2xl px-4 py-2.5 shadow-xl backdrop-blur-md">
            <Search className="w-4 h-4 text-cyan-400 shrink-0" />
            <input
              type="text"
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              placeholder="Search driver, staff, vehicle, customer, shipment, tracking number, invoice, quote, or document..."
              className="w-full bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none font-sans"
            />
            {globalSearch && (
              <button
                onClick={() => setGlobalSearch('')}
                className="p-1 rounded-md text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={loadAllData}
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-cyan-400 border border-slate-800 transition-colors"
              title="Synchronize real Firestore data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Search Results Dropdown */}
          {globalSearch && searchFocused && searchResults && (
            <div className="absolute left-0 right-0 top-full mt-2 z-50 bg-[#0A1024] border border-cyan-500/40 rounded-2xl p-4 shadow-2xl max-h-96 overflow-y-auto space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-[11px]">
                <span className="font-mono text-cyan-400">
                  {searchResults.totalMatches} Record Matches Found
                </span>
                <button
                  onClick={() => setSearchFocused(false)}
                  className="text-slate-400 hover:text-white"
                >
                  Close
                </button>
              </div>

              {searchResults.totalMatches === 0 ? (
                <div className="text-center py-4 text-xs text-slate-400">
                  No records match "{globalSearch}". Try another query.
                </div>
              ) : (
                <div className="space-y-3 text-xs">
                  {/* Shipments */}
                  {searchResults.shipments.length > 0 && (
                    <div>
                      <div className="text-[10px] font-mono text-slate-400 uppercase mb-1">Shipments</div>
                      <div className="space-y-1">
                        {searchResults.shipments.map((s) => (
                          <button
                            key={s.id}
                            onClick={() => {
                              setActiveNav('shipments');
                              setGlobalSearch('');
                            }}
                            className="w-full text-left p-2 rounded-xl bg-slate-950/70 hover:bg-slate-900 border border-slate-800 flex items-center justify-between"
                          >
                            <span className="font-mono font-bold text-cyan-400">{s.shipmentNumber}</span>
                            <span className="text-slate-300">{s.customerName} ({s.status})</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Vehicles */}
                  {searchResults.vehicles.length > 0 && (
                    <div>
                      <div className="text-[10px] font-mono text-slate-400 uppercase mb-1">Vehicles</div>
                      <div className="space-y-1">
                        {searchResults.vehicles.map((v) => (
                          <button
                            key={v.id}
                            onClick={() => {
                              setActiveNav('fleet');
                              setGlobalSearch('');
                            }}
                            className="w-full text-left p-2 rounded-xl bg-slate-950/70 hover:bg-slate-900 border border-slate-800 flex items-center justify-between"
                          >
                            <span className="font-mono font-bold text-teal-400">{v.registrationNumber}</span>
                            <span className="text-slate-300">{v.make} {v.model} ({v.status})</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Drivers */}
                  {searchResults.drivers.length > 0 && (
                    <div>
                      <div className="text-[10px] font-mono text-slate-400 uppercase mb-1">Drivers</div>
                      <div className="space-y-1">
                        {searchResults.drivers.map((d) => (
                          <button
                            key={d.id}
                            onClick={() => {
                              setActiveNav('drivers');
                              setGlobalSearch('');
                            }}
                            className="w-full text-left p-2 rounded-xl bg-slate-950/70 hover:bg-slate-900 border border-slate-800 flex items-center justify-between"
                          >
                            <span className="font-bold text-white">{d.fullName}</span>
                            <span className="text-slate-400 font-mono">{d.phone}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Customers */}
                  {searchResults.customers.length > 0 && (
                    <div>
                      <div className="text-[10px] font-mono text-slate-400 uppercase mb-1">Customers</div>
                      <div className="space-y-1">
                        {searchResults.customers.map((c) => (
                          <button
                            key={c.id}
                            onClick={() => {
                              setActiveNav('customers');
                              setGlobalSearch('');
                            }}
                            className="w-full text-left p-2 rounded-xl bg-slate-950/70 hover:bg-slate-900 border border-slate-800 flex items-center justify-between"
                          >
                            <span className="font-bold text-white">{c.fullName}</span>
                            <span className="text-slate-400">{c.companyName || c.email}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Invoices */}
                  {searchResults.invoices.length > 0 && (
                    <div>
                      <div className="text-[10px] font-mono text-slate-400 uppercase mb-1">Invoices</div>
                      <div className="space-y-1">
                        {searchResults.invoices.map((i) => (
                          <button
                            key={i.id}
                            onClick={() => {
                              setActiveNav('finance');
                              setGlobalSearch('');
                            }}
                            className="w-full text-left p-2 rounded-xl bg-slate-950/70 hover:bg-slate-900 border border-slate-800 flex items-center justify-between"
                          >
                            <span className="font-mono text-cyan-400">{i.invoiceReference}</span>
                            <span className="text-slate-300">USD {i.amount} ({i.status})</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Documents */}
                  {searchResults.documents.length > 0 && (
                    <div>
                      <div className="text-[10px] font-mono text-slate-400 uppercase mb-1">Documents</div>
                      <div className="space-y-1">
                        {searchResults.documents.map((doc) => (
                          <button
                            key={doc.id}
                            onClick={() => {
                              setActiveNav('documents');
                              setGlobalSearch('');
                            }}
                            className="w-full text-left p-2 rounded-xl bg-slate-950/70 hover:bg-slate-900 border border-slate-800 flex items-center justify-between"
                          >
                            <span className="text-white font-medium">{doc.title}</span>
                            <span className="font-mono text-slate-400">{doc.category}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ============================================================
            SECTION: DASHBOARD (Central Command Operational Overview)
            ============================================================ */}
        {activeNav === 'dashboard' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Top Command Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0A1024]/80 p-6 rounded-2xl border border-slate-800/80">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
                  <span className="text-xs font-mono uppercase text-cyan-400 font-semibold tracking-wider">
                    OPERATIONAL CONTROL GRID
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-white font-['Poppins'] mt-1">
                  Central Command Overview
                </h2>
                <p className="text-slate-400 text-xs mt-1">
                  Live metrics across Uganda, Kenya, Tanzania, Rwanda, and DR Congo transport corridors.
                </p>
              </div>

              {/* Primary Quick Actions */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setActiveNav('shipments')}
                  className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-lg shadow-cyan-600/20"
                >
                  <Package className="w-3.5 h-3.5" />
                  <span>Create Shipment</span>
                </button>
                <button
                  onClick={() => setShowAddVehicleModal(true)}
                  className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 hover:border-slate-600 text-slate-300 hover:text-white text-xs font-medium flex items-center gap-1.5"
                >
                  <Plus className="w-3 h-3 text-cyan-400" />
                  <span>Add Vehicle</span>
                </button>
                <button
                  onClick={() => setActiveNav('add-driver')}
                  className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 hover:border-slate-600 text-slate-300 hover:text-white text-xs font-medium flex items-center gap-1.5"
                >
                  <UserPlus className="w-3 h-3 text-teal-400" />
                  <span>Register Driver</span>
                </button>
                <button
                  onClick={() => setActiveNav('add-staff')}
                  className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 hover:border-slate-600 text-slate-300 hover:text-white text-xs font-medium flex items-center gap-1.5"
                >
                  <Briefcase className="w-3 h-3 text-indigo-400" />
                  <span>Add Staff</span>
                </button>
                <button
                  onClick={() => setActiveNav('finance')}
                  className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 hover:border-slate-600 text-slate-300 hover:text-white text-xs font-medium flex items-center gap-1.5"
                >
                  <DollarSign className="w-3 h-3 text-emerald-400" />
                  <span>Create Quote</span>
                </button>
              </div>
            </div>

            {/* Quick Action Navigation Grid: Exactly 7 Core Actions */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
              <button
                onClick={() => setActiveNav('shipments')}
                className="p-3 rounded-xl bg-[#0A1024]/70 border border-slate-800 hover:border-cyan-500/40 text-left transition-all group"
              >
                <div className="text-[10px] text-slate-500 uppercase font-mono">Action</div>
                <div className="text-xs font-semibold text-white group-hover:text-cyan-400 flex items-center justify-between mt-1">
                  <span>Create Shipment</span>
                  <Package className="w-3 h-3 text-slate-600 group-hover:text-cyan-400" />
                </div>
              </button>

              <button
                onClick={() => setShowAddVehicleModal(true)}
                className="p-3 rounded-xl bg-[#0A1024]/70 border border-slate-800 hover:border-cyan-500/40 text-left transition-all group"
              >
                <div className="text-[10px] text-slate-500 uppercase font-mono">Action</div>
                <div className="text-xs font-semibold text-white group-hover:text-cyan-400 flex items-center justify-between mt-1">
                  <span>Add Vehicle</span>
                  <Plus className="w-3 h-3 text-slate-600 group-hover:text-cyan-400" />
                </div>
              </button>

              <button
                onClick={() => setActiveNav('add-driver')}
                className="p-3 rounded-xl bg-[#0A1024]/70 border border-slate-800 hover:border-cyan-500/40 text-left transition-all group"
              >
                <div className="text-[10px] text-slate-500 uppercase font-mono">Action</div>
                <div className="text-xs font-semibold text-white group-hover:text-cyan-400 flex items-center justify-between mt-1">
                  <span>Register Driver</span>
                  <UserPlus className="w-3 h-3 text-slate-600 group-hover:text-cyan-400" />
                </div>
              </button>

              <button
                onClick={() => setActiveNav('add-staff')}
                className="p-3 rounded-xl bg-[#0A1024]/70 border border-slate-800 hover:border-cyan-500/40 text-left transition-all group"
              >
                <div className="text-[10px] text-slate-500 uppercase font-mono">Action</div>
                <div className="text-xs font-semibold text-white group-hover:text-cyan-400 flex items-center justify-between mt-1">
                  <span>Add Staff</span>
                  <Briefcase className="w-3 h-3 text-slate-600 group-hover:text-cyan-400" />
                </div>
              </button>

              <button
                onClick={() => setActiveNav('finance')}
                className="p-3 rounded-xl bg-[#0A1024]/70 border border-slate-800 hover:border-cyan-500/40 text-left transition-all group"
              >
                <div className="text-[10px] text-slate-500 uppercase font-mono">Action</div>
                <div className="text-xs font-semibold text-white group-hover:text-cyan-400 flex items-center justify-between mt-1">
                  <span>Create Quote</span>
                  <DollarSign className="w-3 h-3 text-slate-600 group-hover:text-cyan-400" />
                </div>
              </button>

              <button
                onClick={() => setActiveNav('documents')}
                className="p-3 rounded-xl bg-[#0A1024]/70 border border-slate-800 hover:border-cyan-500/40 text-left transition-all group"
              >
                <div className="text-[10px] text-slate-500 uppercase font-mono">Action</div>
                <div className="text-xs font-semibold text-white group-hover:text-cyan-400 flex items-center justify-between mt-1">
                  <span>Upload Document</span>
                  <FileText className="w-3 h-3 text-slate-600 group-hover:text-cyan-400" />
                </div>
              </button>

              <button
                onClick={() => setActiveNav('reports')}
                className="p-3 rounded-xl bg-[#0A1024]/70 border border-slate-800 hover:border-cyan-500/40 text-left transition-all group"
              >
                <div className="text-[10px] text-slate-500 uppercase font-mono">Action</div>
                <div className="text-xs font-semibold text-white group-hover:text-cyan-400 flex items-center justify-between mt-1">
                  <span>Generate Report</span>
                  <BarChart3 className="w-3 h-3 text-slate-600 group-hover:text-cyan-400" />
                </div>
              </button>
            </div>

            {/* REAL FIRESTORE OPERATIONAL KPI STRIP: All 9 Core Operational Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-9 gap-3">
              {/* 1. Active Shipments */}
              <div className="bg-[#0A1024]/80 border border-slate-800 rounded-2xl p-3.5 hover:border-cyan-500/30 transition-colors">
                <div className="flex items-center justify-between text-slate-400 text-xs">
                  <span className="truncate">Active Shipments</span>
                  <Package className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                </div>
                <div className="text-xl font-bold text-white font-mono mt-1.5">{activeShipments.length}</div>
                <div className="text-[10px] text-slate-500 mt-0.5 truncate">{deliveredShipments.length} delivered</div>
              </div>

              {/* 2. Vehicles Currently Active */}
              <div className="bg-[#0A1024]/80 border border-slate-800 rounded-2xl p-3.5 hover:border-teal-500/30 transition-colors">
                <div className="flex items-center justify-between text-slate-400 text-xs">
                  <span className="truncate">Active Vehicles</span>
                  <Truck className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                </div>
                <div className="text-xl font-bold text-teal-400 font-mono mt-1.5">{activeVehicles.length}</div>
                <div className="text-[10px] text-slate-500 mt-0.5 truncate">Currently on trip</div>
              </div>

              {/* 3. Available Vehicles */}
              <div className="bg-[#0A1024]/80 border border-slate-800 rounded-2xl p-3.5 hover:border-emerald-500/30 transition-colors">
                <div className="flex items-center justify-between text-slate-400 text-xs">
                  <span className="truncate">Available Vehicles</span>
                  <Truck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                </div>
                <div className="text-xl font-bold text-emerald-400 font-mono mt-1.5">{availableVehicles.length}</div>
                <div className="text-[10px] text-slate-500 mt-0.5 truncate">Ready in terminal</div>
              </div>

              {/* 4. Assigned Drivers */}
              <div className="bg-[#0A1024]/80 border border-slate-800 rounded-2xl p-3.5 hover:border-blue-500/30 transition-colors">
                <div className="flex items-center justify-between text-slate-400 text-xs">
                  <span className="truncate">Assigned Drivers</span>
                  <Compass className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                </div>
                <div className="text-xl font-bold text-blue-400 font-mono mt-1.5">{assignedDrivers.length}</div>
                <div className="text-[10px] text-slate-500 mt-0.5 truncate">Assigned to routes</div>
              </div>

              {/* 5. Available Drivers */}
              <div className="bg-[#0A1024]/80 border border-slate-800 rounded-2xl p-3.5 hover:border-indigo-500/30 transition-colors">
                <div className="flex items-center justify-between text-slate-400 text-xs">
                  <span className="truncate">Available Drivers</span>
                  <Compass className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                </div>
                <div className="text-xl font-bold text-indigo-300 font-mono mt-1.5">{availableDrivers.length}</div>
                <div className="text-[10px] text-slate-500 mt-0.5 truncate">Ready for dispatch</div>
              </div>

              {/* 6. Pending Quote Requests */}
              <div className="bg-[#0A1024]/80 border border-slate-800 rounded-2xl p-3.5 hover:border-amber-500/30 transition-colors">
                <div className="flex items-center justify-between text-slate-400 text-xs">
                  <span className="truncate">Pending Quotes</span>
                  <DollarSign className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                </div>
                <div className="text-xl font-bold text-amber-400 font-mono mt-1.5">{pendingQuotes.length}</div>
                <div className="text-[10px] text-slate-500 mt-0.5 truncate">Awaiting pricing</div>
              </div>

              {/* 7. Pending Deliveries */}
              <div className="bg-[#0A1024]/80 border border-slate-800 rounded-2xl p-3.5 hover:border-cyan-500/30 transition-colors">
                <div className="flex items-center justify-between text-slate-400 text-xs">
                  <span className="truncate">Pending Deliveries</span>
                  <Navigation className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                </div>
                <div className="text-xl font-bold text-cyan-400 font-mono mt-1.5">{pendingDeliveries.length}</div>
                <div className="text-[10px] text-slate-500 mt-0.5 truncate">In transit corridor</div>
              </div>

              {/* 8. Documents Approaching Expiry */}
              <div className="bg-[#0A1024]/80 border border-slate-800 rounded-2xl p-3.5 hover:border-rose-500/30 transition-colors">
                <div className="flex items-center justify-between text-slate-400 text-xs">
                  <span className="truncate">Expiring Docs</span>
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                </div>
                <div className="text-xl font-bold text-rose-400 font-mono mt-1.5">{expiringDocs.length}</div>
                <div className="text-[10px] text-slate-500 mt-0.5 truncate">≤ 30 days renewal</div>
              </div>

              {/* 9. Outstanding Payments */}
              <div className="bg-[#0A1024]/80 border border-slate-800 rounded-2xl p-3.5 hover:border-emerald-500/30 transition-colors">
                <div className="flex items-center justify-between text-slate-400 text-xs">
                  <span className="truncate">Outstanding Pay</span>
                  <DollarSign className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                </div>
                <div className="text-xl font-bold text-emerald-400 font-mono mt-1.5">{unpaidInvoices.length}</div>
                <div className="text-[10px] text-slate-500 mt-0.5 truncate">${outstandingAmount.toLocaleString()}</div>
              </div>
            </div>

            {/* Two-Column Middle Section: Bookings & Corridor Alerts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column (2 spans): Incoming Customer Bookings */}
              <div className="lg:col-span-2 bg-[#0A1024]/80 border border-slate-800 rounded-2xl p-5 shadow-xl">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-amber-400" />
                    <h3 className="text-sm font-bold text-white font-['Poppins']">
                      Incoming Customer Bookings ({pendingBookings.length})
                    </h3>
                  </div>
                  <button
                    onClick={() => setActiveNav('shipments')}
                    className="text-xs text-cyan-400 hover:text-cyan-300 font-medium"
                  >
                    View All Shipments →
                  </button>
                </div>

                {pendingBookings.length === 0 ? (
                  <EmptyState
                    title="No data available yet"
                    description="When customers submit cargo consignment requests online, they will appear here for verification and conversion to formal shipments."
                    icon={<Package className="w-6 h-6 text-cyan-400" />}
                  />
                ) : (
                  <div className="space-y-3">
                    {pendingBookings.slice(0, 4).map((b) => (
                      <div
                        key={b.id}
                        className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-700 transition-colors"
                      >
                        <div>
                          <div className="flex items-center gap-2 font-mono text-xs">
                            <span className="text-cyan-400 font-bold">{b.bookingReference}</span>
                            <span className="text-slate-500">•</span>
                            <span className="text-slate-300 font-semibold">{b.fullName}</span>
                            <span className="text-slate-500">•</span>
                            <span className="text-slate-400">{b.phone}</span>
                          </div>
                          <div className="text-xs text-slate-300 mt-1 flex items-center gap-2">
                            <span>{b.pickupLocation}, {b.pickupCountry}</span>
                            <span className="text-cyan-400">→</span>
                            <span>{b.deliveryLocation}, {b.deliveryCountry}</span>
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            Cargo: {b.cargoType} • {b.weightKg?.toLocaleString()} kg
                          </div>
                        </div>

                        <button
                          onClick={() => handleConvertBooking(b)}
                          className="px-3.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs shadow-md shadow-cyan-600/30 flex items-center gap-1.5 self-start sm:self-auto shrink-0"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Approve & Create</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Column: Important Operational Alerts & Activity */}
              <div className="space-y-4">
                {/* Expiring Documents Alert Card */}
                <div className="bg-[#0A1024]/80 border border-slate-800 rounded-2xl p-5 shadow-xl">
                  <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-400" />
                      <h3 className="text-sm font-bold text-white font-['Poppins']">
                        Document Expiry Alerts ({expiringDocs.length})
                      </h3>
                    </div>
                    <button
                      onClick={() => setActiveNav('documents')}
                      className="text-xs text-cyan-400 hover:text-cyan-300"
                    >
                      Vault →
                    </button>
                  </div>

                  {expiringDocs.length === 0 ? (
                    <div className="text-xs text-slate-400 py-3 text-center">
                      No documents expiring in the next 30 days.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {expiringDocs.slice(0, 3).map((d) => (
                        <div
                          key={d.id}
                          className="p-2.5 rounded-xl bg-rose-950/20 border border-rose-500/20 text-xs flex items-center justify-between"
                        >
                          <div>
                            <div className="font-semibold text-rose-200 truncate">{d.title}</div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              Expires: {d.expiryDate}
                            </div>
                          </div>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-900/60 text-rose-300 border border-rose-500/30">
                            Action
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Outstanding Invoices Summary */}
                <div className="bg-[#0A1024]/80 border border-slate-800 rounded-2xl p-5 shadow-xl">
                  <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-emerald-400" />
                      <h3 className="text-sm font-bold text-white font-['Poppins']">
                        Outstanding Payments
                      </h3>
                    </div>
                    <button
                      onClick={() => setActiveNav('finance')}
                      className="text-xs text-cyan-400 hover:text-cyan-300"
                    >
                      Finance →
                    </button>
                  </div>

                  <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl">
                    <div className="text-[10px] text-slate-400 font-mono uppercase">
                      Unpaid Commercial Invoices ({unpaidInvoices.length})
                    </div>
                    <div className="text-xl font-bold text-emerald-400 font-mono mt-1">
                      USD {outstandingAmount.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Row: Recent System Activity Logs from Firestore */}
            <div className="bg-[#0A1024]/80 border border-slate-800 rounded-2xl p-5 shadow-xl">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-sm font-bold text-white font-['Poppins']">
                    Recent Audit & Operational Activity
                  </h3>
                </div>
                <button
                  onClick={() => setActiveNav('security')}
                  className="text-xs text-cyan-400 hover:text-cyan-300 font-medium"
                >
                  View Security Audit Logs →
                </button>
              </div>

              {activityLogs.length === 0 ? (
                <EmptyState
                  title="No data available yet"
                  description="Administrative dispatches, user creation, vehicle updates, and security logs will record here in real-time."
                  icon={<Activity className="w-6 h-6 text-cyan-400" />}
                />
              ) : (
                <div className="space-y-2">
                  {activityLogs.slice(0, 5).map((log) => (
                    <div
                      key={log.id}
                      className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-cyan-400 shrink-0" />
                        <div>
                          <div className="font-semibold text-white">{log.action}</div>
                          <div className="text-[11px] text-slate-400">{log.details}</div>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-[10px] text-cyan-400 font-mono">{log.actor}</div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================================================
            SECTION: SHIPMENTS
            ============================================================ */}
        {activeNav === 'shipments' && (
          <CargoOperations initialSubTab="shipments" onRefreshStats={loadAllData} />
        )}

        {/* ============================================================
            SECTION: LIVE TRACKING (Google Maps & Corridor Fleet Radar)
            ============================================================ */}
        {activeNav === 'tracking' && <LiveTrackingMap />}

        {/* ============================================================
            SECTION: FLEET
            ============================================================ */}
        {activeNav === 'fleet' && (
          <FleetOperations initialSubTab="vehicles" onRefreshStats={loadAllData} />
        )}

        {/* ============================================================
            SECTION: DRIVERS
            ============================================================ */}
        {activeNav === 'drivers' && (
          <WorkforceManagement initialTab="directory" onNavigate={onNavigate} />
        )}

        {/* ============================================================
            SECTION: STAFF
            ============================================================ */}
        {activeNav === 'staff' && (
          <WorkforceManagement initialTab="directory" onNavigate={onNavigate} />
        )}

        {/* ============================================================
            SECTION: CUSTOMERS
            ============================================================ */}
        {activeNav === 'customers' && (
          <CommercialManagement initialSubTab="clients" onRefreshStats={loadAllData} />
        )}

        {/* ============================================================
            SECTION: FINANCE
            ============================================================ */}
        {activeNav === 'finance' && (
          <CommercialManagement initialSubTab="invoices" onRefreshStats={loadAllData} />
        )}

        {/* ============================================================
            SECTION: DOCUMENTS
            ============================================================ */}
        {activeNav === 'documents' && <CentralDocumentManager />}

        {/* ============================================================
            SECTION: ROUTES
            ============================================================ */}
        {activeNav === 'routes' && (
          <OperationsRoutes initialSubTab="routes" onRefreshStats={loadAllData} />
        )}

        {/* ============================================================
            SECTION: REPORTS
            ============================================================ */}
        {activeNav === 'reports' && <CentralReports />}

        {/* ============================================================
            SECTION: NOTIFICATIONS
            ============================================================ */}
        {activeNav === 'notifications' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Header Strip */}
            <div className="bg-[#0A1024]/80 p-6 rounded-2xl border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-white font-['Poppins']">
                  Admin Notification Center
                </h2>
                <p className="text-slate-400 text-xs mt-1">
                  Transmit authorized operational alerts to Drivers, Staff, and Customers across all regional corridors.
                </p>
              </div>
            </div>

            {/* Notification Broadcast Composer */}
            <div className="bg-[#0A1024]/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
                <Send className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white font-['Poppins']">
                  Compose Authorized Broadcast
                </h3>
              </div>

              <form onSubmit={handleSendNotification} className="space-y-3.5 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 mb-1 font-mono">Target Audience *</label>
                    <select
                      value={composeTarget}
                      onChange={(e) => setComposeTarget(e.target.value as any)}
                      className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-sans"
                    >
                      <option value="ALL">All Network (Drivers, Staff & Customers)</option>
                      <option value="DRIVERS">Commercial Drivers Fleet</option>
                      <option value="STAFF">Operations & Logistics Staff</option>
                      <option value="CUSTOMERS">Registered Freight Customers</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 mb-1 font-mono">Urgency / Priority *</label>
                    <select
                      value={composePriority}
                      onChange={(e) => setComposePriority(e.target.value as any)}
                      className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-sans"
                    >
                      <option value="NORMAL">Normal Advisory</option>
                      <option value="HIGH">High Priority (Corridor Checkpoints)</option>
                      <option value="URGENT">Urgent (Border Crossing / Security Alert)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-mono">Notification Title *</label>
                  <input
                    type="text"
                    required
                    value={composeTitle}
                    onChange={(e) => setComposeTitle(e.target.value)}
                    placeholder="e.g. Northern Corridor Malaba Border Checkpoint Update"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-sans placeholder-slate-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-mono">Notification Message Body *</label>
                  <textarea
                    rows={3}
                    required
                    value={composeMessage}
                    onChange={(e) => setComposeMessage(e.target.value)}
                    placeholder="Provide specific operational details, required actions, or instructions..."
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-sans placeholder-slate-500"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={sendingNotification}
                    className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-cyan-600/20 flex items-center gap-2"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{sendingNotification ? 'Transmitting...' : 'Dispatch Notification'}</span>
                  </button>
                </div>
              </form>
            </div>

            {/* System Generated Notifications Feed */}
            <div className="bg-[#0A1024]/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-sm font-bold text-white font-['Poppins']">
                    System-Generated Alerts Feed
                  </h3>
                </div>
                <span className="text-xs text-slate-500 font-mono">Stored in Firestore</span>
              </div>

              {pendingBookings.length === 0 && expiringDocs.length === 0 && unpaidInvoices.length === 0 ? (
                <EmptyState
                  title="No active alerts"
                  description="System-generated alerts for document renewals, payment updates, and consignment approvals will appear here."
                  icon={<Bell className="w-6 h-6 text-cyan-400" />}
                />
              ) : (
                <div className="space-y-3">
                  {/* Expiring Docs Alerts */}
                  {expiringDocs.map((d) => (
                    <div
                      key={d.id}
                      className="p-3.5 bg-rose-950/30 border border-rose-500/30 rounded-xl flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                        <div>
                          <div className="font-semibold text-rose-200">
                            Document Approaching Expiry: {d.title}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            Category: {d.category} • Expiry Date: {d.expiryDate}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => setActiveNav('documents')}
                        className="px-3 py-1 rounded-lg bg-rose-900/60 hover:bg-rose-900 text-rose-200 text-xs font-semibold shrink-0"
                      >
                        Inspect
                      </button>
                    </div>
                  ))}

                  {/* Pending Bookings Alerts */}
                  {pendingBookings.map((b) => (
                    <div
                      key={b.id}
                      className="p-3.5 bg-amber-950/30 border border-amber-500/30 rounded-xl flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <Package className="w-4 h-4 text-amber-400 shrink-0" />
                        <div>
                          <div className="font-semibold text-amber-200">
                            New Customer Cargo Booking: {b.bookingReference}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {b.fullName} • {b.cargoType} ({b.weightKg} kg)
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => setActiveNav('shipments')}
                        className="px-3 py-1 rounded-lg bg-amber-900/60 hover:bg-amber-900 text-amber-200 text-xs font-semibold shrink-0"
                      >
                        Review
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================================================
            SECTION: WEBSITE CONTROL
            ============================================================ */}
        {activeNav === 'website' && (
          <WebsiteManagement
            onPreviewPublicSite={() => {
              if (onNavigate) onNavigate('home');
              else window.location.hash = '/home';
            }}
          />
        )}

        {/* ============================================================
            SECTION: SETTINGS
            ============================================================ */}
        {activeNav === 'settings' && <AdminSettings />}

        {/* ============================================================
            SECTION: SECURITY
            ============================================================ */}
        {activeNav === 'security' && <AdminSecurity initialSubTab="users" />}

        {/* ============================================================
            DIRECT WORKFORCE PATHS
            ============================================================ */}
        {activeNav === 'workforce' && (
          <WorkforceManagement initialTab="directory" onNavigate={onNavigate} />
        )}
        {activeNav === 'add-staff' && (
          <WorkforceManagement initialTab="add-staff" onNavigate={onNavigate} />
        )}
        {activeNav === 'add-driver' && (
          <WorkforceManagement initialTab="add-driver" onNavigate={onNavigate} />
        )}
        {activeNav === 'warehouse' && <WarehouseManagement />}
      </main>

      {/* DISPATCH TRIP MODAL */}
      {showDispatchModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0A1024] border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white font-['Poppins']">Dispatch Freight Trip</h3>
              <button
                onClick={() => setShowDispatchModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateDispatch} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1">Select Active Shipment *</label>
                <select
                  required
                  value={selectedShipmentId}
                  onChange={(e) => setSelectedShipmentId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white"
                >
                  <option value="">-- Choose Shipment --</option>
                  {shipments.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.shipmentNumber} ({s.customerName} - {s.cargoType})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Select Driver *</label>
                <select
                  required
                  value={selectedDriverId}
                  onChange={(e) => setSelectedDriverId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white"
                >
                  <option value="">-- Choose Driver --</option>
                  {drivers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.fullName} ({d.phone}) - {d.status}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Select Fleet Asset *</label>
                <select
                  required
                  value={selectedVehicleId}
                  onChange={(e) => setSelectedVehicleId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white"
                >
                  <option value="">-- Choose Fleet Vehicle --</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.registrationNumber} ({v.make} {v.model}) - {v.status}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">Pickup Date</label>
                  <input
                    type="date"
                    value={scheduledPickupDate}
                    onChange={(e) => setScheduledPickupDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Expected Delivery</label>
                  <input
                    type="date"
                    value={expectedDeliveryDate}
                    onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowDispatchModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold rounded-xl"
                >
                  Confirm Dispatch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD VEHICLE MODAL */}
      {showAddVehicleModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0A1024] border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white font-['Poppins']">Register Fleet Vehicle</h3>
            <form onSubmit={handleAddVehicle} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1">Registration Number *</label>
                <input
                  type="text"
                  required
                  value={newReg}
                  onChange={(e) => setNewReg(e.target.value)}
                  placeholder="e.g. UBD 849X or KDA 120Z"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono uppercase"
                />
              </div>
              <div>
                <label className="block text-slate-300 mb-1">Vehicle Type</label>
                <input
                  type="text"
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">Make</label>
                  <input
                    type="text"
                    value={newMake}
                    onChange={(e) => setNewMake(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Model</label>
                  <input
                    type="text"
                    value={newModel}
                    onChange={(e) => setNewModel(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-300 mb-1">Payload Capacity (KG)</label>
                <input
                  type="number"
                  value={newCapacity}
                  onChange={(e) => setNewCapacity(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddVehicleModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl"
                >
                  Save Vehicle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
