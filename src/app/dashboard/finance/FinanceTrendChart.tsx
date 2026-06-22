// src/app/dashboard/finance/FinanceTrendChart.tsx
"use client";
import { useState, useEffect, useMemo, useCallback } from "react";
import {
  BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from "recharts";
import {
  format, subDays, subMonths, subYears,
  startOfDay, startOfWeek, startOfMonth, startOfYear,
  eachDayOfInterval, parseISO, differenceInCalendarDays,
} from "date-fns";
import type { Locale } from "date-fns";
import { id as idLocale, enUS } from "date-fns/locale";
import { CalendarRange, Loader } from "lucide-react";
import { formatRupiah } from "@/lib/utils";
import { useApp } from "@/components/AppContext";

// ── Types ──────────────────────────────────────────────────────────────────

type TxType = "INCOME" | "EXPENSE" | "INVEST";
interface Transaction {
  id: string; name: string; type: TxType;
  amount: number; category: string; date: string;
}
type Granularity = "day" | "week" | "month" | "year";
type RangePreset = "1m" | "3m" | "6m" | "1y" | "custom";

interface ChartEntry {
  label: string;
  income: number;
  expense: number;
  invest: number;
  balance: number;
}

interface Props {
  fallbackTransactions: Transaction[];
  fallbackStart: string;
  fallbackEnd: string;
}

// ── Constants ──────────────────────────────────────────────────────────────

const RANGE_PRESETS: { value: RangePreset; id: string; en: string; granularity: Granularity }[] = [
  { value: "1m",     id: "1 Bulan", en: "1 Month",  granularity: "day"   },
  { value: "3m",     id: "3 Bulan", en: "3 Months", granularity: "week"  },
  { value: "6m",     id: "6 Bulan", en: "6 Months", granularity: "month" },
  { value: "1y",     id: "1 Tahun", en: "1 Year",   granularity: "month" },
  { value: "custom", id: "Custom",  en: "Custom",   granularity: "month" },
];

const GRANULARITY_OPTS: { value: Granularity; id: string; en: string }[] = [
  { value: "day",   id: "Harian",   en: "Daily"   },
  { value: "week",  id: "Mingguan", en: "Weekly"  },
  { value: "month", id: "Bulanan",  en: "Monthly" },
  { value: "year",  id: "Tahunan",  en: "Yearly"  },
];

// ── Pure helpers ───────────────────────────────────────────────────────────

/**
 * Build Y-axis tick marks at fixed intervals (default 2 juta).
 * Covers from the most-negative balance bucket up to the largest income bucket.
 */
function buildTicks(data: ChartEntry[], step = 2_000_000): number[] {
  if (data.length === 0) return [0];
  const maxVal = Math.max(...data.map(d => Math.max(d.income, 0)));
  const minVal = Math.min(...data.map(d => Math.min(d.balance, 0)));
  const upper  = Math.ceil(maxVal  / step) * step;
  const lower  = Math.floor(minVal / step) * step;
  const ticks: number[] = [];
  for (let v = lower; v <= upper; v += step) ticks.push(v);
  return ticks;
}

function rangeForPreset(preset: RangePreset, customStart: string, customEnd: string) {
  const now = new Date();
  switch (preset) {
    case "1m":     return { start: subDays(now, 30),    end: now };
    case "3m":     return { start: subMonths(now, 3),   end: now };
    case "6m":     return { start: subMonths(now, 6),   end: now };
    case "1y":     return { start: subYears(now, 1),    end: now };
    case "custom": return {
      start: customStart ? parseISO(customStart) : subMonths(now, 1),
      end:   customEnd   ? parseISO(customEnd)   : now,
    };
  }
}

function bucketKey(d: Date, gran: Granularity): { key: string; sortDate: Date } {
  if (gran === "day")   { const x = startOfDay(d);                              return { key: format(x, "yyyy-MM-dd"), sortDate: x }; }
  if (gran === "week")  { const x = startOfWeek(d, { weekStartsOn: 1 });        return { key: format(x, "yyyy-MM-dd"), sortDate: x }; }
  if (gran === "month") { const x = startOfMonth(d);                            return { key: format(x, "yyyy-MM"),    sortDate: x }; }
  const x = startOfYear(d);                                                     return { key: format(x, "yyyy"),       sortDate: x };
}

function bucketLabel(sortDate: Date, gran: Granularity, locale: Locale): string {
  if (gran === "day")   return format(sortDate, "d MMM",  { locale });
  if (gran === "week")  return format(sortDate, "d MMM",  { locale });
  if (gran === "month") return format(sortDate, "MMM yy", { locale });
  return format(sortDate, "yyyy");
}

/**
 * Membatasi pilihan granularitas sesuai panjang rentang tanggal yang dipilih.
 * Ini yang sebelumnya bikin grafik membingungkan: pilih "Harian" sambil rentangnya
 * "3 Bulan" menghasilkan ~90 kolom, hampir semuanya kosong, jadi kelihatan seperti
 * satu lonjakan aneh di tengah grafik kosong. Dengan ini, opsi yang nggak masuk akal
 * untuk rentang tersebut otomatis disembunyikan.
 */
function allowedGranularities(spanDays: number): Granularity[] {
  if (spanDays <= 31)  return ["day", "week"];
  if (spanDays <= 120) return ["week", "month"];
  if (spanDays <= 370) return ["month"];
  return ["month", "year"];
}

// ── Component ──────────────────────────────────────────────────────────────

export default function FinanceTrendChart({ fallbackTransactions, fallbackStart, fallbackEnd }: Props) {
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
    textP:   colors.textPrimary,
    textB:   colors.textBody,
    textM:   colors.textMuted,
    income:  colors.secondary,
    expense: colors.danger,
    invest:  colors.accent,
  };

  const [preset,      setPreset]      = useState<RangePreset>("3m");
  const [granularity, setGranularity] = useState<Granularity>("week");
  const [customStart, setCustomStart] = useState(fallbackStart);
  const [customEnd,   setCustomEnd]   = useState(fallbackEnd);
  const [showCustom,  setShowCustom]  = useState(false);
  const [chartTx,     setChartTx]     = useState<Transaction[] | null>(null);
  const [loading,     setLoading]     = useState(false);

  const { start, end } = useMemo(
    () => rangeForPreset(preset, customStart, customEnd),
    [preset, customStart, customEnd],
  );
  const startStr  = format(start, "yyyy-MM-dd");
  const endStr    = format(end,   "yyyy-MM-dd");
  const spanDays  = differenceInCalendarDays(end, start);
  const allowedGran = allowedGranularities(spanDays);

  // Kalau rentang berubah dan granularitas aktif jadi nggak valid, otomatis reset.
  useEffect(() => {
    if (!allowedGranularities(spanDays).includes(granularity)) {
      setGranularity(allowedGranularities(spanDays)[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spanDays]);

  const usesFallback = startStr === fallbackStart && endStr === fallbackEnd;

  const fetchChartTx = useCallback(async () => {
    if (usesFallback) { setChartTx(null); return; }
    setLoading(true);
    try {
      const params = new URLSearchParams({ start: startStr, end: endStr });
      const res  = await fetch(`/api/transactions?${params}`);
      const data = await res.json();
      setChartTx(Array.isArray(data) ? data : []);
    } catch {
      setChartTx([]);
    }
    setLoading(false);
  }, [usesFallback, startStr, endStr]);

  useEffect(() => { fetchChartTx(); }, [fetchChartTx]);

  function applyPreset(p: RangePreset) {
    setPreset(p);
    setShowCustom(p === "custom");
    const opt = RANGE_PRESETS.find(r => r.value === p);
    if (opt && p !== "custom") setGranularity(opt.granularity);
  }

  const sourceTx = usesFallback ? fallbackTransactions : (chartTx ?? []);

  // ── Build chart data ───────────────────────────────────────────────────
  const chartData = useMemo((): ChartEntry[] => {
    const buckets = new Map<string, { sortDate: Date; income: number; expense: number; invest: number }>();

    if (granularity !== "year") {
      eachDayOfInterval({ start, end }).forEach(d => {
        const { key, sortDate } = bucketKey(d, granularity);
        if (!buckets.has(key)) buckets.set(key, { sortDate, income: 0, expense: 0, invest: 0 });
      });
    }

    sourceTx.forEach(tx => {
      const d = new Date(tx.date);
      if (d < start || d > end) return;
      const { key, sortDate } = bucketKey(d, granularity);
      const b = buckets.get(key) ?? { sortDate, income: 0, expense: 0, invest: 0 };
      if (tx.type === "INCOME")  b.income  += tx.amount;
      if (tx.type === "EXPENSE") b.expense += tx.amount;
      if (tx.type === "INVEST")  b.invest  += tx.amount;
      buckets.set(key, b);
    });

    return Array.from(buckets.entries())
      .sort((a, b) => a[1].sortDate.getTime() - b[1].sortDate.getTime())
      .map(([, b]) => ({
        label:   bucketLabel(b.sortDate, granularity, locale),
        income:  b.income,
        expense: b.expense,
        invest:  b.invest,
        balance: b.income - b.expense - b.invest,
      }));
  }, [sourceTx, start, end, granularity, locale]);

  const gridClr = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";
  const axisClr = C.textM;
  const yTicks  = buildTicks(chartData, 2_000_000);

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div style={{
      background: C.surface,
      border: `1px solid ${C.border}`,
      borderRadius: "var(--card-radius)",
      padding: 16,
      overflow: "hidden",
    }}>

      {/* HEADER */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 3, height: 16, borderRadius: 2, background: C.primary }} />
          <p style={{ fontSize: "var(--fs-sm)", fontWeight: 700, color: C.textP, margin: 0 }}>
            {t("Tren Aktivitas Keuangan", "Financial Activity Trend")}
          </p>
        </div>
        {loading && <Loader size={14} style={{ color: C.primary, animation: "spin 1s linear infinite" }} />}
      </div>

      {/* TIME CONTROLS */}
      <div style={{ background: C.surf2, borderRadius: 12, padding: 8, marginBottom: 14 }}>

        {/* Range preset pills */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", paddingBottom: 8 }}>
          {RANGE_PRESETS.map(opt => {
            const active = preset === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => applyPreset(opt.value)}
                style={{
                  flexShrink: 0, padding: "6px 12px", borderRadius: 999,
                  fontSize: "var(--fs-xs)", fontWeight: 700,
                  cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap",
                  background: active ? C.primary : C.surface,
                  border: `1px solid ${active ? C.primary : C.border}`,
                  color: active ? (isDark ? "#0D1117" : "#fff") : C.textM,
                  display: "flex", alignItems: "center", gap: 4,
                }}
              >
                {opt.value === "custom" && <CalendarRange size={11} />}
                {L(opt)}
              </button>
            );
          })}
        </div>

        {/* Custom date inputs */}
        {showCustom && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
            <div>
              <label style={{ fontSize: 10, fontWeight: 700, color: C.textM, display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {t("Dari", "From")}
              </label>
              <input
                type="date" value={customStart}
                onChange={e => setCustomStart(e.target.value)}
                style={{ width: "100%", padding: "8px 10px", borderRadius: 9, background: C.surface, border: `1px solid ${C.border}`, color: C.textP, fontSize: "var(--fs-xs)", outline: "none", boxSizing: "border-box", fontFamily: "inherit" }}
              />
            </div>
            <div>
              <label style={{ fontSize: 10, fontWeight: 700, color: C.textM, display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {t("Sampai", "To")}
              </label>
              <input
                type="date" value={customEnd}
                onChange={e => setCustomEnd(e.target.value)}
                style={{ width: "100%", padding: "8px 10px", borderRadius: 9, background: C.surface, border: `1px solid ${C.border}`, color: C.textP, fontSize: "var(--fs-xs)", outline: "none", boxSizing: "border-box", fontFamily: "inherit" }}
              />
            </div>
          </div>
        )}

        {/* Granularity toggle */}
        <div style={{ display: "flex", gap: 6 }}>
          {GRANULARITY_OPTS.filter(opt => allowedGran.includes(opt.value)).map(opt => {
            const active = granularity === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => setGranularity(opt.value)}
                style={{
                  flex: 1, padding: "7px 0", borderRadius: 9,
                  fontSize: "var(--fs-xs)", fontWeight: 700,
                  cursor: "pointer", fontFamily: "inherit",
                  background: active ? C.surface : "transparent",
                  border: `1px solid ${active ? C.border : "transparent"}`,
                  color: active ? C.textP : C.textM,
                  boxShadow: active ? "0 1px 2px rgba(0,0,0,0.06)" : "none",
                }}
              >
                {L(opt)}
              </button>
            );
          })}
        </div>
      </div>

      {/* CHART */}
      <div style={{ width: "100%", height: 260 }}>
        {chartData.length === 0 ? (
          <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <p style={{ fontSize: "var(--fs-xs)", color: C.textM }}>
              {t("Tidak ada data pada rentang ini", "No data in this range")}
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 6, right: 8, left: -10, bottom: 0 }}
              barCategoryGap="32%"
            >
              <CartesianGrid strokeDasharray="3 3" stroke={gridClr} vertical={false} />

              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: axisClr }}
                axisLine={{ stroke: C.border }}
                tickLine={false}
                interval="preserveStartEnd"
                minTickGap={26}
              />

              <YAxis
                ticks={yTicks}
                tick={{ fontSize: 10, fill: axisClr }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) => {
                  const abs = Math.abs(v);
                  if (abs >= 1_000_000) return `${(v / 1_000_000).toFixed(0)}jt`;
                  if (abs >= 1_000)     return `${(v / 1_000).toFixed(0)}rb`;
                  return String(v);
                }}
              />

              <ReferenceLine y={0} stroke={C.border} />

              {/* Custom tooltip — breakdown lengkap per periode */}
              <Tooltip
                cursor={{ fill: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)" }}
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0]?.payload as ChartEntry | undefined;
                  if (!d) return null;
                  return (
                    <div style={{
                      background: C.surface,
                      border: `1px solid ${C.border}`,
                      borderRadius: 10,
                      padding: "10px 13px",
                      fontSize: 12,
                      minWidth: 190,
                      boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
                    }}>
                      <p style={{ fontWeight: 700, color: C.textP, margin: "0 0 8px" }}>{label}</p>
                      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>

                        {/* Pemasukan */}
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
                          <span style={{ color: C.textM }}>{t("Pemasukan", "Income")}</span>
                          <span style={{ fontWeight: 700, color: C.income }}>
                            +{formatRupiah(d.income)}
                          </span>
                        </div>

                        {/* Pengeluaran */}
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
                          <span style={{ color: C.textM }}>{t("Pengeluaran", "Expense")}</span>
                          <span style={{ fontWeight: 700, color: C.expense }}>
                            −{formatRupiah(d.expense)}
                          </span>
                        </div>

                        {/* Tabungan */}
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
                          <span style={{ color: C.textM }}>{t("Tabungan", "Savings")}</span>
                          <span style={{ fontWeight: 700, color: C.invest }}>
                            −{formatRupiah(d.invest)}
                          </span>
                        </div>

                        {/* Divider */}
                        <div style={{ height: 1, background: C.border, margin: "3px 0" }} />

                        {/* Saldo Bersih */}
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
                          <span style={{ color: C.textP, fontWeight: 700 }}>
                            {t("Saldo Bersih", "Net Balance")}
                          </span>
                          <span style={{ fontWeight: 800, color: d.balance >= 0 ? C.income : C.expense }}>
                            {d.balance >= 0 ? "+" : "−"}{formatRupiah(Math.abs(d.balance))}
                          </span>
                        </div>

                      </div>
                    </div>
                  );
                }}
              />

              <Bar
                dataKey="balance"
                name={L({ id: "Saldo Bersih", en: "Net Balance" })}
                radius={[4, 4, 4, 4]}
                maxBarSize={22}
              >
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={entry.balance >= 0 ? C.income : C.expense} />
                ))}
              </Bar>

            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

    </div>
  );
}