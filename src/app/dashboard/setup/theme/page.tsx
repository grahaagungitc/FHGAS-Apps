"use client";

import { useState, useRef, useEffect } from "react";
import {
  Palette,
  Type,
  Image as ImageIcon,
  RotateCcw,
  Save,
  UploadCloud,
  Sliders,
  Sparkles,
  Layout,
  Layers,
  CheckCircle2,
  FileUp,
  X,
} from "lucide-react";
import { useTheme, ThemeConfig } from "@/context/ThemeContext";
import { useAppNotifications } from "@/components/AppNotificationProvider";

const FONT_OPTIONS = [
  { value: "Inter", label: "Inter (Modern & Clean)" },
  { value: "Plus Jakarta Sans", label: "Plus Jakarta Sans (Corporate Elegant)" },
  { value: "Outfit", label: "Outfit (Geometric & Friendly)" },
  { value: "Poppins", label: "Poppins (Rounded & Modern)" },
  { value: "Roboto", label: "Roboto (Classic & Balanced)" },
  { value: "Montserrat", label: "Montserrat (Bold & Assertive)" },
  { value: "JetBrains Mono", label: "JetBrains Mono (Monospace Tech)" },
];

const PRESET_THEMES: {
  name: string;
  primary: string;
  accent: string;
  bg: string;
  headerFont: string;
}[] = [
  { name: "FHGAS Classic Indigo", primary: "#5C61F4", accent: "#FFB800", bg: "#F8FAFC", headerFont: "Inter" },
  { name: "Emerald Hospitality", primary: "#059669", accent: "#10B981", bg: "#F0FDF4", headerFont: "Plus Jakarta Sans" },
  { name: "Royal Purple Luxury", primary: "#7C3AED", accent: "#F43F5E", bg: "#FAF5FF", headerFont: "Outfit" },
  { name: "Oceanic Resort Cyan", primary: "#0284C7", accent: "#06B6D4", bg: "#F0F9FF", headerFont: "Poppins" },
  { name: "Golden Amber Executive", primary: "#D97706", accent: "#F59E0B", bg: "#FFFBEB", headerFont: "Montserrat" },
  { name: "Crimson Ruby Elite", primary: "#E11D48", accent: "#FB7185", bg: "#FFF1F2", headerFont: "Inter" },
  { name: "Slate Minimalist Monochrome", primary: "#334155", accent: "#64748B", bg: "#F8FAFC", headerFont: "Roboto" },
];

const DEFAULT_LOGIN_BACKGROUND = "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=2400&q=85";

