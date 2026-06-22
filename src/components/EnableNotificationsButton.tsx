// src/components/EnableNotificationsButton.tsx
"use client";
import { useEffect, useState } from "react";
import { Bell, BellOff } from "lucide-react";
import OneSignal from "react-onesignal";

export default function EnableNotificationsButton() {
  const [permission, setPermission] = useState<"default" | "granted" | "denied">("default");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Cek status izin saat ini (jalan di client setelah OneSignal init)
    if (typeof window !== "undefined" && "Notification" in window) {
      setPermission(Notification.permission as typeof permission);
    }
  }, []);

  async function handleClick() {
    if (permission === "granted") return;
    setLoading(true);
    try {
      await OneSignal.Notifications.requestPermission();
      if (typeof window !== "undefined" && "Notification" in window) {
        setPermission(Notification.permission as typeof permission);
      }
    } catch (err) {
      console.error("Gagal minta izin notifikasi:", err);
    }
    setLoading(false);
  }

  if (permission === "granted") {
    return (
      <button disabled style={{ display: "flex", alignItems: "center", gap: 6, opacity: 0.6, cursor: "default" }}>
        <Bell size={16} /> Notifikasi Aktif
      </button>
    );
  }

  if (permission === "denied") {
    return (
      <button disabled style={{ display: "flex", alignItems: "center", gap: 6, opacity: 0.5, cursor: "default" }}>
        <BellOff size={16} /> Notifikasi Diblokir (ubah lewat setting browser)
      </button>
    );
  }

  return (
    <button onClick={handleClick} disabled={loading} style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
      <Bell size={16} /> {loading ? "Memproses..." : "Aktifkan Notifikasi"}
    </button>
  );
}