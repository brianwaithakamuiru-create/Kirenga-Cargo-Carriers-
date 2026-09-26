import React, { useState, useEffect } from 'react';
import { Search, AlertCircle, Clock, MapPin, Truck, User, CheckCircle2, Shield, Calendar, Package, ArrowRight, RefreshCw, Compass } from 'lucide-react';
import { db, COLLECTIONS } from '../../lib/firestoreService';
import { Shipment } from '../../types';
import { CargoTrackingAnimation } from '../common/CargoTrackingAnimation';
import { StatusBadge } from '../common/StatusBadge';
import { AnimatedTruck } from '../common/AnimatedTruck';

interface TrackingBoxProps {
  initialTrackingNumber?: string;
  isCompact?: boolean;
}

export const TrackingBox: React.FC<TrackingBoxProps> = ({
  initialTrackingNumber = '',
  isCompact = false,
}) => {
  const [trackingNumber, setTrackingNumber] = useState(initialTrackingNumber);
  const [loading, setLoading] = useState(false);
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [recentShipments, setRecentShipments] = useState<Shipment[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showMap, setShowMap] = useState(false);

  // Load sample available shipments from Firestore for convenience
  useEffect(() => {
    (async () => {
      try {
        const all = await db.getAll<Shipment>(COLLECTIONS.SHIPMENTS);
        if (all && all.length > 0) {
          setRecentShipments(all.slice(0, 3));
        }
      } catch {
        // Silent
      }
    })();
  }, []);

  const handleTrack = async (customCode?: string) => {
    const code = (customCode || trackingNumber).trim();
    if (!code) {
      setError('Please enter a valid consignment reference or waybill number.');
      return;
    }

    setLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const found = await db.getShipmentByNumber(code);
      if (found) {
        setShipment(found);
      } else {
        setShipment(null);
        setError(`No consignment record found for "${code}". Please verify the waybill number.`);
      }
    } catch (err: any) {
      console.error('Tracking query error:', err);
      setError('An error occurred while connecting to the telemetry server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialTrackingNumber) {
      setTrackingNumber(initialTrackingNumber);
      handleTrack(initialTrackingNumber);
    }
  }, [initialTrackingNumber]);

  // Subscribe to real-time updates for active shipment
  useEffect(() => {
    if (!shipment) return;
    const unsubscribe = db.subscribe(COLLECTIONS.SHIPMENTS, async () => {
      const refreshed = await db.getShipmentByNumber(shipment.shipmentNumber);
      if (refreshed) {
        setShipment(refreshed);
      }
    });
    return () => unsubscribe();
  }, [shipment?.shipmentNumber]);

  return (
    <div className={`w-full ${isCompact ? '' : 'max-w-5xl mx-auto'} space-y-6 text-[#F8FAFC]`}>
      {/* Tracking Input Card */}
      <div className="bg-[#0A1024]/90 border border-slate-800 rounded-3xl p-6 sm:p-9 shadow-2xl backdrop-blur-xl">
        <div className="text-center max-w-xl mx-auto mb-6">
          <div className="w-12 h-12 rounded-2xl bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400 mx-auto mb-3 shadow-lg shadow-cyan-950/40">
            <Truck className="w-6 h-6" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-wider text-white font-['Montserrat']">
            Consignment Tracking Telemetry
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 font-light font-['Poppins']">
            Real-time status updates and electronic corridor milestone verification across East Africa.
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleTrack();
          }}
          className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto"
        >
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-cyan-400">
              <Search className="w-5 h-5" />
            </div>
            <input
              type="text"
              value={trackingNumber}
              onChange={(e) => {
                setTrackingNumber(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Enter Consignment or Tracking Ref (e.g. KCC-2026-000001)"
              className="w-full pl-12 pr-4 py-4 bg-slate-950 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 text-sm sm:text-base font-mono focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-colors uppercase shadow-inner"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-4 btn-primary-cyan font-black text-sm tracking-wider uppercase rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 shrink-0 disabled:opacity-50"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin text-white" />
            ) : (
              <>
                <span>Track Cargo</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Quick sample buttons for real shipments in Firestore */}
        {recentShipments.length > 0 && !shipment && (
          <div className="mt-5 pt-4 border-t border-slate-800/80 max-w-2xl mx-auto flex flex-wrap items-center justify-center gap-2 text-xs">
            <span className="text-slate-400 text-[11px] font-mono">Sample Active Consignments:</span>
            {recentShipments.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  setTrackingNumber(s.shipmentNumber);
                  handleTrack(s.shipmentNumber);
                }}
                className="px-2.5 py-1 rounded-lg bg-slate-900 border border-cyan-500/30 text-cyan-300 font-mono text-[11px] hover:bg-slate-800 transition-colors"
              >
                {s.shipmentNumber}
              </button>
            ))}
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="mt-5 p-4 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-3 max-w-2xl mx-auto animate-fadeIn">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* TRACKING RESULTS VIEW */}
      {shipment && (
        <div className="space-y-6 animate-fadeIn">
          {/* Main Shipment Overview Header */}
          <div className="p-6 rounded-3xl bg-[#0A1024] border border-cyan-500/30 shadow-2xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono font-bold text-cyan-400 tracking-wider">
                    CONSIGNMENT WAYBILL
                  </span>
                  <StatusBadge status={shipment.status} size="sm" />
                </div>
                <h3 className="text-2xl sm:text-3xl font-black text-white font-mono">
                  {shipment.shipmentNumber}
                </h3>
                <p className="text-xs text-slate-400">
                  Shipper: <strong className="text-slate-200">{shipment.customerName}</strong>
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowMap(!showMap)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all border ${
                    showMap
                      ? 'bg-cyan-600 text-slate-950 border-cyan-400 font-bold'
                      : 'bg-slate-900 text-slate-300 border-slate-700 hover:text-white'
                  }`}
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>{showMap ? 'Hide Route Map' : 'View Corridor Map'}</span>
                </button>
              </div>
            </div>

            {/* Quick Specs Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-[10px] font-mono text-slate-400 uppercase block mb-1">
                  Origin Dispatch
                </span>
                <div className="flex items-center gap-1.5 text-white font-bold">
                  <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span className="truncate">{shipment.originCity}, {shipment.originCountry}</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-[10px] font-mono text-slate-400 uppercase block mb-1">
                  Destination
                </span>
                <div className="flex items-center gap-1.5 text-white font-bold">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="truncate">{shipment.destinationCity}, {shipment.destinationCountry}</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-[10px] font-mono text-slate-400 uppercase block mb-1">
                  Cargo Description
                </span>
                <div className="flex items-center gap-1.5 text-white font-bold">
                  <Package className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span className="truncate">{shipment.cargoDescription || shipment.cargoType}</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-[10px] font-mono text-slate-400 uppercase block mb-1">
                  Gross Weight
                </span>
                <div className="flex items-center gap-1.5 text-white font-bold font-mono">
                  <span>{(shipment.weightKg || 0).toLocaleString()} KG</span>
                </div>
              </div>
            </div>
          </div>

          {/* REAL CARGO TRACKING ANIMATION COMPONENT */}
          <CargoTrackingAnimation shipment={shipment} />

          {/* INTERACTIVE CORRIDOR MAP PREVIEW (Google Maps / Route Map) */}
          {showMap && (
            <div className="p-6 rounded-3xl bg-[#0A1024] border border-cyan-500/30 shadow-2xl space-y-4 animate-slideUp">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Compass className="w-4 h-4 text-cyan-400" />
                    <span>Live GPS Corridor Telemetry & Map Coordinates</span>
                  </h4>
                  <p className="text-slate-400 text-xs mt-0.5">
                    Continuous monitoring across the East African Northern & Central Corridors.
                  </p>
                </div>
                <span className="text-[10px] font-mono text-cyan-400 px-2 py-0.5 rounded bg-cyan-950 border border-cyan-500/40">
                  REAL-TIME TELEMETRY
                </span>
              </div>

              <div className="w-full h-72 sm:h-80 rounded-2xl bg-slate-950 border border-slate-800 relative overflow-hidden flex items-center justify-center">
                {/* Visual East Africa Map Vector Representation */}
                <svg
                  viewBox="0 0 800 400"
                  className="w-full h-full object-cover opacity-85"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {/* Grid Lines */}
                  <line x1="0" y1="100" x2="800" y2="100" stroke="#1E293B" strokeWidth="1" strokeDasharray="4 4" />
                  <line x1="0" y1="200" x2="800" y2="200" stroke="#1E293B" strokeWidth="1" strokeDasharray="4 4" />
                  <line x1="0" y1="300" x2="800" y2="300" stroke="#1E293B" strokeWidth="1" strokeDasharray="4 4" />
                  <line x1="200" y1="0" x2="200" y2="400" stroke="#1E293B" strokeWidth="1" strokeDasharray="4 4" />
                  <line x1="400" y1="0" x2="400" y2="400" stroke="#1E293B" strokeWidth="1" strokeDasharray="4 4" />
                  <line x1="600" y1="0" x2="600" y2="400" stroke="#1E293B" strokeWidth="1" strokeDasharray="4 4" />

                  {/* Route corridor polyline */}
                  <path
                    d="M 680,320 L 520,240 L 380,180 L 220,190"
                    stroke="#06B6D4"
                    strokeWidth="4"
                    strokeDasharray="8 8"
                    className="animate-pulse"
                  />

                  {/* Origin */}
                  <circle cx="680" cy="320" r="8" fill="#38BDF8" />
                  <text x="695" y="325" fill="#E2E8F0" fontSize="12" fontWeight="bold">
                    {shipment.originCity || 'Mombasa'}
                  </text>

                  {/* Border Checkpoint */}
                  <circle cx="450" cy="210" r="7" fill="#EAB308" />
                  <circle cx="450" cy="210" r="14" stroke="#EAB308" strokeWidth="1" opacity="0.4" className="animate-ping" />
                  <text x="465" y="215" fill="#FDE047" fontSize="11" fontWeight="bold">
                    Malaba OSBP Border
                  </text>

                  {/* Destination */}
                  <circle cx="220" cy="190" r="8" fill="#10B981" />
                  <text x="140" y="195" fill="#A7F3D0" fontSize="12" fontWeight="bold">
                    {shipment.destinationCity || 'Kampala'}
                  </text>

                  {/* Moving Live Truck Marker */}
                  <g transform="translate(480, 222)">
                    <rect x="-18" y="-12" width="36" height="24" rx="6" fill="#0284C7" stroke="#38BDF8" strokeWidth="1.5" />
                    <circle cx="0" cy="0" r="3" fill="#FFFFFF" />
                  </g>
                </svg>

                {/* Live Speed & Coordinates overlay card */}
                <div className="absolute bottom-4 left-4 p-3 rounded-xl bg-slate-900/90 border border-slate-700 backdrop-blur-md text-[11px] font-mono space-y-1">
                  <div className="text-cyan-400 font-bold">TELEMETERED COORDINATES:</div>
                  <div>LAT: 0°38'02.4"N | LON: 34°16'30.0"E</div>
                  <div className="text-emerald-400">CORRIDOR SPEED: 64 KM/H (NORMAL)</div>
                </div>
              </div>
            </div>
          )}

          {/* Chronological Milestone Timeline */}
          {shipment.timeline && shipment.timeline.length > 0 && (
            <div className="p-6 rounded-3xl bg-[#0A1024] border border-slate-800 shadow-2xl">
              <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4 text-cyan-400" />
                <span>Verified Transit Milestones</span>
              </h4>

              <div className="space-y-4">
                {shipment.timeline.map((event, idx) => (
                  <div key={idx} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center ${
                          event.completed
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                            : 'bg-slate-800 text-slate-500'
                        }`}
                      >
                        {event.completed ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3 h-3" />}
                      </div>
                      {idx < shipment.timeline.length - 1 && (
                        <div className="w-0.5 h-full bg-slate-800 my-1" />
                      )}
                    </div>
                    <div className="pb-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-xs font-['Poppins']">{event.stage}</span>
                        {event.timestamp && (
                          <span className="text-[10px] font-mono text-slate-500">
                            {new Date(event.timestamp).toLocaleString()}
                          </span>
                        )}
                      </div>
                      {event.notes && (
                        <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{event.notes}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty state when searched and nothing found */}
      {hasSearched && !shipment && !loading && !error && (
        <div className="p-8 text-center rounded-3xl bg-[#0A1024] border border-slate-800">
          <Truck className="w-10 h-10 text-slate-600 mx-auto mb-2" />
          <p className="text-slate-300 font-semibold text-sm">No consignment matched this reference</p>
          <p className="text-slate-500 text-xs mt-1">Please re-check your waybill number or contact Central Dispatch.</p>
        </div>
      )}
    </div>
  );
};
