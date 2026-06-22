// src/app/dashboard/profile/password/page.tsx
"use client";
import React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Eye, EyeOff, Loader, ShieldCheck } from "lucide-react";
import { useApp } from "@/components/AppContext";

function getStrength(pw: string): { score:number; label:string; color:string } {
  if (!pw) return { score:0, label:"", color:"transparent" };
  let s = 0;
  if (pw.length>=6)  s++;
  if (pw.length>=10) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  if (s<=1) return { score:s, label:"Lemah",  color:"#EE8585" };
  if (s<=3) return { score:s, label:"Sedang", color:"#F0A030" };
  return { score:s, label:"Kuat", color:"#8EC44A" };
}

export default function PasswordPage() {
  const { t, theme, colors } = useApp();
  const router = useRouter();
  const isDark = theme === "dark";
  const F: React.CSSProperties = { fontFamily:"var(--app-font, 'Roboto', sans-serif)" };
  const P = { bg:colors.bg, surface:colors.surface, surf2:colors.surface2, border:colors.border, primary:colors.primary, danger:colors.danger, textP:colors.textPrimary, textB:colors.textBody, textM:colors.textMuted, primaryBg:colors.primaryLight, dangerBg:`${colors.danger}1A`, inputBg:isDark?"rgba(255,255,255,0.05)":colors.surface2 };

  const [form,    setForm]    = useState({ current:"", next:"", confirm:"" });
  const [show,    setShow]    = useState({ current:false, next:false, confirm:false });
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState("");
  const [success, setSuccess] = useState(false);
  const strength = getStrength(form.next);

  function Field({ field, label }: { field:"current"|"next"|"confirm"; label:string }) {
    return (
      <div>
        <p style={{ ...F, fontSize:10, fontWeight:700, color:P.textM, textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:7 }}>{label}</p>
        <div style={{ position:"relative" }}>
          <input type={show[field]?"text":"password"} placeholder="••••••••" value={form[field]}
            onChange={e=>setForm({...form,[field]:e.target.value})}
            style={{ ...F, width:"100%", padding:"11px 44px 11px 14px", borderRadius:10, background:P.inputBg, border:`1px solid ${P.border}`, color:P.textP, fontSize:14, outline:"none", boxSizing:"border-box" }}
          />
          <button type="button" onClick={()=>setShow(s=>({...s,[field]:!s[field]}))} style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:P.textM, display:"flex" }}>
            {show[field] ? <EyeOff size={16}/> : <Eye size={16}/>}
          </button>
        </div>
        {field==="next" && form.next.length>0 && (
          <div style={{ marginTop:8 }}>
            <div style={{ display:"flex", gap:4, marginBottom:4 }}>
              {[1,2,3,4,5].map(i=><div key={i} style={{ flex:1, height:3, borderRadius:4, background:i<=strength.score?strength.color:P.border, transition:"background 0.2s" }}/>)}
            </div>
            <p style={{ ...F, fontSize:11, color:strength.color, fontWeight:600, margin:0 }}>
              {t(strength.label, strength.label==="Lemah"?"Weak":strength.label==="Sedang"?"Medium":"Strong")}
            </p>
          </div>
        )}
      </div>
    );
  }

  async function handleSave() {
    setError("");
    if (!form.current)           return setError(t("Masukkan password saat ini","Enter current password"));
    if (form.next.length<6)      return setError(t("Password baru minimal 6 karakter","Min. 6 characters"));
    if (form.next!==form.confirm) return setError(t("Password baru tidak cocok","Passwords do not match"));
    setSaving(true);
    try {
      const res  = await fetch("/api/profile/password", { method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ current:form.current, next:form.next }) });
      const json = await res.json();
      if (!res.ok) setError(json.error??t("Gagal","Failed"));
      else { setSuccess(true); setForm({current:"",next:"",confirm:""}); setTimeout(()=>router.back(), 1400); }
    } catch { setError(t("Terjadi kesalahan","Something went wrong")); }
    setSaving(false);
  }

  return (
    <div style={{ minHeight:"100vh", paddingBottom:100, background:P.bg, ...F }}>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
      <div style={{ position:"sticky", top:0, zIndex:50, background:P.surface, borderBottom:`1px solid ${P.border}`, paddingTop:"env(safe-area-inset-top, 0px)" }}>
        <div style={{ padding:"14px 20px", display:"flex", alignItems:"center", gap:12 }}>
          <button onClick={()=>router.back()} style={{ width:36, height:36, borderRadius:10, border:`1px solid ${P.border}`, background:P.inputBg, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <ArrowLeft size={18} color={P.textB}/>
          </button>
          <div>
            <h1 style={{ ...F, fontSize:17, fontWeight:800, color:P.textP, margin:0 }}>{t("Ubah Password","Change Password")}</h1>
            <p style={{ ...F, fontSize:11, color:P.textM, margin:"2px 0 0" }}>{t("Perbarui kata sandi akun","Update your account password")}</p>
          </div>
        </div>
      </div>

      <div style={{ padding:"20px 16px", display:"flex", flexDirection:"column", gap:16 }}>
        {/* Security tip */}
        <div style={{ display:"flex", alignItems:"flex-start", gap:12, background:P.primaryBg, border:`1px solid ${P.primary}30`, borderRadius:14, padding:"13px 16px" }}>
          <ShieldCheck size={18} color={P.primary} style={{ flexShrink:0, marginTop:1 }}/>
          <p style={{ ...F, fontSize:12, color:P.textP, margin:0, lineHeight:1.6 }}>
            {t("Gunakan kombinasi huruf besar, angka, dan simbol untuk password yang lebih kuat.","Use uppercase letters, numbers, and symbols for a stronger password.")}
          </p>
        </div>

        {/* Fields */}
        <div style={{ background:P.surface, border:`1px solid ${P.border}`, borderRadius:16, padding:16, display:"flex", flexDirection:"column", gap:14 }}>
          <Field field="current" label={t("Password Saat Ini","Current Password")}/>
          <div style={{ height:1, background:P.border }}/>
          <Field field="next"    label={t("Password Baru","New Password")}/>
          <Field field="confirm" label={t("Konfirmasi Password Baru","Confirm New Password")}/>
        </div>

        {error && (
          <div style={{ background:P.dangerBg, border:`1px solid ${P.danger}40`, borderRadius:10, padding:"10px 14px" }}>
            <p style={{ ...F, fontSize:13, color:P.danger, margin:0, textAlign:"center" }}>{error}</p>
          </div>
        )}

        <button onClick={handleSave} disabled={saving} style={{ ...F, width:"100%", padding:"14px 0", borderRadius:14, background:success?"#8EC44A":P.primary, border:"none", color:isDark?"#0E1117":"#fff", fontSize:15, fontWeight:700, cursor:saving?"not-allowed":"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8, transition:"background 0.3s", opacity:saving?0.8:1 }}>
          {saving ? <Loader size={18} style={{animation:"spin 1s linear infinite"}}/> : success ? t("Password Diubah ✓","Password Changed ✓") : t("Simpan Password","Save Password")}
        </button>
      </div>
    </div>
  );
}