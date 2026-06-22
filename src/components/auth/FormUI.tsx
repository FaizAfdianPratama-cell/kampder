// src/components/auth/FormUI.tsx

"use client";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";
import { useApp } from "@/components/AppContext";

// ─── Text input with icon ──────────────────────────────────────────────────
interface FieldProps {
  id: string;
  label: string;
  icon: React.ElementType;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  autoComplete?: string;
  right?: React.ReactNode;
  required?: boolean;
}

export function Field({ id, label, icon: Icon, type = "text", value, onChange, autoComplete, right, required }: FieldProps) {
  const { colors } = useApp();
  return (
    <div
      style={{
        display:      "flex",
        alignItems:   "center",
        gap:          "var(--sp-xs)",
        padding:      "11px 14px",
        borderRadius: "var(--btn-radius)",
        border:       `1.5px solid ${colors.border}`,
        background:   colors.bg,
        ["--kd-placeholder" as any]: colors.textMuted,
      }}
    >
      <Icon size={16} style={{ flexShrink: 0, color: colors.textMuted }} aria-hidden="true" />
      <input
        id={id}
        name={id}
        type={type}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        required={required}
        placeholder={label}
        className="kd-input"
        style={{
          flex:       1,
          width:      "100%",
          background: "transparent",
          border:     "none",
          outline:    "none",
          color:      colors.textPrimary,
          fontSize:   "var(--fs-sm)",
          fontFamily: "inherit",
        }}
      />
      {right}
    </div>
  );
}

// ─── Eye icon button to reveal/hide password ───────────────────────────────
export function EyeToggle({
  show, onToggle, labelShow, labelHide,
}: { show: boolean; onToggle: () => void; labelShow: string; labelHide: string }) {
  const { colors } = useApp();
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={show}
      aria-label={show ? labelHide : labelShow}
      style={{
        flexShrink: 0,
        border:     "none",
        background: "transparent",
        cursor:     "pointer",
        padding:    4,
        color:      colors.textMuted,
        display:    "flex",
      }}
    >
      {show ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
    </button>
  );
}

// ─── Main CTA button ────────────────────────────────────────────────────────
export function PrimaryButton({
  children, loading, type = "submit", onClick, disabled,
}: { children: React.ReactNode; loading?: boolean; type?: "submit" | "button"; onClick?: () => void; disabled?: boolean }) {
  const { colors, theme } = useApp();
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      style={{
        width:          "100%",
        padding:        "13px 0",
        borderRadius:   "var(--btn-radius)",
        border:         "none",
        cursor:         disabled || loading ? "not-allowed" : "pointer",
        background:     colors.primary,
        color:          theme === "dark" ? colors.bg : "#FFFFFF",
        fontWeight:     700,
        fontSize:       "var(--fs-sm)",
        fontFamily:     "inherit",
        display:        "flex",
        alignItems:     "center",
        justifyContent: "center",
        gap:            8,
        opacity:        disabled ? 0.55 : 1,
        transition:     "opacity 0.15s",
      }}
    >
      {loading ? (
        <span
          className="kd-spin"
          style={{
            width:          16,
            height:         16,
            borderRadius:   "50%",
            border:         `2px solid ${theme === "dark" ? "rgba(14,17,23,0.35)" : "rgba(255,255,255,0.4)"}`,
            borderTopColor: theme === "dark" ? colors.bg : "#FFFFFF",
          }}
        />
      ) : (
        children
      )}
      {loading && <span style={{ position: "absolute", width: 1, height: 1, overflow: "hidden" }}>Loading…</span>}
    </button>
  );
}

// ─── Google sign-in button ──────────────────────────────────────────────────
export function GoogleButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  const { colors } = useApp();
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width:          "100%",
        padding:        "13px 0",
        borderRadius:   "var(--btn-radius)",
        border:         `1.5px solid ${colors.border}`,
        background:     colors.bg,
        color:          colors.textPrimary,
        fontWeight:     600,
        fontSize:       "var(--fs-sm)",
        fontFamily:     "inherit",
        display:        "flex",
        alignItems:     "center",
        justifyContent: "center",
        gap:            10,
        cursor:         "pointer",
      }}
    >
      <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true" style={{ flexShrink: 0 }}>
        <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
        <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
        <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
        <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
      </svg>
      {children}
    </button>
  );
}

// ─── "Atau" / "Or" divider ───────────────────────────────────────────────────
export function Divider({ label }: { label: string }) {
  const { colors } = useApp();
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-sm)", margin: "var(--sp-md) 0" }} role="separator" aria-label={label}>
      <span style={{ height: 1, flex: 1, background: colors.border }} />
      <span style={{ fontSize: "var(--fs-xs)", fontWeight: 500, color: colors.textMuted }}>{label}</span>
      <span style={{ height: 1, flex: 1, background: colors.border }} />
    </div>
  );
}

