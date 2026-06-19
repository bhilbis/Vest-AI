"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { motion } from "motion/react";
import {
  LayoutDashboard,
  Wallet,
  LogOut,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Settings,
  LineChart,
  Sun,
  Moon,
  Monitor,
  Languages,
} from "lucide-react";
import { useState } from "react";
import { useTheme } from "next-themes";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useGuestStore } from "@/lib/guest-store";
import { useLanguage, type Locale } from "@/lib/i18n/context";

export function AppSidebar() {
  const pathname  = usePathname();
  const { data: session } = useSession();
  const [collapsed, setCollapsed] = useState(false);
  const { isGuest } = useGuestStore();
  const { theme, setTheme } = useTheme();
  const { t, locale, setLocale } = useLanguage();

  const navItems = [
    { title: t.nav.dashboard, url: "/dashboard",          icon: LayoutDashboard, exact: true  },
    { title: t.nav.finance,   url: "/financial-overview", icon: Wallet,          exact: false },
    { title: t.nav.academic,  url: "/kuliah",             icon: GraduationCap,   exact: false },
    { title: t.nav.portfolio, url: "/tracker",            icon: LineChart,       exact: true  },
  ];

  const themeOptions = [
    { key: "light",  label: t.nav.theme.light,  icon: Sun     },
    { key: "dark",   label: t.nav.theme.dark,   icon: Moon    },
    { key: "system", label: t.nav.theme.system, icon: Monitor },
  ] as const;

  const W = collapsed ? 64 : 220;

  return (
    <motion.div
      className="relative hidden lg:flex shrink-0"
      initial={false}
      animate={{ width: W }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <aside
        className="flex flex-col w-full h-screen border-r border-sidebar-border bg-sidebar sticky top-0 overflow-hidden z-40"
        style={{ paddingTop: isGuest ? "40px" : undefined }}
      >
        {/* ── Logo / header ─────────────────────────────────────── */}
        <div className={cn(
          "flex items-center border-b border-sidebar-border shrink-0 h-14",
          collapsed ? "justify-center px-2" : "gap-2.5 px-4",
        )}>
          <div className="h-8 w-8 rounded-lg shrink-0 overflow-hidden bg-primary/10 flex items-center justify-center">
            <Image src="/vest.png" alt="Vest AI" width={32} height={32} className="w-full h-full object-cover" />
          </div>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm font-bold text-sidebar-foreground truncate tracking-tight"
            >
              Vest AI
            </motion.span>
          )}
        </div>

        {/* ── Navigation ────────────────────────────────────────── */}
        <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto overflow-x-hidden">
          {navItems.map((item) => {
            const isActive = item.exact
              ? pathname === item.url
              : pathname.startsWith(item.url);

            return (
              <Link
                key={item.url}
                href={item.url}
                title={collapsed ? item.title : undefined}
                className={cn(
                  "group relative flex items-center gap-3 rounded-lg px-2.5 py-2.5 text-sm font-medium transition-all duration-150",
                  collapsed && "justify-center px-2",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                    : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent",
                )}
              >
                <item.icon
                  size={17}
                  strokeWidth={isActive ? 2.2 : 1.7}
                  className="shrink-0"
                />
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="truncate"
                  >
                    {item.title}
                  </motion.span>
                )}
                {isActive && !collapsed && (
                  <motion.span
                    layoutId="sidebar-active-dot"
                    className="ml-auto h-1.5 w-1.5 rounded-full bg-sidebar-primary-foreground/50"
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* ── Profile / user area ───────────────────────────────── */}
        <div className="border-t border-sidebar-border p-2 shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={cn(
                  "w-full flex items-center gap-2.5 rounded-lg p-2 hover:bg-sidebar-accent transition-colors cursor-pointer",
                  collapsed && "justify-center",
                )}
              >
                <Avatar className="h-8 w-8 shrink-0 ring-2 ring-sidebar-border">
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
                  <AvatarFallback className="bg-sidebar-primary/20 text-sidebar-primary text-[10px] font-bold">
                    {session?.user?.name?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                {!collapsed && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex-1 min-w-0 text-left"
                  >
                    <p className="text-xs font-semibold truncate text-sidebar-foreground leading-tight">
                      {session?.user?.name || "User"}
                    </p>
                    <p className="text-[10px] text-sidebar-foreground/55 truncate leading-tight">
                      {session?.user?.email || ""}
                    </p>
                  </motion.div>
                )}
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              side="top"
              align={collapsed ? "center" : "end"}
              sideOffset={8}
              className="w-56"
            >
              {/* User info */}
              <DropdownMenuLabel className="pb-2">
                <div className="flex items-center gap-2.5">
                  <Avatar className="h-9 w-9 shrink-0">
                    {session?.user?.image && (
                      <AvatarImage asChild>
                        <Image
                          src={session.user.image}
                          alt={session.user.name || "User"}
                          width={36}
                          height={36}
                          className="object-cover"
                        />
                      </AvatarImage>
                    )}
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                      {session?.user?.name?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">{session?.user?.name || "User"}</p>
                    <p className="text-[11px] text-muted-foreground truncate font-normal">{session?.user?.email || ""}</p>
                  </div>
                </div>
              </DropdownMenuLabel>

              <DropdownMenuSeparator />

              {/* Theme selector */}
              <div className="px-2 py-1.5">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">{t.nav.theme.label}</p>
                <div className="flex gap-1">
                  {themeOptions.map(({ key, label, icon: Icon }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setTheme(key)}
                      className={cn(
                        "flex-1 flex flex-col items-center gap-1 py-1.5 rounded-md text-[10px] font-medium transition-colors cursor-pointer",
                        theme === key
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground",
                      )}
                    >
                      <Icon size={13} />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <DropdownMenuSeparator />

              {/* Language selector */}
              <div className="px-2 py-1.5">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <Languages size={10} />
                  {t.settings.language}
                </p>
                <div className="flex gap-1">
                  {(["en", "id"] as Locale[]).map((l) => (
                    <button
                      key={l}
                      type="button"
                      onClick={() => setLocale(l)}
                      className={cn(
                        "flex-1 py-1.5 rounded-md text-[10px] font-semibold transition-colors cursor-pointer uppercase",
                        locale === l
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground",
                      )}
                    >
                      {l === "en" ? t.settings.english : t.settings.indonesian}
                    </button>
                  ))}
                </div>
              </div>

              <DropdownMenuSeparator />

              <DropdownMenuItem asChild>
                <Link href="/tracker/settings" className="cursor-pointer gap-2">
                  <Settings size={14} />
                  {t.nav.settings}
                </Link>
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer gap-2"
              >
                <LogOut size={14} />
                {t.nav.signOut}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* ── Collapse toggle ─────────── */}
      <button
        type="button"
        onClick={() => setCollapsed((c) => !c)}
        title={collapsed ? t.nav.expandSidebar : t.nav.collapseSidebar}
        className="absolute top-7 -translate-y-1/2 right-0 translate-x-1/2 z-50 h-6 w-6 rounded-full bg-background border border-border shadow-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
      >
        {collapsed ? <ChevronRight size={11} /> : <ChevronLeft size={11} />}
      </button>
    </motion.div>
  );
}
