// src/components/auth/NewPassForm.tsx

"use client";
import { Lock, KeyRound } from "lucide-react";
import { useApp } from "@/components/AppContext";
import { BackButton, StepHeader, Field, EyeToggle, ErrorBanner, PrimaryButton, PasswordStrength } from "./FormUI";
import type { AuthMode } from "./types";

interface NewPassFormProps {
  newPass: string;
  setNewPass: React.Dispatch<React.SetStateAction<string>>;
  newPassConfirm: string;
  setNewPassConfirm: React.Dispatch<React.SetStateAction<string>>;
  showNewPass: boolean;
  setShowNewPass: React.Dispatch<React.SetStateAction<boolean>>;
  showNewPassConfirm: boolean;
  setShowNewPassConfirm: React.Dispatch<React.SetStateAction<boolean>>;
  error: string;
  errorKey: number;
  loading: boolean;
  onSubmit: () => void;
  go: (m: AuthMode) => void;
}

export default function NewPassForm({
  newPass, setNewPass, newPassConfirm, setNewPassConfirm,
  showNewPass, setShowNewPass, showNewPassConfirm, setShowNewPassConfirm,
  error, errorKey, loading, onSubmit, go,
}: NewPassFormProps) {
  const { t, colors } = useApp();
  return (
    <>
      <BackButton onClick={() => go("verify")} label={t("Kembali", "Back")} />
      <StepHeader
        icon={KeyRound}
        title={t("Password baru", "New password")}
        desc={t("Buat password yang kuat dan mudah kamu ingat.", "Create a strong password you'll remember.")}
      />

      <form
        style={{ display: "flex", flexDirection: "column", gap: "var(--sp-sm)" }}
        noValidate
        onSubmit={(e) => { e.preventDefault(); onSubmit(); }}
      >
        <div>
          <Field
            id="newPassword" label={t("Password baru", "New password")} icon={Lock}
            type={showNewPass ? "text" : "password"} autoComplete="new-password" required
            value={newPass} onChange={(e) => setNewPass(e.target.value)}
            right={
              <EyeToggle
                show={showNewPass} onToggle={() => setShowNewPass((p) => !p)}
                labelShow={t("Tampilkan password", "Show password")}
                labelHide={t("Sembunyikan password", "Hide password")}
              />
            }
          />
          <PasswordStrength password={newPass} t={t} />
        </div>
        <div>
          <Field
            id="newPasswordConfirm" label={t("Konfirmasi password", "Confirm password")} icon={Lock}
            type={showNewPassConfirm ? "text" : "password"} autoComplete="new-password" required
            value={newPassConfirm} onChange={(e) => setNewPassConfirm(e.target.value)}
            right={
              <EyeToggle
                show={showNewPassConfirm} onToggle={() => setShowNewPassConfirm((p) => !p)}
                labelShow={t("Tampilkan password", "Show password")}
                labelHide={t("Sembunyikan password", "Hide password")}
              />
            }
          />
          {newPassConfirm.length > 0 && (
            <p
              style={{
                marginTop: 8, display: "flex", alignItems: "center", gap: 6,
                fontSize: "var(--fs-xs)", fontWeight: 500,
                color: newPass === newPassConfirm ? colors.secondary : colors.danger,
              }}
              aria-live="polite"
            >
              <span aria-hidden="true">{newPass === newPassConfirm ? "✓" : "✕"}</span>
              {newPass === newPassConfirm ? t("Password cocok", "Passwords match") : t("Password belum cocok", "Passwords don't match")}
            </p>
          )}
        </div>

        <ErrorBanner id="newpass-error" message={error} key={errorKey} />
        <PrimaryButton loading={loading} disabled={!newPass || !newPassConfirm}>
          {t("Simpan password", "Save password")}
        </PrimaryButton>
      </form>
    </>
  );
}