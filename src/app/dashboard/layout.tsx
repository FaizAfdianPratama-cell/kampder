"use client";
import { useState, useEffect } from "react";
import BottomNav from "@/components/layout/BottomNav";
import LoadingScreen from "@/components/LoadingScreen";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [showLoading, setShowLoading] = useState(false);

  // Baca sessionStorage setelah mount — hindari SSR/client mismatch
  useEffect(() => {
    try {
      const alreadyLoaded = sessionStorage.getItem("kampder_dashboard_loaded");
      setShowLoading(!alreadyLoaded);
    } catch {
      setShowLoading(true);
    }
    setMounted(true);
  }, []);

  function handleLoadingDone() {
    try { sessionStorage.setItem("kampder_dashboard_loaded", "1"); } catch {}
    setShowLoading(false);
  }

  // Render struktur yang sama antara SSR dan client-first paint
  // LoadingScreen baru muncul setelah mounted, jadi DOM tree konsisten
  return (
    <div className="kd-shell">
      {mounted && showLoading && <LoadingScreen onDone={handleLoadingDone} />}
      <div className="kd-page">
        <main className="kd-body">
          {children}
        </main>
        <BottomNav />
      </div>
    </div>
  );
}