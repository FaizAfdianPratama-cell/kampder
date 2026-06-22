// src/lib/prisma.ts

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { differenceInDays, format, isToday, isTomorrow } from "date-fns";
import { id } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRupiah(amount: number): string {
  if (amount >= 1_000_000) {
    const val = amount / 1_000_000;
    return `Rp ${val % 1 === 0 ? val : val.toFixed(1)}jt`;
  }
  if (amount >= 1_000) {
    return `Rp ${Math.round(amount / 1_000)}rb`;
  }
  return `Rp ${amount.toLocaleString("id-ID")}`;
}

export function getCountdown(deadline: Date): {
  text: string;
  variant: "urgent" | "soon" | "ok" | "overdue";
} {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const dl = new Date(deadline);
  dl.setHours(0, 0, 0, 0);
  const diff = differenceInDays(dl, now);

  if (diff < 0) return { text: `Terlambat ${Math.abs(diff)} hari`, variant: "overdue" };
  if (diff === 0) return { text: "Hari ini!", variant: "urgent" };
  if (diff === 1) return { text: "Besok!", variant: "urgent" };
  if (diff <= 3) return { text: `${diff} hari lagi`, variant: "soon" };
  return { text: `${diff} hari lagi`, variant: "ok" };
}

export function formatDate(date: Date): string {
  return format(date, "d MMMM yyyy", { locale: id });
}

export function formatDateShort(date: Date): string {
  return format(date, "d MMM", { locale: id });
}

export function getCurrentMonthYear(): { month: number; year: number } {
  const now = new Date();
  return { month: now.getMonth() + 1, year: now.getFullYear() };
}
