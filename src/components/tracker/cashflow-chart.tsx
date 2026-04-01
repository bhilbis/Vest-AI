"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface CashflowData {
  month: string;
  income: number;
  expense: number;
}

interface CashflowChartProps {
  data: CashflowData[];
}

function formatShort(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}jt`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}rb`;
  return value.toString();
}

function formatFull(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <p className="text-[11px] text-zinc-400 mb-1.5">{label}</p>
      {payload.map((e: any) => (
        <div key={e.name} className="flex items-center justify-between gap-6">
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: e.color }} />
            <span className="text-[11px] text-muted-foreground">
              {e.name === "income" ? "Masuk" : "Keluar"}
            </span>
          </div>
          <span className="text-[11px] font-semibold text-foreground tabular-nums">
            {formatFull(e.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

export function CashflowChart({ data }: CashflowChartProps) {
  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-[220px] text-sm text-muted-foreground">
        Belum ada data cashflow
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="gIncome" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--success))" stopOpacity={0.25} />
            <stop offset="100%" stopColor="hsl(var(--success))" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gExpense" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--destructive))" stopOpacity={0.25} />
            <stop offset="100%" stopColor="hsl(var(--destructive))" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="month"
          axisLine={false}
          tickLine={false}
          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
          dy={6}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
          tickFormatter={formatShort}
          width={48}
        />
        <Tooltip content={<ChartTooltip />} />
        <Area
          type="monotone"
          dataKey="income"
          stroke="hsl(var(--success))"
          strokeWidth={2}
          fill="url(#gIncome)"
          dot={false}
          activeDot={{ r: 4, stroke: "hsl(var(--success))", strokeWidth: 2, fill: "hsl(var(--background))" }}
        />
        <Area
          type="monotone"
          dataKey="expense"
          stroke="hsl(var(--destructive))"
          strokeWidth={2}
          fill="url(#gExpense)"
          dot={false}
          activeDot={{ r: 4, stroke: "hsl(var(--destructive))", strokeWidth: 2, fill: "hsl(var(--background))" }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
