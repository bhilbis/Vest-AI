import { Activity, ArrowUpIcon, BitcoinIcon, DollarSignIcon, TrendingUpIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

export const StatsCards = ({ 
  totalValue, 
  totalProfit, 
  profitPercentage,
  dailyChangeValue,
  dailyChangePercent,
  aiTrades,
  aiTradesChange,
  successRate,
  successRateChange
}: { 
  totalValue: number, 
  totalProfit: number, 
  profitPercentage: number,
  dailyChangeValue: number,
  dailyChangePercent: number,
  aiTrades: number,
  aiTradesChange: number,
  successRate: number,
  successRateChange: number
}) => {
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Total Portfolio Value */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Portfolio Value</CardTitle>
          <DollarSignIcon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(totalValue)}</div>
          <p className="text-xs text-muted-foreground">
            <span className={`${profitPercentage >= 0 ? "text-green-600" : "text-red-600"} flex items-center gap-1`}>
              <ArrowUpIcon className="h-3 w-3" />
              {formatPercent(profitPercentage)}
            </span>
            total profit
          </p>
        </CardContent>
      </Card>

      {/* 24h Change */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">24h Change</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${dailyChangeValue >= 0 ? "text-green-600" : "text-red-600"}`}>
            {dailyChangeValue >= 0 ? "+" : ""}{formatCurrency(dailyChangeValue)}
          </div>
          <p className="text-xs text-muted-foreground">
            <span className={`${dailyChangePercent >= 0 ? "text-green-600" : "text-red-600"} flex items-center gap-1`}>
              <ArrowUpIcon className="h-3 w-3" />
              {formatPercent(dailyChangePercent)}
            </span>
            in 24 hours
          </p>
        </CardContent>
      </Card>

      {/* AI Trades */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">AI Trades</CardTitle>
          <BitcoinIcon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{aiTrades}</div>
          <p className="text-xs text-muted-foreground">
            <span className={`${aiTradesChange >= 0 ? "text-green-600" : "text-red-600"} flex items-center gap-1`}>
              <ArrowUpIcon className="h-3 w-3" />
              {aiTradesChange >= 0 ? "+" : ""}{aiTradesChange}
            </span>
            this week
          </p>
        </CardContent>
      </Card>

      {/* Success Rate */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
          <TrendingUpIcon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatPercent(successRate)}</div>
          <p className="text-xs text-muted-foreground">
            <span className={`${successRateChange >= 0 ? "text-green-600" : "text-red-600"} flex items-center gap-1`}>
              <ArrowUpIcon className="h-3 w-3" />
              {successRateChange >= 0 ? "+" : ""}{formatPercent(successRateChange)}
            </span>
            accuracy
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
