// src/app/api/tasks/route.ts
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const transSchema = z.object({
  name:     z.string().min(1),
  type:     z.enum(["INCOME", "EXPENSE", "INVEST"]),
  amount:   z.number().positive(),
  category: z.string().min(1),
  date:     z.string().optional(),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const start = searchParams.get("start");
  const end   = searchParams.get("end");
  const month = searchParams.get("month");
  const year  = searchParams.get("year");

  const where: any = { userId: session.user.id };

  if (start && end) {
    // Mode baru: date range inklusif
    where.date = {
      gte: new Date(start + "T00:00:00"),
      lte: new Date(end   + "T23:59:59"),
    };
  } else if (month && year) {
    // Mode lama: bulan/tahun (fallback)
    const m = parseInt(month), y = parseInt(year);
    where.date = { gte: new Date(y, m - 1, 1), lt: new Date(y, m, 1) };
  } else {
    // Default: bulan ini
    const now = new Date();
    where.date = {
      gte: new Date(now.getFullYear(), now.getMonth(), 1),
      lt:  new Date(now.getFullYear(), now.getMonth() + 1, 1),
    };
  }

  const transactions = await prisma.transaction.findMany({
    where, orderBy: { date: "desc" },
  });

  return NextResponse.json(transactions);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body   = await req.json();
  const parsed = transSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid data" }, { status: 400 });

  const transaction = await prisma.transaction.create({
    data: {
      userId:   session.user.id,
      name:     parsed.data.name,
      type:     parsed.data.type,
      amount:   parsed.data.amount,
      category: parsed.data.category,
      date:     parsed.data.date ? new Date(parsed.data.date) : new Date(),
    },
  });

  return NextResponse.json(transaction, { status: 201 });
}