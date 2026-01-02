/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "../ui/button"
import { Card, CardContent } from "../ui/card"
import { Bot, Sparkles } from "lucide-react"

export function AIResponse({ assets }: { assets: any[] }) {
    const [loading, setLoading] = useState(false)
    const [selectedIds, setSelectedIds] = useState<string[]>([])
    const [selectedAssets, setSelectedAssets] = useState([]);
    const [history, setHistory] = useState<{ role: "user" | "assistant"; content: string }[]>([])
    const bottomRef = useRef<HTMLDivElement>(null)

    function toggleId(id: string) {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
        );
        setSelectedAssets((prev: any) => 
            prev.includes(id) ? prev.filter((i: string) => i !== id) : [...prev, id]
        );
    }

    const assetsToAnalyze = selectedIds.length > 0
    ? assets.filter((a) => selectedIds.includes(a.id))
    : assets

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [history, loading])

    async function handleAnalyze() {
        setLoading(true)
        setHistory(prev => [...prev, { role: "user", content: "Analisis aset..." }])

        try {
            const ids = assetsToAnalyze.map(a => a.coinId).filter(Boolean)
            const priceRes = await fetch("/api/price", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ coinIds: ids })
            })
            const prices = await priceRes.json()

            const autoMarketPrices = Object.fromEntries(
                assetsToAnalyze.map(a => {
                    const price = prices[a.coinId]?.idr;
                    return [a.id, price && price > 0 ? price.toString() : null]
                })
            )

            console.log({ assets: assetsToAnalyze, marketPrices: autoMarketPrices })

            const res = await fetch("/api/ai-analyze", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ 
                    assets: assetsToAnalyze, 
                    marketPrices: autoMarketPrices
                }),
            })

            if (!res.body) {
                setHistory(prev => [...prev, { role: "assistant", content: "Tidak ada respon dari AI." }])
                return
            }

            const reader = res.body.getReader()
            const decoder = new TextDecoder()
            let fullText = ""

            while (true) {
                const { done, value } = await reader.read()
                if (done) break
                const chunk = decoder.decode(value, {stream: true})
                fullText += chunk
                setHistory(prev => [...prev, { role: "assistant", content: chunk }])
            }

            const cleaned = fullText.replace(/<think>[\s\S]*?<\/think>/g, "")
            setHistory(prev => [...prev, { role: "assistant", content: cleaned }])
        } catch (err) {
            console.error("Error during AI analysis:", err)
            setHistory(prev => [...prev, { role: "assistant", content: "Terjadi kesalahan saat memproses." }])
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm">
            <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-linear-to-r from-purple-500 to-pink-600 rounded-lg">
                        <Bot className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-800">AI Analysis</h3>
                </div>

                {assets.length > 0 && (
                <>
                    <div className="space-y-4 mb-6">
                        <div>
                            <p className="font-medium text-sm text-gray-700 mb-3">Pilih Asset untuk Analisis:</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {assets.map((asset) => (
                                    <label key={asset.id} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:border-blue-300 transition-all duration-200 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={selectedAssets.includes(asset.id as never)}
                                        onChange={() => toggleId(asset.id)}
                                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                    />
                                    <div className="w-8 h-8 bg-linear-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                                        <span className="text-white font-bold text-xs">
                                        {asset.name.charAt(0).toUpperCase()}
                                        </span>
                                    </div>
                                    <span className="text-sm font-medium text-gray-700">{asset.name}</span>
                                    </label>
                                ))}
                            </div>
                            {selectedAssets.length === 0 && (
                                <p className="text-xs text-gray-500 italic mt-2">* Semua asset akan dianalisis</p>
                            )}
                        </div>

                        {assetsToAnalyze.length > 0 && (
                            <div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {assetsToAnalyze.map((asset) => (
                                    <div key={asset.id} className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-700">{asset.name}</label>
                                    </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <Button
                        onClick={handleAnalyze}
                        disabled={loading}
                        className="w-full bg-linear-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                    {loading ? (
                        <span className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Menganalisis...
                        </span>
                    ) : (
                        <span className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4" />
                            Analisis dengan AI
                        </span>
                    )}
                    </Button>

                    <div className="mt-6 space-y-4 max-h-[400px] overflow-y-auto px-2">
                        {history.map((msg, i) => (
                            <div
                            key={i}
                            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                            >
                                <div
                                    className={`max-w-sm px-4 py-2 rounded-lg text-sm whitespace-pre-wrap shadow 
                                    ${msg.role === "user"
                                        ? "bg-blue-500 text-white rounded-br-none"
                                        : "bg-gray-100 text-gray-800 rounded-bl-none"
                                    }`}
                                >
                                    {msg.content}
                                </div>
                            </div>
                        ))}

                        {/* Typing animation saat loading */}
                        {loading && (
                            <div className="flex justify-start">
                                <div className="max-w-sm px-4 py-2 rounded-lg bg-gray-100 text-sm text-gray-600 animate-pulse">
                                    Mengetik...
                                </div>
                            </div>
                        )}

                        <div ref={bottomRef} />
                    </div>
                </>
                )}

                {assets.length === 0 && (
                    <div className="text-center py-8">
                        <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Bot className="w-8 h-8 text-purple-600" />
                        </div>
                        <p className="text-gray-500">Tambahkan asset terlebih dahulu untuk analisis AI</p>
                    </div>
                )}
            </CardContent>
            </Card>
    )
}