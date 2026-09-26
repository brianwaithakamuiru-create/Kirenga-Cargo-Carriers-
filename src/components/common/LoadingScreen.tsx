import React, { useEffect, useState } from 'react';
import { CompanyLogo } from './CompanyLogo';
import { AnimatedTruck } from './AnimatedTruck';
import { useAnimations } from '../../context/AnimationContext';
import { useBranding } from '../../context/BrandingContext';

interface LoadingScreenProps {
  onComplete?: () => void;
  message?: string;
  minDurationMs?: number;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  onComplete,
  message = 'Preparing your logistics experience...',
  minDurationMs = 350,
}) => {
  const { loadingAnimationEnabled, reducedMotion } = useAnimations();
  const { companyName } = useBranding();
  const [progress, setProgress] = useState(15);
  const [fadingOut, setFadingOut] = useState(false);

  useEffect(() => {
    // If loading animation is disabled by admin or reduced motion, complete quickly
    if (!loadingAnimationEnabled || reducedMotion) {
      if (onComplete) onComplete();
      return;
    }

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setFadingOut(true);
          setTimeout(() => {
            if (onComplete) onComplete();
          }, 150);
          return 100;
        }
        return prev + 18;
      });
    }, minDurationMs / 6);

    return () => clearInterval(interval);
  }, [minDurationMs, onComplete, loadingAnimationEnabled, reducedMotion]);

  if (!loadingAnimationEnabled && !onComplete) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] bg-[#360810] flex flex-col items-center justify-center p-6 transition-opacity duration-500 ${
        fadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Background ambient lighting */}
      <div className="absolute w-96 h-96 rounded-full bg-[#D4A017]/10 blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-20 w-80 h-80 rounded-full bg-[#7A5210]/10 blur-[100px] pointer-events-none" />

      <div className="relative z-10 max-w-md w-full flex flex-col items-center text-center space-y-6">
        {/* Company Logo Display */}
        <div className="transform hover:scale-105 transition-transform duration-300">
          <CompanyLogo size={56} variant="full" />
        </div>

        {/* Animated Cargo Truck Component */}
        <div className="w-full max-w-xs py-2">
          <AnimatedTruck size="md" variant="highway" showRoad={true} glow={true} />
        </div>

        {/* Dynamic Status Text */}
        <div className="space-y-1.5">
          <div className="text-xs uppercase tracking-[0.25em] font-mono font-bold text-[#E6C76A] animate-pulse">
            CENTRAL CORRIDOR TELEMETRY
          </div>
          <p className="text-sm font-medium text-[#C8B6AE] font-['Poppins']">
            {message}
          </p>
        </div>

        {/* High-Tech Glowing Progress Bar */}
        <div className="w-64 max-w-full">
          <div className="h-1.5 w-full bg-[#2A060C]/80 rounded-full overflow-hidden border border-[#D4A017]/20 p-0.5">
            <div
              style={{ width: `${progress}%` }}
              className="h-full bg-gradient-to-r from-[#B88712] via-[#D4A017] to-[#E6C76A] rounded-full transition-all duration-300 ease-out shadow-sm shadow-[#D4A017]/40"
            />
          </div>
          <div className="flex justify-between items-center text-[10px] font-mono text-[#B89F96] mt-2">
            <span>KIRENGA CARGO CARRIERS</span>
            <span>{Math.min(100, Math.round(progress))}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};
