import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  WorkplaceThemeConfig,
  WorkplaceAppearanceSettings,
  WorkplaceThemePreset,
  StaffCommandKey,
  DriverCommandKey,
  AdminCommandKey,
  UserCommandPermissions,
} from '../types';
import { db, COLLECTIONS } from '../lib/firestoreService';
import { useAuth } from './AuthContext';

export const THEME_PRESETS: Record<WorkplaceThemePreset, WorkplaceThemeConfig> = {
  'default-kirenga': {
    themePreset: 'default-kirenga',
    primaryColorHex: '#3B82F6',
    secondaryColorHex: '#1D4ED8',
    accentColorHex: '#06B6D4',
    textColorHex: '#F8FAFC',
    backgroundType: 'animated-logistics',
    backgroundOverlay: 'navy-dark',
    buttonGlow: 'subtle',
    cardTransparency: 0.85,
    borderBrightness: 'medium',
    animationIntensity: 'moderate',
    animationSpeed: 'normal',
    watermarkEnabled: true,
    watermarkOpacity: 0.08,
    watermarkSize: 'medium',
    watermarkPosition: 'center',
    watermarkBlur: 0,
  },
  'midnight-command': {
    themePreset: 'midnight-command',
    primaryColorHex: '#8B5CF6',
    secondaryColorHex: '#6D28D9',
    accentColorHex: '#00F0FF',
    textColorHex: '#F8FAFC',
    backgroundType: 'deep-grid',
    backgroundOverlay: 'black-obsidian',
    buttonGlow: 'vibrant',
    cardTransparency: 0.9,
    borderBrightness: 'high',
    animationIntensity: 'dynamic',
    animationSpeed: 'normal',
    watermarkEnabled: true,
    watermarkOpacity: 0.1,
    watermarkSize: 'large',
    watermarkPosition: 'center',
    watermarkBlur: 2,
  },
  'blue-operations': {
    themePreset: 'blue-operations',
    primaryColorHex: '#2563EB',
    secondaryColorHex: '#1E40AF',
    accentColorHex: '#38BDF8',
    textColorHex: '#F8FAFC',
    backgroundType: 'animated-logistics',
    backgroundOverlay: 'navy-dark',
    buttonGlow: 'subtle',
    cardTransparency: 0.88,
    borderBrightness: 'medium',
    animationIntensity: 'subtle',
    animationSpeed: 'normal',
    watermarkEnabled: true,
    watermarkOpacity: 0.08,
    watermarkSize: 'medium',
    watermarkPosition: 'bottom-right',
    watermarkBlur: 0,
  },
  'cyan-logistics': {
    themePreset: 'cyan-logistics',
    primaryColorHex: '#06B6D4',
    secondaryColorHex: '#0891B2',
    accentColorHex: '#10B981',
    textColorHex: '#F8FAFC',
    backgroundType: 'mesh-gradient',
    backgroundOverlay: 'cyan-glow',
    buttonGlow: 'vibrant',
    cardTransparency: 0.82,
    borderBrightness: 'high',
    animationIntensity: 'dynamic',
    animationSpeed: 'fast',
    watermarkEnabled: true,
    watermarkOpacity: 0.12,
    watermarkSize: 'large',
    watermarkPosition: 'center',
    watermarkBlur: 0,
  },
  'executive-dark': {
    themePreset: 'executive-dark',
    primaryColorHex: '#D97706',
    secondaryColorHex: '#B45309',
    accentColorHex: '#F59E0B',
    textColorHex: '#F8FAFC',
    backgroundType: 'dark-minimal',
    backgroundOverlay: 'deep-space',
    buttonGlow: 'subtle',
    cardTransparency: 0.92,
    borderBrightness: 'subtle',
    animationIntensity: 'subtle',
    animationSpeed: 'slow',
    watermarkEnabled: true,
    watermarkOpacity: 0.06,
    watermarkSize: 'small',
    watermarkPosition: 'top-right',
    watermarkBlur: 1,
  },
  'custom': {
    themePreset: 'custom',
    primaryColorHex: '#3B82F6',
    secondaryColorHex: '#1D4ED8',
    accentColorHex: '#06B6D4',
    textColorHex: '#F8FAFC',
    backgroundType: 'animated-logistics',
    backgroundOverlay: 'navy-dark',
    buttonGlow: 'subtle',
    cardTransparency: 0.85,
    borderBrightness: 'medium',
    animationIntensity: 'moderate',
    animationSpeed: 'normal',
    watermarkEnabled: true,
    watermarkOpacity: 0.08,
    watermarkSize: 'medium',
    watermarkPosition: 'center',
    watermarkBlur: 0,
  },
};

