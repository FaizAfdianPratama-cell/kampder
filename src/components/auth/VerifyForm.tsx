// src/components/auth/VerifyForm.tsx

"use client";
import { Inbox } from "lucide-react";
import { useApp } from "@/components/AppContext";
import { BackButton, StepHeader, ErrorBanner, PrimaryButton, TextLink } from "./FormUI";
import type { AuthMode } from "./types";

interface VerifyFormProps {
  resetTarget: string;
  otpCode: string[];
  otpRefs: React.MutableRefObject<(HTMLInputElement | null)[]>;
  onOtpInput: (val: string, idx: number) => void;
  onOtpKey: (e: React.KeyboardEvent, idx: number) => void;
  otpTimer: number;
  error: string;
  errorKey: number;
  loading: boolean;
  onResend: () => void;
  onSubmit: () => void;
  go: (m: AuthMode) => void;
}

export default function VerifyForm({
  resetTarget, otpCode, otpRefs, onOtpInput, onOtpKey, otpTimer,
  error, errorKey, loading, onResend, onSubmit, go,
}: VerifyFormProps) {
  const { t, colors } = useApp();
  return (
    <>
      <BackButton onClick={() => go("forgot")} label={t("Kembali", "Back")} />
      <StepHeader
        icon={Inbox}
        title={t("Cek email kamu", "Check your email")}
        desc={t("Kode 5 digit sudah dikirim ke", "We sent a 5-digit code to")}
      />
      <p style={{ marginTop: -14, marginBottom: "var(--sp-md)", fontSize: "var(--fs-sm)", fontWeight: 700, color: colors.primary }}>
        {resetTarget.replace(/(.{3}).*(@.*)/, "$1•••••$2")}
      </p>

      <form noValidate onSubmit={(e) => { e.preventDefault(); onSubmit(); }}>
        <fieldset style={{ border: "none", padding: 0, margin: 0 }}>
          <legend style={{ position: "absolute", width: 1, height: 1, overflow: "hidden" }}>
            {t("Masukkan kode 5 digit", "Enter the 5-digit code")}
          </legend>
          <div style={{ display: "flex", justifyContent: "center", gap: "clamp(6px, 2vw, 10px)" }}>
            {otpCode.map((val, idx) => (
              <input
                key={idx}
                ref={(el) => { otpRefs.current[idx] = el; }}
                type="text"
                inputMode="numeric"
                autoComplete={idx === 0 ? "one-time-code" : "off"}
                maxLength={1}
                value={val}
                onChange={(e) => onOtpInput(e.target.value, idx)}
                onKeyDown={(e) => onOtpKey(e, idx)}
                aria-label={t(`Digit ke-${idx + 1} dari 5`, `Digit ${idx + 1} of 5`)}
                style={{
                  width:        "clamp(38px, 11vw, 50px)",
                  height:       "clamp(46px, 13vw, 58px)",
                  borderRadius: "var(--btn-radius)",
                  textAlign:    "center",
                  fontSize:     "clamp(17px, 4.5vw, 21px)",
                  fontWeight:   700,
                  fontFamily:   "inherit",
                  outline:      "none",
                  background:   val ? colors.primaryLight : colors.bg,
                  color:        val ? colors.primary : colors.textPrimary,
                  border:       `1.5px solid ${val ? colors.primary : colors.border}`,
                  transition:   "all 0.15s",
                }}
              />
            ))}
          </div>
        </fieldset>

        <div style={{ marginTop: "var(--sp-md)", textAlign: "center" }} aria-live="polite">
          {otpTimer > 0 ? (
            <p style={{ fontSize: "var(--fs-sm)", color: colors.textBody, margin: 0 }}>
              {t("Kirim ulang dalam", "Resend in")}{" "}
              <span style={{ fontWeight: 700, color: colors.primary, fontVariantNumeric: "tabular-nums" }}>
                {String(Math.floor(otpTimer / 60)).padStart(2, "0")}:{String(otpTimer % 60).padStart(2, "0")}
              </span>
            </p>
          ) : (
            <p style={{ fontSize: "var(--fs-sm)", color: colors.textBody, margin: 0 }}>
              {t("Tidak menerima kode?", "Didn't get the code?")}{" "}
              <TextLink onClick={onResend}>{t("Kirim ulang", "Resend")}</TextLink>
            </p>
          )}
        </div>

        <div style={{ marginTop: "var(--sp-md)" }}><ErrorBanner id="verify-error" message={error} key={errorKey} /></div>
        <div style={{ marginTop: "var(--sp-sm)" }}>
          <PrimaryButton loading={loading} disabled={otpCode.join("").length < 5}>
            {t("Verifikasi kode", "Verify code")}
          </PrimaryButton>
        </div>
      </form>
    </>
  );
}