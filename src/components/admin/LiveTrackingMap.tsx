import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Navigation,
  Truck,
  MapPin,
  Clock,
  Compass,
  AlertTriangle,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  ChevronRight,
  Shield,
  Layers,
  ArrowRight,
  X,
  ExternalLink,
  Info,
} from 'lucide-react';
import { db, COLLECTIONS } from '../../lib/firestoreService';
import { Shipment, Vehicle, Trip } from '../../types';
import { EmptyState } from '../common/EmptyState';

// Helper to format relative time
function formatLastUpdated(timestamp?: string): { text: string; isOld: boolean } {
  if (!timestamp) return { text: 'Location unavailable', isOld: true };
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return { text: 'Location unavailable', isOld: true };

  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes < 1) return { text: 'Just now', isOld: false };
  if (diffMinutes === 1) return { text: '1 minute ago', isOld: false };
  if (diffMinutes < 10) return { text: `${diffMinutes} minutes ago`, isOld: false };
  if (diffMinutes < 60) return { text: `Last location received ${diffMinutes} minutes ago`, isOld: true };

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours === 1) return { text: 'Last location received 1 hour ago', isOld: true };
  if (diffHours < 24) return { text: `Last location received ${diffHours} hours ago`, isOld: true };

  const diffDays = Math.floor(diffHours / 24);
  return { text: `Last location received ${diffDays} days ago`, isOld: true };
}

interface LiveTrackingMapProps {
  onSelectShipment?: (shipment: Shipment) => void;
}

