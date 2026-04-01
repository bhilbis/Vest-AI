"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Target,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { title: "Dashboard", url: "/financial-overview", icon: LayoutDashboard },
  { title: "Transaksi", url: "/financial-overview/transactions", icon: ArrowLeftRight },
  { title: "Budget", url: "/financial-overview/budgets", icon: Target },
  { title: "Settings", url: "/tracker/settings", icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <div
      className="fixed left-0 right-0 bottom-0 z-50 lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <nav className="mx-3 mb-2 flex items-center justify-around rounded-2xl border border-border bg-background/80 backdrop-blur-xl px-1 py-1.5 shadow-lg shadow-black/5 dark:shadow-none">
        {navItems.map((item) => {
          const isActive =
            item.url === "/financial-overview"
              ? pathname === "/financial-overview"
              : pathname.startsWith(item.url);

          return (
            <Link
              key={item.title}
              href={item.url}
              className="relative flex flex-col items-center gap-0.5 px-4 py-2 min-h-[44px] min-w-[44px] justify-center"
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
