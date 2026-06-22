// src/app/dashboard/profile/theme/page.tsx
"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Moon, Sun } from "lucide-react";
import { useApp } from "@/components/AppContext";
import type { Theme } from "@/components/AppContext";

const OPTIONS: { value: Theme; Icon: React.ElementType; label:{id:string;en:string}; sub:{id:string;en:string}; preview:{bg:string;surface:string;text:string;accent:string} }[] = [
  { value:"dark",  Icon:Moon, label:{id:"Mode Gelap",  en:"Dark Mode" }, sub:{id:"Nyaman untuk belajar malam hari",   en:"Easy on the eyes at night"   }, preview:{bg:"#0E1117",surface:"#1A2235",text:"#EEF2F8",accent:"#7BB8F0"} },
  { value:"light", Icon:Sun,  label:{id:"Mode Terang", en:"Light Mode"}, sub:{id:"Terang dan jelas untuk siang hari", en:"Bright and clear for daytime" }, preview:{bg:"#F4F7FC",surface:"#FFFFFF",text:"#0F1923",accent:"#2E7DD1"} },
];

export default function ThemePage() {
  const { theme, setTheme, t, colors } = useApp();
  const router = useRouter();
  const isDark = theme === "dark";
  const F: React.CSSProperties = { fontFamily:"var(--app-font, 'Roboto', sans-serif)" };

  const P = {
    bg:       colors.bg,
    surface:  colors.surface,
    surf2:    colors.surface2,
    border:   colors.border,
    primary:  colors.primary,
    primaryBg:colors.primaryLight,
    textP:    colors.textPrimary,
    textB:    colors.textBody,
    textM:    colors.textMuted,
    inputBg:  isDark ? "rgba(255,255,255,0.05)" : colors.surface2,
  };

  return (
    <div style={{ minHeight:"100vh", paddingBottom:40, background:P.bg, ...F }}>
      {/* Header */}
      <div style={{ position:"sticky", top:0, zIndex:50, background:P.surface, borderBottom:`1px solid ${P.border}`, paddingTop:"env(safe-area-inset-top, 0px)" }}>
        <div style={{ padding:"14px 20px", display:"flex", alignItems:"center", gap:12 }}>
          <button onClick={()=>router.back()} style={{ width:36, height:36, borderRadius:10, border:`1px solid ${P.border}`, background:P.inputBg, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <ArrowLeft size={18} color={P.textB}/>
          </button>
          <div>
            <h1 style={{ ...F, fontSize:17, fontWeight:800, color:P.textP, margin:0 }}>{t("Tema Tampilan","App Theme")}</h1>
            <p style={{ ...F, fontSize:11, color:P.textM, margin:"2px 0 0" }}>{t("Pilih tampilan yang nyaman untukmu","Pick a look that works for you")}</p>
          </div>
        </div>
      </div>

      <div style={{ padding:"16px 16px 0", display:"flex", flexDirection:"column", gap:8 }}>
        <div style={{ background:P.surface, border:`1px solid ${P.border}`, borderRadius:18, overflow:"hidden" }}>
          {OPTIONS.map(({ value, Icon, label, sub, preview }, idx) => {
            const active = theme === value;
            const isLast = idx === OPTIONS.length - 1;
            return (
              <button key={value} onClick={()=>setTheme(value)}
                style={{ width:"100%", display:"flex", alignItems:"center", gap:14, padding:"16px", border:"none", borderBottom:isLast?"none":`1px solid ${P.border}`, background:active?P.primaryBg:"transparent", cursor:"pointer", textAlign:"left", transition:"background 0.15s", fontFamily:"inherit" }}>

                {/* Mini preview card */}
                <div style={{ width:72, height:52, borderRadius:10, flexShrink:0, background:preview.bg, border:`1.5px solid ${active?P.primary:P.border}`, overflow:"hidden", position:"relative", transition:"border-color 0.15s" }}>
                  <div style={{ position:"absolute", bottom:6, left:6, right:6, height:20, borderRadius:4, background:preview.surface, display:"flex", alignItems:"center", padding:"0 6px", gap:4 }}>
                    <div style={{ width:6, height:6, borderRadius:"50%", background:preview.accent }}/>
                    <div style={{ flex:1, height:3, borderRadius:2, background:preview.text, opacity:0.2 }}/>
                  </div>
                  <div style={{ position:"absolute", top:6, right:6 }}>
                    <Icon size={12} color={preview.accent}/>
                  </div>
                </div>

                {/* Info */}
                <div style={{ flex:1 }}>
                  <p style={{ ...F, fontSize:15, fontWeight:700, color:P.textP, margin:"0 0 3px" }}>{t(label.id,label.en)}</p>
                  <p style={{ ...F, fontSize:12, color:P.textM, margin:0 }}>{t(sub.id,sub.en)}</p>
                  {active && (
                    <span style={{ ...F, fontSize:10, fontWeight:700, marginTop:5, display:"inline-block", color:P.primary, background:P.primaryBg, border:`1px solid ${P.primary}30`, borderRadius:6, padding:"2px 8px" }}>
                      {t("Aktif","Active")}
                    </span>
                  )}
                </div>

                {/* Radio */}
                <div style={{ width:22, height:22, borderRadius:"50%", flexShrink:0, background:active?P.primary:"transparent", border:`2px solid ${active?P.primary:P.border}`, display:"flex", alignItems:"center", justifyContent:"center", transition:"all 0.15s" }}>
                  {active && <Check size={11} color={isDark?"#0E1117":"#fff"} strokeWidth={3}/>}
                </div>
              </button>
            );
          })}
        </div>
        <p style={{ ...F, fontSize:11, color:P.textM, textAlign:"center", padding:"6px 0 4px" }}>
          {t("Tema berubah langsung di semua halaman","Theme changes instantly across all pages")}
        </p>
      </div>
    </div>
  );
}