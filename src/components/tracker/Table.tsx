"use client"

import { PieChart, Trash2, TrendingDown, TrendingUp, Wallet } from "lucide-react"
import { Button } from "../ui/button"
import { Card, CardContent } from "../ui/card"

export function TrackerTable({data, onRemove}: {data: any[]; onRemove: (id: string) => void}) {
    const formatCurrency = (value: number) =>
        new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(value)

    const formatNumber = (value: number) => {
        return new Intl.NumberFormat('id-ID', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 4
        }).format(value);
    };

    return (
        <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm">
            <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-800">Portfolio Anda</h3>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                    <PieChart className="w-4 h-4" />
                    {data.length} Assets
                </div>
                </div>

                <div className="space-y-4">
                {data.map((asset) => {
                    const currentValue = asset.amount * (asset.currentPrice || asset.buyPrice);
                    const investedValue = asset.amount * asset.buyPrice;
                    const profit = currentValue - investedValue;
                    const profitPercent = ((profit / investedValue) * 100);
                    
                    return (
                    <Card key={asset.id} className="border border-gray-200 hover:border-blue-300 transition-all duration-300 hover:shadow-md">
                        <CardContent className="p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                                <span className="text-white font-bold text-sm">
                                    {asset.name.charAt(0).toUpperCase()}
                                </span>
                                </div>
                                <div>
                                <h4 className="font-semibold text-gray-800">{asset.name}</h4>
                                <p className="text-sm text-gray-600">
                                    {formatNumber(asset.amount)} unit @ {formatCurrency(asset.buyPrice)}
                                </p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                <p className="text-gray-600">Nilai Saat Ini</p>
                                <p className="font-semibold">{formatCurrency(currentValue)}</p>
                                </div>
                                <div>
                                <p className="text-gray-600">Profit/Loss</p>
                                <p className={`font-semibold flex items-center gap-1 ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {profit >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                    {formatCurrency(profit)} ({profitPercent.toFixed(2)}%)
                                </p>
                                </div>
                            </div>
                            </div>
                            <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => onRemove(asset.id)}
                            className="bg-red-500 hover:bg-red-600 text-white border-0 shadow-md hover:shadow-lg transition-all duration-300"
                            >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Hapus
                            </Button>
                        </div>
                        </CardContent>
                    </Card>
                    );
                })}
                </div>

                {data.length === 0 && (
                <div className="text-center py-12">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Wallet className="w-10 h-10 text-gray-400" />
                    </div>
                    <p className="text-gray-500 text-lg">Belum ada asset dalam portfolio</p>
                    <p className="text-gray-400 text-sm">Tambahkan asset pertama Anda untuk mulai tracking</p>
                </div>
                )}
            </CardContent>
            </Card>
    )
}