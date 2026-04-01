"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

interface CategoryData {
  name: string;
  value: number;
  color?: string;
}

interface ExpensePieChartProps {
  data: CategoryData[];
}

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(var(--primary))",
];

function formatFull(value: number): string {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value);
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function ChartTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const e = payload[0];
  return (
    <div className="chart-tooltip">
      <div className="flex items-center gap-2 mb-0.5">
        <div className="h-2 w-2 rounded-full" style={{ backgroundColor: e.payload.fill }} />
        <span className="text-[11px] text-muted-foreground capitalize">{e.name}</span>
      </div>
      <p className="text-[12px] font-semibold text-foreground tabular-nums">{formatFull(e.value)}</p>
    </div>
  );
}

function LabelInner({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) {
  if (percent < 0.06) return null;
  const RADIAN = Math.PI / 180;
  const r = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + r * Math.cos(-midAngle * RADIAN);
  const y = cy + r * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="hsl(var(--background))" textAnchor="middle" dominantBaseline="central" className="text-[10px] font-bold">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}

export function ExpensePieChart({ data }: ExpensePieChartProps) {
  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-[220px] text-sm text-muted-foreground">
        Belum ada data pengeluaran
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row items-center gap-4">
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={90}
            paddingAngle={2}
            dataKey="value"
            labelLine={false}
            label={LabelInner}
            stroke="hsl(var(--background))"
            strokeWidth={3}
          >
            {data.map((_, i) => (
              <Cell key={`c-${i}`} fill={data[i].color || COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<ChartTooltip />} />
        </PieChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex flex-wrap sm:flex-col gap-2 sm:gap-1 min-w-[120px]">
        {data.slice(0, 6).map((item, i) => (
          <div key={item.name} className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: item.color || COLORS[i % COLORS.length] }} />
            <span className="text-[11px] text-muted-foreground capitalize truncate">{item.name}</span>
          </div>
        ))}
        {data.length > 6 && <span className="text-[10px] text-muted-foreground/50">+{data.length - 6} lainnya</span>}
      </div>
    </div>
  );
}
