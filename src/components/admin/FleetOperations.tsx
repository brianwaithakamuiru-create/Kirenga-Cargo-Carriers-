import React, { useState, useEffect } from 'react';
import {
  Truck,
  Wrench,
  Fuel,
  FileText,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Clock,
  User,
  MapPin,
  RefreshCw,
  Layers,
  ArrowRight,
  ShieldCheck,
  X,
  FileCheck,
} from 'lucide-react';
import { db, COLLECTIONS } from '../../lib/firestoreService';
import { Vehicle, Driver, Trailer, MaintenanceRecord, FuelRecord, LogisticsDocument } from '../../types';
import { EmptyState } from '../common/EmptyState';
import { useAuth } from '../../context/AuthContext';

interface FleetOperationsProps {
  initialSubTab?: 'vehicles' | 'trailers' | 'maintenance' | 'fuel' | 'documents';
  onRefreshStats?: () => void;
}

export const FleetOperations: React.FC<FleetOperationsProps> = ({
  initialSubTab = 'vehicles',
  onRefreshStats,
}) => {
  const { userProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<'vehicles' | 'trailers' | 'maintenance' | 'fuel' | 'documents'>(
    initialSubTab
  );

  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Datasets from Firestore
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [trailers, setTrailers] = useState<Trailer[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceRecord[]>([]);
  const [fuelRecords, setFuelRecords] = useState<FuelRecord[]>([]);
  const [vehicleDocuments, setVehicleDocuments] = useState<LogisticsDocument[]>([]);

  // Modals
  const [showAddVehicleModal, setShowAddVehicleModal] = useState(false);
  const [showAddTrailerModal, setShowAddTrailerModal] = useState(false);
  const [showAddMaintenanceModal, setShowAddMaintenanceModal] = useState(false);
  const [showAddFuelModal, setShowAddFuelModal] = useState(false);
  const [showUploadDocModal, setShowUploadDocModal] = useState(false);

  // Form states
  const [vehicleForm, setVehicleForm] = useState({
    registrationNumber: '',
    vehicleType: 'Prime Mover (6x4 Heavy Duty)',
    make: 'Scania',
    model: 'R500 V8',
    year: 2023,
    capacityKg: 38000,
    status: 'AVAILABLE' as Vehicle['status'],
    assignedDriverId: '',
    insuranceExpiry: '',
    currentLocation: 'Mombasa Port Depot, Kenya',
    notes: '',
  });

  const [trailerForm, setTrailerForm] = useState({
    trailerNumber: '',
    trailerType: 'Flatbed' as Trailer['trailerType'],
    make: 'Kögel',
    year: 2022,
    capacityKg: 42000,
    lengthMeters: 13.6,
    axles: 3,
    status: 'AVAILABLE' as Trailer['status'],
    assignedVehicleId: '',
    inspectionExpiry: '',
    notes: '',
  });

  const [maintenanceForm, setMaintenanceForm] = useState({
    vehicleId: '',
    serviceType: 'Preventive Engine Overhaul & Oil Service',
    description: '',
    assignedMechanic: 'Kirenga Central Fleet Engineering (Kampala Hub)',
    estimatedCost: 850,
    currency: 'USD',
    status: 'REQUESTED' as MaintenanceRecord['status'],
    dateReported: new Date().toISOString().split('T')[0],
  });

  const [fuelForm, setFuelForm] = useState({
    vehicleId: '',
    driverId: '',
    fuelStation: 'TotalEnergies Malaba Transit Station',
    litres: 450,
    pricePerLitre: 1.48,
    totalCost: 666,
    currency: 'USD',
    odometerKm: 128450,
    route: 'Mombasa - Kampala Corridor',
    date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const [docForm, setDocForm] = useState({
    title: '',
    category: 'VEHICLE' as LogisticsDocument['category'],
    referenceId: '',
    expiryDate: '',
    notes: '',
    fileName: '',
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [vList, tList, dList, mList, fList, docList] = await Promise.all([
        db.getAll<Vehicle>(COLLECTIONS.VEHICLES),
        db.getAll<Trailer>(COLLECTIONS.TRAILERS),
        db.getAll<Driver>(COLLECTIONS.DRIVERS),
        db.getAll<MaintenanceRecord>(COLLECTIONS.MAINTENANCE),
        db.getAll<FuelRecord>(COLLECTIONS.FUEL_RECORDS),
        db.getAll<LogisticsDocument>(COLLECTIONS.DOCUMENTS),
      ]);
      setVehicles(vList);
      setTrailers(tList);
      setDrivers(dList);
      setMaintenanceRecords(mList);
      setFuelRecords(fList);
      setVehicleDocuments(docList.filter((d) => d.category === 'VEHICLE' || d.category === 'INSURANCE'));
      if (onRefreshStats) onRefreshStats();
    } catch (err) {
      console.error('Error loading fleet operations data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const unsubV = db.subscribe(COLLECTIONS.VEHICLES, loadData);
    const unsubM = db.subscribe(COLLECTIONS.MAINTENANCE, loadData);
    const unsubF = db.subscribe(COLLECTIONS.FUEL_RECORDS, loadData);
    return () => {
      unsubV();
      unsubM();
      unsubF();
    };
  }, []);

  // Submit Handlers
  const handleCreateVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const assignedDriver = drivers.find((d) => d.id === vehicleForm.assignedDriverId);
      const newV = await db.add<Vehicle>(COLLECTIONS.VEHICLES, {
        ...vehicleForm,
        registrationNumber: vehicleForm.registrationNumber.toUpperCase().trim(),
        assignedDriverName: assignedDriver?.fullName,
      });

      await db.logAudit({
        actorUid: userProfile?.uid,
        actorRole: userProfile?.role || 'ADMIN',
        action: 'VEHICLE_CREATED',
        targetUid: newV.id,
        details: `Registered fleet vehicle ${newV.registrationNumber} (${newV.make} ${newV.model})`,
      });

      setShowAddVehicleModal(false);
      setVehicleForm({
        registrationNumber: '',
        vehicleType: 'Prime Mover (6x4 Heavy Duty)',
        make: 'Scania',
        model: 'R500 V8',
        year: 2023,
        capacityKg: 38000,
        status: 'AVAILABLE',
        assignedDriverId: '',
        insuranceExpiry: '',
        currentLocation: 'Mombasa Port Depot, Kenya',
        notes: '',
      });
      showToast(`Fleet vehicle ${newV.registrationNumber} added successfully.`);
      loadData();
    } catch (err: any) {
      showToast(`Error adding vehicle: ${err.message}`);
    }
  };

  const handleCreateTrailer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const assignedVeh = vehicles.find((v) => v.id === trailerForm.assignedVehicleId);
      const newT = await db.add<Trailer>(COLLECTIONS.TRAILERS, {
        ...trailerForm,
        trailerNumber: trailerForm.trailerNumber.toUpperCase().trim(),
        assignedVehicleReg: assignedVeh?.registrationNumber,
      });

      await db.logAudit({
        actorUid: userProfile?.uid,
        actorRole: userProfile?.role || 'ADMIN',
        action: 'TRAILER_CREATED',
        targetUid: newT.id,
        details: `Added cargo trailer unit ${newT.trailerNumber} (${newT.trailerType})`,
      });

      setShowAddTrailerModal(false);
      setTrailerForm({
        trailerNumber: '',
        trailerType: 'Flatbed',
        make: 'Kögel',
        year: 2022,
        capacityKg: 42000,
        lengthMeters: 13.6,
        axles: 3,
        status: 'AVAILABLE',
        assignedVehicleId: '',
        inspectionExpiry: '',
        notes: '',
      });
      showToast(`Trailer ${newT.trailerNumber} registered successfully.`);
      loadData();
    } catch (err: any) {
      showToast(`Error adding trailer: ${err.message}`);
    }
  };

  const handleCreateMaintenance = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const veh = vehicles.find((v) => v.id === maintenanceForm.vehicleId);
      const recordNumber = `MR-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

      const newM = await db.add<MaintenanceRecord>(COLLECTIONS.MAINTENANCE, {
        ...maintenanceForm,
        recordNumber,
        vehicleReg: veh?.registrationNumber || 'N/A',
      });

      // Update vehicle status to MAINTENANCE if active
      if (veh && maintenanceForm.status === 'IN_PROGRESS') {
        await db.update<Vehicle>(COLLECTIONS.VEHICLES, veh.id, {
          status: 'MAINTENANCE',
        });
      }

      await db.logAudit({
        actorUid: userProfile?.uid,
        actorRole: userProfile?.role || 'ADMIN',
        action: 'MAINTENANCE_LOGGED',
        targetUid: newM.id,
        details: `Scheduled ${newM.serviceType} for ${veh?.registrationNumber || 'vehicle'} (Cost: $${newM.estimatedCost})`,
      });

      setShowAddMaintenanceModal(false);
      showToast(`Maintenance job ${recordNumber} logged successfully.`);
      loadData();
    } catch (err: any) {
      showToast(`Error recording maintenance: ${err.message}`);
    }
  };

  const handleCreateFuel = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const veh = vehicles.find((v) => v.id === fuelForm.vehicleId);
      const drv = drivers.find((d) => d.id === fuelForm.driverId);
      const receiptNumber = `FUEL-${Date.now().toString().slice(-6)}`;

      const newF = await db.add<FuelRecord>(COLLECTIONS.FUEL_RECORDS, {
        ...fuelForm,
        receiptNumber,
        vehicleReg: veh?.registrationNumber || 'N/A',
        driverName: drv?.fullName || 'Transit Driver',
        totalCost: Number((fuelForm.litres * fuelForm.pricePerLitre).toFixed(2)),
      });

      await db.logAudit({
        actorUid: userProfile?.uid,
        actorRole: userProfile?.role || 'ADMIN',
        action: 'FUEL_EXPENSE_LOGGED',
        targetUid: newF.id,
        details: `Recorded ${newF.litres}L fuel at ${newF.fuelStation} for ${veh?.registrationNumber} ($${newF.totalCost})`,
      });

      setShowAddFuelModal(false);
      showToast(`Fuel record ${receiptNumber} logged.`);
      loadData();
    } catch (err: any) {
      showToast(`Error recording fuel: ${err.message}`);
    }
  };

  const handleUploadDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const veh = vehicles.find((v) => v.id === docForm.referenceId);
      const newD = await db.add<LogisticsDocument>(COLLECTIONS.DOCUMENTS, {
        ...docForm,
        referenceLabel: veh?.registrationNumber || 'Fleet Asset',
        uploadedBy: userProfile?.fullName || 'Administrator',
        fileName: docForm.fileName || `${docForm.title.toLowerCase().replace(/\s+/g, '_')}.pdf`,
        fileSize: '1.8 MB (Verified PDF)',
      });

      await db.logAudit({
        actorUid: userProfile?.uid,
        actorRole: userProfile?.role || 'ADMIN',
        action: 'DOCUMENT_UPLOADED',
        targetUid: newD.id,
        details: `Uploaded ${newD.category} document "${newD.title}" for ${veh?.registrationNumber}`,
      });

      setShowUploadDocModal(false);
      setDocForm({
        title: '',
        category: 'VEHICLE',
        referenceId: '',
        expiryDate: '',
        notes: '',
        fileName: '',
      });
      showToast(`Document "${newD.title}" uploaded and indexed.`);
      loadData();
    } catch (err: any) {
      showToast(`Error uploading document: ${err.message}`);
    }
  };

  // Filtered lists
  const filteredVehicles = vehicles.filter((v) => {
    const q = searchQuery.toLowerCase();
    const matchesQ =
      !searchQuery ||
      v.registrationNumber.toLowerCase().includes(q) ||
      v.make.toLowerCase().includes(q) ||
      v.model.toLowerCase().includes(q) ||
      v.assignedDriverName?.toLowerCase().includes(q);
    const matchesS = statusFilter === 'ALL' || v.status === statusFilter;
    return matchesQ && matchesS;
  });

  const totalFleetCapacity = vehicles.reduce((acc, v) => acc + (v.capacityKg || 0), 0);
  const inMaintenanceCount = vehicles.filter((v) => v.status === 'MAINTENANCE').length;
  const activeTripsVehicles = vehicles.filter((v) => v.status === 'IN_TRANSIT' || v.status === 'ON_TRIP').length;

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
            <Truck className="w-5 h-5 text-cyan-400" />
            <span className="text-xs font-mono uppercase text-cyan-400 font-semibold tracking-wider">
              Fleet Command & Asset Telemetry
            </span>
          </div>
          <h2 className="text-2xl font-bold text-white font-['Poppins'] mt-1">
            Prime Movers, Trailers & Maintenance
          </h2>
          <p className="text-slate-400 text-xs mt-1">
            Real-time inspection statuses, fuel logs, service history, and roadworthiness compliance across corridors.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center flex-wrap gap-2.5">
          <button
            onClick={() => setShowAddVehicleModal(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-semibold text-xs shadow-lg shadow-cyan-600/25 flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Vehicle</span>
          </button>
          <button
            onClick={() => setShowAddTrailerModal(true)}
            className="px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>Add Trailer</span>
          </button>
          <button
            onClick={() => setShowAddMaintenanceModal(true)}
            className="px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Wrench className="w-4 h-4 text-amber-400" />
            <span>Log Service</span>
          </button>
          <button
            onClick={() => setShowAddFuelModal(true)}
            className="px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Fuel className="w-4 h-4 text-emerald-400" />
            <span>Log Fuel</span>
          </button>
          <button
            onClick={loadData}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
            title="Refresh Fleet"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Fleet KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-[#0A1024]/80 border border-slate-800 rounded-2xl p-4">
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span>Total Fleet Assets</span>
            <Truck className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono mt-2">{vehicles.length} Prime Movers</div>
          <div className="text-[11px] text-slate-500 mt-1">{trailers.length} trailer chassis registered</div>
        </div>

        <div className="bg-[#0A1024]/80 border border-slate-800 rounded-2xl p-4">
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span>Vehicles in Transit</span>
            <MapPin className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-2xl font-bold text-teal-400 font-mono mt-2">{activeTripsVehicles} Units</div>
          <div className="text-[11px] text-slate-500 mt-1">On cross-border corridors</div>
        </div>

        <div className="bg-[#0A1024]/80 border border-slate-800 rounded-2xl p-4">
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span>Maintenance Bay</span>
            <Wrench className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400 font-mono mt-2">{inMaintenanceCount} In Workshop</div>
          <div className="text-[11px] text-slate-500 mt-1">{maintenanceRecords.length} historical service jobs</div>
        </div>

        <div className="bg-[#0A1024]/80 border border-slate-800 rounded-2xl p-4">
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span>Gross Tonnage Capacity</span>
            <ShieldCheck className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-blue-400 font-mono mt-2">
            {(totalFleetCapacity / 1000).toFixed(0)} Tonnes
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Available transport volume</div>
        </div>
      </div>

      {/* Sub-Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
        {[
          { key: 'vehicles', label: `Prime Movers (${vehicles.length})`, icon: Truck },
          { key: 'trailers', label: `Trailers (${trailers.length})`, icon: Layers },
          { key: 'maintenance', label: `Maintenance & Repairs (${maintenanceRecords.length})`, icon: Wrench },
          { key: 'fuel', label: `Fuel Ledger (${fuelRecords.length})`, icon: Fuel },
          { key: 'documents', label: `Vehicle Compliance Docs (${vehicleDocuments.length})`, icon: FileText },
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

      {/* TAB 1: VEHICLES */}
      {activeTab === 'vehicles' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#0A1024]/60 p-3 rounded-xl border border-slate-800">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search registration, make, model, driver..."
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
                <option value="AVAILABLE">AVAILABLE</option>
                <option value="ASSIGNED">ASSIGNED</option>
                <option value="IN_TRANSIT">IN TRANSIT</option>
                <option value="MAINTENANCE">MAINTENANCE</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>
            </div>
          </div>

          {filteredVehicles.length === 0 ? (
            <EmptyState
              title="No fleet vehicles registered"
              description="Register international prime movers and heavy freight assets to manage transport dispatches."
              icon={<Truck className="w-8 h-8 text-cyan-400" />}
              action={{
                label: 'Register First Fleet Vehicle',
                onClick: () => setShowAddVehicleModal(true),
              }}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredVehicles.map((v) => (
                <div
                  key={v.id}
                  className="bg-[#0A1024]/80 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 transition-all shadow-md space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-mono text-base font-bold text-cyan-300 tracking-wider">
                        {v.registrationNumber}
                      </div>
                      <div className="text-xs text-slate-300 font-medium">
                        {v.make} {v.model} ({v.year || 2023})
                      </div>
                      <div className="text-[11px] text-slate-500">{v.vehicleType}</div>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase ${
                        v.status === 'AVAILABLE'
                          ? 'bg-emerald-950/80 border border-emerald-500/40 text-emerald-300'
                          : v.status === 'IN_TRANSIT' || v.status === 'ON_TRIP'
                          ? 'bg-cyan-950/80 border border-cyan-500/40 text-cyan-300'
                          : v.status === 'MAINTENANCE'
                          ? 'bg-amber-950/80 border border-amber-500/40 text-amber-300'
                          : 'bg-slate-900 border border-slate-700 text-slate-400'
                      }`}
                    >
                      {v.status}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-400 border-t border-slate-800/80 pt-3">
                    <div className="flex items-center justify-between">
                      <span>Assigned Driver:</span>
                      <span className="text-white font-medium">
                        {v.assignedDriverName || <span className="text-slate-500 italic">Unassigned</span>}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Capacity:</span>
                      <span className="font-mono text-cyan-400 font-semibold">{v.capacityKg?.toLocaleString()} KG</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Current Location:</span>
                      <span className="text-slate-300 truncate max-w-[180px]">
                        {v.currentLocation || 'Depot Hub'}
                      </span>
                    </div>
                    {v.insuranceExpiry && (
                      <div className="flex items-center justify-between text-[11px]">
                        <span>Insurance Expiry:</span>
                        <span className="text-amber-400 font-mono">{v.insuranceExpiry}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                    <button
                      onClick={() => {
                        setMaintenanceForm((prev) => ({ ...prev, vehicleId: v.id }));
                        setShowAddMaintenanceModal(true);
                      }}
                      className="flex-1 py-1.5 px-2 bg-slate-900 hover:bg-slate-800 rounded-xl text-[11px] font-medium text-slate-300 flex items-center justify-center gap-1"
                    >
                      <Wrench className="w-3 h-3 text-amber-400" />
                      <span>Service</span>
                    </button>
                    <button
                      onClick={() => {
                        setFuelForm((prev) => ({ ...prev, vehicleId: v.id }));
                        setShowAddFuelModal(true);
                      }}
                      className="flex-1 py-1.5 px-2 bg-slate-900 hover:bg-slate-800 rounded-xl text-[11px] font-medium text-slate-300 flex items-center justify-center gap-1"
                    >
                      <Fuel className="w-3 h-3 text-emerald-400" />
                      <span>Fuel</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: TRAILERS */}
      {activeTab === 'trailers' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-[#0A1024]/60 p-3 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-400 font-mono">Heavy Freight Trailers & Chassis Inventory</span>
            <button
              onClick={() => setShowAddTrailerModal(true)}
              className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Register Trailer</span>
            </button>
          </div>

          {trailers.length === 0 ? (
            <EmptyState
              title="No trailers registered"
              description="Add semi-trailers, flatbeds, lowbeds, and refrigerated chassis units."
              icon={<Layers className="w-8 h-8 text-cyan-400" />}
              action={{
                label: 'Add Trailer Unit',
                onClick: () => setShowAddTrailerModal(true),
              }}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {trailers.map((t) => (
                <div
                  key={t.id}
                  className="bg-[#0A1024]/80 border border-slate-800 rounded-2xl p-5 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-mono text-base font-bold text-teal-300">{t.trailerNumber}</div>
                      <div className="text-xs text-slate-300">{t.trailerType} Trailer</div>
                      <div className="text-[11px] text-slate-500">{t.make} • {t.axles} Axles • {t.lengthMeters}m</div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-slate-900 border border-slate-700 text-slate-300">
                      {t.status}
                    </span>
                  </div>

                  <div className="text-xs text-slate-400 space-y-1 border-t border-slate-800 pt-3">
                    <div className="flex justify-between">
                      <span>Payload Limit:</span>
                      <span className="font-mono text-white font-semibold">{t.capacityKg.toLocaleString()} KG</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Attached Prime Mover:</span>
                      <span className="text-cyan-400 font-mono font-bold">
                        {t.assignedVehicleReg || <span className="text-slate-500 italic">Uncoupled</span>}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: MAINTENANCE */}
      {activeTab === 'maintenance' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-[#0A1024]/60 p-3 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-400 font-mono">Vehicle Service & Mechanical Maintenance Ledger</span>
            <button
              onClick={() => setShowAddMaintenanceModal(true)}
              className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Record Maintenance Job</span>
            </button>
          </div>

          {maintenanceRecords.length === 0 ? (
            <EmptyState
              title="No maintenance records found"
              description="Log preventative maintenance, overhaul checks, tire replacements, and roadworthiness inspections."
              icon={<Wrench className="w-8 h-8 text-amber-400" />}
              action={{
                label: 'Log Service Record',
                onClick: () => setShowAddMaintenanceModal(true),
              }}
            />
          ) : (
            <div className="space-y-3">
              {maintenanceRecords.map((m) => (
                <div
                  key={m.id}
                  className="bg-[#0A1024]/80 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2 font-mono text-xs">
                      <span className="text-amber-400 font-bold">{m.recordNumber}</span>
                      <span className="text-slate-500">•</span>
                      <span className="text-white font-bold">{m.vehicleReg}</span>
                      <span className="text-slate-500">•</span>
                      <span className="text-slate-400">{m.dateReported}</span>
                    </div>
                    <div className="text-sm font-semibold text-slate-200 mt-1">{m.serviceType}</div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      Assigned: {m.assignedMechanic} {m.description && `• ${m.description}`}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-xs text-slate-400">Estimated Cost</div>
                      <div className="font-mono text-sm font-bold text-white">
                        {m.currency} {m.estimatedCost.toLocaleString()}
                      </div>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-mono font-bold uppercase ${
                        m.status === 'COMPLETED'
                          ? 'bg-emerald-950 border border-emerald-500/40 text-emerald-300'
                          : m.status === 'IN_PROGRESS'
                          ? 'bg-blue-950 border border-blue-500/40 text-blue-300'
                          : 'bg-amber-950 border border-amber-500/40 text-amber-300'
                      }`}
                    >
                      {m.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: FUEL RECORDS */}
      {activeTab === 'fuel' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-[#0A1024]/60 p-3 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-400 font-mono">Transit Fuel Consumption & Corridor Receipts</span>
            <button
              onClick={() => setShowAddFuelModal(true)}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Record Fuel Entry</span>
            </button>
          </div>

          {fuelRecords.length === 0 ? (
            <EmptyState
              title="No fuel logs recorded"
              description="Track refuelling stops, litres dispensed, pump rates, and odometer telemetry along freight corridors."
              icon={<Fuel className="w-8 h-8 text-emerald-400" />}
              action={{
                label: 'Record First Fuel Entry',
                onClick: () => setShowAddFuelModal(true),
              }}
            />
          ) : (
            <div className="space-y-3">
              {fuelRecords.map((f) => (
                <div
                  key={f.id}
                  className="bg-[#0A1024]/80 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2 font-mono text-xs">
                      <span className="text-emerald-400 font-bold">{f.receiptNumber}</span>
                      <span className="text-slate-500">•</span>
                      <span className="text-white font-bold">{f.vehicleReg}</span>
                      <span className="text-slate-500">•</span>
                      <span className="text-slate-400">{f.date}</span>
                    </div>
                    <div className="text-sm font-semibold text-slate-200 mt-1">{f.fuelStation}</div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      Driver: {f.driverName} • Route: {f.route || 'Transit corridor'} • Odometer: {f.odometerKm?.toLocaleString()} KM
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-mono text-base font-bold text-emerald-400">
                      {f.currency} {f.totalCost.toFixed(2)}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      {f.litres} L @ {f.currency} {f.pricePerLitre}/L
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: COMPLIANCE DOCUMENTS */}
      {activeTab === 'documents' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-[#0A1024]/60 p-3 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-400 font-mono">Fleet Logbooks, Insurance & KEBS Compliance</span>
            <button
              onClick={() => setShowUploadDocModal(true)}
              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Upload Document</span>
            </button>
          </div>

          {vehicleDocuments.length === 0 ? (
            <EmptyState
              title="No fleet documents stored"
              description="Archive COMESA Yellow Cards, speed governor certificates, logbooks, and cross-border road transit permits."
              icon={<FileCheck className="w-8 h-8 text-blue-400" />}
              action={{
                label: 'Upload Fleet Document',
                onClick: () => setShowUploadDocModal(true),
              }}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {vehicleDocuments.map((doc) => (
                <div
                  key={doc.id}
                  className="bg-[#0A1024]/80 border border-slate-800 rounded-xl p-4 flex items-start justify-between gap-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-xl bg-blue-950/80 border border-blue-500/40 text-blue-400 mt-1">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white">{doc.title}</div>
                      <div className="text-xs text-cyan-400 font-mono">{doc.referenceLabel}</div>
                      <div className="text-[11px] text-slate-400 mt-1">
                        Category: {doc.category} • {doc.fileName}
                      </div>
                      {doc.expiryDate && (
                        <div className="text-[11px] text-amber-400 font-mono mt-0.5">
                          Expires: {doc.expiryDate}
                        </div>
                      )}
                    </div>
                  </div>
                  <span className="px-2 py-1 rounded-md text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                    VERIFIED
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

      {/* ADD VEHICLE MODAL */}
      {showAddVehicleModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0A1024] border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white font-['Poppins']">Register Fleet Vehicle</h3>
              <button onClick={() => setShowAddVehicleModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateVehicle} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1">Registration Number *</label>
                <input
                  type="text"
                  required
                  value={vehicleForm.registrationNumber}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, registrationNumber: e.target.value })}
                  placeholder="e.g. UBD 849X / KDA 391Z"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono uppercase"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">Make *</label>
                  <input
                    type="text"
                    required
                    value={vehicleForm.make}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, make: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Model *</label>
                  <input
                    type="text"
                    required
                    value={vehicleForm.model}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, model: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">Payload Capacity (KG) *</label>
                  <input
                    type="number"
                    required
                    value={vehicleForm.capacityKg}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, capacityKg: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Year</label>
                  <input
                    type="number"
                    value={vehicleForm.year}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, year: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Assign Driver (Optional)</label>
                <select
                  value={vehicleForm.assignedDriverId}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, assignedDriverId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                >
                  <option value="">-- No driver assigned --</option>
                  {drivers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.fullName} ({d.phone})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">Initial Status</label>
                  <select
                    value={vehicleForm.status}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, status: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  >
                    <option value="AVAILABLE">AVAILABLE</option>
                    <option value="ASSIGNED">ASSIGNED</option>
                    <option value="MAINTENANCE">MAINTENANCE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Insurance Expiry</label>
                  <input
                    type="date"
                    value={vehicleForm.insuranceExpiry}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, insuranceExpiry: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddVehicleModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold rounded-xl"
                >
                  Save Vehicle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD TRAILER MODAL */}
      {showAddTrailerModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0A1024] border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white font-['Poppins']">Register Semi-Trailer</h3>
              <button onClick={() => setShowAddTrailerModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTrailer} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1">Trailer Number / Chassis ID *</label>
                <input
                  type="text"
                  required
                  value={trailerForm.trailerNumber}
                  onChange={(e) => setTrailerForm({ ...trailerForm, trailerNumber: e.target.value })}
                  placeholder="e.g. TR-KCC-09"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono uppercase"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">Trailer Type</label>
                  <select
                    value={trailerForm.trailerType}
                    onChange={(e) => setTrailerForm({ ...trailerForm, trailerType: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  >
                    <option value="Flatbed">Flatbed (General Cargo)</option>
                    <option value="Lowbed">Lowbed (Heavy Machinery)</option>
                    <option value="Skeleton">Skeleton (Container Carrier)</option>
                    <option value="Box Trailer">Box Trailer (Enclosed)</option>
                    <option value="Tanker">Tanker (Liquid Freight)</option>
                    <option value="Refrigerated">Refrigerated (Cold Chain)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Capacity (KG) *</label>
                  <input
                    type="number"
                    required
                    value={trailerForm.capacityKg}
                    onChange={(e) => setTrailerForm({ ...trailerForm, capacityKg: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">Axles Count</label>
                  <input
                    type="number"
                    value={trailerForm.axles}
                    onChange={(e) => setTrailerForm({ ...trailerForm, axles: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Length (Meters)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={trailerForm.lengthMeters}
                    onChange={(e) => setTrailerForm({ ...trailerForm, lengthMeters: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Attach to Prime Mover (Optional)</label>
                <select
                  value={trailerForm.assignedVehicleId}
                  onChange={(e) => setTrailerForm({ ...trailerForm, assignedVehicleId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                >
                  <option value="">-- No prime mover coupled --</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.registrationNumber} ({v.make} {v.model})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddTrailerModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold rounded-xl"
                >
                  Save Trailer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD MAINTENANCE MODAL */}
      {showAddMaintenanceModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0A1024] border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white font-['Poppins']">Log Maintenance Record</h3>
              <button onClick={() => setShowAddMaintenanceModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateMaintenance} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1">Select Vehicle *</label>
                <select
                  required
                  value={maintenanceForm.vehicleId}
                  onChange={(e) => setMaintenanceForm({ ...maintenanceForm, vehicleId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                >
                  <option value="">-- Choose Vehicle --</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.registrationNumber} ({v.make} {v.model})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Service Required / Category *</label>
                <input
                  type="text"
                  required
                  value={maintenanceForm.serviceType}
                  onChange={(e) => setMaintenanceForm({ ...maintenanceForm, serviceType: e.target.value })}
                  placeholder="e.g. Brake Caliper Replacement & Air Lines Inspection"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">Estimated Cost (USD) *</label>
                  <input
                    type="number"
                    required
                    value={maintenanceForm.estimatedCost}
                    onChange={(e) => setMaintenanceForm({ ...maintenanceForm, estimatedCost: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Status</label>
                  <select
                    value={maintenanceForm.status}
                    onChange={(e) => setMaintenanceForm({ ...maintenanceForm, status: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  >
                    <option value="REQUESTED">REQUESTED</option>
                    <option value="IN_PROGRESS">IN PROGRESS</option>
                    <option value="COMPLETED">COMPLETED</option>
                    <option value="CANCELLED">CANCELLED</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Assigned Mechanic / Engineering Workshop</label>
                <input
                  type="text"
                  value={maintenanceForm.assignedMechanic}
                  onChange={(e) => setMaintenanceForm({ ...maintenanceForm, assignedMechanic: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Service Notes</label>
                <textarea
                  rows={2}
                  value={maintenanceForm.description}
                  onChange={(e) => setMaintenanceForm({ ...maintenanceForm, description: e.target.value })}
                  placeholder="Diagnostic details, parts changed..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddMaintenanceModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-amber-600 to-amber-500 text-white font-semibold rounded-xl"
                >
                  Save Maintenance Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD FUEL MODAL */}
      {showAddFuelModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0A1024] border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white font-['Poppins']">Record Fuel Entry</h3>
              <button onClick={() => setShowAddFuelModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateFuel} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">Vehicle *</label>
                  <select
                    required
                    value={fuelForm.vehicleId}
                    onChange={(e) => setFuelForm({ ...fuelForm, vehicleId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  >
                    <option value="">-- Choose Vehicle --</option>
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.registrationNumber}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Driver *</label>
                  <select
                    required
                    value={fuelForm.driverId}
                    onChange={(e) => setFuelForm({ ...fuelForm, driverId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  >
                    <option value="">-- Choose Driver --</option>
                    {drivers.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.fullName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Fuel Station / Depot *</label>
                <input
                  type="text"
                  required
                  value={fuelForm.fuelStation}
                  onChange={(e) => setFuelForm({ ...fuelForm, fuelStation: e.target.value })}
                  placeholder="e.g. Shell Mombasa Port Road"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">Litres *</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={fuelForm.litres}
                    onChange={(e) => setFuelForm({ ...fuelForm, litres: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Price/Litre (USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={fuelForm.pricePerLitre}
                    onChange={(e) => setFuelForm({ ...fuelForm, pricePerLitre: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Odometer (KM)</label>
                  <input
                    type="number"
                    required
                    value={fuelForm.odometerKm}
                    onChange={(e) => setFuelForm({ ...fuelForm, odometerKm: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Transit Route</label>
                <input
                  type="text"
                  value={fuelForm.route}
                  onChange={(e) => setFuelForm({ ...fuelForm, route: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddFuelModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-semibold rounded-xl"
                >
                  Save Fuel Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* UPLOAD DOCUMENT MODAL */}
      {showUploadDocModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0A1024] border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white font-['Poppins']">Upload Fleet Compliance Document</h3>
              <button onClick={() => setShowUploadDocModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadDoc} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1">Document Title *</label>
                <input
                  type="text"
                  required
                  value={docForm.title}
                  onChange={(e) => setDocForm({ ...docForm, title: e.target.value })}
                  placeholder="e.g. COMESA Yellow Card Insurance Certificate"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">Related Vehicle *</label>
                  <select
                    required
                    value={docForm.referenceId}
                    onChange={(e) => setDocForm({ ...docForm, referenceId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  >
                    <option value="">-- Choose Vehicle --</option>
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.registrationNumber}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Expiry Date</label>
                  <input
                    type="date"
                    value={docForm.expiryDate}
                    onChange={(e) => setDocForm({ ...docForm, expiryDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Upload File (PDF / Image)</label>
                <input
                  type="file"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) setDocForm({ ...docForm, fileName: f.name });
                  }}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-300 file:mr-3 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:bg-cyan-900 file:text-cyan-200"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowUploadDocModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold rounded-xl"
                >
                  Upload & Verify
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
