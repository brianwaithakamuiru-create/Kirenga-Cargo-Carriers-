import React from 'react';
import { useAnimations } from '../../context/AnimationContext';
import { Check, Clock, AlertTriangle, XCircle, Navigation, Shield, Compass } from 'lucide-react';

export type CargoStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'BOOKED'
  | 'CONFIRMED'
  | 'IN_TRANSIT'
  | 'AT_CHECKPOINT'
  | 'BORDER_CROSSING'
  | 'DELAYED'
  | 'DELIVERED'
  | 'CANCELLED'
  | string;

interface StatusBadgeProps {
  status: CargoStatus;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
  showIcon = true,
  className = '',
}) => {
  const { reducedMotion } = useAnimations();
  const normalized = (status || '').toUpperCase().replace(/[\s-]/g, '_');

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3.5 py-1.5 text-sm',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  };

  switch (normalized) {
    case 'IN_TRANSIT':
    case 'ON_TRIP':
    case 'DEPARTED':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-bold font-mono rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-400/30 ${sizeClasses[size]} ${className}`}
        >
          {showIcon && (
            <span className="relative flex h-2 w-2">
              {!reducedMotion && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
              )}
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400" />
            </span>
          )}
          <span>IN TRANSIT</span>
        </span>
      );

    case 'DELIVERED':
    case 'COMPLETED':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-bold font-mono rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-400/30 ${sizeClasses[size]} ${className}`}
        >
          {showIcon && <Check className={`${iconSizes[size]} text-emerald-400`} />}
          <span>DELIVERED</span>
        </span>
      );

    case 'AT_CHECKPOINT':
    case 'BORDER_CROSSING':
    case 'CHECKPOINT':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-bold font-mono rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-400/30 ${sizeClasses[size]} ${className}`}
        >
          {showIcon && <Compass className={`${iconSizes[size]} text-indigo-400 animate-spin`} style={{ animationDuration: '6s' }} />}
          <span>AT CHECKPOINT</span>
        </span>
      );

    case 'PROCESSING':
    case 'CONFIRMED':
    case 'LOADING':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-bold font-mono rounded-full bg-blue-500/15 text-blue-300 border border-blue-400/30 ${sizeClasses[size]} ${className}`}
        >
          {showIcon && <Clock className={`${iconSizes[size]} text-blue-400 animate-pulse`} />}
          <span>PROCESSING</span>
        </span>
      );

    case 'PENDING':
    case 'BOOKED':
    case 'NEW':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-bold font-mono rounded-full bg-amber-500/15 text-amber-300 border border-amber-400/30 ${sizeClasses[size]} ${className}`}
        >
          {showIcon && <span className="w-2 h-2 rounded-full bg-amber-400" />}
          <span>PENDING</span>
        </span>
      );

    case 'DELAYED':
    case 'EXCEPTION':
    case 'DELIVERY_EXCEPTION':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-bold font-mono rounded-full bg-rose-500/15 text-rose-300 border border-rose-400/30 ${sizeClasses[size]} ${className}`}
        >
          {showIcon && <AlertTriangle className={`${iconSizes[size]} text-rose-400`} />}
          <span>DELAYED</span>
        </span>
      );

    case 'CANCELLED':
    case 'REJECTED':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-bold font-mono rounded-full bg-slate-800 text-slate-400 border border-slate-700 ${sizeClasses[size]} ${className}`}
        >
          {showIcon && <XCircle className={`${iconSizes[size]} text-slate-500`} />}
          <span>CANCELLED</span>
        </span>
      );

    default:
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-bold font-mono rounded-full bg-slate-800/80 text-slate-300 border border-slate-700 ${sizeClasses[size]} ${className}`}
        >
          <span>{status.replace(/_/g, ' ')}</span>
        </span>
      );
  }
};
