import React, { useState, useEffect } from 'react';
import {
  Globe,
  Palette,
  FileText,
  Truck,
  Save,
  RefreshCw,
  CheckCircle2,
  Plus,
  Trash2,
  Edit3,
  Eye,
  ShieldCheck,
  Target,
  Award,
  Phone,
  Mail,
  MapPin,
  Sparkles,
  AlertCircle,
  ExternalLink,
  Layers,
  X,
  Upload,
  Image,
  Sliders,
  SlidersHorizontal,
  Radio,
  RotateCcw,
  Zap,
} from 'lucide-react';
import { db, COLLECTIONS } from '../../lib/firestoreService';
import { useBranding } from '../../context/BrandingContext';
import { useAnimations } from '../../context/AnimationContext';
import { AnimatedTruck } from '../common/AnimatedTruck';
import { CargoTrackingAnimation } from '../common/CargoTrackingAnimation';
import { CompanyLogo } from '../common/CompanyLogo';
import {
  WebsiteContent,
  BrandingSettings,
  LogisticsService,
  WebsiteContentSectionKey,
  AnimationSettings,
} from '../../types';

interface WebsiteManagementProps {
  onPreviewPublicSite?: () => void;
  initialTab?: 'homepage' | 'about' | 'services' | 'branding' | 'animations';
}

