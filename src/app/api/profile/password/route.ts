// app/api/profile/password/route.ts
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { compare, hash } from "bcryptjs";

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { current, next } = await req.json();

  if (!current || !next) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }
  if (next.length < 6) {
    return NextResponse.json({ error: "Password minimal 6 karakter" }, { status: 400 });
  }

  // Fetch stored password hash
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { password: true },
  });

  if (!user?.password) {
    // OAuth user — no password to compare
    return NextResponse.json({ error: "Akun ini menggunakan login Google, tidak memiliki password" }, { status: 400 });
  }

  const valid = await compare(current, user.password);
  if (!valid) {
    return NextResponse.json({ error: "Password saat ini salah" }, { status: 400 });
  }

  const hashed = await hash(next, 12);
  await prisma.user.update({
    where: { id: session.user.id },
    data: { password: hashed },
  });

  return NextResponse.json({ ok: true });
}
