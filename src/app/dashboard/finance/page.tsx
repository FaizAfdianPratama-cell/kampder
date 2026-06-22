// src/app/dashboard/finance/page.tsx
"use client";
import { useState, useEffect, useCallback } from "react";
import {
  Plus, Loader, Trash2, Pencil, FileText, X,
  Wallet, Search, RotateCcw, Scale,
  LogIn, LogOut, Landmark,
} from "lucide-react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { id as idLocale, enUS } from "date-fns/locale";
import { formatRupiah } from "@/lib/utils";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { useSearchParams, useRouter } from "next/navigation";
import { useApp } from "@/components/AppContext";
import FinanceTrendChart from "./FinanceTrendChart";

// ── Types & Constants ─────────────────────────────────────────────────────────

type TxType = "INCOME" | "EXPENSE" | "INVEST";
interface Transaction {
  id: string; name: string; type: TxType;
  amount: number; category: string; date: string;
}

const CATEGORIES: Record<TxType, { label: string; color: string }[]> = {
  INCOME:  [
    { label: "Beasiswa",          color: "#8EC44A" },
    { label: "Kerja Sampingan",   color: "#4FC3F7" },
    { label: "Kiriman Orang Tua", color: "#CE93D8" },
    { label: "Transfer",          color: "#FFB74D" },
    { label: "Lainnya",           color: "#80CBC4" },
  ],
  EXPENSE: [
    { label: "Konsumsi",             color: "#EE8585" },
    { label: "Biaya Tempat Tinggal", color: "#FF8A65" },
    { label: "Tagihan Rutin",        color: "#FFD54F" },
    { label: "Transportasi",         color: "#4FC3F7" },
    { label: "Buku/ATK",             color: "#CE93D8" },
    { label: "Hiburan",              color: "#80CBC4" },
    { label: "Kesehatan",            color: "#A5D6A7" },
    { label: "Lainnya",              color: "#90A4AE" },
  ],
  INVEST:  [
    { label: "Investasi",         color: "#F0A030" },
    { label: "Kebutuhan Lainnya", color: "#FF8A65" },
    { label: "Dana Darurat",      color: "#4FC3F7" },
    { label: "Tabungan Khusus",   color: "#CE93D8" },
    { label: "Lainnya",           color: "#80CBC4" },
  ],
};

function catColor(type: TxType, label: string) {
  return CATEGORIES[type].find(c => c.label === label)?.color ?? "#64748B";
}

