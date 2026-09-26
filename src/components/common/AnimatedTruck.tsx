import React from 'react';
import { useAnimations } from '../../context/AnimationContext';
import { useBranding } from '../../context/BrandingContext';

interface AnimatedTruckProps {
  variant?: 'highway' | 'drive-through' | 'idle' | 'compact' | 'loader';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showRoad?: boolean;
  className?: string;
  speed?: 'slow' | 'normal' | 'fast';
  containerColor?: string;
  glow?: boolean;
}

export const AnimatedTruck: React.FC<AnimatedTruckProps> = ({
  variant = 'highway',
  size = 'md',
  showRoad = true,
  className = '',
  speed,
  containerColor,
  glow = true,
}) => {
  const { reducedMotion, truckAnimationEnabled, animationSpeed } = useAnimations();
  const { companyName } = useBranding();

  const effectiveSpeed = speed || animationSpeed || 'normal';
  const shouldAnimate = truckAnimationEnabled && !reducedMotion;

  // Scale multipliers
  const scaleMap = {
    sm: 'w-48 h-20',
    md: 'w-72 h-28',
    lg: 'w-96 h-36',
    xl: 'w-full max-w-2xl h-48',
  };

  // Wheel speed in seconds
  const wheelDuration = effectiveSpeed === 'fast' ? '0.6s' : effectiveSpeed === 'slow' ? '1.4s' : '0.9s';
  const roadDuration = effectiveSpeed === 'fast' ? '0.8s' : effectiveSpeed === 'slow' ? '2.0s' : '1.2s';
  const driveDuration = effectiveSpeed === 'fast' ? '6s' : effectiveSpeed === 'slow' ? '14s' : '9s';

  const isDriveThrough = variant === 'drive-through';
  const isLoader = variant === 'loader';

  return (
    <div
      className={`relative select-none overflow-hidden flex flex-col items-center justify-center ${scaleMap[size]} ${className}`}
    >
      <style>{`
        @keyframes kccWheelSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes kccSuspension {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-1.8px); }
        }
        @keyframes kccRoadMove {
          from { transform: translateX(0); }
          to { transform: translateX(-40px); }
        }
        @keyframes kccDriveThrough {
          0% { transform: translateX(-120%); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateX(120%); opacity: 0; }
        }
        @keyframes kccHeadlightPulse {
          0%, 100% { opacity: 0.85; }
          50% { opacity: 1; }
        }
        .animate-wheel-spin {
          transform-origin: center;
          animation: kccWheelSpin ${wheelDuration} linear infinite;
        }
        .animate-truck-bounce {
          animation: kccSuspension 1.2s ease-in-out infinite;
        }
        .animate-road-flow {
          animation: kccRoadMove ${roadDuration} linear infinite;
        }
        .animate-drive-across {
          animation: kccDriveThrough ${driveDuration} cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
      `}</style>

      {/* Truck Motion Wrapper */}
      <div
        className={`relative w-full h-full flex items-center justify-center ${
          isDriveThrough && shouldAnimate ? 'animate-drive-across' : ''
        }`}
      >
        <svg
          viewBox="0 0 460 180"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`w-full h-full drop-shadow-2xl ${
            shouldAnimate && variant !== 'idle' ? 'animate-truck-bounce' : ''
          }`}
        >
          <defs>
            {/* Xenon Headlight Beam Gradient */}
            <linearGradient id="headlightBeam" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.8" />
              <stop offset="40%" stopColor="#06B6D4" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#0284C7" stopOpacity="0" />
            </linearGradient>

            {/* Container Body Metallic Gradient */}
            <linearGradient id="containerGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={containerColor || '#0284C7'} />
              <stop offset="35%" stopColor={containerColor || '#0369A1'} />
              <stop offset="100%" stopColor="#082F49" />
            </linearGradient>

            {/* Truck Cab Gradient */}
            <linearGradient id="cabGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1E293B" />
              <stop offset="40%" stopColor="#0F172A" />
              <stop offset="100%" stopColor="#020617" />
            </linearGradient>

            {/* Chrome Fuel Tank Gradient */}
            <linearGradient id="chromeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#94A3B8" />
              <stop offset="50%" stopColor="#E2E8F0" />
              <stop offset="100%" stopColor="#475569" />
            </linearGradient>

            {/* Wheel Rim Gradient */}
            <radialGradient id="rimGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#F1F5F9" />
              <stop offset="45%" stopColor="#94A3B8" />
              <stop offset="70%" stopColor="#475569" />
              <stop offset="100%" stopColor="#1E293B" />
            </radialGradient>
          </defs>

          {/* HEADLIGHT BEAM (forward glowing projection) */}
          {glow && (
            <polygon
              points="425,118 460,95 460,150 425,130"
              fill="url(#headlightBeam)"
              style={{
                animation: shouldAnimate ? 'kccHeadlightPulse 2s ease-in-out infinite' : 'none',
              }}
            />
          )}

          {/* TRAILER CHASSIS UNDERCARRIAGE */}
          <rect x="25" y="124" width="310" height="8" rx="2" fill="#0F172A" />
          <rect x="30" y="118" width="12" height="12" fill="#334155" />
          <rect x="180" y="122" width="24" height="10" rx="3" fill="url(#chromeGrad)" />

          {/* CONTAINER CARGO BOX */}
          <g id="cargoContainer">
            {/* Main Container Shell */}
            <rect
              x="20"
              y="38"
              width="280"
              height="88"
              rx="4"
              fill="url(#containerGrad)"
              stroke="#38BDF8"
              strokeWidth="1.5"
              strokeOpacity="0.4"
            />

            {/* Container Corrugation Ribs */}
            {[45, 70, 95, 120, 145, 170, 195, 220, 245, 270].map((x) => (
              <g key={x}>
                <line x1={x} y1="42" x2={x} y2="122" stroke="#000000" strokeWidth="2" strokeOpacity="0.35" />
                <line x1={x + 2} y1="42" x2={x + 2} y2="122" stroke="#38BDF8" strokeWidth="1" strokeOpacity="0.25" />
              </g>
            ))}

            {/* Safety High-Vis Strip */}
            <rect x="20" y="112" width="280" height="5" fill="#EAB308" opacity="0.9" />
            {[35, 65, 95, 125, 155, 185, 215, 245, 275].map((x) => (
              <rect key={x} x={x} y="112" width="14" height="5" fill="#DC2626" opacity="0.85" />
            ))}

            {/* KIRENGA CARGO CARRIERS Container Branding Plate */}
            <rect x="75" y="60" width="170" height="36" rx="4" fill="#051329" fillOpacity="0.85" stroke="#38BDF8" strokeWidth="1" strokeOpacity="0.6" />
            <text
              x="160"
              y="77"
              textAnchor="middle"
              fill="#F8FAFC"
              fontSize="12"
              fontWeight="900"
              fontFamily="sans-serif"
              letterSpacing="2.5"
            >
              {companyName ? companyName.split(' ')[0] : 'KIRENGA'}
            </text>
            <text
              x="160"
              y="88"
              textAnchor="middle"
              fill="#38BDF8"
              fontSize="6"
              fontWeight="700"
              fontFamily="sans-serif"
              letterSpacing="1.8"
            >
              CARGO CARRIERS • EXPRESS
            </text>
            <circle cx="85" cy="78" r="3" fill="#38BDF8" />
            <circle cx="235" cy="78" r="3" fill="#EAB308" />

            {/* Container Corner Casings */}
            <rect x="20" y="38" width="8" height="88" fill="#0369A1" />
            <rect x="292" y="38" width="8" height="88" fill="#0369A1" />
          </g>

          {/* FIFTH WHEEL COUPLING */}
          <rect x="295" y="120" width="20" height="6" fill="#475569" />

          {/* CABIN / TRACTOR HEAD */}
          <g id="tractorCab">
            {/* Aerodynamic Sleeper Roof Fairing */}
            <path
              d="M308 126 L308 52 C308 45 315 40 325 38 L368 38 C382 38 405 52 414 74 L426 102 C428 107 430 115 430 126 Z"
              fill="url(#cabGrad)"
              stroke="#06B6D4"
              strokeWidth="1.2"
              strokeOpacity="0.4"
            />

            {/* Cabin Windshield Glass */}
            <path
              d="M362 44 L396 44 C406 44 414 54 418 68 L422 88 L360 88 Z"
              fill="#0284C7"
              fillOpacity="0.35"
              stroke="#38BDF8"
              strokeWidth="1"
            />
            {/* Sun Visor */}
            <path d="M358 42 L412 42 L418 47 L358 47 Z" fill="#0F172A" />

            {/* Side Window */}
            <path
              d="M325 54 L352 54 L352 86 L320 86 Z"
              fill="#0369A1"
              fillOpacity="0.3"
              stroke="#38BDF8"
              strokeWidth="0.8"
            />

            {/* Door Outline & Handle */}
            <rect x="316" y="52" width="42" height="64" rx="2" stroke="#334155" strokeWidth="1" fill="none" />
            <rect x="320" y="92" width="8" height="3" rx="1" fill="#94A3B8" />

            {/* Aerodynamic Side Air Deflector */}
            <line x1="305" y1="44" x2="305" y2="124" stroke="#0EA5E9" strokeWidth="2" strokeOpacity="0.6" />

            {/* Heavy Front Bumper & Radiator Grille */}
            <rect x="424" y="98" width="10" height="30" rx="3" fill="#0F172A" stroke="#475569" strokeWidth="1" />
            <line x1="427" y1="104" x2="432" y2="104" stroke="#94A3B8" strokeWidth="1.5" />
            <line x1="427" y1="110" x2="432" y2="110" stroke="#94A3B8" strokeWidth="1.5" />
            <line x1="427" y1="116" x2="432" y2="116" stroke="#94A3B8" strokeWidth="1.5" />

            {/* Front Xenon Headlight Bulb */}
            <rect x="426" y="118" width="6" height="8" rx="2" fill="#E0F2FE" />
            <circle cx="429" cy="122" r="2.5" fill="#38BDF8" />

            {/* Fuel Tank (Polished Chrome) */}
            <rect x="325" y="122" width="44" height="14" rx="4" fill="url(#chromeGrad)" stroke="#1E293B" strokeWidth="1" />
            <rect x="332" y="124" width="4" height="10" fill="#334155" />
            <rect x="357" y="124" width="4" height="10" fill="#334155" />
          </g>

          {/* WHEEL ASSEMBLIES (Trailer & Steer/Drive Axles) */}
          {/* Wheel 1 (Trailer Rear 1) */}
          <g transform="translate(56, 134)">
            <circle cx="0" cy="0" r="19" fill="#020617" stroke="#1E293B" strokeWidth="2" />
            <circle cx="0" cy="0" r="14" fill="#334155" />
            <g className={shouldAnimate ? 'animate-wheel-spin' : ''}>
              <circle cx="0" cy="0" r="10" fill="url(#rimGrad)" />
              <circle cx="0" cy="0" r="4" fill="#0F172A" />
              {[0, 60, 120, 180, 240, 300].map((deg) => (
                <line
                  key={deg}
                  x1="0"
                  y1="0"
                  x2={7 * Math.cos((deg * Math.PI) / 180)}
                  y2={7 * Math.sin((deg * Math.PI) / 180)}
                  stroke="#F8FAFC"
                  strokeWidth="1.5"
                />
              ))}
            </g>
          </g>

          {/* Wheel 2 (Trailer Rear 2) */}
          <g transform="translate(98, 134)">
            <circle cx="0" cy="0" r="19" fill="#020617" stroke="#1E293B" strokeWidth="2" />
            <circle cx="0" cy="0" r="14" fill="#334155" />
            <g className={shouldAnimate ? 'animate-wheel-spin' : ''}>
              <circle cx="0" cy="0" r="10" fill="url(#rimGrad)" />
              <circle cx="0" cy="0" r="4" fill="#0F172A" />
              {[0, 60, 120, 180, 240, 300].map((deg) => (
                <line
                  key={deg}
                  x1="0"
                  y1="0"
                  x2={7 * Math.cos((deg * Math.PI) / 180)}
                  y2={7 * Math.sin((deg * Math.PI) / 180)}
                  stroke="#F8FAFC"
                  strokeWidth="1.5"
                />
              ))}
            </g>
          </g>

          {/* Wheel 3 (Trailer Rear 3 / Triple Axle) */}
          <g transform="translate(140, 134)">
            <circle cx="0" cy="0" r="19" fill="#020617" stroke="#1E293B" strokeWidth="2" />
            <circle cx="0" cy="0" r="14" fill="#334155" />
            <g className={shouldAnimate ? 'animate-wheel-spin' : ''}>
              <circle cx="0" cy="0" r="10" fill="url(#rimGrad)" />
              <circle cx="0" cy="0" r="4" fill="#0F172A" />
              {[0, 60, 120, 180, 240, 300].map((deg) => (
                <line
                  key={deg}
                  x1="0"
                  y1="0"
                  x2={7 * Math.cos((deg * Math.PI) / 180)}
                  y2={7 * Math.sin((deg * Math.PI) / 180)}
                  stroke="#F8FAFC"
                  strokeWidth="1.5"
                />
              ))}
            </g>
          </g>

          {/* Wheel 4 (Tractor Drive Axle) */}
          <g transform="translate(330, 134)">
            <circle cx="0" cy="0" r="19" fill="#020617" stroke="#1E293B" strokeWidth="2" />
            <circle cx="0" cy="0" r="14" fill="#334155" />
            <g className={shouldAnimate ? 'animate-wheel-spin' : ''}>
              <circle cx="0" cy="0" r="10" fill="url(#rimGrad)" />
              <circle cx="0" cy="0" r="4" fill="#0F172A" />
              {[0, 60, 120, 180, 240, 300].map((deg) => (
                <line
                  key={deg}
                  x1="0"
                  y1="0"
                  x2={7 * Math.cos((deg * Math.PI) / 180)}
                  y2={7 * Math.sin((deg * Math.PI) / 180)}
                  stroke="#F8FAFC"
                  strokeWidth="1.5"
                />
              ))}
            </g>
          </g>

          {/* Wheel 5 (Tractor Steer Front Axle) */}
          <g transform="translate(400, 134)">
            <circle cx="0" cy="0" r="19" fill="#020617" stroke="#1E293B" strokeWidth="2" />
            <circle cx="0" cy="0" r="14" fill="#334155" />
            <g className={shouldAnimate ? 'animate-wheel-spin' : ''}>
              <circle cx="0" cy="0" r="10" fill="url(#rimGrad)" />
              <circle cx="0" cy="0" r="4" fill="#0F172A" />
              {[0, 60, 120, 180, 240, 300].map((deg) => (
                <line
                  key={deg}
                  x1="0"
                  y1="0"
                  x2={7 * Math.cos((deg * Math.PI) / 180)}
                  y2={7 * Math.sin((deg * Math.PI) / 180)}
                  stroke="#F8FAFC"
                  strokeWidth="1.5"
                />
              ))}
            </g>
          </g>
        </svg>
      </div>

      {/* ROAD SURFACE WITH MOVING DASHES */}
      {showRoad && (
        <div className="w-full relative h-3 mt-0.5 overflow-hidden flex flex-col justify-center">
          {/* Main Highway Line */}
          <div className="w-full h-0.5 bg-slate-700/80" />
          {/* Moving Lane Dashes */}
          <div
            className={`w-[200%] flex items-center justify-around h-1 ${
              shouldAnimate && variant !== 'idle' ? 'animate-road-flow' : ''
            }`}
          >
            {Array.from({ length: 16 }).map((_, i) => (
              <span key={i} className="inline-block w-6 h-0.5 bg-cyan-400/80 rounded-full shrink-0" />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
