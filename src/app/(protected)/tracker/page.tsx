/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useEffect, useMemo, useRef, useState } from "react"
// import { TrackerForm } from "@/components/tracker/Form"
// import { TrackerTable } from "@/components/tracker/Table"
// import { AIResponse } from "@/components/tracker/AIResponse"
import { StatsCards } from "@/components/tracker/Stats"
import { BarChart3 } from "lucide-react"
import { AssetDetailModal } from "@/components/tracker/AssetModal"
import { AssetCard } from "@/components/tracker/AssetCard"

interface Asset {
  id: string;
  type: string;
  name: string;
  category: string;
  color: string;
  position: { x: number; y: number };
  lots: number;
  buyPrice: number;
  currentPrice: number;
}

// Peta kelas tinggi yang aman untuk Tailwind (agar tidak perlu inline style)
const HEIGHT_CLASS_MAP: Record<number, string> = {
  600: 'h-[600px]',
  800: 'h-[800px]',
  1000: 'h-[1000px]',
  1200: 'h-[1200px]',
  1400: 'h-[1400px]',
  1600: 'h-[1600px]',
  1800: 'h-[1800px]',
  2000: 'h-[2000px]',
  2400: 'h-[2400px]',
  2800: 'h-[2800px]',
  3200: 'h-[3200px]',
}

export default function TrackerPage() {
  const [assets, setAssets] = useState<any[]>([])
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
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
    window.addEventListener('resize', compute);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', compute);
    };
  }, []);

  useEffect(() => {
    fetch("/api/assets")
    .then(res => res.json())
    .then(async (data) => {
      const formattedAssets = data.map((asset: any) => ({
        ...asset,
        position: (asset.positionX != null && asset.positionY != null)
          ? { x: asset.positionX, y: asset.positionY }
          : null,
        lots: asset.amount, // mapping amount ke lots
        currentPrice: 0 // akan diupdate dari API harga
      }));
      const coinIds = Array.from(
        new Set(formattedAssets.map((a: any) => a.coinId).filter(Boolean))
      ) as string[];

      if (coinIds.length > 0) {
        try {
          const priceRes = await fetch("/api/route", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ coinIds }),
          });

          if (!priceRes.ok) throw new Error("Gagal ambil harga CoinGecko");

          const priceData = await priceRes.json();

          // Masukkan harga ke tiap asset
          formattedAssets.forEach((asset: any) => {
            if (asset.coinId && priceData[asset.coinId]) {
              asset.currentPrice = priceData[asset.coinId].idr;
            }
          });
        } catch (err) {
          console.error("Gagal ambil harga:", err);
        }
      }

      setAssets(formattedAssets);
    })
    .catch(error => {
      console.error('Error fetching assets:', error);
    });

    // Listen untuk update dari navbar
    const handlePortfolioUpdate = () => {
      // Refresh data dari backend
      fetch("/api/assets")
        .then(res => res.json())
        .then(data => {
          const formattedAssets = data.map((asset: any) => ({
            ...asset,
            position: (asset.positionX != null && asset.positionY != null)
              ? { x: asset.positionX, y: asset.positionY }
              : null,
            lots: asset.amount,
            currentPrice: 0
          }));
          setAssets(formattedAssets);
        });
    };

    window.addEventListener('portfolioUpdate', handlePortfolioUpdate);
    return () => window.removeEventListener('portfolioUpdate', handlePortfolioUpdate);
  }, [])

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

  const handleUpdate = async (updatedAsset: Asset) => {
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
        setAssets(prev => prev.map(a => a.id === updatedAsset.id ? updatedAsset : a));
      }
    } catch (error) {
      console.error('Error updating asset:', error);
    }
  };


  const handleAssetClick = (asset: Asset) => {
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

  return (
    <div className="space-y-8 w-full  py-2 lg:py-8 px:5 lg:px-10">
      <StatsCards 
        totalValue={assets.reduce((sum, a) => sum + (a.value || 0), 0)}
        totalProfit={assets.reduce((sum, a) => sum + (a.profit || 0), 0)}
        profitPercentage={
          assets.length > 0 
            ? (assets.reduce((sum, a) => sum + (a.profit || 0), 0) / assets.reduce((sum, a) => sum + (a.value || 0), 0)) * 100 
            : 0
        }
        dailyChangeValue={1000000} // hitung dari API harga harian
        dailyChangePercent={2.5} // hitung dari API harga harian
        aiTrades={47} // ini bisa dari API
        aiTradesChange={15} // ini juga dari API
        successRate={78.2} // %
        successRateChange={2.1}
      />

      <div 
        ref={constraintsRef}
        className={`relative min-h-[600px] bg-accent/20 rounded-xl border-2 border-dashed border-border/50 overflow-auto ${heightClass}`}
      >
        <div className="absolute top-4 left-4 text-sm text-muted-foreground">
          Portfolio Canvas - Drag cards sesuai keinginan Anda
        </div>
        
        {assets.map((asset, index) => (
          <AssetCard
            key={asset.id}
            index={index}
            asset={asset}
            onUpdate={handleUpdate}
            onClick={handleAssetClick}
            constraints={constraintsRef}
            columns={columns}
            padding={PADDING}
            gapX={GAP_X}
            stepY={STEP_Y}
          />
        ))}

        {assets.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <BarChart3 size={64} className="mx-auto mb-4 opacity-50" />
              <p>Belum ada asset dalam portfolio</p>
              <p className="text-sm mt-2">Klik &dlquo;Portfolio&dlquo; di navbar untuk menambahkan asset</p>
            </div>
          </div>
        )}
      </div>

      <AssetDetailModal
        asset={selectedAsset}
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