import { useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, BarChart3, Grid3x3, Hand, Info } from "lucide-react";
import { AssetCard } from "@/components/tracker/AssetCard";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { AssetProps } from "./types";

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
};

const PADDING = 36;
const GAP_X = 20;
const STEP_Y = 220;

interface PortfolioCanvasProps {
  assets: AssetProps[];
  loading: boolean;
  onUpdate: (asset: AssetProps) => void;
  onAssetClick: (asset: AssetProps) => void;
}

export function PortfolioCanvas({ assets, loading, onUpdate, onAssetClick }: PortfolioCanvasProps) {
  const constraintsRef = useRef<HTMLDivElement>(null);
  const [columns, setColumns] = useState(2);

  useEffect(() => {
    const el = constraintsRef.current;
    if (!el) return;

    const compute = () => {
      const width = el.clientWidth || 0;
      const available = Math.max(0, width - PADDING * 2);
      const cols = Math.max(1, Math.floor((available + GAP_X) / (288 + GAP_X)));
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

  const canvasHeight = useMemo(() => {
    if (!assets || assets.length === 0) return 600;
    let maxY = 0;
    assets.forEach((asset: AssetProps, idx: number) => {
      const y = asset.position?.y != null
        ? asset.position.y
        : PADDING + Math.floor(idx / Math.max(1, columns)) * STEP_Y;
      if (y > maxY) maxY = y;
    });
    return Math.max(600, maxY + STEP_Y + PADDING);
  }, [assets, columns]);

  const heightClass = useMemo(() => {
    const steps = Object.keys(HEIGHT_CLASS_MAP).map(Number).sort((a, b) => a - b);
    const chosen = steps.find((s) => s >= canvasHeight) ?? steps[steps.length - 1];
    return HEIGHT_CLASS_MAP[chosen];
  }, [canvasHeight]);

  const showEmptyState = !loading && assets.length === 0;

  return (
    <Card className="relative overflow-hidden border border-border/70 bg-card/90 shadow-sm ring-1 ring-border/60">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(99,102,241,0.08),transparent_45%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(180deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:24px_24px]" />
      <div
        ref={constraintsRef}
        className={`relative ${heightClass} min-h-[540px] overflow-auto rounded-xl border border-border/40 bg-background/60 backdrop-blur`}
      >
        <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b border-border/50 bg-background/90 px-4 py-3 backdrop-blur-lg">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-[11px] text-primary ring-1 ring-primary/20">
              <BarChart3 className="h-3 w-3" />
              Portfolio Canvas
            </div>
            <p className="text-xs text-muted-foreground">
              Seret kartu untuk mengatur layout. Posisi tersimpan otomatis setelah Anda lepaskan.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1 rounded-full bg-secondary/70 px-3 py-1 text-secondary-foreground ring-1 ring-border/60">
              <Hand className="h-3 w-3" />
              Drag aktif
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-card px-3 py-1 ring-1 ring-border/60">
              <Grid3x3 className="h-3 w-3" /> Grid adaptif
            </span>
            <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-background px-3 py-1 ring-1 ring-border/60">
              <Info className="h-3 w-3" /> Klik kartu untuk detail
            </span>
          </div>
        </div>

        {loading && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/80 backdrop-blur-lg">
            <div className="flex w-full max-w-xl flex-col gap-3 px-6">
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
            asset={asset}
            onUpdate={onUpdate}
            onClick={onAssetClick}
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
              <AlertCircle size={48} className="mx-auto mb-3 text-primary" />
              <p className="text-base font-semibold text-foreground">Belum ada aset dalam kanvas</p>
              <p className="mt-2 text-sm">
                Tambahkan aset melalui menu Portfolio, lalu kembali untuk mengatur posisi visualnya di sini.
              </p>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
