import React, { useState, useEffect } from 'react';
import {
  Route as RouteIcon,
  MapPin,
  Compass,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Plus,
  Search,
  Filter,
  RefreshCw,
  X,
  Truck,
  User,
  Shield,
  FileText,
  Layers,
  ArrowRight,
  Package,
} from 'lucide-react';
import { db, COLLECTIONS } from '../../lib/firestoreService';
import {
  LogisticsRoute,
  CheckpointRecord,
  BorderCrossingRecord,
  Shipment,
  Driver,
  Vehicle,
  Trip,
} from '../../types';
import { EmptyState } from '../common/EmptyState';
import { useAuth } from '../../context/AuthContext';

interface OperationsRoutesProps {
  initialSubTab?: 'routes' | 'checkpoints' | 'borders' | 'assignments';
  onRefreshStats?: () => void;
}

export const OperationsRoutes: React.FC<OperationsRoutesProps> = ({
  initialSubTab = 'routes',
  onRefreshStats,
}) => {
  const { userProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<'routes' | 'checkpoints' | 'borders' | 'assignments'>(initialSubTab);

  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Datasets from Firestore
  const [routes, setRoutes] = useState<LogisticsRoute[]>([]);
  const [checkpoints, setCheckpoints] = useState<CheckpointRecord[]>([]);
  const [borderCrossings, setBorderCrossings] = useState<BorderCrossingRecord[]>([]);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  // Modals
  const [showAddRouteModal, setShowAddRouteModal] = useState(false);
  const [showLogCheckpointModal, setShowLogCheckpointModal] = useState(false);
  const [showLogBorderModal, setShowLogBorderModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);

  // Forms
  const [routeForm, setRouteForm] = useState({
    routeCode: '',
    routeName: '',
    originCountry: 'Kenya',
    originCity: 'Mombasa Port',
    destinationCountry: 'Uganda',
    destinationCity: 'Kampala',
    distanceKm: 1170,
    estimatedTransitDays: 3,
    borderCrossings: 'Busia, Malaba',
    active: true,
    notes: 'Northern Corridor main arterial trunk road.',
  });

  const [checkpointForm, setCheckpointForm] = useState({
    checkpointName: 'Gilgil Weighbridge & Corridor Inspection Hub',
    country: 'Kenya',
    location: 'Nakuru County',
    shipmentNumber: '',
    driverName: '',
    vehicleReg: '',
    arrivalTimestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
    verificationStatus: 'PASSED' as CheckpointRecord['verificationStatus'],
    inspectorNotes: 'Axle weights calibrated within 56T legal limit. Seals intact.',
  });

  const [borderForm, setBorderForm] = useState({
    borderName: 'Busia One-Stop Border Post (OSBP)',
    originCountry: 'Kenya',
    destinationCountry: 'Uganda',
    shipmentNumber: '',
    driverName: '',
    vehicleReg: '',
    customsDeclarationNumber: '',
    clearanceStatus: 'CLEARED' as BorderCrossingRecord['clearanceStatus'],
    entryTimestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
    requiredDocuments: 'T1 Transit Declaration, COMESA Yellow Card, KEBS Certificate',
    officerNotes: 'Single Window customs release stamp verified.',
  });

  const [assignForm, setAssignForm] = useState({
    shipmentId: '',
    driverId: '',
    vehicleId: '',
    scheduledPickupDate: new Date().toISOString().split('T')[0],
    expectedDeliveryDate: '',
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [rList, cList, bList, sList, dList, vList] = await Promise.all([
        db.getAll<LogisticsRoute>(COLLECTIONS.ROUTES),
        db.getAll<CheckpointRecord>(COLLECTIONS.CHECKPOINTS),
        db.getAll<BorderCrossingRecord>(COLLECTIONS.BORDER_CROSSINGS),
        db.getAll<Shipment>(COLLECTIONS.SHIPMENTS),
        db.getAll<Driver>(COLLECTIONS.DRIVERS),
        db.getAll<Vehicle>(COLLECTIONS.VEHICLES),
      ]);
      setRoutes(rList);
      setCheckpoints(cList);
      setBorderCrossings(bList);
      setShipments(sList);
      setDrivers(dList);
      setVehicles(vList);
      if (onRefreshStats) onRefreshStats();
    } catch (err) {
      console.error('Error loading operations routes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const unsubR = db.subscribe(COLLECTIONS.ROUTES, loadData);
    const unsubC = db.subscribe(COLLECTIONS.CHECKPOINTS, loadData);
    const unsubB = db.subscribe(COLLECTIONS.BORDER_CROSSINGS, loadData);
    return () => {
      unsubR();
      unsubC();
      unsubB();
    };
  }, []);

  // Handlers
  const handleAddRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const code =
        routeForm.routeCode.trim().toUpperCase() ||
        `${routeForm.originCity.slice(0, 3).toUpperCase()}-${routeForm.destinationCity.slice(0, 3).toUpperCase()}`;

      const newR = await db.add<LogisticsRoute>(COLLECTIONS.ROUTES, {
        ...routeForm,
        routeCode: code,
        borderCrossings: routeForm.borderCrossings.split(',').map((s) => s.trim()),
        displayOrder: routes.length + 1,
      });

      await db.logAudit({
        actorUid: userProfile?.uid,
        actorRole: userProfile?.role || 'ADMIN',
        action: 'ROUTE_CREATED',
        targetUid: newR.id,
        details: `Established freight route ${newR.routeName} (${newR.routeCode}) - ${newR.distanceKm} KM`,
      });

      setShowAddRouteModal(false);
      showToast(`Route ${code} added successfully.`);
      loadData();
    } catch (err: any) {
      showToast(`Error adding route: ${err.message}`);
    }
  };

  const handleLogCheckpoint = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newC = await db.add<CheckpointRecord>(COLLECTIONS.CHECKPOINTS, {
        ...checkpointForm,
      });

      await db.logAudit({
        actorUid: userProfile?.uid,
        actorRole: userProfile?.role || 'ADMIN',
        action: 'CHECKPOINT_LOGGED',
        targetUid: newC.id,
        details: `Logged checkpoint inspection for ${newC.shipmentNumber || 'consignment'} at ${newC.checkpointName}`,
      });

      setShowLogCheckpointModal(false);
      showToast(`Checkpoint record saved.`);
      loadData();
    } catch (err: any) {
      showToast(`Error: ${err.message}`);
    }
  };

  const handleLogBorder = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const customNum =
        borderForm.customsDeclarationNumber.trim() || `T1-${Date.now().toString().slice(-6)}`;

      const newB = await db.add<BorderCrossingRecord>(COLLECTIONS.BORDER_CROSSINGS, {
        ...borderForm,
        customsDeclarationNumber: customNum,
        requiredDocuments: borderForm.requiredDocuments.split(',').map((s) => s.trim()),
      });

      await db.logAudit({
        actorUid: userProfile?.uid,
        actorRole: userProfile?.role || 'ADMIN',
        action: 'BORDER_CROSSING_LOGGED',
        targetUid: newB.id,
        details: `Border crossing cleared at ${newB.borderName} for shipment ${newB.shipmentNumber}`,
      });

      setShowLogBorderModal(false);
      showToast(`Border clearance record saved.`);
      loadData();
    } catch (err: any) {
      showToast(`Error: ${err.message}`);
    }
  };

  const handleAssignDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignForm.shipmentId || !assignForm.driverId || !assignForm.vehicleId) {
      showToast('Please select shipment, driver and vehicle');
      return;
    }

    try {
      const shp = shipments.find((s) => s.id === assignForm.shipmentId);
      const drv = drivers.find((d) => d.id === assignForm.driverId);
      const veh = vehicles.find((v) => v.id === assignForm.vehicleId);

      // Create Trip
      const createdTrip = await db.createDispatch({
        shipmentId: assignForm.shipmentId,
        driverId: assignForm.driverId,
        vehicleId: assignForm.vehicleId,
        scheduledPickupDate: assignForm.scheduledPickupDate,
        expectedDeliveryDate: assignForm.expectedDeliveryDate,
        specialInstructions: 'Cross-border transit assignment. Check GPS and seal integrity.',
      });

      // Update shipment
      await db.update<Shipment>(COLLECTIONS.SHIPMENTS, assignForm.shipmentId, {
        status: 'ASSIGNED',
        assignedDriverId: assignForm.driverId,
        assignedDriverName: drv?.fullName,
        assignedVehicleId: assignForm.vehicleId,
        assignedVehicleReg: veh?.registrationNumber,
        assignedTripId: createdTrip.id,
      });

      // Update vehicle
      await db.update<Vehicle>(COLLECTIONS.VEHICLES, assignForm.vehicleId, {
        status: 'ASSIGNED',
        assignedDriverId: assignForm.driverId,
        assignedDriverName: drv?.fullName,
      });

      await db.logAudit({
        actorUid: userProfile?.uid,
        actorRole: userProfile?.role || 'ADMIN',
        action: 'DISPATCH_ASSIGNMENT',
        targetUid: createdTrip.id,
        details: `Dispatched ${shp?.shipmentNumber} with driver ${drv?.fullName} and vehicle ${veh?.registrationNumber}`,
      });

      setShowAssignModal(false);
      showToast(`Trip ${createdTrip.tripReference} dispatched.`);
      loadData();
    } catch (err: any) {
      showToast(`Assignment error: ${err.message}`);
    }
  };

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
            <RouteIcon className="w-5 h-5 text-teal-400" />
            <span className="text-xs font-mono uppercase text-teal-400 font-semibold tracking-wider">
              Transit Corridors & Cross-Border Dispatch
            </span>
          </div>
          <h2 className="text-2xl font-bold text-white font-['Poppins'] mt-1">
            Corridor Routes, Checkpoints & Border Crossings
          </h2>
          <p className="text-slate-400 text-xs mt-1">
            Arterial transit routes across Kenya, Uganda, Tanzania, Rwanda, and DR Congo with customs posts and dispatch assignments.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center flex-wrap gap-2.5">
          <button
            onClick={() => setShowAddRouteModal(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-semibold text-xs shadow-lg shadow-cyan-600/25 flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Route</span>
          </button>
          <button
            onClick={() => setShowLogCheckpointModal(true)}
            className="px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5"
          >
            <MapPin className="w-4 h-4 text-cyan-400" />
            <span>Log Checkpoint</span>
          </button>
          <button
            onClick={() => setShowLogBorderModal(true)}
            className="px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5"
          >
            <Shield className="w-4 h-4 text-teal-400" />
            <span>Log Border Clearance</span>
          </button>
          <button
            onClick={() => setShowAssignModal(true)}
            className="px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5"
          >
            <Truck className="w-4 h-4 text-amber-400" />
            <span>Assign Dispatch</span>
          </button>
          <button
            onClick={loadData}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
            title="Refresh Operations"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Sub-Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
        {[
          { key: 'routes', label: `Corridor Routes (${routes.length})`, icon: RouteIcon },
          { key: 'checkpoints', label: `Transit Checkpoints (${checkpoints.length})`, icon: MapPin },
          { key: 'borders', label: `Border Crossings (${borderCrossings.length})`, icon: Shield },
          { key: 'assignments', label: 'Corridor Assignments', icon: Truck },
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

      {/* TAB 1: ROUTES */}
      {activeTab === 'routes' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-[#0A1024]/60 p-3 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-400 font-mono">Approved International Highway Freight Corridors</span>
            <button
              onClick={() => setShowAddRouteModal(true)}
              className="px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Route</span>
            </button>
          </div>

          {routes.length === 0 ? (
            <EmptyState
              title="No corridors configured"
              description="Define international transit routes connecting ports, border posts, and inland capital hubs."
              icon={<RouteIcon className="w-8 h-8 text-teal-400" />}
              action={{
                label: 'Create First Route',
                onClick: () => setShowAddRouteModal(true),
              }}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {routes.map((r) => (
                <div
                  key={r.id}
                  className="bg-[#0A1024]/80 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-md"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs font-mono text-cyan-400 font-bold">{r.routeCode}</span>
                      <h4 className="text-sm font-bold text-white font-['Poppins']">{r.routeName}</h4>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                      ACTIVE
                    </span>
                  </div>

                  <div className="text-xs text-slate-300 space-y-1.5 border-t border-slate-800 pt-3">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">Path:</span>
                      <span className="font-semibold text-white">
                        {r.originCity} ({r.originCountry}) → {r.destinationCity} ({r.destinationCountry})
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Corridor Distance:</span>
                      <span className="font-mono text-cyan-400 font-bold">{r.distanceKm} KM</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Estimated Duration:</span>
                      <span className="font-mono text-slate-200">{r.estimatedTransitDays} Days</span>
                    </div>
                    {r.borderCrossings && r.borderCrossings.length > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400">Borders:</span>
                        <span className="text-teal-400">{r.borderCrossings.join(', ')}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: CHECKPOINTS */}
      {activeTab === 'checkpoints' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-[#0A1024]/60 p-3 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-400 font-mono">Corridor Weighbridge & Security Verification Inspections</span>
            <button
              onClick={() => setShowLogCheckpointModal(true)}
              className="px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log Inspection</span>
            </button>
          </div>

          {checkpoints.length === 0 ? (
            <EmptyState
              title="No checkpoint inspections logged"
              description="Record weighbridge slips, axle calibrations, and cargo seal verifications at key corridor checkpoints."
              icon={<MapPin className="w-8 h-8 text-cyan-400" />}
              action={{
                label: 'Log Checkpoint Inspection',
                onClick: () => setShowLogCheckpointModal(true),
              }}
            />
          ) : (
            <div className="space-y-3">
              {checkpoints.map((c) => (
                <div
                  key={c.id}
                  className="bg-[#0A1024]/80 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2 font-mono text-xs">
                      <span className="text-cyan-400 font-bold">{c.checkpointName}</span>
                      <span className="text-slate-500">•</span>
                      <span className="text-slate-400">{c.country}</span>
                      <span className="text-slate-500">•</span>
                      <span className="text-slate-400">{c.arrivalTimestamp}</span>
                    </div>
                    <div className="text-sm font-semibold text-white mt-1">
                      Shipment: {c.shipmentNumber || 'Unspecified'} {c.vehicleReg && `(Vehicle: ${c.vehicleReg})`}
                    </div>
                    {c.inspectorNotes && <div className="text-xs text-slate-400 mt-0.5">{c.inspectorNotes}</div>}
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-mono font-bold uppercase self-start sm:self-auto ${
                      c.verificationStatus === 'PASSED' || c.verificationStatus === 'CLEARED'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                        : 'bg-amber-950 text-amber-300 border border-amber-500/40'
                    }`}
                  >
                    {c.verificationStatus}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: BORDER CROSSINGS */}
      {activeTab === 'borders' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-[#0A1024]/60 p-3 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-400 font-mono">One-Stop Border Post (OSBP) Clearance Ledger</span>
            <button
              onClick={() => setShowLogBorderModal(true)}
              className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log Border Clearance</span>
            </button>
          </div>

          {borderCrossings.length === 0 ? (
            <EmptyState
              title="No border clearances recorded"
              description="Track customs release, T1 bond documentation, and immigration clearing across East African borders."
              icon={<Shield className="w-8 h-8 text-teal-400" />}
              action={{
                label: 'Record Border Clearance',
                onClick: () => setShowLogBorderModal(true),
              }}
            />
          ) : (
            <div className="space-y-3">
              {borderCrossings.map((b) => (
                <div
                  key={b.id}
                  className="bg-[#0A1024]/80 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2 font-mono text-xs">
                      <span className="text-teal-400 font-bold">{b.borderName}</span>
                      <span className="text-slate-500">•</span>
                      <span className="text-slate-300">{b.originCountry} → {b.destinationCountry}</span>
                      <span className="text-slate-500">•</span>
                      <span className="text-slate-400">{b.entryTimestamp}</span>
                    </div>
                    <div className="text-sm font-semibold text-white mt-1">
                      Customs Decl: <span className="font-mono text-cyan-400">{b.customsDeclarationNumber}</span>
                      {b.shipmentNumber && ` • Shipment: ${b.shipmentNumber}`}
                    </div>
                    {b.officerNotes && <div className="text-xs text-slate-400 mt-0.5">{b.officerNotes}</div>}
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-mono font-bold uppercase self-start sm:self-auto ${
                      b.clearanceStatus === 'CLEARED'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                        : 'bg-amber-950 text-amber-300 border border-amber-500/40'
                    }`}
                  >
                    {b.clearanceStatus}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: ASSIGNMENTS */}
      {activeTab === 'assignments' && (
        <div className="space-y-4">
          <div className="bg-[#0A1024]/60 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-400 font-mono">Direct Corridor Dispatch Assignment Matrix</span>
            <button
              onClick={() => setShowAssignModal(true)}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl text-xs font-semibold shadow-md"
            >
              Assign Fleet & Driver to Cargo
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#0A1024]/80 border border-slate-800 rounded-2xl p-5 space-y-3">
              <h4 className="text-sm font-bold text-white font-['Poppins'] flex items-center gap-2">
                <Package className="w-4 h-4 text-cyan-400" />
                <span>Unassigned Shipments ({shipments.filter((s) => s.status === 'BOOKED' || s.status === 'CONFIRMED').length})</span>
              </h4>
              <div className="space-y-2">
                {shipments.filter((s) => s.status === 'BOOKED' || s.status === 'CONFIRMED').slice(0, 5).map((s) => (
                  <div key={s.id} className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs">
                    <div className="font-mono text-cyan-400 font-bold">{s.shipmentNumber}</div>
                    <div className="text-slate-300">{s.originCity} → {s.destinationCity}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#0A1024]/80 border border-slate-800 rounded-2xl p-5 space-y-3">
              <h4 className="text-sm font-bold text-white font-['Poppins'] flex items-center gap-2">
                <Truck className="w-4 h-4 text-teal-400" />
                <span>Available Fleet Vehicles ({vehicles.filter((v) => v.status === 'AVAILABLE').length})</span>
              </h4>
              <div className="space-y-2">
                {vehicles.filter((v) => v.status === 'AVAILABLE').slice(0, 5).map((v) => (
                  <div key={v.id} className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs">
                    <div className="font-mono text-teal-400 font-bold">{v.registrationNumber}</div>
                    <div className="text-slate-300">{v.make} {v.model} ({v.capacityKg.toLocaleString()} KG)</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#0A1024]/80 border border-slate-800 rounded-2xl p-5 space-y-3">
              <h4 className="text-sm font-bold text-white font-['Poppins'] flex items-center gap-2">
                <User className="w-4 h-4 text-blue-400" />
                <span>Available Commercial Drivers ({drivers.filter((d) => d.status === 'AVAILABLE').length})</span>
              </h4>
              <div className="space-y-2">
                {drivers.filter((d) => d.status === 'AVAILABLE').slice(0, 5).map((d) => (
                  <div key={d.id} className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs">
                    <div className="font-semibold text-white">{d.fullName}</div>
                    <div className="text-slate-400 font-mono text-[11px]">{d.phone} • {d.country}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          MODALS
          ========================================================= */}

      {/* ADD ROUTE MODAL */}
      {showAddRouteModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0A1024] border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white font-['Poppins']">Establish Corridor Route</h3>
              <button onClick={() => setShowAddRouteModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddRoute} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1">Route Name *</label>
                <input
                  type="text"
                  required
                  value={routeForm.routeName}
                  onChange={(e) => setRouteForm({ ...routeForm, routeName: e.target.value })}
                  placeholder="e.g. Northern Corridor Freight Expressway"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">Origin Country</label>
                  <select
                    value={routeForm.originCountry}
                    onChange={(e) => setRouteForm({ ...routeForm, originCountry: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  >
                    <option value="Kenya">Kenya</option>
                    <option value="Uganda">Uganda</option>
                    <option value="Tanzania">Tanzania</option>
                    <option value="Rwanda">Rwanda</option>
                    <option value="DR Congo">DR Congo</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Origin City / Hub *</label>
                  <input
                    type="text"
                    required
                    value={routeForm.originCity}
                    onChange={(e) => setRouteForm({ ...routeForm, originCity: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">Destination Country</label>
                  <select
                    value={routeForm.destinationCountry}
                    onChange={(e) => setRouteForm({ ...routeForm, destinationCountry: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  >
                    <option value="Uganda">Uganda</option>
                    <option value="Kenya">Kenya</option>
                    <option value="Tanzania">Tanzania</option>
                    <option value="Rwanda">Rwanda</option>
                    <option value="DR Congo">DR Congo</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Destination City *</label>
                  <input
                    type="text"
                    required
                    value={routeForm.destinationCity}
                    onChange={(e) => setRouteForm({ ...routeForm, destinationCity: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">Distance (KM) *</label>
                  <input
                    type="number"
                    required
                    value={routeForm.distanceKm}
                    onChange={(e) => setRouteForm({ ...routeForm, distanceKm: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Estimated Days</label>
                  <input
                    type="number"
                    value={routeForm.estimatedTransitDays}
                    onChange={(e) => setRouteForm({ ...routeForm, estimatedTransitDays: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Border Crossings (Comma Separated)</label>
                <input
                  type="text"
                  value={routeForm.borderCrossings}
                  onChange={(e) => setRouteForm({ ...routeForm, borderCrossings: e.target.value })}
                  placeholder="e.g. Busia, Malaba, Mutukula"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddRouteModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold rounded-xl"
                >
                  Save Route
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LOG CHECKPOINT MODAL */}
      {showLogCheckpointModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0A1024] border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white font-['Poppins']">Log Checkpoint Inspection</h3>
              <button onClick={() => setShowLogCheckpointModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleLogCheckpoint} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1">Checkpoint Hub Name *</label>
                <input
                  type="text"
                  required
                  value={checkpointForm.checkpointName}
                  onChange={(e) => setCheckpointForm({ ...checkpointForm, checkpointName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">Matched Shipment #</label>
                  <input
                    type="text"
                    value={checkpointForm.shipmentNumber}
                    onChange={(e) => setCheckpointForm({ ...checkpointForm, shipmentNumber: e.target.value })}
                    placeholder="e.g. KCC-SHP-2026-XXXX"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Vehicle Registration</label>
                  <input
                    type="text"
                    value={checkpointForm.vehicleReg}
                    onChange={(e) => setCheckpointForm({ ...checkpointForm, vehicleReg: e.target.value })}
                    placeholder="e.g. UBD 849X"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Verification Status</label>
                <select
                  value={checkpointForm.verificationStatus}
                  onChange={(e) => setCheckpointForm({ ...checkpointForm, verificationStatus: e.target.value as any })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                >
                  <option value="PASSED">PASSED</option>
                  <option value="FLAGGED">FLAGGED (Requires Attention)</option>
                  <option value="CLEARED">CLEARED</option>
                  <option value="PENDING_DOCUMENTATION">PENDING DOCUMENTATION</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Inspector Notes</label>
                <textarea
                  rows={2}
                  value={checkpointForm.inspectorNotes}
                  onChange={(e) => setCheckpointForm({ ...checkpointForm, inspectorNotes: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowLogCheckpointModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold rounded-xl"
                >
                  Save Checkpoint
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LOG BORDER CROSSING MODAL */}
      {showLogBorderModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0A1024] border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white font-['Poppins']">Record Border Clearance</h3>
              <button onClick={() => setShowLogBorderModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleLogBorder} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1">Border Post Name *</label>
                <input
                  type="text"
                  required
                  value={borderForm.borderName}
                  onChange={(e) => setBorderForm({ ...borderForm, borderName: e.target.value })}
                  placeholder="e.g. Busia One-Stop Border Post"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">Shipment #</label>
                  <input
                    type="text"
                    value={borderForm.shipmentNumber}
                    onChange={(e) => setBorderForm({ ...borderForm, shipmentNumber: e.target.value })}
                    placeholder="e.g. KCC-SHP-2026-XXXX"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Customs Declaration #</label>
                  <input
                    type="text"
                    value={borderForm.customsDeclarationNumber}
                    onChange={(e) => setBorderForm({ ...borderForm, customsDeclarationNumber: e.target.value })}
                    placeholder="e.g. T1-UG-2026-9482"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Clearance Status</label>
                <select
                  value={borderForm.clearanceStatus}
                  onChange={(e) => setBorderForm({ ...borderForm, clearanceStatus: e.target.value as any })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                >
                  <option value="CLEARED">CLEARED (Released across border)</option>
                  <option value="INSPECTION">PHYSICAL INSPECTION / SCANNING</option>
                  <option value="QUEUED">QUEUED AT BORDER</option>
                  <option value="HELD_AT_BORDER">HELD (Awaiting bond / docs)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowLogBorderModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-teal-600 to-teal-500 text-white font-semibold rounded-xl"
                >
                  Save Border Clearance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ASSIGN DISPATCH MODAL */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0A1024] border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white font-['Poppins']">Dispatch Cargo Assignment</h3>
              <button onClick={() => setShowAssignModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAssignDispatch} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1">Select Consignment Shipment *</label>
                <select
                  required
                  value={assignForm.shipmentId}
                  onChange={(e) => setAssignForm({ ...assignForm, shipmentId: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white"
                >
                  <option value="">-- Choose Shipment --</option>
                  {shipments.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.shipmentNumber} ({s.originCity} → {s.destinationCity}) - {s.customerName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Select Driver *</label>
                <select
                  required
                  value={assignForm.driverId}
                  onChange={(e) => setAssignForm({ ...assignForm, driverId: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white"
                >
                  <option value="">-- Choose Commercial Driver --</option>
                  {drivers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.fullName} ({d.phone}) - {d.status}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Select Prime Mover Fleet Asset *</label>
                <select
                  required
                  value={assignForm.vehicleId}
                  onChange={(e) => setAssignForm({ ...assignForm, vehicleId: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white"
                >
                  <option value="">-- Choose Vehicle --</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.registrationNumber} ({v.make} {v.model}) - {v.status}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold rounded-xl"
                >
                  Confirm Dispatch Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
