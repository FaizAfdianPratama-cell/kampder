//src/app/api/auth/otp/route.ts

import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  target: z.string(), // email or phone
  type: z.enum(["EMAIL_RESET", "PHONE_RESET"]),
});

function generateOTP(): string {
  return Math.floor(10000 + Math.random() * 90000).toString();
}

async function sendEmailOTP(email: string, code: string, lang: string) {
  const subject = lang === "id" ? "Kode Reset Password Kampder" : "Kampder Password Reset Code";
  const body = lang === "id"
    ? `Kode verifikasi kamu adalah: <b>${code}</b><br>Berlaku 10 menit.`
    : `Your verification code is: <b>${code}</b><br>Valid for 10 minutes.`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM_EMAIL || "noreply@kampder.app",
      to: email,
      subject,
      html: `
        <div style="font-family:sans-serif;max-width:400px;margin:0 auto;padding:32px;background:#0D1117;color:#F8FAFC;border-radius:16px;">
          <h2 style="color:#378ADD;margin:0 0 8px">Kampder</h2>
          <p style="color:#94A3B8;margin:0 0 24px;font-size:13px">Kampus Coder Dashboard</p>
          <p style="font-size:15px;margin:0 0 16px">${lang === "id" ? "Kode verifikasi kamu:" : "Your verification code:"}</p>
          <div style="background:#1C2333;border:1px solid #2D3748;border-radius:12px;padding:24px;text-align:center;margin:0 0 24px">
            <span style="font-size:36px;font-weight:900;letter-spacing:8px;color:#378ADD">${code}</span>
          </div>
          <p style="color:#64748B;font-size:12px;margin:0">${lang === "id" ? "Kode berlaku 10 menit. Jangan bagikan ke siapapun." : "Code valid for 10 minutes. Do not share with anyone."}</p>
        </div>
      `,
    }),
  });
  return res.ok;
}

async function sendSMSOTP(phone: string, code: string, lang: string) {
  const message = lang === "id"
    ? `Kode reset password Kampder kamu: ${code}. Berlaku 10 menit.`
    : `Your Kampder password reset code: ${code}. Valid for 10 minutes.`;

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !from) return false;

  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: "POST",
      headers: {
        "Authorization": `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ To: phone, From: from, Body: message }),
    }
  );
  return res.ok;
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid data" }, { status: 400 });

  const { target, type } = parsed.data;
  const lang = body.lang || "id";
  const code = generateOTP();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Find user
  let userId: string | undefined;
  if (type === "EMAIL_RESET") {
    const user = await prisma.user.findUnique({ where: { email: target } });
    if (!user) return NextResponse.json({ error: lang === "id" ? "Email tidak terdaftar" : "Email not found" }, { status: 404 });
    userId = user.id;
  } else {
    const user = await prisma.user.findFirst({ where: { phone: target } });
    if (!user) return NextResponse.json({ error: lang === "id" ? "Nomor tidak terdaftar" : "Phone number not found" }, { status: 404 });
    userId = user.id;
  }

  // Invalidate old OTPs
  await prisma.otpCode.updateMany({
    where: { target, type, used: false },
    data: { used: true },
  });

  // Save OTP
  await prisma.otpCode.create({
    data: { userId, target, type, code, expiresAt },
  });

  // Send OTP
  let sent = false;
  if (type === "EMAIL_RESET") {
    sent = await sendEmailOTP(target, code, lang);
  } else {
    sent = await sendSMSOTP(target, code, lang);
  }

  if (!sent) return NextResponse.json({ error: lang === "id" ? "Gagal mengirim kode" : "Failed to send code" }, { status: 500 });

  return NextResponse.json({ success: true });
}
