// src/components/auth/LoginForm.tsx

"use client";
import { Mail, Lock } from "lucide-react";
import { signIn } from "next-auth/react";
import { useApp } from "@/components/AppContext";
import { Field, EyeToggle, PrimaryButton, GoogleButton, Divider, ErrorBanner, TextLink } from "./FormUI";
import type { AuthMode, FormState } from "./types";

interface LoginFormProps {
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  showPass: boolean;
  setShowPass: React.Dispatch<React.SetStateAction<boolean>>;
  error: string;
  errorKey: number;
  loading: boolean;
  onSubmit: () => void;
  go: (m: AuthMode) => void;
}

export default function LoginForm({ form, setForm, showPass, setShowPass, error, errorKey, loading, onSubmit, go }: LoginFormProps) {
  const { t, colors } = useApp();
  return (
    <form
      className="kd-animate-fadeUp"
      style={{ display: "flex", flexDirection: "column", gap: "var(--sp-sm)" }}
      noValidate
      onSubmit={(e) => { e.preventDefault(); onSubmit(); }}
    >
      <Field
        id="email" label="Email" icon={Mail} type="email" autoComplete="email" required
        value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
      />
      <Field
        id="password" label={t("Password", "Password")} icon={Lock}
        type={showPass ? "text" : "password"} autoComplete="current-password" required
        value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
        right={
          <EyeToggle
            show={showPass} onToggle={() => setShowPass((p) => !p)}
            labelShow={t("Tampilkan password", "Show password")}
            labelHide={t("Sembunyikan password", "Hide password")}
          />
        }
      />

      <button
        type="button" onClick={() => go("forgot")}
        style={{
          alignSelf: "center", border: "none", background: "transparent", cursor: "pointer",
          fontSize: "var(--fs-sm)", fontWeight: 500, color: colors.textBody, fontFamily: "inherit",
          textDecoration: "underline", textUnderlineOffset: 3,
        }}
      >
        {t("Lupa Password?", "Forgot Password?")}
      </button>

      <ErrorBanner id="login-error" message={error} key={errorKey} />
      <PrimaryButton loading={loading}>
        {t("Masuk", "Sign in")}
      </PrimaryButton>

      <Divider label={t("Atau", "Or")} />
      <GoogleButton onClick={() => signIn("google", { callbackUrl: "/dashboard" })}>
        {t("Lanjut dengan Google", "Continue with Google")}
      </GoogleButton>

      <p style={{ marginTop: 8, textAlign: "center", fontSize: "var(--fs-sm)", color: colors.textBody }}>
        {t("Tidak punya akun?", "Don't have an account?")}{" "}
        <TextLink onClick={() => go("register")}>{t("Daftar", "Sign up")}</TextLink>
      </p>
    </form>
  );
}