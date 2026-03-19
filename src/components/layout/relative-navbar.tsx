/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Plus,
  Receipt,
  Shield,
  PanelLeftClose,
  Maximize2,
  X,
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

function NavbarTooltip({
  title,
  children,
  isMobile,
  isVertical,
  effectivePosition,
}: {
  title: string;
  children: React.ReactNode;
  isMobile: boolean;
  isVertical: boolean;
  effectivePosition: "left" | "right" | "bottom" | "top";
}) {
  if (isMobile) return <>{children}</>;
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      {isVertical && (
        <TooltipContent side={effectivePosition === "left" ? "right" : "left"}>
          <p>{title}</p>
        </TooltipContent>
      )}
    </Tooltip>
  );
}

function NavButtonContent({
  item,
  active,
  isMobile,
  isVertical,
  effectivePosition,
}: {
  item: any;
  active: boolean;
  isMobile: boolean;
  isVertical: boolean;
  effectivePosition: "left" | "right" | "bottom" | "top";
}) {
  return (
    <motion.div
      whileHover={
        !isMobile
          ? {
              y: isVertical ? 0 : -2,
              x: isVertical ? (effectivePosition === "left" ? 2 : -2) : 0,
            }
          : undefined
      }
      whileTap={{ scale: 0.95 }}
      className={cn(
        "relative rounded-lg transition-all duration-200 group flex items-center gap-2 cursor-pointer",
        "border-2 border-transparent",
        isMobile ? "p-3" : "p-2.5",
        active
          ? "bg-primary text-primary-foreground border-foreground shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,0.3)]"
          : "hover:bg-muted border-transparent hover:border-foreground/20 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)] dark:hover:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.15)] text-muted-foreground hover:text-foreground",
      )}
    >
      <item.icon size={isMobile ? 22 : 20} strokeWidth={2.5} />
      {!isVertical && !isMobile && (
        <span className="text-sm font-bold uppercase tracking-wide">
          {item.title}
        </span>
      )}
    </motion.div>
  );
}

// ── Smart position detection for FAB items ──────────────────────────────
function useSmartDirection(
  fabRef: React.RefObject<HTMLDivElement | null>,
  isExpanded: boolean,
) {
  const [direction, setDirection] = useState<{
    horizontal: "left" | "right";
    vertical: "up" | "down";
  }>({ horizontal: "right", vertical: "down" });

  const calculate = useCallback(() => {
    if (!fabRef.current) return;
    const rect = fabRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const viewW = window.innerWidth;
    const viewH = window.innerHeight;

    setDirection({
      horizontal: centerX < viewW / 2 ? "right" : "left",
      vertical: centerY < viewH / 2 ? "down" : "up",
    });
  }, [fabRef]);

  useEffect(() => {
    calculate();
    window.addEventListener("resize", calculate);
    return () => window.removeEventListener("resize", calculate);
  }, [calculate, isExpanded]);

  return { direction, recalculate: calculate };
}

