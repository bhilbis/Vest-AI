import { ArrowUpRight, RefreshCw, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface DashboardHeaderProps {
  loading: boolean;
  onReload: () => void;
}

export function DashboardHeader({ loading, onReload }: DashboardHeaderProps) {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-border/70 bg-gradient-to-r from-primary/5 via-accent/8 to-background shadow-sm ring-1 ring-border/60">
      <div className="absolute inset-y-0 right-0 w-1/3 bg-[radial-gradient(circle_at_20%_20%,rgba(99,102,241,0.12),transparent_45%)]" />
      <div className="relative flex flex-col gap-4 px-5 py-5 lg:flex-row lg:items-center lg:justify-between lg:px-7 lg:py-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full bg-card/90 px-3 py-1 text-[11px] text-muted-foreground ring-1 ring-border/70">
            <Sparkles className="h-3 w-3 text-primary" />
            <span>Live portfolio • autosave</span>
          </div>
          <div className="space-y-1.5">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground lg:text-[26px]">
              Portfolio Tracker
            </h1>
            <p className="max-w-3xl text-sm text-muted-foreground">
              Layout kanvas yang rapi, drag & drop yang responsif, dan status sinkron real-time. Gunakan untuk memantau performa dan cepat menyesuaikan posisi.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="outline" className="rounded-full border-border/70 bg-background/80 px-2 py-1">
              Quick snapshot mode
            </Badge>
            <span className="rounded-full bg-secondary/70 px-2.5 py-1 text-secondary-foreground">Grid adaptif</span>
            <span className="rounded-full bg-card px-2.5 py-1 ring-1 ring-border/60">Posisi tersimpan otomatis</span>
          </div>
        </div>

        <div className="flex flex-col gap-2 rounded-xl bg-card/90 px-3 py-3 text-xs text-muted-foreground ring-1 ring-border/70 backdrop-blur lg:w-[280px]">
          <div className="flex items-center justify-between gap-2 text-[11px]">
            <span className="text-muted-foreground">Status</span>
            <div className="inline-flex items-center gap-2 rounded-full bg-background/80 px-3 py-1 ring-1 ring-border/60">
              {loading && <span className="h-2 w-2 animate-pulse rounded-full bg-primary" aria-hidden="true" />}<span>{loading ? "Memuat data" : "Terakhir sinkron"}</span>
            </div>
          </div>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-semibold">P</span>
              <div>
                <p className="text-[13px] text-foreground">Portfolio live</p>
                <p className="text-[11px] text-muted-foreground">Autosave aktif</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-1 text-xs"
              onClick={onReload}
            >
              <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
              Muat ulang
            </Button>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-secondary/70 px-3 py-2 text-[11px] text-secondary-foreground">
            <span className="flex items-center gap-1 font-medium text-foreground">View canvas</span>
            <ArrowUpRight className="h-4 w-4 text-foreground" />
          </div>
        </div>
      </div>
    </section>
  );
}
