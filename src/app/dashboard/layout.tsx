//src/app/dashboard/layout.tsx

"use client";
import BottomNav from "@/components/layout/BottomNav";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="kd-shell">
      <div className="kd-page">
        <main className="kd-body">
          {children}
        </main>
        <BottomNav />
      </div>
    </div>
  );
}
