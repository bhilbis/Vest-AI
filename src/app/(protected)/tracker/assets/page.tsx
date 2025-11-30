"use client"

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { ArrowUpIcon, ArrowDownIcon, PlusIcon, TrendingUpIcon, DollarSignIcon, EyeIcon, MoreHorizontalIcon } from 'lucide-react';

const cryptoAssets = [
  {
    id: 1,
    symbol: 'BTC',
    name: 'Bitcoin',
    amount: 1.5,
    price: 45000,
    value: 67500,
    change24h: 3.2,
    allocation: 42,
    color: 'from-orange-400 to-orange-600'
  },
  {
    id: 2,
    symbol: 'ETH',
    name: 'Ethereum',
    amount: 15.7,
    price: 2800,
    value: 43960,
    change24h: -1.8,
    allocation: 26,
    color: 'from-blue-400 to-blue-600'
  },
  {
    id: 3,
    symbol: 'ADA',
    name: 'Cardano',
    amount: 5000,
    price: 0.85,
    value: 4250,
    change24h: 5.1,
    allocation: 3,
    color: 'from-purple-400 to-purple-600'
  }
];

const stockAssets = [
  {
    id: 1,
    symbol: 'AAPL',
    name: 'Apple Inc.',
    shares: 50,
    price: 175.25,
    value: 8762.50,
    change24h: 1.2,
    allocation: 8,
    color: 'from-gray-400 to-gray-600'
  },
  {
    id: 2,
    symbol: 'TSLA',
    name: 'Tesla Inc.',
    shares: 25,
    price: 245.80,
    value: 6145,
    change24h: -2.4,
    allocation: 6,
    color: 'from-red-400 to-red-600'
  },
  {
    id: 3,
    symbol: 'NVDA',
    name: 'NVIDIA Corp.',
    shares: 15,
    price: 420.15,
    value: 6302.25,
    change24h: 4.8,
    allocation: 6,
    color: 'from-green-400 to-green-600'
  }
];

const aiTrades = [
  {
    id: 1,
    date: '2024-01-15',
    action: 'Buy',
    asset: 'MSFT',
    amount: 20,
    price: 385.50,
    profit: 1250,
    status: 'Completed',
    confidence: 94
  },
  {
    id: 2,
    date: '2024-01-14',
    action: 'Sell',
    asset: 'GOOGL',
    amount: 5,
    price: 142.80,
    profit: -125,
    status: 'Completed',
    confidence: 78
  },
  {
    id: 3,
    date: '2024-01-13',
    action: 'Buy',
    asset: 'BTC',
    amount: 0.1,
    price: 44500,
    profit: 850,
    status: 'Completed',
    confidence: 86
  }
];

