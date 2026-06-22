// src/components/auth/AuthShell.tsx

"use client";
import Image from "next/image";
import { Sun, Moon } from "lucide-react";
import { useApp } from "@/components/AppContext";
import type { AuthMode } from "./types";

// ─── Global styles: fonts, keyframes, reduced-motion ──────────────────────
export const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Sora:wght@600;700;800&display=swap');

  .font-display { font-family: 'Sora', ui-sans-serif, system-ui, sans-serif; }

  @keyframes fadeUp  { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
  @keyframes pop     { 0% { transform:scale(.85); opacity:0; } 100% { transform:scale(1); opacity:1; } }
  @keyframes shake   { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-5px)} 40%{transform:translateX(5px)} 60%{transform:translateX(-3px)} 80%{transform:translateX(3px)} }
  @keyframes kdSpin  { to { transform: rotate(360deg); } }

  .kd-animate-fadeUp { animation: fadeUp .4s ease both; }
  .kd-animate-pop    { animation: pop .35s ease both; }
  .kd-animate-shake  { animation: shake .35s ease; }
  .kd-spin           { animation: kdSpin .7s linear infinite; }

  .kd-input::placeholder { color: var(--kd-placeholder); }

  @media (prefers-reduced-motion: reduce) {
    .kd-animate-fadeUp, .kd-animate-pop, .kd-animate-shake { animation: none !important; }
  }
`;

// ─── Shell: ikut konvensi kd-shell/kd-page yang sama dengan dashboard ──────
// NB: sengaja TIDAK pakai class "kd-body" — class itu punya padding-bottom
// khusus untuk memberi ruang BottomNav di dashboard. Login tidak punya
// BottomNav, jadi kita pakai flex polos (default alignItems: stretch) agar
// AuthCard mengisi penuh kiri-kanan-bawah, sesuai desain.
export function AuthShell({ children }: { children: React.ReactNode }) {
  const { colors } = useApp();
  return (
    <div className="kd-shell" style={{ background: colors.bg }}>
      <style>{GLOBAL_CSS}</style>
      <div className="kd-page">
        <TopControls />
        <main style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          {children}
        </main>
      </div>
    </div>
  );
}

// ─── Top bar: language switch + theme switch ──────────────────────────────
function TopControls() {
  return (
    <div
      style={{
        display:        "flex",
        alignItems:     "center",
        justifyContent: "flex-end",
        gap:            "var(--sp-xs)",
        padding:        "calc(env(safe-area-inset-top, 0px) + var(--sp-md)) var(--page-pad) 0",
      }}
    >
      <LangToggle />
      <ThemeToggle />
    </div>
  );
}

function LangToggle() {
  const { lang, setLang, colors } = useApp();
  return (
    <div
      style={{
        display:      "flex",
        borderRadius: 100,
        background:   colors.surface,
        border:       `1px solid ${colors.border}`,
        padding:      3,
        gap:          2,
      }}
    >
      {(["id", "en"] as const).map((l) => {
        const active = lang === l;
        return (
          <button
            key={l}
            type="button"
            onClick={() => setLang(l)}
            aria-pressed={active}
            style={{
              padding:       "5px 12px",
              borderRadius:  100,
              border:        "none",
              cursor:        "pointer",
              background:    active ? colors.primary : "transparent",
              color:         active ? colors.bg : colors.textBody,
              fontSize:      "var(--fs-xs)",
              fontWeight:    700,
              letterSpacing: 0.2,
              transition:    "all 0.18s ease",
              fontFamily:    "inherit",
            }}
          >
            {l === "id" ? "ID" : "UK"}
          </button>
        );
      })}
    </div>
  );
}

function ThemeToggle() {
  const { theme, setTheme, colors } = useApp();
  const isDark = theme === "dark";
  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      style={{
        width:        46,
        height:       26,
        borderRadius: 100,
        border:       `1px solid ${colors.border}`,
        background:   colors.surface,
        position:     "relative",
        cursor:       "pointer",
        padding:      0,
        flexShrink:   0,
      }}
    >
      <span
        style={{
          position:       "absolute",
          top:            2,
          left:           isDark ? 23 : 2,
          width:          20,
          height:         20,
          borderRadius:   "50%",
          background:     colors.primary,
          display:        "flex",
          alignItems:     "center",
          justifyContent: "center",
          transition:     "left 0.2s ease",
        }}
      >
        {isDark ? <Moon size={11} color={colors.bg} /> : <Sun size={11} color={colors.bg} />}
      </span>
    </button>
  );
}

// ─── Logo block ─────────────────────────────────────────────────────────
export function LogoBlock() {
  const { theme } = useApp();
  return (
    <div style={{ display: "flex", justifyContent: "center", padding: "var(--sp-sm) var(--page-pad) var(--sp-lg)" }}>
      <Image
        src={theme === "dark" ? "/logo-darkmode.png" : "/logo-lightmode.png"}
        alt="KampDer"
        width={170}
        height={95}
        style={{ objectFit: "contain", width: "clamp(125px, 22vw, 170px)", height: "auto" }}
        priority
      />
    </div>
  );
}

// ─── Card: full-bleed kiri-kanan-bawah, sesuai mockup ─────────────────────
export function AuthCard({ children }: { children: React.ReactNode }) {
  const { colors } = useApp();
  return (
    <div
      className="kd-animate-fadeUp"
      style={{
        width:                "100%",
        flex:                 1,
        display:              "flex",
        flexDirection:        "column",
        background:           colors.surface,
        border:               `1px solid ${colors.border}`,
        borderBottom:         "none",
        borderLeft:           "none",
        borderRight:          "none",
        borderTopLeftRadius:  "calc(var(--card-radius) * 1.6)",
        borderTopRightRadius: "calc(var(--card-radius) * 1.6)",
        padding:              "var(--sp-lg) var(--page-pad) calc(env(safe-area-inset-bottom, 0px) + var(--sp-xl))",
      }}
    >
      {children}
    </div>
  );
}

// ─── Tab switcher: Masuk / Daftar ─────────────────────────────────────────
export function TabSwitcher({
  active, onChange,
}: { active: "login" | "register"; onChange: (m: AuthMode) => void }) {
  const { t, colors } = useApp();
  return (
    <div
      style={{
        display:      "flex",
        padding:      4,
        borderRadius: 100,
        background:   colors.bg,
        border:       `1px solid ${colors.border}`,
        marginBottom: "var(--sp-lg)",
      }}
    >
      {([
        { key: "login", label: t("Masuk", "Sign in") },
        { key: "register", label: t("Daftar", "Sign up") },
      ] as const).map((tab) => {
        const isActive = active === tab.key;
        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onChange(tab.key)}
            style={{
              flex:         1,
              padding:      "var(--sp-xs) 0",
              borderRadius: 100,
              border:       "none",
              cursor:       "pointer",
              background:   isActive ? colors.surface2 : "transparent",
              color:        isActive ? colors.textPrimary : colors.textMuted,
              fontWeight:   600,
              fontSize:     "var(--fs-base)",
              fontFamily:   "inherit",
              transition:   "all 0.18s ease",
            }}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}