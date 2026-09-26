import React, { useState, useEffect } from 'react';
import {
  Package,
  Navigation,
  CheckCircle2,
  AlertCircle,
  Clock,
  MapPin,
  Truck,
  User,
  Plus,
  Search,
  Filter,
  RefreshCw,
  X,
  FileText,
  Calendar,
  Layers,
  ArrowRight,
  ShieldCheck,
  Eye,
  Camera,
  CheckCheck,
} from 'lucide-react';
import { db, COLLECTIONS } from '../../lib/firestoreService';
import {
  Shipment,
  Booking,
  Trip,
  Driver,
  Vehicle,
  DeliveryProof,
  ShipmentStatus,
  ShipmentTimelineStage,
} from '../../types';
import { EmptyState } from '../common/EmptyState';
import { useAuth } from '../../context/AuthContext';

interface CargoOperationsProps {
  initialSubTab?: 'shipments' | 'bookings' | 'active' | 'tracking' | 'pod' | 'history';
  onRefreshStats?: () => void;
}

export const CargoOperations: React.FC<CargoOperationsProps> = ({
  initialSubTab = 'shipments',
  onRefreshStats,
}) => {
  const { userProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<'shipments' | 'bookings' | 'active' | 'tracking' | 'pod' | 'history'>(
    initialSubTab
  );

  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Firestore Datasets
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [deliveryProofs, setDeliveryProofs] = useState<DeliveryProof[]>([]);

  // Modals
  const [showCreateShipmentModal, setShowCreateShipmentModal] = useState(false);
  const [showAddTrackingEventModal, setShowAddTrackingEventModal] = useState(false);
  const [selectedShipmentForEvent, setSelectedShipmentForEvent] = useState<Shipment | null>(null);
  const [inspectShipment, setInspectShipment] = useState<Shipment | null>(null);
  const [inspectPod, setInspectPod] = useState<DeliveryProof | null>(null);

  // Tracking query state
  const [trackingSearchInput, setTrackingSearchInput] = useState('');
  const [trackedShipment, setTrackedShipment] = useState<Shipment | null>(null);
  const [trackingNotFound, setTrackingNotFound] = useState(false);

  // New Shipment Form
  const [shipmentForm, setShipmentForm] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    originCountry: 'Kenya',
    originCity: 'Mombasa Port',
    destinationCountry: 'Uganda',
    destinationCity: 'Kampala Logistics Yard',
    cargoType: 'Containerized Goods (40ft High Cube)',
    cargoDescription: '',
    weightKg: 24500,
    quantity: 1,
    dimensions: '12.2m x 2.4m x 2.9m',
    assignedDriverId: '',
    assignedVehicleId: '',
    priority: 'Standard Corridor Transit',
    pickupDate: new Date().toISOString().split('T')[0],
    expectedDelivery: '',
    specialInstructions: '',
  });

  // Tracking Event Form
  const [trackingEventForm, setTrackingEventForm] = useState({
    stage: 'IN_TRANSIT',
    location: 'Busia One-Stop Border Post, UG/KE',
    notes: 'Customs seals verified and scan cleared.',
    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [sList, bList, tList, dList, vList, podList] = await Promise.all([
        db.getAll<Shipment>(COLLECTIONS.SHIPMENTS),
        db.getAll<Booking>(COLLECTIONS.BOOKINGS),
        db.getAll<Trip>(COLLECTIONS.TRIPS),
        db.getAll<Driver>(COLLECTIONS.DRIVERS),
        db.getAll<Vehicle>(COLLECTIONS.VEHICLES),
        db.getAll<DeliveryProof>(COLLECTIONS.DELIVERY_PROOFS),
      ]);
      setShipments(sList);
      setBookings(bList);
      setTrips(tList);
      setDrivers(dList);
      setVehicles(vList);
      setDeliveryProofs(podList);
      if (onRefreshStats) onRefreshStats();
    } catch (err) {
      console.error('Error loading cargo data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const unsubS = db.subscribe(COLLECTIONS.SHIPMENTS, loadData);
    const unsubB = db.subscribe(COLLECTIONS.BOOKINGS, loadData);
    const unsubT = db.subscribe(COLLECTIONS.TRIPS, loadData);
    const unsubP = db.subscribe(COLLECTIONS.DELIVERY_PROOFS, loadData);
    return () => {
      unsubS();
      unsubB();
      unsubT();
      unsubP();
    };
  }, []);

  // Handlers
  const handleCreateShipment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const now = new Date().toISOString();
      const shipmentNumber = `KCC-SHP-2026-${Math.floor(100000 + Math.random() * 900000)}`;

      const assignedDrv = drivers.find((d) => d.id === shipmentForm.assignedDriverId);
      const assignedVeh = vehicles.find((v) => v.id === shipmentForm.assignedVehicleId);

      const initialStatus: ShipmentStatus = (shipmentForm.assignedDriverId || shipmentForm.assignedVehicleId)
        ? 'ASSIGNED'
        : 'CREATED';

      const initialTimeline: ShipmentTimelineStage[] = [
        {
          stage: initialStatus === 'ASSIGNED' ? 'Shipment Assigned' : 'Shipment Created',
          timestamp: now,
          completed: true,
          location: `${shipmentForm.originCity}, ${shipmentForm.originCountry}`,
          notes: `Manifest authorized in Kirenga Central Command by ${userProfile?.fullName || 'Administrator'}.`,
          updatedBy: userProfile?.fullName || 'Administrator',
          previousStatus: 'NONE',
          newStatus: initialStatus,
        },
      ];

      const newShipment = await db.add<Shipment>(COLLECTIONS.SHIPMENTS, {
        ...shipmentForm,
        shipmentNumber,
        status: initialStatus,
        assignedDriverName: assignedDrv?.fullName,
        assignedVehicleReg: assignedVeh?.registrationNumber,
        timeline: initialTimeline,
      });

      // If vehicle assigned, update its status
      if (assignedVeh) {
        await db.update<Vehicle>(COLLECTIONS.VEHICLES, assignedVeh.id, {
          status: 'ASSIGNED',
        });
      }

      await db.logAudit({
        actorUid: userProfile?.uid,
        actorRole: userProfile?.role || 'ADMIN',
        action: 'SHIPMENT_CREATED',
        targetUid: newShipment.id,
        details: `Created shipment ${shipmentNumber} for client ${newShipment.customerName} (${newShipment.originCountry} → ${newShipment.destinationCountry})`,
      });

      setShowCreateShipmentModal(false);
      setShipmentForm({
        customerName: '',
        customerEmail: '',
        customerPhone: '',
        originCountry: 'Kenya',
        originCity: 'Mombasa Port',
        destinationCountry: 'Uganda',
        destinationCity: 'Kampala Logistics Yard',
        cargoType: 'Containerized Goods (40ft High Cube)',
        cargoDescription: '',
        weightKg: 24500,
        quantity: 1,
        dimensions: '12.2m x 2.4m x 2.9m',
        assignedDriverId: '',
        assignedVehicleId: '',
        priority: 'Standard Corridor Transit',
        pickupDate: new Date().toISOString().split('T')[0],
        expectedDelivery: '',
        specialInstructions: '',
      });
      showToast(`Shipment ${shipmentNumber} generated successfully.`);
      loadData();
    } catch (err: any) {
      showToast(`Error creating shipment: ${err.message}`);
    }
  };

  const handleConvertBooking = async (b: Booking) => {
    try {
      const now = new Date().toISOString();
      const shipmentNumber = `KCC-SHP-2026-${Math.floor(100000 + Math.random() * 900000)}`;

      const newShipment = await db.add<Shipment>(COLLECTIONS.SHIPMENTS, {
        shipmentNumber,
        bookingId: b.id,
        bookingReference: b.bookingReference,
        customerName: b.fullName,
        customerPhone: b.phone,
        customerEmail: b.email,
        originCountry: b.pickupCountry,
        originCity: b.pickupLocation,
        destinationCountry: b.deliveryCountry,
        destinationCity: b.deliveryLocation,
        cargoType: b.cargoType,
        cargoDescription: b.cargoDescription,
        weightKg: b.weightKg,
        quantity: b.quantity,
        status: 'CONFIRMED' as ShipmentStatus,
        pickupDate: b.pickupDate,
        timeline: [
          {
            stage: 'Booking Approved',
            timestamp: now,
            completed: true,
            location: `${b.pickupLocation}, ${b.pickupCountry}`,
            notes: `Converted from online Booking Ref ${b.bookingReference}`,
          },
        ],
      });

      await db.update<Booking>(COLLECTIONS.BOOKINGS, b.id, {
        status: 'CONFIRMED',
        shipmentNumber,
      });

      await db.logAudit({
        actorUid: userProfile?.uid,
        actorRole: userProfile?.role || 'ADMIN',
        action: 'BOOKING_APPROVED',
        targetUid: newShipment.id,
        details: `Approved booking ${b.bookingReference} and generated Shipment ${shipmentNumber}`,
      });

      showToast(`Booking ${b.bookingReference} converted into Shipment ${shipmentNumber}`);
      loadData();
    } catch (err: any) {
      showToast(`Error: ${err.message}`);
    }
  };

  const handleAddTrackingEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShipmentForEvent) return;

    try {
      const nowIso = new Date().toISOString();
      const prevStatus = selectedShipmentForEvent.status || 'CREATED';
      const nextStatus = trackingEventForm.stage as ShipmentStatus;
      const currentUserIdentifier = userProfile?.fullName || userProfile?.email || 'Administrator';

      const newStage: ShipmentTimelineStage = {
        stage: trackingEventForm.stage.replace(/_/g, ' '),
        timestamp: nowIso,
        completed: true,
        location: trackingEventForm.location,
        notes: trackingEventForm.notes || `Status transitioned from ${prevStatus} to ${nextStatus}`,
        updatedBy: currentUserIdentifier,
        previousStatus: prevStatus,
        newStatus: nextStatus,
      };

      const updatedTimeline = [...(selectedShipmentForEvent.timeline || []), newStage];

      await db.update<Shipment>(COLLECTIONS.SHIPMENTS, selectedShipmentForEvent.id, {
        status: nextStatus,
        timeline: updatedTimeline,
        updatedAt: nowIso,
      });

      await db.logAudit({
        actorUid: userProfile?.uid,
        actorRole: userProfile?.role || 'ADMIN',
        action: 'SHIPMENT_STATUS_CHANGED',
        targetUid: selectedShipmentForEvent.id,
        details: `Shipment ${selectedShipmentForEvent.shipmentNumber} status updated by ${currentUserIdentifier}: ${prevStatus} → ${nextStatus} at ${trackingEventForm.location}`,
      });

      setShowAddTrackingEventModal(false);
      showToast(`Milestone updated for ${selectedShipmentForEvent.shipmentNumber}`);
      loadData();

      if (trackedShipment?.id === selectedShipmentForEvent.id) {
        setTrackedShipment({
          ...selectedShipmentForEvent,
          status: trackingEventForm.stage as ShipmentStatus,
          timeline: updatedTimeline,
        });
      }
    } catch (err: any) {
      showToast(`Error logging milestone: ${err.message}`);
    }
  };

  const handleSearchTracking = (e: React.FormEvent) => {
    e.preventDefault();
    const query = trackingSearchInput.trim().toUpperCase();
    if (!query) return;

    const found = shipments.find(
      (s) =>
        s.shipmentNumber.toUpperCase() === query ||
        s.bookingReference?.toUpperCase() === query ||
        s.id === query
    );

    if (found) {
      setTrackedShipment(found);
      setTrackingNotFound(false);
    } else {
      setTrackedShipment(null);
      setTrackingNotFound(true);
    }
  };

  // Filtered
  const filteredShipments = shipments.filter((s) => {
    const q = searchQuery.toLowerCase();
    const matchesQ =
      !searchQuery ||
      s.shipmentNumber.toLowerCase().includes(q) ||
      s.customerName.toLowerCase().includes(q) ||
      s.originCity.toLowerCase().includes(q) ||
      s.destinationCity.toLowerCase().includes(q) ||
      s.assignedDriverName?.toLowerCase().includes(q);
    const matchesS = statusFilter === 'ALL' || s.status === statusFilter;
    return matchesQ && matchesS;
  });

  const activeDeliveries = shipments.filter(
    (s) =>
      s.status === 'IN_TRANSIT' ||
      s.status === 'AT_CHECKPOINT' ||
      s.status === 'BORDER_CUSTOMS' ||
      s.status === 'OUT_FOR_DELIVERY' ||
      s.status === 'DEPARTED'
  );

  const completedShipments = shipments.filter((s) => s.status === 'DELIVERED');
  const pendingBookings = bookings.filter((b) => b.status === 'PENDING');

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 p-4 rounded-xl bg-cyan-950 border border-cyan-500/50 text-cyan-200 text-xs shadow-2xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-cyan-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-[#0A1024]/80 p-6 rounded-2xl border border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-cyan-400" />
            <span className="text-xs font-mono uppercase text-cyan-400 font-semibold tracking-wider">
              Cargo Logistics & Transit Dispatch
            </span>
          </div>
          <h2 className="text-2xl font-bold text-white font-['Poppins'] mt-1">
            Freight Shipments, Bookings & Tracking
          </h2>
          <p className="text-slate-400 text-xs mt-1">
            Corridor manifests, live tracking milestones, customer bookings, and signed Proof of Delivery records.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center flex-wrap gap-2.5">
          <button
            onClick={() => setShowCreateShipmentModal(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-semibold text-xs shadow-lg shadow-cyan-600/25 flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create Shipment</span>
          </button>
          <button
            onClick={() => setActiveTab('tracking')}
            className="px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5"
          >
            <Navigation className="w-4 h-4 text-cyan-400" />
            <span>Track Freight</span>
          </button>
          <button
            onClick={loadData}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-[#0A1024]/80 border border-slate-800 rounded-2xl p-4">
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span>Total Shipments</span>
            <Package className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono mt-2">{shipments.length} Recorded</div>
          <div className="text-[11px] text-slate-500 mt-1">{completedShipments.length} delivered</div>
        </div>

        <div className="bg-[#0A1024]/80 border border-slate-800 rounded-2xl p-4">
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span>Active in Transit</span>
            <Navigation className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-2xl font-bold text-teal-400 font-mono mt-2">{activeDeliveries.length} Rolling</div>
          <div className="text-[11px] text-slate-500 mt-1">Cross-border freight</div>
        </div>

        <div className="bg-[#0A1024]/80 border border-slate-800 rounded-2xl p-4">
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span>Customer Bookings</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400 font-mono mt-2">{pendingBookings.length} Pending</div>
          <div className="text-[11px] text-slate-500 mt-1">Awaiting admin review</div>
        </div>

        <div className="bg-[#0A1024]/80 border border-slate-800 rounded-2xl p-4">
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span>Verified Deliveries (POD)</span>
            <CheckCheck className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-blue-400 font-mono mt-2">{deliveryProofs.length} PODs</div>
          <div className="text-[11px] text-slate-500 mt-1">Confirmed signed deliveries</div>
        </div>
      </div>

      {/* Sub-Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
        {[
          { key: 'shipments', label: `Shipments (${shipments.length})`, icon: Package },
          { key: 'bookings', label: `Online Bookings (${bookings.length})`, icon: Clock },
          { key: 'active', label: `Active Deliveries (${activeDeliveries.length})`, icon: Navigation },
          { key: 'tracking', label: 'Live Tracking Sentinel', icon: MapPin },
          { key: 'pod', label: `Proof of Delivery (${deliveryProofs.length})`, icon: CheckCheck },
          { key: 'history', label: `Delivered Archive (${completedShipments.length})`, icon: CheckCircle2 },
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

      {/* TAB 1: ALL SHIPMENTS */}
      {activeTab === 'shipments' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#0A1024]/60 p-3 rounded-xl border border-slate-800">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search shipment #, client, corridor..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
              />
            </div>
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none"
              >
                <option value="ALL">All Statuses</option>
                <option value="BOOKED">BOOKED</option>
                <option value="CONFIRMED">CONFIRMED</option>
                <option value="IN_TRANSIT">IN TRANSIT</option>
                <option value="AT_CHECKPOINT">AT CHECKPOINT</option>
                <option value="BORDER_CUSTOMS">BORDER CUSTOMS</option>
                <option value="DELIVERED">DELIVERED</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
            </div>
          </div>

          {filteredShipments.length === 0 ? (
            <EmptyState
              title="No shipments found"
              description="Create a consignment record or convert customer booking requests to begin tracking freight."
              icon={<Package className="w-8 h-8 text-cyan-400" />}
              action={{
                label: 'Create Consignment Shipment',
                onClick: () => setShowCreateShipmentModal(true),
              }}
            />
          ) : (
            <div className="space-y-3">
              {filteredShipments.map((s) => (
                <div
                  key={s.id}
                  className="bg-[#0A1024]/80 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 transition-all shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 font-mono text-xs">
                      <span className="text-cyan-400 font-bold tracking-wider">{s.shipmentNumber}</span>
                      <span className="text-slate-500">•</span>
                      <span className="text-white font-semibold font-sans">{s.customerName}</span>
                      <span className="text-slate-500">•</span>
                      <span className="text-slate-400">{s.customerPhone}</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-slate-200 font-medium">
                      <span>{s.originCity}, {s.originCountry}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{s.destinationCity}, {s.destinationCountry}</span>
                    </div>

                    <div className="text-xs text-slate-400">
                      Cargo: {s.cargoType} • <span className="font-mono text-slate-300">{s.weightKg?.toLocaleString()} KG</span>
                      {s.assignedDriverName && ` • Driver: ${s.assignedDriverName}`}
                      {s.assignedVehicleReg && ` • Fleet: ${s.assignedVehicleReg}`}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end md:self-auto">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-mono font-bold uppercase ${
                        s.status === 'DELIVERED'
                          ? 'bg-emerald-950 border border-emerald-500/40 text-emerald-300'
                          : s.status === 'IN_TRANSIT' || s.status === 'OUT_FOR_DELIVERY'
                          ? 'bg-cyan-950 border border-cyan-500/40 text-cyan-300'
                          : s.status === 'BORDER_CUSTOMS' || s.status === 'AT_CHECKPOINT'
                          ? 'bg-amber-950 border border-amber-500/40 text-amber-300'
                          : 'bg-blue-950 border border-blue-500/40 text-blue-300'
                      }`}
                    >
                      {s.status}
                    </span>

                    <button
                      onClick={() => {
                        setSelectedShipmentForEvent(s);
                        setShowAddTrackingEventModal(true);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs text-cyan-400 font-medium flex items-center gap-1"
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      <span>Log Milestone</span>
                    </button>

                    <button
                      onClick={() => {
                        setTrackedShipment(s);
                        setActiveTab('tracking');
                      }}
                      className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300"
                      title="Inspect Timeline"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: BOOKINGS */}
      {activeTab === 'bookings' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-[#0A1024]/60 p-3 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-400 font-mono">Incoming Public Freight Booking Requests</span>
            <span className="text-xs text-cyan-400 font-mono font-bold">{bookings.length} Requests Total</span>
          </div>

          {bookings.length === 0 ? (
            <EmptyState
              title="No bookings available"
              description="Customer freight bookings submitted online will appear here for operational approval and dispatch."
              icon={<Clock className="w-8 h-8 text-amber-400" />}
            />
          ) : (
            <div className="space-y-3">
              {bookings.map((b) => (
                <div
                  key={b.id}
                  className="bg-[#0A1024]/80 border border-slate-800 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2 font-mono text-xs">
                      <span className="text-amber-400 font-bold">{b.bookingReference}</span>
                      <span className="text-slate-500">•</span>
                      <span className="text-white font-semibold">{b.fullName}</span>
                      <span className="text-slate-500">•</span>
                      <span className="text-slate-400">{b.phone}</span>
                    </div>
                    <div className="text-sm font-semibold text-slate-200 mt-1">
                      {b.pickupLocation}, {b.pickupCountry} → {b.deliveryLocation}, {b.deliveryCountry}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      Cargo: {b.cargoType} • {b.weightKg?.toLocaleString()} KG • Pickup: {b.pickupDate}
                      {b.cargoDescription && ` • Note: ${b.cargoDescription}`}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {b.status === 'PENDING' || b.status === 'BOOKED' ? (
                      <button
                        onClick={() => handleConvertBooking(b)}
                        className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white rounded-xl text-xs font-semibold shadow-md shadow-cyan-600/30"
                      >
                        Approve & Convert to Shipment
                      </button>
                    ) : (
                      <span className="px-3 py-1 bg-emerald-950 border border-emerald-500/40 text-emerald-300 text-xs font-mono rounded-full font-bold">
                        {b.status} {b.shipmentNumber && `(${b.shipmentNumber})`}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: ACTIVE DELIVERIES */}
      {activeTab === 'active' && (
        <div className="space-y-4">
          <div className="bg-[#0A1024]/60 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-400 font-mono">Consignments In Transit on East & Central African Corridors</span>
            <span className="text-xs text-teal-400 font-mono font-bold">{activeDeliveries.length} Active Trips</span>
          </div>

          {activeDeliveries.length === 0 ? (
            <EmptyState
              title="No active deliveries on the road"
              description="When shipments are marked IN_TRANSIT or dispatched, they will appear here with live tracking telemetry."
              icon={<Navigation className="w-8 h-8 text-teal-400" />}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeDeliveries.map((s) => (
                <div
                  key={s.id}
                  className="bg-[#0A1024]/80 border border-slate-800 rounded-2xl p-5 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-mono text-xs text-teal-400 font-bold">{s.shipmentNumber}</span>
                      <h4 className="text-sm font-bold text-white font-['Poppins']">
                        {s.originCity} → {s.destinationCity}
                      </h4>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-teal-950 border border-teal-500/40 text-teal-300">
                      {s.status}
                    </span>
                  </div>

                  <div className="text-xs text-slate-300 space-y-1 border-t border-slate-800 pt-2">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Assigned Driver:</span>
                      <span className="text-white font-medium">{s.assignedDriverName || 'Corridor Driver'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Fleet Unit:</span>
                      <span className="font-mono text-cyan-400">{s.assignedVehicleReg || 'Prime Mover'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Cargo:</span>
                      <span>{s.cargoType} ({s.weightKg?.toLocaleString()} KG)</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedShipmentForEvent(s);
                      setShowAddTrackingEventModal(true);
                    }}
                    className="w-full py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-xl text-xs text-cyan-300 font-medium flex items-center justify-center gap-1.5"
                  >
                    <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Update Corridor Checkpoint</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: TRACKING SENTINEL */}
      {activeTab === 'tracking' && (
        <div className="space-y-6">
          <div className="bg-[#0A1024]/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-white font-['Poppins'] flex items-center gap-2">
              <Navigation className="w-4 h-4 text-cyan-400" />
              <span>Corridor Transit Milestone Search</span>
            </h3>

            <form onSubmit={handleSearchTracking} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Enter Shipment Number (e.g. KCC-SHP-2026-XXXX) or Booking Ref"
                  value={trackingSearchInput}
                  onChange={(e) => setTrackingSearchInput(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 font-mono uppercase focus:outline-none focus:border-cyan-400"
                />
              </div>
              <button
                type="submit"
                className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs rounded-xl shadow-md"
              >
                Inspect
              </button>
            </form>

            {trackingNotFound && (
              <div className="p-3 bg-red-950/60 border border-red-500/30 text-red-300 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400" />
                <span>No registered cargo found matching "{trackingSearchInput}". Please check the reference.</span>
              </div>
            )}
          </div>

          {trackedShipment && (
            <div className="bg-[#0A1024]/90 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div>
                  <div className="text-xs text-slate-400 font-mono">CONSIGNMENT IDENTIFIER</div>
                  <div className="text-xl font-bold text-cyan-300 font-mono mt-0.5">
                    {trackedShipment.shipmentNumber}
                  </div>
                  <div className="text-xs text-slate-300 mt-1">
                    Customer: {trackedShipment.customerName} ({trackedShipment.customerPhone})
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 bg-cyan-950 border border-cyan-500/40 text-cyan-300 text-xs font-mono font-bold rounded-full">
                    {trackedShipment.status}
                  </span>
                  <button
                    onClick={() => {
                      setSelectedShipmentForEvent(trackedShipment);
                      setShowAddTrackingEventModal(true);
                    }}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Milestone Event</span>
                  </button>
                </div>
              </div>

              {/* Transit Details Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <span className="text-slate-400 text-[10px] uppercase">Origin Location</span>
                  <div className="text-white font-sans font-semibold mt-1">
                    {trackedShipment.originCity}, {trackedShipment.originCountry}
                  </div>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <span className="text-slate-400 text-[10px] uppercase">Destination</span>
                  <div className="text-white font-sans font-semibold mt-1">
                    {trackedShipment.destinationCity}, {trackedShipment.destinationCountry}
                  </div>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <span className="text-slate-400 text-[10px] uppercase">Cargo Payload</span>
                  <div className="text-cyan-400 font-bold mt-1">
                    {trackedShipment.weightKg?.toLocaleString()} KG ({trackedShipment.cargoType})
                  </div>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <span className="text-slate-400 text-[10px] uppercase">Fleet / Driver</span>
                  <div className="text-white font-sans font-semibold mt-1">
                    {trackedShipment.assignedVehicleReg || 'Asset TBD'} • {trackedShipment.assignedDriverName || 'Driver TBD'}
                  </div>
                </div>
              </div>

              {/* Milestones Timeline */}
              <div className="space-y-4">
                <h4 className="text-xs font-mono uppercase text-slate-400 tracking-wider">
                  Verified Transit History & Milestones
                </h4>

                <div className="space-y-3 pl-2 border-l-2 border-cyan-500/30">
                  {(trackedShipment.timeline || []).map((milestone, idx) => (
                    <div key={idx} className="relative pl-6 space-y-1">
                      <div className="absolute -left-[17px] top-1 w-3 h-3 rounded-full bg-cyan-500 shadow-md shadow-cyan-500/50" />
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-white">{milestone.stage}</span>
                        <span className="text-slate-400 font-mono text-[11px]">{milestone.timestamp}</span>
                      </div>
                      {milestone.location && (
                        <div className="text-xs text-cyan-400 flex items-center gap-1 font-mono">
                          <MapPin className="w-3 h-3" />
                          <span>{milestone.location}</span>
                        </div>
                      )}
                      {milestone.notes && (
                        <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                          {milestone.notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: PROOF OF DELIVERY (POD) */}
      {activeTab === 'pod' && (
        <div className="space-y-4">
          <div className="bg-[#0A1024]/60 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-400 font-mono">Consignee Signatures & Proof of Delivery Records</span>
            <span className="text-xs text-blue-400 font-mono font-bold">{deliveryProofs.length} PODs</span>
          </div>

          {deliveryProofs.length === 0 ? (
            <EmptyState
              title="No Proof of Delivery records recorded"
              description="When drivers hand over cargo and record recipient signatures or photos, POD records will be catalogued here."
              icon={<CheckCheck className="w-8 h-8 text-blue-400" />}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {deliveryProofs.map((pod) => (
                <div
                  key={pod.id}
                  className="bg-[#0A1024]/80 border border-slate-800 rounded-2xl p-5 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-xs font-mono text-cyan-400 font-bold">{pod.shipmentNumber}</div>
                      <div className="text-sm font-bold text-white mt-0.5">
                        Received by: {pod.recipientName}
                      </div>
                      <div className="text-xs text-slate-400">Date: {pod.deliveredAt}</div>
                    </div>
                    <span className="px-2 py-1 rounded-md text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                      {pod.validationStatus}
                    </span>
                  </div>

                  {pod.deliveryNotes && (
                    <div className="text-xs text-slate-300 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                      "{pod.deliveryNotes}"
                    </div>
                  )}

                  {pod.signatureDataUrl && (
                    <div className="bg-white p-2 rounded-xl">
                      <img src={pod.signatureDataUrl} alt="Signature" className="max-h-20 object-contain mx-auto" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 6: CARGO HISTORY */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="bg-[#0A1024]/60 p-3 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-400 font-mono">Archived Delivered Freight Consignments</span>
          </div>

          {completedShipments.length === 0 ? (
            <EmptyState
              title="No historical deliveries archived"
              description="Completed consignments with verified delivery will automatically archive into this ledger."
              icon={<CheckCircle2 className="w-8 h-8 text-emerald-400" />}
            />
          ) : (
            <div className="space-y-3">
              {completedShipments.map((s) => (
                <div
                  key={s.id}
                  className="bg-[#0A1024]/80 border border-slate-800 rounded-xl p-4 flex items-center justify-between"
                >
                  <div>
                    <div className="font-mono text-xs text-emerald-400 font-bold">{s.shipmentNumber}</div>
                    <div className="text-sm text-white font-medium">
                      {s.originCity} → {s.destinationCity}
                    </div>
                    <div className="text-xs text-slate-400">
                      Client: {s.customerName} • {s.cargoType} • {s.weightKg?.toLocaleString()} KG
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-emerald-950 border border-emerald-500/40 text-emerald-300 text-xs font-mono rounded-full font-bold">
                    DELIVERED
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* =========================================================
          MODALS
          ========================================================= */}

      {/* CREATE SHIPMENT MODAL */}
      {showCreateShipmentModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0A1024] border border-slate-800 rounded-3xl max-w-2xl w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-white font-['Poppins']">Create Cargo Consignment</h3>
                <p className="text-xs text-slate-400">Generate dispatch manifest with unique tracking reference</p>
              </div>
              <button onClick={() => setShowCreateShipmentModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateShipment} className="space-y-4 text-xs">
              {/* Client Info */}
              <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 space-y-3">
                <div className="text-[11px] font-mono text-cyan-400 uppercase font-bold">Customer Information</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-300 mb-1">Customer / Company *</label>
                    <input
                      type="text"
                      required
                      value={shipmentForm.customerName}
                      onChange={(e) => setShipmentForm({ ...shipmentForm, customerName: e.target.value })}
                      placeholder="e.g. TotalEnergies E&P"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 mb-1">Email *</label>
                    <input
                      type="email"
                      required
                      value={shipmentForm.customerEmail}
                      onChange={(e) => setShipmentForm({ ...shipmentForm, customerEmail: e.target.value })}
                      placeholder="operations@company.com"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 mb-1">Phone *</label>
                    <input
                      type="tel"
                      required
                      value={shipmentForm.customerPhone}
                      onChange={(e) => setShipmentForm({ ...shipmentForm, customerPhone: e.target.value })}
                      placeholder="+254 700 000000"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Corridor Route */}
              <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 space-y-3">
                <div className="text-[11px] font-mono text-cyan-400 uppercase font-bold">Transit Corridor</div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 mb-1">Origin Country</label>
                    <select
                      value={shipmentForm.originCountry}
                      onChange={(e) => setShipmentForm({ ...shipmentForm, originCountry: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white"
                    >
                      <option value="Kenya">Kenya</option>
                      <option value="Uganda">Uganda</option>
                      <option value="Tanzania">Tanzania</option>
                      <option value="Rwanda">Rwanda</option>
                      <option value="DR Congo">DR Congo</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-300 mb-1">Origin Hub / City *</label>
                    <input
                      type="text"
                      required
                      value={shipmentForm.originCity}
                      onChange={(e) => setShipmentForm({ ...shipmentForm, originCity: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 mb-1">Destination Country</label>
                    <select
                      value={shipmentForm.destinationCountry}
                      onChange={(e) => setShipmentForm({ ...shipmentForm, destinationCountry: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white"
                    >
                      <option value="Uganda">Uganda</option>
                      <option value="Kenya">Kenya</option>
                      <option value="Tanzania">Tanzania</option>
                      <option value="Rwanda">Rwanda</option>
                      <option value="DR Congo">DR Congo</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-300 mb-1">Destination Hub / City *</label>
                    <input
                      type="text"
                      required
                      value={shipmentForm.destinationCity}
                      onChange={(e) => setShipmentForm({ ...shipmentForm, destinationCity: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Cargo Specs */}
              <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 space-y-3">
                <div className="text-[11px] font-mono text-cyan-400 uppercase font-bold">Cargo Specifications</div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 mb-1">Cargo Type</label>
                    <input
                      type="text"
                      value={shipmentForm.cargoType}
                      onChange={(e) => setShipmentForm({ ...shipmentForm, cargoType: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 mb-1">Gross Weight (KG) *</label>
                    <input
                      type="number"
                      required
                      value={shipmentForm.weightKg}
                      onChange={(e) => setShipmentForm({ ...shipmentForm, weightKg: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 mb-1">Cargo Description</label>
                  <textarea
                    rows={2}
                    value={shipmentForm.cargoDescription}
                    onChange={(e) => setShipmentForm({ ...shipmentForm, cargoDescription: e.target.value })}
                    placeholder="Specific commodity, seal numbers, container packaging..."
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white"
                  />
                </div>
              </div>

              {/* Fleet & Driver Assignment */}
              <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 space-y-3">
                <div className="text-[11px] font-mono text-cyan-400 uppercase font-bold">Fleet Asset & Driver Assignment</div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 mb-1">Assign Prime Mover</label>
                    <select
                      value={shipmentForm.assignedVehicleId}
                      onChange={(e) => setShipmentForm({ ...shipmentForm, assignedVehicleId: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white"
                    >
                      <option value="">-- No vehicle selected --</option>
                      {vehicles.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.registrationNumber} ({v.make} {v.model})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-300 mb-1">Assign Commercial Driver</label>
                    <select
                      value={shipmentForm.assignedDriverId}
                      onChange={(e) => setShipmentForm({ ...shipmentForm, assignedDriverId: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white"
                    >
                      <option value="">-- No driver selected --</option>
                      {drivers.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.fullName} ({d.phone})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateShipmentModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold rounded-xl"
                >
                  Generate Consignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD TRACKING EVENT MODAL */}
      {showAddTrackingEventModal && selectedShipmentForEvent && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0A1024] border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-white font-['Poppins']">Log Transit Milestone</h3>
                <div className="text-xs font-mono text-cyan-400">{selectedShipmentForEvent.shipmentNumber}</div>
              </div>
              <button onClick={() => setShowAddTrackingEventModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddTrackingEvent} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1">Milestone Stage *</label>
                <select
                  value={trackingEventForm.stage}
                  onChange={(e) => setTrackingEventForm({ ...trackingEventForm, stage: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono"
                >
                  <option value="CREATED">CREATED</option>
                  <option value="ASSIGNED">ASSIGNED</option>
                  <option value="LOADING">LOADING</option>
                  <option value="IN_TRANSIT">IN TRANSIT</option>
                  <option value="AT_CHECKPOINT">AT CHECKPOINT</option>
                  <option value="ARRIVED">ARRIVED</option>
                  <option value="DELIVERED">DELIVERED</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Current Geographic Location *</label>
                <input
                  type="text"
                  required
                  value={trackingEventForm.location}
                  onChange={(e) => setTrackingEventForm({ ...trackingEventForm, location: e.target.value })}
                  placeholder="e.g. Busia One-Stop Border Post, UG/KE"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Operational Notes / Inspection</label>
                <textarea
                  rows={3}
                  value={trackingEventForm.notes}
                  onChange={(e) => setTrackingEventForm({ ...trackingEventForm, notes: e.target.value })}
                  placeholder="Seals verified, border release note, ETA..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddTrackingEventModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold rounded-xl"
                >
                  Save Milestone
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
