// src/app/dashboard/profile/edit/page.tsx
"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowLeft, Camera, User, Loader, GraduationCap, Phone, Mail, CheckCircle } from "lucide-react";
import { useApp } from "@/components/AppContext";

type FormKey = "name" | "phone" | "institution";

export default function KelolaProfil() {
  const { t, theme, colors } = useApp();
  const router  = useRouter();
  const isDark  = theme === "dark";
  const F: React.CSSProperties = { fontFamily: "var(--app-font, 'Roboto', sans-serif)" };

  const P = {
    bg: colors.bg, surface: colors.surface, surf2: colors.surface2,
    border: colors.border, primary: colors.primary, second: colors.secondary,
    textP: colors.textPrimary, textB: colors.textBody, textM: colors.textMuted,
    inputBg: isDark ? "rgba(255,255,255,0.05)" : colors.surface2,
  };

  const [form,    setForm]    = useState({ name:"", phone:"", institution:"", image:"" });
  const [email,   setEmail]   = useState("");
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [success, setSuccess] = useState(false);
  const [focused, setFocused] = useState<FormKey | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/profile").then(r=>r.json()).then(d => {
      setForm({ name:d.name??"", phone:d.phone??"", institution:d.institution??"", image:d.image??"" });
      setEmail(d.email??""); setLoading(false);
    }).catch(()=>setLoading(false));
  }, []);

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => { if (ev.target?.result) setForm(f=>({...f, image:ev.target!.result as string})); };
    reader.readAsDataURL(file);
  }

  async function handleSave() {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/profile", { method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify(form) });
      if (res.ok) { setSuccess(true); setTimeout(()=>{ setSuccess(false); router.back(); }, 1400); }
    } catch {}
    setSaving(false);
  }

  const initials = (form.name||"?").split(" ").map((w:string)=>w[0]).slice(0,2).join("").toUpperCase();

  const FIELDS: { key: FormKey; Icon: React.ElementType; color: string; label: string; placeholder: string; type?: string }[] = [
    { key:"name",        Icon:User,         color:P.primary, label:t("Nama Lengkap","Full Name"),       placeholder:t("Masukkan nama lengkap","Enter full name") },
    { key:"phone",       Icon:Phone,        color:P.primary, label:t("No. Telepon","Phone Number"),     placeholder:"cth: 08123456789", type:"tel" },
    { key:"institution", Icon:GraduationCap,color:P.second,  label:t("Institusi","Institution"),        placeholder:t("cth: Universitas Indonesia","e.g. University of Indonesia") },
  ];

  return (
    <div style={{ minHeight:"100vh", paddingBottom:40, background:P.bg, ...F }}>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>

      {/* Header */}
      <div style={{ position:"sticky", top:0, zIndex:50, background:P.surface, borderBottom:`1px solid ${P.border}`, paddingTop:"env(safe-area-inset-top, 0px)" }}>
        <div style={{ padding:"14px 20px", display:"flex", alignItems:"center", gap:12 }}>
          <button onClick={()=>router.back()} style={{ width:36, height:36, borderRadius:10, border:`1px solid ${P.border}`, background:P.inputBg, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <ArrowLeft size={18} color={P.textB}/>
          </button>
          <div>
            <h1 style={{ ...F, fontSize:17, fontWeight:800, color:P.textP, margin:0 }}>{t("Kelola Profil","Manage Profile")}</h1>
            <p style={{ ...F, fontSize:11, color:P.textM, margin:"2px 0 0" }}>{t("Perbarui informasi akunmu","Update your account info")}</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ display:"flex", alignItems:"center", justifyContent:"center", padding:"80px 0", gap:12, flexDirection:"column" }}>
          <Loader size={24} style={{ color:P.primary, animation:"spin 1s linear infinite" }}/>
          <p style={{ ...F, fontSize:13, color:P.textM }}>{t("Memuat...","Loading...")}</p>
        </div>
      ) : (
        <div style={{ padding:"16px 16px", display:"flex", flexDirection:"column", gap:14 }}>

          {/* Avatar card */}
          <div style={{ background:isDark?"linear-gradient(145deg, #0a1e38 0%, #0f2d50 60%, #162340 100%)":"linear-gradient(145deg, #1a4a82 0%, #1e5ea8 60%, #163868 100%)", borderRadius:20, padding:"24px 20px 20px", display:"flex", flexDirection:"column", alignItems:"center", gap:12, position:"relative", overflow:"hidden", border:`1px solid ${isDark?"rgba(123,184,240,0.14)":"rgba(255,255,255,0.2)"}` }}>
            <div style={{ position:"absolute", top:-30, right:-15, width:120, height:120, borderRadius:"50%", background:"radial-gradient(circle, rgba(123,184,240,0.12) 0%, transparent 70%)", pointerEvents:"none" }}/>
            {/* Avatar */}
            <div style={{ position:"relative" }}>
              <div style={{ width:80, height:80, borderRadius:"50%", padding:2.5, background:"linear-gradient(135deg, rgba(123,184,240,0.9), rgba(142,196,74,0.6))" }}>
                <div style={{ width:"100%", height:"100%", borderRadius:"50%", overflow:"hidden", background:isDark?"#0E1117":"#163d6e", display:"flex", alignItems:"center", justifyContent:"center" }}>
                  {form.image
                    ? <Image src={form.image} alt="avatar" width={75} height={75} style={{ objectFit:"cover", width:"100%", height:"100%" }}/>
                    : <span style={{ ...F, fontSize:24, fontWeight:900, color:"rgba(123,184,240,0.9)" }}>{initials}</span>
                  }
                </div>
              </div>
              <button onClick={()=>fileRef.current?.click()} style={{ position:"absolute", bottom:0, right:0, width:26, height:26, borderRadius:"50%", background:"#7BB8F0", border:`2.5px solid ${isDark?"#0E1117":"#163d6e"}`, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <Camera size={12} color="#0E1117"/>
              </button>
            </div>
            <input ref={fileRef} type="file" accept="image/*" style={{ display:"none" }} onChange={handleImageChange}/>
            <div style={{ textAlign:"center" }}>
              <p style={{ ...F, fontSize:16, fontWeight:800, color:"#EEF2F8", margin:"0 0 3px" }}>{form.name||t("Pengguna","User")}</p>
              <p style={{ ...F, fontSize:12, color:"rgba(203,213,225,0.55)", margin:0 }}>{email||"—"}</p>
            </div>
            <button onClick={()=>fileRef.current?.click()} style={{ ...F, display:"flex", alignItems:"center", gap:6, padding:"7px 16px", borderRadius:10, background:"rgba(123,184,240,0.16)", border:"1px solid rgba(123,184,240,0.28)", cursor:"pointer", fontSize:12, fontWeight:700, color:"#7BB8F0" }}>
              <Camera size={12}/>{t("Ganti Foto","Change Photo")}
            </button>
          </div>

          {/* Form card */}
          <div style={{ background:P.surface, border:`1px solid ${P.border}`, borderRadius:18, overflow:"hidden" }}>
            {/* Email (readonly) */}
            <div style={{ padding:"14px 16px", borderBottom:`1px solid ${P.border}`, display:"flex", alignItems:"center", gap:12 }}>
              <div style={{ width:36, height:36, borderRadius:10, background:P.inputBg, border:`1px solid ${P.border}`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                <Mail size={15} color={P.textM}/>
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <p style={{ ...F, fontSize:10, fontWeight:700, color:P.textM, textTransform:"uppercase", letterSpacing:"0.06em", margin:"0 0 2px" }}>Email</p>
                <p style={{ ...F, fontSize:14, color:P.textB, margin:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", opacity:0.75 }}>{email||"—"}</p>
              </div>
              <span style={{ ...F, fontSize:10, fontWeight:600, color:P.textM, background:P.inputBg, border:`1px solid ${P.border}`, borderRadius:6, padding:"2px 8px", flexShrink:0 }}>
                {t("Tetap","Fixed")}
              </span>
            </div>

            {/* Editable fields */}
            {FIELDS.map(({ key, Icon, color, label, placeholder, type }, idx) => {
              const isFocused = focused === key;
              return (
                <div key={key} style={{ padding:"14px 16px", borderBottom:idx<FIELDS.length-1?`1px solid ${P.border}`:"none", background:isFocused?(isDark?"rgba(123,184,240,0.04)":"rgba(46,125,209,0.03)"):"transparent", transition:"background 0.15s" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                    <div style={{ width:36, height:36, borderRadius:10, flexShrink:0, background:isFocused?`${color}20`:P.inputBg, border:`1px solid ${isFocused?`${color}40`:P.border}`, display:"flex", alignItems:"center", justifyContent:"center", transition:"all 0.15s" }}>
                      <Icon size={15} color={isFocused?color:P.textM}/>
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <p style={{ ...F, fontSize:10, fontWeight:700, color:isFocused?color:P.textM, textTransform:"uppercase", letterSpacing:"0.06em", margin:"0 0 3px", transition:"color 0.15s" }}>{label}</p>
                      <input type={type??"text"} placeholder={placeholder} value={form[key]}
                        onFocus={()=>setFocused(key)} onBlur={()=>setFocused(null)}
                        onChange={e=>setForm({...form,[key]:e.target.value})}
                        style={{ ...F, width:"100%", padding:0, background:"transparent", border:"none", color:P.textP, fontSize:14, fontWeight:500, outline:"none" }}
                      />
                    </div>
                  </div>
                  <div style={{ height:1.5, borderRadius:999, marginTop:9, marginLeft:48, background:isFocused?color:P.border, opacity:isFocused?1:0.4, transition:"all 0.2s" }}/>
                </div>
              );
            })}
          </div>

          {/* Save */}
          <button onClick={handleSave} disabled={saving||success||!form.name.trim()} style={{ ...F, width:"100%", padding:"15px 0", borderRadius:14, background:success?P.second:P.primary, border:"none", color:isDark?"#0E1117":"#fff", fontSize:15, fontWeight:800, cursor:saving||success||!form.name.trim()?"not-allowed":"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8, transition:"background 0.3s", opacity:!form.name.trim()?0.45:saving?0.8:1 }}>
            {saving ? <><Loader size={17} style={{animation:"spin 1s linear infinite"}}/>{t("Menyimpan...","Saving...")}</>
            : success ? <><CheckCircle size={17}/>{t("Tersimpan!","Saved!")}</>
            : t("Simpan Perubahan","Save Changes")}
          </button>
          <p style={{ ...F, fontSize:11, color:P.textM, textAlign:"center", marginTop:-6 }}>
            {t("Perubahan akan langsung diterapkan","Changes applied immediately")}
          </p>
        </div>
      )}
    </div>
  );
}