function defaultRange() {
  const now = new Date();
  return { start: format(startOfMonth(now), "yyyy-MM-dd"), end: format(endOfMonth(now), "yyyy-MM-dd") };
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function FinancePage() {
  const { t, lang, theme, colors } = useApp();
  const isDark = theme === "dark";
  const locale = lang === "id" ? idLocale : enUS;
  const L = (o: { id: string; en: string }) => lang === "id" ? o.id : o.en;

  const C = {
    bg:        colors.bg,
    surface:   colors.surface,
    surf2:     colors.surface2,
    border:    colors.border,
    primary:   colors.primary,
    primBg:    colors.primaryLight,
    second:    colors.secondary,
    accent:    colors.accent,
    danger:    colors.danger,
    textP:     colors.textPrimary,
    textB:     colors.textBody,
    textM:     colors.textMuted,
    inputBg:   isDark ? "rgba(255,255,255,0.04)" : colors.surface2,
    onPrimary: isDark ? "#0D1117" : "#ffffff",
    income:    colors.secondary,
    expense:   colors.danger,
    invest:    colors.accent,
  };

  // LogIn  = panah masuk ke kotak (Pemasukan)
  // LogOut = panah keluar dari kotak (Pengeluaran)
  // Landmark = bangunan bank berpilar (Tabungan)
  const TYPE_META: Record<TxType, { id: string; en: string; color: string; bg: string; Icon: React.ElementType }> = {
    INCOME:  { id: "Pemasukan",   en: "Income",  color: C.income,  bg: `${C.income}1F`,  Icon: LogIn   },
    EXPENSE: { id: "Pengeluaran", en: "Expense", color: C.expense, bg: `${C.expense}1F`, Icon: LogOut  },
    INVEST:  { id: "Tabungan",    en: "Savings", color: C.invest,  bg: `${C.invest}1F`,  Icon: Landmark },
  };

  const inputSt: React.CSSProperties = {
    width: "100%", padding: "11px 14px", borderRadius: "var(--btn-radius)",
    background: C.inputBg, border: `1.5px solid ${C.border}`,
    color: C.textP, fontSize: "var(--fs-sm)", outline: "none",
    boxSizing: "border-box", fontFamily: "inherit", appearance: "none",
  };
  const labelSt: React.CSSProperties = {
    fontSize: "var(--fs-xs)", fontWeight: 700, color: C.textM,
    display: "block", marginBottom: 6, letterSpacing: "0.07em", textTransform: "uppercase",
  };
  const selectSt: React.CSSProperties = {
    ...inputSt,
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2364748B' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat", backgroundPosition: "calc(100% - 12px) center",
  };

  const now = new Date();
  const def = defaultRange();
  const [activeTab,     setActiveTab]     = useState<"overview" | "transactions">("overview");
  const [filterStatus,  setFilterStatus]  = useState<"all" | TxType>("all");
  const [filterStart,   setFilterStart]   = useState(def.start);
  const [filterEnd,     setFilterEnd]     = useState(def.end);
  const [applied,       setApplied]       = useState({ status: "all" as "all" | TxType, start: def.start, end: def.end });
  const [transactions,  setTransactions]  = useState<Transaction[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [exportLoading, setExportLoading] = useState(false);
  const [showForm,      setShowForm]      = useState(false);
  const [editingId,     setEditingId]     = useState<string | null>(null);
  const [showFilter,    setShowFilter]    = useState(false);
  const [form, setForm] = useState({
    name: "", type: "EXPENSE" as TxType, amount: "",
    category: "Konsumsi", date: format(now, "yyyy-MM-dd"), customCategory: "",
  });

  const searchParams = useSearchParams();
  const router       = useRouter();

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ start: applied.start, end: applied.end });
    const res  = await fetch(`/api/transactions?${params}`);
    const data = await res.json();
    setTransactions(Array.isArray(data) ? data : []);
    setLoading(false);
  }, [applied.start, applied.end]);

  useEffect(() => {
    fetchTransactions();
    if (searchParams.get("new") === "true") { setShowForm(true); router.replace("/dashboard/finance"); }
  }, [fetchTransactions, searchParams, router]);

  const visibleTx = transactions.filter(tx => applied.status === "all" || tx.type === applied.status);
  const income  = visibleTx.filter(t => t.type === "INCOME").reduce((s, t) => s + t.amount, 0);
  const expense = visibleTx.filter(t => t.type === "EXPENSE").reduce((s, t) => s + t.amount, 0);
  const invest  = visibleTx.filter(t => t.type === "INVEST").reduce((s, t) => s + t.amount, 0);
  const balance = income - expense - invest;

  function buildPie(type: TxType) {
    const pool = visibleTx.filter(t => t.type === type);
    const totals: Record<string, number> = {};
    pool.forEach(t => { totals[t.category] = (totals[t.category] || 0) + t.amount; });
    return Object.entries(totals).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({
      name, value, color: catColor(type, name),
    }));
  }

  const filteredTx = [...visibleTx].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const grouped: Record<string, Transaction[]> = {};
  filteredTx.forEach(tx => {
    const k = tx.date.split("T")[0];
    if (!grouped[k]) grouped[k] = [];
    grouped[k].push(tx);
  });

  function openAdd() {
    setEditingId(null);
    setForm({ name: "", type: "EXPENSE", amount: "", category: "Konsumsi", date: format(now, "yyyy-MM-dd"), customCategory: "" });
    setShowForm(true);
  }
  function openEdit(tx: Transaction) {
    const cats = CATEGORIES[tx.type].map(c => c.label), isKnown = cats.includes(tx.category);
    setEditingId(tx.id);
    setForm({ name: tx.name, type: tx.type, amount: String(tx.amount), category: isKnown ? tx.category : "Lainnya", date: tx.date.split("T")[0], customCategory: isKnown ? "" : tx.category });
    setShowForm(true);
  }
  function changeFormType(type: TxType) {
    setForm(f => ({ ...f, type, category: CATEGORIES[type][0].label, customCategory: "" }));
  }

  async function handleSave() {
    if (!form.name || !form.amount) return;
    const finalCat = form.category === "Lainnya" && form.customCategory.trim() ? form.customCategory.trim() : form.category;
    const body = { name: form.name, type: form.type, amount: parseInt(form.amount), category: finalCat, date: form.date };
    if (editingId)
      await fetch(`/api/transactions/${editingId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    else
      await fetch("/api/transactions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setShowForm(false); setEditingId(null); fetchTransactions();
  }
  async function handleDelete(id: string) {
    if (!confirm(t("Hapus transaksi ini?", "Delete this transaction?"))) return;
    await fetch(`/api/transactions/${id}`, { method: "DELETE" });
    setTransactions(prev => prev.filter(tx => tx.id !== id));
  }
  async function exportPDF() {
    setExportLoading(true);
    try {
      let userInfo = { name: "", email: "", phone: "", institution: "" };
      try { const r = await fetch("/api/profile"); if (r.ok) userInfo = { ...userInfo, ...(await r.json()) }; } catch {}
      const { generateFinancePDF } = await import("@/lib/generateFinancePDF");
      await generateFinancePDF(visibleTx, userInfo, now.getMonth() + 1, now.getFullYear());
    } catch (e) { console.error(e); alert(t("Gagal membuat PDF", "Failed to generate PDF")); }
    setExportLoading(false);
  }

  const SUMMARY = [
    { label: t("Pemasukan",  "Income"),  value: income,            color: C.income,                      Icon: LogIn    },
    { label: t("Pengeluaran","Expense"), value: expense,           color: C.expense,                     Icon: LogOut   },
    { label: t("Tabungan",   "Savings"), value: invest,            color: C.invest,                      Icon: Landmark },
    { label: t("Saldo",      "Balance"), value: Math.abs(balance), color: balance >= 0 ? C.income : C.expense, Icon: Wallet },
  ];

  return (
    <div style={{ minHeight: "100vh", paddingBottom: 120, background: C.bg }}>
      <style>{`
        @keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
        select option { background: ${C.surface}; color: ${C.textP} }
      `}</style>

      {/* ══ HEADER ═══════════════════════════════════════════════════════════ */}
      <div className="kd-sticky-header" style={{
        background: isDark ? `${C.bg}F2` : `${C.bg}F5`,
        backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
        borderBottom: `1px solid ${C.border}`,
        paddingTop: "env(safe-area-inset-top, 0px)",
      }}>
        <div style={{ padding: "16px var(--page-pad) 0" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div>
              <h1 style={{ fontSize: "var(--fs-md)", fontWeight: 900, color: C.textP, margin: 0 }}>{t("Dompet", "Wallet")}</h1>
              <p style={{ fontSize: "var(--fs-xs)", color: C.textM, margin: "3px 0 0" }}>
                {format(new Date(applied.start + "T00:00:00"), "d MMM", { locale })} – {format(new Date(applied.end + "T00:00:00"), "d MMM yyyy", { locale })}
              </p>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setShowFilter(v => !v)} style={{ width: 38, height: 38, borderRadius: 11, background: showFilter ? C.primBg : C.inputBg, border: `1.5px solid ${showFilter ? C.primary : C.border}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                <Search size={15} color={showFilter ? C.primary : C.textM} />
              </button>
              <button onClick={openAdd} style={{ height: 38, paddingLeft: 14, paddingRight: 16, borderRadius: 11, background: `linear-gradient(135deg, #378ADD 0%, ${C.primary} 100%)`, border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                <Plus size={15} color={C.onPrimary} strokeWidth={2.5} />
                <span style={{ fontSize: "var(--fs-sm)", fontWeight: 700, color: C.onPrimary }}>{t("Catat", "Add")}</span>
              </button>
            </div>
          </div>

          {/* Filter panel */}
          {showFilter && (
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "var(--card-radius)", padding: 14, marginBottom: 12, display: "flex", flexDirection: "column", gap: 10 }}>
              <div>
                <label style={labelSt}>{t("Tipe", "Type")}</label>
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)} style={selectSt}>
                  <option value="all">{t("Semua", "All")}</option>
                  <option value="INCOME">{t("Pemasukan", "Income")}</option>
                  <option value="EXPENSE">{t("Pengeluaran", "Expense")}</option>
                  <option value="INVEST">{t("Tabungan", "Savings")}</option>
                </select>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div><label style={labelSt}>{t("Dari", "From")}</label><input type="date" value={filterStart} onChange={e => setFilterStart(e.target.value)} style={inputSt} /></div>
                <div><label style={labelSt}>{t("Sampai", "To")}</label><input type="date" value={filterEnd}   onChange={e => setFilterEnd(e.target.value)}   style={inputSt} /></div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                <button onClick={() => { const d = defaultRange(); setFilterStatus("all"); setFilterStart(d.start); setFilterEnd(d.end); setApplied({ status: "all", ...d }); setShowFilter(false); }} style={{ padding: "10px 0", borderRadius: "var(--btn-radius)", fontFamily: "inherit", background: C.inputBg, border: `1px solid ${C.border}`, color: C.textM, fontSize: "var(--fs-xs)", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                  <RotateCcw size={12} />{t("Reset", "Reset")}
                </button>
                <button onClick={() => { setApplied({ status: filterStatus, start: filterStart, end: filterEnd }); setShowFilter(false); }} style={{ padding: "10px 0", borderRadius: "var(--btn-radius)", background: `#378ADD`, border: "none", color: "#fff", fontSize: "var(--fs-xs)", fontWeight: 700, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                  <Search size={12} />{t("Cari", "Search")}
                </button>
                <button onClick={exportPDF} disabled={exportLoading} style={{ padding: "10px 0", borderRadius: "var(--btn-radius)", background: `${C.expense}1A`, border: `1px solid ${C.expense}40`, color: C.expense, fontSize: "var(--fs-xs)", fontWeight: 700, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                  {exportLoading ? <Loader size={12} style={{ animation: "spin 1s linear infinite" }} /> : <FileText size={12} />} PDF
                </button>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div style={{ display: "flex", background: C.surf2, borderRadius: 12, padding: 3 }}>
            {(["overview", "transactions"] as const).map(tab => {
              const active = activeTab === tab;
              return (
                <button key={tab} onClick={() => setActiveTab(tab)} style={{ flex: 1, padding: "8px 0", borderRadius: 10, fontSize: "var(--fs-sm)", fontWeight: 700, cursor: "pointer", transition: "all 0.15s", background: active ? C.primary : "transparent", border: "none", color: active ? C.onPrimary : C.textM, fontFamily: "inherit" }}>
                  {tab === "overview" ? t("Ringkasan", "Overview") : t("Transaksi", "Transactions")}
                </button>
              );
            })}
          </div>
        </div>
        <div style={{ height: 12 }} />
      </div>

      {/* ══ BODY ═════════════════════════════════════════════════════════════ */}
      <div style={{ padding: "12px var(--page-pad)", display: "flex", flexDirection: "column", gap: 12 }}>

        {/* Summary cards — 2x2 grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {SUMMARY.map((item, i) => {
            const Icon = item.Icon;
            const isBalance = i === 3;
            return (
              <div key={i} style={{ background: C.surface, border: `1px solid ${isBalance ? `${item.color}35` : C.border}`, borderRadius: "var(--card-radius)", padding: "14px 14px 12px", display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: `${item.color}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon size={17} color={item.color} />
                  </div>
                  {isBalance && (
                    <span style={{ fontSize: 9, fontWeight: 700, color: item.color, background: `${item.color}18`, border: `1px solid ${item.color}30`, borderRadius: 999, padding: "2px 7px" }}>
                      {balance >= 0 ? t("Aman", "Safe") : t("Minus", "Deficit")}
                    </span>
                  )}
                </div>
                <div>
                  <p style={{ fontSize: 10, fontWeight: 600, color: C.textM, margin: "0 0 3px", letterSpacing: "0.05em" }}>{item.label}</p>
                  <p style={{ fontSize: "clamp(13px, 3.5vw, 16px)", fontWeight: 900, color: item.color, margin: 0 }}>{formatRupiah(item.value)}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Grafik Keuangan */}
        {activeTab === "overview" && (
          <FinanceTrendChart
            fallbackTransactions={visibleTx}
            fallbackStart={applied.start}
            fallbackEnd={applied.end}
          />
        )}

        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "48px 0" }}>
            <Loader size={22} style={{ color: C.primary, animation: "spin 1s linear infinite" }} />
          </div>

        ) : activeTab === "overview" ? (
          /* ── OVERVIEW TAB ───────────────────────────────────── */
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {([
              { title: t("Pemasukan per Kategori",  "Income by Category"),  data: buildPie("INCOME"),  accent: C.income  },
              { title: t("Pengeluaran per Kategori","Expense by Category"), data: buildPie("EXPENSE"), accent: C.expense },
              { title: t("Tabungan per Kategori",   "Savings by Category"), data: buildPie("INVEST"),  accent: C.invest  },
            ]).map(sec => {
              if (sec.data.length === 0) return null;
              const total = sec.data.reduce((s, d) => s + d.value, 0);
              return (
                <div key={sec.title} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "var(--card-radius)", padding: 16, overflow: "hidden" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                    <div style={{ width: 3, height: 16, borderRadius: 2, background: sec.accent }} />
                    <p style={{ fontSize: "var(--fs-sm)", fontWeight: 700, color: C.textP, margin: 0 }}>{sec.title}</p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{ width: 100, height: 100, flexShrink: 0 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={sec.data} cx="50%" cy="50%" innerRadius={28} outerRadius={46} dataKey="value" paddingAngle={3}>
                            {sec.data.map((d, i) => <Cell key={i} fill={d.color} />)}
                          </Pie>
                          <Tooltip formatter={(v: number) => formatRupiah(v)} contentStyle={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, fontSize: 12, color: C.textP }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 7 }}>
                      {sec.data.map((d, i) => {
                        const pct = total > 0 ? Math.round((d.value / total) * 100) : 0;
                        return (
                          <div key={i}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 3 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 5, flex: 1, minWidth: 0 }}>
                                <span style={{ width: 6, height: 6, borderRadius: "50%", background: d.color, flexShrink: 0 }} />
                                <span style={{ fontSize: 11, color: C.textM, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.name}</span>
                              </div>
                              <span style={{ fontSize: 10, fontWeight: 700, color: C.textM, flexShrink: 0, marginLeft: 6 }}>{pct}%</span>
                            </div>
                            <div style={{ height: 3, borderRadius: 2, background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)", overflow: "hidden" }}>
                              <div style={{ width: `${pct}%`, height: "100%", borderRadius: 2, background: d.color }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}

            {buildPie("INCOME").length + buildPie("EXPENSE").length + buildPie("INVEST").length === 0 && (
              <div style={{ textAlign: "center", padding: "48px 20px", background: C.surface, border: `1px solid ${C.border}`, borderRadius: "var(--card-radius)" }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: `${C.primary}14`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
                  <Wallet size={22} color={C.textM} />
                </div>
                <p style={{ fontSize: "var(--fs-sm)", fontWeight: 700, color: C.textM, margin: 0 }}>
                  {t("Belum ada transaksi di periode ini", "No transactions in this period")}
                </p>
              </div>
            )}
          </div>

        ) : (
          /* ── TRANSACTIONS TAB ───────────────────────────────── */
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <p style={{ fontSize: "var(--fs-sm)", fontWeight: 700, color: C.textP, margin: 0 }}>{t("Riwayat Transaksi", "Transaction History")}</p>
              <span style={{ fontSize: "var(--fs-xs)", color: C.textM }}>{filteredTx.length} {t("transaksi", "entries")}</span>
            </div>

            {filteredTx.length === 0 ? (
              <div style={{ textAlign: "center", padding: "48px 20px", background: C.surface, border: `1px solid ${C.border}`, borderRadius: "var(--card-radius)" }}>
                <Search size={32} color={C.border} style={{ marginBottom: 12 }} />
                <p style={{ fontSize: "var(--fs-sm)", fontWeight: 700, color: C.textM, margin: 0 }}>{t("Tidak ada transaksi", "No transactions found")}</p>
              </div>
            ) : (
              Object.entries(grouped).sort(([a], [b]) => b.localeCompare(a)).map(([dateKey, txList]) => {
                const dayNet = txList.reduce((s, tx) => tx.type === "INCOME" ? s + tx.amount : s - tx.amount, 0);
                return (
                  <div key={dateKey}>
                    {/* Date header */}
                    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 2px 10px" }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: C.textM, letterSpacing: "0.06em", textTransform: "uppercase", flexShrink: 0 }}>
                        {format(new Date(dateKey + "T00:00:00"), "d MMMM yyyy", { locale })}
                      </span>
                      <div style={{ flex: 1, height: 1, background: C.border }} />
                      <span style={{ fontSize: 11, fontWeight: 700, color: dayNet >= 0 ? C.income : C.expense, flexShrink: 0 }}>
                        {dayNet >= 0 ? "+" : ""}{formatRupiah(dayNet)}
                      </span>
                    </div>

                    {/* Transaction list */}
                    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "var(--card-radius)", overflow: "hidden" }}>
                      {txList.map((tx, idx) => {
                        const meta = TYPE_META[tx.type];
                        const Icon = meta.Icon;
                        const sign = tx.type === "INCOME" ? "+" : "−";
                        return (
                          <div key={tx.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 14px", borderTop: idx > 0 ? `1px solid ${C.border}` : "none" }}>
                            {/* Icon */}
                            <div style={{ width: 40, height: 40, borderRadius: 12, background: meta.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                              <Icon size={17} color={meta.color} />
                            </div>

                            {/* Info */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ fontSize: "var(--fs-sm)", fontWeight: 700, color: C.textP, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {tx.name}
                              </p>
                              <span style={{ fontSize: 10, fontWeight: 600, color: meta.color, background: meta.bg, padding: "1px 7px", borderRadius: 20, display: "inline-block", marginTop: 3 }}>
                                {tx.category}
                              </span>
                            </div>

                            {/* Amount + actions */}
                            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 5 }}>
                              <span style={{ fontSize: "var(--fs-sm)", fontWeight: 800, color: meta.color }}>
                                {sign}{formatRupiah(tx.amount)}
                              </span>
                              <div style={{ display: "flex", gap: 4 }}>
                                <button onClick={() => openEdit(tx)} style={{ width: 26, height: 26, borderRadius: 7, background: `${C.primary}1A`, border: `1px solid ${C.primary}33`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                  <Pencil size={11} color={C.primary} />
                                </button>
                                <button onClick={() => handleDelete(tx.id)} style={{ width: 26, height: 26, borderRadius: 7, background: `${C.expense}1A`, border: `1px solid ${C.expense}33`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                  <Trash2 size={11} color={C.expense} />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* ══ FORM MODAL ════════════════════════════════════════════════════════ */}
      {showForm && (
        <div onClick={e => e.target === e.currentTarget && setShowForm(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 100, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
          <div style={{ width: "100%", maxWidth: 480, borderRadius: "28px 28px 0 0", background: C.surface, border: `1px solid ${C.border}`, borderBottom: "none", padding: "6px 20px 48px", maxHeight: "92vh", overflowY: "auto" }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: C.border, margin: "12px auto 18px" }} />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <h2 style={{ fontSize: "var(--fs-md)", fontWeight: 800, color: C.textP, margin: 0 }}>
                {editingId ? t("Edit Transaksi", "Edit Transaction") : t("Catat Transaksi", "New Transaction")}
              </h2>
              <button onClick={() => setShowForm(false)} style={{ width: 32, height: 32, borderRadius: 9, background: C.inputBg, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                <X size={15} color={C.textM} />
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {/* Type selector */}
              <div>
                <label style={labelSt}>{t("Tipe", "Type")}</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                  {(["INCOME", "EXPENSE", "INVEST"] as TxType[]).map(type => {
                    const meta = TYPE_META[type]; const active = form.type === type; const Icon = meta.Icon;
                    return (
                      <button key={type} onClick={() => changeFormType(type)} style={{ padding: "11px 0", borderRadius: "var(--btn-radius)", fontSize: "var(--fs-xs)", fontWeight: 700, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s", background: active ? meta.bg : "transparent", border: `1.5px solid ${active ? meta.color : C.border}`, color: active ? meta.color : C.textM, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                        <Icon size={15} color={active ? meta.color : C.textM} />
                        {L(meta)}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div><label style={labelSt}>{t("Keterangan", "Description")}</label><input placeholder={t("cth: Makan siang", "e.g: Lunch")} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={inputSt} /></div>
              <div><label style={labelSt}>{t("Jumlah (Rp)", "Amount (Rp)")}</label><input type="number" placeholder="50000" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} style={inputSt} /></div>
              <div>
                <label style={labelSt}>{t("Kategori", "Category")}</label>
                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value, customCategory: "" })} style={selectSt}>
                  {CATEGORIES[form.type].map(c => <option key={c.label} value={c.label}>{c.label}</option>)}
                </select>
                {form.category === "Lainnya" && (
                  <input placeholder={t("Nama kategori", "Category name")} value={form.customCategory} onChange={e => setForm({ ...form, customCategory: e.target.value })} style={{ ...inputSt, marginTop: 8 }} />
                )}
              </div>
              <div><label style={labelSt}>{t("Tanggal", "Date")}</label><input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} style={inputSt} /></div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 10, marginTop: 20 }}>
              <button onClick={() => setForm(f => ({ ...f, name: "", amount: "", customCategory: "" }))} style={{ padding: "13px 0", borderRadius: "var(--btn-radius)", fontFamily: "inherit", background: "transparent", border: `1px solid ${C.border}`, color: C.textM, fontSize: "var(--fs-sm)", fontWeight: 700, cursor: "pointer" }}>
                {t("Reset", "Reset")}
              </button>
              <button onClick={handleSave} style={{ padding: "13px 0", borderRadius: "var(--btn-radius)", background: `linear-gradient(135deg, #378ADD 0%, ${C.primary} 100%)`, border: "none", color: C.onPrimary, fontSize: "var(--fs-sm)", fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>
                {editingId ? t("Perbarui", "Update") : t("Simpan", "Save")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}