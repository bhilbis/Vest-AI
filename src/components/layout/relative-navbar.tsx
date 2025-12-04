/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, ChevronDown, Receipt } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { assetTypes, NavbarItems } from '@/app/api/data';

interface NavbarProps {
  position: 'left' | 'right' | 'bottom' | 'top';
  onPositionChange: (position: 'left' | 'right' | 'bottom' | 'top') => void;
  userData: any;
  onOpenMessages: () => void;
  activeMessage?: boolean;
}

// Additional navbar items
const additionalItems = [
  {
    title: 'Financial',
    icon: Receipt, // Use existing icon or import Receipt
    url: '/financial-overview'
  },
];

// Custom hook for mobile detection
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // 768px = md breakpoint
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
}

export function Navbar({ position, onPositionChange, onOpenMessages, userData, activeMessage }: NavbarProps) {
  const pathname = usePathname();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const isMobile = useIsMobile();

  // Force bottom position on mobile
  const effectivePosition = isMobile ? 'bottom' : position;
  const isVertical = effectivePosition === 'left' || effectivePosition === 'right';
  const isDashboard = pathname === '/tracker';

  // Combine navbar items - only show Assets if on dashboard
  const allNavItems = useMemo(() => {
    if (isDashboard) {
      return [...NavbarItems, ...additionalItems];
    }
    return [...NavbarItems.filter(item => item.title !== 'Assets'), ...additionalItems];
  }, [isDashboard]);

  const containerClasses = useMemo(() => ({
    left: 'fixed left-4 top-1/2 -translate-y-1/2 flex-col h-auto',
    right: 'fixed right-4 top-1/2 -translate-y-1/2 flex-col h-auto',
    bottom: 'fixed left-1/2 -translate-x-1/2 flex-row w-auto',
    top: 'fixed left-1/2 -translate-x-1/2 top-3 flex-row h-fit',
  }), []);

  // Mobile-specific bottom positioning with safe area
  const mobileBottomClass = isMobile ? 'bottom-6' : 'bottom-4';

  const handleAddAsset = async (assetType: string) => {
    try {
      const newAssetData = {
        name: `New ${assetType}`,
        type: assetType,
        category: assetType,
        color: assetTypes.find(t => t.id === assetType)?.color || 'bg-gray-500',
        amount: 0,
        buyPrice: 0,
        coinId: null
      };

      const response = await fetch('/api/assets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newAssetData),
      });

      if (!response.ok) {
        throw new Error('Failed to create asset');
      }

      const createdAsset = await response.json();
      
      window.dispatchEvent(new CustomEvent('portfolioUpdate', { 
        detail: { action: 'add', asset: createdAsset } 
      }));
      
      setDropdownOpen(false);
      
    } catch (error) {
      console.error('Error adding asset:', error);
    }
  };

  const isActive = (item: any) => {
    if (item.title === "Messages") return activeMessage;
    if (item.url) {
      // Exact match for dashboard/tracker
      if (item.url === '/tracker') {
        return pathname === '/tracker';
      }
      // For other URLs, use startsWith
      return pathname.startsWith(item.url);
    }
    return false;
  };

  const NavButton = ({ item, children }: { item: any; children?: React.ReactNode }) => (
    <Tooltip>
      <TooltipTrigger asChild>
        <motion.div
          whileHover={{ 
            y: isVertical ? 0 : -2, 
            x: isVertical ? (effectivePosition === 'left' ? 2 : -2) : 0, 
            scale: 1.05 
          }}
          whileTap={{ scale: 0.95 }}
          className="relative"
        >
          {children}
        </motion.div>
      </TooltipTrigger>
      {isVertical && !isMobile && (
        <TooltipContent side={effectivePosition === 'left' ? 'right' : 'left'}>
          <p>{item.title}</p>
        </TooltipContent>
      )}
    </Tooltip>
  );

  return (
    <TooltipProvider delayDuration={200}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: isVertical ? 0 : 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className={`
          ${containerClasses[effectivePosition]} 
          ${mobileBottomClass}
          flex z-50
        `}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        <motion.div 
          className={`
            backdrop-blur-xl bg-linear-to-br from-white/25 to-white/10 dark:from-black/25 dark:to-black/10
            border border-white/30 dark:border-white/20 rounded-3xl shadow-2xl
            ${isVertical ? 'flex-col' : 'flex-row'}
            ${isMobile ? 'px-4 py-3' : 'p-2.5'}
            flex gap-1.5
            relative overflow-hidden
            max-w-[calc(100vw-2rem)]
          `}
          whileHover={{ boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)" }}
        >
          {/* Animated background linear */}
          <motion.div
            className="absolute inset-0 bg-linear-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 opacity-0"
            animate={{ opacity: isHovering ? 1 : 0 }}
            transition={{ duration: 0.5 }}
          />

          {/* Navigation Items */}
          <div className={`${isVertical ? 'flex-col' : 'flex-row'} flex gap-1.5 relative z-10`}>
            {allNavItems.map((item) => (
              <div key={`${item.title}-${item.url ?? "no-url"}`}>
                {item.title === "Assets" ? (
                  <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <DropdownMenuTrigger asChild>
                          <motion.button
                            whileHover={{ 
                              y: isVertical ? 0 : -2, 
                              x: isVertical ? (effectivePosition === 'left' ? 2 : -2) : 0, 
                              scale: 1.05 
                            }}
                            whileTap={{ scale: 0.95 }}
                            className={`
                              relative rounded-2xl transition-all duration-300
                              ${isMobile ? 'p-3' : 'p-2.5'}
                              ${dropdownOpen
                                ? 'bg-linear-to-br from-blue-500/30 to-purple-500/30 text-primary shadow-lg backdrop-blur-sm' 
                                : 'hover:bg-white/20 dark:hover:bg-white/10 text-muted-foreground hover:text-foreground'
                              }
                              group flex items-center gap-2
                            `}
                          >
                            <item.icon size={isMobile ? 22 : 20} strokeWidth={2.5} />
                            {!isVertical && !isMobile && (
                              <>
                                <span className="text-sm font-medium">{item.title}</span>
                                <motion.div
                                  animate={{ rotate: dropdownOpen ? 180 : 0 }}
                                  transition={{ duration: 0.2 }}
                                >
                                  <ChevronDown size={14} />
                                </motion.div>
                              </>
                            )}
                          </motion.button>
                        </DropdownMenuTrigger>
                      </TooltipTrigger>
                      {isVertical && !isMobile && (
                        <TooltipContent side={effectivePosition === 'left' ? 'right' : 'left'}>
                          <p>{item.title}</p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                    <DropdownMenuContent 
                      side={effectivePosition === 'bottom' ? 'top' : 'right'}
                      align="start"
                      className="backdrop-blur-xl bg-white/95 dark:bg-black/95 border-white/30 rounded-2xl shadow-2xl min-w-[200px]"
                    >
                      <div className="p-2">
                        <p className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          Add New Asset
                        </p>
                        {assetTypes.map((asset) => (
                          <DropdownMenuItem
                            key={asset.id}
                            onClick={() => handleAddAsset(asset.id)}
                            className="flex items-center gap-3 cursor-pointer rounded-xl my-1 px-3 py-2.5 hover:bg-linear-to-r hover:from-blue-500/10 hover:to-purple-500/10"
                          >
                            <div className={`w-2.5 h-2.5 rounded-full ${asset.color} shadow-sm`} />
                            <Plus size={16} strokeWidth={2.5} />
                            <span className="font-medium">{asset.label}</span>
                          </DropdownMenuItem>
                        ))}
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : item.url ? (
                  <NavButton item={item}>
                    <Link href={item.url}>
                      <motion.span
                        className={`
                          relative rounded-2xl transition-all duration-300
                          ${isMobile ? 'p-3' : 'p-2.5'}
                          ${isActive(item)
                            ? 'bg-linear-to-br from-blue-500/30 to-purple-500/30 text-primary shadow-lg backdrop-blur-sm' 
                            : 'hover:bg-white/20 dark:hover:bg-white/10 text-muted-foreground hover:text-foreground'
                          }
                          group flex items-center gap-2
                        `}
                      >
                        <item.icon size={isMobile ? 22 : 20} strokeWidth={2.5} />
                        {!isVertical && !isMobile && <span className="text-sm font-medium">{item.title}</span>}
                        
                        {/* Active indicator */}
                        <AnimatePresence>
                          {isActive(item) && (
                            <motion.div
                              layoutId="navbar-indicator"
                              className="absolute inset-0 rounded-2xl bg-linear-to-br from-blue-500/20 to-purple-500/20 -z-10"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.3 }}
                            />
                          )}
                        </AnimatePresence>
                      </motion.span>
                    </Link>
                  </NavButton>
                ) : (
                  <NavButton item={item}>
                    <motion.button
                      onClick={onOpenMessages}
                      className={`
                        relative rounded-2xl transition-all duration-300
                        ${isMobile ? 'p-3' : 'p-2.5'}
                        ${isActive(item)
                          ? "bg-linear-to-br from-blue-500/30 to-purple-500/30 text-primary shadow-lg backdrop-blur-sm"
                          : "hover:bg-white/20 dark:hover:bg-white/10 text-muted-foreground hover:text-foreground"
                        } 
                        group flex items-center gap-2
                      `}
                    >
                      <item.icon size={isMobile ? 22 : 20} strokeWidth={2.5} />
                      {!isVertical && !isMobile && <span className="text-sm font-medium">{item.title}</span>}
                      
                      <AnimatePresence>
                        {isActive(item) && (
                          <motion.div
                            layoutId="navbar-indicator"
                            className="absolute inset-0 rounded-2xl bg-linear-to-br from-blue-500/20 to-purple-500/20 -z-10"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                          />
                        )}
                      </AnimatePresence>
                    </motion.button>
                  </NavButton>
                )}
              </div>
            ))}
          </div>
          
          {/* Divider */}
          <motion.div 
            className={`${isVertical ? 'w-full h-px' : 'w-px h-full'} bg-linear-to-r from-transparent via-white/30 to-transparent`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          />
          
          {/* User Avatar */}
          <div className={`${isVertical ? 'flex-col' : 'flex-row'} flex gap-2 relative z-10`}>
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className="relative group cursor-pointer"
                >
                  <Avatar className={`
                    ${isMobile ? 'h-11 w-11' : 'h-10 w-10'}
                    border-2 border-white/30 shadow-lg ring-2 ring-white/10 transition-all group-hover:ring-white/30
                  `}>
                    {userData?.user?.image && (
                      <AvatarImage asChild>
                        <Image 
                          src={userData.user.image} 
                          alt={userData.user.name || 'User'} 
                          width={44}
                          height={44}
                          className="object-cover"
                        />
                      </AvatarImage>
                    )}
                    <AvatarFallback className="bg-linear-to-br from-blue-500 to-purple-500 text-white font-semibold">
                      {userData?.user?.name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  
                  {/* Online indicator */}
                  <motion.div 
                    className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-black"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.5, type: "spring" }}
                  />
                </motion.div>
              </TooltipTrigger>
              <TooltipContent side={isVertical ? (effectivePosition === 'left' ? 'right' : 'left') : 'top'}>
                <p className="font-medium">{userData?.user?.name || 'User'}</p>
                <p className="text-xs text-muted-foreground">{userData?.user?.email || ''}</p>
              </TooltipContent>
            </Tooltip>
          </div>
          
          {/* Position Controls - Hidden on Mobile */}
          {!isMobile && (
            <motion.div 
              className={`${isVertical ? 'flex-col' : 'flex-row'} flex gap-1 mt-1.5 pt-1.5 border-t border-white/20 relative z-10`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {(['top','left', 'bottom', 'right'] as const).map((pos) => (
                <Tooltip key={pos}>
                  <TooltipTrigger asChild>
                    <motion.button
                      onClick={() => onPositionChange(pos)}
                      aria-label={`Move navbar to ${pos}`}
                      whileHover={{ scale: 1.15 }}
                      whileTap={{ scale: 0.9 }}
                      className={`
                        w-5 h-5 rounded-lg border-2 transition-all duration-300
                        ${position === pos 
                          ? 'bg-linear-to-br from-blue-500/50 to-purple-500/50 border-blue-400/60 shadow-lg shadow-blue-500/20' 
                          : 'bg-white/10 dark:bg-white/5 border-white/20 hover:bg-white/20 hover:border-white/30'
                        }
                      `}
                    />
                  </TooltipTrigger>
                  <TooltipContent side={isVertical ? 'right' : 'top'}>
                    <p className="capitalize">Move to {pos}</p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </TooltipProvider>
  );
}