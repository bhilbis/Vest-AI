import { StatsCards } from "@/components/tracker/Stats";

interface PortfolioStatsProps {
  totalValue: number;
  totalProfit: number;
  profitPercentage: number;
  dailyChangeValue: number;
  dailyChangePercent: number;
  aiTrades: number;
  aiTradesChange: number;
  successRate: number;
  successRateChange: number;
}

export function PortfolioStats(props: PortfolioStatsProps) {
  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/70 bg-card/90 px-3 py-3 text-xs text-muted-foreground ring-1 ring-border/60">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary font-semibold">R</span>
          <div>
            <p className="text-[13px] font-medium text-foreground">Ringkasan cepat</p>
            <p className="text-[11px] text-muted-foreground">Statistik bergerak sesuai perubahan posisi aset.</p>
          </div>
        </div>
        <span className="rounded-full bg-accent/20 px-3 py-1 text-[11px] text-accent-foreground ring-1 ring-accent/40">
          Diperbarui otomatis
        </span>
      </div>

      <StatsCards {...props} />
    </section>
  );
}
