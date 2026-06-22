// src/app/dashboard/DashboardClient.tsx
"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import {
  CheckSquare, Wallet, ChevronRight, Clock,
  AlertTriangle, BookOpen, CalendarClock, Sparkles,
  TrendingUp, TrendingDown,
} from "lucide-react";
import { format } from "date-fns";
import { id as idLocale, enUS } from "date-fns/locale";
import { getCountdown } from "@/lib/utils";
import { useApp } from "@/components/AppContext";
import InstallAppCard from "@/components/InstallAppCard";
interface Task {
  id: string; name: string; subject: string;
  deadline: string; priority: "TERTINGGI" | "TINGGI" | "SEDANG" | "RENDAH";
  status: string; type?: "TUGAS" | "JADWAL";
}
interface Props {
  userName: string; tasks: Task[];
  income: number; expense: number; invest: number;
}

function formatRp(n: number) {
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `Rp ${(abs / 1_000_000).toFixed(1).replace(".0", "")}jt`;
  if (abs >= 1_000)     return `Rp ${Math.round(abs / 1_000)}rb`;
  return `Rp ${abs.toLocaleString("id-ID")}`;
}
function formatRpFull(n: number) {
  return "Rp " + Math.abs(n).toLocaleString("id-ID");
}

const PRIO: Record<string, { bar: string; badge: string; badgeTxt: string; label: { id: string; en: string } }> = {
  TERTINGGI: { bar: "#EE8585", badge: "rgba(238,133,133,0.15)", badgeTxt: "#EE8585", label: { id: "Tertinggi", en: "Urgent"  } },
  TINGGI:    { bar: "#F0A030", badge: "rgba(240,160,48,0.15)",  badgeTxt: "#F0A030", label: { id: "Tinggi",   en: "High"    } },
  SEDANG:    { bar: "#7BB8F0", badge: "rgba(123,184,240,0.15)", badgeTxt: "#7BB8F0", label: { id: "Sedang",   en: "Medium"  } },
  RENDAH:    { bar: "#8EC44A", badge: "rgba(142,196,74,0.15)",  badgeTxt: "#8EC44A", label: { id: "Rendah",   en: "Low"     } },
};

