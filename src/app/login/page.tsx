// src/app/login/page.tsx

"use client";
import { useRef, useState } from "react";
import { signIn } from "next-auth/react";
import LoadingScreen from "@/components/LoadingScreen";
import { useApp } from "@/components/AppContext";

import { AuthShell, LogoBlock, AuthCard, TabSwitcher } from "@/components/auth/AuthShell";
import LoginForm from "@/components/auth/LoginForm";
import RegisterForm from "@/components/auth/RegisterForm";
import ForgotForm from "@/components/auth/ForgotForm";
import VerifyForm from "@/components/auth/VerifyForm";
import NewPassForm from "@/components/auth/NewPassForm";
import SuccessView from "@/components/auth/SuccessView";
import type { AuthMode, FormState } from "@/components/auth/types";

type Step = "loading" | "auth";

export default function LoginPage() {
  const { t, lang } = useApp();

  // ── Baca sessionStorage saat inisialisasi (lazy, client-only) ─────────────
  const [step, setStep] = useState<Step>(() => {
    if (typeof window === "undefined") return "loading";
    try {
      const from = sessionStorage.getItem("kampder_from");
      if (from === "logout") {
        sessionStorage.removeItem("kampder_from");
        return "auth";
      }
    } catch {}
    return "loading";
  });

  const [mode, setMode] = useState<AuthMode>("login");
  const [form, setForm] = useState<FormState>({ name: "", email: "", password: "", confirm: "" });
  const [resetTarget, setResetTarget] = useState("");
  const [otpCode, setOtpCode] = useState(["", "", "", "", ""]);
  const [newPass, setNewPass] = useState("");
  const [newPassConfirm, setNewPassConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showNewPassConfirm, setShowNewPassConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [errorKey, setErrorKey] = useState(0);
  const [otpTimer, setOtpTimer] = useState(59);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const go = (m: AuthMode) => { setMode(m); setError(""); };
  const setErr = (msg: string) => { setError(msg); setErrorKey((k) => k + 1); };

  function startOtpTimer() {
    setOtpTimer(59);
    const iv = setInterval(() => {
      setOtpTimer((p) => { if (p <= 1) { clearInterval(iv); return 0; } return p - 1; });
    }, 1000);
  }

  async function handleLogin() {
    setErr(""); setLoading(true);
    const result = await signIn("credentials", {
      email: form.email,
      password: form.password,
      redirect: false,
    });
    if (result?.error) {
      setErr(t("Email atau password salah", "Incorrect email or password"));
      setLoading(false);
    } else {
      // Tandai dashboard sudah "pernah dimuat" SEBELUM redirect, supaya
      // LoadingScreen di dashboard/layout.tsx tidak muncul lagi — user
      // sudah menunggu cukup lama di proses login, tidak perlu nunggu lagi.
      try { sessionStorage.setItem("kampder_dashboard_loaded", "1"); } catch {}
      // Hard navigate — bypass client router agar LoadingScreen tidak muncul lagi
      window.location.href = "/dashboard";
    }
  }

  async function handleRegister() {
    setErr(""); setLoading(true);
    if (form.password !== form.confirm) { setErr(t("Password tidak cocok", "Passwords do not match")); setLoading(false); return; }
    const res = await fetch("/api/auth/register", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: form.name, email: form.email, password: form.password }),
    });
    if (!res.ok) { const d = await res.json(); setErr(d.error || t("Gagal mendaftar", "Registration failed")); setLoading(false); return; }
    await signIn("credentials", { email: form.email, password: form.password, redirect: false });
    setMode("success"); setLoading(false);
  }

  async function handleSendOtp() {
    setErr(""); setLoading(true);
    const res = await fetch("/api/auth/otp", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ target: resetTarget, type: "EMAIL_RESET", lang }),
    });
    if (!res.ok) { const d = await res.json(); setErr(d.error || t("Gagal mengirim kode", "Failed to send code")); setLoading(false); return; }
    startOtpTimer(); setMode("verify"); setLoading(false);
  }

  async function handleVerifyOtp() {
    setErr(""); setLoading(true);
    const code = otpCode.join("");
    if (code.length < 5) { setErr(t("Masukkan 5 digit kode", "Enter 5 digit code")); setLoading(false); return; }
    const res = await fetch("/api/auth/otp/verify?action=verify", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ target: resetTarget, code, type: "EMAIL_RESET", lang }),
    });
    if (!res.ok) { const d = await res.json(); setErr(d.error || t("Kode tidak valid", "Invalid code")); setLoading(false); return; }
    setMode("newpass"); setLoading(false);
  }

  async function handleResetPassword() {
    setErr(""); setLoading(true);
    if (newPass !== newPassConfirm) { setErr(t("Password tidak cocok", "Passwords do not match")); setLoading(false); return; }
    const res = await fetch("/api/auth/otp/verify?action=reset", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ target: resetTarget, code: otpCode.join(""), type: "EMAIL_RESET", newPassword: newPass, lang }),
    });
    if (!res.ok) { const d = await res.json(); setErr(d.error || t("Gagal reset password", "Failed to reset password")); setLoading(false); return; }
    go("login"); setOtpCode(["", "", "", "", ""]); setNewPass(""); setNewPassConfirm("");
  }

  function handleOtpInput(val: string, idx: number) {
    if (!/^\d*$/.test(val)) return;
    if (val.length > 1) val = val[val.length - 1];
    const next = [...otpCode]; next[idx] = val; setOtpCode(next);
    if (val && idx < 4) otpRefs.current[idx + 1]?.focus();
  }

  function handleOtpKey(e: React.KeyboardEvent, idx: number) {
    if (e.key === "Backspace" && !otpCode[idx] && idx > 0) otpRefs.current[idx - 1]?.focus();
  }

  // ── Routing ──────────────────────────────────────────────────────────────

  if (step === "loading") return <LoadingScreen onDone={() => setStep("auth")} />;

  // ── LOGIN & REGISTER share the tabbed card ─────────────────────────────
  if (mode === "login" || mode === "register") return (
    <AuthShell>
      <LogoBlock />
      <AuthCard>
        <TabSwitcher active={mode} onChange={go} />
        {mode === "login" ? (
          <LoginForm
            form={form} setForm={setForm}
            showPass={showPass} setShowPass={setShowPass}
            error={error} errorKey={errorKey} loading={loading}
            onSubmit={handleLogin} go={go}
          />
        ) : (
          <RegisterForm
            form={form} setForm={setForm}
            showPass={showPass} setShowPass={setShowPass}
            showConfirm={showConfirm} setShowConfirm={setShowConfirm}
            error={error} errorKey={errorKey} loading={loading}
            onSubmit={handleRegister} go={go}
          />
        )}
      </AuthCard>
    </AuthShell>
  );

  // ── SUCCESS ───────────────────────────────────────────────────────────────
  if (mode === "success") return (
    <AuthShell>
      <LogoBlock />
      <AuthCard>
        <SuccessView onContinue={() => {
          try { sessionStorage.setItem("kampder_dashboard_loaded", "1"); } catch {}
          window.location.href = "/dashboard";
        }} />
      </AuthCard>
    </AuthShell>
  );

  // ── FORGOT PASSWORD ───────────────────────────────────────────────────────
  if (mode === "forgot") return (
    <AuthShell>
      <LogoBlock />
      <AuthCard>
        <ForgotForm
          resetTarget={resetTarget} setResetTarget={setResetTarget}
          error={error} errorKey={errorKey} loading={loading}
          onSubmit={handleSendOtp} go={go}
        />
      </AuthCard>
    </AuthShell>
  );

  // ── VERIFY OTP ────────────────────────────────────────────────────────────
  if (mode === "verify") return (
    <AuthShell>
      <LogoBlock />
      <AuthCard>
        <VerifyForm
          resetTarget={resetTarget}
          otpCode={otpCode} otpRefs={otpRefs}
          onOtpInput={handleOtpInput} onOtpKey={handleOtpKey}
          otpTimer={otpTimer}
          error={error} errorKey={errorKey} loading={loading}
          onResend={handleSendOtp} onSubmit={handleVerifyOtp} go={go}
        />
      </AuthCard>
    </AuthShell>
  );

  // ── NEW PASSWORD ──────────────────────────────────────────────────────────
  if (mode === "newpass") return (
    <AuthShell>
      <LogoBlock />
      <AuthCard>
        <NewPassForm
          newPass={newPass} setNewPass={setNewPass}
          newPassConfirm={newPassConfirm} setNewPassConfirm={setNewPassConfirm}
          showNewPass={showNewPass} setShowNewPass={setShowNewPass}
          showNewPassConfirm={showNewPassConfirm} setShowNewPassConfirm={setShowNewPassConfirm}
          error={error} errorKey={errorKey} loading={loading}
          onSubmit={handleResetPassword} go={go}
        />
      </AuthCard>
    </AuthShell>
  );

  return null;
}