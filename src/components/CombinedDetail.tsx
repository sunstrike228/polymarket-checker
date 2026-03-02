"use client";

import { WalletData } from "@/lib/types";
import { fmtUsd, fmtPct, shortAddr, timeAgo, pnlColor } from "@/lib/format";
import { useState } from "react";

interface Props {
  wallets: WalletData[];
}

type Tab = "positions" | "closed" | "activity";

function StatCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="bg-poly-card border border-poly-border rounded-xl p-4">
      <div className="text-xs text-poly-muted uppercase tracking-wider mb-1">{label}</div>
      <div className={`text-xl font-bold font-mono ${color || "text-poly-text"}`}>{value}</div>
      {sub && <div className="text-xs text-poly-muted mt-1">{sub}</div>}
    </div>
  );
}

export default function CombinedDetail({ wallets }: Props) {
  const [tab, setTab] = useState<Tab>("positions");

  // Aggregate all wallets
  const totalUsdcVolume = wallets.reduce((sum, w) => sum + w.usdcVolume, 0);
  const anyTruncated = wallets.some((w) => w.usdcVolumeTruncated);

  const totalSharesVol = wallets.reduce((sum, w) => {
    return sum + (w.leaderboard.all?.vol ?? 0);
  }, 0);

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

  // Period PnL (sum from leaderboard across all wallets)
  const totalPnlDay = wallets.reduce((sum, w) => sum + (w.leaderboard.day?.pnl ?? 0), 0);
  const totalPnlWeek = wallets.reduce((sum, w) => sum + (w.leaderboard.week?.pnl ?? 0), 0);
  const totalPnlMonth = wallets.reduce((sum, w) => sum + (w.leaderboard.month?.pnl ?? 0), 0);
  const totalVolDay = wallets.reduce((sum, w) => sum + (w.leaderboard.day?.vol ?? 0), 0);
  const totalVolWeek = wallets.reduce((sum, w) => sum + (w.leaderboard.week?.vol ?? 0), 0);
  const totalVolMonth = wallets.reduce((sum, w) => sum + (w.leaderboard.month?.vol ?? 0), 0);
  const hasDay = wallets.some((w) => w.leaderboard.day);
  const hasWeek = wallets.some((w) => w.leaderboard.week);
  const hasMonth = wallets.some((w) => w.leaderboard.month);

  const totalRecentTrades = allActivity.filter((a) => a.type === "TRADE").length;

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 rounded-full bg-poly-accent/20 flex items-center justify-center text-poly-accent text-lg font-bold">
          {wallets.length}
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">
            Combined Summary — {wallets.length} wallet{wallets.length !== 1 ? "s" : ""}
          </h2>
          <div className="text-xs text-poly-muted mt-1">
            Aggregated stats across all wallets
          </div>
        </div>
      </div>

      {/* Stat Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <StatCard
          label="Total USDC Volume"
          value={totalUsdcVolume ? fmtUsd(totalUsdcVolume) + (anyTruncated ? "+" : "") : "—"}
          sub={anyTruncated ? "Some wallets have 10K+ trades" : `${wallets.length} wallets`}
        />
        <StatCard
          label="Total Shares Volume"
          value={fmtUsd(totalSharesVol)}
          sub="Polymarket leaderboard"
        />
        <StatCard
          label="Total PnL (Net)"
          value={fmtUsd(totalNetPnl)}
          color={pnlColor(totalNetPnl)}
          sub={`${wallets.length} wallets combined`}
        />
        <StatCard
          label="Total Portfolio"
          value={fmtUsd(totalPortfolio)}
        />
        <StatCard
          label="Total Markets"
          value={String(totalMarkets)}
        />
        <StatCard
          label="Total PnL (Absolute)"
          value={fmtUsd(totalAbsPnl)}
          sub="Sum of |each position PnL|"
        />
      </div>

      {/* Period breakdown */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <StatCard
          label="PnL (24h)"
          value={hasDay ? fmtUsd(totalPnlDay) : "—"}
          sub={hasDay ? `Vol: ${fmtUsd(totalVolDay)}` : undefined}
          color={pnlColor(totalPnlDay)}
        />
        <StatCard
          label="PnL (7d)"
          value={hasWeek ? fmtUsd(totalPnlWeek) : "—"}
          sub={hasWeek ? `Vol: ${fmtUsd(totalVolWeek)}` : undefined}
          color={pnlColor(totalPnlWeek)}
        />
        <StatCard
          label="PnL (30d)"
          value={hasMonth ? fmtUsd(totalPnlMonth) : "—"}
          sub={hasMonth ? `Vol: ${fmtUsd(totalVolMonth)}` : undefined}
          color={pnlColor(totalPnlMonth)}
        />
      </div>

      {/* Extra stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatCard
          label="Open Positions"
          value={String(allPositions.length)}
          sub={`Across ${wallets.length} wallets`}
        />
        <StatCard
          label="Closed Positions"
          value={String(allClosedPositions.length)}
        />
        <StatCard
          label="Recent Trades"
          value={String(totalRecentTrades)}
          sub={`Last ${allActivity.length} activities`}
        />
        <StatCard
          label="Wallets"
          value={String(wallets.length)}
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-poly-card rounded-xl p-1 border border-poly-border w-fit">
        {(["positions", "closed", "activity"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm rounded-lg transition-colors ${
              tab === t
                ? "bg-poly-accent/10 text-poly-accent font-medium"
                : "text-poly-muted hover:text-poly-text"
            }`}
          >
            {t === "positions" && `Open (${allPositions.length})`}
            {t === "closed" && `Closed (${allClosedPositions.length})`}
            {t === "activity" && `Activity (${allActivity.length})`}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "positions" && (
        <div className="space-y-2">
          {allPositions.length === 0 ? (
            <div className="text-poly-muted text-sm py-8 text-center">No open positions</div>
          ) : (
            allPositions.map((p) => (
              <a
                key={`${p.walletAddr}-${p.asset}`}
                href={`https://polymarket.com/event/${p.eventSlug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 bg-poly-card border border-poly-border rounded-xl p-4 hover:border-poly-accent/30 transition-colors"
              >
                {p.icon && <img src={p.icon} alt="" className="w-8 h-8 rounded-lg flex-shrink-0" />}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-poly-text truncate">{p.title}</div>
                  <div className="text-xs text-poly-muted mt-0.5">
                    {p.outcome} · {p.size.toFixed(1)} shares @ {fmtUsd(p.avgPrice)}
                    <span className="ml-2 text-poly-accent/70">[{p.walletName}]</span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-sm font-mono">{fmtUsd(p.currentValue)}</div>
                  <div className={`text-xs font-mono ${pnlColor(p.cashPnl)}`}>
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
            <div className="text-poly-muted text-sm py-8 text-center">No closed positions</div>
          ) : (
            allClosedPositions.map((p, i) => (
              <a
                key={`${p.walletAddr}-${p.asset}-${p.timestamp}-${i}`}
                href={`https://polymarket.com/event/${p.eventSlug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 bg-poly-card border border-poly-border rounded-xl p-4 hover:border-poly-accent/30 transition-colors"
              >
                {p.icon && <img src={p.icon} alt="" className="w-8 h-8 rounded-lg flex-shrink-0" />}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-poly-text truncate">{p.title}</div>
                  <div className="text-xs text-poly-muted mt-0.5">
                    {p.outcome} · {p.curPrice === 1 ? "Won" : "Lost"} · {timeAgo(p.timestamp)}
                    <span className="ml-2 text-poly-accent/70">[{p.walletName}]</span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className={`text-sm font-mono ${pnlColor(p.realizedPnl)}`}>
                    {fmtUsd(p.realizedPnl)}
                  </div>
                </div>
              </a>
            ))
          )}
        </div>
      )}

      {tab === "activity" && (
        <div className="space-y-2">
          {allActivity.length === 0 ? (
            <div className="text-poly-muted text-sm py-8 text-center">No recent activity</div>
          ) : (
            allActivity.map((a, i) => (
              <div
                key={`${a.walletAddr}-${a.transactionHash}-${i}`}
                className="flex items-center gap-4 bg-poly-card border border-poly-border rounded-xl p-4"
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                  a.type === "TRADE"
                    ? a.side === "BUY"
                      ? "bg-poly-green/10 text-poly-green"
                      : "bg-poly-red/10 text-poly-red"
                    : "bg-poly-yellow/10 text-poly-yellow"
                }`}>
                  {a.type === "TRADE" ? (a.side === "BUY" ? "B" : "S") : a.type.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-poly-text truncate">{a.title}</div>
                  <div className="text-xs text-poly-muted mt-0.5">
                    {a.type} · {a.outcome} · {timeAgo(a.timestamp)}
                    <span className="ml-2 text-poly-accent/70">[{a.walletName}]</span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-sm font-mono">{fmtUsd(a.usdcSize)}</div>
                  <div className="text-xs text-poly-muted">
                    {a.size.toFixed(1)} @ {a.price.toFixed(3)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
