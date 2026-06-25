// src/app/api/cron/task-reminders/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Pastikan route ini selalu dieksekusi fresh, gak di-cache Vercel
export const dynamic = "force-dynamic";

// Ambil tanggal kalender (tanpa jam) dalam UTC. Ini PENTING supaya cocok
// dengan cara deadline disimpan — saat user input "2026-06-24" di form,
// JS men-parse-nya jadi 2026-06-24T00:00:00.000Z (UTC midnight), jadi
// perbandingan di sini wajib pakai metode UTC yang sama persis.
function dateOnlyUTC(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

async function sendOneSignalPush(userId: string, title: string, body: string) {
  try {
    const res = await fetch("https://api.onesignal.com/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Key ${process.env.ONESIGNAL_REST_API_KEY}`,
      },
      body: JSON.stringify({
        app_id: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID,
        target_channel: "push",
        // Target device berdasarkan external_id yang di-set lewat
        // OneSignal.login(userId) di OneSignalInit.tsx saat user login.
        include_aliases: { external_id: [userId] },
        headings: { en: title },
        contents: { en: body },
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("OneSignal send failed:", res.status, text);
      return false;
    }
    return true;
  } catch (err) {
    console.error("OneSignal send error:", err);
    return false;
  }
}

export async function GET(req: NextRequest) {
  // Pastikan request ini benar-benar dari Vercel Cron, bukan orang luar
  // yang nemu URL-nya. Vercel otomatis kirim header ini kalau env var
  // CRON_SECRET sudah di-set di project settings.
  const authHeader = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const today = dateOnlyUTC(now);
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
  const dayAfterTomorrow = new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000);

  // Ambil semua task yang belum selesai dan deadline-nya hari ini ATAU besok
  const tasks = await prisma.task.findMany({
    where: {
      status: { not: "SELESAI" },
      deadline: { gte: today, lt: dayAfterTomorrow },
    },
  });

  let sent = 0;
  for (const task of tasks) {
    const deadlineDay = dateOnlyUTC(new Date(task.deadline));
    const isToday = deadlineDay.getTime() === today.getTime();
    const isTomorrow = deadlineDay.getTime() === tomorrow.getTime();

    if (!isToday && !isTomorrow) continue;

    const title = isToday ? "Deadline hari ini!" : "Deadline besok";
    const body = isToday
      ? `"${task.name}" harus selesai hari ini.`
      : `"${task.name}" deadline-nya besok, jangan kelupaan.`;

    const ok = await sendOneSignalPush(task.userId, title, body);
    if (ok) sent++;
  }

  return NextResponse.json({ success: true, checked: tasks.length, sent });
}
