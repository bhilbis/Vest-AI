"use client";

import { useMemo } from "react";
import { motion } from "motion/react";
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  PieChart, 
  ArrowUpRight, 
  ArrowDownRight,
  Plus,
  MoreHorizontal
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import type { AssetProps } from "./types";

interface BentoDashboardProps {
  assets: AssetProps[];
  loading: boolean;
  onAddAsset?: () => void;
  onAssetClick?: (asset: AssetProps) => void;
}

export function BentoDashboard({ assets, loading, onAddAsset, onAssetClick }: BentoDashboardProps) {
  // Calculate Stats
  const stats = useMemo(() => {
    if (!assets.length) return {
        totalValue: 0,
        totalProfit: 0,
        profitPercentage: 0,
        topAssets: [],
        categories: []
    };

    const totalValue = assets.reduce((sum, asset) => sum + (asset.value ?? asset.lots * (asset.currentPrice ?? 0)), 0);
    const totalCost = assets.reduce((sum, asset) => sum + (asset.lots * (asset.buyPrice ?? 0)), 0);
    const totalProfit = totalValue - totalCost;
    const profitPercentage = totalCost > 0 ? (totalProfit / totalCost) * 100 : 0;

    // Sort assets by value for top list
    const sortedAssets = [...assets].sort((a, b) => {
        const valA = a.value ?? a.lots * (a.currentPrice ?? 0);
        const valB = b.value ?? b.lots * (b.currentPrice ?? 0);
        return valB - valA;
    });

    // Group by category
    const categoryMap = assets.reduce((acc, asset) => {
        const val = asset.value ?? asset.lots * (asset.currentPrice ?? 0);
        acc[asset.category] = (acc[asset.category] || 0) + val;
        return acc;
    }, {} as Record<string, number>);

    const categories = Object.entries(categoryMap)
        .map(([name, value]) => ({ name, value, percentage: (value / totalValue) * 100 }))
        .sort((a, b) => b.value - a.value);

    return {
        totalValue,
        totalProfit,
        profitPercentage,
        topAssets: sortedAssets.slice(0, 5),
        categories
    };
  }, [assets]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
  };

  if (loading) {
      return (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 h-full">
              {[...Array(4)].map((_, i) => (
                  <Card key={i} className="bg-muted/50 animate-pulse border-border/50 h-48" />
              ))}
          </div>
      );
  }

  return (
    <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 h-full overflow-y-auto"
    >
      {/* 1. Total Balance Card (Large) */}
      <motion.div variants={item} className="md:col-span-8 md:row-span-2 min-h-[300px]">
        <Card className="h-full relative overflow-hidden border-border/50 bg-card">
            <div className="absolute top-0 right-0 p-32 bg-primary/5 blur-3xl rounded-full -mr-16 -mt-16 pointer-events-none" />
            
            <div className="p-6 md:p-8 flex flex-col justify-between h-full relative z-10">
                <div>
                    <h3 className="text-muted-foreground font-medium mb-2 flex items-center gap-2">
                        <Wallet className="w-4 h-4" /> Total Portfolio Value
                    </h3>
                    <div className="flex items-baseline gap-4 flex-wrap">
                        <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground">
                            {formatCurrency(stats.totalValue)}
                        </h1>
                        <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-sm font-medium ${stats.totalProfit >= 0 ? 'bg-green-500/10 text-green-500' : 'bg-destructive/10 text-destructive'}`}>
                            {stats.totalProfit >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                            <span>{stats.profitPercentage.toFixed(2)}%</span>
                        </div>
                    </div>
                    <p className={`mt-2 text-sm ${stats.totalProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-destructive'}`}>
                        {stats.totalProfit >= 0 ? '+' : ''}{formatCurrency(stats.totalProfit)} P/L All Time
                    </p>
                </div>

                {/* Mini Chart Area */}
                <div className="mt-8 h-32 flex items-end gap-2 opacity-80">
                    {stats.categories.map((cat, idx) => (
                        <div key={idx} className="flex-1 flex flex-col justify-end gap-2 group cursor-pointer">
                             <div 
                                className="w-full bg-primary/20 rounded-t-md transition-all group-hover:bg-primary/40 relative"
                                style={{ height: `${Math.max(10, cat.percentage)}%` }}
                             >
                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-popover text-popover-foreground border border-border px-2 py-1 rounded text-xs whitespace-nowrap z-20 shadow-md">
                                    {cat.name}: {cat.percentage.toFixed(1)}%
                                </div>
                             </div>
                        </div>
                    ))}
                </div>
            </div>
        </Card>
      </motion.div>

      {/* 2. Asset Allocation (Pie-ish) */}
      <motion.div variants={item} className="md:col-span-4 md:row-span-2 min-h-[300px]">
        <Card className="h-full border-border/50 p-6 flex flex-col bg-card text-card-foreground">
            <h3 className="font-semibold flex items-center gap-2 mb-6 text-foreground">
                <PieChart className="w-4 h-4 text-muted-foreground" /> Asset Allocation
            </h3>
            <div className="space-y-6 flex-1 overflow-y-auto pr-2">
                {stats.categories.map((cat, idx) => (
                    <div key={idx} className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="font-medium text-foreground">{cat.name}</span>
                            <span className="text-muted-foreground">{cat.percentage.toFixed(1)}%</span>
                        </div>
                        <Progress value={cat.percentage} className="h-2" />
                        <p className="text-xs text-muted-foreground text-right">{formatCurrency(cat.value)}</p>
                    </div>
                ))}
                {stats.categories.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm">
                        <PieChart className="w-8 h-8 mb-2 opacity-20" />
                        No assets to display
                    </div>
                )}
            </div>
        </Card>
      </motion.div>

      {/* 3. Top Assets List */}
      <motion.div variants={item} className="md:col-span-7 md:row-span-3 min-h-[300px]">
        <Card className="h-full border-border/50 flex flex-col bg-card">
            <div className="p-6 border-b border-border/50 flex justify-between items-center">
                <h3 className="font-semibold text-foreground">Top Assets</h3>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground">
                    <MoreHorizontal className="w-4 h-4" />
                </Button>
            </div>
            <ScrollArea className="flex-1">
                <div className="divide-y divide-border/30">
                    {stats.topAssets.map((asset) => {
                        const val = asset.value ?? asset.lots * (asset.currentPrice ?? 0);
                        const cost = asset.lots * (asset.buyPrice ?? 0);
                        const profit = val - cost;
                        const profitPct = cost > 0 ? (profit / cost) * 100 : 0;
                        const isProfitable = profit >= 0;

                        return (
                            <div 
                                key={asset.id} 
                                className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors group cursor-pointer"
                                onClick={() => onAssetClick?.(asset)}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${asset.color || 'bg-muted'} bg-opacity-10 text-xs font-bold text-foreground`}>
                                        {asset.name.substring(0, 2).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="font-medium text-sm text-foreground">{asset.name}</p>
                                        <p className="text-xs text-muted-foreground">{asset.lots} Lots • {asset.category}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-medium text-sm text-foreground">{formatCurrency(val)}</p>
                                    <p className={`text-xs flex items-center justify-end gap-1 ${isProfitable ? 'text-green-500' : 'text-destructive'}`}>
                                        {isProfitable ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                        {Math.abs(profitPct).toFixed(2)}%
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                    {stats.topAssets.length === 0 && (
                        <div className="p-8 text-center text-muted-foreground text-sm">
                            No assets found. Start adding some!
                        </div>
                    )}
                </div>
            </ScrollArea>
        </Card>
      </motion.div>

      {/* 4. Quick Actions / Small Stats */}
      <motion.div variants={item} className="md:col-span-5 md:row-span-3 grid grid-rows-3 gap-4 min-h-[300px]">
          {/* Action Card */}
          <Card className="row-span-1 border-border/50 p-6 flex items-center justify-between bg-card hover:bg-accent/50 transition-colors cursor-pointer group" onClick={onAddAsset}>
              <div>
                  <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">Add New Asset</h3>
                  <p className="text-xs text-muted-foreground">Record a new investment position</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <Plus className="w-6 h-6" />
              </div>
          </Card>

          {/* AI Insight Placeholder */}
          <Card className="row-span-2 border-border/50 p-6 relative overflow-hidden bg-card">
              <div className="absolute inset-0 bg-linear-to-br from-purple-500/5 to-blue-500/5" />
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                    <div className="h-2 w-2 rounded-full bg-purple-500 animate-pulse" />
                    <h3 className="text-sm font-medium text-foreground">AI Insights</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                    Portfolio diversification looks good. Consider increasing exposure to low-risk assets to balance the volatility in your crypto holdings.
                </p>
                <div className="mt-4 pt-4 border-t border-border/30">
                     <p className="text-xs text-muted-foreground">Updated just now</p>
                </div>
              </div>
          </Card>
      </motion.div>
    </motion.div>
  );
}