export default function Page() {
  const [activeTab, setActiveTab] = useState('overview');

  const totalPortfolioValue = 108000;
  const totalCrypto = cryptoAssets.reduce((sum, asset) => sum + asset.value, 0);
  const totalStocks = stockAssets.reduce((sum, asset) => sum + asset.value, 0);
  const cashValue = 13000;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">Asset Portfolio</h1>
          <p className="text-muted-foreground mt-2">Manage and track your investment holdings with AI-powered insights</p>
        </div>
        <Button className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg">
          <PlusIcon className="h-4 w-4" />
          Add Asset
        </Button>
      </div>

      {/* Portfolio Summary - Enhanced Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-400/20 to-transparent rounded-full -translate-y-8 translate-x-8"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">Total Value</CardTitle>
            <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-lg">
              <DollarSignIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-900 dark:text-blue-100">${totalPortfolioValue.toLocaleString()}</div>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">Total portfolio value</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-emerald-400/20 to-transparent rounded-full -translate-y-8 translate-x-8"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Cryptocurrency</CardTitle>
            <div className="p-2 bg-emerald-100 dark:bg-emerald-800 rounded-lg">
              <TrendingUpIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-900 dark:text-emerald-100">${totalCrypto.toLocaleString()}</div>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">{Math.round((totalCrypto / totalPortfolioValue) * 100)}% of portfolio</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-400/20 to-transparent rounded-full -translate-y-8 translate-x-8"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300">Stocks</CardTitle>
            <div className="p-2 bg-purple-100 dark:bg-purple-800 rounded-lg">
              <TrendingUpIcon className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-900 dark:text-purple-100">${totalStocks.toLocaleString()}</div>
            <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">{Math.round((totalStocks / totalPortfolioValue) * 100)}% of portfolio</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-amber-400/20 to-transparent rounded-full -translate-y-8 translate-x-8"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-amber-700 dark:text-amber-300">Cash</CardTitle>
            <div className="p-2 bg-amber-100 dark:bg-amber-800 rounded-lg">
              <DollarSignIcon className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-900 dark:text-amber-100">${cashValue.toLocaleString()}</div>
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">{Math.round((cashValue / totalPortfolioValue) * 100)}% of portfolio</p>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Asset Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 bg-muted/50 p-1 h-12">
          <TabsTrigger value="overview" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Overview</TabsTrigger>
          <TabsTrigger value="crypto" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Crypto</TabsTrigger>
          <TabsTrigger value="stocks" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Stocks</TabsTrigger>
          <TabsTrigger value="ai-trades" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">AI Trades</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
            <CardHeader className="pb-6">
              <CardTitle className="flex items-center gap-2">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                  <EyeIcon className="h-5 w-5 text-white" />
                </div>
                Asset Allocation
              </CardTitle>
              <CardDescription>Visual breakdown of your investment portfolio</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div className="flex justify-between items-center mb-3">
                    <span className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full"></div>
                      Cryptocurrency
                    </span>
                    <span className="font-medium">{Math.round((totalCrypto / totalPortfolioValue) * 100)}%</span>
                  </div>
                  <Progress value={(totalCrypto / totalPortfolioValue) * 100} className="h-3 bg-emerald-100 dark:bg-emerald-900" />
                </div>
                
                <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div className="flex justify-between items-center mb-3">
                    <span className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-gradient-to-r from-purple-400 to-purple-600 rounded-full"></div>
                      Stocks
                    </span>
                    <span className="font-medium">{Math.round((totalStocks / totalPortfolioValue) * 100)}%</span>
                  </div>
                  <Progress value={(totalStocks / totalPortfolioValue) * 100} className="h-3 bg-purple-100 dark:bg-purple-900" />
                </div>
                
                <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div className="flex justify-between items-center mb-3">
                    <span className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-gradient-to-r from-amber-400 to-amber-600 rounded-full"></div>
                      Cash
                    </span>
                    <span className="font-medium">{Math.round((cashValue / totalPortfolioValue) * 100)}%</span>
                  </div>
                  <Progress value={(cashValue / totalPortfolioValue) * 100} className="h-3 bg-amber-100 dark:bg-amber-900" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="crypto" className="space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="p-2 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-lg">
                  <DollarSignIcon className="h-5 w-5 text-white" />
                </div>
                Cryptocurrency Holdings
              </CardTitle>
              <CardDescription>Your digital asset portfolio with real-time performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {cryptoAssets.map((asset) => (
                  <div key={asset.id} className="group p-6 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:shadow-lg transition-all duration-200 hover:border-slate-300 dark:hover:border-slate-600">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${asset.color} flex items-center justify-center text-white shadow-lg`}>
                          <span className="font-bold text-lg">{asset.symbol.charAt(0)}</span>
                        </div>
                        <div>
                          <div className="font-semibold text-lg">{asset.name}</div>
                          <div className="text-sm text-muted-foreground">{asset.amount} {asset.symbol} • ${asset.price.toLocaleString()}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-xl">${asset.value.toLocaleString()}</div>
                        <div className={`text-sm flex items-center justify-end gap-1 ${asset.change24h > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                          {asset.change24h > 0 ? <ArrowUpIcon className="h-4 w-4" /> : <ArrowDownIcon className="h-4 w-4" />}
                          {Math.abs(asset.change24h)}%
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center">
                      <Badge variant="secondary" className="bg-slate-100 dark:bg-slate-700">
                        {asset.allocation}% allocation
                      </Badge>
                      <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreHorizontalIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stocks" className="space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg">
                  <TrendingUpIcon className="h-5 w-5 text-white" />
                </div>
                Stock Holdings
              </CardTitle>
              <CardDescription>Your equity investments and market performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stockAssets.map((asset) => (
                  <div key={asset.id} className="group p-6 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:shadow-lg transition-all duration-200 hover:border-slate-300 dark:hover:border-slate-600">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${asset.color} flex items-center justify-center text-white shadow-lg`}>
                          <span className="font-bold text-lg">{asset.symbol.charAt(0)}</span>
                        </div>
                        <div>
                          <div className="font-semibold text-lg">{asset.name}</div>
                          <div className="text-sm text-muted-foreground">{asset.shares} shares • ${asset.price}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-xl">${asset.value.toLocaleString()}</div>
                        <div className={`text-sm flex items-center justify-end gap-1 ${asset.change24h > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                          {asset.change24h > 0 ? <ArrowUpIcon className="h-4 w-4" /> : <ArrowDownIcon className="h-4 w-4" />}
                          {Math.abs(asset.change24h)}%
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center">
                      <Badge variant="secondary" className="bg-slate-100 dark:bg-slate-700">
                        {asset.allocation}% allocation
                      </Badge>
                      <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreHorizontalIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai-trades" className="space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg">
                  <TrendingUpIcon className="h-5 w-5 text-white" />
                </div>
                AI-Powered Trades
              </CardTitle>
              <CardDescription>Intelligent trades executed by your AI assistant</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {aiTrades.map((trade) => (
                  <div key={trade.id} className="group p-6 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:shadow-lg transition-all duration-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col gap-2">
                          <Badge 
                            variant={trade.action === 'Buy' ? 'default' : 'secondary'}
                            className={trade.action === 'Buy' ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' : 'bg-red-100 text-red-800 hover:bg-red-200'}
                          >
                            {trade.action}
                          </Badge>
                          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                            AI {trade.confidence}%
                          </Badge>
                        </div>
                        <div>
                          <div className="font-semibold text-lg">{trade.asset}</div>
                          <div className="text-sm text-muted-foreground">{trade.date} • {trade.amount} units @ ${trade.price}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-bold text-xl ${trade.profit > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                          {trade.profit > 0 ? '+' : ''}${trade.profit}
                        </div>
                        <Badge variant="outline" className="bg-slate-50 dark:bg-slate-800 mt-1">
                          {trade.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}