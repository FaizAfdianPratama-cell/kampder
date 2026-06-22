//src/app/api/auth/otp/verify/route.ts

import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { z } from "zod";

const verifySchema = z.object({
  target: z.string(),
  code: z.string().length(5),
  type: z.enum(["EMAIL_RESET", "PHONE_RESET"]),
});

const resetSchema = z.object({
  target: z.string(),
  code: z.string().length(5),
  type: z.enum(["EMAIL_RESET", "PHONE_RESET"]),
  newPassword: z.string().min(6),
});

export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action");
  const body = await req.json();
  const lang = body.lang || "id";

  if (action === "verify") {
    const parsed = verifySchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid data" }, { status: 400 });

    const { target, code, type } = parsed.data;
    const otp = await prisma.otpCode.findFirst({
      where: { target, code, type, used: false, expiresAt: { gt: new Date() } },
    });

    if (!otp) return NextResponse.json({
      error: lang === "id" ? "Kode salah atau sudah kadaluarsa" : "Invalid or expired code"
    }, { status: 400 });

    return NextResponse.json({ success: true, valid: true });
  }

  if (action === "reset") {
    const parsed = resetSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid data" }, { status: 400 });

    const { target, code, type, newPassword } = parsed.data;
    const otp = await prisma.otpCode.findFirst({
      where: { target, code, type, used: false, expiresAt: { gt: new Date() } },
    });

    if (!otp) return NextResponse.json({
      error: lang === "id" ? "Kode tidak valid" : "Invalid code"
    }, { status: 400 });

    // Mark OTP as used
    await prisma.otpCode.update({ where: { id: otp.id }, data: { used: true } });

    // Update password
    const hashed = await hash(newPassword, 12);
    if (type === "EMAIL_RESET") {
      await prisma.user.update({ where: { email: target }, data: { password: hashed } });
    } else {
      await prisma.user.updateMany({ where: { phone: target }, data: { password: hashed } });
    }

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
