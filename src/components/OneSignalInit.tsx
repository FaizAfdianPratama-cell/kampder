// src/components/OneSignalInit.tsx
"use client";
import { useEffect } from "react";
import OneSignal from "react-onesignal";

let initialized = false;

export default function OneSignalInit() {
  useEffect(() => {
    if (initialized) return;
    initialized = true;

    OneSignal.init({
      appId: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID as string,
      // izinkan testing di localhost (http), tetap wajib HTTPS di production
      allowLocalhostAsSecureOrigin: true,
      // pakai service worker custom yang sudah ada (gabungan PWA cache + OneSignal)
      serviceWorkerPath: "/sw.js",
      serviceWorkerParam: { scope: "/" },
    }).catch((err) => {
      console.error("OneSignal init error:", err);
    });
  }, []);

  return null;
}