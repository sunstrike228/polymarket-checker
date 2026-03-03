import { NextResponse } from "next/server";
import https from "https";
import { SocksProxyAgent } from "socks-proxy-agent";

const GAMMA_API = "https://gamma-api.polymarket.com";
const DATA_API = "https://data-api.polymarket.com";

const PROXY_URL = process.env.SOCKS_PROXY;
let proxyAgent: SocksProxyAgent | null = null;
if (PROXY_URL) {
  try { proxyAgent = new SocksProxyAgent(PROXY_URL); } catch { /* */ }
}

function fetchViaProxy(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { agent: proxyAgent || undefined }, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) resolve(data);
        else reject(new Error(`HTTP ${res.statusCode}`));
      });
    });
    req.on("error", reject);
    req.setTimeout(20000, () => { req.destroy(); reject(new Error("Timeout")); });
  });
}

async function fetchJSON<T>(url: string): Promise<T | null> {
  try { return JSON.parse(await fetchViaProxy(url)) as T; } catch { return null; }
}

interface Market {
  id: string;
  question: string;
  slug: string;
  image: string;
  icon: string;
  outcomes: string;
  outcomePrices: string;
  volume: string;
  volumeNum: number;
  volume24hr: number;
  volume1wk: number;
  volume1mo: number;
  liquidityNum: number;
  active: boolean;
  closed: boolean;
  endDate: string;
  events: Array<{ id: string; title: string; slug: string }>;
}

interface EventData {
  id: string;
  title: string;
  slug: string;
  volume: number;
  volume24hr: number;
  liquidity: number;
  markets: Market[];
  tags: Array<{ label: string }>;
}

interface LeaderboardEntry {
  rank: string;
  proxyWallet: string;
  userName: string;
  profileImage: string;
  vol: number;
  pnl: number;
}

export async function GET() {
  try {
    // Fetch in parallel: top markets, top events, leaderboard
    const [marketsRaw, eventsRaw, leaderboardAll, leaderboard24h] = await Promise.all([
      fetchJSON<Market[]>(`${GAMMA_API}/markets?limit=200&active=true&order=volume24hr&ascending=false`),
      fetchJSON<EventData[]>(`${GAMMA_API}/events?limit=100&active=true&order=volume24hr&ascending=false`),
      fetchJSON<LeaderboardEntry[]>(`${DATA_API}/v1/leaderboard?timePeriod=ALL&limit=10`),
      fetchJSON<LeaderboardEntry[]>(`${DATA_API}/v1/leaderboard?timePeriod=DAY&limit=10`),
    ]);

    const markets = marketsRaw ?? [];
    const events = eventsRaw ?? [];

    // Aggregate stats
    const totalVolume = markets.reduce((s, m) => s + (m.volumeNum || 0), 0);
    const totalVolume24h = markets.reduce((s, m) => s + (m.volume24hr || 0), 0);
    const totalVolume1wk = markets.reduce((s, m) => s + (m.volume1wk || 0), 0);
    const totalVolume1mo = markets.reduce((s, m) => s + (m.volume1mo || 0), 0);
    const totalLiquidity = markets.reduce((s, m) => s + (m.liquidityNum || 0), 0);
    const activeMarkets = markets.filter((m) => m.active && !m.closed).length;

    // Category breakdown from events
    const categoryMap: Record<string, { count: number; volume: number; volume24h: number }> = {};
    for (const e of events) {
      for (const t of (e.tags || [])) {
        const label = t.label;
        if (label === "Hide From New" || label === "Recurring" || label === "5M") continue;
        if (!categoryMap[label]) categoryMap[label] = { count: 0, volume: 0, volume24h: 0 };
        categoryMap[label].count++;
        categoryMap[label].volume += e.volume || 0;
        categoryMap[label].volume24h += e.volume24hr || 0;
      }
    }

    const categories = Object.entries(categoryMap)
      .map(([name, d]) => ({ name, ...d }))
      .sort((a, b) => b.volume24h - a.volume24h)
      .slice(0, 10);

    // Top 15 markets by 24h volume
    const topMarkets = markets.slice(0, 15).map((m) => ({
      question: m.question,
      slug: m.slug,
      icon: m.icon || m.image,
      volume24h: m.volume24hr,
      volume: m.volumeNum,
      liquidity: m.liquidityNum,
      outcomes: m.outcomes,
      outcomePrices: m.outcomePrices,
    }));

    // Top 10 events by 24h volume
    const topEvents = events.slice(0, 10).map((e) => ({
      title: e.title,
      slug: e.slug,
      volume24h: e.volume24hr,
      volume: e.volume,
      liquidity: e.liquidity,
      marketsCount: e.markets?.length || 0,
    }));

    // Volume distribution for chart (top 20 markets)
    const volumeChart = markets.slice(0, 20).map((m) => ({
      name: m.question.length > 30 ? m.question.slice(0, 30) + "..." : m.question,
      vol24h: Math.round(m.volume24hr),
      volTotal: Math.round(m.volumeNum),
      liquidity: Math.round(m.liquidityNum),
    }));

    return NextResponse.json({
      overview: {
        totalVolume,
        totalVolume24h,
        totalVolume1wk,
        totalVolume1mo,
        totalLiquidity,
        activeMarkets,
        totalEvents: events.length,
      },
      categories,
      topMarkets,
      topEvents,
      volumeChart,
      leaderboard: {
        allTime: leaderboardAll ?? [],
        daily: leaderboard24h ?? [],
      },
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
