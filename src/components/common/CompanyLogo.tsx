import React from 'react';
import { useBranding } from '../../context/BrandingContext';
import { useAnimations } from '../../context/AnimationContext';
import { Truck } from 'lucide-react';

interface CompanyLogoProps {
  className?: string;
  size?: number; // Override size if provided
  variant?: 'full' | 'icon-only' | 'compact';
  showTagline?: boolean;
  light?: boolean;
  onClick?: () => void;
}

export const CompanyLogo: React.FC<CompanyLogoProps> = ({
  className = '',
  size,
  variant = 'full',
  showTagline = true,
  light = false,
  onClick,
}) => {
  const { logoUrl, companyName, tagline, logoSize, logoPosition, branding } = useBranding();
  const { reducedMotion } = useAnimations();

  // Effective dimensions
  const dimension = size || logoSize || 48;
  const isCenter = logoPosition === 'center';

  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
      className={`inline-flex items-center gap-3 transition-all duration-300 group select-none ${
        onClick ? 'cursor-pointer' : ''
      } ${isCenter ? 'justify-center text-center' : ''} ${className}`}
    >
      {/* Logo Graphic Container with subtle fade & scale entrance, and hover glow */}
      <div
        style={{ width: `${dimension}px`, height: `${dimension}px` }}
        className={`relative shrink-0 rounded-2xl flex items-center justify-center overflow-hidden transition-all duration-300 transform group-hover:scale-[1.02] ${
          reducedMotion ? '' : 'animate-fadeIn'
        } ${
          logoUrl
            ? 'p-0.5 bg-slate-900/40 border border-cyan-500/30 shadow-lg shadow-cyan-950/20 group-hover:border-cyan-400/60 group-hover:shadow-cyan-500/20'
            : 'bg-gradient-to-br from-blue-700 via-cyan-600 to-indigo-800 border border-cyan-400/40 shadow-xl shadow-cyan-900/30 group-hover:border-cyan-300 group-hover:shadow-cyan-400/30'
        }`}
      >
        {logoUrl ? (
          <img
            src={logoUrl}
            alt={companyName || 'Kirenga Cargo Carriers'}
            className="w-full h-full object-contain rounded-xl transition-transform duration-300"
            onError={(e) => {
              // Fallback to truck icon if image fails to render
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        ) : (
          <div className="relative flex items-center justify-center w-full h-full text-white">
            <Truck
              style={{ width: `${Math.round(dimension * 0.52)}px`, height: `${Math.round(dimension * 0.52)}px` }}
              className="text-white drop-shadow-md"
            />
            {/* Corner highlight glow */}
            <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-cyan-300 animate-pulse" />
          </div>
        )}
      </div>

      {/* Brand Typography */}
      {variant !== 'icon-only' && (
        <div className={`flex flex-col ${isCenter ? 'items-center' : 'items-start'}`}>
          <div className="flex items-center gap-1.5">
            <span
              className={`font-black tracking-tight font-['Montserrat'] leading-none transition-colors ${
                light ? 'text-white' : 'text-slate-100 group-hover:text-cyan-300'
              } ${dimension >= 56 ? 'text-2xl sm:text-3xl' : dimension >= 44 ? 'text-xl sm:text-2xl' : 'text-lg sm:text-xl'}`}
            >
              {companyName ? companyName.split(' ')[0] : 'KIRENGA'}
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-500/30 uppercase tracking-widest font-semibold">
              EXPRESS
            </span>
          </div>

          <span
            className={`font-couriers uppercase tracking-[0.25em] font-bold text-cyan-400 text-[10px] sm:text-[11px] mt-1 transition-colors ${
              light ? 'text-cyan-300' : 'text-cyan-400/90 group-hover:text-cyan-300'
            }`}
          >
            {companyName ? companyName.split(' ').slice(1).join(' ') || 'CARGO CARRIERS' : 'CARGO CARRIERS'}
          </span>

          {showTagline && variant === 'full' && tagline && (
            <span className="text-[10px] text-slate-400 font-light truncate max-w-[280px] hidden sm:block mt-0.5">
              {tagline}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
