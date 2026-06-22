// src/components/layout/BottomNav.tsx

"use client";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useApp } from "@/components/AppContext";

function HomeIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M3 12L12 4L21 12V20C21 20.6 20.6 21 20 21H15V16H9V21H4C3.4 21 3 20.6 3 20V12Z"
        stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round"/>
    </svg>
  );
}
function TasksIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="3" y="3" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="2.4"/>
      <rect x="13" y="3" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="2.4"/>
      <rect x="3" y="13" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="2.4"/>
      <path d="M17 13V21M13 17H21" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"/>
    </svg>
  );
}
function CalendarIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="3" y="4" width="18" height="18" rx="3" stroke="white" strokeWidth="2.4"/>
      <path d="M16 2V6M8 2V6M3 10H21" stroke="white" strokeWidth="2.4" strokeLinecap="round"/>
      <path d="M8 14H8.01M12 14H12.01M16 14H16.01M8 18H8.01M12 18H12.01"
        stroke="white" strokeWidth="3" strokeLinecap="round"/>
    </svg>
  );
}
function WalletIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="2" y="6" width="20" height="14" rx="3" stroke="currentColor" strokeWidth="2.4"/>
      <path d="M2 10H22" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"/>
      <circle cx="17" cy="15" r="1.5" fill="currentColor"/>
      <path d="M6 3H18" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"/>
    </svg>
  );
}
function ProfileIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2.4"/>
      <path d="M4 20C4 17 7.6 14 12 14C16.4 14 20 17 20 20"
        stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"/>
    </svg>
  );
}

export default function BottomNav() {
  const pathname = usePathname();
  const { t, colors, theme } = useApp();
  const C = colors;
  const isDark = theme === "dark";

  const navItems = [
    { href: "/dashboard",          label: t("Beranda",  "Home"),     Icon: HomeIcon    },
    { href: "/dashboard/tasks",    label: t("Tugas",    "Tasks"),    Icon: TasksIcon   },
    { href: "/dashboard/calendar", label: t("Kalender", "Calendar"), Icon: null        },
    { href: "/dashboard/finance",  label: t("Dompet",   "Wallet"),   Icon: WalletIcon  },
    { href: "/dashboard/profile",  label: t("Profil",   "Profile"),  Icon: ProfileIcon },
  ];

  // FAB: solid color, no glow difference between active/inactive
  const fabBg = isDark ? "#5A9EE0" : "#2E7DD1";

  return (
    <>
      <style>{`
        .kd-nav-item { -webkit-tap-highlight-color: transparent; transition: color 0.18s; text-decoration: none; }
        .kd-nav-icon { transition: background 0.18s, transform 0.15s; }
        .kd-nav-item:active .kd-nav-icon { transform: scale(0.92); }
        .kd-fab { transition: transform 0.15s; }
        .kd-fab:active { transform: scale(0.91) translateY(-1px) !important; }
      `}</style>

      <nav style={{
        position: "sticky",
        bottom: 0,
        zIndex: 50,
        width: "100%",
        background: C.navBg,
        borderTop: `1px solid ${isDark ? "#1E2D47" : "#E0EAF5"}`,
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        boxShadow: isDark ? "0 -4px 20px rgba(0,0,0,0.3)" : "0 -4px 20px rgba(0,0,0,0.06)",
      }}>
        <div style={{
          display: "flex",
          alignItems: "flex-end",
          minHeight: "var(--nav-h)",
          maxWidth: "100%",
          margin: "0 auto",
          padding: "0 env(safe-area-inset-right, 0px) 0 env(safe-area-inset-left, 0px)",
        }}>
          {navItems.map(({ href, label, Icon }, i) => {
            const isActive = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
            const isCenter = i === 2;

            const fabSize = "clamp(46px, 10vw, 62px)";

            if (isCenter) {
              return (
                <Link key={href} href={href} className="kd-nav-item"
                  style={{
                    flex: 1, display: "flex", flexDirection: "column",
                    alignItems: "center", gap: 5, paddingBottom: 10,
                    color: C.textMuted,
                  }}
                >
                  {/* Flat solid FAB — no glow, no gradient change on active */}
                  <div className="kd-fab" style={{
                    width: fabSize,
                    height: fabSize,
                    borderRadius: "clamp(14px, 3vw, 18px)",
                    background: fabBg,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    marginTop: -20, flexShrink: 0,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
                  }}>
                    <CalendarIcon size={23} />
                  </div>
                  <span style={{
                    fontSize: "var(--fs-xs)",
                    fontWeight: isActive ? 800 : 600,
                    color: isActive ? C.primary : C.textMuted,
                    letterSpacing: "-0.1px",
                  }}>
                    {label}
                  </span>
                </Link>
              );
            }

            return (
              <Link key={href} href={href} className="kd-nav-item"
                style={{
                  flex: 1, display: "flex", flexDirection: "column",
                  alignItems: "center", gap: 5,
                  paddingTop: 8, paddingBottom: 10,
                  color: isActive ? C.primary : C.textMuted,
                }}
              >
                <div className="kd-nav-icon" style={{
                  width: "clamp(38px, 8vw, 54px)",
                  height: "clamp(38px, 8vw, 54px)",
                  borderRadius: "clamp(10px, 2.5vw, 16px)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: isActive
                    ? (isDark ? "rgba(123,184,240,0.14)" : "rgba(46,125,209,0.10)")
                    : "transparent",
                }}>
                  {Icon && <Icon size={24} />}
                </div>
                <span style={{
                  fontSize: "var(--fs-xs)",
                  fontWeight: isActive ? 800 : 600,
                  letterSpacing: "-0.1px",
                }}>
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}