"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { motion } from "motion/react";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Target,
  LogOut,
  ChevronLeft,
  Wallet,
} from "lucide-react";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { ModeToggle } from "@/components/mode-toggle";
import { Settings } from "lucide-react";

const navItems = [
  { title: "Dashboard", url: "/financial-overview", icon: LayoutDashboard },
  { title: "Transaksi", url: "/financial-overview/transactions", icon: ArrowLeftRight },
  { title: "Budget", url: "/financial-overview/budgets", icon: Target },
  { title: "Settings", url: "/tracker/settings", icon: Settings },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 64 : 240 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="hidden lg:flex flex-col h-screen border-r border-border bg-background sticky top-0 overflow-hidden z-40 shrink-0"
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-3 h-14 border-b border-border shrink-0">
        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Wallet className="h-4 w-4 text-primary" />
        </div>
        {!collapsed && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-sm font-bold text-foreground truncate tracking-tight"
          >
            Vest AI
          </motion.span>
        )}
        <div className={cn("flex items-center gap-1", collapsed ? "mx-auto flex-col" : "ml-auto")}>
          {!collapsed && <ModeToggle />}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
          >
            <ChevronLeft
              size={16}
              className={cn("transition-transform duration-200", collapsed && "rotate-180")}
            />
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive =
            item.url === "/financial-overview"
              ? pathname === "/financial-overview"
              : pathname.startsWith(item.url);

          return (
            <Link
              key={item.title}
              href={item.url}
              className={cn(
                "relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors duration-200",
                collapsed && "justify-center px-0",
                isActive
                  ? "text-primary-foreground bg-primary shadow-md shadow-primary/20"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/80"
              )}
            >
              <item.icon size={18} strokeWidth={isActive ? 2 : 1.5} className="shrink-0" />
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="truncate"
                >
                  {item.title}
                </motion.span>
              )}
              {isActive && collapsed && (
                <motion.div
                  layoutId="sidebar-indicator"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-primary"
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="border-t border-border p-2 shrink-0">
        <div className={cn("flex items-center gap-2.5 rounded-lg p-2 hover:bg-muted transition-colors", collapsed && "justify-center")}>
          <Avatar className="h-8 w-8 shrink-0 ring-1 ring-border">
            {session?.user?.image && (
              <AvatarImage asChild>
                <Image
                  src={session.user.image}
                  alt={session.user.name || "User"}
                  width={32}
                  height={32}
                  className="object-cover"
                />
              </AvatarImage>
            )}
            <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-bold">
              {session?.user?.name?.charAt(0) || "U"}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate text-foreground">
                  {session?.user?.name || "User"}
                </p>
                <p className="text-[11px] text-muted-foreground truncate">
                  {session?.user?.email || ""}
                </p>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
                title="Log out"
              >
                <LogOut size={14} />
              </button>
            </>
          )}
        </div>
      </div>
    </motion.aside>
  );
}