// ─── Inline error banner ────────────────────────────────────────────────────
export function ErrorBanner({ id, message }: { id: string; message: string }) {
  const { colors } = useApp();
  if (!message) return null;
  return (
    <div
      id={id}
      role="alert"
      aria-live="assertive"
      className="kd-animate-shake"
      style={{
        display:      "flex",
        alignItems:   "flex-start",
        gap:          "var(--sp-xs)",
        borderRadius: "var(--btn-radius)",
        border:       `1px solid ${colors.danger}`,
        background:   `${colors.danger}1A`,
        padding:      "12px 14px",
      }}
    >
      <span style={{ marginTop: 1, color: colors.danger }} aria-hidden="true">⚠️</span>
      <p style={{ fontSize: "var(--fs-sm)", fontWeight: 500, lineHeight: 1.5, color: colors.danger, margin: 0 }}>{message}</p>
    </div>
  );
}

// ─── Back button for sub-flows (forgot / verify / new password) ───────────
export function BackButton({ onClick, label }: { onClick: () => void; label: string }) {
  const { colors } = useApp();
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display:      "inline-flex",
        alignItems:   "center",
        gap:          6,
        marginLeft:   -6,
        marginBottom: "var(--sp-md)",
        padding:      "6px 8px",
        borderRadius: 10,
        border:       "none",
        background:   "transparent",
        cursor:       "pointer",
        color:        colors.textBody,
        fontSize:     "var(--fs-sm)",
        fontWeight:   500,
        fontFamily:   "inherit",
      }}
    >
      <ArrowLeft size={16} aria-hidden="true" />
      {label}
    </button>
  );
}

// ─── Inline text link (e.g. "Daftar", "Masuk") ─────────────────────────────
export function TextLink({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  const { colors } = useApp();
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        border:     "none",
        background: "transparent",
        cursor:     "pointer",
        padding:    0,
        fontWeight: 700,
        fontFamily: "inherit",
        fontSize:   "inherit",
        color:      colors.primary,
      }}
    >
      {children}
    </button>
  );
}

// ─── Icon + title + description header for sub-flows ───────────────────────
export function StepHeader({ icon: Icon, title, desc }: { icon: React.ElementType; title: string; desc: string }) {
  const { colors } = useApp();
  return (
    <div style={{ marginBottom: "var(--sp-lg)" }}>
      <span
        style={{
          display:        "inline-flex",
          alignItems:     "center",
          justifyContent: "center",
          width:          44,
          height:         44,
          borderRadius:   "var(--btn-radius)",
          background:     colors.primaryLight,
          color:          colors.primary,
          marginBottom:   "var(--sp-sm)",
        }}
      >
        <Icon size={20} aria-hidden="true" />
      </span>
      <h1 className="font-display" style={{ fontSize: "var(--fs-lg)", fontWeight: 700, color: colors.textPrimary, margin: 0, letterSpacing: -0.2 }}>
        {title}
      </h1>
      <p style={{ marginTop: 6, fontSize: "var(--fs-sm)", lineHeight: 1.5, color: colors.textBody, margin: "6px 0 0" }}>{desc}</p>
    </div>
  );
}

// ─── Password strength meter ────────────────────────────────────────────────
export function PasswordStrength({ password, t }: { password: string; t: (a: string, b: string) => string }) {
  const { colors } = useApp();
  if (!password.length) return null;
  const score =
    password.length >= 8 && /[A-Z]/.test(password) && /\d/.test(password) && /[^A-Za-z0-9]/.test(password) ? 4
    : password.length >= 8 && /[A-Z]/.test(password) && /\d/.test(password) ? 3
    : password.length >= 6 ? 2 : 1;
  const meta = [
    { color: "", label: "" },
    { color: colors.danger, label: t("Lemah", "Weak") },
    { color: colors.accent, label: t("Cukup", "Fair") },
    { color: colors.secondary, label: t("Bagus", "Good") },
    { color: colors.primary, label: t("Kuat", "Strong") },
  ][score];
  return (
    <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: "var(--sp-xs)" }} aria-live="polite">
      <div style={{ display: "flex", flex: 1, gap: 4 }}>
        {[1, 2, 3, 4].map((i) => (
          <span
            key={i}
            style={{
              height:       3,
              flex:         1,
              borderRadius: 100,
              background:   i <= score ? meta.color : colors.border,
              transition:   "background 0.15s",
            }}
          />
        ))}
      </div>
      <span style={{ minWidth: 40, textAlign: "right", fontSize: "var(--fs-xs)", fontWeight: 500, color: colors.textMuted }}>{meta.label}</span>
    </div>
  );
}