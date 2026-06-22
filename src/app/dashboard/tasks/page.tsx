
// src/app/dashboard/tasks/page.tsx
"use client";
import { useState, useEffect, useCallback } from "react";
import {
  Trash2, CheckCircle2, Loader, Pencil, X,
  RotateCcw, Plus, CalendarDays, ListFilter,
  BookOpen, CalendarClock, Clock3, Search,
} from "lucide-react";
import { format } from "date-fns";
import { id as idLocale, enUS } from "date-fns/locale";
import { getCountdown } from "@/lib/utils";
import { useSearchParams, useRouter } from "next/navigation";
import { useApp } from "@/components/AppContext";

type Priority = "TERTINGGI" | "TINGGI" | "SEDANG" | "RENDAH";
type Status   = "BELUM" | "DIKERJAKAN" | "SELESAI";
type TaskType = "TUGAS" | "JADWAL";

interface Task {
  id: string; name: string; subject: string;
  deadline: string; priority: Priority; status: Status; type: TaskType;
}

const emptyForm = {
  name: "", subject: "",
  deadline: new Date().toISOString().split("T")[0],
  priority: "SEDANG" as Priority,
  type: "TUGAS" as TaskType,
};

const PRIO: Record<Priority, { bar: string; bg: string; clr: string; bdr: string; label: { id: string; en: string } }> = {
  TERTINGGI: { bar: "#EE8585", bg: "rgba(238,133,133,0.12)", clr: "#EE8585", bdr: "rgba(238,133,133,0.3)", label: { id: "Tertinggi", en: "Urgent"  } },
  TINGGI:    { bar: "#F0A030", bg: "rgba(240,160,48,0.12)",  clr: "#F0A030", bdr: "rgba(240,160,48,0.3)",  label: { id: "Tinggi",   en: "High"    } },
  SEDANG:    { bar: "#7BB8F0", bg: "rgba(123,184,240,0.12)", clr: "#7BB8F0", bdr: "rgba(123,184,240,0.3)", label: { id: "Sedang",   en: "Medium"  } },
  RENDAH:    { bar: "#8EC44A", bg: "rgba(142,196,74,0.12)",  clr: "#8EC44A", bdr: "rgba(142,196,74,0.3)",  label: { id: "Rendah",   en: "Low"     } },
};
const PRIO_ORDER: Priority[] = ["TERTINGGI", "TINGGI", "SEDANG", "RENDAH"];
function safePrio(p: string | null | undefined): Priority {
  return PRIO_ORDER.includes(p as Priority) ? (p as Priority) : "SEDANG";
}

