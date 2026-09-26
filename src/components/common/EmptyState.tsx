import React from 'react';
import {
  PackageOpen,
  Image as ImageIcon,
  AlertTriangle,
  WifiOff,
  Navigation,
  Compass,
  FileQuestion,
  RefreshCw,
  Upload,
} from 'lucide-react';
import { AnimatedTruck } from './AnimatedTruck';

interface EmptyStateProps {
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  action?: {
    label: string;
    onClick: () => void;
  };
  icon?: React.ReactNode;
  showTruck?: boolean;
  type?: 'default' | 'no-logo' | 'upload-error' | 'file-too-large' | 'unsupported-file' | 'network-error' | 'tracking-unavailable' | 'map-unavailable';
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionText,
  onAction,
  action,
  icon,
  showTruck = false,
  type = 'default',
}) => {
  const finalActionLabel = action?.label || actionText;
  const finalOnAction = action?.onClick || onAction;

  // Derive preset styles if specified
  const getPresetIcon = () => {
    if (icon) return icon;
    switch (type) {
      case 'no-logo':
        return <ImageIcon className="w-8 h-8 text-cyan-400" />;
      case 'upload-error':
      case 'file-too-large':
      case 'unsupported-file':
        return <AlertTriangle className="w-8 h-8 text-amber-400" />;
      case 'network-error':
        return <WifiOff className="w-8 h-8 text-rose-400" />;
      case 'tracking-unavailable':
        return <Navigation className="w-8 h-8 text-cyan-400" />;
      case 'map-unavailable':
        return <Compass className="w-8 h-8 text-blue-400" />;
      default:
        return <PackageOpen className="w-8 h-8 text-cyan-400" />;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 md:p-12 text-center rounded-3xl border border-dashed border-slate-700/80 bg-[#0A1024]/60 my-4 backdrop-blur-md">
      {/* Optional Animated Truck on empty states */}
      {showTruck && (
        <div className="w-full max-w-xs mb-4">
          <AnimatedTruck variant="idle" size="sm" showRoad={true} />
        </div>
      )}

      <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-700/80 flex items-center justify-center mb-4 shadow-xl shadow-black/40">
        {getPresetIcon()}
      </div>

      <h3 className="text-lg font-bold text-white tracking-tight mb-1 font-['Poppins']">
        {title}
      </h3>
      <p className="text-xs sm:text-sm text-slate-400 max-w-md mb-6 leading-relaxed font-light">
        {description}
      </p>

      {finalActionLabel && finalOnAction && (
        <button
          type="button"
          onClick={finalOnAction}
          className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs transition-all shadow-lg shadow-cyan-600/20 active:scale-95 flex items-center gap-2"
        >
          {type === 'no-logo' && <Upload className="w-4 h-4" />}
          {type === 'network-error' && <RefreshCw className="w-4 h-4" />}
          <span>{finalActionLabel}</span>
        </button>
      )}
    </div>
  );
};

// Ready-to-use Error and Empty Presets per Section 20
export const NoLogoEmptyState: React.FC<{ onUploadClick?: () => void }> = ({ onUploadClick }) => (
  <EmptyState
    type="no-logo"
    title="No company logo has been configured yet."
    description="Your platform is currently displaying the standard vector brand badge. Upload your official corporate emblem from your device to personalize your cargo network."
    actionText="Upload Company Logo"
    onAction={onUploadClick}
  />
);

export const TrackingUnavailableState: React.FC<{ onRetry?: () => void }> = ({ onRetry }) => (
  <EmptyState
    type="tracking-unavailable"
    showTruck={true}
    title="Consignment Telemetry Unavailable"
    description="We were unable to locate an active GPS satellite ping for this waybill. Checkpoints may still be in transit or pending cellular tower handoff."
    actionText="Retry Telemetry Search"
    onAction={onRetry}
  />
);

export const MapUnavailableState: React.FC<{ onRetry?: () => void }> = ({ onRetry }) => (
  <EmptyState
    type="map-unavailable"
    title="Interactive Corridor Map Unavailable"
    description="The geospatial map engine could not load coordinates for this corridor segment. Route milestones and driver logs remain fully recorded in the timeline below."
    actionText="Reload Map Engine"
    onAction={onRetry}
  />
);
