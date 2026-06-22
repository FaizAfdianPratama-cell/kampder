// src/components/LoadingScreen.tsx

"use client";
import { useEffect, useState, useRef } from "react";
import Image from "next/image";

interface Props {
  onDone: () => void;
}

const PHRASES = [
  "Atur jadwal, catat keuangan.",
  "Fokus belajar, tanpa drama.",
  "Semua terorganisir. Siap belajar!",
];

// Decorative background icons related to Kampder's core features
// (Jadwal, Keuangan, Tugas) — purely visual, very low opacity.
type IconName = "calendar" | "clock" | "wallet" | "book" | "checklist" | "coin" | "cap";

const BG_ICONS: { icon: IconName; top: string; left: string; size: number; rotate: number; opacity: number }[] = [
  { icon: "calendar",  top: "6%",  left: "10%", size: 46, rotate: -14, opacity: 0.16 },
  { icon: "clock",     top: "5%",  left: "68%", size: 30, rotate: 12,  opacity: 0.14 },
  { icon: "wallet",    top: "14%", left: "84%", size: 48, rotate: 8,   opacity: 0.15 },
  { icon: "book",      top: "20%", left: "4%",  size: 34, rotate: 10,  opacity: 0.13 },
  { icon: "coin",      top: "30%", left: "90%", size: 26, rotate: -6,  opacity: 0.14 },
  { icon: "checklist", top: "26%", left: "20%", size: 30, rotate: -16, opacity: 0.10 },
  { icon: "cap",       top: "38%", left: "6%",  size: 36, rotate: 9,   opacity: 0.13 },
  { icon: "clock",     top: "44%", left: "88%", size: 28, rotate: -10, opacity: 0.14 },
  { icon: "coin",      top: "58%", left: "8%",  size: 24, rotate: 14,  opacity: 0.13 },
  { icon: "wallet",    top: "62%", left: "84%", size: 32, rotate: -8,  opacity: 0.13 },
  { icon: "book",      top: "72%", left: "9%",  size: 44, rotate: -10, opacity: 0.16 },
  { icon: "checklist", top: "78%", left: "76%", size: 38, rotate: 14,  opacity: 0.15 },
  { icon: "cap",       top: "84%", left: "16%", size: 32, rotate: -9,  opacity: 0.13 },
  { icon: "calendar",  top: "88%", left: "66%", size: 30, rotate: 16,  opacity: 0.12 },
  { icon: "clock",     top: "92%", left: "30%", size: 26, rotate: -18, opacity: 0.12 },
  { icon: "coin",      top: "10%", left: "40%", size: 22, rotate: 6,   opacity: 0.10 },
];

function BgIcon({ icon, size }: { icon: IconName; size: number }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "#88AEF2",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  switch (icon) {
    case "calendar":
      return (
        <svg {...common}>
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <line x1="3" y1="9" x2="21" y2="9" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="16" y1="2" x2="16" y2="6" />
        </svg>
      );
    case "clock":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <polyline points="12 7 12 12 15.5 14" />
        </svg>
      );
    case "wallet":
      return (
        <svg {...common}>
          <path d="M3 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" />
          <path d="M16 12h3" />
          <circle cx="16.4" cy="12" r="0.6" fill="#88AEF2" stroke="none" />
        </svg>
      );
    case "book":
      return (
        <svg {...common}>
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
        </svg>
      );
    case "checklist":
      return (
        <svg {...common}>
          <path d="M9 6h11" />
          <path d="M9 12h11" />
          <path d="M9 18h11" />
          <path d="m3 6 1 1 2-2" />
          <path d="m3 12 1 1 2-2" />
          <path d="m3 18 1 1 2-2" />
        </svg>
      );
    case "coin":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M9.4 9.3c0-1 1.1-1.7 2.6-1.7s2.6.7 2.6 1.5c0 2-5.2 1.4-5.2 3.5 0 .9 1.1 1.5 2.6 1.5s2.6-.7 2.6-1.7" />
          <line x1="12" y1="6.2" x2="12" y2="17.8" />
        </svg>
      );
    case "cap":
      return (
        <svg {...common}>
          <path d="m2 9 10-5 10 5-10 5-10-5Z" />
          <path d="M6 11v5c0 1.5 3 3 6 3s6-1.5 6-3v-5" />
          <path d="M22 9v6" />
        </svg>
      );
    default:
      return null;
  }
}