export default function TasksPage() {
  const { t, lang, theme, colors } = useApp();
  const isDark = theme === "dark";
  const locale = lang === "id" ? idLocale : enUS;
  const L = (o: { id: string; en: string }) => lang === "id" ? o.id : o.en;

  const C = {
    bg:       colors.bg,
    surface:  colors.surface,
    surf2:    colors.surface2,
    border:   colors.border,
    primary:  colors.primary,
    primBg:   colors.primaryLight,
    second:   colors.secondary,
    accent:   colors.accent,
    danger:   colors.danger,
    textP:    colors.textPrimary,
    textB:    colors.textBody,
    textM:    colors.textMuted,
    inputBg:  isDark ? "rgba(255,255,255,0.05)" : colors.surface2,
    onPrimary: isDark ? "#0E1117" : "#ffffff",
  };

  const [tasks,         setTasks]        = useState<Task[]>([]);
  const [loading,       setLoading]      = useState(true);
  const [showForm,      setShowForm]     = useState(false);
  const [editingId,     setEditingId]    = useState<string | null>(null);
  const [form,          setForm]         = useState(emptyForm);
  const [showFilter,    setShowFilter]   = useState(false);
  const [activeTab,     setActiveTab]    = useState<"all" | Status>("all");
  const [typeTab,       setTypeTab]      = useState<"all" | TaskType>("all");
  const [filterPriority, setFilterPriority] = useState<"all" | Priority>("all");
  const [filterStart,   setFilterStart]  = useState("");
  const [filterEnd,     setFilterEnd]    = useState("");
  const [applied,       setApplied]      = useState({ priority: "all" as "all" | Priority, start: "", end: "" });
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const searchParams = useSearchParams();
  const router       = useRouter();

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    const res  = await fetch("/api/tasks");
    const data = await res.json();
    setTasks(Array.isArray(data) ? data : []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchTasks();
    if (searchParams.get("new") === "true") { setShowForm(true); router.replace("/dashboard/tasks"); }
  }, [fetchTasks, searchParams, router]);

  const activeCount    = tasks.filter(tk => tk.status !== "SELESAI").length;
  const completedCount = tasks.filter(tk => tk.status === "SELESAI").length;
  const tugasCount     = tasks.filter(tk => tk.type === "TUGAS").length;
  const jadwalCount    = tasks.filter(tk => tk.type === "JADWAL").length;

  const filtered = tasks
    .filter(task => {
      if (activeTab === "BELUM"   && task.status === "SELESAI") return false;
      if (activeTab === "SELESAI" && task.status !== "SELESAI") return false;
      if (typeTab !== "all" && task.type !== typeTab) return false;
      if (applied.priority !== "all" && safePrio(task.priority) !== applied.priority) return false;
      if (applied.start && new Date(task.deadline) < new Date(applied.start)) return false;
      if (applied.end   && new Date(task.deadline) > new Date(applied.end))   return false;
      return true;
    })
    .sort((a, b) => {
      if (a.status === "SELESAI" && b.status !== "SELESAI") return 1;
      if (a.status !== "SELESAI" && b.status === "SELESAI") return -1;
      return PRIO_ORDER.indexOf(safePrio(a.priority)) - PRIO_ORDER.indexOf(safePrio(b.priority))
          || new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    });

  const hasActiveFilter = applied.priority !== "all" || applied.start || applied.end;

  function openAdd()        { setEditingId(null); setForm(emptyForm); setShowForm(true); }
  function openEdit(t: Task) {
    setEditingId(t.id);
    setForm({ name: t.name, subject: t.subject, deadline: t.deadline.split("T")[0], priority: safePrio(t.priority), type: t.type });
    setShowForm(true);
  }

  async function handleSave() {
    if (!form.name || !form.deadline) return;
    if (editingId) {
      await fetch(`/api/tasks/${editingId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    } else {
      await fetch("/api/tasks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    }
    setShowForm(false); setEditingId(null); fetchTasks();
  }

  async function handleSelesai(task: Task) {
    const next: Status = task.status === "SELESAI" ? "BELUM" : "SELESAI";
    await fetch(`/api/tasks/${task.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: next }) });
    setTasks(prev => prev.map(tk => tk.id === task.id ? { ...tk, status: next } : tk));
  }

  async function handleDelete(id: string) {
    await fetch(`/api/tasks/${id}`, { method: "DELETE" });
    setTasks(prev => prev.filter(tk => tk.id !== id));
    setDeleteConfirm(null);
  }

  const inputSt: React.CSSProperties = { width: "100%", padding: "11px 14px", borderRadius: "var(--btn-radius)", background: C.inputBg, border: `1px solid ${C.border}`, color: C.textP, fontSize: "var(--fs-sm)", outline: "none", boxSizing: "border-box", fontFamily: "inherit", appearance: "none" };
  const labelSt: React.CSSProperties = { fontSize: "var(--fs-xs)", fontWeight: 700, color: C.textM, display: "block", marginBottom: 6, letterSpacing: "0.07em", textTransform: "uppercase" };

  const STATUS_TABS = [
    { value: "all",     label: { id: "Semua",   en: "All"       }, count: tasks.length   },
    { value: "BELUM",   label: { id: "Aktif",   en: "Active"    }, count: activeCount    },
    { value: "SELESAI", label: { id: "Selesai", en: "Done"      }, count: completedCount },
  ] as const;

  const completionPct = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  return (
    <div style={{ background: C.bg, minHeight: "100%", paddingBottom: "calc(var(--nav-h) + 20px)" }}>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>

      {/* ══ STICKY HEADER ══════════════════════════════════════════════════ */}
      <div className="kd-sticky-header" style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, paddingTop: "env(safe-area-inset-top, 0px)" }}>
        {/* Title row */}
        <div style={{ padding: "16px var(--page-pad) 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h1 style={{ fontSize: "var(--fs-md)", fontWeight: 900, color: C.textP, margin: 0 }}>
              {t("Tugas & Jadwal", "Tasks & Schedule")}
            </h1>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setShowFilter(v => !v)} style={{ width: 38, height: 38, borderRadius: 11, background: hasActiveFilter ? C.primBg : C.inputBg, border: `1.5px solid ${hasActiveFilter ? C.primary : C.border}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", position: "relative" }}>
              <ListFilter size={16} color={hasActiveFilter ? C.primary : C.textM} />
              {hasActiveFilter && <span style={{ position: "absolute", top: -3, right: -3, width: 8, height: 8, borderRadius: 999, background: C.primary, border: `2px solid ${C.surface}` }} />}
            </button>
            <button onClick={openAdd} style={{ height: 38, paddingLeft: 14, paddingRight: 16, borderRadius: 11, background: C.primary, border: "none", display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
              <Plus size={15} color={C.onPrimary} strokeWidth={2.5} />
              <span style={{ fontSize: "var(--fs-sm)", fontWeight: 700, color: C.onPrimary }}>{t("Tambah", "Add")}</span>
            </button>
          </div>
        </div>

        {/* Progress bar */}
        {tasks.length > 0 && (
          <div style={{ padding: "10px var(--page-pad) 0" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
              <span style={{ fontSize: 10, color: C.textM, fontWeight: 600 }}>{t("Progress", "Progress")}</span>
              <span style={{ fontSize: 10, color: C.second, fontWeight: 700 }}>{completionPct}%</span>
            </div>
            <div style={{ height: 4, borderRadius: 99, background: C.border, overflow: "hidden" }}>
              <div style={{ width: `${completionPct}%`, height: "100%", borderRadius: 99, background: C.second, transition: "width 0.4s ease" }} />
            </div>
          </div>
        )}

        {/* Status Tabs */}
        <div style={{ display: "flex", borderTop: `1px solid ${C.border}`, marginTop: 10 }}>
          {STATUS_TABS.map(tab => {
            const isActive = activeTab === tab.value;
            return (
              <button key={tab.value} onClick={() => setActiveTab(tab.value)} style={{ flex: 1, padding: "10px 0", border: "none", background: "transparent", cursor: "pointer", position: "relative", color: isActive ? C.primary : C.textM, fontSize: "var(--fs-sm)", fontWeight: isActive ? 700 : 500, fontFamily: "inherit" }}>
                {L(tab.label)}
                <span style={{ marginLeft: 5, fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 999, background: isActive ? C.primBg : "transparent", color: isActive ? C.primary : C.textM }}>
                  {tab.count}
                </span>
                {isActive && <span style={{ position: "absolute", bottom: 0, left: "15%", right: "15%", height: 2.5, background: C.primary, borderRadius: 999 }} />}
              </button>
            );
          })}
        </div>
      </div>

      {/* ══ TYPE PILLS ═════════════════════════════════════════════════════ */}
      <div style={{ padding: "10px var(--page-pad) 0", display: "flex", gap: 7 }}>
        {([
          { value: "all",    label: { id: "Semua",  en: "All"      }, count: tasks.length },
          { value: "TUGAS",  label: { id: "Tugas",  en: "Tasks"    }, count: tugasCount   },
          { value: "JADWAL", label: { id: "Jadwal", en: "Schedule" }, count: jadwalCount  },
        ] as const).map(opt => {
          const isActive = typeTab === opt.value;
          const clr = opt.value === "JADWAL" ? C.primary : opt.value === "TUGAS" ? C.accent : C.primary;
          const bg  = opt.value === "JADWAL" ? `${C.primary}16` : opt.value === "TUGAS" ? `${C.accent}16` : C.primBg;
          const bdr = opt.value === "JADWAL" ? `${C.primary}35` : opt.value === "TUGAS" ? `${C.accent}35` : `${C.primary}35`;
          return (
            <button key={opt.value} onClick={() => setTypeTab(opt.value)} style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 999, fontSize: "var(--fs-sm)", fontWeight: 600, cursor: "pointer", fontFamily: "inherit", background: isActive ? bg : C.inputBg, border: `1px solid ${isActive ? bdr : C.border}`, color: isActive ? clr : C.textM }}>
              {opt.value === "TUGAS" && <BookOpen size={11} />}
              {opt.value === "JADWAL" && <CalendarClock size={11} />}
              {L(opt.label)}
              <span style={{ fontSize: 10, fontWeight: 700, background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)", color: isActive ? clr : C.textM, padding: "1px 5px", borderRadius: 999 }}>
                {opt.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ══ FILTER PANEL (slide-in) ═════════════════════════════════════════ */}
      {showFilter && (
        <div style={{ margin: "10px var(--page-pad) 0", background: C.surface, border: `1px solid ${C.border}`, borderRadius: "var(--card-radius)", overflow: "hidden" }}>
          <div style={{ padding: "12px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${C.border}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Search size={14} color={C.primary} />
              <span style={{ fontSize: "var(--fs-sm)", fontWeight: 700, color: C.textP }}>{t("Filter Tugas", "Filter Tasks")}</span>
            </div>
            <button onClick={() => setShowFilter(false)} style={{ background: "none", border: "none", cursor: "pointer", color: C.textM, display: "flex", padding: 4 }}>
              <X size={16} />
            </button>
          </div>
          <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <label style={labelSt}>{t("Prioritas", "Priority")}</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {([
                  { value: "all",       label: { id: "Semua",    en: "All"      } },
                  { value: "TERTINGGI", label: { id: "Tertinggi", en: "Urgent"   } },
                  { value: "TINGGI",    label: { id: "Tinggi",   en: "High"     } },
                  { value: "SEDANG",    label: { id: "Sedang",   en: "Medium"   } },
                  { value: "RENDAH",    label: { id: "Rendah",   en: "Low"      } },
                ] as const).map(opt => {
                  const active = filterPriority === opt.value;
                  const p = opt.value !== "all" ? PRIO[opt.value] : null;
                  return (
                    <button key={opt.value} onClick={() => setFilterPriority(opt.value)} style={{ padding: "6px 12px", borderRadius: 999, fontSize: "var(--fs-sm)", fontWeight: 600, cursor: "pointer", fontFamily: "inherit", background: active ? (p ? p.bg : C.primBg) : C.inputBg, border: `1px solid ${active ? (p ? p.clr : C.primary) : C.border}`, color: active ? (p ? p.clr : C.primary) : C.textM }}>
                      {L(opt.label)}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="kd-grid-2">
              <div><label style={labelSt}>{t("Dari", "From")}</label><input type="date" value={filterStart} onChange={e => setFilterStart(e.target.value)} style={inputSt} /></div>
              <div><label style={labelSt}>{t("Sampai", "To")}</label><input type="date" value={filterEnd}   onChange={e => setFilterEnd(e.target.value)}   style={inputSt} /></div>
            </div>
            <div className="kd-grid-2">
              <button onClick={() => { setFilterPriority("all"); setFilterStart(""); setFilterEnd(""); setApplied({ priority: "all", start: "", end: "" }); setShowFilter(false); }} style={{ padding: "10px 0", borderRadius: "var(--btn-radius)", fontFamily: "inherit", background: C.inputBg, border: `1px solid ${C.border}`, color: C.textM, fontSize: "var(--fs-sm)", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                <RotateCcw size={13} /> {t("Reset", "Reset")}
              </button>
              <button onClick={() => { setApplied({ priority: filterPriority, start: filterStart, end: filterEnd }); setShowFilter(false); }} style={{ padding: "10px 0", borderRadius: "var(--btn-radius)", background: C.primary, border: "none", color: C.onPrimary, fontSize: "var(--fs-sm)", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                {t("Terapkan", "Apply")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ TASK LIST ══════════════════════════════════════════════════════ */}
      <div style={{ padding: "10px var(--page-pad) 0" }}>
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "60px 0", gap: 12 }}>
            <Loader size={24} style={{ color: C.primary, animation: "spin 1s linear infinite" }} />
            <p style={{ fontSize: "var(--fs-sm)", color: C.textM }}>{t("Memuat...", "Loading...")}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 20px", background: C.surface, borderRadius: "var(--card-radius)", border: `1px solid ${C.border}` }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: `${C.primary}14`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
              {typeTab === "JADWAL" ? <CalendarClock size={24} color={C.primary} strokeWidth={1.5} /> : <BookOpen size={24} color={C.primary} strokeWidth={1.5} />}
            </div>
            <p style={{ fontSize: "var(--fs-base)", fontWeight: 800, color: C.textP, margin: "0 0 5px" }}>
              {activeTab === "SELESAI" ? t("Belum ada yang selesai", "Nothing completed yet") : t("Tidak ada tugas", "No tasks found")}
            </p>
            <p style={{ fontSize: "var(--fs-sm)", color: C.textM, margin: "0 0 16px", lineHeight: 1.5 }}>
              {activeTab === "SELESAI" ? t("Selesaikan tugas untuk melihatnya di sini", "Complete a task to see it here") : t("Tambahkan tugas atau ubah filter", "Add a task or adjust filters")}
            </p>
            {activeTab !== "SELESAI" && (
              <button onClick={openAdd} style={{ padding: "10px 22px", borderRadius: "var(--btn-radius)", background: C.primary, border: "none", color: C.onPrimary, fontSize: "var(--fs-sm)", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                + {t("Tambah Tugas", "Add Task")}
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {filtered.map(task => {
              const { text } = getCountdown(new Date(task.deadline));
              const p        = PRIO[safePrio(task.priority)];
              const isJadwal = task.type === "JADWAL";
              const isDone   = task.status === "SELESAI";
              const isOverdue = !isDone && new Date(task.deadline) < new Date();

              const barClr   = isDone ? C.second : isJadwal ? C.primary : p.bar;
              const badgeClr = isDone ? C.second  : isJadwal ? C.primary : p.clr;
              const badgeBg  = isDone ? `${C.second}18` : isJadwal ? `${C.primary}18` : p.bg;
              const badgeLbl = isDone ? t("Selesai ✓", "Done ✓") : isJadwal ? t("Jadwal", "Schedule") : L(p.label);

              return (
                <div key={task.id} style={{ display: "flex", background: C.surface, border: `1px solid ${isOverdue ? `${C.danger}35` : C.border}`, borderRadius: "var(--card-radius)", overflow: "hidden", opacity: isDone ? 0.6 : 1, transition: "opacity 0.2s" }}>
                  {/* Priority stripe */}
                  <div style={{ width: 1, flexShrink: 0 }} />

                  <div style={{ flex: 1, padding: "13px 12px", minWidth: 0 }}>
                    {/* Top row: icon + name + badge */}
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 4 }}>
                      <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 24, height: 24, borderRadius: 7, flexShrink: 0, background: isJadwal ? `${C.primary}18` : `${C.accent}18`, marginTop: 1 }}>
                        {isJadwal ? <CalendarClock size={12} color={C.primary} /> : <BookOpen size={12} color={C.accent} />}
                      </span>
                      <p style={{ flex: 1, fontSize: "var(--fs-base)", fontWeight: 700, color: C.textP, margin: 0, textDecoration: isDone ? "line-through" : "none", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {task.name}
                      </p>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 999, flexShrink: 0, color: badgeClr, background: badgeBg }}>
                        {badgeLbl}
                      </span>
                    </div>

                    {task.subject && (
                      <p style={{ fontSize: "var(--fs-xs)", color: C.textB, margin: "0 0 8px 32px", lineHeight: 1.4 }}>{task.subject}</p>
                    )}

                    {/* Deadline info */}
                    <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 10, marginLeft: 32 }}>
                      {isJadwal ? <Clock3 size={10} color={isOverdue && !isDone ? C.danger : C.textM} /> : <CalendarDays size={10} color={isOverdue && !isDone ? C.danger : C.textM} />}
                      <span style={{ fontSize: 11, color: isOverdue && !isDone ? C.danger : C.textB }}>
                        {format(new Date(task.deadline), "EEE, d MMM yyyy", { locale })}
                      </span>
                      {!isDone && (
                        <span style={{ fontSize: 11, fontWeight: 700, color: isOverdue ? C.danger : C.accent }}>
                          · {text}
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={() => handleSelesai(task)} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "8px 0", borderRadius: 9, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", background: isDone ? `${C.accent}12` : `${C.second}12`, border: `1px solid ${isDone ? `${C.accent}30` : `${C.second}30`}`, color: isDone ? C.accent : C.second }}>
                        <CheckCircle2 size={13} />
                        {isDone ? t("Batalkan", "Undo") : t("Selesai", "Mark Done")}
                      </button>
                      <button onClick={() => openEdit(task)} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "8px 12px", borderRadius: 9, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", background: C.inputBg, border: `1px solid ${C.border}`, color: C.textM }}>
                        <Pencil size={12} />
                        {t("Edit", "Edit")}
                      </button>
                      <button onClick={() => setDeleteConfirm(task.id)} style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "8px 10px", borderRadius: 9, cursor: "pointer", background: `${C.danger}10`, border: `1px solid ${C.danger}28`, color: C.danger }}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ══ DELETE CONFIRM ═════════════════════════════════════════════════ */}
      {deleteConfirm && (
        <div onClick={() => setDeleteConfirm(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 var(--page-pad)" }}>
          <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: 340, borderRadius: "var(--card-radius)", background: C.surface, border: `1px solid ${C.border}`, padding: "28px 20px", textAlign: "center" }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: `${C.danger}14`, border: `1px solid ${C.danger}28`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
              <Trash2 size={22} color={C.danger} />
            </div>
            <p style={{ fontSize: "var(--fs-base)", fontWeight: 800, color: C.textP, margin: "0 0 6px" }}>{t("Hapus item ini?", "Delete this item?")}</p>
            <p style={{ fontSize: "var(--fs-sm)", color: C.textM, margin: "0 0 20px", lineHeight: 1.5 }}>{t("Tindakan ini tidak dapat dibatalkan.", "This cannot be undone.")}</p>
            <div className="kd-grid-2">
              <button onClick={() => setDeleteConfirm(null)} style={{ padding: "12px 0", borderRadius: "var(--btn-radius)", fontFamily: "inherit", background: C.inputBg, border: `1px solid ${C.border}`, color: C.textM, fontSize: "var(--fs-sm)", fontWeight: 600, cursor: "pointer" }}>
                {t("Batal", "Cancel")}
              </button>
              <button onClick={() => handleDelete(deleteConfirm)} style={{ padding: "12px 0", borderRadius: "var(--btn-radius)", fontFamily: "inherit", background: C.danger, border: "none", color: "#fff", fontSize: "var(--fs-sm)", fontWeight: 700, cursor: "pointer" }}>
                {t("Hapus", "Delete")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ FORM MODAL ═════════════════════════════════════════════════════ */}
      {showForm && (
        <div onClick={e => e.target === e.currentTarget && setShowForm(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 100, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
          <div style={{ width: "100%", maxWidth: "var(--page-max)", borderRadius: "24px 24px 0 0", background: C.surface, padding: "0 var(--page-pad) 48px", maxHeight: "94dvh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 4px" }}>
              <div style={{ width: 36, height: 4, borderRadius: 999, background: C.border }} />
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0 16px" }}>
              <div>
                <h2 style={{ fontSize: "var(--fs-md)", fontWeight: 800, color: C.textP, margin: 0 }}>
                  {editingId ? t("Edit Tugas", "Edit Task") : form.type === "JADWAL" ? t("Jadwal Baru", "New Schedule") : t("Tugas Baru", "New Task")}
                </h2>
                <p style={{ fontSize: "var(--fs-xs)", color: C.textM, margin: "4px 0 0" }}>{t("Isi detail di bawah ini", "Fill in the details below")}</p>
              </div>
              <button onClick={() => setShowForm(false)} style={{ width: 34, height: 34, borderRadius: 10, background: `${C.danger}12`, border: `1px solid ${C.danger}28`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                <X size={15} color={C.danger} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {/* Type */}
              <div>
                <label style={labelSt}>{t("Jenis", "Type")}</label>
                <div className="kd-grid-2">
                  {([
                    { value: "TUGAS",  label: { id: "Tugas",  en: "Task"     }, icon: <BookOpen size={15} />,     clr: C.accent,  bg: `${C.accent}18`  },
                    { value: "JADWAL", label: { id: "Jadwal", en: "Schedule" }, icon: <CalendarClock size={15} />, clr: C.primary, bg: `${C.primary}18` },
                  ] as const).map(opt => {
                    const active = form.type === opt.value;
                    return (
                      <button key={opt.value} onClick={() => setForm({ ...form, type: opt.value })} style={{ padding: "12px 0", borderRadius: "var(--btn-radius)", fontSize: "var(--fs-sm)", fontWeight: 700, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 7, background: active ? opt.bg : C.inputBg, border: `1.5px solid ${active ? opt.clr : C.border}`, color: active ? opt.clr : C.textM }}>
                        {opt.icon} {L(opt.label)}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div><label style={labelSt}>{t("Nama", "Name")}</label><input placeholder={t("Cth: Tugas Matematika", "E.g. Math Assignment")} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={inputSt} /></div>
              <div><label style={labelSt}>{t("Mata Pelajaran / Keterangan", "Subject / Notes")}</label><input placeholder={t("Opsional", "Optional")} value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} style={inputSt} /></div>
              <div><label style={labelSt}>{form.type === "JADWAL" ? t("Tanggal Kegiatan", "Event Date") : t("Tengat Waktu", "Deadline")}</label><input type="date" value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })} style={inputSt} /></div>

              {form.type === "TUGAS" && (
                <div>
                  <label style={labelSt}>{t("Prioritas", "Priority")}</label>
                  <div className="kd-grid-2">
                    {PRIO_ORDER.map(pr => {
                      const mp = PRIO[pr]; const active = form.priority === pr;
                      return (
                        <button key={pr} onClick={() => setForm({ ...form, priority: pr })} style={{ padding: "10px 0", borderRadius: "var(--btn-radius)", fontSize: "var(--fs-sm)", fontWeight: 700, cursor: "pointer", fontFamily: "inherit", background: active ? mp.bg : C.inputBg, border: `1.5px solid ${active ? mp.clr : C.border}`, color: active ? mp.clr : C.textM, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                          <span style={{ width: 7, height: 7, borderRadius: 999, background: active ? mp.clr : C.textM, opacity: active ? 1 : 0.3 }} />
                          {L(mp.label)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 10, marginTop: 20 }}>
              <button onClick={() => setForm(emptyForm)} style={{ padding: "13px 0", borderRadius: "var(--btn-radius)", fontFamily: "inherit", background: C.inputBg, border: `1px solid ${C.border}`, color: C.textM, fontSize: "var(--fs-sm)", fontWeight: 600, cursor: "pointer" }}>
                {t("Reset", "Reset")}
              </button>
              <button onClick={handleSave} disabled={!form.name || !form.deadline} style={{ padding: "13px 0", borderRadius: "var(--btn-radius)", background: C.primary, border: "none", fontFamily: "inherit", color: C.onPrimary, fontSize: "var(--fs-sm)", fontWeight: 700, cursor: "pointer", opacity: !form.name || !form.deadline ? 0.45 : 1 }}>
                {editingId ? t("Simpan Perubahan", "Save Changes") : t("Tambah", "Add")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}