export default function ThemeCustomizerPage() {
  const { notify, confirmAction } = useAppNotifications();
  const { theme, updateTheme, saveTheme, resetTheme, loading } = useTheme();
  const [draft, setDraft] = useState<ThemeConfig>(theme);
  const [saving, setSaving] = useState(false);
  
  const logoInputRef = useRef<HTMLInputElement>(null);
  const loginBackgroundInputRef = useRef<HTMLInputElement>(null);
  const mobileLoginBackgroundInputRef = useRef<HTMLInputElement>(null);
  const fontInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!loading) {
      setDraft(theme);
    }
  }, [loading, theme]);

  const handleChange = (key: keyof ThemeConfig, value: string) => {
    const updated = { ...draft, [key]: value };
    setDraft(updated);
    // Real-time preview: updates the live document immediately
    updateTheme({ [key]: value });
  };

  const handleApplyPreset = (preset: typeof PRESET_THEMES[0]) => {
    const updated = {
      ...draft,
      primaryColor: preset.primary,
      accentColor: preset.accent,
      backgroundColor: preset.bg,
      headerFont: preset.headerFont,
    };
    setDraft(updated);
    updateTheme(updated);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      notify("Ukuran logo maksimal 2MB.", "warning");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (base64) {
        handleChange("logoUrl", base64);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleLoginBackgroundUpload = (
    event: React.ChangeEvent<HTMLInputElement>,
    setting: "loginBackgroundUrl" | "mobileLoginBackgroundUrl"
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      notify("Ukuran gambar login maksimal 5MB.", "warning");
      event.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      const dataUrl = loadEvent.target?.result as string;
      if (dataUrl) handleChange(setting, dataUrl);
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  };

  const handleFontUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Max 3MB for font file
    if (file.size > 3 * 1024 * 1024) {
      notify("Ukuran file font maksimal 3MB.", "warning");
      return;
    }

    // Clean font name from filename
    const cleanFontName = file.name.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9_-]/g, "_");

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Font = event.target?.result as string;
      if (base64Font) {
        const currentFonts = Array.isArray(draft.customFonts) ? [...draft.customFonts] : [];
        const existingIndex = currentFonts.findIndex((f) => f.name.toLowerCase() === cleanFontName.toLowerCase());

        const newFontItem = {
          id: existingIndex >= 0 ? currentFonts[existingIndex].id : `font_${Date.now()}`,
          name: cleanFontName,
          url: base64Font,
        };

        if (existingIndex >= 0) {
          currentFonts[existingIndex] = newFontItem;
        } else {
          currentFonts.push(newFontItem);
        }

        const updated = {
          ...draft,
          customFonts: currentFonts,
          customFontName: cleanFontName,
          customFontUrl: base64Font,
          headerFont: cleanFontName, // auto-select new uploaded font for header
        };

        setDraft(updated);
        updateTheme(updated);
        if (fontInputRef.current) fontInputRef.current.value = "";
        notify(`Font "${cleanFontName}" berhasil ditambahkan ke daftar font yang dapat dipilih!`, "success");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveCustomFont = async (fontName: string) => {
    if (!(await confirmAction(`Hapus font "${fontName}" dari daftar pilihan font?`))) return;
    const currentFonts = (Array.isArray(draft.customFonts) ? draft.customFonts : []).filter(
      (f) => f.name !== fontName
    );

    const updated = {
      ...draft,
      customFonts: currentFonts,
      headerFont: draft.headerFont === fontName ? "Inter" : draft.headerFont,
      bodyFont: draft.bodyFont === fontName ? "Inter" : draft.bodyFont,
      customFontName: draft.customFontName === fontName ? (currentFonts[0]?.name || "") : draft.customFontName,
      customFontUrl: draft.customFontName === fontName ? (currentFonts[0]?.url || "") : draft.customFontUrl,
    };
    setDraft(updated);
    updateTheme(updated);
    notify(`Font "${fontName}" berhasil dihapus.`, "success");
  };

  const handleSave = async () => {
    setSaving(true);
    const ok = await saveTheme(draft);
    setSaving(false);
    if (ok) {
      notify("Konfigurasi UI berhasil disimpan.", "success");
    } else {
      notify("Gagal menyimpan konfigurasi UI.", "error");
    }
  };

  const handleReset = async () => {
    if (!(await confirmAction("Kembalikan seluruh tema ke setelan bawaan sistem?"))) return;
    await resetTheme();
    setDraft(theme);
    notify("Tema berhasil di-reset ke default.", "success");
  };

  // Compile active font options including all custom uploaded fonts
  const customFontList = Array.isArray(draft.customFonts) ? draft.customFonts : [];
  if (draft.customFontName && !customFontList.some((f) => f.name === draft.customFontName)) {
    customFontList.push({ id: "legacy", name: draft.customFontName, url: draft.customFontUrl || "" });
  }

  const availableFontOptions = [
    ...customFontList.map((f) => ({
      value: f.name,
      label: `⭐ ${f.name} (Font Custom Upload)`,
    })),
    ...FONT_OPTIONS,
  ];

  return (
    <div className="space-y-6 w-full pb-16">
      {/* Header Banner */}
      <header className="bg-white border border-slate-100 p-6 rounded-3xl shadow-soft flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-soft transition-colors shrink-0"
            style={{ backgroundColor: draft.primaryColor }}
          >
            <Palette className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-800 tracking-tight">
              UI & Branding Customizer
            </h1>
            <p className="text-xs font-medium text-slate-400 mt-0.5">
              Ubah warna dasar, warna aksen & tombol, upload font sendiri, upload logo/ikon, dan ganti nama aplikasi secara visual
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
          >
            <RotateCcw size={15} />
            Reset Default
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 text-white px-5 py-2.5 rounded-2xl text-xs font-bold shadow-soft transition hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: draft.primaryColor }}
          >
            <Save size={16} /> {saving ? "Menyimpan..." : "Simpan Pengaturan UI"}
          </button>
        </div>
      </header>

      {/* Preset Palette Shortcuts */}
      <div className="bg-white border border-slate-100 p-5 rounded-3xl shadow-soft space-y-3">
        <div className="flex items-center gap-2 text-xs font-extrabold text-slate-800 uppercase tracking-wide">
          <Sparkles size={15} className="text-amber-500" />
          Preset Skema Warna Cepat
        </div>
        <div className="flex flex-wrap gap-2.5">
          {PRESET_THEMES.map((preset) => (
            <button
              key={preset.name}
              type="button"
              onClick={() => handleApplyPreset(preset)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-2xl border border-slate-200 hover:border-slate-400 bg-white text-xs font-bold text-slate-700 transition active:scale-95 shadow-sm"
            >
              <span
                className="w-4 h-4 rounded-full border border-black/10 shrink-0"
                style={{ backgroundColor: preset.primary }}
              />
              <span>{preset.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Color & Branding Settings */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card 1: Branding, App Name & Logo */}
          <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-soft space-y-5">
            <h2 className="text-sm font-extrabold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
              <ImageIcon size={17} className="text-indigo-500" />
              1. Identitas Aplikasi & Logo
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  NAMA APLIKASI *
                </label>
                <input
                  type="text"
                  value={draft.appName}
                  onChange={(e) => handleChange("appName", e.target.value)}
                  placeholder="Contoh: FHGAS Portal"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  SUBTITLE / SLOGAN *
                </label>
                <input
                  type="text"
                  value={draft.appSubtitle}
                  onChange={(e) => handleChange("appSubtitle", e.target.value)}
                  placeholder="Contoh: Management System"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Logo / Icon Uploader */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                LOGO / ICON APLIKASI (SIDEBAR & HEADER)
              </label>
              <div className="flex items-center gap-4 p-4 border border-slate-200 rounded-2xl bg-slate-50">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-soft shrink-0 overflow-hidden"
                  style={{ backgroundColor: draft.primaryColor }}
                >
                  {draft.logoUrl ? (
                    <img
                      src={draft.logoUrl}
                      alt="App Logo"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <ImageIcon className="w-6 h-6 text-white" />
                  )}
                </div>

                <div className="flex-1 space-y-1.5">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => logoInputRef.current?.click()}
                      className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-1.5 transition"
                    >
                      <UploadCloud size={14} /> Upload Gambar Logo
                    </button>
                    {draft.logoUrl && (
                      <button
                        type="button"
                        onClick={() => handleChange("logoUrl", "")}
                        className="px-3 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl text-xs font-bold transition"
                      >
                        Hapus Logo (Gunakan Icon Default)
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Format PNG, JPG, SVG, atau WebP (Maks 2MB).
                  </p>
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-5">
              <label className="mb-2 block text-xs font-bold text-slate-700">
                BACKGROUND LOGIN DESKTOP
              </label>
              <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:p-4">
                <div
                  className="h-28 w-full rounded-xl border border-slate-200 bg-cover bg-center sm:h-36"
                  style={{ backgroundImage: `url(${draft.loginBackgroundUrl || DEFAULT_LOGIN_BACKGROUND})` }}
                />
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => loginBackgroundInputRef.current?.click()}
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100"
                  >
                    <UploadCloud size={14} /> Upload background
                  </button>
                  {draft.loginBackgroundUrl && (
                    <button
                      type="button"
                      onClick={() => handleChange("loginBackgroundUrl", "")}
                      className="rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100"
                    >
                      Gunakan foto default
                    </button>
                  )}
                </div>
                <p className="text-[11px] leading-5 text-slate-500">Format gambar JPG, PNG, atau WebP. Maksimal 5MB. Foto ini menjadi latar penuh pada halaman login desktop.</p>
                <input
                  ref={loginBackgroundInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(event) => handleLoginBackgroundUpload(event, "loginBackgroundUrl")}
                  className="hidden"
                />
              </div>
            </div>
            <div className="border-t border-slate-100 pt-5">
              <label className="mb-2 block text-xs font-bold text-slate-700">
                BACKGROUND LOGIN MOBILE
              </label>
              <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:p-4">
                <div
                  className="mx-auto h-36 w-24 rounded-xl border border-slate-200 bg-cover bg-center sm:h-44 sm:w-28"
                  style={{ backgroundImage: `url(${draft.mobileLoginBackgroundUrl || draft.loginBackgroundUrl || DEFAULT_LOGIN_BACKGROUND})` }}
                />
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => mobileLoginBackgroundInputRef.current?.click()}
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100"
                  >
                    <UploadCloud size={14} /> Upload background mobile
                  </button>
                  {draft.mobileLoginBackgroundUrl && (
                    <button
                      type="button"
                      onClick={() => handleChange("mobileLoginBackgroundUrl", "")}
                      className="rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100"
                    >
                      Gunakan background desktop
                    </button>
                  )}
                </div>
                <p className="text-[11px] leading-5 text-slate-500">Khusus layar mobile. Jika belum diunggah, background desktop yang digunakan. Maksimal 5MB.</p>
                <input
                  ref={mobileLoginBackgroundInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(event) => handleLoginBackgroundUpload(event, "mobileLoginBackgroundUrl")}
                  className="hidden"
                />
              </div>
            </div>
          </div>

          {/* Card 2: Skema Warna & Tombol Aksen */}
          <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-soft space-y-5">
            <h2 className="text-sm font-extrabold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Palette size={17} className="text-indigo-500" />
              2. Palet Warna UI & Tombol Aksen
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Primary Color */}
              <div className="p-3.5 border border-slate-100 rounded-2xl bg-slate-50 flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-bold text-slate-800">WARNA AKSI UTAMA</div>
                  <div className="text-[11px] text-slate-400">Tombol utama dan menu aktif sidebar</div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={draft.primaryColor}
                    onChange={(e) => handleChange("primaryColor", e.target.value)}
                    className="w-10 h-10 rounded-xl cursor-pointer border border-slate-200 p-0.5 bg-white"
                  />
                  <input
                    type="text"
                    value={draft.primaryColor}
                    onChange={(e) => handleChange("primaryColor", e.target.value)}
                    className="w-20 px-2 py-1 text-xs font-mono font-bold border border-slate-200 rounded-xl text-center bg-white"
                  />
                </div>
              </div>

              {/* Accent Color */}
              <div className="p-3.5 border border-slate-100 rounded-2xl bg-slate-50 flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-bold text-slate-800">WARNA HIGHLIGHT SEKUNDER</div>
                  <div className="text-[11px] text-slate-400">Sorotan sekunder, badge, dan indikator</div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={draft.accentColor || "#FFB800"}
                    onChange={(e) => handleChange("accentColor", e.target.value)}
                    className="w-10 h-10 rounded-xl cursor-pointer border border-slate-200 p-0.5 bg-white"
                  />
                  <input
                    type="text"
                    value={draft.accentColor || "#FFB800"}
                    onChange={(e) => handleChange("accentColor", e.target.value)}
                    className="w-20 px-2 py-1 text-xs font-mono font-bold border border-slate-200 rounded-xl text-center bg-white"
                  />
                </div>
              </div>

              {/* Background Color */}
              <div className="p-3.5 border border-slate-100 rounded-2xl bg-slate-50 flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-bold text-slate-800">WARNA DASAR (BACKGROUND)</div>
                  <div className="text-[11px] text-slate-400">Latar belakang seluruh halaman</div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={draft.backgroundColor}
                    onChange={(e) => handleChange("backgroundColor", e.target.value)}
                    className="w-10 h-10 rounded-xl cursor-pointer border border-slate-200 p-0.5 bg-white"
                  />
                  <input
                    type="text"
                    value={draft.backgroundColor}
                    onChange={(e) => handleChange("backgroundColor", e.target.value)}
                    className="w-20 px-2 py-1 text-xs font-mono font-bold border border-slate-200 rounded-xl text-center bg-white"
                  />
                </div>
              </div>

              {/* Text Color */}
              <div className="p-3.5 border border-slate-100 rounded-2xl bg-slate-50 flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-bold text-slate-800">WARNA TEKS UTAMA</div>
                  <div className="text-[11px] text-slate-400">Warna font teks & judul</div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={draft.textColor}
                    onChange={(e) => handleChange("textColor", e.target.value)}
                    className="w-10 h-10 rounded-xl cursor-pointer border border-slate-200 p-0.5 bg-white"
                  />
                  <input
                    type="text"
                    value={draft.textColor}
                    onChange={(e) => handleChange("textColor", e.target.value)}
                    className="w-20 px-2 py-1 text-xs font-mono font-bold border border-slate-200 rounded-xl text-center bg-white"
                  />
                </div>
              </div>

              {/* Card Background Color */}
              <div className="p-3.5 border border-slate-100 rounded-2xl bg-slate-50 flex items-center justify-between gap-3 sm:col-span-2">
                <div>
                  <div className="text-xs font-bold text-slate-800">WARNA KARTU & PANEL (CARD BG)</div>
                  <div className="text-[11px] text-slate-400">Latar belakang tabel, form, dan panel kartu</div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={draft.cardBgColor}
                    onChange={(e) => handleChange("cardBgColor", e.target.value)}
                    className="w-10 h-10 rounded-xl cursor-pointer border border-slate-200 p-0.5 bg-white"
                  />
                  <input
                    type="text"
                    value={draft.cardBgColor}
                    onChange={(e) => handleChange("cardBgColor", e.target.value)}
                    className="w-20 px-2 py-1 text-xs font-mono font-bold border border-slate-200 rounded-xl text-center bg-white"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Tipografi & Upload Custom Font */}
          <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-soft space-y-5">
            <h2 className="text-sm font-extrabold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Type size={17} className="text-indigo-500" />
              3. Tipografi & Upload Font Custom Sendiri
            </h2>

            {/* Custom Font Uploader */}
            <div className="p-4 rounded-2xl border-2 border-dashed border-indigo-200 bg-indigo-50/40 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-white border border-indigo-200 flex items-center justify-center text-indigo-600">
                    <FileUp size={18} />
                  </div>
                  <div>
                    <h3 className="text-xs font-extrabold text-slate-800">UPLOAD FONT TYPE SENDIRI</h3>
                    <p className="text-[11px] text-slate-500">Mendukung format file: <strong>.ttf</strong>, <strong>.woff</strong>, <strong>.woff2</strong>, atau <strong>.otf</strong> (Maks 3MB)</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fontInputRef.current?.click()}
                    className="px-4 py-2 bg-[#5C61F4] hover:bg-indigo-600 text-white font-bold text-xs rounded-xl shadow-soft transition flex items-center gap-1.5"
                  >
                    <UploadCloud size={14} /> Pilih File Font
                  </button>
                  <input
                    ref={fontInputRef}
                    type="file"
                    accept=".ttf,.woff,.woff2,.otf"
                    onChange={handleFontUpload}
                    className="hidden"
                  />
                </div>
              </div>

              {customFontList.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-indigo-100">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                    Daftar Font Custom yang Telah Diupload ({customFontList.length}):
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {customFontList.map((f) => {
                      const isHeader = draft.headerFont === f.name;
                      const isBody = draft.bodyFont === f.name;
                      return (
                        <div
                          key={f.name}
                          className="flex items-center justify-between bg-white border border-slate-200 p-2.5 rounded-xl shadow-xs"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                            <div className="truncate">
                              <span
                                className="font-bold text-xs text-slate-800"
                                style={{ fontFamily: f.name }}
                              >
                                {f.name}
                              </span>
                              <div className="flex gap-1 text-[10px] text-slate-400 mt-0.5">
                                {isHeader && <span className="text-indigo-600 font-bold bg-indigo-50 px-1.5 py-0.2 rounded">Header</span>}
                                {isBody && <span className="text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.2 rounded">Body</span>}
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveCustomFont(f.name)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition shrink-0 ml-2"
                            title="Hapus Font ini"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  FONT KHUSUS HEADER / JUDUL (H1 - H6) *
                </label>
                <select
                  value={draft.headerFont}
                  onChange={(e) => handleChange("headerFont", e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-2xl text-xs font-bold bg-white text-slate-800 focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  {availableFontOptions.map((f) => (
                    <option key={f.value} value={f.value}>
                      {f.label}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  Mempengaruhi semua judul halaman, label modul, dan kartu banner.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  FONT BODY / KONTEN UMUM *
                </label>
                <select
                  value={draft.bodyFont}
                  onChange={(e) => handleChange("bodyFont", e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-2xl text-xs font-bold bg-white text-slate-800 focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  {availableFontOptions.map((f) => (
                    <option key={f.value} value={f.value}>
                      {f.label}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  Mempengaruhi tabel data, paragraf, tombol, dan isi formulir.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Interactive Preview */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-soft space-y-4 sticky top-6">
            <h3 className="text-sm font-extrabold text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
              <Layout size={16} className="text-indigo-500" />
              Live Preview Komponen
            </h3>

            {/* Preview Banner */}
            <div
              className="p-4 rounded-2xl border border-slate-100 shadow-sm space-y-2"
              style={{ backgroundColor: draft.cardBgColor }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-soft shrink-0 overflow-hidden"
                  style={{ backgroundColor: draft.primaryColor }}
                >
                  {draft.logoUrl ? (
                    <img src={draft.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <Sparkles className="w-5 h-5 text-white" />
                  )}
                </div>
                <div>
                  <h4
                    className="font-extrabold text-sm"
                    style={{ fontFamily: draft.headerFont, color: draft.textColor }}
                  >
                    {draft.appName || "FHGAS Portal"}
                  </h4>
                  <p className="text-[11px] text-slate-400 font-medium">
                    {draft.appSubtitle || "Management System"}
                  </p>
                </div>
              </div>
            </div>

            {/* Preview Buttons & Badges */}
            <div className="space-y-2 pt-2">
              <div className="text-[11px] font-bold text-slate-400 uppercase">Gaya Tombol & Aksen:</div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white shadow-soft transition"
                  style={{ backgroundColor: draft.primaryColor }}
                >
                  Tombol Utama (Primary)
                </button>
                <button
                  type="button"
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white shadow-soft transition"
                  style={{ backgroundColor: draft.accentColor || "#FFB800" }}
                >
                  Tombol Aksen (Accent)
                </button>
                <span
                  className="px-3 py-1.5 rounded-xl text-xs font-bold"
                  style={{
                    backgroundColor: `${draft.accentColor || "#FFB800"}20`,
                    color: draft.accentColor || "#FFB800",
                  }}
                >
                  Badge Aksen
                </span>
              </div>
            </div>

            {/* Typography Preview */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="text-[11px] font-bold text-slate-400 uppercase">Contoh Tipografi Font:</div>
              <div className="space-y-1">
                <h5
                  className="text-base font-extrabold"
                  style={{ fontFamily: draft.headerFont, color: draft.textColor }}
                >
                  Header Preview ({draft.headerFont})
                </h5>
                <p
                  className="text-xs leading-relaxed"
                  style={{ fontFamily: draft.bodyFont, color: draft.textColor }}
                >
                  Ini adalah contoh tampilan teks isi, tabel, form, dan deskripsi menggunakan font{" "}
                  <strong>{draft.bodyFont}</strong>.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
