import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AnimationSettings } from '../types';
import { db, COLLECTIONS } from '../lib/firestoreService';

interface AnimationContextType {
  settings: AnimationSettings;
  heroAnimationEnabled: boolean;
  truckAnimationEnabled: boolean;
  routeAnimationEnabled: boolean;
  scrollAnimationsEnabled: boolean;
  loadingAnimationEnabled: boolean;
  backgroundAnimationEnabled: boolean;
  animationSpeed: 'slow' | 'normal' | 'fast';
  animationIntensity: 'subtle' | 'moderate' | 'dynamic';
  reducedMotion: boolean;
  updateSettings: (newSettings: Partial<AnimationSettings>) => Promise<void>;
  resetToDefaults: () => Promise<void>;
  loading: boolean;
}

const DEFAULT_SETTINGS: AnimationSettings = {
  id: 'animations',
  heroAnimationEnabled: true,
  truckAnimationEnabled: true,
  routeAnimationEnabled: true,
  scrollAnimationsEnabled: true,
  animationSpeed: 'normal',
  animationIntensity: 'moderate',
  reducedMotionFallback: 'auto',
  loadingAnimationEnabled: true,
  backgroundAnimationEnabled: true,
  updatedAt: new Date().toISOString(),
};

const AnimationContext = createContext<AnimationContextType | undefined>(undefined);

export const AnimationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AnimationSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [systemReducedMotion, setSystemReducedMotion] = useState(false);

  // Detect system prefers-reduced-motion
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setSystemReducedMotion(mediaQuery.matches);

    const listener = (e: MediaQueryListEvent) => {
      setSystemReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, []);

  const loadSettings = useCallback(async () => {
    try {
      const data = await db.getAnimationSettings();
      if (data) {
        setSettings({ ...DEFAULT_SETTINGS, ...data });
      }
    } catch (e) {
      console.warn('Could not load animation settings:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
    const unsub = db.subscribe(COLLECTIONS.ANIMATION_SETTINGS, () => loadSettings());
    return () => unsub();
  }, [loadSettings]);

  // Determine effective reduced motion based on admin config & system setting
  const effectiveReducedMotion =
    settings.reducedMotionFallback === 'force_reduced'
      ? true
      : settings.reducedMotionFallback === 'force_animated'
      ? false
      : systemReducedMotion;

  // Apply HTML attributes for CSS hooks
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    root.setAttribute('data-animation-speed', settings.animationSpeed || 'normal');
    root.setAttribute('data-animation-intensity', settings.animationIntensity || 'moderate');
    root.setAttribute('data-reduced-motion', effectiveReducedMotion ? 'true' : 'false');
  }, [settings, effectiveReducedMotion]);

  const updateSettings = async (newSettings: Partial<AnimationSettings>) => {
    const updated = await db.saveAnimationSettings(newSettings);
    setSettings(updated);
  };

  const resetToDefaults = async () => {
    const updated = await db.saveAnimationSettings(DEFAULT_SETTINGS);
    setSettings(updated);
  };

  return (
    <AnimationContext.Provider
      value={{
        settings,
        heroAnimationEnabled: !effectiveReducedMotion && settings.heroAnimationEnabled,
        truckAnimationEnabled: !effectiveReducedMotion && settings.truckAnimationEnabled,
        routeAnimationEnabled: !effectiveReducedMotion && settings.routeAnimationEnabled,
        scrollAnimationsEnabled: !effectiveReducedMotion && settings.scrollAnimationsEnabled,
        loadingAnimationEnabled: !effectiveReducedMotion && settings.loadingAnimationEnabled,
        backgroundAnimationEnabled: !effectiveReducedMotion && settings.backgroundAnimationEnabled,
        animationSpeed: settings.animationSpeed,
        animationIntensity: settings.animationIntensity,
        reducedMotion: effectiveReducedMotion,
        updateSettings,
        resetToDefaults,
        loading,
      }}
    >
      {children}
    </AnimationContext.Provider>
  );
};

export const useAnimations = () => {
  const context = useContext(AnimationContext);
  if (!context) {
    throw new Error('useAnimations must be used within an AnimationProvider');
  }
  return context;
};
