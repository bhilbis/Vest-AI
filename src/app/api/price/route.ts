import { NextRequest, NextResponse } from "next/server";

// In-memory cache with TTL support
interface CoinGeckoPriceResponse {
    [coinId: string]: {
        idr: number
    }
}

interface CacheEntry {
    data: CoinGeckoPriceResponse
    timestamp: number
}

const priceCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 60 * 1000; // 60 seconds

function getCacheKey(coinIds: string[]): string {
    // Sort to ensure consistent cache keys for same coinIds in different order
    return [...coinIds].sort().join(",");
}

function getCachedData(cacheKey: string): CoinGeckoPriceResponse | null {
    const entry = priceCache.get(cacheKey);
    if (!entry) return null;

    const now = Date.now();
    const age = now - entry.timestamp;

    // Check if cache entry is still valid (within TTL)
    if (age < CACHE_TTL_MS) {
        return entry.data;
    }

    // Cache expired, remove it
    priceCache.delete(cacheKey);
    return null;
}

function setCachedData(cacheKey: string, data: CoinGeckoPriceResponse): void {
    priceCache.set(cacheKey, {
        data,
        timestamp: Date.now(),
    });
}

// Cleanup function to prevent memory leaks (optional, runs periodically)
if (typeof setInterval !== "undefined") {
    setInterval(() => {
        const now = Date.now();
        for (const [key, entry] of priceCache.entries()) {
            if (now - entry.timestamp >= CACHE_TTL_MS) {
                priceCache.delete(key);
            }
        }
    }, CACHE_TTL_MS);
}

export async function POST(req: NextRequest) {
    const { coinIds }: { coinIds: string[] } = await req.json();

    if (!coinIds || coinIds.length === 0) {
        return NextResponse.json({ error: "Coin ID kosong" }, { status: 400 });
    }

    // Create cache key from sorted coinIds
    const cacheKey = getCacheKey(coinIds);

    // Check cache first
    const cachedData = getCachedData(cacheKey);
    if (cachedData !== null) {
        return NextResponse.json(cachedData);
    }

    // Cache miss - fetch from CoinGecko API
    // Batch all coinIds into a single request (already optimized)
    const ids = coinIds.join(",");
    
    try {
        const res = await fetch(
            `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=idr`,
            {
                // Add timeout to prevent hanging requests
                signal: AbortSignal.timeout(10000), // 10 second timeout
            }
        );

        if (!res.ok) {
            return NextResponse.json(
                { error: "Failed to fetch prices from CoinGecko" },
                { status: res.status }
            );
        }

        const data = (await res.json()) as CoinGeckoPriceResponse;

        // Store in cache before returning
        setCachedData(cacheKey, data);

        return NextResponse.json(data);
    } catch (error) {
        console.error("Error fetching prices from CoinGecko:", error);
        return NextResponse.json(
            { error: "Internal server error while fetching prices" },
            { status: 500 }
        );
    }
}