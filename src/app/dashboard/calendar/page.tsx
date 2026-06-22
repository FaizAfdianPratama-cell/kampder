// src/app/dashboard/calendar/page.tsx
"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import {
  Clock, ChevronLeft, ChevronRight, ChevronDown,
  BookOpen, CalendarClock, CalendarDays,
} from "lucide-react";
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  getDay, isSameDay, isToday, addMonths, subMonths,
  setMonth, setYear,
} from "date-fns";
import { id as idLocale, enUS } from "date-fns/locale";
import { getCountdown } from "@/lib/utils";
import { useApp } from "@/components/AppContext";

interface Task {
  id: string; name: string; subject: string;
  deadline: string; priority: "TERTINGGI" | "TINGGI" | "SEDANG" | "RENDAH";
  status: string; type: "TUGAS" | "JADWAL";
}

type TypeFilter = "all" | "TUGAS" | "JADWAL";

const PRIO_DOT: Record<string, string> = {
  TERTINGGI: "#EE8585",
  TINGGI:    "#F0A030",
  SEDANG:    "#7BB8F0",
  RENDAH:    "#8EC44A",
};

const PRIO_BAR: Record<string, string> = {
  TERTINGGI: "#EE8585",
  TINGGI:    "#F0A030",
  SEDANG:    "#7BB8F0",
  RENDAH:    "#8EC44A",
};

const MONTHS_ID = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
const MONTHS_EN = ["January","February","March","April","May","June","July","August","September","October","November","December"];

