import React from 'react';
import { LucideIcon } from 'lucide-react';

interface CommandButtonProps {
  icon: LucideIcon;
  label: string;
  description?: string;
  active?: boolean;
  onClick: () => void;
  badge?: number | string;
  badgeColor?: 'blue' | 'cyan' | 'amber' | 'emerald' | 'rose';
  variant?: 'default' | 'compact' | 'touch-large';
  className?: string;
  disabled?: boolean;
}

export const CommandButton: React.FC<CommandButtonProps> = ({
  icon: Icon,
  label,
  description,
  active = false,
  onClick,
  badge,
  badgeColor = 'cyan',
  variant = 'default',
  className = '',
  disabled = false,
}) => {
  const getBadgeStyle = () => {
    switch (badgeColor) {
      case 'amber':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-[0_0_8px_rgba(245,158,11,0.3)]';
      case 'emerald':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-[0_0_8px_rgba(16,185,129,0.3)]';
      case 'rose':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-[0_0_8px_rgba(244,63,94,0.3)]';
      case 'blue':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40 shadow-[0_0_8px_rgba(59,130,246,0.3)]';
      case 'cyan':
      default:
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-[0_0_8px_rgba(6,182,212,0.3)]';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
  };

  // Mobile / Touch friendly large variant for drivers
  if (variant === 'touch-large') {
    return (
      <button
        type="button"
        onClick={onClick}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        aria-pressed={active}
        className={`group relative w-full text-left rounded-2xl p-4 sm:p-5 transition-all duration-300 select-none outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#060B18] ${
          active
            ? 'bg-gradient-to-r from-cyan-950/70 via-blue-950/60 to-[#0A1630] border-2 border-cyan-400 shadow-[0_0_24px_rgba(6,182,212,0.35)] scale-[1.01]'
            : 'bg-[#0B132B]/75 hover:bg-[#101C3D]/85 border border-slate-700/60 hover:border-cyan-500/50 hover:shadow-[0_4px_16px_rgba(6,182,212,0.15)] active:scale-[0.98]'
        } ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'} ${className}`}
      >
        {/* Active Command Indicator Beacon */}
        {active && (
          <div className="absolute top-3 right-3 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#06B6D4]" />
          </div>
        )}

        <div className="flex items-center gap-3.5 sm:gap-4">
          <div
            className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center transition-all duration-300 shrink-0 ${
              active
                ? 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/40 ring-2 ring-cyan-300/40'
                : 'bg-slate-900/90 text-cyan-400 group-hover:text-cyan-200 group-hover:bg-slate-800 border border-slate-700/60 group-hover:border-cyan-500/40'
            }`}
          >
            <Icon className={`w-6 h-6 sm:w-7 sm:h-7 transition-transform duration-300 ${active ? 'scale-110' : 'group-hover:scale-105'}`} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span
                className={`font-mono text-sm sm:text-base font-bold tracking-wider uppercase transition-colors duration-200 truncate ${
                  active ? 'text-white' : 'text-slate-200 group-hover:text-white'
                }`}
              >
                {label}
              </span>
              {badge !== undefined && (
                <span className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded-full border ${getBadgeStyle()}`}>
                  {badge}
                </span>
              )}
            </div>
            {description && (
              <p
                className={`text-xs mt-0.5 line-clamp-1 transition-colors duration-200 ${
                  active ? 'text-cyan-200/90 font-medium' : 'text-slate-400 group-hover:text-slate-300'
                }`}
              >
                {description}
              </p>
            )}
          </div>
        </div>
      </button>
    );
  }

  // Compact variant (e.g. for tight sidebar view)
  if (variant === 'compact') {
    return (
      <button
        type="button"
        onClick={onClick}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        aria-pressed={active}
        title={description ? `${label} — ${description}` : label}
        className={`group relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 select-none outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
          active
            ? 'bg-cyan-950/60 border border-cyan-400/80 text-white shadow-[0_0_14px_rgba(6,182,212,0.25)] font-semibold'
            : 'bg-transparent hover:bg-slate-900/60 border border-transparent hover:border-slate-700/70 text-slate-300 hover:text-white'
        } ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'} ${className}`}
      >
        {active && (
          <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r bg-cyan-400 shadow-[0_0_8px_#06B6D4]" />
        )}
        <Icon className={`w-4 h-4 shrink-0 transition-transform duration-200 ${active ? 'text-cyan-400 scale-110' : 'text-slate-400 group-hover:text-cyan-300'}`} />
        <span className="font-mono text-xs tracking-wider uppercase truncate">{label}</span>
        {badge !== undefined && (
          <span className={`ml-auto px-1.5 py-0.2 text-[10px] font-mono rounded-full border ${getBadgeStyle()}`}>
            {badge}
          </span>
        )}
      </button>
    );
  }

  // Standard Premium Command Button (Glass panel, soft gradient border, hover elevation, subtle glow)
  return (
    <button
      type="button"
      onClick={onClick}
      onKeyDown={handleKeyDown}
      disabled={disabled}
      aria-pressed={active}
      className={`group relative text-left rounded-2xl p-3.5 sm:p-4 backdrop-blur-md transition-all duration-300 select-none outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#060B18] ${
        active
          ? 'bg-gradient-to-br from-[#0B1A3D]/95 via-[#081229]/95 to-[#040918]/95 border border-cyan-400/80 shadow-[0_0_20px_rgba(6,182,212,0.3)] ring-1 ring-cyan-400/30 -translate-y-0.5'
          : 'bg-[#080E24]/70 hover:bg-[#0E1738]/85 border border-slate-800/80 hover:border-cyan-500/40 hover:shadow-[0_4px_16px_rgba(6,182,212,0.12)] hover:-translate-y-0.5 active:translate-y-0'
      } ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'} ${className}`}
    >
      {/* Active Command Indicator Accent Bar */}
      {active && (
        <span className="absolute top-0 left-6 right-6 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_10px_#06B6D4]" />
      )}

      <div className="flex items-start gap-3">
        <div
          className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 ${
            active
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/60 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
              : 'bg-slate-900/90 text-slate-400 group-hover:text-cyan-300 group-hover:bg-slate-800/90 border border-slate-800 group-hover:border-cyan-500/30'
          }`}
        >
          <Icon className={`w-5 h-5 transition-transform duration-300 ${active ? 'scale-110' : 'group-hover:scale-105'}`} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-1.5">
            <span
              className={`font-mono text-xs sm:text-[13px] font-bold tracking-wider uppercase transition-colors duration-200 truncate ${
                active ? 'text-white' : 'text-slate-200 group-hover:text-white'
              }`}
            >
              {label}
            </span>
            {badge !== undefined && (
              <span className={`px-1.5 py-0.5 text-[10px] font-mono font-bold rounded-full border shrink-0 ${getBadgeStyle()}`}>
                {badge}
              </span>
            )}
          </div>
          {description && (
            <p
              className={`text-[11px] leading-snug mt-0.5 line-clamp-1 transition-colors duration-200 ${
                active ? 'text-cyan-200/90 font-medium' : 'text-slate-400 group-hover:text-slate-300'
              }`}
            >
              {description}
            </p>
          )}
        </div>
      </div>
    </button>
  );
};
