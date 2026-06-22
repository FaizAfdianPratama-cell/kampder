// src/app/dashboard/profile/language/page.tsx
"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check } from "lucide-react";
import { useApp } from "@/components/AppContext";

const OPTIONS = [
  { value:"id" as const, flag:"🇮🇩", label:"Bahasa Indonesia", sub:"Untuk pengguna di Indonesia" },
  { value:"en" as const, flag:"🇬🇧", label:"English",          sub:"For international users"     },
];

export default function BahasaPage() {
  const { lang, setLang, t, theme, colors } = useApp();
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
            <h1 style={{ ...F, fontSize:17, fontWeight:800, color:P.textP, margin:0 }}>{t("Pilih Bahasa","Choose Language")}</h1>
            <p style={{ ...F, fontSize:11, color:P.textM, margin:"2px 0 0" }}>{t("Bahasa tampilan seluruh aplikasi","Display language for the entire app")}</p>
          </div>
        </div>
      </div>
      <div style={{ padding:"16px 16px 0", display:"flex", flexDirection:"column", gap:8 }}>
        <div style={{ background:P.surface, border:`1px solid ${P.border}`, borderRadius:18, overflow:"hidden" }}>
          {OPTIONS.map((opt, idx) => {
            const active = lang === opt.value;
            const isLast = idx === OPTIONS.length - 1;
            return (
              <button key={opt.value} onClick={()=>setLang(opt.value)} style={{ width:"100%", display:"flex", alignItems:"center", gap:14, padding:"16px", border:"none", borderBottom:isLast?"none":`1px solid ${P.border}`, background:active?P.primaryBg:"transparent", cursor:"pointer", textAlign:"left", transition:"background 0.15s", fontFamily:"inherit" }}>
                <div style={{ width:52, height:52, borderRadius:14, flexShrink:0, background:active?P.primaryBg:P.inputBg, border:`1.5px solid ${active?P.primary:P.border}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:26 }}>
                  {opt.flag}
                </div>
                <div style={{ flex:1 }}>
                  <p style={{ ...F, fontSize:15, fontWeight:700, color:P.textP, margin:"0 0 3px" }}>{opt.label}</p>
                  <p style={{ ...F, fontSize:12, color:P.textM, margin:0 }}>{opt.sub}</p>
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
          {t("Perubahan langsung diterapkan ke seluruh aplikasi","Changes apply immediately across the app")}
        </p>
      </div>
    </div>
  );
}