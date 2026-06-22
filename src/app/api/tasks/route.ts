// src/app/api/tasks/route.ts
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const taskSchema = z.object({
  name:     z.string().min(1),
  subject:  z.string().optional().default(""),
  deadline: z.string().min(1),
  priority: z.enum(["TERTINGGI", "TINGGI", "SEDANG", "RENDAH"]).default("SEDANG"),
  type:     z.enum(["TUGAS", "JADWAL"]).default("TUGAS"),
  status:   z.enum(["BELUM", "DIKERJAKAN", "SELESAI"]).optional().default("BELUM"),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tasks = await prisma.task.findMany({
    where: { userId: session.user.id },
    orderBy: { deadline: "asc" },
  });

  return NextResponse.json(tasks);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body   = await req.json();
  const parsed = taskSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid data", details: parsed.error.flatten() }, { status: 400 });

  const task = await prisma.task.create({
    data: {
      userId:   session.user.id,
      name:     parsed.data.name,
      subject:  parsed.data.subject ?? "",
      deadline: new Date(parsed.data.deadline),
      priority: parsed.data.priority,
      type:     parsed.data.type,
      status:   parsed.data.status,
    },
  });

  return NextResponse.json(task, { status: 201 });
}