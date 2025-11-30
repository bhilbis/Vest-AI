"use client"

import { useEffect, useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { v4 as uuidv4 } from 'uuid'
import { Card, CardContent } from "../ui/card"
import { Plus } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover"
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from "../ui/command"
import { useDebounce } from "use-debounce"
import Image from "next/image"

type Coin = {
    id: string
    name: string
    symbol: string
    thumb: string
}

type Assets = {
    id: string
    name: string
    amount: number
    buyPrice: number
    currentPrice: number
    coinId: number
}

export function TrackerForm({onAdd}: { onAdd: (asset: Assets) => void}){
    const [searchTerm, setSearchTerm] = useState('')
    const [debouncedSearchTerm] = useDebounce(searchTerm, 300)
    const [coins, setCoins] = useState<Coin[]>([])
    const [selectedCoin, setSelectedCoin] = useState<Coin | null>(null)
    const [showForm, setShowForm] = useState(false)
    const [open, setOpen] = useState(false)
    const [formData, setFormData] = useState({
        name: '',
        amount: '',
        buyPrice: ''
    });

    useEffect(() => {
        if (!debouncedSearchTerm) return

        fetch(`https://api.coingecko.com/api/v3/search?query=${debouncedSearchTerm}`)
        .then(res => res.json())
        .then(data => {
            const results = data.coins.map((coin: any) => ({
            id: coin.id,
            name: coin.name,
            symbol: coin.symbol,
            thumb: coin.thumb,
        }))
        setCoins(results)
        })
  }, [debouncedSearchTerm])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        const { name, amount, buyPrice } = formData;

        if (!name || !amount || !buyPrice) return

        function parseCurrency(input: string): number {
            const clean = input
                .toLowerCase()
                .replace(/\./g, '')
                .replace(',', '.')
                .replace(/rp|idr|\s/g, '')

            if (clean.includes('k')) return parseFloat(clean.replace('k', '')) * 1_000
            if (clean.includes('rb')) return parseFloat(clean.replace('rb', '')) * 1_000
            if (clean.includes('ribu')) return parseFloat(clean.replace('ribu', '')) * 1_000
            if (clean.includes('juta')) return parseFloat(clean.replace('juta', '')) * 1_000_000
            if (clean.includes('jt')) return parseFloat(clean.replace('jt', '')) * 1_000_000
            if (clean.includes('m')) return parseFloat(clean.replace('m', '')) * 1_000_000_000

            return parseFloat(clean)
        }

        const assetData = {
            id: uuidv4(),
            coinId: selectedCoin?.id,
            name: `${selectedCoin?.name} (${selectedCoin?.symbol.toUpperCase()})`,
            amount: parseCurrency(amount),
            buyPrice: parseCurrency(buyPrice),
        }

        const res = await fetch("/api/assets", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(assetData),
        })

        const data = await res.json()
        onAdd(data)

        setFormData({ name: '', amount: '', buyPrice: '' })
        setShowForm(false);
    } 

    return (
        <Card className="overflow-hidden border-0 shadow-lg bg-white/70 backdrop-blur-sm">
            <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-800">Tambah Asset Baru</h3>
                <Button
                    onClick={() => setShowForm(!showForm)}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    {showForm ? 'Batal' : 'Tambah Asset'}
                </Button>
                </div>

                {showForm && (
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Pilih Koin</label>
                            <Popover open={open} onOpenChange={setOpen}>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="w-full justify-start text-left">
                                        {selectedCoin ? `${selectedCoin.name} (${selectedCoin.symbol.toUpperCase()})` : "Pilih aset..."}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[300px] p-0">
                                    <Command>
                                    <CommandInput value={searchTerm} onValueChange={setSearchTerm} placeholder="Cari aset..." />
                                    <CommandList>
                                        <CommandEmpty>Tidak ditemukan</CommandEmpty>
                                        {coins.map(coin => (
                                        <CommandItem
                                            key={coin.id}
                                            value={coin.id}
                                            onSelect={(value) => {
                                                const coinSelected = coins.find(c => c.id === value)
                                            if (coinSelected) {
                                                setSelectedCoin(coinSelected)
                                                setFormData(prev => ({ ...prev, name: coinSelected.name }))
                                                setOpen(false)
                                            }
                                            }}
                                            className="flex items-center gap-2"
                                        >
                                            <Image src={coin.thumb} alt={coin.symbol} width={24} height={24} className="w-4 h-4 rounded-full" />
                                            {coin.name} ({coin.symbol.toUpperCase()})
                                        </CommandItem>
                                        ))}
                                    </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Jumlah</label>
                            <Input
                            type="number"
                            step="any"
                            placeholder="0.5"
                            value={formData.amount}
                            onChange={(e) => setFormData({...formData, amount: e.target.value})}
                            className="border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Harga Beli (IDR)</label>
                            <Input
                            placeholder="1000000"
                            value={formData.buyPrice}
                            onChange={(e) => setFormData({...formData, buyPrice: e.target.value})}
                            className="border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                            />
                        </div>
                    </div>
                    <Button
                        type="submit"
                        className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Tambah ke Portfolio
                    </Button>
                </form>
                )}
            </CardContent>
            </Card>
    )
}