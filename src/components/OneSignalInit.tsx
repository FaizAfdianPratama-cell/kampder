"use client";
import { useEffect } from "react";
import OneSignal from "react-onesignal";

let initialized = false;
const NOTIF_PROMPT_KEY = "kampder-notif-prompted";

export default function OneSignalInit() {
  useEffect(() => {
    if (initialized) return;
    initialized = true;

    OneSignal.init({
      appId: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID as string,
      allowLocalhostAsSecureOrigin: true,
      serviceWorkerPath: "/sw.js",
      serviceWorkerParam: { scope: "/" },
    })
      .then(() => {
        // Cek: app sedang dibuka sebagai PWA terinstall (standalone)?
        const isStandalone =
          window.matchMedia("(display-mode: standalone)").matches ||
          (window.navigator as unknown as { standalone?: boolean }).standalone === true;

        const alreadyPrompted = localStorage.getItem(NOTIF_PROMPT_KEY) === "1";
        const canAsk = typeof window !== "undefined" && "Notification" in window && Notification.permission === "default";

        // Minta izin sekali aja, hanya kalau dibuka dari home screen (bukan tab browser biasa)
        if (isStandalone && !alreadyPrompted && canAsk) {
          localStorage.setItem(NOTIF_PROMPT_KEY, "1");
          OneSignal.Notifications.requestPermission().catch((err) => {
            console.error("Gagal minta izin notifikasi (standalone):", err);
          });
        }
      })
      .catch((err) => {
        console.error("OneSignal init error:", err);
      });
  }, []);

  return null;
}
