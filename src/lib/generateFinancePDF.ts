// lib/generateFinancePDF.ts
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export interface FinanceTransaction {
  id: string; name: string;
  type: "INCOME" | "EXPENSE" | "INVEST";
  amount: number; category: string; date: string;
}
export interface FinanceUserInfo {
  name?: string | null; email?: string | null;
  phone?: string | null; institution?: string | null;
}

type RGB = [number, number, number];

// ── Palette — Bank e-Statement style ────────────────────────────────────────
// Header  : clean navy block, logo only on the left, report info on the right
// Body    : fully monochrome (grayscale) — professional, no distracting colors
const C = {
  headerBg:   [13,  20,  38]  as RGB,   // deep navy
  headerDiv:  [55,  75, 110]  as RGB,   // subtle vertical divider inside header
  headerTxt:  [255, 255, 255] as RGB,
  headerSub:  [160, 180, 210] as RGB,

  black:      [20,  20,  20]  as RGB,
  midGray:    [125, 125, 125] as RGB,
  lightGray:  [205, 205, 205] as RGB,
  paleGray:   [244, 245, 247] as RGB,
  white:      [255, 255, 255] as RGB,
};

// ── Helpers ────────────────────────────────────────────────────────────────
function fmtRp(n: number): string {
  const abs = Math.abs(Math.round(n));
  const str = abs.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return "Rp " + str;
}

function fmtDate(s: string): string {
  if (!s) return "-";
  const clean  = s.includes("T") ? s.split("T")[0] : s;
  const parts  = clean.split("-");
  if (parts.length !== 3) return s;
  const [y, m, d] = parts.map(Number);
  if (!y || !m || !d) return s;
  const months = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];
  return `${d} ${months[m - 1]} ${y}`;
}

