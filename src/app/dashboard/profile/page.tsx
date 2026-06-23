// src/app/dashboard/profile/page.tsx
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import Image from "next/image";
import {
  Lock, Sun, Type, ChevronRight, LogOut,
  UserPen, GraduationCap, Phone, Mail,
  Languages, BookOpen, CheckSquare, Wallet,
  Award,
} from "lucide-react";
import { useApp, FONT_LABELS } from "@/components/AppContext";

export default function ProfilePage() {
  const { t, theme, lang, font, colors } = useApp();
  const router = useRouter();
  const isDark = theme === "dark";
  const F: React.CSSProperties = { fontFamily: "var(--app-font, 'Roboto', sans-serif)" };

  const P = {
    bg:          colors.bg,
    surface:     colors.surface,
    surf2:       colors.surface2,
    border:      colors.border,
    primary:     colors.primary,
    primaryBg:   colors.primaryLight,
    second:      colors.secondary,
    secondBg:    `${colors.secondary}1E`,
    accent:      colors.accent,
    accentBg:    `${colors.accent}1E`,
    danger:      colors.danger,
    dangerBg:    `${colors.danger}1E`,
    textP:       colors.textPrimary,
    textB:       colors.textBody,
    textM:       colors.textMuted,
    inputBg:     isDark ? "rgba(255,255,255,0.05)" : colors.surface2,
  };

  const [profile, setProfile] = useState<{
    name?: string; email?: string; image?: string;
    phone?: string; institution?: string;
  }>({});
  const [stats,  setStats]  = useState({ tasks: 0, done: 0, tx: 0 });
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    fetch("/api/profile").then(r=>r.ok?r.json():{}).then(d=>setProfile(d)).catch(()=>{});
    // Stats: fetch tasks + transactions count
    Promise.all([fetch("/api/tasks"), fetch("/api/transactions")])
      .then(async ([tr, tx]) => {
        const tasks = tr.ok ? await tr.json() : [];
        const txs   = tx.ok ? await tx.json()  : [];
        setStats({
          tasks: Array.isArray(tasks) ? tasks.length : 0,
          done:  Array.isArray(tasks) ? tasks.filter((t:any) => t.status==="SELESAI").length : 0,
          tx:    Array.isArray(txs)   ? txs.length   : 0,
        });
      }).catch(()=>{});
  }, []);

  const themeLabel = isDark ? t("Gelap","Dark") : t("Terang","Light");
  const langLabel  = lang === "id" ? "Indonesia" : "English";
  const fontLabel  = FONT_LABELS[font] ?? "Roboto";

  const initials = (profile.name ?? "?").split(" ").map((w:string)=>w[0]).slice(0,2).join("").toUpperCase();

  const accountItems = [
    { icon: UserPen, color: P.primary, bg: P.primaryBg, label: t("Kelola Profil","Manage Profile"),  sub: t("Nama, foto, telepon, institusi","Name, photo, phone, institution"), href:"/dashboard/profile/edit"     },
    { icon: Lock,    color: P.danger,  bg: P.dangerBg,  label: t("Ubah Password","Change Password"), sub: t("Perbarui kata sandi akun","Update your account password"),          href:"/dashboard/profile/password" },
  ];

  const prefItems = [
    { icon: Languages, color: P.second, bg: P.secondBg, label: t("Bahasa","Language"),    value: langLabel,  href:"/dashboard/profile/language" },
    { icon: Sun,       color: P.accent, bg: P.accentBg, label: t("Tema","Theme"),          value: themeLabel, href:"/dashboard/profile/theme"    },
    { icon: Type,      color: P.primary,bg: P.primaryBg,label: t("Gaya Huruf","Font"),     value: fontLabel,  href:"/dashboard/profile/font"     },
  ];

  // ── Logout: redirect dikontrol manual, BUKAN diserahkan ke signOut() ──────
  // signOut() bawaan NextAuth me-redirect pakai URL yang dihitung dari
  // NEXTAUTH_URL/AUTH_URL di server. Kalau env itu beda dari origin yang
  // sedang dipakai user (mis. server di-set ke localhost:3000 tapi user
  // browsing dari IP LAN seperti 192.168.x.x:3000), redirect bisa "lompat"
  // origin dan request CSRF/signout bisa gagal beda-beda tergantung device.
  // Fix: redirect:false dulu (biar tidak ada navigasi otomatis), baru kita
  // navigate manual pakai path RELATIF — selalu same-origin dengan tab yang
  // sedang dibuka, device apa pun, IP apa pun.
  async function handleLogout() {
    setLoggingOut(true);
    try {
      await signOut({ redirect: false });
    } catch {
      // tetap lanjut redirect manual walau signOut() gagal/timeout —
      // user tidak boleh terjebak di halaman ini
    }
    window.location.href = "/login";
  }

  return (
    <div style={{ minHeight:"100vh", paddingBottom:110, background:P.bg, ...F }}>
      <style>{`
        @keyframes fadeInModal { from{opacity:0}to{opacity:1} }
        @keyframes slideUp { from{transform:translateY(48px);opacity:0}to{transform:translateY(0);opacity:1} }
      `}</style>

      {/* ══ HEADER ═══════════════════════════════════════════════════════ */}
      <div style={{ position:"sticky", top:0, zIndex:50, background:P.surface, borderBottom:`1px solid ${P.border}`, paddingTop:"env(safe-area-inset-top, 0px)" }}>
        <div style={{ padding:"16px 20px 14px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <h1 style={{ ...F, fontSize:20, fontWeight:900, color:P.textP, margin:0 }}>{t("Profil","Profile")}</h1>
        </div>
      </div>

      {/* ══ HERO CARD ════════════════════════════════════════════════════ */}
      <div style={{ padding:"14px 16px 0" }}>
        <div style={{
          borderRadius:22,
          background: isDark
            ? "linear-gradient(145deg, #0a1e38 0%, #0f2d50 55%, #162340 100%)"
            : "linear-gradient(145deg, #1a4a82 0%, #1e5ea8 55%, #163868 100%)",
          border:`1px solid ${isDark?"rgba(123,184,240,0.16)":"rgba(255,255,255,0.22)"}`,
          overflow:"hidden", position:"relative",
        }}>
          <div style={{ position:"absolute", top:-50, right:-30, width:180, height:180, borderRadius:"50%", background:"radial-gradient(circle, rgba(123,184,240,0.13) 0%, transparent 70%)", pointerEvents:"none" }}/>
          <div style={{ position:"absolute", bottom:-30, left:10, width:130, height:130, borderRadius:"50%", background:`radial-gradient(circle, ${P.second}10 0%, transparent 70%)`, pointerEvents:"none" }}/>

          <div style={{ padding:"20px 18px", position:"relative" }}>
            {/* Avatar + name row */}
            <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:16 }}>
              <div style={{ position:"relative", flexShrink:0 }}>
                <div style={{ width:64, height:64, borderRadius:"50%", padding:2.5, background:"linear-gradient(135deg, rgba(123,184,240,0.85), rgba(142,196,74,0.6))" }}>
                  <div style={{ width:"100%", height:"100%", borderRadius:"50%", overflow:"hidden", background:isDark?"#0E1117":"#163d6e", display:"flex", alignItems:"center", justifyContent:"center" }}>
                    {profile.image
                      ? <Image src={profile.image} alt="avatar" width={59} height={59} style={{ objectFit:"cover", width:"100%", height:"100%" }}/>
                      : <span style={{ ...F, fontSize:20, fontWeight:900, color:"rgba(123,184,240,0.9)" }}>{initials}</span>
                    }
                  </div>
                </div>
                <button onClick={()=>router.push("/dashboard/profile/edit")} style={{ position:"absolute", bottom:0, right:0, width:22, height:22, borderRadius:"50%", background:"#7BB8F0", border:`2px solid ${isDark?"#0E1117":"#163d6e"}`, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <UserPen size={10} color="#0E1117"/>
                </button>
              </div>

              <div style={{ flex:1, minWidth:0 }}>
                <p style={{ ...F, fontSize:17, fontWeight:800, color:"#EEF2F8", margin:"0 0 3px", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                  {profile.name || t("Pengguna","User")}
                </p>
                <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                  <Mail size={10} color="rgba(203,213,225,0.5)"/>
                  <span style={{ ...F, fontSize:11, color:"rgba(203,213,225,0.5)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                    {profile.email || "—"}
                  </span>
                </div>
                {(profile.institution || profile.phone) && (
                  <div style={{ display:"flex", alignItems:"center", gap:5, marginTop:3 }}>
                    <GraduationCap size={10} color="rgba(203,213,225,0.5)"/>
                    <span style={{ ...F, fontSize:11, color:"rgba(203,213,225,0.5)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                      {profile.institution || profile.phone || "—"}
                    </span>
                  </div>
                )}
              </div>

              <button onClick={()=>router.push("/dashboard/profile/edit")} style={{ display:"flex", alignItems:"center", gap:5, padding:"7px 11px", borderRadius:10, background:"rgba(123,184,240,0.14)", border:"1px solid rgba(123,184,240,0.25)", cursor:"pointer", flexShrink:0 }}>
                <UserPen size={12} color="#7BB8F0"/>
                <span style={{ ...F, fontSize:11, fontWeight:700, color:"#7BB8F0" }}>{t("Edit","Edit")}</span>
              </button>
            </div>

            {/* Divider */}
            <div style={{ height:1, background:"rgba(255,255,255,0.08)", marginBottom:14 }}/>

            {/* Stats row */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
              {[
                { icon: <CheckSquare size={13} color="#85B7EB"/>, value: stats.tasks, label: t("Tugas","Tasks"),     bg:"rgba(133,183,235,0.15)" },
                { icon: <Award       size={13} color="#8EC44A"/>, value: stats.done,  label: t("Selesai","Done"),    bg:"rgba(142,196,74,0.15)"  },
                { icon: <Wallet      size={13} color="#F0A030"/>, value: stats.tx,    label: t("Transaksi","Tx"),    bg:"rgba(240,160,48,0.15)"  },
              ].map((s, i) => (
                <div key={i} style={{ background:"rgba(255,255,255,0.06)", borderRadius:10, padding:"10px 8px", textAlign:"center" }}>
                  <div style={{ width:28, height:28, borderRadius:8, background:s.bg, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 6px" }}>
                    {s.icon}
                  </div>
                  <p style={{ ...F, fontSize:17, fontWeight:900, color:"#EEF2F8", margin:"0 0 1px", lineHeight:1 }}>{s.value}</p>
                  <p style={{ ...F, fontSize:9, color:"rgba(203,213,225,0.5)", margin:0, fontWeight:600, letterSpacing:"0.05em" }}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ══ SECTIONS ════════════════════════════════════════════════════ */}
      <div style={{ padding:"12px 16px 0", display:"flex", flexDirection:"column", gap:12 }}>

        {/* Akun */}
        <div>
          <p style={{ ...F, fontSize:10, fontWeight:700, color:P.textM, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:7, paddingLeft:4 }}>
            {t("Akun","Account")}
          </p>
          <div style={{ background:P.surface, border:`1px solid ${P.border}`, borderRadius:18, overflow:"hidden" }}>
            {accountItems.map(({ icon:Icon, color, bg, label, sub, href }, idx) => (
              <button key={href} onClick={()=>router.push(href)}
                style={{ width:"100%", display:"flex", alignItems:"center", gap:13, padding:"13px 16px", background:"none", border:"none", cursor:"pointer", borderBottom:idx<accountItems.length-1?`1px solid ${P.border}`:"none", textAlign:"left", transition:"background 0.15s" }}
                onMouseEnter={e=>(e.currentTarget.style.background=`${P.primary}08`)}
                onMouseLeave={e=>(e.currentTarget.style.background="none")}
              >
                <div style={{ width:38, height:38, borderRadius:11, background:bg, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                  <Icon size={17} color={color}/>
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ ...F, fontSize:14, fontWeight:600, color:P.textP, margin:0 }}>{label}</p>
                  <p style={{ ...F, fontSize:11, color:P.textM, margin:"2px 0 0", lineHeight:1.4 }}>{sub}</p>
                </div>
                <ChevronRight size={15} color={P.textM} style={{ flexShrink:0 }}/>
              </button>
            ))}
          </div>
        </div>

        {/* Tampilan */}
        <div>
          <p style={{ ...F, fontSize:10, fontWeight:700, color:P.textM, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:7, paddingLeft:4 }}>
            {t("Tampilan & Bahasa","Display & Language")}
          </p>
          <div style={{ background:P.surface, border:`1px solid ${P.border}`, borderRadius:18, overflow:"hidden" }}>
            {prefItems.map(({ icon:Icon, color, bg, label, value, href }, idx) => (
              <button key={href} onClick={()=>router.push(href)}
                style={{ width:"100%", display:"flex", alignItems:"center", gap:13, padding:"13px 16px", background:"none", border:"none", cursor:"pointer", borderBottom:idx<prefItems.length-1?`1px solid ${P.border}`:"none", textAlign:"left", transition:"background 0.15s" }}
                onMouseEnter={e=>(e.currentTarget.style.background=`${P.primary}08`)}
                onMouseLeave={e=>(e.currentTarget.style.background="none")}
              >
                <div style={{ width:38, height:38, borderRadius:11, background:bg, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                  <Icon size={17} color={color}/>
                </div>
                <div style={{ flex:1 }}>
                  <p style={{ ...F, fontSize:14, fontWeight:600, color:P.textP, margin:0 }}>{label}</p>
                </div>
                <span style={{ ...F, fontSize:11, fontWeight:700, color:color, background:`${color}16`, border:`1px solid ${color}28`, padding:"3px 10px", borderRadius:999, marginRight:4, flexShrink:0 }}>
                  {value}
                </span>
                <ChevronRight size={15} color={P.textM} style={{ flexShrink:0 }}/>
              </button>
            ))}
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={()=>setShowLogoutModal(true)}
          style={{ ...F, width:"100%", padding:"14px 0", borderRadius:14, background:"transparent", border:`1.5px solid ${P.danger}40`, cursor:"pointer", color:P.danger, fontSize:14, fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center", gap:8, transition:"background 0.18s" }}
          onMouseEnter={e=>(e.currentTarget.style.background=P.dangerBg)}
          onMouseLeave={e=>(e.currentTarget.style.background="transparent")}
        >
          <LogOut size={16}/>{t("Keluar dari Akun","Sign Out")}
        </button>

        {/* Footer */}
        <div style={{ textAlign:"center", paddingBottom:4 }}>
          <div style={{ display:"inline-flex", alignItems:"center", gap:6, background:P.surface, border:`1px solid ${P.border}`, borderRadius:999, padding:"5px 14px" }}>
            <BookOpen size={11} color={P.textM}/>
            <span style={{ ...F, fontSize:11, color:P.textM }}>
              Kampder v1.0 · {t("Untuk Pelajar & Mahasiswa","For Students & Scholars")}
            </span>
          </div>
        </div>
      </div>

      {/* ══ LOGOUT MODAL ════════════════════════════════════════════════ */}
      {showLogoutModal && (
        <div onClick={()=>!loggingOut && setShowLogoutModal(false)} style={{ position:"fixed", inset:0, zIndex:100, background:"rgba(0,0,0,0.6)", backdropFilter:"blur(5px)", WebkitBackdropFilter:"blur(5px)", display:"flex", alignItems:"flex-end", justifyContent:"center", padding:`0 16px calc(env(safe-area-inset-bottom, 0px) + 28px)`, animation:"fadeInModal 0.2s ease" }}>
          <div onClick={e=>e.stopPropagation()} style={{ width:"100%", maxWidth:440, background:P.surface, border:`1px solid ${P.border}`, borderRadius:"24px 24px 20px 20px", overflow:"hidden", animation:"slideUp 0.28s cubic-bezier(0.34,1.1,0.64,1)" }}>
            <div style={{ padding:"28px 24px 20px", textAlign:"center" }}>
              <div style={{ width:56, height:56, borderRadius:"50%", background:P.dangerBg, border:`1.5px solid ${P.danger}35`, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px" }}>
                <LogOut size={22} color={P.danger}/>
              </div>
              <p style={{ ...F, fontSize:18, fontWeight:800, color:P.textP, margin:"0 0 8px" }}>{t("Keluar dari Akun?","Sign out?")}</p>
              <p style={{ ...F, fontSize:13, color:P.textB, margin:0, lineHeight:1.65, maxWidth:280, marginInline:"auto" }}>
                {t("Kamu akan keluar dari sesi ini. Kamu bisa masuk kembali kapan saja.","You'll be signed out of this session. You can sign back in anytime.")}
              </p>
            </div>
            <div style={{ height:1, background:P.border }}/>
            <div style={{ display:"flex" }}>
              <button disabled={loggingOut} onClick={()=>setShowLogoutModal(false)} style={{ ...F, flex:1, padding:"16px 0", background:"none", border:"none", borderRight:`1px solid ${P.border}`, cursor:loggingOut?"not-allowed":"pointer", fontSize:15, fontWeight:600, color:P.textB, opacity:loggingOut?0.5:1, transition:"background 0.15s" }} onMouseEnter={e=>{e.currentTarget.style.background=P.primaryBg;}} onMouseLeave={e=>{e.currentTarget.style.background="none";}}>
                {t("Batal","Cancel")}
              </button>
              <button disabled={loggingOut} onClick={handleLogout} style={{ ...F, flex:1, padding:"16px 0", background:"none", border:"none", cursor:loggingOut?"not-allowed":"pointer", fontSize:15, fontWeight:700, color:P.danger, opacity:loggingOut?0.6:1, transition:"background 0.15s" }} onMouseEnter={e=>(e.currentTarget.style.background=P.dangerBg)} onMouseLeave={e=>(e.currentTarget.style.background="none")}>
                {loggingOut ? t("Memproses...","Signing out...") : t("Ya, Keluar","Yes, sign out")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