export const DEFAULT_WORKPLACE_SETTINGS: WorkplaceAppearanceSettings = {
  id: 'workplace_appearance',
  globalTheme: THEME_PRESETS['default-kirenga'],
  adminTheme: THEME_PRESETS['default-kirenga'],
  staffTheme: THEME_PRESETS['blue-operations'],
  driverTheme: THEME_PRESETS['cyan-logistics'],
  allowIndividualThemes: true,
  updatedAt: new Date().toISOString(),
};

export const ALL_STAFF_COMMANDS: { key: StaffCommandKey; label: string; desc: string }[] = [
  { key: 'my-work', label: 'MY WORK', desc: 'Current assigned queue & daily status' },
  { key: 'assigned-tasks', label: 'ASSIGNED TASKS', desc: 'Action items and priority requests' },
  { key: 'cargo-operations', label: 'CARGO OPERATIONS', desc: 'Freight manifest and waypoint clearance' },
  { key: 'client-requests', label: 'CLIENT REQUESTS', desc: 'Customer bookings and service tickets' },
  { key: 'documents', label: 'DOCUMENTS', desc: 'Waybills, permits & customs forms' },
  { key: 'vehicles', label: 'VEHICLES', desc: 'Fleet allocation and status monitoring' },
  { key: 'shipments', label: 'SHIPMENTS', desc: 'Active corridor consignments' },
  { key: 'checkpoints', label: 'CHECKPOINTS', desc: 'Border and transit station records' },
  { key: 'messages', label: 'MESSAGES', desc: 'Internal operations communications' },
  { key: 'notifications', label: 'NOTIFICATIONS', desc: 'System alerts and dispatch pings' },
  { key: 'reports', label: 'REPORTS', desc: 'Shift summaries and audit reports' },
  { key: 'my-profile', label: 'MY PROFILE', desc: 'Personal credentials and security' },
];

export const ALL_DRIVER_COMMANDS: { key: DriverCommandKey; label: string; desc: string }[] = [
  { key: 'my-trips', label: 'MY TRIPS', desc: 'All assigned and completed journeys' },
  { key: 'active-delivery', label: 'ACTIVE DELIVERY', desc: 'Main trip focus & live telemetry' },
  { key: 'cargo-details', label: 'CARGO DETAILS', desc: 'Payload, weight, handling notes' },
  { key: 'route', label: 'ROUTE', desc: 'Transit corridor and itinerary' },
  { key: 'navigation', label: 'NAVIGATION', desc: 'Live map, turn guidance & GPS' },
  { key: 'checkpoints', label: 'CHECKPOINTS', desc: 'Log border & milestone arrivals' },
  { key: 'vehicle', label: 'VEHICLE', desc: 'Assigned truck inspection & specs' },
  { key: 'documents', label: 'DOCUMENTS', desc: 'Transit licenses and electronic waybill' },
  { key: 'delivery-confirmation', label: 'DELIVERY CONFIRMATION', desc: 'Recipient signature & photo proof' },
  { key: 'incident-report', label: 'INCIDENT REPORT', desc: 'Log road delays, breakdowns or issues' },
  { key: 'messages', label: 'MESSAGES', desc: 'Direct operations dispatcher link' },
  { key: 'notifications', label: 'NOTIFICATIONS', desc: 'Urgent corridor alerts & updates' },
  { key: 'my-profile', label: 'MY PROFILE', desc: 'Driver credentials and password' },
];

