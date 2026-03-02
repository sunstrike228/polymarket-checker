import https from "https";
import { SocksProxyAgent } from "socks-proxy-agent";
import {
  Profile,
  LeaderboardEntry,
  Position,
  ClosedPosition,
  Activity,
  WalletData,
} from "./types";

const GAMMA_API = "https://gamma-api.polymarket.com";
const DATA_API = "https://data-api.polymarket.com";

// Use SOCKS proxy when set (for geo-blocked regions). On Vercel this is unset = direct.
const PROXY_URL = process.env.SOCKS_PROXY;

let proxyAgent: SocksProxyAgent | null = null;
if (PROXY_URL) {
  try {
    proxyAgent = new SocksProxyAgent(PROXY_URL);
  } catch {
    // No proxy available
  }
}

function fetchViaProxy(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const options: https.RequestOptions = {
      agent: proxyAgent || undefined,
    };
    const req = https.get(url, options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          resolve(data);
        } else {
          reject(new Error(`HTTP ${res.statusCode}`));
        }
      });
    });
    req.on("error", reject);
    req.setTimeout(15000, () => {
      req.destroy();
      reject(new Error("Timeout"));
    });
  });
}

async function fetchJSON<T>(url: string): Promise<T | null> {
  try {
    const text = await fetchViaProxy(url);
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

async function fetchProfile(address: string): Promise<Profile | null> {
  return fetchJSON<Profile>(
    `${GAMMA_API}/public-profile?address=${address}`
  );
}

async function fetchLeaderboard(
  address: string,
  timePeriod: string
): Promise<LeaderboardEntry | null> {
  const data = await fetchJSON<LeaderboardEntry[]>(
    `${DATA_API}/v1/leaderboard?user=${address}&timePeriod=${timePeriod}&limit=1`
  );
  return data && data.length > 0 ? data[0] : null;
}

async function fetchPositions(address: string): Promise<Position[]> {
  return (
    (await fetchJSON<Position[]>(
      `${DATA_API}/positions?user=${address}&limit=500&sizeThreshold=0.01&sortBy=CURRENT&sortDirection=DESC`
    )) ?? []
  );
}

async function fetchClosedPositions(
  address: string
): Promise<ClosedPosition[]> {
  return (
    (await fetchJSON<ClosedPosition[]>(
      `${DATA_API}/closed-positions?user=${address}&limit=50&sortBy=REALIZEDPNL&sortDirection=DESC`
    )) ?? []
  );
}

async function fetchPortfolioValue(address: string): Promise<number> {
  const data = await fetchJSON<{ user: string; value: number }[]>(
    `${DATA_API}/value?user=${address}`
  );
  return data && data.length > 0 ? data[0].value : 0;
}

async function fetchMarketsTraded(address: string): Promise<number> {
  const data = await fetchJSON<{ user: string; traded: number }>(
    `${DATA_API}/traded?user=${address}`
  );
  return data?.traded ?? 0;
}

async function fetchActivity(address: string): Promise<Activity[]> {
  return (
    (await fetchJSON<Activity[]>(
      `${DATA_API}/activity?user=${address}&limit=100&sortBy=TIMESTAMP&sortDirection=DESC`
    )) ?? []
  );
}

export async function fetchWalletData(address: string): Promise<WalletData> {
  const addr = address.trim().toLowerCase();

  try {
    const [
      profile,
      lbAll,
      lbDay,
      lbWeek,
      lbMonth,
      positions,
      closedPositions,
      portfolioValue,
      marketsTraded,
      recentActivity,
    ] = await Promise.all([
      fetchProfile(addr),
      fetchLeaderboard(addr, "ALL"),
      fetchLeaderboard(addr, "DAY"),
      fetchLeaderboard(addr, "WEEK"),
      fetchLeaderboard(addr, "MONTH"),
      fetchPositions(addr),
      fetchClosedPositions(addr),
      fetchPortfolioValue(addr),
      fetchMarketsTraded(addr),
      fetchActivity(addr),
    ]);

    return {
      address: addr,
      profile,
      leaderboard: {
        all: lbAll,
        day: lbDay,
        week: lbWeek,
        month: lbMonth,
      },
      positions,
      closedPositions,
      portfolioValue,
      marketsTraded,
      recentActivity,
    };
  } catch (e) {
    return {
      address: addr,
      profile: null,
      leaderboard: { all: null, day: null, week: null, month: null },
      positions: [],
      closedPositions: [],
      portfolioValue: 0,
      marketsTraded: 0,
      recentActivity: [],
      error: e instanceof Error ? e.message : "Unknown error",
    };
  }
}
