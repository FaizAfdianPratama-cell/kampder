// src/components/OneSignalInit.tsx
"use client";
import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import OneSignal from "react-onesignal";

let initialized = false;

export default function OneSignalInit() {
  const { data: session, status } = useSession();
  const loggedInId = useRef<string | null>(null);

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

  // Hubungkan device OneSignal ke akun user yang sedang login (pakai userId
  // sebagai "external_id"), supaya notifikasi reminder bisa ditarget ke
  // user yang spesifik lewat REST API. Dilepas lagi saat logout, supaya
  // device yang dipakai bergantian gak ke-notif untuk akun yang salah.
  useEffect(() => {
    if (status === "authenticated" && session?.user?.id) {
      if (loggedInId.current !== session.user.id) {
        OneSignal.login(session.user.id).catch((err) => {
          console.error("OneSignal login error:", err);
        });
        loggedInId.current = session.user.id;
      }
    } else if (status === "unauthenticated" && loggedInId.current) {
      OneSignal.logout().catch(() => {});
      loggedInId.current = null;
    }
  }, [status, session?.user?.id]);

  return null;
}
