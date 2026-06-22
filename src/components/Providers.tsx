// src/components/Providers.tsx
// Wrap SessionProvider di sini agar bisa dipakai di seluruh app
"use client";
import { SessionProvider } from "next-auth/react";
import { AppProvider } from "@/components/AppContext";
import type { ReactNode } from "react";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <AppProvider>
        {children}
      </AppProvider>
    </SessionProvider>
  );
}