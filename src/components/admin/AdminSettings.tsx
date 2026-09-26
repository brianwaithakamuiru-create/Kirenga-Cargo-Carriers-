import React, { useState, useEffect, useRef } from 'react';
import {
  Building2,
  Phone,
  Mail,
  MapPin,
  Clock,
  ShieldCheck,
  Save,
  CheckCircle2,
  AlertCircle,
  Palette,
  Image as ImageIcon,
  Lock,
  Globe,
  Upload,
  Trash2,
  Sliders,
  Sparkles,
  HelpCircle,
  Eye,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useBranding } from '../../context/BrandingContext';
import { db } from '../../lib/firestoreService';
import { SystemSettings } from '../../types';
import { CompanyLogo } from '../common/CompanyLogo';

interface AdminSettingsProps {
  initialTab?: 'profile' | 'branding' | 'security';
}

export const AdminSettings: React.FC<AdminSettingsProps> = ({ initialTab = 'branding' }) => {
  const { currentUser, systemSettings } = useAuth();
  const {
    branding,
    logoUrl: contextLogoUrl,
    faviconUrl: contextFaviconUrl,
    logoSize: contextLogoSize,
    logoPosition: contextLogoPosition,
    companyName: contextCompanyName,
    tagline: contextTagline,
    uploadLogo,
    uploadFavicon,
    removeLogo,
    updateLogoConfig,
    refreshBranding,
  } = useBranding();

  const [activeTab, setActiveTab] = useState<'profile' | 'branding' | 'security'>(initialTab);

  // Profile fields
  const [companyName, setCompanyName] = useState(branding.companyName || systemSettings.companyName || 'KIRENGA CARGO CARRIERS');
  const [tagline, setTagline] = useState(branding.tagline || 'Reliable Cargo Transportation Across East Africa and Beyond');
  const [phone, setPhone] = useState(systemSettings.phone || '+256 700 000 000');
  const [email, setEmail] = useState(systemSettings.email || 'operations@kirengacargo.com');
  const [address, setAddress] = useState(systemSettings.address || 'Kampala, Uganda | East & Central Africa Corridors');
  const [wallpaperUrl, setWallpaperUrl] = useState(systemSettings.wallpaperUrl || '');
  const [sessionTimeoutSeconds, setSessionTimeoutSeconds] = useState(systemSettings.sessionTimeoutSeconds || 300);
  const [theme, setTheme] = useState(systemSettings.theme || 'navy-dark');

  // Branding specific fields
  const [currentLogoUrl, setCurrentLogoUrl] = useState<string>(branding.logoUrl || '');
  const [currentFaviconUrl, setCurrentFaviconUrl] = useState<string>(branding.faviconUrl || '');
  const [logoSize, setLogoSize] = useState<number>(branding.logoSize || 48);
  const [logoPosition, setLogoPosition] = useState<'left' | 'center'>(branding.logoPosition || 'left');
  const [logoVersionChoice, setLogoVersionChoice] = useState<'default' | 'light' | 'dark'>('default');

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const faviconInputRef = useRef<HTMLInputElement | null>(null);

  // Sync state with branding
  useEffect(() => {
    if (branding) {
      if (branding.companyName) setCompanyName(branding.companyName);
      if (branding.tagline) setTagline(branding.tagline);
      if (branding.logoUrl !== undefined) setCurrentLogoUrl(branding.logoUrl);
      if (branding.faviconUrl !== undefined) setCurrentFaviconUrl(branding.faviconUrl);
      if (branding.logoSize) setLogoSize(branding.logoSize);
      if (branding.logoPosition) setLogoPosition(branding.logoPosition);
    }
  }, [branding]);

  const showToast = (msg: string) => {
    setSavedMessage(msg);
    setTimeout(() => setSavedMessage(null), 4000);
  };

  const showError = (msg: string) => {
    setErrorMessage(msg);
    setTimeout(() => setErrorMessage(null), 6000);
  };

  // Real Logo File Upload Handler
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 5MB)
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      showError('Selected file exceeds the maximum allowed 5MB limit. Please choose a smaller logo.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Validate type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      showError('Unsupported file type. Please upload a PNG, JPG/JPEG, WEBP, or SVG image.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setUploading(true);
    setErrorMessage(null);

    try {
      const res = await uploadLogo(file, logoVersionChoice);
      setCurrentLogoUrl(res.url);
      showToast('Company logo successfully uploaded and saved to storage!');
    } catch (err: any) {
      console.error('Logo upload error:', err);
      showError(err.message || 'Failed to upload logo. Please check file format.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Real Favicon Upload Handler
  const handleFaviconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      showError('Favicon file must be less than 2MB.');
      return;
    }

    setUploading(true);
    try {
      const res = await uploadFavicon(file);
      setCurrentFaviconUrl(res.url);
      showToast('Browser favicon successfully updated!');
    } catch (err: any) {
      showError(err.message || 'Failed to upload favicon.');
    } finally {
      setUploading(false);
      if (faviconInputRef.current) faviconInputRef.current.value = '';
    }
  };

  // Real Logo Removal Handler
  const handleLogoRemove = async () => {
    if (!window.confirm('Are you sure you want to remove the current company logo? The platform will revert to the default vector brand icon.')) {
      return;
    }

    setUploading(true);
    try {
      await removeLogo(logoVersionChoice);
      setCurrentLogoUrl('');
      showToast('Company logo removed. Standard vector badge restored.');
    } catch (err: any) {
      showError(err.message || 'Failed to remove company logo.');
    } finally {
      setUploading(false);
    }
  };

  // Save All Settings
  const handleSaveAll = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedMessage(null);
    setErrorMessage(null);

    try {
      // 1. Update branding settings
      await db.saveBranding({
        companyName,
        tagline,
        logoUrl: currentLogoUrl || undefined,
        faviconUrl: currentFaviconUrl || undefined,
        logoSize,
        logoPosition,
        wallpaperUrl: wallpaperUrl.trim() || undefined,
        supportPhone: phone,
        supportEmail: email,
        headquartersAddress: address,
      });

      // 2. Update context local cache
      await updateLogoConfig({
        size: logoSize,
        position: logoPosition,
        companyName,
        tagline,
      });

      // 3. Update system settings
      await db.updateSystemSettings({
        companyName,
        phone,
        email,
        address,
        logoUrl: currentLogoUrl,
        wallpaperUrl,
        sessionTimeoutSeconds: Number(sessionTimeoutSeconds),
        theme,
      });

      // 4. Log audit
      await db.logAudit({
        userId: currentUser?.uid || 'admin',
        userName: 'Admin',
        action: 'COMPANY_BRANDING_UPDATED',
        details: `Updated company branding, logo size (${logoSize}px), position (${logoPosition}), and corporate profile.`,
      });

      await refreshBranding();
      showToast('Company settings & branding published successfully across all workplaces!');
    } catch (err: any) {
      console.error('Settings save error:', err);
      showError(err.message || 'Failed to save company settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn max-w-5xl">
      {/* Top Header */}
      <div className="bg-[#0A1024]/90 p-6 rounded-2xl border border-slate-800/80 shadow-xl backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-xs font-mono uppercase text-cyan-400 font-semibold tracking-wider">
                ADMIN CENTER → COMPANY SETTINGS
              </span>
            </div>
            <h2 className="text-2xl font-bold text-white font-['Poppins'] mt-1">Company Settings & Branding</h2>
            <p className="text-slate-400 text-xs mt-1">
              Manage real company logos, global visual identity, corporate headquarters contact, and session parameters.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => refreshBranding()}
              className="p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-white transition-colors"
              title="Refresh Branding"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Sub-Navigation Tabs */}
        <div className="flex gap-2 mt-6 border-t border-slate-800 pt-4 text-xs font-semibold overflow-x-auto">
          {[
            { id: 'branding', label: 'Company Logo & Branding', icon: Palette },
            { id: 'profile', label: 'Company Profile & Headquarters', icon: Building2 },
            { id: 'security', label: 'Workplace Security & Session', icon: Lock },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-blue-600/20 text-cyan-300 border border-blue-500/40 font-bold shadow-md shadow-blue-600/10'
                    : 'bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-800/60 border border-slate-800'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Success Notification Alert */}
      {savedMessage && (
        <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-xs flex items-center gap-2.5 animate-fadeIn shadow-lg shadow-emerald-950/40">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
          <span className="font-medium">{savedMessage}</span>
        </div>
      )}

      {/* Error Alert */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-950/80 border border-red-500/50 text-red-200 text-xs flex items-center gap-2.5 animate-fadeIn shadow-lg shadow-red-950/40">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
          <span className="font-medium">{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSaveAll} className="space-y-6">
        {/* ============================================================
            SUB-TAB: BRANDING & COMPANY LOGO DASHBOARD
            ============================================================ */}
        {activeTab === 'branding' && (
          <div className="space-y-6">
            {/* Real Logo Upload & Management Panel */}
            <div className="bg-[#0A1024]/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-blue-950/70 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                    <Palette className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white font-['Poppins']">Company Logo</h3>
                    <p className="text-xs text-slate-400">
                      Upload from your device, preview live, and publish across public pages & portals
                    </p>
                  </div>
                </div>

                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px]">
                  <span className={`w-2 h-2 rounded-full ${currentLogoUrl ? 'bg-emerald-400' : 'bg-cyan-400 animate-pulse'}`} />
                  <span className="text-slate-300 font-mono">
                    {currentLogoUrl ? 'Custom Logo Active' : 'Default Vector Active'}
                  </span>
                </div>
              </div>

              {/* Logo Preview and Actions Grid */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                {/* [Current Logo Preview] */}
                <div className="md:col-span-5 p-6 rounded-2xl bg-[#060B18] border border-cyan-500/20 flex flex-col items-center justify-center text-center space-y-3 min-h-[190px]">
                  <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider font-semibold">
                    Current Logo Preview
                  </span>

                  <div className="p-4 bg-slate-900/90 rounded-2xl border border-slate-800 shadow-inner flex items-center justify-center min-w-[140px] max-w-full overflow-hidden">
                    <CompanyLogo size={logoSize} variant="full" />
                  </div>

                  <div className="text-[10px] text-slate-400 font-mono">
                    Dimensions: {logoSize}px | Alignment: {logoPosition.toUpperCase()}
                  </div>
                </div>

                {/* [Upload New Logo], [Replace Logo], [Remove Logo] Actions */}
                <div className="md:col-span-7 space-y-5">
                  {/* Hidden File Input for Device File Picker */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />

                  {/* Version Picker: Light / Dark version toggle */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                      <span>Target Logo Version</span>
                      <span className="text-[10px] text-slate-500">Select which theme to update</span>
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'default', label: 'Primary Brand' },
                        { id: 'light', label: 'Light Mode' },
                        { id: 'dark', label: 'Dark Mode' },
                      ].map((v) => (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => setLogoVersionChoice(v.id as any)}
                          className={`py-2 px-2 rounded-xl text-center text-xs font-medium border transition-all ${
                            logoVersionChoice === v.id
                              ? 'bg-cyan-950 border-cyan-500 text-cyan-300 font-bold'
                              : 'bg-slate-900/70 border-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          {v.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Upload / Replace / Remove Buttons */}
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/25 active:scale-95 transition-all disabled:opacity-50"
                    >
                      <Upload className="w-4 h-4" />
                      <span>{uploading ? 'Uploading to Storage...' : currentLogoUrl ? 'Replace Logo' : 'Upload New Logo'}</span>
                    </button>

                    {currentLogoUrl && (
                      <button
                        type="button"
                        onClick={handleLogoRemove}
                        disabled={uploading}
                        className="px-4 py-2.5 rounded-xl bg-rose-950/50 hover:bg-rose-900/70 text-rose-300 border border-rose-500/30 font-semibold text-xs flex items-center gap-2 active:scale-95 transition-all disabled:opacity-50"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Remove Logo</span>
                      </button>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-400 leading-relaxed font-light">
                    Accepted formats: <strong>PNG, JPG/JPEG, WEBP, SVG</strong>. Recommended resolution: minimum 300x120px with transparent background. Max file size: 5MB.
                  </p>

                  {/* Logo Size [slider] */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-800">
                    <div className="flex justify-between items-center text-xs">
                      <label className="text-slate-300 font-semibold flex items-center gap-1.5">
                        <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Logo Size: {logoSize}px</span>
                      </label>
                      <span className="text-[10px] font-mono text-slate-400">32px – 96px</span>
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

                  {/* Logo Position [dropdown] */}
                  <div className="space-y-1.5">
                    <label className="text-slate-300 font-semibold block text-xs">
                      Logo Placement
                    </label>
                    <select
                      value={logoPosition}
                      onChange={(e) => setLogoPosition(e.target.value as any)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 text-xs focus:border-cyan-500 focus:outline-none"
                    >
                      <option value="left">Left Aligned (Standard Corporate Navbar & Sidebar)</option>
                      <option value="center">Centered (Heroic Focus & Splash Header)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Favicon [Upload Favicon] Section */}
              <div className="border-t border-slate-800 pt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="text-xs font-bold text-white flex items-center gap-2">
                    <Globe className="w-4 h-4 text-cyan-400" />
                    <span>Browser Tab Favicon</span>
                  </h4>
                  <p className="text-slate-400 text-[11px] mt-0.5">
                    Displayed in web browser tabs, bookmarks, and mobile home screen shortcuts.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    ref={faviconInputRef}
                    type="file"
                    accept="image/png,image/x-icon,image/svg+xml,image/webp"
                    onChange={handleFaviconUpload}
                    className="hidden"
                  />
                  {currentFaviconUrl && (
                    <img
                      src={currentFaviconUrl}
                      alt="Favicon"
                      className="w-7 h-7 object-contain rounded-lg border border-slate-700 p-0.5 bg-slate-900"
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => faviconInputRef.current?.click()}
                    disabled={uploading}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Upload Favicon</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Brand Names & Tagline Card */}
            <div className="bg-[#0A1024]/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <h4 className="text-sm font-bold text-white font-['Poppins']">Corporate Name & Tagline</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Company Display Name</label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-bold focus:border-cyan-400 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Official Brand Tagline</label>
                  <input
                    type="text"
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-cyan-300 focus:border-cyan-400 focus:outline-none"
                    required
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================
            SUB-TAB: COMPANY PROFILE & HEADQUARTERS
            ============================================================ */}
        {activeTab === 'profile' && (
          <div className="bg-[#0A1024]/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
            <div className="flex items-center gap-2.5 pb-4 border-b border-slate-800">
              <Building2 className="w-5 h-5 text-cyan-400" />
              <div>
                <h3 className="text-base font-bold text-white font-['Poppins']">Company Profile & Dispatch Office</h3>
                <p className="text-xs text-slate-400">Primary business identity across cross-border freight operations</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-medium text-slate-300 mb-1.5">Official Company Name</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-bold focus:outline-none focus:border-cyan-400"
                  required
                />
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1.5">Central Operations Email</label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-400"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1.5">Dispatch & Emergency Phone</label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-400"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1.5">HQ Physical Address & Corridors</label>
                <div className="relative">
                  <MapPin className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-400"
                    required
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================
            SUB-TAB: WORKPLACE SECURITY & THEME
            ============================================================ */}
        {activeTab === 'security' && (
          <div className="bg-[#0A1024]/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
            <div className="flex items-center gap-2.5 pb-4 border-b border-slate-800">
              <Lock className="w-5 h-5 text-cyan-400" />
              <div>
                <h3 className="text-base font-bold text-white font-['Poppins']">Workplace Security & Auto-Lock</h3>
                <p className="text-xs text-slate-400">Configure idle session timers and visual themes for central consoles</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-medium text-slate-300 mb-1.5">Inactivity Lockout Timer (Seconds)</label>
                <div className="relative">
                  <Clock className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="number"
                    min="60"
                    max="3600"
                    step="30"
                    value={sessionTimeoutSeconds}
                    onChange={(e) => setSessionTimeoutSeconds(Number(e.target.value))}
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:border-cyan-400"
                    required
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  Default: 300s (5 minutes). Workstations lock automatically upon inactivity.
                </p>
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1.5">Workplace Theme</label>
                <select
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-400"
                >
                  <option value="navy-dark">Navy Stealth (Default Logistics Navy/Black)</option>
                  <option value="slate-ops">Tactical Slate Operations</option>
                  <option value="midnight-corridor">Midnight Express Blue</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Global Save Changes Action Button */}
        <div className="border-t border-slate-800 pt-6 flex items-center justify-between">
          <span className="text-xs text-slate-400 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Changes are secured and validated via Firebase Firestore & Storage.</span>
          </span>

          <button
            type="submit"
            disabled={saving || uploading}
            className="px-7 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-blue-600/30 active:scale-95 transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Publishing Changes...' : 'Save Changes'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
