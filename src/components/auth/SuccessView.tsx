// src/components/auth/SuccessView.tsx

"use client";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { useApp } from "@/components/AppContext";
import { PrimaryButton } from "./FormUI";

export default function SuccessView({ onContinue }: { onContinue: () => void }) {
  const { t, colors } = useApp();
  return (
    <>
      <div className="kd-animate-pop" style={{ textAlign: "center" }}>
        <span
          style={{
            margin: "0 auto var(--sp-sm)", display: "flex", width: 56, height: 56,
            alignItems: "center", justifyContent: "center", borderRadius: "var(--card-radius)",
            background: `${colors.secondary}22`, color: colors.secondary,
          }}
        >
          <CheckCircle2 size={26} aria-hidden="true" />
        </span>
        <h1 className="font-display" style={{ fontSize: "var(--fs-lg)", fontWeight: 700, color: colors.textPrimary, margin: 0 }}>
          {t("Selamat datang!", "You're in!")}
        </h1>
        <p style={{ marginTop: 8, fontSize: "var(--fs-sm)", lineHeight: 1.5, color: colors.textBody }}>
          {t("Akun kamu sudah siap. Yuk mulai produktif.", "Your account is ready. Let's get productive.")}
        </p>
      </div>
      <div style={{ marginTop: "var(--sp-lg)" }}>
        <PrimaryButton type="button" onClick={onContinue}>
          {t("Buka Dashboard", "Open Dashboard")}
          <ArrowRight size={16} aria-hidden="true" />
        </PrimaryButton>
      </div>
    </>
  );
}