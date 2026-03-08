/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Plus,
  Receipt,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Shield,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { assetTypes, NavbarItems } from "@/app/api/data";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

interface NavbarProps {
  position: "left" | "right" | "bottom" | "top";
  onPositionChange: (position: "left" | "right" | "bottom" | "top") => void;
  userData: any;
  onOpenMessages: () => void;
  activeMessage?: boolean;
}

const additionalItems = [
  {
    title: "Financial",
    icon: Receipt,
    url: "/financial-overview",
  },
];

export function Navbar({
  position,
  onPositionChange,
  onOpenMessages,
  userData,
  activeMessage,
}: NavbarProps) {
  const pathname = usePathname();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const isMobile = useIsMobile();

  const effectivePosition = isMobile ? "bottom" : position;
  const isVertical =
    effectivePosition === "left" || effectivePosition === "right";
  const isDashboard = pathname === "/tracker";
  const isAdminUser = userData?.user?.role === "ADMIN";

  const allNavItems = useMemo(() => {
    const items = isDashboard
      ? [...NavbarItems, ...additionalItems]
      : [
          ...NavbarItems.filter((item) => item.title !== "Assets"),
          ...additionalItems,
        ];

    if (isAdminUser) {
      items.push({ title: "Admin", icon: Shield, url: "/admin" });
    }
    return items;
  }, [isDashboard, isAdminUser]);

  // How far to slide off-screen, leaving a small peek strip
  const PEEK = 14; // px still visible
  const slideOffset = {
    left: { x: `calc(-100% + ${PEEK}px)`, y: 0 },
    right: { x: `calc(100% - ${PEEK}px)`, y: 0 },
    top: { x: 0, y: `calc(-100% + ${PEEK}px)` },
    bottom: { x: 0, y: `calc(100% - ${PEEK}px)` },
  };

  // Chevron direction
  const CollapseIcon =
    effectivePosition === "left"
      ? ChevronLeft
      : effectivePosition === "right"
        ? ChevronRight
        : effectivePosition === "top"
          ? ChevronUp
          : ChevronDown;

  const ExpandIcon =
    effectivePosition === "left"
      ? ChevronRight
      : effectivePosition === "right"
        ? ChevronLeft
        : effectivePosition === "top"
          ? ChevronDown
          : ChevronUp;

  const containerClasses = useMemo(
    () => ({
      left: "fixed left-4 top-1/2 -translate-y-1/2 flex-col h-auto",
      right: "fixed right-4 top-1/2 -translate-y-1/2 flex-col h-auto",
      bottom: "fixed left-1/2 -translate-x-1/2 flex-row w-auto",
      top: "fixed left-1/2 -translate-x-1/2 top-3 flex-row h-fit",
    }),
    [],
  );

  // Mobile: sit flush to bottom edge so safe-area padding in session-wrapper works
  const mobileBottomClass = isMobile ? "bottom-0" : "bottom-4";

  const handleAddAsset = async (assetType: string) => {
    try {
      const newAssetData = {
        name: `New ${assetType}`,
        type: assetType,
        category: assetType,
        color: assetTypes.find((t) => t.id === assetType)?.color || "bg-muted",
        amount: 0,
        buyPrice: 0,
        coinId: null,
      };
      const response = await fetch("/api/assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newAssetData),
      });
      if (!response.ok) return;
      const createdAsset = await response.json();
      window.dispatchEvent(
        new CustomEvent("portfolioUpdate", {
          detail: { action: "add", asset: createdAsset },
        }),
      );
      setDropdownOpen(false);
    } catch (error) {
      console.error("Error adding asset:", error);
    }
  };

  const isActive = (item: any) => {
    if (item.title === "Messages") return !!activeMessage;
    if (item.url) {
      if (item.url === "/tracker") return pathname === "/tracker";
      return pathname.startsWith(item.url);
    }
    return false;
  };

  const NavbarTooltip = ({
    title,
    children,
  }: {
    title: string;
    children: React.ReactNode;
  }) => {
    if (isMobile) return <>{children}</>;
    return (
      <Tooltip>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        {isVertical && (
          <TooltipContent
            side={effectivePosition === "left" ? "right" : "left"}
          >
            <p>{title}</p>
          </TooltipContent>
        )}
      </Tooltip>
    );
  };

  const NavButtonContent = ({
    item,
    active,
  }: {
    item: any;
    active: boolean;
  }) => (
    <motion.div
      whileHover={
        !isMobile
          ? {
              y: isVertical ? 0 : -2,
              x: isVertical ? (effectivePosition === "left" ? 2 : -2) : 0,
              scale: 1.05,
            }
          : undefined
      }
      whileTap={{ scale: 0.95 }}
      className={cn(
        "relative rounded-xl transition-all duration-300 group flex items-center gap-2 cursor-pointer",
        isMobile ? "p-3" : "p-2.5",
        active
          ? "bg-primary/10 text-primary shadow-sm backdrop-blur-sm"
          : "hover:bg-muted/50 text-muted-foreground hover:text-foreground",
      )}
    >
      <item.icon size={isMobile ? 22 : 20} strokeWidth={2.5} />
      {!isVertical && !isMobile && (
        <span className="text-sm font-medium">{item.title}</span>
      )}

      <AnimatePresence>
        {active && (
          <motion.div
            layoutId="navbar-indicator"
            className="absolute inset-0 rounded-xl bg-primary/5 -z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );

  // ─── Mobile: full-width bottom bar, NOT floating pill ───────────────────────
  // This lets session-wrapper's paddingBottom handle the safe area correctly.
  if (isMobile) {
    return (
      <TooltipProvider delayDuration={200}>
        <div
          className="fixed left-0 right-0 bottom-0 z-50"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          <div className="mx-3 mb-3 backdrop-blur-md bg-background/80 border border-border/50 rounded-2xl shadow-lg">
            <div className="flex items-center justify-around px-1 py-1">
              {allNavItems.map((item) => (
                <div key={`${item.title}-${item.url ?? "no-url"}`}>
                  {item.title === "Assets" ? (
                    <DropdownMenu
                      open={dropdownOpen}
                      onOpenChange={setDropdownOpen}
                    >
                      <DropdownMenuTrigger asChild>
                        <button title="Nav" className="outline-none">
                          <NavButtonContent item={item} active={dropdownOpen} />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        side="top"
                        align="start"
                        className="backdrop-blur-md bg-popover/95 border-border rounded-xl shadow-xl min-w-[200px]"
                      >
                        <div className="p-2">
                          <p className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Add New Asset
                          </p>
                          {assetTypes.map((asset) => (
                            <DropdownMenuItem
                              key={asset.id}
                              onClick={() => handleAddAsset(asset.id)}
                              className="flex items-center gap-3 cursor-pointer rounded-lg my-1 px-3 py-2.5 focus:bg-accent focus:text-accent-foreground"
                            >
                              <div
                                className={cn(
                                  "w-2.5 h-2.5 rounded-full shadow-sm",
                                  asset.color,
                                )}
                              />
                              <Plus size={16} strokeWidth={2.5} />
                              <span className="font-medium">{asset.label}</span>
                            </DropdownMenuItem>
                          ))}
                        </div>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : item.url ? (
                    <Link href={item.url}>
                      <NavButtonContent item={item} active={isActive(item)} />
                    </Link>
                  ) : (
                    <button onClick={onOpenMessages} className="outline-none">
                      <NavButtonContent item={item} active={isActive(item)} />
                    </button>
                  )}
                </div>
              ))}

              {/* Divider */}
              <div className="w-px h-6 bg-border/50" />

              {/* Avatar */}
              <motion.div
                whileTap={{ scale: 0.95 }}
                className="relative group cursor-pointer p-1.5"
              >
                <Avatar className="h-9 w-9 border border-border shadow-sm transition-all group-hover:border-primary/50">
                  {userData?.user?.image && (
                    <AvatarImage asChild>
                      <Image
                        src={userData.user.image}
                        alt={userData.user.name || "User"}
                        width={40}
                        height={40}
                        className="object-cover"
                      />
                    </AvatarImage>
                  )}
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
                    {userData?.user?.name?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute bottom-1 right-1 w-2.5 h-2.5 bg-chart-1 rounded-full border-2 border-background ring-1 ring-background" />
              </motion.div>
            </div>
          </div>
        </div>
      </TooltipProvider>
    );
  }

  // ─── Desktop floating navbar (same as original) + collapse/peek ─────────────
  return (
    <TooltipProvider delayDuration={200}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: isVertical ? 0 : 20 }}
        animate={{
          opacity: 1,
          scale: 1,
          y: isVertical
            ? 0
            : isCollapsed
              ? slideOffset[effectivePosition].y
              : 0,
          x: isCollapsed ? slideOffset[effectivePosition].x : 0,
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className={cn(
          containerClasses[effectivePosition],
          mobileBottomClass,
          "flex z-50",
        )}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        <motion.div
          className={cn(
            "backdrop-blur-md bg-background/80 border border-border/50 rounded-2xl shadow-lg",
            isVertical ? "flex-col" : "flex-row",
            "p-2",
            "flex gap-1.5 relative overflow-hidden max-w-[calc(100vw-2rem)]",
          )}
          whileHover={{
            boxShadow:
              "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
          }}
        >
          {/* Navigation Items */}
          <div
            className={cn(
              isVertical ? "flex-col" : "flex-row",
              "flex gap-1.5 relative z-10",
            )}
          >
            {allNavItems.map((item) => (
              <div key={`${item.title}-${item.url ?? "no-url"}`}>
                {item.title === "Assets" ? (
                  <DropdownMenu
                    open={dropdownOpen}
                    onOpenChange={setDropdownOpen}
                  >
                    <DropdownMenuTrigger asChild>
                      <button title="Nav" className="outline-none">
                        <NavButtonContent item={item} active={dropdownOpen} />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      side={effectivePosition === "bottom" ? "top" : "right"}
                      align="start"
                      className="backdrop-blur-md bg-popover/95 border-border rounded-xl shadow-xl min-w-[200px]"
                    >
                      <div className="p-2">
                        <p className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          Add New Asset
                        </p>
                        {assetTypes.map((asset) => (
                          <DropdownMenuItem
                            key={asset.id}
                            onClick={() => handleAddAsset(asset.id)}
                            className="flex items-center gap-3 cursor-pointer rounded-lg my-1 px-3 py-2.5 focus:bg-accent focus:text-accent-foreground"
                          >
                            <div
                              className={cn(
                                "w-2.5 h-2.5 rounded-full shadow-sm",
                                asset.color,
                              )}
                            />
                            <Plus size={16} strokeWidth={2.5} />
                            <span className="font-medium">{asset.label}</span>
                          </DropdownMenuItem>
                        ))}
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : item.url ? (
                  <NavbarTooltip title={item.title}>
                    <Link href={item.url}>
                      <NavButtonContent item={item} active={isActive(item)} />
                    </Link>
                  </NavbarTooltip>
                ) : (
                  <NavbarTooltip title={item.title}>
                    <button onClick={onOpenMessages} className="outline-none">
                      <NavButtonContent item={item} active={isActive(item)} />
                    </button>
                  </NavbarTooltip>
                )}
              </div>
            ))}
          </div>

          {/* Divider */}
          <div
            className={cn(
              isVertical ? "w-full h-px" : "w-px h-full",
              "bg-border/50 mx-1",
            )}
          />

          {/* User Avatar */}
          <div
            className={cn(
              isVertical ? "flex-col" : "flex-row",
              "flex gap-2 relative z-10 items-center justify-center",
            )}
          >
            <NavbarTooltip title={userData?.user?.name || "User"}>
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="relative group cursor-pointer"
              >
                <Avatar className="h-9 w-9 border border-border shadow-sm transition-all group-hover:border-primary/50">
                  {userData?.user?.image && (
                    <AvatarImage asChild>
                      <Image
                        src={userData.user.image}
                        alt={userData.user.name || "User"}
                        width={40}
                        height={40}
                        className="object-cover"
                      />
                    </AvatarImage>
                  )}
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
                    {userData?.user?.name?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-chart-1 rounded-full border-2 border-background ring-1 ring-background" />
              </motion.div>
            </NavbarTooltip>
          </div>

          {/* Position Controls + Collapse button */}
          <motion.div
            className={cn(
              isVertical ? "flex-col" : "flex-row",
              "flex gap-1 border-t border-border/50 pt-1.5 mt-1 relative z-10 items-center",
            )}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {(["top", "left", "bottom", "right"] as const).map((pos) => (
              <Tooltip key={pos}>
                <TooltipTrigger asChild>
                  <motion.button
                    onClick={() => onPositionChange(pos)}
                    aria-label={`Move navbar to ${pos}`}
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.9 }}
                    className={cn(
                      "w-4 h-4 rounded-full border transition-all duration-300",
                      position === pos
                        ? "bg-primary border-primary shadow-sm"
                        : "bg-muted border-transparent hover:bg-muted-foreground/20",
                    )}
                  />
                </TooltipTrigger>
                <TooltipContent side={isVertical ? "right" : "top"}>
                  <p className="capitalize">Move to {pos}</p>
                </TooltipContent>
              </Tooltip>
            ))}

            {/* Collapse/expand toggle */}
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.button
                  onClick={() => setIsCollapsed((prev) => !prev)}
                  aria-label={
                    isCollapsed ? "Show navigation" : "Hide navigation"
                  }
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.9 }}
                  className={cn(
                    "w-4 h-4 rounded-full border transition-all duration-300 flex items-center justify-center",
                    isCollapsed
                      ? "bg-primary border-primary text-primary-foreground shadow-sm"
                      : "bg-muted border-transparent hover:bg-muted-foreground/20 text-muted-foreground",
                  )}
                >
                  {isCollapsed ? (
                    <ExpandIcon size={8} strokeWidth={3} />
                  ) : (
                    <CollapseIcon size={8} strokeWidth={3} />
                  )}
                </motion.button>
              </TooltipTrigger>
              <TooltipContent side={isVertical ? "right" : "top"}>
                <p>{isCollapsed ? "Show navigation" : "Hide navigation"}</p>
              </TooltipContent>
            </Tooltip>
          </motion.div>
        </motion.div>
      </motion.div>
    </TooltipProvider>
  );
}
