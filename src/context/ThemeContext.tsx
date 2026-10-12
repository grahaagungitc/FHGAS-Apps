"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export interface CustomFontItem {
  id: string;
  name: string;
  url: string; // base64 data url
}

export interface ThemeConfig {
  appName: string;
  appSubtitle: string;
  logoUrl: string;
  primaryColor: string;
  primaryHover: string;
  accentColor: string;
  backgroundColor: string;
  cardBgColor: string;
  textColor: string;
  headerFont: string;
  bodyFont: string;
  codeFont: string;
  borderRadius: string;
  customFonts?: CustomFontItem[];
  customFontName?: string;
  customFontUrl?: string;
}

const defaultTheme: ThemeConfig = {
  appName: "FHGAS Portal",
  appSubtitle: "Management System",
  logoUrl: "",
  primaryColor: "#5C61F4",
  primaryHover: "#4F46E5",
  accentColor: "#FFB800",
  backgroundColor: "#F8FAFC",
  cardBgColor: "#FFFFFF",
  textColor: "#0F172A",
  headerFont: "Inter",
  bodyFont: "Inter",
  codeFont: "monospace",
  borderRadius: "1.5rem",
  customFonts: [],
  customFontName: "",
  customFontUrl: "",
};

interface ThemeContextType {
  theme: ThemeConfig;
  updateTheme: (newTheme: Partial<ThemeConfig>) => void;
  saveTheme: (themeToSave: ThemeConfig) => Promise<boolean>;
  resetTheme: () => Promise<void>;
  loading: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: defaultTheme,
  updateTheme: () => {},
  saveTheme: async () => false,
  resetTheme: async () => {},
  loading: true,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<ThemeConfig>(defaultTheme);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTheme();
  }, []);

  const fetchTheme = async () => {
    try {
      const res = await fetch("/api/setup/theme");
      if (res.ok) {
        const data = await res.json();
        setTheme(data);
        applyThemeStyles(data);
      }
    } catch (err) {
      console.error("Gagal memuat tema:", err);
    } finally {
      setLoading(false);
    }
  };

  const applyThemeStyles = (t: ThemeConfig) => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;

    root.style.setProperty("--primary-color", t.primaryColor);
    root.style.setProperty("--primary-hover", t.primaryHover);
    root.style.setProperty("--accent-color", t.accentColor || "#FFB800");
    root.style.setProperty("--bg-color", t.backgroundColor);
    root.style.setProperty("--card-bg", t.cardBgColor);
    root.style.setProperty("--text-color", t.textColor);
    root.style.setProperty("--header-font", t.headerFont);
    root.style.setProperty("--body-font", t.bodyFont);
    root.style.setProperty("--code-font", t.codeFont);
    root.style.setProperty("--border-radius", t.borderRadius);

    // Inject custom uploaded fonts if present
    const customStyleId = "custom-user-font-style";
    let styleTag = document.getElementById(customStyleId) as HTMLStyleElement | null;
    
    // Collect all custom fonts (support both customFonts array and legacy customFontUrl)
    const fontList: { name: string; url: string }[] = [];
    if (Array.isArray(t.customFonts)) {
      t.customFonts.forEach((f) => {
        if (f.name && f.url) fontList.push(f);
      });
    }
    if (t.customFontName && t.customFontUrl && !fontList.some((f) => f.name === t.customFontName)) {
      fontList.push({ name: t.customFontName, url: t.customFontUrl });
    }

    if (fontList.length > 0) {
      if (!styleTag) {
        styleTag = document.createElement("style");
        styleTag.id = customStyleId;
        document.head.appendChild(styleTag);
      }
      styleTag.textContent = fontList
        .map(
          (f) => `
        @font-face {
          font-family: '${f.name}';
          src: url('${f.url}') format('truetype');
          font-weight: normal;
          font-style: normal;
          font-display: swap;
        }
      `
        )
        .join("\n");
    } else if (styleTag) {
      styleTag.textContent = "";
    }

    // Apply directly to body
    document.body.style.backgroundColor = t.backgroundColor;
    document.body.style.color = t.textColor;
    document.body.style.fontFamily = `'${t.bodyFont}', system-ui, -apple-system, sans-serif`;
  };

  const updateTheme = (newValues: Partial<ThemeConfig>) => {
    const next = { ...theme, ...newValues };
    setTheme(next);
    applyThemeStyles(next);
  };

  const saveTheme = async (themeToSave: ThemeConfig) => {
    try {
      const res = await fetch("/api/setup/theme", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(themeToSave),
      });
      if (res.ok) {
        setTheme(themeToSave);
        applyThemeStyles(themeToSave);
        return true;
      }
      return false;
    } catch (err) {
      console.error("Gagal menyimpan tema:", err);
      return false;
    }
  };

  const resetTheme = async () => {
    await saveTheme(defaultTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, updateTheme, saveTheme, resetTheme, loading }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);

