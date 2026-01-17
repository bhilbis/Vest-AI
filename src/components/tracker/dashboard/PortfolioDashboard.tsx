"use client";

import { useCallback, useMemo, useState } from "react";
import { AlertCircle } from "lucide-react";
import { AssetDetailModal } from "@/components/tracker/AssetModal";
import { Card } from "@/components/ui/card";
import { DashboardHeader } from "./DashboardHeader";
import { PortfolioCanvas } from "./PortfolioCanvas";
import { PortfolioStats } from "./PortfolioStats";
import { usePortfolioAssets } from "./usePortfolioAssets";
import type { AssetProps } from "./types";

export function PortfolioDashboard() {
  const { assets, setAssets, loading, error, reload } = usePortfolioAssets();
  const [selectedAsset, setSelectedAsset] = useState<AssetProps | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const handleRemoveAsset = useCallback(async (id: string) => {
    const confirmed = confirm("Apakah Anda yakin ingin menghapus aset ini?");
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/assets/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        console.error("Gagal menghapus aset:", error);
        alert(`Gagal menghapus: ${error.error}`);
        return;
      }

      setAssets((prev) => prev.filter((asset) => asset.id !== id));
    } catch (err) {
      console.error("Terjadi kesalahan saat menghapus aset:", err);
      alert("Terjadi kesalahan saat menghapus aset.");
    }
  }, [setAssets]);

  const handleUpdate = useCallback(async (updatedAsset: AssetProps) => {
    try {
      const response = await fetch(`/api/assets/${updatedAsset.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: updatedAsset.name,
          amount: updatedAsset.lots,
          buyPrice: updatedAsset.buyPrice,
          type: updatedAsset.type,
          category: updatedAsset.category,
          color: updatedAsset.color,
          positionX: updatedAsset.position?.x ?? null,
          positionY: updatedAsset.position?.y ?? null,
        }),
      });

      if (response.ok) {
        setAssets((prev) => prev.map((asset) => asset.id === updatedAsset.id ? { ...asset, ...updatedAsset } : asset));
      }
    } catch (err) {
      console.error("Error updating asset:", err);
    }
  }, [setAssets]);

  const handleAssetClick = useCallback((asset: AssetProps) => {
    setSelectedAsset(asset);
    setIsDetailModalOpen(true);
  }, []);

  const handleModalClose = useCallback(() => {
    setIsDetailModalOpen(false);
    setSelectedAsset(null);
  }, []);

  const { totalValue, totalProfit, profitPercentage } = useMemo(() => {
    if (!assets || assets.length === 0) {
      return {
        totalValue: 0,
        totalProfit: 0,
        profitPercentage: 0,
      };
    }

    const totalValueCalc = assets.reduce(
      (sum, asset) => sum + (asset.value ?? asset.lots * (asset.currentPrice ?? 0)),
      0
    );
    const totalProfitCalc = assets.reduce(
      (sum, asset) =>
        sum + (asset.profit ?? (asset.lots ?? 0) * ((asset.currentPrice ?? 0) - (asset.buyPrice ?? 0))),
      0
    );

    const pct = totalValueCalc > 0 ? (totalProfitCalc / totalValueCalc) * 100 : 0;

    return {
      totalValue: totalValueCalc,
      totalProfit: totalProfitCalc,
      profitPercentage: pct,
    };
  }, [assets]);

  return (
    <div className="w-full space-y-8 px-4 py-4 lg:px-10 lg:py-8">
      <DashboardHeader loading={loading} onReload={reload} />

      <PortfolioStats
        totalValue={totalValue}
        totalProfit={totalProfit}
        profitPercentage={profitPercentage}
        dailyChangeValue={1000000}
        dailyChangePercent={2.5}
        aiTrades={47}
        aiTradesChange={15}
        successRate={78.2}
        successRateChange={2.1}
      />

      {error && (
        <Card className="border-destructive/40 bg-destructive/5">
          <div className="flex items-start gap-3 p-4">
            <AlertCircle className="mt-0.5 h-4 w-4 text-destructive" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-destructive">
                Gagal memuat portfolio
              </p>
              <p className="text-xs text-muted-foreground">
                {error} Jika masalah berlanjut, coba refresh halaman atau cek koneksi internet Anda.
              </p>
            </div>
          </div>
        </Card>
      )}

      <PortfolioCanvas
        assets={assets}
        loading={loading}
        onUpdate={handleUpdate}
        onAssetClick={handleAssetClick}
      />

      <AssetDetailModal
        asset={selectedAsset as AssetProps}
        isOpen={isDetailModalOpen}
        onClose={handleModalClose}
        onUpdate={handleUpdate}
        onDelete={handleRemoveAsset}
      />
    </div>
  );
}