export const LiveTrackingMap: React.FC<LiveTrackingMapProps> = ({ onSelectShipment }) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const directionsRendererRef = useRef<any>(null);

  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(false);
  const [mapErrorMessage, setMapErrorMessage] = useState<string | null>(null);

  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Load real Firestore data
  const loadData = async () => {
    try {
      const [sList, vList, tList] = await Promise.all([
        db.getAll<Shipment>(COLLECTIONS.SHIPMENTS),
        db.getAll<Vehicle>(COLLECTIONS.VEHICLES),
        db.getAll<Trip>(COLLECTIONS.TRIPS),
      ]);
      setShipments(sList);
      setVehicles(vList);
      setTrips(tList);
    } catch (err) {
      console.error('Error loading live tracking data from Firestore:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const unsubShipments = db.subscribe(COLLECTIONS.SHIPMENTS, loadData);
    const unsubVehicles = db.subscribe(COLLECTIONS.VEHICLES, loadData);
    return () => {
      unsubShipments();
      unsubVehicles();
    };
  }, []);

  // Filtered active tracking items
  const activeItems = useMemo(() => {
    return shipments
      .filter((s) => {
        if (s.status === 'DELIVERED' || s.status === 'CANCELLED') return false;
        if (statusFilter !== 'ALL' && s.status !== statusFilter) return false;
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
          s.shipmentNumber.toLowerCase().includes(q) ||
          (s.assignedVehicleReg && s.assignedVehicleReg.toLowerCase().includes(q)) ||
          (s.assignedDriverName && s.assignedDriverName.toLowerCase().includes(q)) ||
          s.destinationCity.toLowerCase().includes(q) ||
          s.originCity.toLowerCase().includes(q)
        );
      })
      .map((s) => {
        const v = vehicles.find(
          (veh) => veh.id === s.assignedVehicleId || veh.registrationNumber === s.assignedVehicleReg
        );
        const lat = s.currentLatitude || v?.currentLatitude;
        const lng = s.currentLongitude || v?.currentLongitude;
        const lastUpdate = s.lastLocationUpdate || v?.lastLocationUpdate;
        const address = s.lastLocationAddress || v?.lastLocationAddress || v?.currentLocation;

        return {
          shipment: s,
          vehicle: v,
          lat,
          lng,
          lastUpdate,
          address,
          hasGps: typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng),
        };
      });
  }, [shipments, vehicles, statusFilter, searchQuery]);

  // Google Maps Platform Loader
  useEffect(() => {
    const apiKey =
      (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY ||
      (import.meta as any).env?.GOOGLE_MAPS_API_KEY ||
      '';

    if (!apiKey) {
      setMapError(true);
      setMapErrorMessage('Google Maps Platform key not configured in environment.');
      return;
    }

    // Window auth failure callback
    (window as any).gm_authFailure = () => {
      setMapError(true);
      setMapErrorMessage('Google Maps authentication failed or key restriction active.');
    };

    if ((window as any).google?.maps) {
      initMap();
      return;
    }

    const scriptId = 'google-maps-js-sdk';
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        initMap();
      };
      script.onerror = () => {
        setMapError(true);
        setMapErrorMessage('Failed to load Google Maps JavaScript API SDK.');
      };
      document.head.appendChild(script);
    } else {
      initMap();
    }

    function initMap() {
      if (!mapContainerRef.current || !(window as any).google?.maps) return;
      try {
        const center = { lat: 0.3476, lng: 32.5825 }; // Kampala Central Corridor Hub
        const map = new (window as any).google.maps.Map(mapContainerRef.current, {
          center,
          zoom: 6,
          styles: [
            { elementType: 'geometry', stylers: [{ color: '#0A1024' }] },
            { elementType: 'labels.text.stroke', stylers: [{ color: '#0A1024' }] },
            { elementType: 'labels.text.fill', stylers: [{ color: '#748FB5' }] },
            {
              featureType: 'administrative.locality',
              elementType: 'labels.text.fill',
              stylers: [{ color: '#38BDF8' }],
            },
            {
              featureType: 'poi',
              elementType: 'labels.text.fill',
              stylers: [{ color: '#94A3B8' }],
            },
            {
              featureType: 'road',
              elementType: 'geometry',
              stylers: [{ color: '#1E293B' }],
            },
            {
              featureType: 'road.highway',
              elementType: 'geometry',
              stylers: [{ color: '#2563EB' }],
            },
            {
              featureType: 'water',
              elementType: 'geometry',
              stylers: [{ color: '#050816' }],
            },
          ],
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
        });

        mapInstanceRef.current = map;
        setMapLoaded(true);
        setMapError(false);
      } catch (err: any) {
        setMapError(true);
        setMapErrorMessage(err.message || 'Map initialization failed');
      }
    }
  }, []);

  // Update Markers on Map when activeItems change
  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current || !(window as any).google?.maps) return;

    // Clear old markers
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    const bounds = new (window as any).google.maps.LatLngBounds();
    let hasCoords = false;

    activeItems.forEach(({ shipment, vehicle, lat, lng, lastUpdate, address, hasGps }) => {
      if (!hasGps || lat === undefined || lng === undefined) return;

      hasCoords = true;
      const position = { lat, lng };
      bounds.extend(position);

      const marker = new (window as any).google.maps.Marker({
        position,
        map: mapInstanceRef.current,
        title: `${shipment.shipmentNumber} • ${vehicle?.registrationNumber || 'Truck'}`,
        icon: {
          path: (window as any).google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: shipment.status === 'IN_TRANSIT' ? '#06B6D4' : '#3B82F6',
          fillOpacity: 1,
          strokeColor: '#FFFFFF',
          strokeWeight: 2,
        },
      });

      const { text: timeText } = formatLastUpdated(lastUpdate);

      const infoContent = `
        <div style="background:#0A1024; color:#F8FAFC; padding:12px; border-radius:12px; font-family:sans-serif; max-width:260px; border:1px solid #1E293B;">
          <div style="font-weight:bold; font-size:13px; color:#38BDF8; font-family:monospace;">${shipment.shipmentNumber}</div>
          <div style="font-size:12px; font-weight:600; margin-top:2px;">Truck: ${vehicle?.registrationNumber || shipment.assignedVehicleReg || 'Assigned Asset'}</div>
          <div style="font-size:11px; color:#94A3B8; margin-top:2px;">Driver: ${shipment.assignedDriverName || 'Assigned Driver'}</div>
          <div style="font-size:11px; margin-top:2px;">Status: <span style="color:#06B6D4; font-weight:bold;">${shipment.status}</span></div>
          <div style="font-size:11px; color:#94A3B8; margin-top:2px;">Destination: ${shipment.destinationCity}</div>
          <div style="font-size:10px; color:#64748B; margin-top:6px; border-top:1px solid #1E293B; padding-top:4px;">Last update: ${timeText}</div>
        </div>
      `;

      const infoWindow = new (window as any).google.maps.InfoWindow({
        content: infoContent,
      });

      marker.addListener('click', () => {
        infoWindow.open(mapInstanceRef.current, marker);
        setSelectedShipment(shipment);
        setSelectedVehicle(vehicle || null);
      });

      markersRef.current.push(marker);
    });

    if (hasCoords) {
      mapInstanceRef.current.fitBounds(bounds);
    }
  }, [mapLoaded, activeItems]);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Header & Search Bar */}
      <div className="bg-[#0A1024]/80 p-6 rounded-2xl border border-slate-800/80 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-xs font-mono uppercase text-cyan-400 font-semibold tracking-wider">
                SATELLITE & CORRIDOR FLEET RADAR
              </span>
            </div>
            <h2 className="text-2xl font-bold text-white font-['Poppins'] mt-1">
              Live Cargo Tracking & Telemetry
            </h2>
            <p className="text-slate-400 text-xs mt-1">
              Real GPS coordinates reported directly from authenticated driver workplace terminals.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              className="p-2.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-slate-600 text-slate-300 hover:text-white text-xs flex items-center gap-1.5"
              title="Refresh telemetry"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2 border-t border-slate-800/70">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search tracking number, truck reg, driver, corridor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-44 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none font-mono"
            >
              <option value="ALL">All Active Statuses</option>
              <option value="IN_TRANSIT">IN TRANSIT</option>
              <option value="ASSIGNED">ASSIGNED</option>
              <option value="LOADING">LOADING</option>
              <option value="AT_CHECKPOINT">AT CHECKPOINT</option>
              <option value="ARRIVED">ARRIVED</option>
            </select>
          </div>
        </div>
      </div>

      {/* INTERACTIVE MAP CONTAINER OR SPECIFIED FALLBACK */}
      <div className="relative rounded-3xl overflow-hidden border border-slate-800 bg-[#0A1024] shadow-2xl min-h-[500px]">
        {/* If Google Maps is unavailable, show required exact message banner */}
        {mapError && (
          <div className="p-4 bg-amber-950/40 border-b border-amber-500/30 flex items-center justify-between gap-3 text-xs text-amber-200">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="font-medium">
                Live tracking map unavailable. Location and status updates remain operational.
              </span>
            </div>
            <span className="text-[10px] font-mono text-amber-400/80 uppercase">Offline Mode</span>
          </div>
        )}

        {/* The Native Google Map DOM element */}
        {!mapError && (
          <div
            ref={mapContainerRef}
            className="w-full h-[520px] bg-[#0A1024]"
            style={{ minHeight: '520px' }}
          />
        )}

        {/* Clean Operational Grid when map is unavailable or in addition to map */}
        {mapError && (
          <div className="p-6 space-y-4">
            <div className="text-xs font-mono uppercase text-slate-400">
              Active Regional Corridors & Fleet Positioning ({activeItems.length} Active Records)
            </div>

            {activeItems.length === 0 ? (
              <EmptyState
                title="No active shipments"
                description="There are currently no active cargo consignments requiring live GPS tracking."
                icon={<Navigation className="w-8 h-8 text-cyan-400" />}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeItems.map(({ shipment, vehicle, lat, lng, lastUpdate, address, hasGps }) => {
                  const { text: timeText, isOld } = formatLastUpdated(lastUpdate);

                  return (
                    <div
                      key={shipment.id}
                      onClick={() => {
                        setSelectedShipment(shipment);
                        setSelectedVehicle(vehicle || null);
                      }}
                      className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-cyan-500/40 cursor-pointer transition-all space-y-3 shadow-lg group"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-mono text-xs font-bold text-cyan-400 group-hover:text-cyan-300">
                            {shipment.shipmentNumber}
                          </div>
                          <div className="text-xs font-semibold text-white mt-0.5">
                            Truck: {vehicle?.registrationNumber || shipment.assignedVehicleReg || 'Unassigned'}
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-cyan-950 border border-cyan-500/40 text-cyan-300">
                          {shipment.status}
                        </span>
                      </div>

                      <div className="space-y-1.5 text-xs border-t border-slate-800/80 pt-2.5">
                        <div className="flex items-center justify-between text-slate-300">
                          <span className="text-slate-400">Driver:</span>
                          <span className="font-medium text-white">{shipment.assignedDriverName || 'Assigned Driver'}</span>
                        </div>
                        <div className="flex items-center justify-between text-slate-300">
                          <span className="text-slate-400">Destination:</span>
                          <span>{shipment.destinationCity}, {shipment.destinationCountry}</span>
                        </div>
                        <div className="flex items-center justify-between text-slate-300">
                          <span className="text-slate-400">Last update:</span>
                          <span className={isOld ? 'text-amber-400 font-mono text-[11px]' : 'text-emerald-400 font-mono text-[11px]'}>
                            {timeText}
                          </span>
                        </div>
                      </div>

                      {/* GPS Telemetry badge */}
                      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                        {hasGps ? (
                          <div className="flex items-center gap-1.5 text-cyan-300 font-mono">
                            <MapPin className="w-3 h-3 text-cyan-400" />
                            <span>{lat?.toFixed(4)}, {lng?.toFixed(4)}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Live location unavailable.</span>
                        )}
                        <span className="text-cyan-400 group-hover:translate-x-1 transition-transform flex items-center gap-0.5">
                          Inspect <ChevronRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* SHIPMENT TELEMETRY DRAWER / MODAL */}
      {selectedShipment && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0A1024] border border-cyan-500/40 rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative animate-fadeIn max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="text-[10px] font-mono uppercase text-cyan-400 font-bold">
                  TELEMETRY INSPECTION
                </span>
                <h3 className="text-lg font-bold text-white font-mono mt-0.5">
                  {selectedShipment.shipmentNumber}
                </h3>
              </div>
              <button
                onClick={() => setSelectedShipment(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Route Status: ORIGIN -> CURRENT LOCATION -> DESTINATION */}
            <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-3 text-xs">
              <div className="text-[10px] font-mono uppercase text-slate-400">Planned Corridor Routing</div>
              <div className="flex items-center justify-between text-white font-medium">
                <div className="text-center">
                  <div className="text-[10px] text-slate-400 font-mono uppercase">Origin</div>
                  <div className="font-semibold text-cyan-300">{selectedShipment.originCity}</div>
                  <div className="text-[10px] text-slate-400">{selectedShipment.originCountry}</div>
                </div>

                <ArrowRight className="w-4 h-4 text-slate-500" />

                <div className="text-center">
                  <div className="text-[10px] text-slate-400 font-mono uppercase">Current Position</div>
                  <div className="font-semibold text-amber-300">
                    {selectedShipment.currentLatitude && selectedShipment.currentLongitude
                      ? `${selectedShipment.currentLatitude.toFixed(3)}, ${selectedShipment.currentLongitude.toFixed(3)}`
                      : 'Location unavailable.'}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    {formatLastUpdated(selectedShipment.lastLocationUpdate).text}
                  </div>
                </div>

                <ArrowRight className="w-4 h-4 text-slate-500" />

                <div className="text-center">
                  <div className="text-[10px] text-slate-400 font-mono uppercase">Destination</div>
                  <div className="font-semibold text-emerald-300">{selectedShipment.destinationCity}</div>
                  <div className="text-[10px] text-slate-400">{selectedShipment.destinationCountry}</div>
                </div>
              </div>
            </div>

            {/* Telemetry Metrics */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 font-mono uppercase">Assigned Truck</span>
                <div className="text-white font-semibold mt-0.5">
                  {selectedVehicle?.registrationNumber || selectedShipment.assignedVehicleReg || 'Asset Pending'}
                </div>
                <div className="text-[11px] text-slate-400">
                  {selectedVehicle ? `${selectedVehicle.make} ${selectedVehicle.model}` : 'Heavy Prime Mover'}
                </div>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 font-mono uppercase">Commercial Driver</span>
                <div className="text-white font-semibold mt-0.5">
                  {selectedShipment.assignedDriverName || 'Driver Pending'}
                </div>
                <div className="text-[11px] text-slate-400">Authorized Corridor Operator</div>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 font-mono uppercase">Cargo Payload</span>
                <div className="text-cyan-400 font-semibold mt-0.5 font-mono">
                  {selectedShipment.weightKg?.toLocaleString()} KG
                </div>
                <div className="text-[11px] text-slate-400 truncate">{selectedShipment.cargoType}</div>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 font-mono uppercase">Estimated Arrival</span>
                <div className="text-white font-semibold mt-0.5 font-mono">
                  {selectedShipment.expectedDelivery || 'ETA unavailable.'}
                </div>
                <div className="text-[11px] text-slate-400">Calculated corridor routing</div>
              </div>
            </div>

            {/* Checkpoints or Timeline */}
            <div className="space-y-3">
              <div className="text-xs font-mono uppercase text-slate-400">Verified Transit Milestones</div>
              <div className="space-y-2 border-l-2 border-cyan-500/30 pl-3">
                {(selectedShipment.timeline || []).map((t, idx) => (
                  <div key={idx} className="relative pl-3 text-xs">
                    <div className="absolute -left-[17px] top-1.5 w-2 h-2 rounded-full bg-cyan-400" />
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white">{t.stage}</span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {new Date(t.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                    {t.location && <div className="text-[11px] text-cyan-400 font-mono">{t.location}</div>}
                    {t.notes && <div className="text-[11px] text-slate-400 mt-0.5">{t.notes}</div>}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-800">
              <button
                onClick={() => setSelectedShipment(null)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
