"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import {
  LayoutDashboard,
  Wallet,
  Settings,
  GraduationCap,
  LineChart,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n/context";

export function BottomNav() {
  const pathname = usePathname();
  const { t } = useLanguage();

  const navItems = [
    { title: t.nav.home,      url: "/dashboard",          icon: LayoutDashboard, exact: true  },
    { title: t.nav.finance,   url: "/financial-overview", icon: Wallet,          exact: false },
    { title: t.nav.academic,  url: "/kuliah",             icon: GraduationCap,   exact: false },
    { title: t.nav.portfolio, url: "/tracker",            icon: LineChart,       exact: true  },
    { title: t.nav.settings,  url: "/tracker/settings",  icon: Settings,        exact: false },
  ];

  return (
    <div
      className="fixed left-0 right-0 bottom-0 z-50 lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <nav className="mx-3 mb-2 flex items-center justify-around rounded-2xl border border-border bg-background/80 backdrop-blur-xl px-1 py-1.5 shadow-lg shadow-black/5 dark:shadow-none">
        {navItems.map((item) => {
          const isActive = item.exact
            ? pathname === item.url
            : pathname.startsWith(item.url);

          return (
            <Link
              key={item.url}
              href={item.url}
              className="relative flex flex-col items-center gap-0.5 px-4 py-2 min-h-11 min-w-11 justify-center"
            >
              {isActive && (
                <motion.div
                  layoutId="bottomnav-pill"
                  className="absolute inset-0 rounded-xl bg-primary/10 dark:bg-primary/20"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <item.icon
                size={20}
                strokeWidth={isActive ? 2 : 1.5}
                className={cn(
                  "relative z-10 transition-colors duration-200",
                  isActive ? "text-primary dark:text-primary-foreground" : "text-muted-foreground"
                )}
              />
              <span
                className={cn(
                  "relative z-10 text-[10px] font-bold transition-colors duration-200 tracking-wide mt-0.5",
                  isActive ? "text-primary dark:text-primary-foreground" : "text-muted-foreground"
                )}
              >
                {item.title}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
