import { WalletData } from "./types";

export interface DerivedStats {
  // Trading performance
  winRate: number | null;
  winCount: number;
  lossCount: number;
  bestTrade: number | null;
  worstTrade: number | null;
  avgWin: number | null;
  avgLoss: number | null;
  profitFactor: number | null;

  // Position sizing
  capitalDeployed: number;
  avgPositionSize: number | null;
  largestPosition: number | null;
  largestPositionTitle: string | null;
  unrealizedPnl: number;

  // Activity analytics
  roi: number | null;
  buySellRatio: number | null;
  avgTradeSize: number | null;
  tradesPerDay: number | null;
  mostTradedMarket: string | null;
  mostTradedMarketCount: number;
  daysSinceLastTrade: number | null;

  // Time metrics
  activeDays: number;
  activeMonths: number;
}

export function computeDerivedStats(wallets: WalletData[]): DerivedStats {
  const allClosed = wallets.flatMap((w) => w.closedPositions);
  const allOpen = wallets.flatMap((w) => w.positions);
  const allActivity = wallets.flatMap((w) => w.recentActivity);
  const trades = allActivity.filter((a) => a.type === "TRADE");

  // ── Win/Loss ──
  const wins = allClosed.filter((p) => p.curPrice === 1);
  const losses = allClosed.filter((p) => p.curPrice !== 1);
  const winRate = allClosed.length > 0 ? (wins.length / allClosed.length) * 100 : null;

  // ── PnL stats from closed ──
  const positivePnls = allClosed.filter((p) => p.realizedPnl > 0);
  const negativePnls = allClosed.filter((p) => p.realizedPnl < 0);
  const bestTrade = allClosed.length > 0 ? Math.max(...allClosed.map((p) => p.realizedPnl)) : null;
  const worstTrade = allClosed.length > 0 ? Math.min(...allClosed.map((p) => p.realizedPnl)) : null;
  const avgWin =
    positivePnls.length > 0
      ? positivePnls.reduce((s, p) => s + p.realizedPnl, 0) / positivePnls.length
      : null;
  const avgLoss =
    negativePnls.length > 0
      ? negativePnls.reduce((s, p) => s + p.realizedPnl, 0) / negativePnls.length
      : null;
  const sumWins = positivePnls.reduce((s, p) => s + p.realizedPnl, 0);
  const sumLosses = Math.abs(negativePnls.reduce((s, p) => s + p.realizedPnl, 0));
  const profitFactor = sumLosses > 0 ? sumWins / sumLosses : null;

  // ── Position stats ──
  const allSizes = [...allOpen.map((p) => p.totalBought), ...allClosed.map((p) => p.totalBought)];
  const avgPositionSize =
    allSizes.length > 0 ? allSizes.reduce((s, v) => s + v, 0) / allSizes.length : null;
  const largestOpen =
    allOpen.length > 0
      ? allOpen.reduce((max, p) => (p.currentValue > max.currentValue ? p : max), allOpen[0])
      : null;
  const unrealizedPnl = allOpen.reduce((s, p) => s + p.cashPnl, 0);

  // ── Capital & ROI ──
  const capitalDeployed =
    allOpen.reduce((s, p) => s + p.totalBought, 0) +
    allClosed.reduce((s, p) => s + p.totalBought, 0);
  const netPnl =
    allOpen.reduce((s, p) => s + p.cashPnl, 0) +
    allClosed.reduce((s, p) => s + p.realizedPnl, 0);
  const roi = capitalDeployed > 0 ? (netPnl / capitalDeployed) * 100 : null;

  // ── Activity stats ──
  const buys = trades.filter((t) => t.side === "BUY").length;
  const sells = trades.filter((t) => t.side === "SELL").length;
  const buySellRatio = sells > 0 ? buys / sells : null;
  const avgTradeSize =
    trades.length > 0 ? trades.reduce((s, t) => s + t.usdcSize, 0) / trades.length : null;

  // Trades per day
  const earliestCreated = wallets
    .filter((w) => w.profile?.createdAt)
    .map((w) => new Date(w.profile!.createdAt).getTime());
  const accountStartMs = earliestCreated.length > 0 ? Math.min(...earliestCreated) : null;
  const accountAgeDays = accountStartMs
    ? Math.max(1, (Date.now() - accountStartMs) / (1000 * 86400))
    : null;
  const tradesPerDay = accountAgeDays && trades.length > 0 ? trades.length / accountAgeDays : null;

  // Most traded market
  const slugCounts: Record<string, { count: number; title: string }> = {};
  allActivity.forEach((a) => {
    if (!slugCounts[a.slug]) slugCounts[a.slug] = { count: 0, title: a.title };
    slugCounts[a.slug].count++;
  });
  const topSlug = Object.entries(slugCounts).sort(([, a], [, b]) => b.count - a.count)[0];

  // Days since last trade
  const allTimestamps = allActivity.map((a) => a.timestamp);
  const latestTs = allTimestamps.length > 0 ? Math.max(...allTimestamps) : null;
  const daysSinceLastTrade = latestTs ? Math.floor((Date.now() / 1000 - latestTs) / 86400) : null;

  // ── Active days / months ──
  const daySet = new Set<string>();
  const monthSet = new Set<string>();
  allActivity.forEach((a) => {
    const d = new Date(a.timestamp * 1000);
    daySet.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
    monthSet.add(`${d.getFullYear()}-${d.getMonth()}`);
  });

  return {
    winRate,
    winCount: wins.length,
    lossCount: losses.length,
    bestTrade,
    worstTrade,
    avgWin,
    avgLoss,
    profitFactor,
    capitalDeployed,
    avgPositionSize,
    largestPosition: largestOpen?.currentValue ?? null,
    largestPositionTitle: largestOpen?.title ?? null,
    unrealizedPnl,
    roi,
    buySellRatio,
    avgTradeSize,
    tradesPerDay,
    mostTradedMarket: topSlug ? topSlug[1].title : null,
    mostTradedMarketCount: topSlug ? topSlug[1].count : 0,
    daysSinceLastTrade,
    activeDays: daySet.size,
    activeMonths: monthSet.size,
  };
}