async function loadImageAsBase64(
  url: string,
): Promise<{ data: string; format: "PNG" | "JPEG" } | null> {
  try {
    const res    = await fetch(url);
    const blob   = await res.blob();
    const format: "PNG" | "JPEG" = blob.type.includes("png") ? "PNG" : "JPEG";
    return new Promise((resolve) => {
      const reader    = new FileReader();
      reader.onload  = () =>
        resolve({ data: (reader.result as string).split(",")[1], format });
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch { return null; }
}

export async function generateFinancePDF(
  transactions: FinanceTransaction[],
  user: FinanceUserInfo,
  month: number,
  year: number,
): Promise<void> {

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const PW  = 210;
  const MG  = 16;
  const CW  = PW - MG * 2;

  // Layout constants
  const HEADER_H    = 32;   // tinggi blok navy — hanya halaman 1 (sedikit lebih tinggi agar lega)
  const CONTENT_Y   = HEADER_H + 10; // y awal konten halaman 1
  const NEXT_PAGE_Y = 12;  // y awal konten halaman 2+ (tanpa header)

  const MONTH_NAMES = [
    "Januari","Februari","Maret","April","Mei","Juni",
    "Juli","Agustus","September","Oktober","November","Desember",
  ];
  const monthName  = `${MONTH_NAMES[month - 1]} ${year}`;
  const now        = new Date();
  const exportedAt =
    fmtDate(now.toISOString()) +
    ` pukul ${String(now.getHours()).padStart(2,"0")}.${String(now.getMinutes()).padStart(2,"0")}`;

  const logo = await loadImageAsBase64("/logo-darkmode.png");

  const income  = transactions.filter(t => t.type === "INCOME").reduce((s,t) => s + t.amount, 0);
  const expense = transactions.filter(t => t.type === "EXPENSE").reduce((s,t) => s + t.amount, 0);
  const invest  = transactions.filter(t => t.type === "INVEST").reduce((s,t) => s + t.amount, 0);
  const balance = income - expense - invest;

  // ── HEADER (halaman 1 saja) ───────────────────────────────────────────────
  // Layout: navy block | logo kiri (center vertikal) | divider tipis | blok info kanan
  // Blok info kanan dirapikan jadi 3 baris dengan jarak antar-baris yang rata,
  // dan baris bulan + tanggal ekspor digabung jadi satu baris agar tidak sumpek
  // di tepi bawah header.
  function drawHeader() {
    // Navy block
    doc.setFillColor(...C.headerBg);
    doc.rect(0, 0, PW, HEADER_H, "F");

    // Logo — tanpa card pembungkus, langsung di atas navy, center vertikal
    const LOGO_W = 20;
    const LOGO_H = 20;
    const LOGO_Y = (HEADER_H - LOGO_H) / 2;
    if (logo) {
      doc.addImage(logo.data, logo.format, MG, LOGO_Y, LOGO_W, LOGO_H);
    } else {
      // Fallback teks "K" jika logo gagal load
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.setTextColor(...C.headerTxt);
      doc.text("K", MG + LOGO_W / 2, HEADER_H / 2 + 3, { align: "center" });
    }

    // Divider vertikal tipis — pemisah logo & teks kanan, center sejajar logo
    const DIV_X = MG + LOGO_W + 8;
    doc.setDrawColor(...C.headerDiv);
    doc.setLineWidth(0.4);
    doc.line(DIV_X, 8, DIV_X, HEADER_H - 8);

    // Info laporan — rata kanan, 3 baris dengan jarak vertikal yang konsisten
    const RX = PW - MG;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(...C.headerSub);
    doc.text("L A P O R A N   R E S M I", RX, 10, { align: "right" });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(...C.headerTxt);
    doc.text("Laporan Keuangan", RX, 18.5, { align: "right" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...C.headerSub);
    doc.text(`${monthName}   •   Diekspor ${exportedAt}`, RX, 25.5, { align: "right" });
  }

  // ── FOOTER (semua halaman) ────────────────────────────────────────────────
  function drawFooter(pg: number, total: number) {
    const PH = doc.internal.pageSize.getHeight();
    doc.setDrawColor(...C.lightGray);
    doc.setLineWidth(0.3);
    doc.line(MG, PH - 10, PW - MG, PH - 10);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(...C.midGray);
    doc.text("Kampder - Kampus Coder", MG, PH - 6);
    doc.text(
      `Laporan ${monthName}  |  Halaman ${pg} dari ${total}`,
      PW - MG, PH - 6, { align: "right" },
    );
  }

  // ── SECTION HEADING ───────────────────────────────────────────────────────
  // Halaman 2+ tidak ada header — konten mulai dari NEXT_PAGE_Y
  function sectionHeading(title: string, y: number): number {
    if (y > 255) {
      doc.addPage();
      y = NEXT_PAGE_Y;    // ← no drawHeader() di sini
    }
    doc.setDrawColor(...C.lightGray);
    doc.setLineWidth(0.3);
    doc.line(MG, y, PW - MG, y);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(...C.black);
    doc.text(title, MG, y + 6);
    return y + 12;
  }

  // ── START ─────────────────────────────────────────────────────────────────
  drawHeader();          // hanya dipanggil sekali di sini
  let y = CONTENT_Y;

  // ── INFORMASI AKUN ────────────────────────────────────────────────────────
  y = sectionHeading("Informasi Akun", y);

  const infoFields: [string, string][] = [
    ["Nama",        user.name        ?? "-"],
    ["Email",       user.email       ?? "-"],
    ["No. Telepon", user.phone       ?? "-"],
    ["Institusi",   user.institution ?? "-"],
  ];

  const colW = CW / 2;
  [[0, 1], [2, 3]].forEach(([l, r]) => {
    [l, r].forEach((idx, col) => {
      const bx = MG + col * colW;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.5);
      doc.setTextColor(...C.midGray);
      doc.text(infoFields[idx][0], bx, y);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(...C.black);
      doc.text(infoFields[idx][1], bx, y + 5);
    });
    y += 12;
  });

  doc.setDrawColor(...C.lightGray);
  doc.setLineWidth(0.2);
  doc.line(MG, y, PW - MG, y);
  y += 6;

  // ── RINGKASAN KEUANGAN ────────────────────────────────────────────────────
  y = sectionHeading("Ringkasan Keuangan", y);

  const summaryItems = [
    { label: "PEMASUKAN",    value: income,             isCredit: true,         highlight: false },
    { label: "PENGELUARAN",  value: expense,            isCredit: false,        highlight: false },
    { label: "TABUNGAN",     value: invest,             isCredit: false,        highlight: false },
    { label: "SALDO BERSIH", value: Math.abs(balance),  isCredit: balance >= 0, highlight: false },
  ];

  const scw = (CW - 9) / 4;
  summaryItems.forEach((item, i) => {
    const cx = MG + i * (scw + 3);
    // Saldo Bersih: border lebih tebal + fill abu pucat — tetap monochrome
    doc.setFillColor(...(item.highlight ? C.paleGray : C.white));
    doc.setDrawColor(...(item.highlight ? C.black : C.lightGray));
    doc.setLineWidth(item.highlight ? 0.55 : 0.3);
    doc.roundedRect(cx, y, scw, 18, 1.5, 1.5, "FD");

    doc.setFont("helvetica", "normal");
    doc.setFontSize(5.5);
    doc.setTextColor(...C.midGray);
    doc.text(item.label, cx + scw / 2, y + 5.5, { align: "center" });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(...C.black);
    doc.text(fmtRp(item.value), cx + scw / 2, y + 13, {
      align: "center", maxWidth: scw - 4,
    });
  });

  y += 24;

  doc.setDrawColor(...C.lightGray);
  doc.setLineWidth(0.2);
  doc.line(MG, y, PW - MG, y);
  y += 6;

  // ── RINCIAN PER KATEGORI ──────────────────────────────────────────────────
  y = sectionHeading("Rincian per Kategori", y);

  function buildBreak(type: string) {
    const totals: Record<string, number> = {};
    const sub = transactions
      .filter(t => t.type === type)
      .reduce((s, t) => {
        totals[t.category] = (totals[t.category] || 0) + t.amount;
        return s + t.amount;
      }, 0);
    return { rows: Object.entries(totals).sort((a, b) => b[1] - a[1]), sub };
  }

  const catSections = [
    { title: "Pemasukan",   type: "INCOME"  },
    { title: "Pengeluaran", type: "EXPENSE" },
    { title: "Tabungan",    type: "INVEST"  },
  ];

  const ccw      = (CW - 8) / 3;
  const catY     = y;
  let maxFinalY  = catY;

  catSections.forEach((sec, ci) => {
    const { rows, sub } = buildBreak(sec.type);
    const cx = MG + ci * (ccw + 4);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(...C.black);
    doc.text(sec.title, cx, catY);
    doc.setDrawColor(...C.lightGray);
    doc.setLineWidth(0.3);
    doc.line(cx, catY + 2, cx + ccw, catY + 2);

    if (rows.length === 0) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(...C.midGray);
      doc.text("Tidak ada transaksi", cx, catY + 9);
      return;
    }

    // Kolom % — tampilkan angka saja (th sudah bertuliskan "%")
    const body = [
      ...rows.map(([cat, total]) => [
        cat,
        sub > 0 ? `${((total / sub) * 100).toFixed(1)}` : "0",
        fmtRp(total),
      ]),
      ["Total", "", fmtRp(sub)],
    ];

    autoTable(doc, {
      startY:     catY + 6,
      tableWidth: ccw,
      margin:     { left: cx, right: PW - cx - ccw, top: NEXT_PAGE_Y },
      head:       [["Kategori", "%", "Jumlah"]],
      body,
      styles: {
        font: "helvetica", fontSize: 7,
        cellPadding: { top: 2, bottom: 2, left: 3, right: 3 },
        textColor: C.black,
        lineColor: C.lightGray, lineWidth: 0.2,
        halign: "center",
      },
      headStyles: {
        fillColor: C.paleGray, textColor: C.black,
        fontStyle: "bold", fontSize: 6.5,
        lineColor: C.lightGray, lineWidth: 0.3,
        halign: "center",
      },
      columnStyles: {
        0: { cellWidth: "auto", halign: "left" },
        1: { halign: "center", cellWidth: 11 },
        2: { halign: "center", cellWidth: 24, fontStyle: "bold" },
      },
      alternateRowStyles: { fillColor: C.paleGray },
      willDrawCell: (data) => {
        if (data.row.index === body.length - 1 && data.section === "body") {
          data.cell.styles.fontStyle = "bold";
          data.cell.styles.fillColor = C.lightGray;
        }
      },
      // ← tidak ada didDrawPage: header tidak diulang di halaman berikutnya
    } as Parameters<typeof autoTable>[1]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fy = (doc as any).lastAutoTable.finalY;
    if (fy > maxFinalY) maxFinalY = fy;
  });

  y = maxFinalY + 10;

  doc.setDrawColor(...C.lightGray);
  doc.setLineWidth(0.2);
  doc.line(MG, y, PW - MG, y);
  y += 6;

  // ── RIWAYAT TRANSAKSI ─────────────────────────────────────────────────────
  // Jika terlalu dekat batas halaman, pindah ke halaman baru tanpa header
  if (y > 220) {
    doc.addPage();
    y = NEXT_PAGE_Y;   // ← no drawHeader()
  }
  y = sectionHeading("Riwayat Transaksi", y);

  const sortedTx = [...transactions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  const TYPE_LABEL: Record<FinanceTransaction["type"], string> = {
    INCOME:  "Pemasukan",
    EXPENSE: "Pengeluaran",
    INVEST:  "Tabungan",
  };

  const txBody = sortedTx.length > 0
    ? sortedTx.map(tx => [
        fmtDate(tx.date),
        tx.name,
        tx.category,
        TYPE_LABEL[tx.type],
        fmtRp(tx.amount),
      ])
    : [["—", "Tidak ada transaksi bulan ini", "—", "—", "—"]];

  autoTable(doc, {
    startY: y,
    margin: { left: MG, right: MG, top: NEXT_PAGE_Y },
    head:   [["Tanggal", "Keterangan", "Kategori", "Tipe", "Jumlah"]],
    body:   txBody,
    styles: {
      font: "helvetica", fontSize: 7.5,
      cellPadding: { top: 2.5, bottom: 2.5, left: 3, right: 3 },
      textColor: C.black,
      lineColor: C.lightGray, lineWidth: 0.2,
      halign: "center",
    },
    headStyles: {
      fillColor: C.paleGray, textColor: C.black,
      fontStyle: "bold", fontSize: 7,
      lineColor: C.lightGray, lineWidth: 0.3,
      halign: "center",
    },
    columnStyles: {
      0: { cellWidth: 24, halign: "center" },
      1: { cellWidth: "auto", halign: "left" },
      2: { cellWidth: 28, halign: "center" },
      3: { cellWidth: 22, halign: "center" },
      4: { halign: "center", cellWidth: 30, fontStyle: "bold" },
    },
    alternateRowStyles: { fillColor: C.paleGray },
    // ← didDrawPage dihapus: halaman 2+ tidak ada header sama sekali
  } as Parameters<typeof autoTable>[1]);

  // ── FOOTER SEMUA HALAMAN ──────────────────────────────────────────────────
  const totalPages = doc.getNumberOfPages();
  for (let pg = 1; pg <= totalPages; pg++) {
    doc.setPage(pg);
    drawFooter(pg, totalPages);
  }

  // ── DOWNLOAD / SHARE ──────────────────────────────────────────────────────
  const filename = `laporan-keuangan-${year}-${String(month).padStart(2, "0")}.pdf`;
  const pdfBlob  = doc.output("blob");

  if (
    typeof navigator !== "undefined" &&
    "canShare" in navigator &&
    navigator.canShare({
      files: [new File([pdfBlob], filename, { type: "application/pdf" })],
    })
  ) {
    try {
      await navigator.share({
        title: `Laporan Keuangan ${monthName}`,
        text:  "Laporan keuangan bulanan dari Kampder",
        files: [new File([pdfBlob], filename, { type: "application/pdf" })],
      });
      return;
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
    }
  }

  const url = URL.createObjectURL(pdfBlob);
  const a   = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}