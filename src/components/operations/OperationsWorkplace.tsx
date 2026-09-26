import React, { useState, useEffect } from 'react';
import {
  Truck,
  Package,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  ChevronRight,
  Filter,
  Search,
  Plus,
  Compass,
  ArrowRight,
  RefreshCw,
  Users
} from 'lucide-react';
import { db, COLLECTIONS } from '../../lib/firestoreService';
import { Shipment, Booking, Driver, Vehicle, Trip } from '../../types';
import { EmptyState } from '../common/EmptyState';

interface OperationsWorkplaceProps {
  onNavigate: (view: string) => void;
}

export const OperationsWorkplace: React.FC<OperationsWorkplaceProps> = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'shipments' | 'bookings' | 'dispatch' | 'fleet'>('shipments');
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  // Dispatch state
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [dispatchDate, setDispatchDate] = useState(new Date().toISOString().split('T')[0]);
  const [dispatchError, setDispatchError] = useState<string | null>(null);
  const [dispatchSuccess, setDispatchSuccess] = useState(false);

  const loadData = async () => {
    try {
      const [sList, bList, dList, vList, tList] = await Promise.all([
        db.getAll<Shipment>(COLLECTIONS.SHIPMENTS),
        db.getAll<Booking>(COLLECTIONS.BOOKINGS),
        db.getAll<Driver>(COLLECTIONS.DRIVERS),
        db.getAll<Vehicle>(COLLECTIONS.VEHICLES),
        db.getAll<Trip>(COLLECTIONS.TRIPS),
      ]);
      setShipments(sList);
      setBookings(bList);
      setDrivers(dList);
      setVehicles(vList);
      setTrips(tList);
    } catch (e) {
      console.error('Error loading operations data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const unsubS = db.subscribe(COLLECTIONS.SHIPMENTS, loadData);
    const unsubB = db.subscribe(COLLECTIONS.BOOKINGS, loadData);
    return () => {
      unsubS();
      unsubB();
    };
  }, []);

  const handleDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShipment || !selectedDriverId || !selectedVehicleId) {
      setDispatchError('Please select both a driver and vehicle for dispatch.');
      return;
    }
    const driver = drivers.find((d) => d.id === selectedDriverId);
    const vehicle = vehicles.find((v) => v.id === selectedVehicleId);
    if (!driver || !vehicle) return;

    try {
      await db.createDispatch({
        shipmentId: selectedShipment.id,
        driverId: driver.id,
        vehicleId: vehicle.id,
        scheduledPickupDate: dispatchDate,
        expectedDeliveryDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
      });
      setDispatchSuccess(true);
      setTimeout(() => {
        setSelectedShipment(null);
        setDispatchSuccess(false);
        loadData();
      }, 1500);
    } catch (err: any) {
      setDispatchError(err.message || 'Dispatch creation failed.');
    }
  };

  const handleConfirmBooking = async (booking: Booking) => {
    try {
      await db.confirmBookingToShipment(booking.id, 'Operations Central Desk');
      loadData();
    } catch (e) {
      console.error(e);
    }
  };

  const activeShipments = shipments.filter((s) => s.status === 'IN_TRANSIT' || s.status === 'LOADING');
  const pendingBookings = bookings.filter((b) => b.status === 'PENDING');
  const availableDrivers = drivers.filter((d) => d.status === 'AVAILABLE');
  const availableVehicles = vehicles.filter((v) => v.status === 'AVAILABLE');

  return (
    <div className="min-h-screen bg-[#050816] text-[#F8FAFC]">
      {/* Top Operations Header */}
      <div className="bg-[#080D1F] border-b border-slate-800 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-600 to-blue-500 flex items-center justify-center text-white font-bold shadow-lg shadow-cyan-600/30">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold font-['Poppins'] text-white">Operations & Fleet Dispatch Workplace</h1>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                DISPATCH DESK
              </span>
            </div>
            <p className="text-xs text-slate-400">Coordination of cross-border haulage, bookings, vehicle assignment, and transit milestones</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('admin')}
            className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs border border-slate-700 transition-colors"
          >
            Admin Center
          </button>
          <button
            onClick={() => onNavigate('home')}
            className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs border border-slate-700 transition-colors"
          >
            Public Website
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-800 bg-[#080D1F]/50 px-6 flex gap-3 text-xs font-medium">
        <button
          onClick={() => setActiveTab('shipments')}
          className={`py-3 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'shipments' ? 'border-cyan-400 text-cyan-300 font-bold' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Active Shipments ({activeShipments.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('bookings')}
          className={`py-3 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'bookings' ? 'border-cyan-400 text-cyan-300 font-bold' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Booking Requisitions ({pendingBookings.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('dispatch')}
          className={`py-3 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'dispatch' ? 'border-cyan-400 text-cyan-300 font-bold' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>Assign & Dispatch Unit</span>
        </button>
        <button
          onClick={() => setActiveTab('fleet')}
          className={`py-3 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'fleet' ? 'border-cyan-400 text-cyan-300 font-bold' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Drivers & Fleet Status</span>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-[#0B1329] border border-slate-800 p-4 rounded-2xl">
            <span className="text-[11px] text-slate-400 block uppercase font-medium">In Transit</span>
            <div className="text-2xl font-bold font-mono text-cyan-400 mt-1">{activeShipments.length}</div>
            <span className="text-[10px] text-slate-500">Live corridor tracking</span>
          </div>
          <div className="bg-[#0B1329] border border-slate-800 p-4 rounded-2xl">
            <span className="text-[11px] text-slate-400 block uppercase font-medium">Pending Bookings</span>
            <div className="text-2xl font-bold font-mono text-amber-400 mt-1">{pendingBookings.length}</div>
            <span className="text-[10px] text-slate-500">Awaiting dispatch review</span>
          </div>
          <div className="bg-[#0B1329] border border-slate-800 p-4 rounded-2xl">
            <span className="text-[11px] text-slate-400 block uppercase font-medium">Available Fleet</span>
            <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">{availableVehicles.length}</div>
            <span className="text-[10px] text-slate-500">Ready for assignment</span>
          </div>
          <div className="bg-[#0B1329] border border-slate-800 p-4 rounded-2xl">
            <span className="text-[11px] text-slate-400 block uppercase font-medium">Duty Drivers</span>
            <div className="text-2xl font-bold font-mono text-blue-400 mt-1">{availableDrivers.length}</div>
            <span className="text-[10px] text-slate-500">Verified commercial licenses</span>
          </div>
        </div>

        {/* Tab 1: Active Shipments */}
        {activeTab === 'shipments' && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-white font-['Poppins']">Live Shipments Under Transit Control</h2>
            {shipments.length === 0 ? (
              <EmptyState
                icon={<Package className="w-7 h-7 text-cyan-400" />}
                title="No Shipments"
                description="No active shipments recorded."
              />
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {shipments.map((s) => (
                  <div
                    key={s.id}
                    className="p-4 rounded-2xl bg-[#0B1329] border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-sm font-bold text-white">{s.shipmentNumber}</span>
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-500/20 text-cyan-300 border border-cyan-500/30 uppercase">
                          {s.status.replace(/_/g, ' ')}
                        </span>
                        <span className="text-slate-400">Client: <strong className="text-slate-200">{s.customerName}</strong></span>
                      </div>
                      <div className="text-slate-300 mt-1 flex items-center gap-2">
                        <span>{s.originCity}, {s.originCountry}</span>
                        <span>→</span>
                        <span>{s.destinationCity}, {s.destinationCountry}</span>
                      </div>
                      <div className="text-slate-400 text-[11px] mt-0.5">
                        Cargo: {s.cargoDescription} ({s.weightKg.toLocaleString()} kg) • Dispatched: {s.assignedVehicleReg || 'Unassigned'} ({s.assignedDriverName || 'No driver'})
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {!s.assignedDriverId && (
                        <button
                          onClick={() => {
                            setSelectedShipment(s);
                            setActiveTab('dispatch');
                          }}
                          className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-colors"
                        >
                          Dispatch Now
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Bookings */}
        {activeTab === 'bookings' && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-white font-['Poppins']">Pending Booking Requisitions</h2>
            {bookings.length === 0 ? (
              <EmptyState
                icon={<Calendar className="w-7 h-7 text-cyan-400" />}
                title="No Bookings"
                description="No client booking requisitions pending."
              />
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {bookings.map((b) => (
                  <div
                    key={b.id}
                    className="p-4 rounded-2xl bg-[#0B1329] border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-sm font-bold text-white">{b.bookingReference}</span>
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-500/20 text-amber-300 uppercase">
                          {b.status}
                        </span>
                        <span className="text-slate-300">Requester: <strong>{b.fullName}</strong></span>
                      </div>
                      <div className="text-slate-400 mt-1">
                        Route: {b.pickupLocation}, {b.pickupCountry} → {b.deliveryLocation}, {b.deliveryCountry}
                      </div>
                      <div className="text-slate-400 text-[11px] mt-0.5">
                        Cargo: {b.cargoDescription} • Weight: {b.weightKg.toLocaleString()} kg • Date: {b.pickupDate}
                      </div>
                    </div>

                    {b.status === 'PENDING' && (
                      <button
                        onClick={() => handleConfirmBooking(b)}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center gap-1.5 transition-colors"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Accept & Create Shipment</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Dispatch Unit */}
        {activeTab === 'dispatch' && (
          <div className="max-w-2xl mx-auto bg-[#0B1329] border border-slate-800 p-6 rounded-2xl space-y-4">
            <h2 className="text-lg font-bold text-white font-['Poppins']">Dispatch Unit & Trip Requisition</h2>
            <p className="text-xs text-slate-400">
              Assign a certified heavy commercial vehicle and driver to a confirmed cargo consignment.
            </p>

            <form onSubmit={handleDispatch} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-300 font-medium block mb-1">Select Consignment</label>
                <select
                  aria-label="Select Consignment"
                  value={selectedShipment?.id || ''}
                  onChange={(e) => {
                    const target = shipments.find((s) => s.id === e.target.value);
                    setSelectedShipment(target || null);
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200"
                >
                  <option value="">-- Choose Shipment --</option>
                  {shipments.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.shipmentNumber} — {s.originCity} to {s.destinationCity} ({s.cargoDescription})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">Select Verified Driver</label>
                <select
                  aria-label="Select Verified Driver"
                  value={selectedDriverId}
                  onChange={(e) => setSelectedDriverId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200"
                >
                  <option value="">-- Choose Driver --</option>
                  {drivers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.fullName} ({d.phone}) — Lic: {d.licenseNumber} [{d.status}]
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">Select Vehicle / Prime Mover</label>
                <select
                  aria-label="Select Vehicle / Prime Mover"
                  value={selectedVehicleId}
                  onChange={(e) => setSelectedVehicleId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200"
                >
                  <option value="">-- Choose Vehicle --</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.registrationNumber} — {v.make} {v.model} ({v.vehicleType}) [{v.status}]
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">Scheduled Pickup Date</label>
                <input
                  type="date"
                  value={dispatchDate}
                  onChange={(e) => setDispatchDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200"
                />
              </div>

              {dispatchError && (
                <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-300 text-xs">
                  {dispatchError}
                </div>
              )}

              {dispatchSuccess && (
                <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Dispatch Trip Successfully Activated! Driver notified.</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold shadow-lg shadow-cyan-600/30 transition-all"
              >
                Confirm Dispatch & Notify Driver
              </button>
            </form>
          </div>
        )}

        {/* Tab 4: Fleet & Drivers */}
        {activeTab === 'fleet' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-[#0B1329] border border-slate-800 p-5 rounded-2xl">
              <h3 className="text-sm font-bold text-white mb-3">Heavy Fleet Units ({vehicles.length})</h3>
              <div className="space-y-2 text-xs">
                {vehicles.map((v) => (
                  <div key={v.id} className="p-3 rounded-xl bg-slate-900 flex items-center justify-between border border-slate-800">
                    <div>
                      <span className="font-mono font-bold text-white">{v.registrationNumber}</span>
                      <div className="text-slate-400 text-[11px]">{v.make} {v.model} • {v.vehicleType}</div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-cyan-300 uppercase">
                      {v.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#0B1329] border border-slate-800 p-5 rounded-2xl">
              <h3 className="text-sm font-bold text-white mb-3">Registered Commercial Drivers ({drivers.length})</h3>
              <div className="space-y-2 text-xs">
                {drivers.map((d) => (
                  <div key={d.id} className="p-3 rounded-xl bg-slate-900 flex items-center justify-between border border-slate-800">
                    <div>
                      <span className="font-semibold text-white">{d.fullName}</span>
                      <div className="text-slate-400 text-[11px]">{d.phone} • Lic: {d.licenseNumber}</div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-emerald-300 uppercase">
                      {d.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
