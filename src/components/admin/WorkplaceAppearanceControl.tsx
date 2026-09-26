import React, { useState, useRef } from 'react';
import {
  Palette,
  Image as ImageIcon,
  Sliders,
  Sparkles,
  Check,
  RefreshCw,
  Eye,
  RotateCcw,
  Upload,
  Lock,
  Shield,
  Layers,
  Monitor,
  Smartphone,
  Tablet,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Users,
  Truck,
  Droplets,
} from 'lucide-react';
import { useWorkplaceTheme, THEME_PRESETS, ALL_STAFF_COMMANDS, ALL_DRIVER_COMMANDS } from '../../context/WorkplaceThemeContext';
import { useBranding } from '../../context/BrandingContext';
import {
  WorkplaceThemeConfig,
  WorkplaceThemePreset,
  BackgroundType,
  WatermarkPosition,
  WatermarkSize,
  StaffCommandKey,
  DriverCommandKey,
} from '../../types';
import { CommandCenterBackground } from '../common/CommandCenterBackground';
import { CompanyLogo } from '../common/CompanyLogo';
import { db } from '../../lib/firestoreService';

export const WorkplaceAppearanceControl: React.FC = () => {
  const {
    settings,
    saveSettings,
    resetToDefaults,
    applyPreset,
    uploadBackgroundImage,
    userPermissions,
    saveUserPermissions,
  } = useWorkplaceTheme();

  const { logoUrl, uploadLogo } = useBranding();

  // Active configuration tab
  type WorkplaceTab = 'global' | 'admin' | 'staff' | 'driver' | 'permissions';
  const [activeTab, setActiveTab] = useState<WorkplaceTab>('global');

  // Preview Mode
  const [previewActive, setPreviewActive] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  // File input refs
  const bgInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Current editable theme config based on selected tab
  const getCurrentTheme = (): WorkplaceThemeConfig => {
    switch (activeTab) {
      case 'admin':
        return settings.adminTheme;
      case 'staff':
        return settings.staffTheme;
      case 'driver':
        return settings.driverTheme;
      case 'global':
      default:
        return settings.globalTheme;
    }
  };

  const currentTheme = getCurrentTheme();

  const updateCurrentTheme = (updates: Partial<WorkplaceThemeConfig>) => {
    const updatedTheme = { ...currentTheme, ...updates };
    if (activeTab === 'global') {
      saveSettings({
        ...settings,
        globalTheme: updatedTheme,
        // If not individual, propagate
        ...(!settings.allowIndividualThemes && {
          adminTheme: updatedTheme,
          staffTheme: updatedTheme,
          driverTheme: updatedTheme,
        }),
      });
    } else if (activeTab === 'admin') {
      saveSettings({ ...settings, adminTheme: updatedTheme });
    } else if (activeTab === 'staff') {
      saveSettings({ ...settings, staffTheme: updatedTheme });
    } else if (activeTab === 'driver') {
      saveSettings({ ...settings, driverTheme: updatedTheme });
    }
  };

  const handleBgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await uploadBackgroundImage(file);
      updateCurrentTheme({
        backgroundImageUrl: dataUrl,
        backgroundType: 'custom-image',
      });
    } catch (err) {
      console.error('Failed to upload background:', err);
      alert('Failed to upload image. Please ensure it is less than 5MB.');
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await uploadLogo(file);
    } catch (err: any) {
      alert(err.message || 'Failed to upload logo');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveSettings(settings);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="relative space-y-6">
      {/* Live Preview Modal Overlay */}
      {previewActive && (
        <div className="fixed inset-0 z-50 flex flex-col bg-[#060B18]">
          <CommandCenterBackground overrideTheme={currentTheme} />
          <div className="relative z-10 p-6 flex items-center justify-between border-b border-slate-800 bg-[#080E24]/90 backdrop-blur-md">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
                <h3 className="font-mono text-sm font-bold text-white uppercase tracking-wider">
                  LIVE WORKPLACE PREVIEW: {activeTab.toUpperCase()} ENVIRONMENT
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Active Theme: {currentTheme.themePreset} | Watermark Opacity: {(currentTheme.watermarkOpacity * 100).toFixed(0)}%
              </p>
            </div>
            <button
              onClick={() => setPreviewActive(false)}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-mono font-bold shadow-lg"
            >
              EXIT PREVIEW
            </button>
          </div>

          <div className="relative z-10 flex-1 flex items-center justify-center p-8 pointer-events-none">
            <div className="max-w-md w-full bg-[#080E24]/80 border border-cyan-400/40 rounded-3xl p-6 backdrop-blur-xl text-center shadow-2xl">
              <div className="mx-auto mb-4 flex justify-center">
                <CompanyLogo size={64} />
              </div>
              <h4 className="text-lg font-bold text-white font-mono uppercase tracking-wider">
                KIRENGA COMMAND INTERFACE
              </h4>
              <p className="text-xs text-cyan-200/80 mt-1">
                Visual styling, watermark depth, and ambient glow are active in this environment.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Control Header */}
      <div className="bg-[#080E24]/80 border border-slate-800 rounded-3xl p-6 backdrop-blur-md flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/30">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold font-mono text-white tracking-wide uppercase">
                CENTRAL WORKPLACE CONTROL
              </h1>
              <p className="text-xs text-slate-400">
                Manage workplace appearance, themes, company logo watermark, button glows, and workforce command permissions.
              </p>
            </div>
          </div>
        </div>

        {/* Global Action Buttons (Req 37: UPLOAD BACKGROUND, UPLOAD LOGO, PREVIEW, SAVE, RESET) */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <input
            type="file"
            ref={bgInputRef}
            onChange={handleBgUpload}
            accept="image/*"
            className="hidden"
          />
          <input
            type="file"
            ref={logoInputRef}
            onChange={handleLogoUpload}
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            className="hidden"
          />

          <button
            onClick={() => bgInputRef.current?.click()}
            className="px-3.5 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-xs font-mono flex items-center gap-2 transition-colors"
          >
            <Upload className="w-3.5 h-3.5 text-cyan-400" />
            <span>UPLOAD BACKGROUND</span>
          </button>

          <button
            onClick={() => logoInputRef.current?.click()}
            className="px-3.5 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-xs font-mono flex items-center gap-2 transition-colors"
          >
            <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
            <span>UPLOAD COMPANY LOGO</span>
          </button>

          <button
            onClick={() => setPreviewActive(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-cyan-400 border border-cyan-500/40 text-xs font-mono flex items-center gap-2 transition-colors shadow-[0_0_12px_rgba(6,182,212,0.15)]"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>PREVIEW</span>
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-mono font-bold text-xs shadow-lg shadow-cyan-600/30 flex items-center gap-2"
          >
            {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
            <span>SAVE</span>
          </button>

          <button
            onClick={resetToDefaults}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 text-xs font-mono flex items-center gap-1.5"
            title="Reset to Factory Defaults"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>RESET</span>
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-500/50 rounded-2xl text-xs text-emerald-300 font-mono flex items-center gap-2 shadow-lg">
          <CheckCircle2 className="w-4 h-4" />
          <span>Workplace appearance and branding settings saved to Firestore successfully!</span>
        </div>
      )}

      {/* Workplace Environment Selector Tabs (Global, Admin, Staff, Driver, Permissions) */}
      <div className="flex gap-2 border-b border-slate-800 pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveTab('global')}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-2 ${
            activeTab === 'global'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.25)]'
              : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-transparent'
          }`}
        >
          <Monitor className="w-4 h-4" />
          <span>COMPANY-WIDE THEME</span>
        </button>

        <button
          onClick={() => setActiveTab('admin')}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-2 ${
            activeTab === 'admin'
              ? 'bg-blue-500/20 text-blue-300 border border-blue-400 shadow-[0_0_12px_rgba(59,130,246,0.25)]'
              : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-transparent'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>ADMIN COMMAND CENTER</span>
        </button>

        <button
          onClick={() => setActiveTab('staff')}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-2 ${
            activeTab === 'staff'
              ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-400 shadow-[0_0_12px_rgba(99,102,241,0.25)]'
              : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-transparent'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>STAFF COMMAND CENTER</span>
        </button>

        <button
          onClick={() => setActiveTab('driver')}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-2 ${
            activeTab === 'driver'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.25)]'
              : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-transparent'
          }`}
        >
          <Smartphone className="w-4 h-4" />
          <span>DRIVER COMMAND CENTER</span>
        </button>

        <button
          onClick={() => setActiveTab('permissions')}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-2 ${
            activeTab === 'permissions'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.25)]'
              : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-transparent'
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>COMMAND PERMISSIONS</span>
        </button>
      </div>

      {/* Main Settings Sections */}
      {activeTab !== 'permissions' ? (
        <div className="space-y-6">
          {/* 1. Theme Presets Selection (Req 41) */}
          <div className="bg-[#080E24]/80 border border-slate-800 rounded-3xl p-6 backdrop-blur-md">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold font-mono uppercase text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <span>PRESET WORKPLACE THEMES (REQ 41)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Select a pre-tuned logistics palette for {activeTab.toUpperCase()}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {(
                [
                  { key: 'default-kirenga', name: 'Default Kirenga', desc: 'Deep Navy + Cyan', colors: ['#060B18', '#06B6D4', '#3B82F6'] },
                  { key: 'midnight-command', name: 'Midnight Command', desc: 'Obsidian + Electric Violet', colors: ['#030712', '#8B5CF6', '#00F0FF'] },
                  { key: 'blue-operations', name: 'Blue Operations', desc: 'Royal Navy + Cobalt', colors: ['#0A192F', '#2563EB', '#38BDF8'] },
                  { key: 'cyan-logistics', name: 'Cyan Logistics', desc: 'High-Tech Dark Teal', colors: ['#041C1E', '#06B6D4', '#10B981'] },
                  { key: 'executive-dark', name: 'Executive Dark', desc: 'Charcoal + Amber Gold', colors: ['#0F172A', '#D97706', '#F59E0B'] },
                  { key: 'custom', name: 'Custom Theme', desc: 'Full custom control', colors: ['#080E24', '#38BDF8', '#818CF8'] },
                ] as const
              ).map((preset) => (
                <button
                  key={preset.key}
                  type="button"
                  onClick={() => applyPreset(activeTab === 'global' ? 'global' : activeTab, preset.key)}
                  className={`p-3.5 rounded-2xl text-left border transition-all ${
                    currentTheme.themePreset === preset.key
                      ? 'bg-slate-800/90 border-cyan-400 shadow-[0_0_16px_rgba(6,182,212,0.3)] ring-1 ring-cyan-400/40'
                      : 'bg-slate-950/60 hover:bg-slate-900 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex gap-1.5 mb-2.5">
                    {preset.colors.map((c, i) => (
                      <span
                        key={i}
                        className="w-4 h-4 rounded-full border border-slate-700"
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                  <div className="font-mono text-xs font-bold text-white truncate">{preset.name}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{preset.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 2. Background Settings (Req 33, 37) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[#080E24]/80 border border-slate-800 rounded-3xl p-6 backdrop-blur-md space-y-4">
              <h3 className="text-sm font-bold font-mono uppercase text-white flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-cyan-400" />
                <span>COMMAND CENTER BACKGROUND (REQ 33, 37)</span>
              </h3>

              <div>
                <label className="text-xs font-mono text-slate-300 block mb-1">Background Type</label>
                <select
                  value={currentTheme.backgroundType}
                  onChange={(e) => updateCurrentTheme({ backgroundType: e.target.value as BackgroundType })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-cyan-400"
                >
                  <option value="animated-logistics">Animated Logistics (Moving Corridors & Telemetry)</option>
                  <option value="deep-grid">Deep Space Coordinate Grid</option>
                  <option value="mesh-gradient">High-Tech Cyan Mesh Gradient</option>
                  <option value="dark-minimal">Executive Dark Minimalist</option>
                  <option value="custom-image">Custom Uploaded Image</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-mono text-slate-300 block mb-1">Background Overlay Depth</label>
                <select
                  value={currentTheme.backgroundOverlay}
                  onChange={(e) => updateCurrentTheme({ backgroundOverlay: e.target.value as any })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-cyan-400"
                >
                  <option value="navy-dark">Navy Command Radial Glow</option>
                  <option value="black-obsidian">Black Obsidian Shield</option>
                  <option value="cyan-glow">Vibrant Cyan Telemetry Aura</option>
                  <option value="deep-space">Deep Graphite Executive Veil</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-mono text-slate-300 block mb-1">Card Transparency</label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0.6"
                    max="0.98"
                    step="0.02"
                    value={currentTheme.cardTransparency}
                    onChange={(e) => updateCurrentTheme({ cardTransparency: parseFloat(e.target.value) })}
                    className="flex-1 accent-cyan-400"
                  />
                  <span className="text-xs font-mono text-cyan-300 w-12 text-right">
                    {Math.round(currentTheme.cardTransparency * 100)}%
                  </span>
                </div>
              </div>

              <div>
                <label className="text-xs font-mono text-slate-300 block mb-1">Border Brightness</label>
                <select
                  value={currentTheme.borderBrightness}
                  onChange={(e) => updateCurrentTheme({ borderBrightness: e.target.value as any })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-cyan-400"
                >
                  <option value="subtle">Subtle Dark Border</option>
                  <option value="medium">Medium Glowing Border</option>
                  <option value="high">High-Intensity Fluorescent Glow</option>
                </select>
              </div>
            </div>

            {/* 3. Company Logo Watermark Settings (Req 34, 44) */}
            <div className="bg-[#080E24]/80 border border-slate-800 rounded-3xl p-6 backdrop-blur-md space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold font-mono uppercase text-white flex items-center gap-2">
                  <Droplets className="w-4 h-4 text-cyan-400" />
                  <span>COMPANY LOGO WATERMARK (REQ 34, 44)</span>
                </h3>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={currentTheme.watermarkEnabled}
                    onChange={(e) => updateCurrentTheme({ watermarkEnabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-500" />
                </label>
              </div>

              <p className="text-xs text-slate-400">
                Large, subtle watermark behind the command center interface. Strictly guaranteed never to interfere with buttons, tables, or readability.
              </p>

              <div>
                <div className="flex justify-between text-xs font-mono text-slate-300 mb-1">
                  <span>Watermark Opacity (5% – 20%)</span>
                  <span className="text-cyan-300">{(currentTheme.watermarkOpacity * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min="0.05"
                  max="0.20"
                  step="0.01"
                  value={currentTheme.watermarkOpacity}
                  onChange={(e) => updateCurrentTheme({ watermarkOpacity: parseFloat(e.target.value) })}
                  className="w-full accent-cyan-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-mono text-slate-300 block mb-1">Watermark Size</label>
                  <select
                    value={currentTheme.watermarkSize}
                    onChange={(e) => updateCurrentTheme({ watermarkSize: e.target.value as WatermarkSize })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-cyan-400"
                  >
                    <option value="small">Small (260px)</option>
                    <option value="medium">Medium (480px)</option>
                    <option value="large">Large (720px)</option>
                    <option value="custom">Custom (600px)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-mono text-slate-300 block mb-1">Position</label>
                  <select
                    value={currentTheme.watermarkPosition}
                    onChange={(e) => updateCurrentTheme({ watermarkPosition: e.target.value as WatermarkPosition })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-cyan-400"
                  >
                    <option value="center">Center</option>
                    <option value="top-right">Top Right</option>
                    <option value="bottom-right">Bottom Right</option>
                    <option value="top-left">Top Left</option>
                  </select>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-mono text-slate-300 mb-1">
                  <span>Watermark Soft Blur (0 – 20px)</span>
                  <span className="text-cyan-300">{currentTheme.watermarkBlur}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="20"
                  step="1"
                  value={currentTheme.watermarkBlur}
                  onChange={(e) => updateCurrentTheme({ watermarkBlur: parseInt(e.target.value, 10) })}
                  className="w-full accent-cyan-400"
                />
              </div>
            </div>
          </div>

          {/* 4. Color Controls & Animations (Req 37, 43) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[#080E24]/80 border border-slate-800 rounded-3xl p-6 backdrop-blur-md space-y-4">
              <h3 className="text-sm font-bold font-mono uppercase text-white flex items-center gap-2">
                <Palette className="w-4 h-4 text-cyan-400" />
                <span>ACCENT & BRAND COLOR PALETTE (REQ 37)</span>
              </h3>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-mono text-slate-400 block mb-1">Primary Color</label>
                  <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-xl p-2">
                    <input
                      type="color"
                      value={currentTheme.primaryColorHex}
                      onChange={(e) => updateCurrentTheme({ primaryColorHex: e.target.value })}
                      className="w-7 h-7 rounded border-none cursor-pointer bg-transparent"
                    />
                    <span className="text-[11px] font-mono text-white">{currentTheme.primaryColorHex}</span>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-mono text-slate-400 block mb-1">Secondary Color</label>
                  <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-xl p-2">
                    <input
                      type="color"
                      value={currentTheme.secondaryColorHex}
                      onChange={(e) => updateCurrentTheme({ secondaryColorHex: e.target.value })}
                      className="w-7 h-7 rounded border-none cursor-pointer bg-transparent"
                    />
                    <span className="text-[11px] font-mono text-white">{currentTheme.secondaryColorHex}</span>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-mono text-slate-400 block mb-1">Accent Glow</label>
                  <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-xl p-2">
                    <input
                      type="color"
                      value={currentTheme.accentColorHex}
                      onChange={(e) => updateCurrentTheme({ accentColorHex: e.target.value })}
                      className="w-7 h-7 rounded border-none cursor-pointer bg-transparent"
                    />
                    <span className="text-[11px] font-mono text-white">{currentTheme.accentColorHex}</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-mono text-slate-300 block mb-1">Command Button Glow</label>
                <select
                  value={currentTheme.buttonGlow}
                  onChange={(e) => updateCurrentTheme({ buttonGlow: e.target.value as any })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-cyan-400"
                >
                  <option value="none">No Glow</option>
                  <option value="subtle">Subtle Tactical Glow</option>
                  <option value="vibrant">Vibrant Command Aura</option>
                </select>
              </div>
            </div>

            {/* Animation Settings (Req 43) */}
            <div className="bg-[#080E24]/80 border border-slate-800 rounded-3xl p-6 backdrop-blur-md space-y-4">
              <h3 className="text-sm font-bold font-mono uppercase text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-cyan-400" />
                <span>ANIMATION DYNAMICS & VELOCITY (REQ 43)</span>
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-mono text-slate-300 block mb-1">Animation Speed</label>
                  <select
                    value={currentTheme.animationSpeed}
                    onChange={(e) => updateCurrentTheme({ animationSpeed: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-cyan-400"
                  >
                    <option value="slow">Slow & Cinematic</option>
                    <option value="normal">Standard Operational (Default)</option>
                    <option value="fast">High-Velocity Instant</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-mono text-slate-300 block mb-1">Animation Intensity</label>
                  <select
                    value={currentTheme.animationIntensity}
                    onChange={(e) => updateCurrentTheme({ animationIntensity: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-cyan-400"
                  >
                    <option value="subtle">Subtle Minimal Motion</option>
                    <option value="moderate">Moderate Operational Pulse</option>
                    <option value="dynamic">Dynamic Telemetry Float</option>
                  </select>
                </div>
              </div>

              <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl text-xs text-slate-400 leading-relaxed">
                When a user opens any command workplace, the logo fades in, command buttons appear sequentially, and background freight vectors drift slowly. Selecting a command transitions content smoothly with no flashing.
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* WORKFORCE COMMAND PERMISSIONS CONFIGURATION (REQ 38, 46, 47) */
        <div className="bg-[#080E24]/80 border border-slate-800 rounded-3xl p-6 backdrop-blur-md space-y-6">
          <div>
            <h3 className="text-base font-bold font-mono uppercase text-white flex items-center gap-2">
              <Lock className="w-5 h-5 text-amber-400" />
              <span>STAFF & DRIVER COMMAND PERMISSIONS (REQ 38, 46, 47)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              The Admin controls which command buttons each staff member and driver can access. Unauthorized sections are blocked by Firebase Authentication and Firestore Security Rules.
            </p>
          </div>

          {/* Quick Staff Commands Preview */}
          <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-cyan-300 uppercase">
                Available Staff Command Buttons (12 Authorized Tools)
              </span>
              <span className="text-[11px] text-slate-400 font-mono">Enforced per role in Firestore</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {ALL_STAFF_COMMANDS.map((cmd) => (
                <div
                  key={cmd.key}
                  className="p-2.5 bg-slate-950/80 border border-slate-800 rounded-xl flex items-center justify-between text-xs font-mono text-slate-300"
                >
                  <span className="truncate">{cmd.label}</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                </div>
              ))}
            </div>
          </div>

          {/* Driver Commands Preview */}
          <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-cyan-300 uppercase">
                Available Driver Command Buttons (13 Mobile Tools)
              </span>
              <span className="text-[11px] text-slate-400 font-mono">Mobile Touch Layout</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {ALL_DRIVER_COMMANDS.map((cmd) => (
                <div
                  key={cmd.key}
                  className="p-2.5 bg-slate-950/80 border border-slate-800 rounded-xl flex items-center justify-between text-xs font-mono text-slate-300"
                >
                  <span className="truncate">{cmd.label}</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