export const WebsiteManagement: React.FC<WebsiteManagementProps> = ({ onPreviewPublicSite, initialTab = 'homepage' }) => {
  const [activeTab, setActiveTab] = useState<'homepage' | 'about' | 'services' | 'branding' | 'animations'>(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // --- Homepage CMS State ---
  const [heroBadge, setHeroBadge] = useState('Cross-Border Freight Network: East & Central Africa');
  const [heroTitle, setHeroTitle] = useState('KIRENGA CARGO CARRIERS');
  const [heroTagline, setHeroTagline] = useState('"Move Cargo. Move Business."');
  const [heroDescription, setHeroDescription] = useState(
    'Reliable heavy freight, container transport, and specialized cross-border logistics across Kenya, Uganda, Tanzania, Rwanda, and the Democratic Republic of Congo.'
  );
  const [heroPrimaryCtaText, setHeroPrimaryCtaText] = useState('Book Cargo');
  const [heroSecondaryCtaText, setHeroSecondaryCtaText] = useState('Request a Quote');
  const [announcementActive, setAnnouncementActive] = useState(false);
  const [announcementText, setAnnouncementText] = useState('Central corridor transit corridors open 24/7 with zero border dwell time.');
  const [metric1Value, setMetric1Value] = useState('99.8%');
  const [metric1Label, setMetric1Label] = useState('On-Time Corridor Delivery');
  const [metric2Value, setMetric2Value] = useState('15,000+');
  const [metric2Label, setMetric2Label] = useState('Transit Trips Completed');
  const [metric3Value, setMetric3Value] = useState('7');
  const [metric3Label, setMetric3Label] = useState('Transit Countries Connected');
  const [homepageLastUpdated, setHomepageLastUpdated] = useState<string | null>(null);

  // --- About Us CMS State ---
  const [aboutHeading, setAboutHeading] = useState('About Kirenga Cargo Carriers');
  const [aboutSubheading, setAboutSubheading] = useState('Company Overview');
  const [aboutStory, setAboutStory] = useState(
    'Founded with the conviction that regional trade is the backbone of East and Central African prosperity, Kirenga Cargo Carriers operates heavy transport corridors with precision dispatch, verified drivers, and transparent consignment control.'
  );
  const [aboutMission, setAboutMission] = useState(
    'To empower industrial, commercial, and agricultural enterprises across Africa with dependable, safe, and punctual freight movement across domestic and international borders.'
  );
  const [aboutVision, setAboutVision] = useState(
    'To be the definitive intermodal transport carrier of choice across the Great Lakes and Northern Corridor, recognized for integrity, driver craftsmanship, and operational excellence.'
  );
  const [aboutSafety, setAboutSafety] = useState(
    'Zero tolerance for transit negligence. Complete compliance with road safety standards, speed monitoring, cargo restraint certifications, and mandatory pre-departure checklists.'
  );
  const [aboutLastUpdated, setAboutLastUpdated] = useState<string | null>(null);

  // --- Services Catalog State ---
  const [services, setServices] = useState<LogisticsService[]>([]);
  const [editingService, setEditingService] = useState<Partial<LogisticsService> | null>(null);
  const [isNewServiceModalOpen, setIsNewServiceModalOpen] = useState(false);

  // --- Context Hooks ---
  const {
    branding: globalBranding,
    uploadLogo: contextUploadLogo,
    uploadFavicon: contextUploadFavicon,
    removeLogo: contextRemoveLogo,
    updateLogoConfig,
    refreshBranding,
  } = useBranding();

  const {
    settings: animSettings,
    updateSettings: updateAnimSettings,
    resetToDefaults: resetAnimDefaults,
  } = useAnimations();

  // --- Branding & Identity State ---
  const [brandingId, setBrandingId] = useState('branding_main');
  const [companyName, setCompanyName] = useState('KIRENGA CARGO CARRIERS');
  const [brandTagline, setBrandTagline] = useState('Reliable Cargo Transportation Across East Africa and Beyond');
  const [logoUrl, setLogoUrl] = useState('');
  const [faviconUrl, setFaviconUrl] = useState('');
  const [wallpaperUrl, setWallpaperUrl] = useState('');
  const [logoSize, setLogoSize] = useState<number>(48);
  const [logoPosition, setLogoPosition] = useState<'left' | 'center'>('left');
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoUploadError, setLogoUploadError] = useState<string | null>(null);
  const logoInputRef = React.useRef<HTMLInputElement | null>(null);
  const faviconInputRef = React.useRef<HTMLInputElement | null>(null);

  // --- Animation Settings State ---
  const [heroAnim, setHeroAnim] = useState<boolean>(true);
  const [truckAnim, setTruckAnim] = useState<boolean>(true);
  const [routeAnim, setRouteAnim] = useState<boolean>(true);
  const [scrollAnim, setScrollAnim] = useState<boolean>(true);
  const [animSpeed, setAnimSpeed] = useState<'slow' | 'normal' | 'fast'>('normal');
  const [animIntensity, setAnimIntensity] = useState<'subtle' | 'moderate' | 'dynamic'>('moderate');
  const [reducedMotionMode, setReducedMotionMode] = useState<'auto' | 'force_reduced' | 'force_animated'>('auto');
  const [loadingAnim, setLoadingAnim] = useState<boolean>(true);
  const [bgAnim, setBgAnim] = useState<boolean>(true);

  const [primaryColorHex, setPrimaryColorHex] = useState('#2563EB');
  const [accentColorHex, setAccentColorHex] = useState('#06B6D4');
  const [supportPhone, setSupportPhone] = useState('+250 788 000 123');
  const [emergencyHotline, setEmergencyHotline] = useState('+250 788 999 000 (24/7 Operations)');
  const [supportEmail, setSupportEmail] = useState('dispatch@kirengacargo.com');
  const [headquartersAddress, setHeadquartersAddress] = useState('Plot 42, Logistics Park, Free Economic Zone, Kigali, Rwanda');
  const [brandingLastUpdated, setBrandingLastUpdated] = useState<string | null>(null);

  // Sync state when global branding or animation settings update
  useEffect(() => {
    if (globalBranding) {
      if (globalBranding.companyName) setCompanyName(globalBranding.companyName);
      if (globalBranding.tagline) setBrandTagline(globalBranding.tagline);
      if (globalBranding.logoUrl) setLogoUrl(globalBranding.logoUrl);
      if (globalBranding.faviconUrl) setFaviconUrl(globalBranding.faviconUrl);
      if (globalBranding.logoSize) setLogoSize(globalBranding.logoSize);
      if (globalBranding.logoPosition) setLogoPosition(globalBranding.logoPosition);
      if (globalBranding.primaryColorHex) setPrimaryColorHex(globalBranding.primaryColorHex);
      if (globalBranding.accentColorHex) setAccentColorHex(globalBranding.accentColorHex);
      if (globalBranding.supportPhone) setSupportPhone(globalBranding.supportPhone);
      if (globalBranding.emergencyHotline) setEmergencyHotline(globalBranding.emergencyHotline);
      if (globalBranding.supportEmail) setSupportEmail(globalBranding.supportEmail);
      if (globalBranding.headquartersAddress) setHeadquartersAddress(globalBranding.headquartersAddress);
      setBrandingLastUpdated(globalBranding.updatedAt || globalBranding.createdAt);
    }
  }, [globalBranding]);

  useEffect(() => {
    if (animSettings) {
      setHeroAnim(animSettings.heroAnimationEnabled);
      setTruckAnim(animSettings.truckAnimationEnabled);
      setRouteAnim(animSettings.routeAnimationEnabled);
      setScrollAnim(animSettings.scrollAnimationsEnabled);
      setAnimSpeed(animSettings.animationSpeed || 'normal');
      setAnimIntensity(animSettings.animationIntensity || 'moderate');
      setReducedMotionMode(animSettings.reducedMotionFallback || 'auto');
      setLoadingAnim(animSettings.loadingAnimationEnabled);
      setBgAnim(animSettings.backgroundAnimationEnabled);
    }
  }, [animSettings]);

  const triggerToast = (msg: string) => {
    setSaveSuccessMsg(msg);
    setTimeout(() => setSaveSuccessMsg(null), 4000);
  };

  // Load CMS Data from Firestore
  const loadCmsData = async () => {
    setLoading(true);
    try {
      // 1. Homepage content
      const homeDoc = await db.getWebsiteContent('homepage');
      if (homeDoc && homeDoc.content) {
        const c = homeDoc.content;
        if (c.heroBadge) setHeroBadge(c.heroBadge);
        if (c.heroTitle) setHeroTitle(c.heroTitle);
        if (c.heroTagline) setHeroTagline(c.heroTagline);
        if (c.heroDescription) setHeroDescription(c.heroDescription);
        if (c.heroPrimaryCtaText) setHeroPrimaryCtaText(c.heroPrimaryCtaText);
        if (c.heroSecondaryCtaText) setHeroSecondaryCtaText(c.heroSecondaryCtaText);
        if (typeof c.announcementActive === 'boolean') setAnnouncementActive(c.announcementActive);
        if (c.announcementText) setAnnouncementText(c.announcementText);
        if (c.metric1Value) setMetric1Value(c.metric1Value);
        if (c.metric1Label) setMetric1Label(c.metric1Label);
        if (c.metric2Value) setMetric2Value(c.metric2Value);
        if (c.metric2Label) setMetric2Label(c.metric2Label);
        if (c.metric3Value) setMetric3Value(c.metric3Value);
        if (c.metric3Label) setMetric3Label(c.metric3Label);
        setHomepageLastUpdated(homeDoc.updatedAt || homeDoc.createdAt);
      }

      // 2. About content
      const aboutDoc = await db.getWebsiteContent('about');
      if (aboutDoc && aboutDoc.content) {
        const c = aboutDoc.content;
        if (c.aboutHeading) setAboutHeading(c.aboutHeading);
        if (c.aboutSubheading) setAboutSubheading(c.aboutSubheading);
        if (c.aboutStory) setAboutStory(c.aboutStory);
        if (c.aboutMission) setAboutMission(c.aboutMission);
        if (c.aboutVision) setAboutVision(c.aboutVision);
        if (c.aboutSafety) setAboutSafety(c.aboutSafety);
        setAboutLastUpdated(aboutDoc.updatedAt || aboutDoc.createdAt);
      }

      // 3. Services list
      const serviceList = await db.getServices();
      setServices(serviceList);

      // 4. Branding settings
      const brandDoc = await db.getBranding();
      if (brandDoc) {
        setBrandingId(brandDoc.id);
        if (brandDoc.companyName) setCompanyName(brandDoc.companyName);
        if (brandDoc.tagline) setBrandTagline(brandDoc.tagline);
        if (brandDoc.logoUrl) setLogoUrl(brandDoc.logoUrl);
        if (brandDoc.faviconUrl) setFaviconUrl(brandDoc.faviconUrl);
        if (brandDoc.wallpaperUrl) setWallpaperUrl(brandDoc.wallpaperUrl);
        if (brandDoc.primaryColorHex) setPrimaryColorHex(brandDoc.primaryColorHex);
        if (brandDoc.accentColorHex) setAccentColorHex(brandDoc.accentColorHex);
        if (brandDoc.supportPhone) setSupportPhone(brandDoc.supportPhone);
        if (brandDoc.emergencyHotline) setEmergencyHotline(brandDoc.emergencyHotline);
        if (brandDoc.supportEmail) setSupportEmail(brandDoc.supportEmail);
        if (brandDoc.headquartersAddress) setHeadquartersAddress(brandDoc.headquartersAddress);
        setBrandingLastUpdated(brandDoc.updatedAt || brandDoc.createdAt);
      }
    } catch (err) {
      console.error('Failed to load CMS content:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCmsData();
  }, []);

  // Save Homepage CMS
  const handleSaveHomepage = async () => {
    setSaving(true);
    try {
      const content = {
        heroBadge,
        heroTitle,
        heroTagline,
        heroDescription,
        heroPrimaryCtaText,
        heroSecondaryCtaText,
        announcementActive,
        announcementText,
        metric1Value,
        metric1Label,
        metric2Value,
        metric2Label,
        metric3Value,
        metric3Label,
      };

      await db.saveWebsiteContent(
        'homepage',
        heroTitle,
        content,
        heroTagline,
        'Official homepage content for Kirenga Cargo Carriers.'
      );

      await db.logActivity({
        action: 'Homepage CMS Updated',
        actor: 'Admin',
        role: 'ADMIN',
        relatedRecordType: 'CMS',
        details: 'Published updated homepage hero, tagline, and operational metrics.',
      });

      setHomepageLastUpdated(new Date().toISOString());
      triggerToast('Homepage content published successfully to Firestore!');
    } catch (err: any) {
      alert(err.message || 'Failed to publish homepage content');
    } finally {
      setSaving(false);
    }
  };

  // Save About Page CMS
  const handleSaveAbout = async () => {
    setSaving(true);
    try {
      const content = {
        aboutHeading,
        aboutSubheading,
        aboutStory,
        aboutMission,
        aboutVision,
        aboutSafety,
      };

      await db.saveWebsiteContent(
        'about',
        aboutHeading,
        content,
        aboutSubheading,
        'Official company profile and credentials.'
      );

      await db.logActivity({
        action: 'About Page CMS Updated',
        actor: 'Admin',
        role: 'ADMIN',
        relatedRecordType: 'CMS',
        details: 'Published updated About Us company story, mission, and safety statements.',
      });

      setAboutLastUpdated(new Date().toISOString());
      triggerToast('About Us page content published successfully to Firestore!');
    } catch (err: any) {
      alert(err.message || 'Failed to publish About content');
    } finally {
      setSaving(false);
    }
  };

  // Handle Logo Upload from device file picker
  const handleLogoFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoUploading(true);
    setLogoUploadError(null);
    try {
      const res = await contextUploadLogo(file);
      setLogoUrl(res.url);
      triggerToast('Company logo successfully uploaded and saved to storage!');
    } catch (err: any) {
      setLogoUploadError(err.message || 'Failed to upload logo image');
    } finally {
      setLogoUploading(false);
      if (logoInputRef.current) logoInputRef.current.value = '';
    }
  };

  // Handle Favicon Upload
  const handleFaviconFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoUploading(true);
    try {
      const res = await contextUploadFavicon(file);
      setFaviconUrl(res.url);
      triggerToast('Company favicon successfully updated!');
    } catch (err: any) {
      alert(err.message || 'Failed to upload favicon');
    } finally {
      setLogoUploading(false);
      if (faviconInputRef.current) faviconInputRef.current.value = '';
    }
  };

  // Remove Logo
  const handleRemoveLogo = async () => {
    if (!window.confirm('Are you sure you want to remove the custom company logo? The platform will revert to the clean vector brand badge.')) return;
    setLogoUploading(true);
    try {
      await contextRemoveLogo();
      setLogoUrl('');
      triggerToast('Company logo removed. Vector badge restored.');
    } catch (err: any) {
      alert(err.message || 'Failed to remove logo');
    } finally {
      setLogoUploading(false);
    }
  };

  // Save Branding Settings
  const handleSaveBranding = async () => {
    setSaving(true);
    try {
      await db.saveBranding({
        companyName,
        tagline: brandTagline,
        logoUrl: logoUrl.trim() || undefined,
        faviconUrl: faviconUrl.trim() || undefined,
        wallpaperUrl: wallpaperUrl.trim() || undefined,
        logoSize,
        logoPosition,
        primaryColorHex,
        accentColorHex,
        supportPhone,
        emergencyHotline,
        supportEmail,
        headquartersAddress,
      });

      await updateLogoConfig({
        size: logoSize,
        position: logoPosition,
        companyName,
        tagline: brandTagline,
      });

      await db.logActivity({
        action: 'Branding Settings Updated',
        actor: 'Admin',
        role: 'ADMIN',
        relatedRecordType: 'CMS',
        details: `Updated brand styling, logos, dimensions (${logoSize}px), and support hotline (${supportPhone}).`,
      });

      setBrandingLastUpdated(new Date().toISOString());
      triggerToast('Branding & logo configuration published successfully to Firestore!');
      await refreshBranding();
    } catch (err: any) {
      alert(err.message || 'Failed to save branding settings');
    } finally {
      setSaving(false);
    }
  };

  // Save Animation Settings
  const handleSaveAnimationSettings = async () => {
    setSaving(true);
    try {
      await updateAnimSettings({
        heroAnimationEnabled: heroAnim,
        truckAnimationEnabled: truckAnim,
        routeAnimationEnabled: routeAnim,
        scrollAnimationsEnabled: scrollAnim,
        animationSpeed: animSpeed,
        animationIntensity: animIntensity,
        reducedMotionFallback: reducedMotionMode,
        loadingAnimationEnabled: loadingAnim,
        backgroundAnimationEnabled: bgAnim,
      });

      await db.logActivity({
        action: 'Animation Settings Updated',
        actor: 'Admin',
        role: 'ADMIN',
        relatedRecordType: 'CMS',
        details: `Updated animation toggles: speed=${animSpeed}, intensity=${animIntensity}, reducedMotion=${reducedMotionMode}`,
      });

      triggerToast('Animation settings saved and applied globally across Kirenga platform!');
    } catch (err: any) {
      alert(err.message || 'Failed to save animation settings');
    } finally {
      setSaving(false);
    }
  };

  // Create or Update Service
  const handleSaveService = async (serviceData: Partial<LogisticsService>) => {
    setSaving(true);
    try {
      const now = new Date().toISOString();
      if (serviceData.id) {
        // Update
        await db.update<LogisticsService>(COLLECTIONS.SERVICES, serviceData.id, {
          title: serviceData.title,
          slug: serviceData.slug || serviceData.title?.toLowerCase().replace(/\s+/g, '-'),
          shortDescription: serviceData.shortDescription,
          fullDescription: serviceData.fullDescription,
          icon: serviceData.icon || 'Truck',
          features: serviceData.features || [],
          imageUrl: serviceData.imageUrl,
          active: serviceData.active ?? true,
          displayOrder: serviceData.displayOrder ?? 1,
          updatedAt: now,
        });
        triggerToast(`Service "${serviceData.title}" updated in Firestore.`);
      } else {
        // Create new
        const newService: LogisticsService = {
          id: `srv_${Date.now()}`,
          title: serviceData.title || 'New Logistics Service',
          slug: (serviceData.title || 'service').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          shortDescription: serviceData.shortDescription || '',
          fullDescription: serviceData.fullDescription || '',
          icon: serviceData.icon || 'Truck',
          features: serviceData.features || [],
          imageUrl: serviceData.imageUrl,
          active: serviceData.active ?? true,
          displayOrder: (services.length + 1) * 10,
          createdAt: now,
          updatedAt: now,
        };
        await db.add<LogisticsService>(COLLECTIONS.SERVICES, newService);
        triggerToast(`New service "${newService.title}" created in Firestore.`);
      }

      setEditingService(null);
      setIsNewServiceModalOpen(false);
      const updated = await db.getServices();
      setServices(updated);
    } catch (err: any) {
      alert(err.message || 'Failed to save service');
    } finally {
      setSaving(false);
    }
  };

  // Delete Service
  const handleDeleteService = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete the service "${title}"?`)) return;
    try {
      await db.delete(COLLECTIONS.SERVICES, id);
      triggerToast(`Service "${title}" deleted.`);
      const updated = await db.getServices();
      setServices(updated);
    } catch (err: any) {
      alert(err.message || 'Failed to delete service');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#0B1329] border border-slate-800 p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 font-semibold mb-1">
            <Globe className="w-4 h-4" />
            <span>CENTRAL CONTENT MANAGEMENT SYSTEM (CMS)</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-['Poppins'] text-white">
            Website Content & Branding Engine
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-2xl">
            Live edits made here are instantly committed to Firestore and directly reflected on the public website, ensuring dynamic messaging without changing source code.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {onPreviewPublicSite && (
            <button
              onClick={onPreviewPublicSite}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 border border-slate-700 transition-colors"
            >
              <Eye className="w-4 h-4 text-cyan-400" />
              <span>Preview Live Site</span>
            </button>
          )}
          <button
            onClick={loadCmsData}
            disabled={loading}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
            title="Reload from Firestore"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Success Notification Alert */}
      {saveSuccessMsg && (
        <div className="p-4 rounded-xl bg-emerald-950/90 border border-emerald-500/50 text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn shadow-lg shadow-emerald-950/40">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span className="font-medium">{saveSuccessMsg}</span>
        </div>
      )}

      {/* CMS Navigation Tabs */}
      <div className="flex gap-2 border-b border-slate-800/80 pb-2 overflow-x-auto text-xs font-semibold">
        {[
          { key: 'homepage', label: 'Homepage Content', icon: Globe, timestamp: homepageLastUpdated },
          { key: 'about', label: 'About Us & Story', icon: FileText, timestamp: aboutLastUpdated },
          { key: 'services', label: `Services Catalog (${services.length})`, icon: Truck },
          { key: 'branding', label: 'Company Logo & Branding', icon: Palette, timestamp: brandingLastUpdated },
          { key: 'animations', label: 'Animation Control', icon: Radio },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-blue-600/20 text-cyan-300 border border-blue-500/40 font-bold shadow-lg shadow-blue-600/10'
                  : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-slate-800'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
              {tab.timestamp && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 ml-1" title="Synced with Firestore" />
              )}
            </button>
          );
        })}
      </div>

      {/* --- TAB 1: HOMEPAGE CMS --- */}
      {activeTab === 'homepage' && (
        <div className="bg-[#0B1329] border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>Hero Banner & Value Proposition</span>
              </h3>
              <p className="text-slate-400 text-xs mt-0.5">
                Configure primary headline, regional corridor positioning, and call-to-actions.
              </p>
            </div>
            {homepageLastUpdated && (
              <span className="text-[11px] text-slate-500 font-mono">
                Last Published: {new Date(homepageLastUpdated).toLocaleString()}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div className="md:col-span-2">
              <label className="text-slate-300 font-semibold block mb-1.5">Top Eyebrow Badge Text</label>
              <input
                type="text"
                value={heroBadge}
                onChange={(e) => setHeroBadge(e.target.value)}
                placeholder="e.g. Cross-Border Freight Network: East & Central Africa"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-slate-300 font-semibold block mb-1.5">Main Brand Headline</label>
              <input
                type="text"
                value={heroTitle}
                onChange={(e) => setHeroTitle(e.target.value)}
                placeholder="e.g. KIRENGA CARGO CARRIERS"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 font-bold focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-slate-300 font-semibold block mb-1.5">Tagline / Motto</label>
              <input
                type="text"
                value={heroTagline}
                onChange={(e) => setHeroTagline(e.target.value)}
                placeholder='e.g. "Move Cargo. Move Business."'
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-cyan-300 font-semibold focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-slate-300 font-semibold block mb-1.5">Introduction & Regional Overview</label>
              <textarea
                rows={3}
                value={heroDescription}
                onChange={(e) => setHeroDescription(e.target.value)}
                placeholder="Describe Kirenga's heavy transport capabilities across East & Central Africa..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 focus:border-cyan-500 focus:outline-none leading-relaxed"
              />
            </div>

            <div>
              <label className="text-slate-300 font-semibold block mb-1.5">Primary CTA Button Label</label>
              <input
                type="text"
                value={heroPrimaryCtaText}
                onChange={(e) => setHeroPrimaryCtaText(e.target.value)}
                placeholder="e.g. Book Cargo"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-slate-300 font-semibold block mb-1.5">Secondary CTA Button Label</label>
              <input
                type="text"
                value={heroSecondaryCtaText}
                onChange={(e) => setHeroSecondaryCtaText(e.target.value)}
                placeholder="e.g. Request a Quote"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Operational Metrics Sub-Section */}
          <div className="border-t border-slate-800 pt-6">
            <h4 className="text-sm font-bold text-white mb-3">Live Operational Trust Indicators</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                <label className="text-slate-400 block font-medium">Metric 1 (Reliability)</label>
                <input
                  type="text"
                  value={metric1Value}
                  onChange={(e) => setMetric1Value(e.target.value)}
                  placeholder="e.g. 99.8%"
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-cyan-400 font-mono font-bold"
                />
                <input
                  type="text"
                  value={metric1Label}
                  onChange={(e) => setMetric1Label(e.target.value)}
                  placeholder="e.g. On-Time Corridor Delivery"
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-300"
                />
              </div>

              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                <label className="text-slate-400 block font-medium">Metric 2 (Experience)</label>
                <input
                  type="text"
                  value={metric2Value}
                  onChange={(e) => setMetric2Value(e.target.value)}
                  placeholder="e.g. 15,000+"
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-cyan-400 font-mono font-bold"
                />
                <input
                  type="text"
                  value={metric2Label}
                  onChange={(e) => setMetric2Label(e.target.value)}
                  placeholder="e.g. Transit Trips Completed"
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-300"
                />
              </div>

              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                <label className="text-slate-400 block font-medium">Metric 3 (Network)</label>
                <input
                  type="text"
                  value={metric3Value}
                  onChange={(e) => setMetric3Value(e.target.value)}
                  placeholder="e.g. 7"
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-cyan-400 font-mono font-bold"
                />
                <input
                  type="text"
                  value={metric3Label}
                  onChange={(e) => setMetric3Label(e.target.value)}
                  placeholder="e.g. Transit Countries Connected"
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-300"
                />
              </div>
            </div>
          </div>

          {/* Announcement Banner Toggle */}
          <div className="border-t border-slate-800 pt-6">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="text-sm font-bold text-white">Corridor Announcement Strip</h4>
                <p className="text-slate-400 text-xs">Display a top banner on the live website for border alerts or updates.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={announcementActive}
                  onChange={(e) => setAnnouncementActive(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
              </label>
            </div>
            {announcementActive && (
              <input
                type="text"
                value={announcementText}
                onChange={(e) => setAnnouncementText(e.target.value)}
                placeholder="e.g. Central corridor transit corridors open 24/7 with zero border dwell time."
                className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-amber-300 text-xs focus:border-cyan-500 focus:outline-none"
              />
            )}
          </div>

          {/* Save / Publish Action */}
          <div className="border-t border-slate-800 pt-6 flex justify-end">
            <button
              onClick={handleSaveHomepage}
              disabled={saving}
              className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-blue-600/30 active:scale-95 transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Publishing to Firestore...' : 'Save & Publish Homepage'}</span>
            </button>
          </div>
        </div>
      )}

      {/* --- TAB 2: ABOUT US CMS --- */}
      {activeTab === 'about' && (
        <div className="bg-[#0B1329] border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-cyan-400" />
                <span>Company Story, Credentials & Standards</span>
              </h3>
              <p className="text-slate-400 text-xs mt-0.5">
                Craft the narrative, strategic mission, and safety commitments shown on the About section.
              </p>
            </div>
            {aboutLastUpdated && (
              <span className="text-[11px] text-slate-500 font-mono">
                Last Published: {new Date(aboutLastUpdated).toLocaleString()}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div>
              <label className="text-slate-300 font-semibold block mb-1.5">Section Title</label>
              <input
                type="text"
                value={aboutHeading}
                onChange={(e) => setAboutHeading(e.target.value)}
                placeholder="e.g. About Kirenga Cargo Carriers"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 font-bold focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-slate-300 font-semibold block mb-1.5">Subheading / Category</label>
              <input
                type="text"
                value={aboutSubheading}
                onChange={(e) => setAboutSubheading(e.target.value)}
                placeholder="e.g. Company Overview"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-cyan-400 font-semibold focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-slate-300 font-semibold block mb-1.5">Company Story / Overview Paragraph</label>
              <textarea
                rows={4}
                value={aboutStory}
                onChange={(e) => setAboutStory(e.target.value)}
                placeholder="Enter company background and corridor leadership narrative..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 leading-relaxed focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-slate-300 font-semibold block mb-1.5 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-cyan-400" />
                <span>Our Mission Statement</span>
              </label>
              <textarea
                rows={3}
                value={aboutMission}
                onChange={(e) => setAboutMission(e.target.value)}
                placeholder="Define company mission for freight clients..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-slate-300 font-semibold block mb-1.5 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-cyan-400" />
                <span>Our Strategic Vision</span>
              </label>
              <textarea
                rows={3}
                value={aboutVision}
                onChange={(e) => setAboutVision(e.target.value)}
                placeholder="Define company long-term vision..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-slate-300 font-semibold block mb-1.5 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Safety & Transit Integrity Commitment</span>
              </label>
              <textarea
                rows={3}
                value={aboutSafety}
                onChange={(e) => setAboutSafety(e.target.value)}
                placeholder="Describe pre-trip check enforcement, telematics, and zero-negligence policies..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="border-t border-slate-800 pt-6 flex justify-end">
            <button
              onClick={handleSaveAbout}
              disabled={saving}
              className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-blue-600/30 active:scale-95 transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Publishing to Firestore...' : 'Save & Publish About Page'}</span>
            </button>
          </div>
        </div>
      )}

      {/* --- TAB 3: SERVICES CATALOG --- */}
      {activeTab === 'services' && (
        <div className="space-y-6">
          <div className="bg-[#0B1329] border border-slate-800 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Truck className="w-4 h-4 text-cyan-400" />
                <span>Logistics Services Catalog</span>
              </h3>
              <p className="text-slate-400 text-xs mt-0.5">
                Manage all commercial freight capabilities published to the live website and booking engine.
              </p>
            </div>

            <button
              onClick={() => {
                setEditingService({
                  title: '',
                  slug: '',
                  shortDescription: '',
                  fullDescription: '',
                  icon: 'Truck',
                  features: [],
                  active: true,
                  displayOrder: (services.length + 1) * 10,
                });
                setIsNewServiceModalOpen(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-blue-600/25 active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Service</span>
            </button>
          </div>

          {/* Services Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {services.map((svc) => (
              <div
                key={svc.id}
                className={`p-5 rounded-2xl border transition-all ${
                  svc.active
                    ? 'bg-[#0F172A] border-slate-800 hover:border-slate-700'
                    : 'bg-[#0A0E1A]/60 border-slate-800/60 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-950/60 border border-blue-500/30 flex items-center justify-center text-cyan-400">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        setEditingService(svc);
                        setIsNewServiceModalOpen(true);
                      }}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                      title="Edit Service"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteService(svc.id, svc.title)}
                      className="p-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 border border-rose-800/40 transition-colors"
                      title="Delete Service"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-bold text-white text-sm font-['Poppins']">{svc.title}</h4>
                  <span
                    className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                      svc.active
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {svc.active ? 'ACTIVE' : 'DRAFT'}
                  </span>
                </div>

                <p className="text-slate-400 text-xs line-clamp-2 mb-3 leading-relaxed">
                  {svc.shortDescription || svc.fullDescription}
                </p>

                {svc.features && svc.features.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {svc.features.slice(0, 3).map((feat, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded bg-slate-800/80 text-[10px] text-slate-300">
                        • {feat}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {services.length === 0 && (
              <div className="col-span-full p-8 text-center bg-[#0F172A] border border-slate-800 rounded-2xl">
                <Truck className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-slate-300 text-sm font-semibold">No services created yet</p>
                <p className="text-slate-500 text-xs mt-1">
                  Click "Add New Service" to create your first cargo offering.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- TAB 4: BRANDING & COMPANY LOGO SYSTEM --- */}
      {activeTab === 'branding' && (
        <div className="bg-[#0B1329] border border-slate-800 rounded-2xl p-6 space-y-8">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Palette className="w-4 h-4 text-cyan-400" />
                <span>Company Logo & Brand Identity Management</span>
              </h3>
              <p className="text-slate-400 text-xs mt-0.5">
                Upload real company logos from your device, customize placement and dimensions, and update across all public & authenticated workplaces.
              </p>
            </div>
            {brandingLastUpdated && (
              <span className="text-[11px] text-slate-500 font-mono">
                Last Published: {new Date(brandingLastUpdated).toLocaleString()}
              </span>
            )}
          </div>

          {/* REAL COMPANY LOGO MANAGEMENT SYSTEM */}
          <div className="p-6 rounded-2xl bg-[#070D1E] border border-cyan-500/30 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Image className="w-4 h-4 text-cyan-400" />
                  <span>Company Logo Management</span>
                </h4>
                <p className="text-slate-400 text-xs mt-0.5">
                  Uploaded files are stored persistently in Firebase Storage & Firestore. Accepts PNG, JPG, WEBP, or SVG up to 5MB.
                </p>
              </div>

              {/* Status Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px]">
                <span className={`w-2 h-2 rounded-full ${logoUrl ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                <span className="text-slate-300 font-mono">
                  {logoUrl ? 'Custom Logo Active' : 'Default Brand Badge Active'}
                </span>
              </div>
            </div>

            {/* Logo Preview Card & Controls */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              {/* Current Logo Preview */}
              <div className="md:col-span-5 p-5 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col items-center justify-center text-center space-y-3 min-h-[160px]">
                <div className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider font-semibold">
                  Live Logo Preview
                </div>
                
                <div className="p-3 bg-slate-900/80 rounded-2xl border border-slate-800 flex items-center justify-center min-w-[120px]">
                  <CompanyLogo size={logoSize} variant="full" />
                </div>

                <div className="text-[10px] text-slate-500 font-mono">
                  Current size: {logoSize}px | Position: {logoPosition.toUpperCase()}
                </div>
              </div>

              {/* Upload & Action Buttons */}
              <div className="md:col-span-7 space-y-4">
                {/* Hidden File Input for Device File Picker */}
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                  onChange={handleLogoFileSelect}
                  className="hidden"
                />

                {/* Error Banner */}
                {logoUploadError && (
                  <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                    <span>{logoUploadError}</span>
                  </div>
                )}

                <div className="flex flex-wrap gap-2.5">
                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    disabled={logoUploading}
                    className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-cyan-600/30 active:scale-95 transition-all disabled:opacity-50"
                  >
                    <Upload className="w-4 h-4" />
                    <span>{logoUploading ? 'Uploading...' : logoUrl ? 'Replace Logo' : 'Upload Logo'}</span>
                  </button>

                  {logoUrl && (
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      disabled={logoUploading}
                      className="px-4 py-2.5 rounded-xl bg-rose-950/50 hover:bg-rose-900/60 text-rose-300 border border-rose-500/30 font-semibold text-xs flex items-center gap-2 active:scale-95 transition-all disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Remove Logo</span>
                    </button>
                  )}
                </div>

                {/* Logo Size Slider */}
                <div className="space-y-1.5 pt-2">
                  <div className="flex justify-between items-center text-xs">
                    <label className="text-slate-300 font-semibold flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Logo Size: {logoSize}px</span>
                    </label>
                    <span className="text-[10px] font-mono text-slate-400">32px - 96px</span>
                  </div>
                  <input
                    type="range"
                    min="32"
                    max="96"
                    step="2"
                    value={logoSize}
                    onChange={(e) => setLogoSize(Number(e.target.value))}
                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                  />
                </div>

                {/* Logo Position Dropdown */}
                <div className="space-y-1.5">
                  <label className="text-slate-300 font-semibold block text-xs">
                    Logo Placement in Header & Workplaces
                  </label>
                  <select
                    value={logoPosition}
                    onChange={(e) => setLogoPosition(e.target.value as any)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="left">Left Aligned (Standard Corporate)</option>
                    <option value="center">Centered (Heroic Focus)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Favicon Management */}
            <div className="border-t border-slate-800 pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h5 className="text-xs font-bold text-white flex items-center gap-2">
                  <Globe className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Browser Tab Favicon</span>
                </h5>
                <p className="text-slate-400 text-[11px]">
                  Upload a 32x32 or 64x64 icon to display in the browser address tab.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <input
                  ref={faviconInputRef}
                  type="file"
                  accept="image/png,image/x-icon,image/svg+xml,image/webp"
                  onChange={handleFaviconFileSelect}
                  className="hidden"
                />
                {faviconUrl && (
                  <img src={faviconUrl} alt="Favicon" className="w-6 h-6 object-contain rounded border border-slate-700 p-0.5" />
                )}
                <button
                  type="button"
                  onClick={() => faviconInputRef.current?.click()}
                  disabled={logoUploading}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Upload Favicon</span>
                </button>
              </div>
            </div>
          </div>

          {/* Company Details Form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div>
              <label className="text-slate-300 font-semibold block mb-1.5">Official Company Name</label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. KIRENGA CARGO CARRIERS"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 font-bold focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-slate-300 font-semibold block mb-1.5">Official Brand Tagline</label>
              <input
                type="text"
                value={brandTagline}
                onChange={(e) => setBrandTagline(e.target.value)}
                placeholder='e.g. "Reliable Cargo Transportation Across East Africa and Beyond"'
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-cyan-300 font-semibold focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-slate-300 font-semibold block mb-1.5">Primary Brand Color (Hex)</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={primaryColorHex}
                  onChange={(e) => setPrimaryColorHex(e.target.value)}
                  className="w-10 h-10 rounded-lg cursor-pointer bg-slate-900 border border-slate-700 p-0.5"
                />
                <input
                  type="text"
                  value={primaryColorHex}
                  onChange={(e) => setPrimaryColorHex(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 font-mono focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-slate-300 font-semibold block mb-1.5">Accent Color (Hex)</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={accentColorHex}
                  onChange={(e) => setAccentColorHex(e.target.value)}
                  className="w-10 h-10 rounded-lg cursor-pointer bg-slate-900 border border-slate-700 p-0.5"
                />
                <input
                  type="text"
                  value={accentColorHex}
                  onChange={(e) => setAccentColorHex(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 font-mono focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-slate-300 font-semibold block mb-1.5 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-cyan-400" />
                <span>Primary Operations Support Phone</span>
              </label>
              <input
                type="text"
                value={supportPhone}
                onChange={(e) => setSupportPhone(e.target.value)}
                placeholder="+256 700 000 000"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-slate-300 font-semibold block mb-1.5 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-amber-400" />
                <span>24/7 Emergency Dispatch Hotline</span>
              </label>
              <input
                type="text"
                value={emergencyHotline}
                onChange={(e) => setEmergencyHotline(e.target.value)}
                placeholder="+254 700 000 000"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-amber-300 font-semibold focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-slate-300 font-semibold block mb-1.5 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-cyan-400" />
                <span>Central Inquiries Email</span>
              </label>
              <input
                type="email"
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
                placeholder="operations@kirengacargo.com"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-slate-300 font-semibold block mb-1.5 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                <span>Headquarters Address</span>
              </label>
              <input
                type="text"
                value={headquartersAddress}
                onChange={(e) => setHeadquartersAddress(e.target.value)}
                placeholder="Plot 42, Logistics Park, Kampala / Nairobi Express Corridor"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="border-t border-slate-800 pt-6 flex justify-end">
            <button
              onClick={handleSaveBranding}
              disabled={saving || logoUploading}
              className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-blue-600/30 active:scale-95 transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Publishing to Firestore...' : 'Save & Publish Branding'}</span>
            </button>
          </div>
        </div>
      )}

      {/* --- TAB 5: ADMIN CONTROL OF ANIMATIONS --- */}
      {activeTab === 'animations' && (
        <div className="bg-[#0B1329] border border-slate-800 rounded-2xl p-6 space-y-8">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Radio className="w-4 h-4 text-cyan-400" />
                <span>Platform Animation Controls & Performance Tuning</span>
              </h3>
              <p className="text-slate-400 text-xs mt-0.5">
                Manage global animation effects, truck motion, route drawing, speed presets, and accessibility fallbacks stored in Firestore.
              </p>
            </div>

            <button
              type="button"
              onClick={resetAnimDefaults}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Defaults</span>
            </button>
          </div>

          {/* Interactive Live Animation Sandbox Preview */}
          <div className="p-6 rounded-2xl bg-[#070D1E] border border-cyan-500/30 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-cyan-400" />
                <span>Live Interactive Sandbox Preview</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-500/40">
                ACTIVE TELEMETRY
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Truck Animation Sandbox Card */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-center items-center overflow-hidden">
                <span className="text-[10px] font-mono text-slate-400 uppercase self-start mb-2">
                  Truck Animation Preview ({animSpeed.toUpperCase()})
                </span>
                <div className="w-full py-2">
                  <AnimatedTruck
                    variant="highway"
                    size="md"
                    speed={animSpeed}
                    showRoad={true}
                    glow={true}
                  />
                </div>
              </div>

              {/* Corridor Route Line Sandbox Card */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-center">
                <span className="text-[10px] font-mono text-slate-400 uppercase mb-2">
                  Route Line Animation Preview
                </span>
                <CargoTrackingAnimation />
              </div>
            </div>
          </div>

          {/* Toggle Switches Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* 1. Hero Animation */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="font-bold text-white block">Hero Section Animation</span>
                <span className="text-slate-400 text-[11px]">
                  Fades in map grid, route lines, floating containers, and moving truck on the homepage hero.
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer ml-4">
                <input
                  type="checkbox"
                  checked={heroAnim}
                  onChange={(e) => setHeroAnim(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
              </label>
            </div>

            {/* 2. Reusable Truck Animation */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="font-bold text-white block">Reusable Truck Animation</span>
                <span className="text-slate-400 text-[11px]">
                  Controls rotating wheels, suspension float, and headlights across all public & portal pages.
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer ml-4">
                <input
                  type="checkbox"
                  checked={truckAnim}
                  onChange={(e) => setTruckAnim(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
              </label>
            </div>

            {/* 3. Route Line Animation */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="font-bold text-white block">Cargo Route Line Animation</span>
                <span className="text-slate-400 text-[11px]">
                  Draws glowing route corridor path lines, pulsing milestone nodes, and progress indicators.
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer ml-4">
                <input
                  type="checkbox"
                  checked={routeAnim}
                  onChange={(e) => setRouteAnim(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
              </label>
            </div>

            {/* 4. Scroll Animations */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="font-bold text-white block">Scroll Viewport Animations</span>
                <span className="text-slate-400 text-[11px]">
                  Enables smooth fade-in, slight lift, and card entry transitions when scrolling through pages.
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer ml-4">
                <input
                  type="checkbox"
                  checked={scrollAnim}
                  onChange={(e) => setScrollAnim(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
              </label>
            </div>

            {/* 5. Loading Screen Animation */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="font-bold text-white block">Animated Loading Screen</span>
                <span className="text-slate-400 text-[11px]">
                  Displays the branded splash screen with animated truck and progress bar during page load.
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer ml-4">
                <input
                  type="checkbox"
                  checked={loadingAnim}
                  onChange={(e) => setLoadingAnim(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
              </label>
            </div>

            {/* 6. Background Grid Ambient Animation */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="font-bold text-white block">Background Ambient Grid Animation</span>
                <span className="text-slate-400 text-[11px]">
                  Gentle breathing glow on the logistics coordinate grid pattern in section backgrounds.
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer ml-4">
                <input
                  type="checkbox"
                  checked={bgAnim}
                  onChange={(e) => setBgAnim(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
              </label>
            </div>
          </div>

          {/* Speed, Intensity and Accessibility Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            {/* Speed Control */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <label className="text-slate-300 font-semibold block">Animation Speed Preset</label>
              <div className="grid grid-cols-3 gap-1">
                {(['slow', 'normal', 'fast'] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setAnimSpeed(s)}
                    className={`py-2 px-1 rounded-lg text-center font-mono uppercase font-bold text-[11px] transition-all ${
                      animSpeed === s
                        ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Intensity Control */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <label className="text-slate-300 font-semibold block">Motion Intensity</label>
              <div className="grid grid-cols-3 gap-1">
                {(['subtle', 'moderate', 'dynamic'] as const).map((intensity) => (
                  <button
                    key={intensity}
                    type="button"
                    onClick={() => setAnimIntensity(intensity)}
                    className={`py-2 px-1 rounded-lg text-center font-mono uppercase font-bold text-[11px] transition-all ${
                      animIntensity === intensity
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {intensity}
                  </button>
                ))}
              </div>
            </div>

            {/* Reduced Motion Policy */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <label className="text-slate-300 font-semibold block">Reduced-Motion Accessibility</label>
              <select
                value={reducedMotionMode}
                onChange={(e) => setReducedMotionMode(e.target.value as any)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 text-xs focus:border-cyan-500 focus:outline-none"
              >
                <option value="auto">Auto (Respect OS prefers-reduced-motion)</option>
                <option value="force_reduced">Force Reduced Motion (Accessible)</option>
                <option value="force_animated">Always Animate (Rich Media)</option>
              </select>
            </div>
          </div>

          {/* Save Animation Action */}
          <div className="border-t border-slate-800 pt-6 flex justify-end">
            <button
              onClick={handleSaveAnimationSettings}
              disabled={saving}
              className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-blue-600/30 active:scale-95 transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save & Publish Animation Settings'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Modal: Add or Edit Service */}
      {isNewServiceModalOpen && editingService && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0B1329] border border-slate-800 rounded-3xl p-6 max-w-lg w-full text-xs animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h3 className="text-sm font-bold text-white font-['Poppins']">
                {editingService.id ? 'Edit Logistics Service' : 'Add New Logistics Service'}
              </h3>
              <button
                onClick={() => {
                  setEditingService(null);
                  setIsNewServiceModalOpen(false);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSaveService(editingService);
              }}
              className="space-y-4"
            >
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Service Title *</label>
                <input
                  type="text"
                  required
                  value={editingService.title || ''}
                  onChange={(e) => setEditingService({ ...editingService, title: e.target.value })}
                  placeholder="e.g. Heavy Cargo & Flatbed Transport"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:border-cyan-500 focus:outline-none font-medium"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Short Description (for Cards) *</label>
                <textarea
                  rows={2}
                  required
                  value={editingService.shortDescription || ''}
                  onChange={(e) => setEditingService({ ...editingService, shortDescription: e.target.value })}
                  placeholder="Short summary displayed on public cards..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Full Service Description (Optional)</label>
                <textarea
                  rows={3}
                  value={editingService.fullDescription || ''}
                  onChange={(e) => setEditingService({ ...editingService, fullDescription: e.target.value })}
                  placeholder="Detailed specifications, trailers used, corridor routes..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Key Features / Cargo Types (Comma-Separated)</label>
                <input
                  type="text"
                  value={editingService.features?.join(', ') || ''}
                  onChange={(e) =>
                    setEditingService({
                      ...editingService,
                      features: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                    })
                  }
                  placeholder="Machinery, Steel Beams, Excavators, High-Cube Containers"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800">
                <div>
                  <span className="font-semibold text-white block">Active Status</span>
                  <span className="text-[11px] text-slate-400">When active, this service appears on the public website.</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingService.active ?? true}
                    onChange={(e) => setEditingService({ ...editingService, active: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditingService(null);
                    setIsNewServiceModalOpen(false);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold flex items-center gap-1.5 shadow-lg shadow-blue-600/30"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{saving ? 'Saving...' : 'Save to Firestore'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