export const ALL_ADMIN_COMMANDS: { key: AdminCommandKey; label: string; desc: string }[] = [
  { key: 'overview', label: 'OVERVIEW', desc: 'Central logistics radar & real-time telemetry' },
  { key: 'live-operations', label: 'LIVE OPERATIONS', desc: 'Active corridor movements & fleet monitor' },
  { key: 'cargo-tracking', label: 'CARGO TRACKING', desc: 'Live shipment tracking & waybill lookup' },
  { key: 'routes', label: 'ROUTES', desc: 'East African transit corridors & border nodes' },
  { key: 'vehicles', label: 'VEHICLES', desc: 'Prime movers, trailers & maintenance' },
  { key: 'drivers', label: 'DRIVERS', desc: 'Commercial drivers directory & assignments' },
  { key: 'staff', label: 'STAFF', desc: 'Internal workforce accounts & roles' },
  { key: 'clients', label: 'CLIENTS', desc: 'Commercial enterprise accounts & partners' },
  { key: 'requests-quotes', label: 'REQUESTS & QUOTES', desc: 'Rate inquiries & booking confirmations' },
  { key: 'finance', label: 'FINANCE', desc: 'KES accounting, revenue, expenses & ledger' },
  { key: 'documents', label: 'DOCUMENTS', desc: 'Central regulatory & compliance vault' },
  { key: 'reports', label: 'REPORTS', desc: 'Audited analytics, KPI summaries & prints' },
  { key: 'website-control', label: 'WEBSITE CONTROL', desc: 'Public portal content, CMS & marketing' },
  { key: 'branding', label: 'BRANDING', desc: 'Centrally enforced identity & assets' },
  { key: 'map-control', label: 'MAP CONTROL', desc: 'GPS corridors, bounds & map engine settings' },
  { key: 'notifications', label: 'NOTIFICATIONS', desc: 'System-wide broadcasts & operational pings' },
  { key: 'security', label: 'SECURITY', desc: 'RBAC policies, session lockouts & audit logs' },
  { key: 'system-settings', label: 'SYSTEM SETTINGS', desc: 'Global platform configuration & timeouts' },
  { key: 'workplace-control', label: 'WORKPLACE CONTROL', desc: 'Appearance, themes, watermark & permissions' },
];

interface WorkplaceThemeContextType {
  settings: WorkplaceAppearanceSettings;
  activeWorkplaceTheme: (workplace: 'admin' | 'staff' | 'driver') => WorkplaceThemeConfig;
  updateGlobalTheme: (theme: Partial<WorkplaceThemeConfig>) => Promise<void>;
  updateWorkplaceTheme: (workplace: 'admin' | 'staff' | 'driver', theme: Partial<WorkplaceThemeConfig>) => Promise<void>;
  setAllowIndividualThemes: (allowed: boolean) => Promise<void>;
  applyPreset: (workplace: 'admin' | 'staff' | 'driver' | 'global', preset: WorkplaceThemePreset) => Promise<void>;
  resetToDefaults: () => Promise<void>;
  uploadBackgroundImage: (file: File) => Promise<string>;
  saveSettings: (settings: WorkplaceAppearanceSettings) => Promise<void>;
  // Permissions
  userPermissions: Record<string, UserCommandPermissions>;
  getUserPermissions: (userId: string) => UserCommandPermissions | undefined;
  saveUserPermissions: (permissions: UserCommandPermissions) => Promise<void>;
  isCommandAuthorized: (userId: string, role: string, command: string) => boolean;
  loading: boolean;
}

const WorkplaceThemeContext = createContext<WorkplaceThemeContextType | undefined>(undefined);

