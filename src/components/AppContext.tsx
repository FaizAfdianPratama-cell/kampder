// src/components/AppContext.tsx

"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type Lang = "id" | "en";
type Theme = "dark" | "light";
type Font = "roboto" | "poppins" | "playfair" | "times" | "calibri";

interface AppContextType {
  lang: Lang;
  setLang: (l: Lang) => void;
  theme: Theme;
  setTheme: (t: Theme) => void;
  font: Font;
  setFont: (f: Font) => void;
  t: (id: string, en: string) => string;
  colors: ColorPalette;
}

interface ColorPalette {
  bg: string; surface: string; surface2: string; border: string;
  primary: string; primaryLight: string; secondary: string;
  accent: string; danger: string; textPrimary: string;
  textBody: string; textMuted: string; navBg: string;
}

const DARK_COLORS: ColorPalette = {
  bg: "#0E1117", surface: "#1A2235", surface2: "#0B1D30", border: "#263147",
  primary: "#7BB8F0", primaryLight: "rgba(123,184,240,0.14)",
  secondary: "#8EC44A", accent: "#F0A030", danger: "#EE8585",
  textPrimary: "#EEF2F8", textBody: "#8DA0B8", textMuted: "#4A5D78", navBg: "#141C2E",
};

const LIGHT_COLORS: ColorPalette = {
  bg: "#F4F7FC", surface: "#FFFFFF", surface2: "#E8F0FA", border: "#D8E3F0",
  primary: "#2E7DD1", primaryLight: "rgba(46,125,209,0.10)",
  secondary: "#5A8F1A", accent: "#C47A10", danger: "#D04040",
  textPrimary: "#0F1923", textBody: "#3A5068", textMuted: "#8AA0B8", navBg: "#FFFFFF",
};

export const FONT_MAP: Record<Font, string> = {
  roboto:  "'Roboto', sans-serif",
  poppins: "'Poppins', sans-serif",
  playfair:"'Playfair Display', serif",
  times:   "'Times New Roman', Times, serif",
  calibri: "'Calibri', 'Gill Sans', 'Trebuchet MS', sans-serif",
};

export const FONT_LABELS: Record<Font, string> = {
  roboto:  "Roboto",
  poppins: "Poppins",
  playfair:"Playfair Display",
  times:   "Times New Roman",
  calibri: "Calibri",
};

const AppContext = createContext<AppContextType>({
  lang: "id", setLang: () => {},
  theme: "dark", setTheme: () => {},
  font: "roboto", setFont: () => {},
  t: (id) => id,
  colors: DARK_COLORS,
});

export function AppProvider({ children }: { children: ReactNode }) {
  const [lang,  setLangState]  = useState<Lang>("id");
  const [theme, setThemeState] = useState<Theme>("dark");
  const [font,  setFontState]  = useState<Font>("roboto");

  // 1. Hydrate from localStorage first (instant, no flash)
  useEffect(() => {
    try {
      const savedLang  = localStorage.getItem("kampder_lang")  as Lang;
      const savedTheme = localStorage.getItem("kampder_theme") as Theme;
      const savedFont  = localStorage.getItem("kampder_font")  as Font;
      if (savedLang)  setLangState(savedLang);
      if (savedTheme) setThemeState(savedTheme);
      if (savedFont)  setFontState(savedFont);
    } catch {}
  }, []);

  // 2. Then fetch from DB — TAPI hanya untuk mengisi preferensi yang BELUM
  //    ada di device ini (mis. login pertama kali di HP baru). Kalau device
  //    ini sudah punya localStorage sendiri, itu dianggap lebih "fresh" dan
  //    DB tidak boleh menimpanya — supaya tema/bahasa yang baru saja dipilih
  //    di halaman login tidak ke-revert ke nilai lama saat pindah ke
  //    dashboard akibat race condition antara PATCH dan GET.
  useEffect(() => {
    let hadLocalFont = false, hadLocalTheme = false, hadLocalLang = false;
    try {
      hadLocalFont  = !!localStorage.getItem("kampder_font");
      hadLocalTheme = !!localStorage.getItem("kampder_theme");
      hadLocalLang  = !!localStorage.getItem("kampder_lang");
    } catch {}

    fetch("/api/profile")
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data) return;
        if (data.fontPreference && !hadLocalFont) {
          const dbFont = data.fontPreference as Font;
          setFontState(dbFont);
          try { localStorage.setItem("kampder_font", dbFont); } catch {}
        }
        if (data.themePreference && !hadLocalTheme) {
          const dbTheme = data.themePreference as Theme;
          setThemeState(dbTheme);
          try { localStorage.setItem("kampder_theme", dbTheme); } catch {}
        }
        if (data.langPreference && !hadLocalLang) {
          const dbLang = data.langPreference as Lang;
          setLangState(dbLang);
          try { localStorage.setItem("kampder_lang", dbLang); } catch {}
        }
      })
      .catch(() => {});
  }, []);

  // Apply theme class to <html>
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // Apply font to CSS variable + body
  useEffect(() => {
    const css = FONT_MAP[font];
    document.documentElement.style.setProperty("--app-font", css);
    document.documentElement.style.fontFamily = css;
    document.body.style.fontFamily = css;
  }, [font]);

  function setLang(l: Lang) {
    setLangState(l);
    try { localStorage.setItem("kampder_lang", l); } catch {}
    // Sync ke DB. keepalive: true — request ini WAJIB tetap selesai walau
    // user langsung pindah halaman (mis. habis toggle bahasa di login lalu
    // langsung klik "Masuk" yang hard-navigate ke /dashboard). Tanpa ini,
    // browser bisa membatalkan request saat unload, jadi DB nggak pernah
    // ke-update dan halaman berikutnya fetch preferensi yang sudah usang.
    fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ langPreference: l }),
      keepalive: true,
    }).catch(() => {});
  }

  function setTheme(newTheme: Theme) {
    setThemeState(newTheme);
    try { localStorage.setItem("kampder_theme", newTheme); } catch {}
    // Sync ke DB juga (keepalive — lihat penjelasan di setLang)
    fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ themePreference: newTheme }),
      keepalive: true,
    }).catch(() => {});
  }

  // setFont: update state + localStorage + DB
  function setFont(f: Font) {
    setFontState(f);
    try { localStorage.setItem("kampder_font", f); } catch {}
    // Sync to DB (keepalive — lihat penjelasan di setLang)
    fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fontPreference: f }),
      keepalive: true,
    }).catch(() => {});
  }

  function t(id: string, en: string) {
    return lang === "id" ? id : en;
  }

  const colors = theme === "dark" ? DARK_COLORS : LIGHT_COLORS;

  return (
    <AppContext.Provider value={{ lang, setLang, theme, setTheme, font, setFont, t, colors }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
export type { Font, Theme, Lang, ColorPalette };