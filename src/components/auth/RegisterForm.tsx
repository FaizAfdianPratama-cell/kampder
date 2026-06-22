// src/components/auth/RegisterForm.tsx

"use client";
import { Mail, Lock, User } from "lucide-react";
import { signIn } from "next-auth/react";
import { useApp } from "@/components/AppContext";
import { Field, EyeToggle, PrimaryButton, GoogleButton, Divider, ErrorBanner, TextLink, PasswordStrength } from "./FormUI";
import type { AuthMode, FormState } from "./types";

interface RegisterFormProps {
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  showPass: boolean;
  setShowPass: React.Dispatch<React.SetStateAction<boolean>>;
  showConfirm: boolean;
  setShowConfirm: React.Dispatch<React.SetStateAction<boolean>>;
  error: string;
  errorKey: number;
  loading: boolean;
  onSubmit: () => void;
  go: (m: AuthMode) => void;
}

export default function RegisterForm({
  form, setForm, showPass, setShowPass, showConfirm, setShowConfirm,
  error, errorKey, loading, onSubmit, go,
}: RegisterFormProps) {
  const { t, colors } = useApp();
  return (
    <form
      className="kd-animate-fadeUp"
      style={{ display: "flex", flexDirection: "column", gap: "var(--sp-sm)" }}
      noValidate
      onSubmit={(e) => { e.preventDefault(); onSubmit(); }}
    >
      <Field
        id="name" label={t("Nama lengkap", "Full name")} icon={User} autoComplete="name" required
        value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
      />
      <Field
        id="email" label="Email" icon={Mail} type="email" autoComplete="email" required
        value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
      />
      <div>
        <Field
          id="password" label={t("Password", "Password")} icon={Lock}
          type={showPass ? "text" : "password"} autoComplete="new-password" required
          value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
          right={
            <EyeToggle
              show={showPass} onToggle={() => setShowPass((p) => !p)}
              labelShow={t("Tampilkan password", "Show password")}
              labelHide={t("Sembunyikan password", "Hide password")}
            />
          }
        />
        <PasswordStrength password={form.password} t={t} />
      </div>
      <Field
        id="confirm" label={t("Konfirmasi password", "Confirm password")} icon={Lock}
        type={showConfirm ? "text" : "password"} autoComplete="new-password" required
        value={form.confirm} onChange={(e) => setForm((p) => ({ ...p, confirm: e.target.value }))}
        right={
          <EyeToggle
            show={showConfirm} onToggle={() => setShowConfirm((p) => !p)}
            labelShow={t("Tampilkan password", "Show password")}
            labelHide={t("Sembunyikan password", "Hide password")}
          />
        }
      />

      <ErrorBanner id="register-error" message={error} key={errorKey} />
      <PrimaryButton loading={loading}>
        {t("Daftar", "Sign up")}
      </PrimaryButton>

      <Divider label={t("Atau", "Or")} />
      <GoogleButton onClick={() => signIn("google", { callbackUrl: "/dashboard" })}>
        {t("Lanjut dengan Google", "Continue with Google")}
      </GoogleButton>

      <p style={{ marginTop: 8, textAlign: "center", fontSize: "var(--fs-sm)", color: colors.textBody }}>
        {t("Sudah punya akun?", "Already have an account?")}{" "}
        <TextLink onClick={() => go("login")}>{t("Masuk", "Sign in")}</TextLink>
      </p>
    </form>
  );
}