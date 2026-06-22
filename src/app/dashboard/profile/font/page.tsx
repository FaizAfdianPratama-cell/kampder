// src/app/dashboard/profile/font/page.tsx
"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check } from "lucide-react";
import { useApp, FONT_LABELS } from "@/components/AppContext";
import type { Font } from "@/components/AppContext";

const FONT_OPTIONS: { value: Font; sub:{id:string;en:string} }[] = [
  { value:"roboto",   sub:{id:"Default · Sans-serif modern",   en:"Default · Modern sans-serif"   } },
  { value:"poppins",  sub:{id:"Bulat · Ramah & bersahabat",    en:"Rounded · Friendly sans-serif" } },
  { value:"playfair", sub:{id:"Elegan · Serif klasik",          en:"Elegant · Classic serif"       } },
  { value:"times",    sub:{id:"Formal · Serif tradisional",     en:"Formal · Traditional serif"    } },
  { value:"calibri",  sub:{id:"Bersih · Office modern",         en:"Clean · Modern office font"    } },
];
const FONT_CSS: Record<Font, string> = {
  roboto:"'Roboto', sans-serif", poppins:"'Poppins', sans-serif",
  playfair:"'Playfair Display', serif", times:"'Times New Roman', Times, serif",
  calibri:"'Calibri', 'Gill Sans', 'Trebuchet MS', sans-serif",
};

export default function GayaHurufPage() {
  const { font, setFont, t, theme, colors } = useApp();
  const router  = useRouter();
  const isDark  = theme === "dark";
  const F: React.CSSProperties = { fontFamily:"var(--app-font, 'Roboto', sans-serif)" };
  const P = { bg:colors.bg, surface:colors.surface, surf2:colors.surface2, border:colors.border, primary:colors.primary, primaryBg:colors.primaryLight, textP:colors.textPrimary, textB:colors.textBody, textM:colors.textMuted, inputBg:isDark?"rgba(255,255,255,0.05)":colors.surface2 };

  return (
    <div style={{ minHeight:"100vh", paddingBottom:40, background:P.bg, ...F }}>
      <div style={{ position:"sticky", top:0, zIndex:50, background:P.surface, borderBottom:`1px solid ${P.border}`, paddingTop:"env(safe-area-inset-top, 0px)" }}>
        <div style={{ padding:"14px 20px", display:"flex", alignItems:"center", gap:12 }}>
          <button onClick={()=>router.back()} style={{ width:36, height:36, borderRadius:10, border:`1px solid ${P.border}`, background:P.inputBg, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <ArrowLeft size={18} color={P.textB}/>
          </button>
          <div>
            <h1 style={{ ...F, fontSize:17, fontWeight:800, color:P.textP, margin:0 }}>{t("Gaya Huruf","Font Style")}</h1>
            <p style={{ ...F, fontSize:11, color:P.textM, margin:"2px 0 0" }}>{t("Pilih gaya huruf aplikasi","Choose app font style")}</p>
          </div>
        </div>
      </div>
      <div style={{ padding:"16px 16px 0", display:"flex", flexDirection:"column", gap:8 }}>
        <div style={{ background:P.surface, border:`1px solid ${P.border}`, borderRadius:18, overflow:"hidden" }}>
          {FONT_OPTIONS.map(({ value, sub }, idx) => {
            const active     = font === value;
            const fontFamily = FONT_CSS[value];
            const label      = FONT_LABELS[value];
            const isLast     = idx === FONT_OPTIONS.length - 1;
            return (
              <button key={value} onClick={()=>setFont(value)} style={{ width:"100%", display:"flex", alignItems:"center", gap:14, padding:"14px 16px", background:active?P.primaryBg:"transparent", border:"none", borderBottom:isLast?"none":`1px solid ${P.border}`, cursor:"pointer", textAlign:"left", transition:"background 0.15s", fontFamily:"inherit" }}>
                {/* Font preview */}
                <div style={{ width:68, height:50, borderRadius:10, flexShrink:0, background:active?P.primaryBg:P.inputBg, border:`1.5px solid ${active?P.primary:P.border}`, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
                  <span style={{ fontFamily, fontSize:14, fontWeight:700, color:active?P.primary:P.textM, lineHeight:1.2 }}>Aa</span>
                  <span style={{ fontFamily, fontSize:10, fontWeight:400, color:active?P.primary:P.textM, lineHeight:1.2, opacity:0.7 }}>Bb Cc</span>
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ fontFamily, fontSize:15, fontWeight:700, color:P.textP, margin:"0 0 3px" }}>{label}</p>
                  <p style={{ ...F, fontSize:11, color:P.textM, margin:0 }}>{t(sub.id,sub.en)}</p>
                  {active && <span style={{ ...F, fontSize:10, fontWeight:700, marginTop:5, display:"inline-block", color:P.primary, background:P.primaryBg, border:`1px solid ${P.primary}30`, borderRadius:6, padding:"2px 8px" }}>{t("Aktif","Active")}</span>}
                </div>
                <div style={{ width:22, height:22, borderRadius:"50%", flexShrink:0, background:active?P.primary:"transparent", border:`2px solid ${active?P.primary:P.border}`, display:"flex", alignItems:"center", justifyContent:"center" }}>
                  {active && <Check size={11} color={isDark?"#0E1117":"#fff"} strokeWidth={3}/>}
                </div>
              </button>
            );
          })}
        </div>
        <p style={{ ...F, fontSize:11, color:P.textM, textAlign:"center", padding:"6px 0 4px" }}>
          {t("Font berlaku untuk seluruh tampilan aplikasi","Font applies across the entire app")}
        </p>
      </div>
    </div>
  );
}