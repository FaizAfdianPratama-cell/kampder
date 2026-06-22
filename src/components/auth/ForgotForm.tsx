// src/components/auth/ForgotForm.tsx

"use client";
import { Mail, ShieldCheck } from "lucide-react";
import { useApp } from "@/components/AppContext";
import { BackButton, StepHeader, Field, ErrorBanner, PrimaryButton, TextLink } from "./FormUI";
import type { AuthMode } from "./types";

interface ForgotFormProps {
  resetTarget: string;
  setResetTarget: React.Dispatch<React.SetStateAction<string>>;
  error: string;
  errorKey: number;
  loading: boolean;
  onSubmit: () => void;
  go: (m: AuthMode) => void;
}

export default function ForgotForm({ resetTarget, setResetTarget, error, errorKey, loading, onSubmit, go }: ForgotFormProps) {
  const { t, colors } = useApp();
  return (
    <>
      <BackButton onClick={() => go("login")} label={t("Kembali", "Back")} />
      <StepHeader
        icon={ShieldCheck}
        title={t("Lupa password?", "Forgot password?")}
        desc={t("Tenang, masukkan email-mu dan kami kirim kode reset.", "No worries, enter your email and we'll send a reset code.")}
      />

      <form
        style={{ display: "flex", flexDirection: "column", gap: "var(--sp-sm)" }}
        noValidate
        onSubmit={(e) => { e.preventDefault(); if (resetTarget) onSubmit(); }}
      >
        <Field
          id="resetEmail" label="Email" icon={Mail} type="email" autoComplete="email" required
          value={resetTarget} onChange={(e) => setResetTarget(e.target.value)}
        />
        <ErrorBanner id="forgot-error" message={error} key={errorKey} />
        <PrimaryButton loading={loading} disabled={!resetTarget}>
          {t("Kirim kode verifikasi", "Send reset code")}
        </PrimaryButton>
      </form>

      <p style={{ marginTop: "var(--sp-lg)", textAlign: "center", fontSize: "var(--fs-sm)", color: colors.textBody }}>
        {t("Ingat password kamu?", "Remember your password?")}{" "}
        <TextLink onClick={() => go("login")}>{t("Masuk", "Sign in")}</TextLink>
      </p>
    </>
  );
}