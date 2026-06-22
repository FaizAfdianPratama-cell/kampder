// src/app/dashboard/page.tsx

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCurrentMonthYear } from "@/lib/utils";
import { redirect } from "next/navigation";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;
  const { month, year } = getCurrentMonthYear();

  const [tasks, transactions] = await Promise.all([
    prisma.task.findMany({
      where: { userId, status: { not: "SELESAI" } },
      orderBy: { deadline: "asc" },
      take: 3,
    }),
    prisma.transaction.findMany({
      where: {
        userId,
        date: { gte: new Date(year, month - 1, 1), lt: new Date(year, month, 1) },
      },
    }),
  ]);

  const income  = transactions.filter(t => t.type === "INCOME").reduce((s, t) => s + t.amount, 0);
  const expense = transactions.filter(t => t.type === "EXPENSE").reduce((s, t) => s + t.amount, 0);
  const invest  = transactions.filter(t => t.type === "INVEST").reduce((s, t) => s + t.amount, 0);

  return (
    <DashboardClient
      userName={session.user.name || ""}
      tasks={tasks.map(t => ({
        ...t,
        deadline: t.deadline.toISOString(),
        priority: t.priority as "TERTINGGI" | "TINGGI" | "SEDANG" | "RENDAH",
      }))}
      income={income}
      expense={expense}
      invest={invest}
    />
  );
}