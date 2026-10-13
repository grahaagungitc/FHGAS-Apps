import { NextResponse } from "next/server";
import { db } from "@/lib/db";

const DEFAULT_THEME = {
  appName: "FHGAS Portal",
  appSubtitle: "Management System",
  logoUrl: "", // Empty means default ShieldCheck icon
  loginBackgroundUrl: "",
  mobileLoginBackgroundUrl: "",
  primaryColor: "#5C61F4", // Brand primary color
  primaryHover: "#4F46E5",
  accentColor: "#FFB800", // Accent color for highlights/badges
  backgroundColor: "#F8FAFC", // Main background
  cardBgColor: "#FFFFFF",
  textColor: "#0F172A",
  headerFont: "Inter", // Inter, Plus Jakarta Sans, Outfit, Poppins, Roboto, Montserrat, Custom
  bodyFont: "Inter",
  codeFont: "monospace",
  borderRadius: "1.5rem", // 1rem, 1.25rem, 1.5rem, 2rem
  customFonts: [] as { id: string; name: string; url: string }[],
  customFontName: "",
  customFontUrl: "", // Base64 or URL data of user uploaded TTF/WOFF/WOFF2 font
};

export async function GET() {
  try {
    const setting = await db.systemSetting.findUnique({
      where: { key: "APP_THEME_CONFIG" },
    });

    if (!setting) {
      return NextResponse.json(DEFAULT_THEME);
    }

    const parsed = JSON.parse(setting.value);
    return NextResponse.json({ ...DEFAULT_THEME, ...parsed });
  } catch (error) {
    console.error("GET /api/setup/theme error:", error);
    return NextResponse.json(DEFAULT_THEME);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const merged = {
      ...DEFAULT_THEME,
      ...body,
    };

    const setting = await db.systemSetting.upsert({
      where: { key: "APP_THEME_CONFIG" },
      update: {
        value: JSON.stringify(merged),
      },
      create: {
        key: "APP_THEME_CONFIG",
        value: JSON.stringify(merged),
      },
    });

    return NextResponse.json({ success: true, theme: merged });
  } catch (error: any) {
    console.error("POST /api/setup/theme error:", error);
    return NextResponse.json(
      { message: error.message || "Gagal menyimpan konfigurasi tampilan." },
      { status: 500 }
    );
  }
}

