import { type ComponentType } from "react";
import {
  Activity,
  ArrowUpIcon,
  BitcoinIcon,
  DollarSignIcon,
  LineChartIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

type StatCard = {
  title: string;
  value: string;
  delta: string;
  deltaLabel: string;
  tone: "positive" | "negative" | "neutral";
  Icon: ComponentType<{ className?: string }>;
};

export function StatsCards({
  totalValue,
  totalProfit,
  profitPercentage,
  dailyChangeValue,
  dailyChangePercent,
  aiTrades,
  aiTradesChange,
  successRate,
  successRateChange,
}: {
  totalValue: number;
  totalProfit: number;
  profitPercentage: number;
  dailyChangeValue: number;
  dailyChangePercent: number;
  aiTrades: number;
  aiTradesChange: number;
  successRate: number;
  successRateChange: number;
}) {
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);

  const formatPercent = (value: number) => `${value.toFixed(2)}%`;

  const toneClass = (tone: StatCard["tone"]) => {
    if (tone === "positive") return "text-emerald-500 bg-emerald-500/10 ring-emerald-500/30";
    if (tone === "negative") return "text-rose-500 bg-rose-500/10 ring-rose-500/30";
    return "text-muted-foreground bg-muted/60 ring-border/60";
  };

  const cards: StatCard[] = [
    {
      title: "Total Portfolio",
      value: formatCurrency(totalValue),
      delta: `${formatCurrency(totalProfit)} • ${formatPercent(profitPercentage)}`,
      deltaLabel: "vs cost basis",
      tone: profitPercentage >= 0 ? "positive" : "negative",
      Icon: DollarSignIcon,
    },
    {
      title: "24h Change",
      value: `${dailyChangeValue >= 0 ? "+" : ""}${formatCurrency(dailyChangeValue)}`,
      delta: formatPercent(dailyChangePercent),
      deltaLabel: "dalam 24 jam",
      tone: dailyChangeValue >= 0 ? "positive" : "negative",
      Icon: Activity,
    },
    {
      title: "AI Trades",
      value: aiTrades.toString(),
      delta: `${aiTradesChange >= 0 ? "+" : ""}${aiTradesChange} transaksi`,
      deltaLabel: "pekan ini",
      tone: aiTradesChange >= 0 ? "positive" : "neutral",
      Icon: BitcoinIcon,
    },
    {
      title: "Win Rate",
      value: formatPercent(successRate),
      delta: successRateChange >= 0 ? `+${formatPercent(successRateChange)}` : formatPercent(successRateChange),
      deltaLabel: "akurasi sinyal",
      tone: successRateChange >= 0 ? "positive" : "negative",
      Icon: LineChartIcon,
    },
  ];

  return (
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
      {cards.map(({ title, value, delta, deltaLabel, tone, Icon }) => (
        <Card
          key={title}
          className="relative overflow-hidden border-border/70 bg-card/90 shadow-sm ring-1 ring-border/60 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
        >
          <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-primary/70 via-accent/70 to-primary/50" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
            <span className="rounded-full bg-muted px-2 py-1 text-[11px] text-muted-foreground">Now</span>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1">
                <p className="text-2xl font-semibold tracking-tight text-foreground">{value}</p>
                <p className="text-xs text-muted-foreground">{deltaLabel}</p>
              </div>
              <div className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs ring-1 ${toneClass(tone)}`}>
                <ArrowUpIcon className="h-3 w-3" />
                {delta}
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Icon className="h-4 w-4" />
              </div>
              <span className="text-foreground/80">Terupdate otomatis dengan pergerakan harga terbaru.</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