export default function LoadingScreen({ onDone }: Props) {
  const [visible,     setVisible]     = useState(false);
  const [fadeOut,     setFadeOut]     = useState(false);
  const [displayText, setDisplayText] = useState("");
  const [chipsIn,     setChipsIn]     = useState(false);
  const doneRef = useRef(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 60);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setChipsIn(true), 800);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    let cancelled = false;
    let phraseIndex = 0;

    const typePhrase = (phrase: string, cb: () => void) => {
      let i = 0;
      const interval = setInterval(() => {
        if (cancelled) return clearInterval(interval);
        setDisplayText(phrase.slice(0, ++i));
        if (i >= phrase.length) { clearInterval(interval); setTimeout(cb, 800); }
      }, 38);
    };

    const erasePhrase = (cb: () => void) => {
      let cur = 0;
      setDisplayText(p => { cur = p.length; return p; });
      setTimeout(() => {
        const interval = setInterval(() => {
          if (cancelled) return clearInterval(interval);
          cur--;
          setDisplayText(p => p.slice(0, cur));
          if (cur <= 0) { clearInterval(interval); cb(); }
        }, 22);
      }, 0);
    };

    const cycle = () => {
      if (cancelled) return;
      typePhrase(PHRASES[phraseIndex], () => {
        if (cancelled) return;
        if (phraseIndex === PHRASES.length - 1) return;
        erasePhrase(() => { phraseIndex++; cycle(); });
      });
    };

    const t = setTimeout(cycle, 700);
    return () => { cancelled = true; clearTimeout(t); };
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      if (!doneRef.current) {
        doneRef.current = true;
        setFadeOut(true);
        setTimeout(onDone, 600);
      }
    }, 7000);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div
      style={{
        position:       "fixed",
        inset:          0,
        zIndex:         9999,
        background:     "#0C1118",
        display:        "flex",
        alignItems:     "center",
        justifyContent: "center",
        overflow:       "hidden",
        opacity:        fadeOut ? 0 : 1,
        transition:     "opacity 0.6s ease",
        pointerEvents:  fadeOut ? "none" : "all",
        padding:        "env(safe-area-inset-top, 0px) env(safe-area-inset-right, 0px) env(safe-area-inset-bottom, 0px) env(safe-area-inset-left, 0px)",
      }}
    >
      <style>{`
        @keyframes logoIn {
          0%   { opacity: 0; transform: scale(0.78); }
          55%  { opacity: 1; transform: scale(1.05); }
          75%  { transform: scale(0.97); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes floatUp {
          0%   { opacity: 0; transform: translateY(12px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes cursorBlink {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0; }
        }
        @keyframes softPulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.75; }
        }
        @keyframes chipIn {
          0%   { opacity: 0; transform: translateY(8px) scale(0.92); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes bgIconDrift {
          0%, 100% { transform: translateY(0) rotate(var(--r)); }
          50%      { transform: translateY(-6px) rotate(var(--r)); }
        }
        .kd-chip { opacity: 0; }
        .kd-chip-visible { animation: chipIn 0.4s ease forwards; }
        .kd-bg-icon { animation: bgIconDrift 6s ease-in-out infinite; }
      `}</style>

      {/* Decorative corner circles */}
      <div
        style={{
          position:    "absolute",
          top:         0,
          right:       0,
          width:       "min(420px, 110vw)",
          height:      "min(420px, 110vw)",
          borderRadius: "50%",
          background:  "#161E30",
          transform:   "translate(35%, -42%)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position:    "absolute",
          bottom:      0,
          left:        0,
          width:       "min(420px, 110vw)",
          height:      "min(420px, 110vw)",
          borderRadius: "50%",
          background:  "#161E30",
          transform:   "translate(-35%, 42%)",
          pointerEvents: "none",
        }}
      />

      {/* Decorative background icons (Jadwal / Keuangan / Tugas themed) */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        {BG_ICONS.map(({ icon, top, left, size, rotate, opacity }, i) => (
          <div
            key={`${icon}-${i}`}
            className="kd-bg-icon"
            style={{
              position: "absolute",
              top,
              left,
              opacity,
              // @ts-expect-error custom property used by bgIconDrift keyframes
              "--r": `${rotate}deg`,
              transform: `rotate(${rotate}deg)`,
              animationDelay: `${i * 0.4}s`,
            }}
          >
            <BgIcon icon={icon} size={size} />
          </div>
        ))}
      </div>

      <div style={{
        position:       "relative",
        zIndex:         1,
        display:        "flex",
        flexDirection:  "column",
        alignItems:     "center",
        width:          "100%",
        maxWidth:       320,
        padding:        "0 var(--page-pad, 24px)",
      }}>

        {/* Logo */}
        <div
          style={{
            marginBottom: "clamp(24px, 5vw, 40px)",
            opacity:   visible ? 1 : 0,
            animation: visible
              ? "logoIn 0.8s cubic-bezier(0.34,1.56,0.64,1) 0.1s both, softPulse 3s ease-in-out 1s infinite"
              : "none",
          }}
        >
          <Image
            src="/logo-darkmode.png"
            alt="Kampder"
            width={140}
            height={140}
            style={{ objectFit: "contain", display: "block", width: "clamp(100px, 28vw, 140px)", height: "auto" }}
            priority
          />
        </div>

        {/* Typewriter */}
        <div
          style={{
            height:          "clamp(18px, 4vw, 24px)",
            display:         "flex",
            alignItems:      "center",
            justifyContent:  "center",
            marginBottom:    "clamp(18px, 4vw, 28px)",
            opacity:         visible ? 1 : 0,
            animation:       visible ? "floatUp 0.4s ease 0.5s both" : "none",
          }}
        >
          <span style={{ fontSize: "clamp(14px, 3.6vw, 16px)", color: "#FFFFFF", fontWeight: 700, letterSpacing: 0.1 }}>
            {displayText}
          </span>
          <span style={{
            display:        "inline-block",
            width:          1.5,
            height:         "clamp(13px, 3.6vw, 17px)",
            background:     "#4B8EF1",
            marginLeft:     2,
            verticalAlign:  "middle",
            animation:      "cursorBlink 0.9s ease infinite",
          }} />
        </div>

        {/* Feature chips */}
        <div style={{ display: "flex", gap: "clamp(6px, 2vw, 10px)" }}>
          {["Jadwal", "Keuangan", "Tugas"].map((label, idx) => (
            <span
              key={label}
              className={`kd-chip${chipsIn ? " kd-chip-visible" : ""}`}
              style={{
                display:        "flex",
                alignItems:     "center",
                padding:        "clamp(7px, 1.8vw, 9px) clamp(14px, 3.5vw, 18px)",
                borderRadius:   100,
                fontSize:       "clamp(12px, 3vw, 14px)",
                fontWeight:     600,
                color:          "#FFFFFF",
                background:     "#161E30",
                border:         "1px solid rgba(255,255,255,0.06)",
                animationDelay: `${idx * 0.15}s`,
                whiteSpace:     "nowrap",
              }}
            >
              {label}
            </span>
          ))}
        </div>

      </div>
    </div>
  );
}