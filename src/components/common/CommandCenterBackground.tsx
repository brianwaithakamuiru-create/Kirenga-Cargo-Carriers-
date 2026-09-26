import React from 'react';
import { useBranding } from '../../context/BrandingContext';
import { useWorkplaceTheme } from '../../context/WorkplaceThemeContext';
import { WorkplaceThemeConfig } from '../../types';

interface CommandCenterBackgroundProps {
  workplace?: 'admin' | 'staff' | 'driver';
  overrideTheme?: WorkplaceThemeConfig;
  showWatermark?: boolean;
}

export const CommandCenterBackground: React.FC<CommandCenterBackgroundProps> = ({
  workplace = 'admin',
  overrideTheme,
  showWatermark = true,
}) => {
  const { logoUrl } = useBranding();
  const { activeWorkplaceTheme } = useWorkplaceTheme();
  const theme = overrideTheme || activeWorkplaceTheme(workplace);

  const getOverlayGradient = () => {
    switch (theme.backgroundOverlay) {
      case 'black-obsidian':
        return 'radial-gradient(ellipse at 50% 0%, rgba(139, 92, 246, 0.12) 0%, rgba(3, 7, 18, 0.96) 65%, rgba(2, 6, 12, 1) 100%)';
      case 'cyan-glow':
        return 'radial-gradient(ellipse at 50% 0%, rgba(6, 182, 212, 0.15) 0%, rgba(4, 16, 32, 0.95) 60%, rgba(3, 10, 20, 1) 100%)';
      case 'deep-space':
        return 'radial-gradient(ellipse at 50% 0%, rgba(217, 119, 6, 0.1) 0%, rgba(15, 23, 42, 0.96) 65%, rgba(8, 12, 22, 1) 100%)';
      case 'navy-dark':
      default:
        return 'radial-gradient(ellipse at 50% -10%, rgba(59, 130, 246, 0.14) 0%, rgba(6, 11, 24, 0.95) 55%, rgba(3, 7, 18, 1) 100%)';
    }
  };

  const getWatermarkPositionClass = () => {
    switch (theme.watermarkPosition) {
      case 'top-right':
        return 'top-12 right-12 translate-x-0 translate-y-0';
      case 'bottom-right':
        return 'bottom-12 right-12 translate-x-0 translate-y-0';
      case 'top-left':
        return 'top-12 left-12 translate-x-0 translate-y-0';
      case 'center':
      default:
        return 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2';
    }
  };

  const getWatermarkSizeClass = () => {
    switch (theme.watermarkSize) {
      case 'small':
        return 'max-w-[260px] max-h-[160px]';
      case 'large':
        return 'max-w-[720px] max-h-[460px]';
      case 'custom':
        return 'max-w-[600px] max-h-[380px]';
      case 'medium':
      default:
        return 'max-w-[480px] max-h-[300px]';
    }
  };

  const watermarkOpacity = Math.min(Math.max(theme.watermarkOpacity || 0.08, 0.05), 0.2);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none" aria-hidden="true">
      {/* 1. Base Dark Navy / Obsidian Foundation */}
      <div
        className="absolute inset-0 bg-[#040814]"
        style={{
          background: theme.backgroundImageUrl
            ? `url(${theme.backgroundImageUrl}) center/cover no-repeat`
            : undefined,
        }}
      />

      {/* 2. Sophisticated Overlay Gradient */}
      <div
        className="absolute inset-0 transition-opacity duration-700"
        style={{ background: getOverlayGradient() }}
      />

      {/* 3. Subtle Command-Center Coordinate Grid Pattern */}
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.035] text-cyan-400 stroke-current"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id="cmd-grid" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M 60 0 L 0 0 0 60" fill="none" strokeWidth="0.8" />
            <circle cx="0" cy="0" r="1.5" fill="currentColor" />
          </pattern>
          <pattern id="cmd-subgrid" width="240" height="240" patternUnits="userSpaceOnUse">
            <rect width="240" height="240" fill="none" stroke="currentColor" strokeWidth="1.2" opacity="0.3" />
            <path d="M 120 0 L 120 240 M 0 120 L 240 120" stroke="currentColor" strokeWidth="0.5" strokeDasharray="3 3" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#cmd-grid)" />
        <rect width="100%" height="100%" fill="url(#cmd-subgrid)" />
      </svg>

      {/* 4. Moving Route Lines (Animated East African Freight Corridors) */}
      <svg
        className="absolute inset-0 w-full h-full opacity-20"
        viewBox="0 0 1440 900"
        fill="none"
        preserveAspectRatio="xMidYMid slice"
      >
        {/* Mombasa -> Nairobi -> Kampala Corridor Vector */}
        <path
          d="M 1150 720 Q 950 560 720 480 T 420 320"
          stroke="url(#route-grad-1)"
          strokeWidth="1.8"
          strokeDasharray="6 8"
          className="animate-[pulse_4s_ease-in-out_infinite]"
        />
        {/* Dar es Salaam -> Kigali -> Bujumbura Vector */}
        <path
          d="M 1080 840 Q 820 620 540 540 T 260 410"
          stroke="url(#route-grad-2)"
          strokeWidth="1.5"
          strokeDasharray="8 6"
        />
        {/* Northern Corridor to Juba / Goma Vector */}
        <path
          d="M 420 320 Q 340 220 210 160"
          stroke="url(#route-grad-3)"
          strokeWidth="1.2"
          strokeDasharray="4 6"
        />

        <defs>
          <linearGradient id="route-grad-1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.1" />
          </linearGradient>
          <linearGradient id="route-grad-2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.1" />
          </linearGradient>
          <linearGradient id="route-grad-3" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#10B981" stopOpacity="0.2" />
          </linearGradient>
        </defs>
      </svg>

      {/* 5. Glowing Corridor Transit Nodes / Floating Telemetry Particles */}
      <div className="absolute top-[22%] left-[28%] w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_12px_#06B6D4] animate-ping opacity-30" />
      <div className="absolute top-[48%] left-[52%] w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_14px_#3B82F6] animate-pulse opacity-40" />
      <div className="absolute top-[68%] right-[24%] w-2.5 h-2.5 rounded-full bg-cyan-300 shadow-[0_0_16px_#00F0FF] animate-pulse opacity-30" />
      <div className="absolute top-[35%] right-[38%] w-1.5 h-1.5 rounded-full bg-indigo-400 shadow-[0_0_8px_#6366F1] opacity-25" />

      {/* 6. Very Subtle Logistics Cargo Silhouette / Blueprint Silhouette */}
      <div className="absolute bottom-6 right-8 opacity-[0.025] flex items-end gap-3 text-cyan-200">
        <svg className="w-48 h-20" viewBox="0 0 160 60" fill="currentColor">
          <path d="M5 45 L25 45 L32 28 L50 28 L55 45 L145 45 L145 15 L55 15 L55 28 L5 28 Z M22 52 A 7 7 0 1 1 22 38 A 7 7 0 1 1 22 52 Z M120 52 A 7 7 0 1 1 120 38 A 7 7 0 1 1 120 52 Z M136 52 A 7 7 0 1 1 136 38 A 7 7 0 1 1 136 52 Z" />
        </svg>
      </div>

      {/* 7. Centrally Controlled Company Logo Watermark (Req 34, Req 44) */}
      {showWatermark && theme.watermarkEnabled && logoUrl && (
        <div
          className={`absolute ${getWatermarkPositionClass()} transition-all duration-700 pointer-events-none flex items-center justify-center`}
          style={{
            opacity: watermarkOpacity,
            filter: theme.watermarkBlur > 0 ? `blur(${theme.watermarkBlur}px)` : 'none',
          }}
        >
          <img
            src={logoUrl}
            alt=""
            className={`${getWatermarkSizeClass()} w-full h-auto object-contain brightness-125 contrast-125 filter grayscale contrast-[150%] mix-blend-screen select-none`}
            draggable={false}
          />
        </div>
      )}

      {/* 8. Vignette Edge Soft Glow */}
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_120px_rgba(3,7,18,0.85)]" />
    </div>
  );
};
