import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import fs from "fs";
import path from "path";

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amount);
}

const CAT_COLORS: Record<string, string> = {
  "Beasiswa":              "#378ADD",
  "Kerja Sampingan":       "#639922",
  "Kiriman Orang Tua":     "#BA7517",
  "Transfer":              "#85B7EB",
  "Konsumsi":              "#E24B4A",
  "Biaya Tempat Tinggal":  "#F09595",
  "Tagihan Rutin":         "#BA7517",
  "Transportasi":          "#85B7EB",
  "Buku/ATK":              "#7F77DD",
  "Hiburan":               "#639922",
  "Kesehatan":             "#1D9E75",
  "Investasi":             "#7F77DD",
  "Kebutuhan Lainnya":     "#85B7EB",
  "Dana Darurat":          "#BA7517",
  "Tabungan Khusus":       "#1D9E75",
  "Lainnya":               "#94A3B8",
};
function dotColor(cat: string) { return CAT_COLORS[cat] ?? "#94A3B8"; }

function typeLabel(t: string) { return t === "INCOME" ? "Pemasukan" : t === "EXPENSE" ? "Pengeluaran" : "Tabungan"; }
function typeColor(t: string) { return t === "INCOME" ? "#2E7D1E" : t === "EXPENSE" ? "#C0392B" : "#1A5FAB"; }
function typeBg(t: string)    { return t === "INCOME" ? "#EBF5E9" : t === "EXPENSE" ? "#FDEDED"  : "#E8F1FB"; }
function typeSign(t: string)  { return t === "INCOME" ? "+" : "-"; }