export default function DashboardClient({ userName, tasks, income, expense, invest }: Props) {
  const { t, lang, theme, colors } = useApp();
  const [time,    setTime]    = useState(new Date());
  // ── mounted guard: cegah hydration mismatch pada jam real-time ──────────
  // Server render & client render PASTI beda detik → React hydration error.
  // Solusi: tampilkan "--:--:--" saat SSR, baru render jam asli setelah mount.
  const [mounted, setMounted] = useState(false);
  const isDark  = theme === "dark";
  const locale  = lang === "id" ? idLocale : enUS;
  const L       = (o: { id: string; en: string }) => lang === "id" ? o.id : o.en;

  useEffect(() => {
    setMounted(true);
    const i = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(i);
  }, []);

  // ── Derived data ───────────────────────────────────────────────────────────
  const balance  = income - expense - invest;
  const isPos    = balance >= 0;
  const now      = new Date();
  const today0   = new Date(now); today0.setHours(0,0,0,0);

  const activeTasks  = tasks.filter(t => t.status !== "SELESAI");
  const overdueTasks = activeTasks.filter(t => new Date(t.deadline) < today0);
  const todayTasks   = activeTasks.filter(t => {
    const d = new Date(t.deadline); d.setHours(0,0,0,0);
    return d.getTime() === today0.getTime();
  });

  // Most urgent task to highlight
  const focusTask = activeTasks
  .filter(t => t.priority === "TERTINGGI")
  .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())[0];

  const upcomingTasks = activeTasks
    .filter(t => new Date(t.deadline) >= today0)
    .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
    .slice(0, 4);

  // ── Colors ─────────────────────────────────────────────────────────────────
  const bg      = colors.bg;
  const surface = colors.surface;
  const surf2   = colors.surface2;
  const border  = colors.border;
  const primary = colors.primary;
  const second  = colors.secondary;
  const accent  = colors.accent;
  const danger  = colors.danger;
  const textP   = colors.textPrimary;
  const textM   = colors.textMuted;
  const textB   = colors.textBody;

  // ── Greeting ───────────────────────────────────────────────────────────────
  const h = time.getHours();
  const greeting = lang === "id"
    ? h < 11 ? "Selamat pagi" : h < 15 ? "Selamat siang" : h < 18 ? "Selamat sore" : "Selamat malam"
    : h < 11 ? "Good morning"  : h < 15 ? "Good afternoon" : h < 18 ? "Good evening"  : "Good night";

  const firstName = (userName || "Kawan").split(" ")[0];

  return (
    <div style={{ background: bg, minHeight: "100%" }}>

      {/* ══════════════════════════════════════════════════════════════════════
          HEADER — Greeting kiri, jam digital kanan
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="kd-sticky-header" style={{
        background: isDark ? `${surface}F5` : `${surface}FA`,
        backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
        borderBottom: `1px solid ${border}`,
        paddingTop: "env(safe-area-inset-top, 0px)",
      }}>
        <div style={{ padding: "16px var(--page-pad) 14px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          {/* Left */}
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: "var(--fs-xs)", color: textM, margin: 0, fontWeight: 500 }}>
              {greeting} 
            </p>
            <p style={{ fontSize: "var(--fs-md)", fontWeight: 900, color: textP, margin: "2px 0 0", lineHeight: 1.15, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {firstName} 
            </p>
          </div>

          {/* Right — Digital clock (suppressHydrationWarning = solusi resmi Next.js) */}
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <p suppressHydrationWarning style={{ fontSize: "clamp(22px, 6vw, 30px)", fontWeight: 900, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.02em", color: textP, margin: 0, lineHeight: 1 }}>
              {mounted ? format(time, "HH:mm") : "--:--"}
              <span suppressHydrationWarning style={{ fontSize: "clamp(12px, 3vw, 16px)", color: textM, marginLeft: 2 }}>
                {mounted ? format(time, ":ss") : ":--"}
              </span>
            </p>
            <p suppressHydrationWarning style={{ fontSize: "var(--fs-xs)", color: textM, margin: "4px 0 0" }}>
              {mounted ? format(time, "EEE, d MMM", { locale }) : ""}
            </p>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          BODY
      ══════════════════════════════════════════════════════════════════════ */}
      <div style={{ padding: "14px var(--page-pad)", display: "flex", flexDirection: "column", gap: 14 }}>
        <InstallAppCard />

        {/* ── Overdue Alert Banner ─────────────────────────────────────────── */}
        {overdueTasks.length > 0 && (
          <Link href="/dashboard/tasks" style={{ textDecoration: "none" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: "var(--card-radius)", background: `${danger}12`, border: `1px solid ${danger}35` }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: `${danger}22`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <AlertTriangle size={17} color={danger} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: "var(--fs-sm)", fontWeight: 700, color: danger, margin: 0 }}>
                  {overdueTasks.length} {t("tugas melewati deadline", "task(s) past deadline")}
                </p>
                <p style={{ fontSize: "var(--fs-xs)", color: textB, margin: "2px 0 0" }}>
                  {t("Segera selesaikan →", "Finish them now →")}
                </p>
              </div>
            </div>
          </Link>
        )}

        {/* ── Balance Card ─────────────────────────────────────────────────── */}
        <div style={{
          borderRadius: "var(--card-radius)",
          background: isDark
            ? "linear-gradient(145deg, #0a1e38 0%, #0f2d50 50%, #162340 100%)"
            : "linear-gradient(145deg, #1a4a82 0%, #1e5ea8 50%, #163868 100%)",
          border: `1px solid ${isDark ? "rgba(123,184,240,0.18)" : "rgba(255,255,255,0.25)"}`,
          overflow: "hidden", position: "relative",
        }}>
          {/* Orbs */}
          <div style={{ position: "absolute", top: -40, right: -20, width: 160, height: 160, borderRadius: "50%", background: "radial-gradient(circle, rgba(123,184,240,0.14) 0%, transparent 70%)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", bottom: -20, left: -10, width: 120, height: 120, borderRadius: "50%", background: `radial-gradient(circle, ${second}12 0%, transparent 70%)`, pointerEvents: "none" }} />

          <div style={{ padding: "var(--sp-md)", position: "relative" }}>
            {/* Top row */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(123,184,240,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Wallet size={14} color="#85B7EB" />
                </div>
                <span style={{ fontSize: "var(--fs-xs)", fontWeight: 700, color: "rgba(203,213,225,0.65)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                  {t("Saldo Bersih", "Net Balance")}
                </span>
              </div>
              <Link href="/dashboard/finance" style={{ display: "flex", alignItems: "center", gap: 3, fontSize: "var(--fs-xs)", fontWeight: 600, color: "rgba(133,183,235,0.85)", textDecoration: "none" }}>
                {t("Lihat", "View")} <ChevronRight size={12} />
              </Link>
            </div>

            {/* Big amount */}
            <p style={{ fontSize: "clamp(28px, 8vw, 38px)", fontWeight: 900, letterSpacing: "-0.03em", lineHeight: 1, color: isPos ? "#F0F6FF" : "#FFA7A7", margin: "0 0 2px" }}>
              {isPos ? "" : "−"}{formatRpFull(Math.abs(balance))}
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 16 }}></div>

            {/* Divider */}
            <div style={{ height: 1, background: "rgba(255,255,255,0.08)", marginBottom: 14 }} />

            {/* 3 stats */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
              {[
                { label: t("Masuk",  "Income"),  value: income,  color: "#8EC44A", sign: "+" },
                { label: t("Keluar", "Expense"), value: expense, color: "#EE8585", sign: "−" },
                { label: t("Tabung", "Saved"),   value: invest,  color: "#F0A030", sign: "🏦" },
              ].map((item, i) => (
                <div key={i} style={{ background: "rgba(255,255,255,0.06)", borderRadius: 10, padding: "10px 10px" }}>
                  <p style={{ fontSize: 10, fontWeight: 600, color: "rgba(203,213,225,0.5)", margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    {item.label}
                  </p>
                  <p style={{ fontSize: "clamp(11px, 3vw, 14px)", fontWeight: 800, color: item.color, margin: 0 }}>
                    {item.sign !== "🏦" ? item.sign : ""}{formatRp(item.value)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Today's Focus ─────────────────────────────────────────────────── */}
        {focusTask && (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: "var(--fs-xs)", fontWeight: 700, color: textM, textTransform: "uppercase", letterSpacing: "0.07em" }}>
                {t("Prioritas Tertinggi", "Top Priority")}
              </span>
            </div>
            <Link href="/dashboard/tasks" style={{ textDecoration: "none" }}>
              <div style={{
                display: "flex", gap: 0,
                background: surface, border: `1px solid ${border}`,
                borderRadius: "var(--card-radius)", overflow: "hidden",
              }}>
                {/* Left stripe */}
                <div style={{ width: 4, flexShrink: 0 }} />
                <div style={{ flex: 1, padding: "14px 14px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 22, height: 22, borderRadius: 6, background: (focusTask.type === "JADWAL") ? `${primary}20` : `${accent}20` }}>
                      {focusTask.type === "JADWAL" ? <CalendarClock size={11} color={primary} /> : <BookOpen size={11} color={accent} />}
                    </span>
                    <p style={{ fontSize: "var(--fs-base)", fontWeight: 700, color: textP, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                      {focusTask.name}
                    </p>
                    <span style={{ fontSize: 10, fontWeight: 700, color: PRIO[focusTask.priority]?.badgeTxt, background: PRIO[focusTask.priority]?.badge, borderRadius: 999, padding: "2px 8px", flexShrink: 0 }}>
                      {L(PRIO[focusTask.priority]?.label ?? { id: "", en: "" })}
                    </span>
                  </div>
                  {focusTask.subject && (
                    <p style={{ fontSize: "var(--fs-xs)", color: textB, margin: "0 0 8px 30px" }}>{focusTask.subject}</p>
                  )}
                  <div style={{ display: "flex", alignItems: "center", gap: 5, marginLeft: 30 }}>
                    <Clock size={11} color={textM} />
                    <span style={{ fontSize: "var(--fs-xs)", color: textM }}>
                      {format(new Date(focusTask.deadline), "d MMM yyyy", { locale })}
                    </span>
                    {(() => { const { text, variant } = getCountdown(new Date(focusTask.deadline)); return (
                      <span className={`countdown-${variant}`} style={{ fontSize: "var(--fs-xs)", fontWeight: 700 }}>· {text}</span>
                    );})()}
                  </div>
                </div>
              </div>
            </Link>
          </div>
        )}

        {/* ── Upcoming Tasks ────────────────────────────────────────────────── */}
        <div>
          {/* Section header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: "var(--fs-xs)", fontWeight: 700, color: textM, textTransform: "uppercase", letterSpacing: "0.07em" }}>
                {t("Tugas & Jadwal", "Tasks & Schedule")}
              </span>
              {upcomingTasks.length > 0 && (
                <span style={{ fontSize: 10, fontWeight: 700, color: primary, background: `${primary}18`, borderRadius: 999, padding: "1px 7px" }}>
                  {upcomingTasks.length}
                </span>
              )}
            </div>
            <Link href="/dashboard/tasks" style={{ display: "flex", alignItems: "center", gap: 2, fontSize: "var(--fs-xs)", fontWeight: 600, color: primary, textDecoration: "none" }}>
              {t("Lihat Semua", "See All")} <ChevronRight size={12} />
            </Link>
          </div>

          {upcomingTasks.length === 0 ? (
            <div style={{ background: surface, border: `1px solid ${border}`, borderRadius: "var(--card-radius)", padding: "28px 20px", textAlign: "center" }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: `${second}18`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px" }}>
                <Sparkles size={20} color={second} />
              </div>
              <p style={{ fontSize: "var(--fs-sm)", fontWeight: 700, color: textP, margin: "0 0 3px" }}>
                {t("Tidak ada tugas mendatang", "No upcoming tasks")}
              </p>
              <p style={{ fontSize: "var(--fs-xs)", color: textM, margin: "0 0 14px" }}>
                {t("Tambah tugas baru untuk mulai tracking", "Add a task to start tracking")}
              </p>
              <Link href="/dashboard/tasks?new=true" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: "var(--btn-radius)", background: primary, color: isDark ? "#0E1117" : "#fff", fontSize: "var(--fs-xs)", fontWeight: 700, textDecoration: "none" }}>
                + {t("Tambah Tugas", "Add Task")}
              </Link>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {upcomingTasks.map(task => {
                const { text, variant } = getCountdown(new Date(task.deadline));
                const p = PRIO[task.priority] ?? PRIO.SEDANG;
                const isJadwal = task.type === "JADWAL";
                return (
                  <div key={task.id} style={{ display: "flex", background: surface, border: `1px solid ${border}`, borderRadius: "var(--card-radius)", overflow: "hidden" }}>
                    {/* Left color stripe */}
                    <div style={{ width: 4, flexShrink: 0 }} />
                    <div style={{ flex: 1, padding: "12px 12px", minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: "var(--fs-base)", fontWeight: 700, color: textP, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {task.name}
                          </p>
                          {task.subject && (
                            <p style={{ fontSize: "var(--fs-xs)", color: textB, margin: "2px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {task.subject}
                            </p>
                          )}
                        </div>
                        <span style={{ fontSize: 10, fontWeight: 700, color: isJadwal ? primary : p.badgeTxt, background: isJadwal ? `${primary}18` : p.badge, borderRadius: 999, padding: "2px 8px", flexShrink: 0, whiteSpace: "nowrap" }}>
                          {isJadwal ? t("Jadwal", "Schedule") : L(p.label)}
                        </span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 6 }}>
                        <Clock size={10} color={textM} />
                        <span style={{ fontSize: 11, color: textM }}>{format(new Date(task.deadline), "d MMM", { locale })}</span>
                        <span className={`countdown-${variant}`} style={{ fontSize: 11, fontWeight: 700, marginLeft: "auto" }}>
                          {text}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Quick Actions ─────────────────────────────────────────────────── */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: "var(--fs-xs)", fontWeight: 700, color: textM, textTransform: "uppercase", letterSpacing: "0.07em" }}>
              {t("Aksi Cepat", "Quick Actions")}
            </span>
          </div>
          <div className="kd-grid-2" style={{ gap: 10 }}>
            {[
              { href: "/dashboard/tasks?new=true",   icon: <CheckSquare size={20} color={primary} />, bg: `${primary}18`, label: t("Tambah Tugas",    "Add Task"),         sub: t("Catat deadline baru",  "Log a new deadline")  },
              { href: "/dashboard/finance?new=true", icon: <Wallet       size={20} color={second}  />, bg: `${second}18`,  label: t("Catat Keuangan",  "Add Transaction"), sub: t("Masukkan/pengeluaran", "Income or expense")   },
            ].map(item => (
              <Link key={item.href} href={item.href} style={{ textDecoration: "none" }}>
                <div style={{ background: surface, border: `1px solid ${border}`, borderRadius: "var(--card-radius)", padding: "16px 14px", display: "flex", flexDirection: "column", gap: 10, height: "100%" }}>
                  <div style={{ width: 42, height: 42, borderRadius: 12, background: item.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {item.icon}
                  </div>
                  <div>
                    <p style={{ fontSize: "var(--fs-sm)", fontWeight: 700, color: textP, margin: "0 0 2px" }}>{item.label}</p>
                    <p style={{ fontSize: "var(--fs-xs)", color: textM, margin: 0, lineHeight: 1.4 }}>{item.sub}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
