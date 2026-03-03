"use client";

import { WalletData } from "@/lib/types";
import { fmtUsd, fmtPct, shortAddr, timeAgo, fmtRatio, fmtDays } from "@/lib/format";
import { computeDerivedStats } from "@/lib/stats";
import { useState } from "react";

interface Props {
  wallets: WalletData[];
}

type Tab = "positions" | "closed" | "activity";

function StatCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="bg-sw-card border border-sw-border rounded-xl p-4 card-hover">
      <div className="text-[10px] text-sw-muted uppercase tracking-[0.15em] font-display mb-1.5">{label}</div>
      <div className={`text-xl font-bold font-mono ${color || "text-sw-text"}`}>{value}</div>
      {sub && <div className="text-[10px] text-sw-muted mt-1 tracking-wider">{sub}</div>}
    </div>
  );
}

function swPnl(val: number): string {
  if (val > 0) return "text-sw-green text-glow-green";
  if (val < 0) return "text-sw-red text-glow-red";
  return "text-sw-muted";
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-2 mb-3">
      <h3 className="font-display text-[10px] tracking-[0.2em] text-sw-muted uppercase">{children}</h3>
    </div>
  );
}

export default function CombinedDetail({ wallets }: Props) {
  const [tab, setTab] = useState<Tab>("positions");
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Aggregate all wallets
  const totalUsdcVolume = wallets.reduce((sum, w) => sum + w.usdcVolume, 0);
  const anyTruncated = wallets.some((w) => w.usdcVolumeTruncated);

  const totalSharesVol = wallets.reduce((sum, w) => sum + (w.leaderboard.all?.vol ?? 0), 0);

  const totalNetPnl = wallets.reduce((sum, w) => {
    return sum + w.positions.reduce((s, p) => s + p.cashPnl, 0) +
      w.closedPositions.reduce((s, p) => s + p.realizedPnl, 0);
  }, 0);

  const totalAbsPnl = wallets.reduce((sum, w) => {
    return sum + w.positions.reduce((s, p) => s + Math.abs(p.cashPnl), 0) +
      w.closedPositions.reduce((s, p) => s + Math.abs(p.realizedPnl), 0);
  }, 0);

  const totalPortfolio = wallets.reduce((sum, w) => sum + w.portfolioValue, 0);
  const totalMarkets = wallets.reduce((sum, w) => sum + w.marketsTraded, 0);

  const allPositions = wallets.flatMap((w) =>
    w.positions.map((p) => ({ ...p, walletAddr: w.address, walletName: w.profile?.name || w.profile?.pseudonym || shortAddr(w.address) }))
  );
  const allClosedPositions = wallets.flatMap((w) =>
    w.closedPositions.map((p) => ({ ...p, walletAddr: w.address, walletName: w.profile?.name || w.profile?.pseudonym || shortAddr(w.address) }))
  );
  const allActivity = wallets
    .flatMap((w) =>
      w.recentActivity.map((a) => ({ ...a, walletAddr: w.address, walletName: w.profile?.name || w.profile?.pseudonym || shortAddr(w.address) }))
    )
    .sort((a, b) => b.timestamp - a.timestamp);

  // Period PnL
  const totalPnlDay = wallets.reduce((sum, w) => sum + (w.leaderboard.day?.pnl ?? 0), 0);
  const totalPnlWeek = wallets.reduce((sum, w) => sum + (w.leaderboard.week?.pnl ?? 0), 0);
  const totalPnlMonth = wallets.reduce((sum, w) => sum + (w.leaderboard.month?.pnl ?? 0), 0);
  const totalVolDay = wallets.reduce((sum, w) => sum + (w.leaderboard.day?.vol ?? 0), 0);
  const totalVolWeek = wallets.reduce((sum, w) => sum + (w.leaderboard.week?.vol ?? 0), 0);
  const totalVolMonth = wallets.reduce((sum, w) => sum + (w.leaderboard.month?.vol ?? 0), 0);
  const hasDay = wallets.some((w) => w.leaderboard.day);
  const hasWeek = wallets.some((w) => w.leaderboard.week);
  const hasMonth = wallets.some((w) => w.leaderboard.month);

  // Derived stats
  const stats = computeDerivedStats(wallets);

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 rounded-full bg-sw-neon/20 border border-sw-neon/50 flex items-center justify-center text-sw-neon text-lg font-display font-black shadow-neon">
          {wallets.length}
        </div>
        <div>
          <h2 className="font-display text-lg font-bold tracking-wider text-sw-text-bright">
            COMBINED <span className="text-sw-cyan text-glow-cyan">OVERVIEW</span>
          </h2>
          <div className="text-xs text-sw-muted tracking-wider font-mono">
            {wallets.length} wallet{wallets.length !== 1 ? "s" : ""} aggregated
          </div>
        </div>
      </div>

      <div className="neon-line mb-6" />

      {/* ═══ Main Stat Grid ═══ */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
        <StatCard
          label="USDC Volume"
          value={totalUsdcVolume ? fmtUsd(totalUsdcVolume) + (anyTruncated ? "+" : "") : "—"}
          color="text-sw-cyan text-glow-cyan"
          sub={anyTruncated ? "some wallets 10K+ trades" : `${wallets.length} wallets`}
        />
        <StatCard
          label="Shares Volume"
          value={fmtUsd(totalSharesVol)}
          sub="polymarket leaderboard"
        />
        <StatCard
          label="Net PnL"
          value={fmtUsd(totalNetPnl)}
          color={swPnl(totalNetPnl)}
          sub={`${wallets.length} wallets combined`}
        />
        <StatCard
          label="PnL (Absolute)"
          value={fmtUsd(totalAbsPnl)}
          color="text-sw-yellow"
          sub="sum of |each PnL|"
        />
        <StatCard
          label="Portfolio Value"
          value={fmtUsd(totalPortfolio)}
          color="text-sw-purple text-glow-purple"
        />
        <StatCard
          label="Markets Traded"
          value={String(totalMarkets)}
        />
        <StatCard
          label="Active Days"
          value={String(stats.activeDays)}
          color="text-sw-cyan"
          sub={`${stats.activeMonths} active month${stats.activeMonths !== 1 ? "s" : ""}`}
        />
        <StatCard
          label="Wallets"
          value={String(wallets.length)}
          color="text-sw-neon"
        />
      </div>

      {/* Period breakdown */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <StatCard
          label="PnL (24h)"
          value={hasDay ? fmtUsd(totalPnlDay) : "—"}
          sub={hasDay ? `vol: ${fmtUsd(totalVolDay)}` : undefined}
          color={swPnl(totalPnlDay)}
        />
        <StatCard
          label="PnL (7d)"
          value={hasWeek ? fmtUsd(totalPnlWeek) : "—"}
          sub={hasWeek ? `vol: ${fmtUsd(totalVolWeek)}` : undefined}
          color={swPnl(totalPnlWeek)}
        />
        <StatCard
          label="PnL (30d)"
          value={hasMonth ? fmtUsd(totalPnlMonth) : "—"}
          sub={hasMonth ? `vol: ${fmtUsd(totalVolMonth)}` : undefined}
          color={swPnl(totalPnlMonth)}
        />
      </div>

      {/* Quick stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatCard label="Open Positions" value={String(allPositions.length)} sub={`across ${wallets.length} wallets`} />
        <StatCard label="Closed Positions" value={String(allClosedPositions.length)} />
        <StatCard label="Recent Trades" value={String(allActivity.filter((a) => a.type === "TRADE").length)} sub={`last ${allActivity.length} activities`} />
        <StatCard
          label="Win Rate"
          value={stats.winRate !== null ? `${stats.winRate.toFixed(1)}%` : "—"}
          sub={`${stats.winCount}W / ${stats.lossCount}L`}
          color={stats.winRate !== null && stats.winRate >= 50 ? "text-sw-green text-glow-green" : stats.winRate !== null ? "text-sw-red text-glow-red" : undefined}
        />
      </div>

      {/* ═══ CRAZY ADVANCED STUFF Toggle ═══ */}
      <div className="flex justify-center mb-6">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={`font-display text-xs tracking-[0.2em] uppercase px-6 py-3 rounded-xl border transition-all ${
            showAdvanced
              ? "bg-sw-neon/10 border-sw-neon text-sw-neon shadow-neon"
              : "bg-sw-card border-sw-border text-sw-muted hover:border-sw-neon/50 hover:text-sw-neon"
          }`}
        >
          {showAdvanced ? "▼ HIDE ADVANCED STATS" : "▶ CRAZY ADVANCED STUFF"}
        </button>
      </div>

      {/* ═══ Advanced Stats (hidden by default) ═══ */}
      {showAdvanced && (
        <div className="animate-fade-in">
          {/* Trading Performance */}
          <SectionLabel>Trading Performance</SectionLabel>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
            <StatCard
              label="Best Trade"
              value={stats.bestTrade !== null ? fmtUsd(stats.bestTrade) : "—"}
              color="text-sw-green text-glow-green"
            />
            <StatCard
              label="Worst Trade"
              value={stats.worstTrade !== null ? fmtUsd(stats.worstTrade) : "—"}
              color="text-sw-red text-glow-red"
            />
            <StatCard
              label="Avg Win"
              value={stats.avgWin !== null ? fmtUsd(stats.avgWin) : "—"}
              color="text-sw-green"
            />
            <StatCard
              label="Avg Loss"
              value={stats.avgLoss !== null ? fmtUsd(stats.avgLoss) : "—"}
              color="text-sw-red"
            />
            <StatCard
              label="Profit Factor"
              value={stats.profitFactor !== null ? fmtRatio(stats.profitFactor) : "—"}
              sub={stats.profitFactor !== null && stats.profitFactor >= 1.5 ? "healthy" : stats.profitFactor !== null ? "needs work" : undefined}
              color="text-sw-yellow"
            />
            <StatCard
              label="ROI"
              value={stats.roi !== null ? fmtPct(stats.roi) : "—"}
              color={stats.roi !== null ? (stats.roi >= 0 ? "text-sw-green text-glow-green" : "text-sw-red text-glow-red") : undefined}
              sub="net pnl / capital"
            />
          </div>

          {/* Position Sizing */}
          <SectionLabel>Position Sizing</SectionLabel>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <StatCard
              label="Capital Deployed"
              value={fmtUsd(stats.capitalDeployed)}
              color="text-sw-cyan text-glow-cyan"
              sub="total bought across all"
            />
            <StatCard
              label="Avg Position Size"
              value={stats.avgPositionSize !== null ? fmtUsd(stats.avgPositionSize) : "—"}
            />
            <StatCard
              label="Largest Open"
              value={stats.largestPosition !== null ? fmtUsd(stats.largestPosition) : "—"}
              sub={stats.largestPositionTitle ? stats.largestPositionTitle.slice(0, 30) + (stats.largestPositionTitle.length > 30 ? "..." : "") : undefined}
              color="text-sw-purple text-glow-purple"
            />
            <StatCard
              label="Unrealized PnL"
              value={fmtUsd(stats.unrealizedPnl)}
              color={swPnl(stats.unrealizedPnl)}
              sub="open positions only"
            />
          </div>

          {/* Activity Analytics */}
          <SectionLabel>Activity Analytics</SectionLabel>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
            <StatCard
              label="Buy/Sell Ratio"
              value={stats.buySellRatio !== null ? fmtRatio(stats.buySellRatio) : "—"}
              color="text-sw-cyan"
            />
            <StatCard
              label="Avg Trade Size"
              value={stats.avgTradeSize !== null ? fmtUsd(stats.avgTradeSize) : "—"}
            />
            <StatCard
              label="Trades / Day"
              value={stats.tradesPerDay !== null ? stats.tradesPerDay.toFixed(1) : "—"}
              color="text-sw-yellow"
            />
            <StatCard
              label="Last Trade"
              value={stats.daysSinceLastTrade !== null ? fmtDays(stats.daysSinceLastTrade) : "—"}
              sub="since last activity"
            />
            <StatCard
              label="Top Market"
              value={stats.mostTradedMarket ? stats.mostTradedMarket.slice(0, 18) + (stats.mostTradedMarket.length > 18 ? "..." : "") : "—"}
              sub={stats.mostTradedMarketCount > 0 ? `${stats.mostTradedMarketCount} activities` : undefined}
              color="text-sw-neon"
            />
            <StatCard
              label="Active Days"
              value={String(stats.activeDays)}
              sub={`${stats.activeMonths} months`}
              color="text-sw-cyan"
            />
          </div>
        </div>
      )}

      <div className="neon-line mb-6" />

      {/* ═══ Tabs ═══ */}
      <div className="flex gap-1 mb-4 bg-sw-card rounded-xl p-1 border border-sw-border w-fit">
        {(["positions", "closed", "activity"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-xs rounded-lg transition-all font-display tracking-wider uppercase ${
              tab === t
                ? "bg-sw-neon/10 text-sw-neon font-bold shadow-neon"
                : "text-sw-muted hover:text-sw-text"
            }`}
          >
            {t === "positions" && `Open (${allPositions.length})`}
            {t === "closed" && `Closed (${allClosedPositions.length})`}
            {t === "activity" && `Activity (${allActivity.length})`}
          </button>
        ))}
      </div>

      {/* ═══ Tab content ═══ */}
      {tab === "positions" && (
        <div className="space-y-2">
          {allPositions.length === 0 ? (
            <div className="text-sw-muted text-sm py-8 text-center tracking-wider">No open positions</div>
          ) : (
            allPositions.map((p) => (
              <a key={`${p.walletAddr}-${p.asset}`} href={`https://polymarket.com/event/${p.eventSlug}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 bg-sw-card border border-sw-border rounded-xl p-4 card-hover">
                {p.icon && <img src={p.icon} alt="" className="w-8 h-8 rounded-lg flex-shrink-0" />}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-sw-text truncate">{p.title}</div>
                  <div className="text-xs text-sw-muted mt-0.5">
                    {p.outcome} · {p.size.toFixed(1)} shares @ {fmtUsd(p.avgPrice)}
                    <span className="ml-2 text-sw-purple/70">[{p.walletName}]</span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-sm font-mono text-sw-text">{fmtUsd(p.currentValue)}</div>
                  <div className={`text-xs font-mono ${swPnl(p.cashPnl)}`}>
                    {fmtUsd(p.cashPnl)} ({fmtPct(p.percentPnl)})
                  </div>
                </div>
              </a>
            ))
          )}
        </div>
      )}

      {tab === "closed" && (
        <div className="space-y-2">
          {allClosedPositions.length === 0 ? (
            <div className="text-sw-muted text-sm py-8 text-center tracking-wider">No closed positions</div>
          ) : (
            allClosedPositions.map((p, i) => (
              <a key={`${p.walletAddr}-${p.asset}-${p.timestamp}-${i}`} href={`https://polymarket.com/event/${p.eventSlug}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 bg-sw-card border border-sw-border rounded-xl p-4 card-hover">
                {p.icon && <img src={p.icon} alt="" className="w-8 h-8 rounded-lg flex-shrink-0" />}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-sw-text truncate">{p.title}</div>
                  <div className="text-xs text-sw-muted mt-0.5">
                    {p.outcome} · {p.curPrice === 1 ? "Won" : "Lost"} · {timeAgo(p.timestamp)}
                    <span className="ml-2 text-sw-purple/70">[{p.walletName}]</span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className={`text-sm font-mono ${swPnl(p.realizedPnl)}`}>{fmtUsd(p.realizedPnl)}</div>
                </div>
              </a>
            ))
          )}
        </div>
      )}

      {tab === "activity" && (
        <div className="space-y-2">
          {allActivity.length === 0 ? (
            <div className="text-sw-muted text-sm py-8 text-center tracking-wider">No recent activity</div>
          ) : (
            allActivity.map((a, i) => (
              <div key={`${a.walletAddr}-${a.transactionHash}-${i}`} className="flex items-center gap-4 bg-sw-card border border-sw-border rounded-xl p-4 card-hover">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold font-display flex-shrink-0 ${
                  a.type === "TRADE"
                    ? a.side === "BUY" ? "bg-sw-green/10 text-sw-green border border-sw-green/30" : "bg-sw-red/10 text-sw-red border border-sw-red/30"
                    : "bg-sw-yellow/10 text-sw-yellow border border-sw-yellow/30"
                }`}>
                  {a.type === "TRADE" ? (a.side === "BUY" ? "B" : "S") : a.type.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-sw-text truncate">{a.title}</div>
                  <div className="text-xs text-sw-muted mt-0.5">
                    {a.type} · {a.outcome} · {timeAgo(a.timestamp)}
                    <span className="ml-2 text-sw-purple/70">[{a.walletName}]</span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-sm font-mono text-sw-cyan">{fmtUsd(a.usdcSize)}</div>
                  <div className="text-xs text-sw-muted font-mono">{a.size.toFixed(1)} @ {a.price.toFixed(3)}</div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
