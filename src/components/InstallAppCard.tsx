// src/components/InstallAppCard.tsx
"use client";
import { useState, useEffect } from "react";
import { Download, Share, X, PlusSquare, Smartphone } from "lucide-react";
import { useApp } from "@/components/AppContext";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "kampder-install-dismissed";

type Platform = "android-chrome" | "ios-safari" | "other" | "already-installed" | "checking";

interface Props {
  // Kalau true, tombol "Nanti saja" akan menyimpan preferensi ke localStorage
  // dan card ini gak akan muncul lagi otomatis di kunjungan berikutnya.
  // Set false untuk versi permanen (misal di halaman Settings/Profil).
  dismissible?: boolean;
}

export default function InstallAppCard({ dismissible = true }: Props) {
  const { t, theme, colors } = useApp();
  const isDark = theme === "dark";
  const C = {
    surface: colors.surface, border: colors.border, primary: colors.primary,
    textP: colors.textPrimary, textM: colors.textMuted, onPrimary: isDark ? "#0D1117" : "#fff",
  };

  const [platform, setPlatform] = useState<Platform>("checking");
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    // Cek apakah sudah ter-install (dibuka sebagai app, bukan tab browser biasa)
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;

    if (isStandalone) {
      setPlatform("already-installed");
      return;
    }

    if (dismissible && typeof window !== "undefined" && localStorage.getItem(DISMISS_KEY) === "1") {
      setHidden(true);
      return;
    }

    const ua = window.navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(ua);

    if (isIOS) {
      setPlatform("ios-safari");
      return;
    }

    // Tunggu event beforeinstallprompt (cuma fire di Chrome/Edge Android & Desktop
    // yang memenuhi kriteria PWA installable — manifest + service worker valid)
    function handleBeforeInstall(e: Event) {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setPlatform("android-chrome");
    }
    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    // Kalau setelah 1.5s event itu gak muncul (browser gak support / kriteria belum
    // terpenuhi), anggap "other" supaya gak nge-block UI dengan status "checking" terus
    const fallbackTimer = setTimeout(() => {
      setPlatform((p) => (p === "checking" ? "other" : p));
    }, 1500);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      clearTimeout(fallbackTimer);
    };
  }, [dismissible]);

  async function handleInstallClick() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setPlatform("already-installed");
    }
    setDeferredPrompt(null);
  }

  function handleDismiss() {
    if (dismissible) localStorage.setItem(DISMISS_KEY, "1");
    setHidden(true);
  }

  if (hidden || platform === "checking" || platform === "already-installed") return null;
  if (platform === "other") return null; // browser tidak support install PWA, jangan tampilkan apa-apa

  return (
    <div style={{
      background: C.surface, border: `1px solid ${C.border}`, borderRadius: "var(--card-radius)",
      padding: 14, display: "flex", alignItems: "flex-start", gap: 12, position: "relative",
    }}>
      <div style={{ width: 38, height: 38, borderRadius: 10, background: `${C.primary}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Smartphone size={18} color={C.primary} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: "var(--fs-sm)", fontWeight: 800, color: C.textP, margin: "0 0 4px" }}>
          {t("Install Kampder di HP-mu", "Install Kampder on your phone")}
        </p>

        {platform === "android-chrome" && (
          <>
            <p style={{ fontSize: "var(--fs-xs)", color: C.textM, margin: "0 0 10px", lineHeight: 1.5 }}>
              {t("Akses lebih cepat tanpa browser, langsung dari home screen kamu.", "Faster access without a browser, right from your home screen.")}
            </p>
            <button
              onClick={handleInstallClick}
              style={{
                display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: "var(--btn-radius)",
                background: C.primary, border: "none", color: C.onPrimary, fontSize: "var(--fs-xs)", fontWeight: 700,
                cursor: "pointer", fontFamily: "inherit",
              }}
            >
              <Download size={14} /> {t("Install Sekarang", "Install Now")}
            </button>
          </>
        )}

        {platform === "ios-safari" && (
          <div style={{ fontSize: "var(--fs-xs)", color: C.textM, lineHeight: 1.6 }}>
            <p style={{ margin: "0 0 8px" }}>
              {t("Buka di Safari, lalu:", "Open in Safari, then:")}
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
              <span style={{ width: 18, height: 18, borderRadius: 5, background: `${C.primary}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 10, fontWeight: 800, color: C.primary }}>1</span>
              <Share size={13} color={C.textM} /> {t("Tap ikon Share (kotak dengan tanda panah ke atas)", "Tap the Share icon (box with an arrow pointing up)")}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 18, height: 18, borderRadius: 5, background: `${C.primary}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 10, fontWeight: 800, color: C.primary }}>2</span>
              <PlusSquare size={13} color={C.textM} /> {t('Pilih "Add to Home Screen"', 'Select "Add to Home Screen"')}
            </div>
          </div>
        )}
      </div>

      {dismissible && (
        <button
          onClick={handleDismiss}
          aria-label={t("Tutup", "Close")}
          style={{ width: 26, height: 26, borderRadius: 7, background: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
        >
          <X size={14} color={C.textM} />
        </button>
      )}
    </div>
  );
}