function getLogoBase64(): string | null {
  try {
    const p = path.join(process.cwd(), "public", "logo-darkmode.png");
    return `data:image/png;base64,${fs.readFileSync(p).toString("base64")}`;
  } catch { return null; }
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const month = parseInt(searchParams.get("month") || String(new Date().getMonth() + 1));
  const year  = parseInt(searchParams.get("year")  || String(new Date().getFullYear()));

  const [transactions, user] = await Promise.all([
    prisma.transaction.findMany({
      where: { userId: session.user.id, date: { gte: new Date(year, month-1, 1), lt: new Date(year, month, 1) } },
      orderBy: { date: "asc" },
    }),
    prisma.user.findUnique({ where: { id: session.user.id } }),
  ]);

  const income  = transactions.filter(t => t.type === "INCOME").reduce((s,t) => s+t.amount, 0);
  const expense = transactions.filter(t => t.type === "EXPENSE").reduce((s,t) => s+t.amount, 0);
  const invest  = transactions.filter(t => t.type === "INVEST").reduce((s,t) => s+t.amount, 0);
  const balance = income - expense - invest;

  const monthName  = format(new Date(year, month-1, 1), "MMMM yyyy", { locale: id });
  const exportedAt = format(new Date(), "d MMMM yyyy, HH:mm", { locale: id });
  const logoSrc    = getLogoBase64();

  function buildBreakdown(type: string) {
    const totals: Record<string,number> = {};
    const subTotal = transactions.filter(t => t.type === type).reduce((s,t) => {
      totals[t.category] = (totals[t.category]||0) + t.amount; return s+t.amount;
    }, 0);
    return { rows: Object.entries(totals).sort((a,b) => b[1]-a[1]), subTotal };
  }

  const inc = buildBreakdown("INCOME");
  const exp = buildBreakdown("EXPENSE");
  const inv = buildBreakdown("INVEST");

  const PCA = `-webkit-print-color-adjust:exact;print-color-adjust:exact;`;
  const TH  = `style="background:#0D1117;color:#fff;padding:8px 12px;font-size:10px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;text-align:left;${PCA}"`;
  const THR = `style="background:#0D1117;color:#fff;padding:8px 12px;font-size:10px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;text-align:right;${PCA}"`;

  function catRows(rows:[string,number][], sub:number) {
    if (!rows.length) return `<tr><td colspan="3" style="text-align:center;color:#94A3B8;padding:14px;font-style:italic;">Tidak ada transaksi</td></tr>`;
    return rows.map(([cat,total],i) => {
      const pct = sub>0?((total/sub)*100).toFixed(1):"0";
      const bg  = i%2===0?"#fff":"#F8FAFC";
      return `<tr style="background:${bg};border-bottom:1px solid #E2E8F0;${PCA}">
        <td style="padding:8px 12px;color:#0D1117;font-size:12px;"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${dotColor(cat)};margin-right:7px;vertical-align:middle;${PCA}"></span>${cat}</td>
        <td style="padding:8px 12px;text-align:right;color:#94A3B8;font-size:12px;">${pct}%</td>
        <td style="padding:8px 12px;text-align:right;font-weight:700;color:#0D1117;font-size:12px;">${formatRupiah(total)}</td>
      </tr>`;
    }).join("") + `<tr style="background:#F0F4F8;border-top:2px solid #CBD5E1;${PCA}">
      <td style="padding:8px 12px;font-weight:700;color:#0D1117;">Total</td><td></td>
      <td style="padding:8px 12px;text-align:right;font-weight:800;color:#0D1117;">${formatRupiah(sub)}</td>
    </tr>`;
  }

  const grouped: Record<string,typeof transactions> = {};
  [...transactions].sort((a,b) => new Date(b.date).getTime()-new Date(a.date).getTime()).forEach(tx => {
    const k = format(new Date(tx.date),"d MMMM yyyy",{locale:id});
    if(!grouped[k]) grouped[k]=[];
    grouped[k].push(tx);
  });

  const logoHtml = logoSrc
    ? `<img src="${logoSrc}" style="width:28px;height:28px;object-fit:contain;" alt="Logo" />`
    : `<span style="font-size:22px;font-weight:900;color:#fff;font-family:Arial,sans-serif;">K</span>`;

  const html = `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Laporan Keuangan \u2014 ${monthName}</title>
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Inter,Arial,sans-serif;font-size:13px;color:#374151;background:#fff;}
@media print{body{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;}}
</style>
</head>
<body>
<div style="max-width:880px;margin:0 auto;background:#fff;">

<!-- BANNER -->
<div style="background:#1A2B45;padding:20px 32px;display:flex;align-items:center;justify-content:space-between;${PCA}">
  <div style="display:flex;align-items:center;gap:14px;">
    <div style="width:46px;height:46px;border-radius:10px;background:rgba(255,255,255,0.12);border:1.5px solid rgba(255,255,255,0.25);display:flex;align-items:center;justify-content:center;flex-shrink:0;${PCA}">
      ${logoHtml}
    </div>
    <div>
      <div style="font-size:20px;font-weight:800;color:#fff;letter-spacing:-0.5px;line-height:1;">Kampder</div>
      <div style="font-size:11px;color:rgba(255,255,255,.6);margin-top:3px;">Kampus Coder \u2014 Dashboard Mahasiswa</div>
    </div>
  </div>
  <div style="text-align:right;">
    <div style="font-size:10.5px;font-weight:600;color:rgba(255,255,255,.5);letter-spacing:.1em;text-transform:uppercase;margin-bottom:3px;">Laporan Resmi</div>
    <div style="font-size:18px;font-weight:800;color:#fff;letter-spacing:-.3px;">Laporan Keuangan</div>
    <div style="font-size:13px;color:rgba(255,255,255,.8);margin-top:2px;font-weight:600;">${monthName}</div>
    <div style="font-size:10px;color:rgba(255,255,255,.45);margin-top:2px;">Diekspor ${exportedAt}</div>
  </div>
</div>
<!-- accent stripe -->
<div style="height:4px;background:linear-gradient(90deg,#BA7517 0%,#378ADD 40%,#639922 100%);${PCA}"></div>

<div style="padding:28px 32px 40px;">

<!-- USER INFO -->
<div style="border:1px solid #E2E8F0;border-radius:8px;overflow:hidden;margin-bottom:28px;">
  <div style="background:#F0F4F8;border-bottom:1px solid #E2E8F0;padding:7px 16px;font-size:10px;font-weight:700;color:#94A3B8;letter-spacing:.1em;text-transform:uppercase;${PCA}">Informasi Akun</div>
  <table style="width:100%;border-collapse:collapse;">
    <tr>
      <td style="width:50%;padding:10px 16px;border-bottom:1px solid #E2E8F0;border-right:1px solid #E2E8F0;">
        <span style="font-size:11px;color:#94A3B8;display:block;margin-bottom:2px;">Nama</span>
        <span style="font-size:13px;font-weight:600;color:#0D1117;">${user?.name ?? "\u2014"}</span>
      </td>
      <td style="width:50%;padding:10px 16px;border-bottom:1px solid #E2E8F0;">
        <span style="font-size:11px;color:#94A3B8;display:block;margin-bottom:2px;">No. Telepon</span>
        <span style="font-size:13px;font-weight:600;color:#0D1117;">${(user as any)?.phone ?? "\u2014"}</span>
      </td>
    </tr>
    <tr>
      <td style="padding:10px 16px;border-right:1px solid #E2E8F0;">
        <span style="font-size:11px;color:#94A3B8;display:block;margin-bottom:2px;">Email</span>
        <span style="font-size:13px;font-weight:600;color:#0D1117;">${user?.email ?? "\u2014"}</span>
      </td>
      <td style="padding:10px 16px;">
        <span style="font-size:11px;color:#94A3B8;display:block;margin-bottom:2px;">Institusi</span>
        <span style="font-size:13px;font-weight:600;color:#0D1117;">${(user as any)?.institution ?? "\u2014"}</span>
      </td>
    </tr>
  </table>
</div>

<!-- RINGKASAN -->
<div style="display:flex;align-items:center;gap:9px;margin-bottom:14px;">
  <div style="width:4px;height:18px;background:#378ADD;border-radius:2px;${PCA}"></div>
  <div style="font-size:14px;font-weight:700;color:#0D1117;">Ringkasan Keuangan</div>
</div>
<table style="width:100%;border-collapse:separate;border-spacing:10px;margin-bottom:26px;margin-left:-10px;margin-right:-10px;">
<tr>
  <td style="border:1px solid #E2E8F0;border-top:3px solid #639922;border-radius:8px;padding:14px 16px;background:#fff;${PCA}">
    <div style="font-size:10px;color:#94A3B8;text-transform:uppercase;letter-spacing:.08em;margin-bottom:8px;">Pemasukan</div>
    <div style="font-size:15px;font-weight:800;color:#2E7D1E;">${formatRupiah(income)}</div>
  </td>
  <td style="border:1px solid #E2E8F0;border-top:3px solid #E24B4A;border-radius:8px;padding:14px 16px;background:#fff;${PCA}">
    <div style="font-size:10px;color:#94A3B8;text-transform:uppercase;letter-spacing:.08em;margin-bottom:8px;">Pengeluaran</div>
    <div style="font-size:15px;font-weight:800;color:#C0392B;">${formatRupiah(expense)}</div>
  </td>
  <td style="border:1px solid #E2E8F0;border-top:3px solid #378ADD;border-radius:8px;padding:14px 16px;background:#fff;${PCA}">
    <div style="font-size:10px;color:#94A3B8;text-transform:uppercase;letter-spacing:.08em;margin-bottom:8px;">Tabungan</div>
    <div style="font-size:15px;font-weight:800;color:#1A5FAB;">${formatRupiah(invest)}</div>
  </td>
  <td style="border:1px solid #E2E8F0;border-top:3px solid ${balance>=0?"#639922":"#E24B4A"};border-radius:8px;padding:14px 16px;background:#fff;${PCA}">
    <div style="font-size:10px;color:#94A3B8;text-transform:uppercase;letter-spacing:.08em;margin-bottom:8px;">Saldo Bersih</div>
    <div style="font-size:15px;font-weight:800;color:${balance>=0?"#2E7D1E":"#C0392B"};">${balance<0?"-":""}${formatRupiah(Math.abs(balance))}</div>
  </td>
</tr>
</table>

<!-- KATEGORI -->
<div style="display:flex;align-items:center;gap:9px;margin-bottom:14px;">
  <div style="width:4px;height:18px;background:#378ADD;border-radius:2px;${PCA}"></div>
  <div style="font-size:14px;font-weight:700;color:#0D1117;">Rincian per Kategori</div>
</div>
<table style="width:100%;border-collapse:separate;border-spacing:10px;margin-bottom:26px;margin-left:-10px;margin-right:-10px;">
<tr style="vertical-align:top;">
  <td style="width:33%;">
    <div style="font-size:10.5px;font-weight:700;color:#639922;text-transform:uppercase;letter-spacing:.09em;padding-bottom:6px;border-bottom:2px solid #639922;margin-bottom:8px;${PCA}">Pemasukan</div>
    <table style="width:100%;border-collapse:collapse;border:1px solid #E2E8F0;overflow:hidden;">
      <thead><tr><th ${TH}>Kategori</th><th ${THR}>%</th><th ${THR}>Jumlah</th></tr></thead>
      <tbody>${catRows(inc.rows,inc.subTotal)}</tbody>
    </table>
  </td>
  <td style="width:33%;">
    <div style="font-size:10.5px;font-weight:700;color:#E24B4A;text-transform:uppercase;letter-spacing:.09em;padding-bottom:6px;border-bottom:2px solid #E24B4A;margin-bottom:8px;${PCA}">Pengeluaran</div>
    <table style="width:100%;border-collapse:collapse;border:1px solid #E2E8F0;overflow:hidden;">
      <thead><tr><th ${TH}>Kategori</th><th ${THR}>%</th><th ${THR}>Jumlah</th></tr></thead>
      <tbody>${catRows(exp.rows,exp.subTotal)}</tbody>
    </table>
  </td>
  <td style="width:33%;">
    <div style="font-size:10.5px;font-weight:700;color:#378ADD;text-transform:uppercase;letter-spacing:.09em;padding-bottom:6px;border-bottom:2px solid #378ADD;margin-bottom:8px;${PCA}">Tabungan</div>
    <table style="width:100%;border-collapse:collapse;border:1px solid #E2E8F0;overflow:hidden;">
      <thead><tr><th ${TH}>Kategori</th><th ${THR}>%</th><th ${THR}>Jumlah</th></tr></thead>
      <tbody>${catRows(inv.rows,inv.subTotal)}</tbody>
    </table>
  </td>
</tr>
</table>

<!-- RIWAYAT -->
<div style="display:flex;align-items:center;gap:9px;margin-bottom:14px;">
  <div style="width:4px;height:18px;background:#378ADD;border-radius:2px;${PCA}"></div>
  <div style="font-size:14px;font-weight:700;color:#0D1117;">Riwayat Transaksi</div>
</div>
<table style="width:100%;border-collapse:collapse;border:1px solid #E2E8F0;overflow:hidden;margin-bottom:28px;">
  <thead>
    <tr style="${PCA}">
      <th ${TH}>Tanggal</th>
      <th ${TH}>Keterangan</th>
      <th ${TH}>Kategori</th>
      <th ${TH}>Tipe</th>
      <th ${THR}>Jumlah</th>
    </tr>
  </thead>
  <tbody>
    ${Object.entries(grouped).map(([dateLabel,txList]) => `
      <tr style="${PCA}">
        <td colspan="5" style="background:#EBF5FF;color:#1A5FAB;font-size:10.5px;font-weight:700;padding:6px 12px;letter-spacing:.06em;text-transform:uppercase;border-bottom:1px solid #BFDBFE;${PCA}">${dateLabel}</td>
      </tr>
      ${txList.map((tx,i) => `
        <tr style="background:${i%2===0?"#fff":"#F8FAFC"};border-bottom:1px solid #F1F5F9;${PCA}">
          <td style="padding:9px 12px;color:#94A3B8;font-size:11.5px;white-space:nowrap;">${format(new Date(tx.date),"d MMM yyyy",{locale:id})}</td>
          <td style="padding:9px 12px;color:#0D1117;font-weight:500;font-size:12px;">${tx.name}</td>
          <td style="padding:9px 12px;font-size:12px;">
            <span style="display:inline-flex;align-items:center;gap:5px;">
              <span style="width:7px;height:7px;border-radius:50%;background:${dotColor(tx.category)};display:inline-block;flex-shrink:0;${PCA}"></span>
              <span style="color:#374151;">${tx.category}</span>
            </span>
          </td>
          <td style="padding:9px 12px;">
            <span style="display:inline-block;padding:2px 9px;border-radius:99px;font-size:10px;font-weight:700;background:${typeBg(tx.type)};color:${typeColor(tx.type)};${PCA}">${typeLabel(tx.type)}</span>
          </td>
          <td style="padding:9px 12px;text-align:right;font-weight:700;font-size:12px;color:${typeColor(tx.type)};">${typeSign(tx.type)}${formatRupiah(tx.amount)}</td>
        </tr>
      `).join("")}
    `).join("") || `<tr><td colspan="5" style="text-align:center;color:#94A3B8;padding:20px;font-style:italic;">Tidak ada transaksi bulan ini</td></tr>`}
  </tbody>
</table>

<!-- FOOTER -->
<div style="border-top:1px solid #E2E8F0;padding-top:14px;display:flex;justify-content:space-between;font-size:10.5px;color:#94A3B8;">
  <div><strong style="color:#374151;">Kampder</strong> &middot; Kampus Coder \u2014 Dashboard Mahasiswa</div>
  <div>Laporan ${monthName} &middot; Dicetak ${exportedAt}</div>
</div>

</div></div>
</body>
</html>`;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `attachment; filename="laporan-keuangan-${year}-${String(month).padStart(2,"0")}.html"`,
    },
  });
}