/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
// import { TrackerForm } from "@/components/tracker/Form"
// import { TrackerTable } from "@/components/tracker/Table"
// import { AIResponse } from "@/components/tracker/AIResponse"
import { StatsCards } from "@/components/tracker/Stats"
import { AlertCircle, BarChart3, RefreshCw } from "lucide-react"
import { AssetDetailModal } from "@/components/tracker/AssetModal"
import { AssetCard } from "@/components/tracker/AssetCard"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

export interface AssetProps {
  id: string;
  type: string;
  name: string;
  category: string;
  color: string;
  position?: { x: number; y: number } | null;
  lots: number;
  buyPrice: number;
  currentPrice: number;
  value?: number;
  profit?: number;
  coinId?: string;
}

// Peta kelas tinggi yang aman untuk Tailwind (agar tidak perlu inline style)
const HEIGHT_CLASS_MAP: Record<number, string> = {
  600: "h-[600px]",
  800: "h-[800px]",
  1000: "h-[1000px]",
  1200: "h-[1200px]",
  1400: "h-[1400px]",
  1600: "h-[1600px]",
  1800: "h-[1800px]",
  2000: "h-[2000px]",
  2400: "h-[2400px]",
  2800: "h-[2800px]",
  3200: "h-[3200px]",
}

interface UsePortfolioAssetsResult {
  assets: AssetProps[];
  loading: boolean;
  error: string | null;
  reload: () => void;
  setAssets: React.Dispatch<React.SetStateAction<AssetProps[]>>;
}

function usePortfolioAssets(): UsePortfolioAssetsResult {
  const [assets, setAssets] = useState<AssetProps[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const loadAssets = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const res = await fetch("/api/assets")
      if (!res.ok) {
        throw new Error("Gagal memuat data aset")
      }

      const data = await res.json()

      const formattedAssets: AssetProps[] = data.map((asset: any) => ({
        ...asset,
        position:
          asset.positionX != null && asset.positionY != null
            ? { x: asset.positionX, y: asset.positionY }
            : null,
        lots: asset.amount,
        currentPrice: 0,
      }))

      const coinIds = Array.from(
        new Set(formattedAssets.map((a: any) => a.coinId).filter(Boolean))
      ) as string[]

      if (coinIds.length > 0) {
        try {
          const priceRes = await fetch("/api/route", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ coinIds }),
          })

          if (!priceRes.ok) throw new Error("Gagal ambil harga CoinGecko")

          const priceData = await priceRes.json()

          formattedAssets.forEach((asset: AssetProps) => {
            if (asset.coinId && priceData[asset.coinId]) {
              asset.currentPrice = priceData[asset.coinId].idr
            }
          })
        } catch (err) {
          console.error("Gagal ambil harga:", err)
        }
      }

      setAssets(formattedAssets)
    } catch (err) {
      console.error("Error fetching assets:", err)
      setError("Terjadi kesalahan saat memuat portfolio. Coba lagi.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadAssets()
  }, [loadAssets])

  useEffect(() => {
    const handlePortfolioUpdate = () => {
      void loadAssets()
    }

    window.addEventListener("portfolioUpdate", handlePortfolioUpdate)
    return () => window.removeEventListener("portfolioUpdate", handlePortfolioUpdate)
  }, [loadAssets])

  return {
    assets,
    loading,
    error,
    reload: loadAssets,
    setAssets,
  }
}