// ── Floating Action Button (iPhone-style, Neubrutalism) ─────────────────
function FloatingActionButton({
  position,
  onExpand,
  allNavItems,
  isActive,
  onOpenMessages,
  handleAddAsset,
}: {
  position: "left" | "right" | "bottom" | "top";
  onExpand: () => void;
  allNavItems: any[];
  isActive: (item: any) => boolean;
  onOpenMessages: () => void;
  handleAddAsset: (assetType: string) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const fabRef = useRef<HTMLDivElement>(null);
  const constraintsRef = useRef<HTMLDivElement>(null);
  const { direction, recalculate } = useSmartDirection(fabRef, isExpanded);

  const fabInitial = useMemo(() => {
    switch (position) {
      case "left":
        return "fixed left-4 top-1/2 -translate-y-1/2";
      case "right":
        return "fixed right-4 top-1/2 -translate-y-1/2";
      case "top":
        return "fixed top-4 left-1/2 -translate-x-1/2";
      case "bottom":
        return "fixed bottom-4 left-1/2 -translate-x-1/2";
    }
  }, [position]);

  // After drag ends recalculate best direction
  const onDragEnd = () => {
    recalculate();
  };

  // Item offsets based on smart direction
  const getItemOffset = (index: number, total: number) => {
    const spacing = 56;

    // Primary axis: spread items in a line
    // Secondary axis: offset away from the edge
    const h = direction.horizontal === "right" ? 1 : -1;
    const v = direction.vertical === "down" ? 1 : -1;

    // Determine layout: use vertical stack if FAB is on left/right edge,
    // horizontal stack if on top/bottom edge
    const isVerticalStack =
      position === "left" || position === "right"
        ? true
        : position === "top" || position === "bottom"
          ? false
          : direction.horizontal === "left" || direction.horizontal === "right";

    if (isVerticalStack) {
      const startY = -((total - 1) * spacing) / 2;
      return {
        x: h * 64,
        y: startY + index * spacing,
      };
    } else {
      const startX = -((total - 1) * spacing) / 2;
      return {
        x: startX + index * spacing,
        y: v * 64,
      };
    }
  };

  // Restore button offset
  const getRestoreOffset = () => {
    const h = direction.horizontal === "right" ? 1 : -1;
    const v = direction.vertical === "down" ? 1 : -1;
    const isVerticalStack = position === "left" || position === "right";

    if (isVerticalStack) {
      return {
        x: h * 64,
        y: ((allNavItems.length + 1) * 56) / 2 + 4,
      };
    } else {
      return {
        x: ((allNavItems.length + 1) * 56) / 2 + 4,
        y: v * 64,
      };
    }
  };

  const restoreOffset = getRestoreOffset();

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-998 bg-background/40"
            onClick={() => setIsExpanded(false)}
          />
        )}
      </AnimatePresence>

      <div
        ref={constraintsRef}
        className="fixed inset-0 z-999 pointer-events-none"
      >
        <motion.div
          ref={fabRef}
          className={cn(fabInitial, "z-999 pointer-events-auto")}
          drag
          dragConstraints={constraintsRef}
          dragElastic={0.08}
          dragMomentum={false}
          onDragEnd={onDragEnd}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 28 }}
        >
          {/* ── Fan items ── */}
          <AnimatePresence>
            {isExpanded &&
              allNavItems.map((item, index) => {
                const offset = getItemOffset(index, allNavItems.length);
                const active = isActive(item);

                return (
                  <motion.div
                    key={`${item.title}-fab`}
                    initial={{ opacity: 0, x: 0, y: 0, scale: 0.2 }}
                    animate={{
                      opacity: 1,
                      x: offset.x,
                      y: offset.y,
                      scale: 1,
                    }}
                    exit={{ opacity: 0, x: 0, y: 0, scale: 0.2 }}
                    transition={{
                      type: "spring",
                      stiffness: 500,
                      damping: 24,
                      delay: index * 0.035,
                    }}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                  >
                    {/* Label */}
                    <motion.span
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.035 + 0.15 }}
                      className={cn(
                        "absolute whitespace-nowrap text-[10px] font-black uppercase tracking-widest",
                        "bg-foreground text-background px-1.5 py-0.5 rounded border-2 border-foreground",
                        "shadow-[2px_2px_0px_0px] shadow-foreground/50",
                        "pointer-events-none select-none z-10",
                        "left-1/2 -translate-x-1/2 -bottom-7",
                      )}
                    >
                      {item.title}
                    </motion.span>

                    {item.title === "Assets" ? (
                      <DropdownMenu
                        open={dropdownOpen}
                        onOpenChange={setDropdownOpen}
                      >
                        <DropdownMenuTrigger asChild>
                          <motion.button
                            whileHover={{ scale: 1.12, y: -2 }}
                            whileTap={{ scale: 0.9 }}
                            className={cn(
                              "w-12 h-12 rounded-lg flex items-center justify-center border-2 border-foreground transition-colors font-bold",
                              "shadow-[3px_3px_0px_0px] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,0.3)]",
                              active || dropdownOpen
                                ? "bg-primary text-primary-foreground shadow-foreground"
                                : "bg-background text-foreground shadow-foreground/70 hover:bg-muted",
                            )}
                          >
                            <item.icon size={20} strokeWidth={2.5} />
                          </motion.button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          side={
                            direction.vertical === "down" ? "bottom" : "top"
                          }
                          align="center"
                          className="bg-background border-2 border-foreground rounded-lg shadow-[4px_4px_0px_0px] shadow-foreground min-w-[200px]"
                        >
                          <div className="p-2">
                            <p className="px-3 py-2 text-xs font-black text-muted-foreground uppercase tracking-widest">
                              Add New Asset
                            </p>
                            {assetTypes.map((asset) => (
                              <DropdownMenuItem
                                key={asset.id}
                                onClick={() => {
                                  handleAddAsset(asset.id);
                                  setIsExpanded(false);
                                }}
                                className="flex items-center gap-3 cursor-pointer rounded-md my-1 px-3 py-2.5 font-bold border-2 border-transparent hover:border-foreground hover:shadow-[2px_2px_0px_0px] hover:shadow-foreground focus:bg-accent"
                              >
                                <div
                                  className={cn(
                                    "w-3 h-3 rounded border-2 border-foreground",
                                    asset.color,
                                  )}
                                />
                                <Plus size={16} strokeWidth={3} />
                                <span className="uppercase tracking-wide text-sm">
                                  {asset.label}
                                </span>
                              </DropdownMenuItem>
                            ))}
                          </div>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : item.url ? (
                      <Link
                        href={item.url}
                        onClick={() => setIsExpanded(false)}
                      >
                        <motion.div
                          whileHover={{ scale: 1.12, y: -2 }}
                          whileTap={{ scale: 0.9 }}
                          className={cn(
                            "w-12 h-12 rounded-lg flex items-center justify-center border-2 border-foreground transition-colors",
                            "shadow-[3px_3px_0px_0px] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,0.3)]",
                            active
                              ? "bg-primary text-primary-foreground shadow-foreground"
                              : "bg-background text-foreground shadow-foreground/70 hover:bg-muted",
                          )}
                        >
                          <item.icon size={20} strokeWidth={2.5} />
                        </motion.div>
                      </Link>
                    ) : (
                      <motion.button
                        whileHover={{ scale: 1.12, y: -2 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => {
                          onOpenMessages();
                          setIsExpanded(false);
                        }}
                        className={cn(
                          "w-12 h-12 rounded-lg flex items-center justify-center border-2 border-foreground transition-colors",
                          "shadow-[3px_3px_0px_0px] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,0.3)]",
                          active
                            ? "bg-primary text-primary-foreground shadow-foreground"
                            : "bg-background text-foreground shadow-foreground/70 hover:bg-muted",
                        )}
                      >
                        <item.icon size={20} strokeWidth={2.5} />
                      </motion.button>
                    )}
                  </motion.div>
                );
              })}
          </AnimatePresence>

          {/* ── Restore full navbar button ── */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, scale: 0.2, x: 0, y: 0 }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  x: restoreOffset.x,
                  y: restoreOffset.y,
                }}
                exit={{ opacity: 0, scale: 0.2, x: 0, y: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 500,
                  damping: 24,
                  delay: allNavItems.length * 0.035,
                }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
              >
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{
                    delay: allNavItems.length * 0.035 + 0.15,
                  }}
                  className={cn(
                    "absolute whitespace-nowrap text-[10px] font-black uppercase tracking-widest",
                    "bg-primary text-primary-foreground px-1.5 py-0.5 rounded border-2 border-foreground",
                    "shadow-[2px_2px_0px_0px] shadow-foreground/50",
                    "pointer-events-none select-none z-10",
                    "left-1/2 -translate-x-1/2 -bottom-7",
                  )}
                >
                  Expand
                </motion.span>
                <motion.button
                  whileHover={{ scale: 1.12, y: -2 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    setIsExpanded(false);
                    onExpand();
                  }}
                  className={cn(
                    "w-12 h-12 rounded-lg flex items-center justify-center border-2 border-foreground",
                    "bg-primary text-primary-foreground",
                    "shadow-[3px_3px_0px_0px] shadow-foreground",
                    "hover:shadow-[4px_4px_0px_0px] hover:shadow-foreground transition-shadow",
                  )}
                >
                  <Maximize2 size={20} strokeWidth={2.5} />
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Main FAB Button ── */}
          <motion.button
            onClick={() => setIsExpanded(!isExpanded)}
            whileHover={{ scale: 1.08, y: -1 }}
            whileTap={{ scale: 0.92 }}
            className={cn(
              "relative w-14 h-14 rounded-xl flex items-center justify-center",
              "border-3 border-foreground font-bold transition-all duration-200",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
              isExpanded
                ? "bg-foreground text-background shadow-[0px_0px_0px_0px] border-foreground"
                : "bg-primary text-primary-foreground shadow-[4px_4px_0px_0px] shadow-foreground hover:shadow-[5px_5px_0px_0px] hover:shadow-foreground",
            )}
            style={{ borderWidth: "3px" }}
          >
            <motion.div
              animate={{ rotate: isExpanded ? 45 : 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
            >
              {isExpanded ? (
                <X size={24} strokeWidth={3} />
              ) : (
                <Plus size={24} strokeWidth={3} />
              )}
            </motion.div>

            {/* Drag indicator dots */}
            {!isExpanded && (
              <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 flex gap-[3px]">
                <div className="w-[3px] h-[3px] rounded-full bg-primary-foreground/50" />
                <div className="w-[3px] h-[3px] rounded-full bg-primary-foreground/50" />
                <div className="w-[3px] h-[3px] rounded-full bg-primary-foreground/50" />
              </div>
            )}
          </motion.button>
        </motion.div>
      </div>
    </>
  );
}

