import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { BrandingSettings } from '../types';
import { db, COLLECTIONS } from '../lib/firestoreService';
import { storage } from '../lib/firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { useAuth } from './AuthContext';

interface BrandingContextType {
  branding: BrandingSettings;
  logoUrl?: string;
  faviconUrl?: string;
  logoSize: number;
  logoPosition: 'left' | 'center';
  companyName: string;
  tagline: string;
  loading: boolean;
  uploading: boolean;
  uploadLogo: (file: File, variant?: 'default' | 'light' | 'dark') => Promise<{ url: string }>;
  uploadFavicon: (file: File) => Promise<{ url: string }>;
  removeLogo: (variant?: 'default' | 'light' | 'dark') => Promise<void>;
  updateLogoConfig: (config: { size?: number; position?: 'left' | 'center'; companyName?: string; tagline?: string }) => Promise<void>;
  refreshBranding: () => Promise<void>;
}

const DEFAULT_BRANDING: BrandingSettings = {
  id: 'branding_main',
  companyName: 'KIRENGA CARGO CARRIERS',
  tagline: 'Reliable Cargo Transportation Across East Africa and Beyond',
  logoSize: 48,
  logoPosition: 'left',
  primaryColorHex: '#3B82F6',
  accentColorHex: '#06B6D4',
  supportPhone: '+256 700 000 000',
  supportEmail: 'operations@kirengacargo.com',
  emergencyHotline: '+254 700 000 000 (24/7 Operations)',
  headquartersAddress: 'Plot 42, Logistics Park, Kampala / Nairobi Express Corridor',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const BrandingContext = createContext<BrandingContextType | undefined>(undefined);

export const BrandingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [branding, setBranding] = useState<BrandingSettings>(DEFAULT_BRANDING);
  const [loading, setLoading] = useState<boolean>(true);
  const [uploading, setUploading] = useState<boolean>(false);

  // Sync favicon with document head
  const applyFavicon = (url?: string) => {
    if (!url || typeof document === 'undefined') return;
    let link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'shortcut icon';
      document.head.appendChild(link);
    }
    link.href = url;
  };

  const loadBrandingData = useCallback(async () => {
    try {
      const data = await db.getBranding();
      if (data) {
        setBranding({
          ...DEFAULT_BRANDING,
          ...data,
          logoSize: data.logoSize || 48,
          logoPosition: data.logoPosition || 'left',
        });
        if (data.faviconUrl) {
          applyFavicon(data.faviconUrl);
        }
      }
    } catch (err) {
      console.warn('Could not load branding settings, using defaults:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBrandingData();

    // Real-time synchronization listeners
    const unsubBranding = db.subscribe(COLLECTIONS.BRANDING, () => loadBrandingData());
    const unsubCompany = db.subscribe(COLLECTIONS.COMPANY_SETTINGS, () => loadBrandingData());

    return () => {
      unsubBranding();
      unsubCompany();
    };
  }, [loadBrandingData]);

  // Convert File to base64 DataURL (used as resilient fallback if storage bucket offline)
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  };

  // Upload company logo with full validation (PNG, JPG, WEBP, SVG <= 5MB)
  const uploadLogo = async (file: File, variant: 'default' | 'light' | 'dark' = 'default'): Promise<{ url: string }> => {
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      throw new Error(`Unsupported file type (${file.type}). Please upload PNG, JPG/JPEG, WEBP, or SVG.`);
    }

    const maxSize = 5 * 1024 * 1024; // 5 MB
    if (file.size > maxSize) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      throw new Error(`File is too large (${sizeMB} MB). Maximum allowed size is 5MB.`);
    }

    setUploading(true);
    let resolvedUrl: string = '';
    let storagePath: string = '';

    try {
      const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const timeStamp = Date.now();
      storagePath = `branding/${variant}_logo_${timeStamp}_${cleanFileName}`;

      try {
        const fileRef = ref(storage, storagePath);
        await uploadBytes(fileRef, file, {
          contentType: file.type,
          customMetadata: {
            uploadedBy: currentUser?.email || 'Administrator',
            variant,
            uploadedAt: new Date().toISOString(),
          },
        });
        resolvedUrl = await getDownloadURL(fileRef);
      } catch (storageError: any) {
        console.warn('Firebase Storage direct upload note:', storageError?.message || storageError);
        // Resilient fallback to persistent DataURL
        resolvedUrl = await fileToBase64(file);
      }

      const updates: Partial<BrandingSettings> = {
        updatedAt: new Date().toISOString(),
        updatedBy: currentUser?.email || 'admin',
        logoVersion: (branding.logoVersion || 1) + 1,
      };

      if (variant === 'light') {
        updates.lightLogoUrl = resolvedUrl;
      } else if (variant === 'dark') {
        updates.darkLogoUrl = resolvedUrl;
      } else {
        updates.logoUrl = resolvedUrl;
        updates.logoStoragePath = storagePath;
      }

      await db.saveBranding({
        ...branding,
        ...updates,
      });

      await loadBrandingData();
      return { url: resolvedUrl };
    } finally {
      setUploading(false);
    }
  };

  // Upload Favicon
  const uploadFavicon = async (file: File): Promise<{ url: string }> => {
    const validTypes = ['image/png', 'image/x-icon', 'image/vnd.microsoft.icon', 'image/svg+xml', 'image/webp'];
    if (!validTypes.includes(file.type) && !file.name.endsWith('.ico')) {
      throw new Error('Please upload an ICO, PNG, SVG or WEBP file for the favicon.');
    }

    if (file.size > 2 * 1024 * 1024) {
      throw new Error('Favicon size must be 2MB or smaller.');
    }

    setUploading(true);
    let resolvedUrl: string = '';
    try {
      const storagePath = `branding/favicon_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      try {
        const fileRef = ref(storage, storagePath);
        await uploadBytes(fileRef, file);
        resolvedUrl = await getDownloadURL(fileRef);
      } catch {
        resolvedUrl = await fileToBase64(file);
      }

      await db.saveBranding({
        ...branding,
        faviconUrl: resolvedUrl,
        updatedAt: new Date().toISOString(),
        updatedBy: currentUser?.email || 'admin',
      });

      applyFavicon(resolvedUrl);
      await loadBrandingData();
      return { url: resolvedUrl };
    } finally {
      setUploading(false);
    }
  };

  // Remove uploaded logo
  const removeLogo = async (variant: 'default' | 'light' | 'dark' = 'default'): Promise<void> => {
    setUploading(true);
    try {
      const updates: Partial<BrandingSettings> = {
        updatedAt: new Date().toISOString(),
        updatedBy: currentUser?.email || 'admin',
      };

      if (variant === 'light') {
        updates.lightLogoUrl = undefined;
      } else if (variant === 'dark') {
        updates.darkLogoUrl = undefined;
      } else {
        // Try deleting from storage if stored path exists
        if (branding.logoStoragePath) {
          try {
            const fileRef = ref(storage, branding.logoStoragePath);
            await deleteObject(fileRef);
          } catch (e) {
            // Ignore if already deleted
          }
        }
        updates.logoUrl = undefined;
        updates.logoStoragePath = undefined;
      }

      await db.saveBranding({
        ...branding,
        ...updates,
      });

      await loadBrandingData();
    } finally {
      setUploading(false);
    }
  };

  // Update configuration: size, position, text
  const updateLogoConfig = async (config: {
    size?: number;
    position?: 'left' | 'center';
    companyName?: string;
    tagline?: string;
  }): Promise<void> => {
    const updated: BrandingSettings = {
      ...branding,
      logoSize: config.size !== undefined ? config.size : branding.logoSize,
      logoPosition: config.position || branding.logoPosition,
      companyName: config.companyName || branding.companyName,
      tagline: config.tagline || branding.tagline,
      updatedAt: new Date().toISOString(),
      updatedBy: currentUser?.email || 'admin',
    };

    await db.saveBranding(updated);
    await loadBrandingData();
  };

  return (
    <BrandingContext.Provider
      value={{
        branding,
        logoUrl: branding.logoUrl,
        faviconUrl: branding.faviconUrl,
        logoSize: branding.logoSize || 48,
        logoPosition: branding.logoPosition || 'left',
        companyName: branding.companyName || 'KIRENGA CARGO CARRIERS',
        tagline: branding.tagline || 'Reliable Cargo Transportation Across East Africa and Beyond',
        loading,
        uploading,
        uploadLogo,
        uploadFavicon,
        removeLogo,
        updateLogoConfig,
        refreshBranding: loadBrandingData,
      }}
    >
      {children}
    </BrandingContext.Provider>
  );
};

export const useBranding = () => {
  const context = useContext(BrandingContext);
  if (!context) {
    throw new Error('useBranding must be used within a BrandingProvider');
  }
  return context;
};