export default function TrackerPage() {
  const { assets, setAssets, loading, error, reload } = usePortfolioAssets()
  const [selectedAsset, setSelectedAsset] = useState<AssetProps | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const constraintsRef = useRef<HTMLDivElement>(null);
  const [columns, setColumns] = useState(2);

  // Layout constants
  const PADDING = 36; // jarak dari atas/kiri/kanan/bawah
  const GAP_X = 20;   // jarak antar kolom
  const STEP_Y = 220; // jarak baris (kartu + gap)
  const CARD_WIDTH = 288; // w-72

  // Responsive columns based on container width
  useEffect(() => {
    const el = constraintsRef.current;
    if (!el) return;

    const compute = () => {
      const width = el.clientWidth || 0;
      const available = Math.max(0, width - PADDING * 2);
      const cols = Math.max(1, Math.floor((available + GAP_X) / (CARD_WIDTH + GAP_X)));
      setColumns(cols);
    };

    compute();
    const ro = new ResizeObserver(() => compute());
    ro.observe(el);
    window.addEventListener("resize", compute);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", compute);
    };
  }, []);

  const handleRemoveAsset = async (id: string) => {
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

      setAssets(prev => prev.filter(asset => asset.id !== id));
    } catch (error) {
      console.error("Terjadi kesalahan saat menghapus aset:", error);
      alert("Terjadi kesalahan saat menghapus aset.");
    }
  };

  const handleUpdate = async (updatedAsset: AssetProps) => {
    try {
      const response = await fetch(`/api/assets/${updatedAsset.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
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
        // Update state lokal
        setAssets(prev => prev.map(a => a.id === updatedAsset.id ? { ...a, ...updatedAsset } : a));
      }
    } catch (error) {
      console.error('Error updating asset:', error);
    }
  };


  const handleAssetClick = (asset: AssetProps) => {
    setSelectedAsset(asset);
    setIsDetailModalOpen(true);
  };

  // Hitung tinggi canvas dinamis berdasarkan posisi aset atau fallback grid
  const canvasHeight = useMemo(() => {
    if (!assets || assets.length === 0) return 600;
    let maxY = 0;
    assets.forEach((asset: any, idx: number) => {
      const y = (asset?.position?.y != null)
        ? asset.position.y
        : PADDING + Math.floor(idx / Math.max(1, columns)) * STEP_Y;
      if (y > maxY) maxY = y;
    });
    // Tambah satu step tinggi + padding bawah
    return Math.max(600, maxY + STEP_Y + PADDING);
  }, [assets, columns]);

  const heightClass = useMemo(() => {
    const steps = Object.keys(HEIGHT_CLASS_MAP).map(Number).sort((a, b) => a - b);
    const chosen = steps.find((s) => s >= canvasHeight) ?? steps[steps.length - 1];
    return HEIGHT_CLASS_MAP[chosen];
  }, [canvasHeight]);

  const { totalValue, totalProfit, profitPercentage } = useMemo(() => {
    if (!assets || assets.length === 0) {
      return {
        totalValue: 0,
        totalProfit: 0,
        profitPercentage: 0,
      };
    }

    const totalValueCalc = assets.reduce(
      (sum, a: any) => sum + (a.value ?? a.lots * (a.currentPrice ?? 0)),
      0
    );
    const totalProfitCalc = assets.reduce(
      (sum, a: any) =>
        sum +
        (a.profit ?? (a.lots ?? 0) * ((a.currentPrice ?? 0) - (a.buyPrice ?? 0))),
      0
    );

    const pct = totalValueCalc > 0 ? (totalProfitCalc / totalValueCalc) * 100 : 0;

    return {
      totalValue: totalValueCalc,
      totalProfit: totalProfitCalc,
      profitPercentage: pct,
    };
  }, [assets]);

  const showEmptyState = !loading && !error && assets.length === 0;

  return (
    <div className="space-y-6 w-full py-4 lg:py-8 px-4 lg:px-10">
      <section className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight lg:text-2xl">
            Portfolio Tracker
          </h1>
          <p className="mt-1 text-sm text-muted-foreground max-w-xl">
            Pantau nilai portfolio, profit &amp; loss, dan susun layout aset Anda
            secara visual di kanvas interaktif.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start lg:self-auto">
          {loading && (
            <span className="text-xs text-muted-foreground">
              Memuat portfolio...
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            className="gap-1 text-xs"
            onClick={reload}
          >
            <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
            Muat ulang
          </Button>
        </div>
      </section>

      <StatsCards 
        totalValue={totalValue}
        totalProfit={totalProfit}
        profitPercentage={profitPercentage}
        dailyChangeValue={1000000} // TODO: ambil dari API harga harian
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

      <Card className="relative overflow-hidden border-dashed border-border/60 bg-accent/10">
        <div 
          ref={constraintsRef}
          className={`relative ${heightClass} min-h-[480px] overflow-auto rounded-xl bg-linear-to-b from-background/60 via-accent/20 to-background/80`}
        >
          <div className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b border-border/40 bg-background/80 px-4 py-3 backdrop-blur-sm">
            <div>
              <p className="text-sm font-medium">Portfolio Canvas</p>
              <p className="text-xs text-muted-foreground">
                Drag &amp; drop kartu aset untuk mengatur layout sesuai gaya analisis Anda.
              </p>
            </div>
            <div className="hidden items-center gap-2 text-xs text-muted-foreground sm:flex">
              <span className="inline-flex h-2 w-2 rounded-full bg-primary/70" />
              <span>Posisi tersimpan otomatis saat kartu dipindahkan.</span>
            </div>
          </div>

          {loading && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/60 backdrop-blur-sm">
              <div className="flex w-full max-w-md flex-col gap-3 px-6">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <BarChart3 className="h-4 w-4 animate-pulse" />
                  <span>Menyiapkan kanvas portfolio Anda...</span>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {[1, 2, 3, 4].map((key) => (
                    <Skeleton key={key} className="h-40 rounded-xl" />
                  ))}
                </div>
              </div>
            </div>
          )}

          {assets.map((asset: AssetProps, index: number) => (
            <AssetCard
              key={asset.id}
              index={index}
              asset={asset as AssetProps}
              onUpdate={handleUpdate}
              onClick={handleAssetClick}
              constraints={constraintsRef}
              columns={columns}
              padding={PADDING}
              gapX={GAP_X}
              stepY={STEP_Y}
            />
          ))}

          {showEmptyState && (
            <div className="absolute inset-0 flex items-center justify-center px-4">
              <div className="max-w-sm text-center text-muted-foreground">
                <BarChart3 size={64} className="mx-auto mb-4 opacity-50" />
                <p className="text-base font-medium">
                  Belum ada aset dalam portfolio
                </p>
                <p className="mt-2 text-sm">
                  Klik <span className="font-semibold">“Portfolio”</span> di navbar untuk menambahkan aset pertama Anda, lalu atur posisinya di kanvas ini.
                </p>
              </div>
            </div>
          )}
        </div>
      </Card>

      <AssetDetailModal
        asset={selectedAsset as AssetProps}
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedAsset(null);
        }}
        onUpdate={handleUpdate}
        onDelete={handleRemoveAsset}
      />
      
      {/* <TrackerForm onAdd={(a) => {
        setAssets((prev) => {
          const exists = prev.some(item => item.id === a.id)
          return exists ? prev : [...prev, a]
        })
      }} />
      
      <TrackerTable 
        data={assets}
        onRemove={handleRemoveAsset}
      />
      
      <AIResponse assets={assets} /> */}
    </div>
  )
}