// ── Main Navbar Export ──────────────────────────────────────────────────
export function Navbar({
  position,
  onPositionChange,
  onOpenMessages,
  userData,
  activeMessage,
}: NavbarProps) {
  const pathname = usePathname();
  const [dropdownOpen, setDropdownOpen] = useState(false);
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

  const containerClasses = useMemo(
    () => ({
      left: "fixed left-4 top-1/2 -translate-y-1/2 flex-col h-auto max-h-[calc(100vh-2rem)]",
      right:
        "fixed right-4 top-1/2 -translate-y-1/2 flex-col h-auto max-h-[calc(100vh-2rem)]",
      bottom: "fixed left-1/2 -translate-x-1/2 flex-row w-auto",
      top: "fixed left-1/2 -translate-x-1/2 top-3 flex-row h-fit",
    }),
    [],
  );

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

  // ─── Mobile ───────────────────────────────────────────────────────────────
  if (isMobile) {
    return (
      <TooltipProvider delayDuration={200}>
        <div
          className="fixed left-0 right-0 bottom-0 z-50 text-foreground"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          <div
            className={cn(
              "mx-3 mb-3 bg-background border-2 border-foreground rounded-xl",
              "shadow-[4px_4px_0px_0px] shadow-foreground",
            )}
          >
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
                          <NavButtonContent
                            item={item}
                            active={dropdownOpen}
                            isMobile={isMobile}
                            isVertical={isVertical}
                            effectivePosition={effectivePosition}
                          />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        side="top"
                        align="start"
                        className="bg-background border-2 border-foreground rounded-lg shadow-[4px_4px_0px_0px] shadow-foreground min-w-[200px]"
                      >
                        <div className="p-2">
                          <p className="px-3 py-2 text-xs font-black text-muted-foreground uppercase tracking-widest">
                            Add New Asset
                          </p>
                          {assetTypes.map((asset) => (
                            <DropdownMenuItem
                              key={asset.id}
                              onClick={() => handleAddAsset(asset.id)}
                              className="flex items-center gap-3 cursor-pointer rounded-md my-1 px-3 py-2.5 font-bold border-2 border-transparent hover:border-foreground"
                            >
                              <div
                                className={cn(
                                  "w-3 h-3 rounded border-2 border-foreground",
                                  asset.color,
                                )}
                              />
                              <Plus size={16} strokeWidth={3} />
                              <span className="uppercase tracking-wide text-sm">
                                {asset.label}
                              </span>
                            </DropdownMenuItem>
                          ))}
                        </div>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : item.url ? (
                    <Link href={item.url}>
                      <NavButtonContent
                        item={item}
                        active={isActive(item)}
                        isMobile={isMobile}
                        isVertical={isVertical}
                        effectivePosition={effectivePosition}
                      />
                    </Link>
                  ) : (
                    <button onClick={onOpenMessages} className="outline-none">
                      <NavButtonContent
                        item={item}
                        active={isActive(item)}
                        isMobile={isMobile}
                        isVertical={isVertical}
                        effectivePosition={effectivePosition}
                      />
                    </button>
                  )}
                </div>
              ))}

              {/* Divider */}
              <div className="w-0.5 h-6 bg-foreground/20 rounded-full" />

              {/* Avatar */}
              <motion.div
                whileTap={{ scale: 0.95 }}
                className="relative group cursor-pointer p-1.5"
              >
                <Avatar
                  className={cn(
                    "h-9 w-9 border-2 border-foreground transition-all",
                    "shadow-[2px_2px_0px_0px] shadow-foreground",
                  )}
                >
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
                  <AvatarFallback className="bg-primary text-primary-foreground font-black text-xs">
                    {userData?.user?.name?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute bottom-1 right-1 w-2.5 h-2.5 bg-chart-1 rounded-full border-2 border-foreground" />
              </motion.div>
            </div>
          </div>
        </div>
      </TooltipProvider>
    );
  }

  // ─── Desktop collapsed → FAB ──────────────────────────────────────────────
  if (isCollapsed) {
    return (
      <TooltipProvider delayDuration={100}>
        <FloatingActionButton
          position={effectivePosition}
          onExpand={() => setIsCollapsed(false)}
          allNavItems={allNavItems}
          isActive={isActive}
          onOpenMessages={onOpenMessages}
          handleAddAsset={handleAddAsset}
        />
      </TooltipProvider>
    );
  }

  // ─── Desktop full navbar ──────────────────────────────────────────────────
  return (
    <TooltipProvider delayDuration={200}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: isVertical ? 0 : 20 }}
        animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className={cn(
          containerClasses[effectivePosition],
          mobileBottomClass,
          "flex z-50 text-foreground",
        )}
      >
        <motion.div
          className={cn(
            "bg-background border-2 border-foreground rounded-xl",
            "shadow-[5px_5px_0px_0px] shadow-foreground dark:shadow-[5px_5px_0px_0px_rgba(255,255,255,0.25)]",
            isVertical ? "flex-col overflow-y-auto no-scrollbar" : "flex-row",
            "p-2",
            "flex gap-1.5 relative max-w-[calc(100vw-2rem)]",
          )}
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
                        <NavButtonContent
                          item={item}
                          active={dropdownOpen}
                          isMobile={isMobile}
                          isVertical={isVertical}
                          effectivePosition={effectivePosition}
                        />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      side={effectivePosition === "bottom" ? "top" : "right"}
                      align="start"
                      className="bg-background border-2 border-foreground rounded-lg shadow-[4px_4px_0px_0px] shadow-foreground min-w-[200px]"
                    >
                      <div className="p-2">
                        <p className="px-3 py-2 text-xs font-black text-muted-foreground uppercase tracking-widest">
                          Add New Asset
                        </p>
                        {assetTypes.map((asset) => (
                          <DropdownMenuItem
                            key={asset.id}
                            onClick={() => handleAddAsset(asset.id)}
                            className="flex items-center gap-3 cursor-pointer rounded-md my-1 px-3 py-2.5 font-bold border-2 border-transparent hover:border-foreground hover:shadow-[2px_2px_0px_0px] hover:shadow-foreground"
                          >
                            <div
                              className={cn(
                                "w-3 h-3 rounded border-2 border-foreground",
                                asset.color,
                              )}
                            />
                            <Plus size={16} strokeWidth={3} />
                            <span className="uppercase tracking-wide text-sm">
                              {asset.label}
                            </span>
                          </DropdownMenuItem>
                        ))}
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : item.url ? (
                  <NavbarTooltip
                    title={item.title}
                    isMobile={isMobile}
                    isVertical={isVertical}
                    effectivePosition={effectivePosition}
                  >
                    <Link href={item.url}>
                      <NavButtonContent
                        item={item}
                        active={isActive(item)}
                        isMobile={isMobile}
                        isVertical={isVertical}
                        effectivePosition={effectivePosition}
                      />
                    </Link>
                  </NavbarTooltip>
                ) : (
                  <NavbarTooltip
                    title={item.title}
                    isMobile={isMobile}
                    isVertical={isVertical}
                    effectivePosition={effectivePosition}
                  >
                    <button onClick={onOpenMessages} className="outline-none">
                      <NavButtonContent
                        item={item}
                        active={isActive(item)}
                        isMobile={isMobile}
                        isVertical={isVertical}
                        effectivePosition={effectivePosition}
                      />
                    </button>
                  </NavbarTooltip>
                )}
              </div>
            ))}
          </div>

          {/* Divider */}
          <div
            className={cn(
              isVertical ? "w-full h-0.5" : "w-0.5 h-full",
              "bg-foreground/15 rounded-full mx-1",
            )}
          />

          {/* User Avatar */}
          <div
            className={cn(
              isVertical ? "flex-col" : "flex-row",
              "flex gap-2 relative z-10 items-center justify-center",
            )}
          >
            <NavbarTooltip
              title={userData?.user?.name || "User"}
              isMobile={isMobile}
              isVertical={isVertical}
              effectivePosition={effectivePosition}
            >
              <motion.div
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.95 }}
                className="relative group cursor-pointer"
              >
                <Avatar
                  className={cn(
                    "h-9 w-9 border-2 border-foreground transition-all",
                    "shadow-[2px_2px_0px_0px] shadow-foreground group-hover:shadow-[3px_3px_0px_0px] group-hover:shadow-foreground",
                  )}
                >
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
                  <AvatarFallback className="bg-primary text-primary-foreground font-black text-xs">
                    {userData?.user?.name?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-chart-1 rounded-full border-2 border-foreground" />
              </motion.div>
            </NavbarTooltip>
          </div>

          {/* Position Controls + Collapse */}
          <motion.div
            className={cn(
              isVertical ? "flex-col" : "flex-row",
              "flex gap-1.5 relative z-10 items-center justify-center",
              isVertical
                ? "border-t-2 border-foreground/15 pt-2 mt-1"
                : "border-l-2 border-foreground/15 pl-2 ml-1",
            )}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {isVertical ? (
              <div className="grid grid-cols-2 gap-1.5 place-items-center w-[38px]">
                {(["top", "bottom", "left", "right"] as const).map((pos) => (
                  <Tooltip key={pos}>
                    <TooltipTrigger asChild>
                      <motion.button
                        onClick={() => onPositionChange(pos)}
                        aria-label={`Move navbar to ${pos}`}
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.85 }}
                        className={cn(
                          "w-4 h-4 rounded border-2 border-foreground transition-all duration-200",
                          position === pos
                            ? "bg-primary shadow-[2px_2px_0px_0px] shadow-foreground"
                            : "bg-muted hover:bg-muted-foreground/20",
                        )}
                      />
                    </TooltipTrigger>
                    <TooltipContent
                      side="right"
                      className="bg-foreground text-background border-2 border-foreground font-bold text-xs uppercase tracking-wider shadow-[2px_2px_0px_0px] shadow-foreground/50"
                    >
                      <p>Move to {pos}</p>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            ) : (
              (["top", "left", "bottom", "right"] as const).map((pos) => (
                <Tooltip key={pos}>
                  <TooltipTrigger asChild>
                    <motion.button
                      onClick={() => onPositionChange(pos)}
                      aria-label={`Move navbar to ${pos}`}
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.85 }}
                      className={cn(
                        "w-4 h-4 rounded border-2 border-foreground transition-all duration-200",
                        position === pos
                          ? "bg-primary shadow-[2px_2px_0px_0px] shadow-foreground"
                          : "bg-muted hover:bg-muted-foreground/20",
                      )}
                    />
                  </TooltipTrigger>
                  <TooltipContent
                    side="top"
                    className="bg-foreground text-background border-2 border-foreground font-bold text-xs uppercase tracking-wider shadow-[2px_2px_0px_0px] shadow-foreground/50"
                  >
                    <p>Move to {pos}</p>
                  </TooltipContent>
                </Tooltip>
              ))
            )}

            {/* Collapse → FAB */}
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.button
                  onClick={() => setIsCollapsed(true)}
                  aria-label="Minimize to quick action"
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.85 }}
                  className={cn(
                    "w-6 h-6 rounded border-2 border-foreground transition-all duration-200 flex items-center justify-center",
                    isVertical ? "mt-1" : "ml-1",
                    "bg-muted hover:bg-primary hover:text-primary-foreground text-muted-foreground",
                    "hover:shadow-[2px_2px_0px_0px] hover:shadow-foreground",
                  )}
                >
                  <PanelLeftClose size={12} strokeWidth={3} />
                </motion.button>
              </TooltipTrigger>
              <TooltipContent
                side={isVertical ? "right" : "top"}
                className="bg-foreground text-background border-2 border-foreground font-bold text-xs uppercase tracking-wider shadow-[2px_2px_0px_0px] shadow-foreground/50"
              >
                <p>Minimize</p>
              </TooltipContent>
            </Tooltip>
          </motion.div>
        </motion.div>
      </motion.div>
    </TooltipProvider>
  );
}