export const WorkplaceThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [settings, setSettings] = useState<WorkplaceAppearanceSettings>(DEFAULT_WORKPLACE_SETTINGS);
  const [userPermissions, setUserPermissions] = useState<Record<string, UserCommandPermissions>>({});
  const [loading, setLoading] = useState(true);

  const loadSettings = useCallback(async () => {
    try {
      const data = await db.getById<WorkplaceAppearanceSettings>(COLLECTIONS.COMPANY_SETTINGS, 'workplace_appearance');
      if (data) {
        setSettings({
          ...DEFAULT_WORKPLACE_SETTINGS,
          ...data,
          globalTheme: { ...DEFAULT_WORKPLACE_SETTINGS.globalTheme, ...data.globalTheme },
          adminTheme: { ...DEFAULT_WORKPLACE_SETTINGS.adminTheme, ...data.adminTheme },
          staffTheme: { ...DEFAULT_WORKPLACE_SETTINGS.staffTheme, ...data.staffTheme },
          driverTheme: { ...DEFAULT_WORKPLACE_SETTINGS.driverTheme, ...data.driverTheme },
        });
      }

      // Load user command permissions
      const perms = await db.getAll<UserCommandPermissions & { id: string }>('workplacePermissions');
      const permMap: Record<string, UserCommandPermissions> = {};
      perms.forEach((p) => {
        if (p.userId) permMap[p.userId] = p;
      });
      setUserPermissions(permMap);
    } catch (e) {
      console.warn('Could not load workplace appearance settings, using defaults', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
    const unsub = db.subscribe(COLLECTIONS.COMPANY_SETTINGS, loadSettings);
    const unsubPerms = db.subscribe('workplacePermissions', loadSettings);
    return () => {
      unsub();
      unsubPerms();
    };
  }, [loadSettings]);

  const activeWorkplaceTheme = useCallback(
    (workplace: 'admin' | 'staff' | 'driver'): WorkplaceThemeConfig => {
      if (!settings.allowIndividualThemes) {
        return settings.globalTheme;
      }
      if (workplace === 'admin') return settings.adminTheme;
      if (workplace === 'staff') return settings.staffTheme;
      if (workplace === 'driver') return settings.driverTheme;
      return settings.globalTheme;
    },
    [settings]
  );

  const saveSettings = async (newSettings: WorkplaceAppearanceSettings) => {
    setSettings(newSettings);
    await db.set(COLLECTIONS.COMPANY_SETTINGS, 'workplace_appearance', {
      ...newSettings,
      updatedAt: new Date().toISOString(),
      updatedBy: currentUser?.email || 'admin',
    });
  };

  const updateGlobalTheme = async (theme: Partial<WorkplaceThemeConfig>) => {
    const updated: WorkplaceAppearanceSettings = {
      ...settings,
      globalTheme: { ...settings.globalTheme, ...theme },
    };
    await saveSettings(updated);
  };

  const updateWorkplaceTheme = async (
    workplace: 'admin' | 'staff' | 'driver',
    theme: Partial<WorkplaceThemeConfig>
  ) => {
    const updated: WorkplaceAppearanceSettings = {
      ...settings,
      [workplace === 'admin' ? 'adminTheme' : workplace === 'staff' ? 'staffTheme' : 'driverTheme']: {
        ...settings[workplace === 'admin' ? 'adminTheme' : workplace === 'staff' ? 'staffTheme' : 'driverTheme'],
        ...theme,
      },
    };
    await saveSettings(updated);
  };

  const setAllowIndividualThemes = async (allowed: boolean) => {
    const updated: WorkplaceAppearanceSettings = {
      ...settings,
      allowIndividualThemes: allowed,
    };
    await saveSettings(updated);
  };

  const applyPreset = async (
    workplace: 'admin' | 'staff' | 'driver' | 'global',
    preset: WorkplaceThemePreset
  ) => {
    const presetConfig = THEME_PRESETS[preset];
    if (!presetConfig) return;

    if (workplace === 'global') {
      await saveSettings({
        ...settings,
        globalTheme: presetConfig,
      });
    } else {
      await updateWorkplaceTheme(workplace, presetConfig);
    }
  };

  const resetToDefaults = async () => {
    await saveSettings(DEFAULT_WORKPLACE_SETTINGS);
  };

  const uploadBackgroundImage = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  };

  const getUserPermissions = (userId: string) => {
    return userPermissions[userId];
  };

  const saveUserPermissions = async (perm: UserCommandPermissions) => {
    setUserPermissions((prev) => ({ ...prev, [perm.userId]: perm }));
    await db.set('workplacePermissions', perm.userId, {
      ...perm,
      updatedAt: new Date().toISOString(),
      updatedBy: currentUser?.email || 'admin',
    });
  };

  const isCommandAuthorized = (userId: string, role: string, command: string): boolean => {
    if (role === 'admin' || role === 'ADMIN') return true;
    const userPerm = userPermissions[userId];
    if (!userPerm) return true; // If not explicitly restricted, defaults to all assigned tools

    if (role === 'staff' || role === 'worker' || role === 'STAFF' || role === 'WORKER') {
      if (userPerm.staffCommands && userPerm.staffCommands.length > 0) {
        return userPerm.staffCommands.includes(command as StaffCommandKey);
      }
    }

    if (role === 'driver' || role === 'DRIVER') {
      if (userPerm.driverCommands && userPerm.driverCommands.length > 0) {
        return userPerm.driverCommands.includes(command as DriverCommandKey);
      }
    }

    return true;
  };

  return (
    <WorkplaceThemeContext.Provider
      value={{
        settings,
        activeWorkplaceTheme,
        updateGlobalTheme,
        updateWorkplaceTheme,
        setAllowIndividualThemes,
        applyPreset,
        resetToDefaults,
        uploadBackgroundImage,
        saveSettings,
        userPermissions,
        getUserPermissions,
        saveUserPermissions,
        isCommandAuthorized,
        loading,
      }}
    >
      {children}
    </WorkplaceThemeContext.Provider>
  );
};

export const useWorkplaceTheme = () => {
  const context = useContext(WorkplaceThemeContext);
  if (!context) {
    throw new Error('useWorkplaceTheme must be used within a WorkplaceThemeProvider');
  }
  return context;
};