export default function CalendarPage() {
  const { t, lang, theme, colors } = useApp();
  const isDark = theme === "dark";
  const locale = lang === "id" ? idLocale : enUS;
  const L = (o: { id: string; en: string }) => lang === "id" ? o.id : o.en;

  const C = {
    bg:      colors.bg,
    surface: colors.surface,
    surf2:   colors.surface2,
    border:  colors.border,
    primary: colors.primary,
    primBg:  colors.primaryLight,
    second:  colors.secondary,
    accent:  colors.accent,
    danger:  colors.danger,
    textP:   colors.textPrimary,
    textB:   colors.textBody,
    textM:   colors.textMuted,
    inputBg: isDark ? "rgba(255,255,255,0.04)" : colors.surface2,
  };

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay,  setSelectedDay]  = useState<Date | null>(null);
  const [tasks,        setTasks]        = useState<Task[]>([]);
  const [typeFilter,   setTypeFilter]   = useState<TypeFilter>("all");
  const [showPicker,   setShowPicker]   = useState(false);
  const [pickerMonth,  setPickerMonth]  = useState(currentMonth.getMonth());
  const [pickerYear,   setPickerYear]   = useState(currentMonth.getFullYear());
  const pickerRef = useRef<HTMLDivElement>(null);

  const monthLabels = lang === "id" ? MONTHS_ID : MONTHS_EN;
  const thisYear    = new Date().getFullYear();
  const years       = Array.from({ length: 11 }, (_, i) => thisYear - 5 + i);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node))
        setShowPicker(false);
    }
    if (showPicker) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showPicker]);

  const fetchTasks = useCallback(async () => {
    const res  = await fetch("/api/tasks");
    const data = await res.json();
    setTasks(Array.isArray(data) ? data : []);
  }, []);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  function applyTypeFilter(pool: Task[]) {
    if (typeFilter === "all") return pool;
    return pool.filter(tk => tk.type === typeFilter);
  }

  function getTasksForDay(day: Date) {
    return applyTypeFilter(tasks.filter(tk => isSameDay(new Date(tk.deadline), day)));
  }

  function getTasksForMonth() {
    return applyTypeFilter(tasks.filter(tk => {
      const d = new Date(tk.deadline);
      return d.getMonth() === currentMonth.getMonth() &&
             d.getFullYear() === currentMonth.getFullYear();
    }));
  }

  const days           = eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) });
  const firstDayOfWeek = getDay(startOfMonth(currentMonth));
  const dayLabels      = lang === "id"
    ? ["Min","Sen","Sel","Rab","Kam","Jum","Sab"]
    : ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

  const displayTasks = (() => {
    const pool = selectedDay ? getTasksForDay(selectedDay) : getTasksForMonth();
    return pool.sort((a, b) => {
      if (a.status === "SELESAI" && b.status !== "SELESAI") return 1;
      if (a.status !== "SELESAI" && b.status === "SELESAI") return -1;
      const po: Record<string, number> = { TERTINGGI:0, TINGGI:1, SEDANG:2, RENDAH:3 };
      return (po[a.priority]??2) - (po[b.priority]??2)
          || new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    });
  })();

  function openPicker() {
    setPickerMonth(currentMonth.getMonth());
    setPickerYear(currentMonth.getFullYear());
    setShowPicker(true);
  }
  function applyPicker() {
    setCurrentMonth(setYear(setMonth(new Date(), pickerMonth), pickerYear));
    setSelectedDay(null);
    setShowPicker(false);
  }

  const monthTaskCount = getTasksForMonth().length;
  const doneCount      = getTasksForMonth().filter(t => t.status === "SELESAI").length;

  return (
    <div style={{ minHeight:"100vh", paddingBottom:112, background:C.bg }}>

      {/* ══ STICKY HEADER ════════════════════════════════════════════════ */}
      <div className="kd-sticky-header" style={{ background:C.surface, borderBottom:`1px solid ${C.border}`, paddingTop:"env(safe-area-inset-top, 0px)" }}>

        {/* Title row */}
        <div style={{ padding:"16px var(--page-pad) 0", display:"flex", alignItems:"flex-start", justifyContent:"space-between" }}>
          <div>
            <h1 style={{ fontSize:"var(--fs-md)", fontWeight:900, color:C.textP, margin:0 }}>
              {t("Kalender","Calendar")}
            </h1>
            <p style={{ fontSize:"var(--fs-xs)", color:C.textM, margin:"3px 0 0" }}>
              <span style={{ color:C.primary, fontWeight:700 }}>{monthTaskCount}</span> {t("item bulan ini","items this month")}
              {doneCount > 0 && (
                <> · <span style={{ color:C.second, fontWeight:700 }}>{doneCount}</span> {t("selesai","done")}</>
              )}
            </p>
          </div>
          {/* Type filter pills */}
          <div style={{ display:"flex", gap:6 }}>
            {([
              { value:"all",    icon:null,                         label:{id:"Semua", en:"All"} },
              { value:"TUGAS",  icon:<BookOpen    size={10}/>,    label:{id:"Tugas", en:"Tasks"} },
              { value:"JADWAL", icon:<CalendarClock size={10}/>,  label:{id:"Jadwal",en:"Schedule"} },
            ] as const).map(opt => {
              const active = typeFilter === opt.value;
              const clr = opt.value==="TUGAS" ? C.accent : opt.value==="JADWAL" ? C.primary : C.primary;
              const bg  = opt.value==="TUGAS" ? `${C.accent}16` : opt.value==="JADWAL" ? `${C.primary}16` : C.primBg;
              return (
                <button key={opt.value} onClick={()=>setTypeFilter(opt.value)} style={{ display:"flex", alignItems:"center", gap:3, padding:"5px 10px", borderRadius:999, fontSize:10, fontWeight:700, cursor:"pointer", fontFamily:"inherit", background:active?bg:C.inputBg, border:`1px solid ${active?clr:C.border}`, color:active?clr:C.textM }}>
                  {opt.icon}{L(opt.label)}
                </button>
              );
            })}
          </div>
        </div>

        {/* Nav row */}
        <div style={{ padding:"10px var(--page-pad) 12px", display:"flex", alignItems:"center", gap:8, position:"relative" }} ref={pickerRef}>
          {/* Month pill */}
          <button onClick={openPicker} style={{ display:"flex", alignItems:"center", gap:6, padding:"7px 13px", borderRadius:10, background:C.inputBg, border:`1px solid ${C.border}`, cursor:"pointer", flexShrink:0 }}>
            <span style={{ fontSize:13, fontWeight:800, color:C.textP, whiteSpace:"nowrap" }}>
              {format(currentMonth, "MMMM yyyy", {locale})}
            </span>
            <ChevronDown size={12} style={{ color:C.textM }}/>
          </button>

          <div style={{ flex:1 }}/>

          {/* Arrows */}
          {[
            { action:()=>{setCurrentMonth(subMonths(currentMonth,1));setSelectedDay(null);}, icon:<ChevronLeft  size={16}/> },
            { action:()=>{setCurrentMonth(addMonths(currentMonth,1));setSelectedDay(null);}, icon:<ChevronRight size={16}/> },
          ].map((btn, i) => (
            <button key={i} onClick={btn.action} style={{ width:32, height:32, borderRadius:8, background:C.inputBg, border:`1px solid ${C.border}`, color:C.textM, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
              {btn.icon}
            </button>
          ))}

          {/* Picker Dropdown */}
          {showPicker && (
            <div style={{ position:"absolute", top:"calc(100% + 4px)", left:"var(--page-pad)", right:"var(--page-pad)", zIndex:200, background:C.surface, border:`1px solid ${C.border}`, borderRadius:16, padding:16, boxShadow:isDark?"0 8px 32px rgba(0,0,0,0.45)":"0 8px 32px rgba(0,0,0,0.15)", display:"flex", flexDirection:"column", gap:12 }}>
              {/* Year row */}
              <div>
                <p style={{ fontSize:10, fontWeight:700, color:C.textM, textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:8 }}>{t("Tahun","Year")}</p>
                <div style={{ display:"flex", gap:5, overflowX:"auto", paddingBottom:2, scrollbarWidth:"none" }}>
                  {years.map(y => (
                    <button key={y} onClick={()=>setPickerYear(y)} style={{ flexShrink:0, padding:"5px 12px", borderRadius:8, fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit", background:pickerYear===y?C.primary:C.inputBg, border:`1px solid ${pickerYear===y?C.primary:C.border}`, color:pickerYear===y?(isDark?"#0D1117":"#fff"):C.textM }}>
                      {y}
                    </button>
                  ))}
                </div>
              </div>
              {/* Month grid */}
              <div>
                <p style={{ fontSize:10, fontWeight:700, color:C.textM, textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:8 }}>{t("Bulan","Month")}</p>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap:5 }}>
                  {monthLabels.map((m, i) => (
                    <button key={i} onClick={()=>setPickerMonth(i)} style={{ padding:"7px 4px", borderRadius:8, fontSize:12, fontWeight:600, cursor:"pointer", textAlign:"center", fontFamily:"inherit", background:pickerMonth===i?C.primary:C.inputBg, border:`1px solid ${pickerMonth===i?C.primary:C.border}`, color:pickerMonth===i?(isDark?"#0D1117":"#fff"):C.textP }}>
                      {m.slice(0,3)}
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={applyPicker} style={{ width:"100%", padding:11, borderRadius:10, background:C.primary, border:"none", color:isDark?"#0D1117":"#fff", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
                {t("Terapkan","Apply")}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ══ BODY ═════════════════════════════════════════════════════════ */}
      <div style={{ padding:"12px var(--page-pad)", display:"flex", flexDirection:"column", gap:12 }}>

        {/* ── Calendar Grid ─────────────────────────────────────────────── */}
        <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:"var(--card-radius)", padding:"14px 10px 10px" }}>

          {/* Day labels */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(7, 1fr)", marginBottom:6 }}>
            {dayLabels.map(d => (
              <div key={d} style={{ textAlign:"center", fontSize:10, fontWeight:700, color:C.textM, padding:"4px 0", letterSpacing:"0.05em", textTransform:"uppercase" }}>
                {d}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(7, 1fr)", gap:"3px 0" }}>

            {/* Prev-month padding */}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => {
              const d = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), -(firstDayOfWeek - 1 - i));
              return (
                <button key={`pre-${i}`} onClick={()=>setSelectedDay(isSameDay(d, selectedDay!)?null:d)} style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", aspectRatio:"1", borderRadius:10, fontSize:13, cursor:"pointer", background:"transparent", border:"none", opacity:0.22, color:C.textP, WebkitTapHighlightColor:"transparent" }}>
                  <span>{d.getDate()}</span>
                </button>
              );
            })}

            {/* Current month days */}
            {days.map(day => {
              const dayTasks   = getTasksForDay(day);
              const isSelected = selectedDay && isSameDay(day, selectedDay);
              const today      = isToday(day);
              const hasActive  = dayTasks.some(t => t.status !== "SELESAI");

              return (
                <button key={day.toISOString()} onClick={()=>setSelectedDay(isSameDay(day, selectedDay!)?null:day)} style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", aspectRatio:"1", borderRadius:10, fontSize:13, cursor:"pointer", fontWeight:today||isSelected?800:400, background:isSelected?`${C.primary}18`:"transparent", border:isSelected?`1.5px solid ${C.primary}44`:"1.5px solid transparent", color:isSelected?C.primary:C.textP, transition:"all 0.12s", WebkitTapHighlightColor:"transparent", fontFamily:"inherit" }}>

                  {/* Date number */}
                  <span style={today ? { background:C.primary, color:isDark?"#0D1117":"#fff", borderRadius:"50%", width:26, height:26, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:900 } : {}}>
                    {day.getDate()}
                  </span>

                  {/* Task dots */}
                  {dayTasks.length > 0 && (
                    <div style={{ display:"flex", gap:2, marginTop:3, flexWrap:"wrap", justifyContent:"center", maxWidth:26 }}>
                      {dayTasks.slice(0, 3).map((tk, i) => {
                        const dotColor = tk.type === "JADWAL"
                          ? (isSelected ? `${C.primary}80` : C.primary)
                          : (isSelected ? `${C.primary}60` : (PRIO_DOT[tk.priority] ?? C.textM));
                        return (
                          <span key={i} style={{ width:4, height:4, borderRadius:"50%", background:dotColor, flexShrink:0 }}/>
                        );
                      })}
                      {dayTasks.length > 3 && (
                        <span style={{ width:4, height:4, borderRadius:"50%", background:C.textM, flexShrink:0, opacity:0.5 }}/>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          {selectedDay && (
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginTop:10, padding:"8px 4px 0", borderTop:`1px solid ${C.border}` }}>
              <span style={{ fontSize:11, color:C.textM }}>
                {format(selectedDay, "d MMMM yyyy", {locale})}
              </span>
              <button onClick={()=>setSelectedDay(null)} style={{ background:"none", border:"none", fontSize:11, color:C.primary, cursor:"pointer", fontWeight:600, fontFamily:"inherit" }}>
                {t("← Semua bulan","← All month")}
              </button>
            </div>
          )}
        </div>

        {/* ── Task List ──────────────────────────────────────────────────── */}
        <div>
          {/* Section header */}
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <div style={{ width:3, height:14, borderRadius:99, background:selectedDay?C.accent:C.primary, flexShrink:0 }}/>
              <span style={{ fontSize:"var(--fs-xs)", fontWeight:700, color:C.textM, textTransform:"uppercase", letterSpacing:"0.07em" }}>
                {selectedDay
                  ? format(selectedDay, "d MMM yyyy", {locale})
                  : `${t("Bulan ini","This month")} — ${format(currentMonth, "MMMM", {locale})}`
                }
              </span>
            </div>
            <span style={{ fontSize:10, fontWeight:700, color:C.primary, background:C.primBg, borderRadius:999, padding:"1px 8px", border:`1px solid ${C.primary}33` }}>
              {displayTasks.length}
            </span>
          </div>

          {displayTasks.length === 0 ? (
            <div style={{ textAlign:"center", padding:"36px 20px", background:C.surface, border:`1px solid ${C.border}`, borderRadius:"var(--card-radius)" }}>
              <div style={{ width:44, height:44, borderRadius:12, background:`${C.primary}14`, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 10px" }}>
                <CalendarDays size={20} color={C.textM}/>
              </div>
              <p style={{ fontSize:"var(--fs-sm)", fontWeight:700, color:C.textP, margin:"0 0 3px" }}>
                {t(`Tidak ada ${typeFilter==="JADWAL"?"jadwal":"tugas"}`, `No ${typeFilter==="JADWAL"?"schedules":"tasks"}`)}
              </p>
              <p style={{ fontSize:"var(--fs-xs)", color:C.textM, margin:0 }}>
                {selectedDay ? t("di hari ini","today") : t("bulan ini","this month")}
              </p>
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {displayTasks.map(task => {
                const { text, variant } = getCountdown(new Date(task.deadline));
                const isJadwal  = task.type === "JADWAL";
                const isDone    = task.status === "SELESAI";
                const isOverdue = !isDone && new Date(task.deadline) < new Date();

                const barColor = isDone ? C.second : isJadwal ? C.primary : (PRIO_BAR[task.priority] ?? C.textM);
                const badgeClr = isDone ? C.second  : isJadwal ? C.primary : (PRIO_BAR[task.priority] ?? C.textM);
                const badgeBg  = isDone ? `${C.second}15` : isJadwal ? `${C.primary}15` : `${PRIO_BAR[task.priority] ?? C.textM}15`;
                const badgeLbl = isDone ? t("Selesai ✓","Done ✓") : isJadwal ? t("Jadwal","Schedule") : (
                  task.priority === "TERTINGGI" ? t("Tertinggi","Urgent")
                  : task.priority === "TINGGI"  ? t("Tinggi","High")
                  : task.priority === "SEDANG"  ? t("Sedang","Medium")
                  : t("Rendah","Low")
                );

                return (
                  <div key={task.id} style={{ display:"flex", background:C.surface, border:`1px solid ${isOverdue?`${C.danger}30`:C.border}`, borderRadius:"var(--card-radius)", overflow:"hidden", opacity:isDone?0.6:1 }}>
                    {/* Left stripe */}
                    <div style={{ width:4, flexShrink:0 }}/>

                    <div style={{ flex:1, padding:"12px 12px", minWidth:0 }}>
                      {/* Top row */}
                      <div style={{ display:"flex", alignItems:"flex-start", gap:8, marginBottom:3 }}>
                        <span style={{ display:"inline-flex", alignItems:"center", justifyContent:"center", width:22, height:22, borderRadius:6, flexShrink:0, background:isJadwal?`${C.primary}18`:`${C.accent}18`, marginTop:1 }}>
                          {isJadwal ? <CalendarClock size={11} color={C.primary}/> : <BookOpen size={11} color={C.accent}/>}
                        </span>
                        <p style={{ flex:1, fontSize:"var(--fs-base)", fontWeight:700, color:C.textP, margin:0, textDecoration:isDone?"line-through":"none", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                          {task.name}
                        </p>
                        <span style={{ fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:999, flexShrink:0, color:badgeClr, background:badgeBg }}>
                          {badgeLbl}
                        </span>
                      </div>

                      {task.subject && (
                        <p style={{ fontSize:"var(--fs-xs)", color:C.textB, margin:"0 0 7px 30px", lineHeight:1.4 }}>{task.subject}</p>
                      )}

                      {/* Deadline row */}
                      <div style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"4px 8px", borderRadius:7, background:isOverdue&&!isDone?`${C.danger}10`:C.inputBg, border:`1px solid ${isOverdue&&!isDone?`${C.danger}28`:C.border}`, marginLeft:30 }}>
                        <Clock size={10} color={isOverdue&&!isDone?C.danger:C.textM}/>
                        <span style={{ fontSize:11, color:isOverdue&&!isDone?C.danger:C.textB }}>
                          {format(new Date(task.deadline), "d MMM yyyy", {locale})}
                        </span>
                        {!isDone && (
                          <span className={`countdown-${variant}`} style={{ fontSize:11, fontWeight:700, marginLeft:2 }}>
                            · {text}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}