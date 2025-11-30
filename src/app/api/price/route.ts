import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    const { coinIds }: { coinIds: string[] } = await req.json()

    if(!coinIds || coinIds.length === 0) {
        return NextResponse.json({ error: "Coin ID kosong" }, {status: 400})
    }

    const ids = coinIds.join(",")
    const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=idr`)
    const data = await res.json()

    return NextResponse.json(data)
}