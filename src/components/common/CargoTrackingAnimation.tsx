import React from 'react';
import { Shipment, ShipmentTimelineEvent } from '../../types';
import { useAnimations } from '../../context/AnimationContext';
import { MapPin, CheckCircle2, Clock, Truck, ShieldCheck, ArrowRight } from 'lucide-react';

interface CheckpointItem {
  id: string;
  name: string;
  location: string;
  status: 'completed' | 'active' | 'pending';
  timestamp?: string;
  notes?: string;
}

interface CargoTrackingAnimationProps {
  shipment?: Shipment | null;
  customCheckpoints?: CheckpointItem[];
  className?: string;
  interactive?: boolean;
}

export const CargoTrackingAnimation: React.FC<CargoTrackingAnimationProps> = ({
  shipment,
  customCheckpoints,
  className = '',
  interactive = true,
}) => {
  const { routeAnimationEnabled, reducedMotion } = useAnimations();

  // Compute real checkpoints from real shipment if provided
  const checkpoints: CheckpointItem[] = React.useMemo(() => {
    if (customCheckpoints && customCheckpoints.length > 0) {
      return customCheckpoints;
    }

    if (shipment) {
      const origin = `${shipment.originCity || 'Origin'}, ${shipment.originCountry || 'EA'}`;
      const destination = `${shipment.destinationCity || 'Destination'}, ${shipment.destinationCountry || 'EA'}`;

      // If shipment has custom timeline events, map them
      if (shipment.timeline && shipment.timeline.length > 0) {
        return shipment.timeline.map((evt, idx) => {
          const isLastCompleted = evt.completed && (idx === shipment.timeline.length - 1 || !shipment.timeline[idx + 1]?.completed);
          return {
            id: `chk_${idx}`,
            name: evt.stage,
            location: idx === 0 ? origin : idx === shipment.timeline.length - 1 ? destination : 'Transit Corridor',
            status: evt.completed ? (isLastCompleted && shipment.status !== 'DELIVERED' ? 'active' : 'completed') : 'pending',
            timestamp: evt.timestamp,
            notes: evt.notes,
          };
        });
      }

      // Default realistic milestones based on actual shipment status
      const status = (shipment.status || 'BOOKED').toUpperCase();
      const isDelivered = status === 'DELIVERED';
      const isTransit = status === 'IN_TRANSIT' || status === 'DEPARTED';
      const isArrived = status === 'ARRIVED';
      const isPickup = status === 'PICKUP' || status === 'CONFIRMED' || status === 'BOOKED';

      return [
        {
          id: 'origin',
          name: 'Consignment Dispatched',
          location: origin,
          status: 'completed',
          timestamp: shipment.pickupDate || shipment.createdAt,
          notes: 'Cargo verified and cleared for transit departure.',
        },
        {
          id: 'corridor',
          name: 'Express Corridor Transit',
          location: 'Northern / Central Corridor',
          status: isDelivered || isArrived ? 'completed' : isTransit ? 'active' : 'pending',
          notes: 'Active telemetry and border clearance monitoring.',
        },
        {
          id: 'customs',
          name: 'Border Inspection Checkpoint',
          location: 'Cross-Border Clearing Hub',
          status: isDelivered ? 'completed' : isArrived ? 'active' : 'pending',
          notes: 'Single-window electronic seal verification.',
        },
        {
          id: 'destination',
          name: 'Final Delivery Hub',
          location: destination,
          status: isDelivered ? 'completed' : 'pending',
          timestamp: shipment.actualDelivery || shipment.expectedDelivery,
          notes: 'Proof of Delivery verification and client handover.',
        },
      ];
    }

    // Default East Africa corridor representation when testing
    return [
      {
        id: '1',
        name: 'Mombasa Port Cargo Terminal',
        location: 'Kenya',
        status: 'completed',
        notes: 'Container loaded & electronic tracking seal activated.',
      },
      {
        id: '2',
        name: 'Nairobi Inland Depot',
        location: 'Kenya',
        status: 'completed',
        notes: 'Corridor inspection passed; driver handoff verified.',
      },
      {
        id: '3',
        name: 'Malaba OSBP Border Crossing',
        location: 'Kenya / Uganda',
        status: 'active',
        notes: 'Undergoing expedited customs seal verification.',
      },
      {
        id: '4',
        name: 'Kampala Logistics Hub',
        location: 'Uganda',
        status: 'pending',
        notes: 'Scheduled destination arrival.',
      },
    ];
  }, [shipment, customCheckpoints]);

  // Calculate overall progress percentage
  const progressPercent = React.useMemo(() => {
    if (checkpoints.length <= 1) return 100;
    const completedCount = checkpoints.filter((c) => c.status === 'completed').length;
    const activeCount = checkpoints.filter((c) => c.status === 'active').length;
    if (completedCount === checkpoints.length) return 100;
    const raw = ((completedCount + (activeCount ? 0.5 : 0)) / (checkpoints.length - 1)) * 100;
    return Math.min(100, Math.max(8, raw));
  }, [checkpoints]);

  const shouldAnimate = routeAnimationEnabled && !reducedMotion;

  return (
    <div className={`w-full bg-[#070D1E]/90 border border-slate-800/80 rounded-2xl p-5 md:p-7 shadow-2xl relative overflow-hidden ${className}`}>
      {/* Subtle top indicator bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
            <Truck className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 font-bold">
              Corridor Telemetry Route
            </div>
            <div className="text-sm font-bold text-white font-['Poppins']">
              {checkpoints[0]?.location || 'Origin'} <span className="text-cyan-400">➔</span>{' '}
              {checkpoints[checkpoints.length - 1]?.location || 'Destination'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3 py-1 rounded-full bg-slate-900 border border-slate-700/80 text-xs font-mono flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                progressPercent >= 100
                  ? 'bg-emerald-400'
                  : 'bg-cyan-400 animate-ping'
              }`}
            />
            <span className="text-slate-300 font-bold">
              {progressPercent >= 100 ? 'DELIVERED (100%)' : `IN TRANSIT (${Math.round(progressPercent)}%)`}
            </span>
          </div>
        </div>
      </div>

      {/* SVG ROUTE LINE VISUALIZER (Desktop & Tablet) */}
      <div className="hidden sm:block relative mb-8 px-4">
        {/* Route Line Track */}
        <div className="relative h-2 bg-slate-800 rounded-full overflow-hidden">
          {/* Active Completed Gradient Fill */}
          <div
            style={{ width: `${progressPercent}%` }}
            className={`h-full bg-gradient-to-r from-blue-600 via-cyan-500 to-emerald-400 rounded-full transition-all duration-1000 ${
              shouldAnimate ? 'relative' : ''
            }`}
          >
            {shouldAnimate && (
              <span className="absolute inset-0 bg-white/30 animate-pulse" />
            )}
          </div>
        </div>

        {/* Dynamic Truck Icon Moving Along Route Line */}
        <div
          style={{ left: `calc(${progressPercent}% - 18px)` }}
          className="absolute -top-3.5 transition-all duration-1000 z-10"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white flex items-center justify-center shadow-lg shadow-cyan-500/50 border border-cyan-300">
            <Truck className="w-4 h-4 animate-bounce" />
          </div>
        </div>

        {/* Checkpoint Nodes along the line */}
        <div className="flex justify-between items-center relative -top-3 px-1 pointer-events-none">
          {checkpoints.map((cp, idx) => {
            const isCompleted = cp.status === 'completed';
            const isActive = cp.status === 'active';
            return (
              <div key={cp.id} className="flex flex-col items-center">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all ${
                    isCompleted
                      ? 'bg-emerald-950 border-emerald-400 text-emerald-300 shadow-md shadow-emerald-500/30'
                      : isActive
                      ? 'bg-cyan-950 border-cyan-400 text-cyan-200 ring-4 ring-cyan-500/30 shadow-lg shadow-cyan-500/50'
                      : 'bg-slate-900 border-slate-700 text-slate-500'
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  ) : isActive ? (
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-slate-600" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* CHECKPOINT DETAILS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        {checkpoints.map((cp, idx) => {
          const isCompleted = cp.status === 'completed';
          const isActive = cp.status === 'active';
          return (
            <div
              key={cp.id}
              className={`p-3.5 rounded-xl border transition-all ${
                isActive
                  ? 'bg-cyan-950/40 border-cyan-500/60 shadow-lg shadow-cyan-950/40 ring-1 ring-cyan-400/30'
                  : isCompleted
                  ? 'bg-slate-900/60 border-emerald-500/30'
                  : 'bg-slate-950/40 border-slate-800/80 opacity-75'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-mono text-slate-400">
                  STOP {idx + 1}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    isCompleted
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : isActive
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 animate-pulse'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {cp.status}
                </span>
              </div>

              <div className="font-bold text-white text-xs sm:text-sm font-['Poppins'] line-clamp-1">
                {cp.name}
              </div>

              <div className="flex items-center gap-1.5 text-cyan-400 text-[11px] font-medium mt-0.5">
                <MapPin className="w-3 h-3 shrink-0" />
                <span className="truncate">{cp.location}</span>
              </div>

              {cp.timestamp && (
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-1 font-mono">
                  <Clock className="w-3 h-3 shrink-0" />
                  <span>{new Date(cp.timestamp).toLocaleString()}</span>
                </div>
              )}

              {cp.notes && (
                <p className="text-[10px] text-slate-400 mt-1.5 leading-relaxed line-clamp-2 italic">
                  "{cp.notes}"
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
