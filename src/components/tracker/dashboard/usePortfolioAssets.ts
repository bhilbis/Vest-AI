/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useState } from "react";
import type { AssetProps, UsePortfolioAssetsResult } from "./types";

export function usePortfolioAssets(): UsePortfolioAssetsResult {
  const [assets, setAssets] = useState<AssetProps[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadAssets = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch("/api/assets");
      if (!res.ok) {
        throw new Error("Gagal memuat data aset");
      }

      const data = await res.json();

      const formattedAssets: AssetProps[] = data.map((asset: any) => ({
        ...asset,
        position:
          asset.positionX != null && asset.positionY != null
            ? { x: asset.positionX, y: asset.positionY }
            : null,
        lots: asset.amount,
        currentPrice: 0,
      }));

      const coinIds = Array.from(
        new Set(formattedAssets.map((a: any) => a.coinId).filter(Boolean))
      ) as string[];

      if (coinIds.length > 0) {
        try {
          const priceRes = await fetch("/api/price", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ coinIds }),
          });

          if (!priceRes.ok) throw new Error("Gagal ambil harga CoinGecko");

          const priceData = await priceRes.json();

          formattedAssets.forEach((asset: AssetProps) => {
            if (asset.coinId && priceData[asset.coinId]) {
              asset.currentPrice = priceData[asset.coinId].idr;
            }
          });
        } catch (err) {
          console.error("Gagal ambil harga:", err);
        }
      }

      setAssets(formattedAssets);
    } catch (err) {
      console.error("Error fetching assets:", err);
      setError("Terjadi kesalahan saat memuat portfolio. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAssets();
  }, [loadAssets]);

  useEffect(() => {
    const handlePortfolioUpdate = () => {
      void loadAssets();
    };

    window.addEventListener("portfolioUpdate", handlePortfolioUpdate);
    return () => window.removeEventListener("portfolioUpdate", handlePortfolioUpdate);
  }, [loadAssets]);

  return {
    assets,
    loading,
    error,
    reload: loadAssets,
    setAssets,
  };
}
