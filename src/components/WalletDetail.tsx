"use client";

import { WalletData } from "@/lib/types";
import { fmtUsd, fmtPct, shortAddr, timeAgo, pnlColor } from "@/lib/format";
import { useState } from "react";

interface Props {
  wallet: WalletData;
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

export default function WalletDetail({ wallet: w }: Props) {
  const [tab, setTab] = useState<Tab>("positions");
  const lb = w.leaderboard;

  // Total PnL = sum of absolute values of all position PnLs
  const totalAbsPnl =
    w.positions.reduce((sum, p) => sum + Math.abs(p.cashPnl), 0) +
    w.closedPositions.reduce((sum, p) => sum + Math.abs(p.realizedPnl), 0);

  const accountAge = w.profile?.createdAt
    ? Math.max(0, Math.floor((Date.now() - new Date(w.profile.createdAt).getTime()) / (1000 * 60 * 60 * 24)))
    : null;

  // Use earliest activity timestamp as fallback for account age
  const earliestActivity = w.recentActivity.length > 0
    ? Math.min(...w.recentActivity.map((a) => a.timestamp))
    : null;
  const fallbackAge = earliestActivity
    ? Math.max(0, Math.floor((Date.now() / 1000 - earliestActivity) / 86400))
    : null;
  const displayAge = accountAge ?? fallbackAge;

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        {w.profile?.profileImage ? (
          <img src={w.profile.profileImage} alt="" className="w-12 h-12 rounded-full" />
        ) : (
          <div className="w-12 h-12 rounded-full bg-poly-border flex items-center justify-center text-poly-muted text-lg">?</div>
        )}
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white">
              {w.profile?.name || w.profile?.pseudonym || shortAddr(w.address)}
            </h2>
            {w.profile?.verifiedBadge && (
              <span className="text-poly-accent text-xs bg-poly-accent/10 px-2 py-0.5 rounded-full">Verified</span>
            )}
            {lb.all?.rank && (
              <span className="text-poly-yellow text-xs bg-poly-yellow/10 px-2 py-0.5 rounded-full">
                Rank #{lb.all.rank}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-xs font-mono text-poly-muted">{w.address}</span>
            <button
              onClick={() => navigator.clipboard.writeText(w.address)}
              className="text-xs text-poly-muted hover:text-poly-accent transition-colors"
            >
              Copy
            </button>
            <a
              href={`https://polymarket.com/profile/${w.address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-poly-accent hover:underline"
            >
              Polymarket
            </a>
          </div>
        </div>
      </div>

      {/* Stat Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <StatCard
          label="USDC Volume"
          value={w.usdcVolume ? fmtUsd(w.usdcVolume) + (w.usdcVolumeTruncated ? "+" : "") : "—"}
          sub={w.usdcVolumeTruncated ? "10K+ trades, may be higher" : undefined}
        />
        <StatCard
          label="Shares Volume"
          value={lb.all ? fmtUsd(lb.all.vol) : "—"}
          sub="Notional"
        />
        <StatCard
          label="PnL (All Time)"
          value={lb.all ? fmtUsd(lb.all.pnl) : "—"}
          color={pnlColor(lb.all?.pnl ?? 0)}
        />
        <StatCard
          label="Portfolio Value"
          value={fmtUsd(w.portfolioValue)}
        />
        <StatCard
          label="Markets Traded"
          value={String(w.marketsTraded)}
        />
        <StatCard
          label="Account Age"
          value={displayAge !== null ? `${displayAge}d` : "—"}
          sub={w.profile?.createdAt ? new Date(w.profile.createdAt).toLocaleDateString() : undefined}
        />
      </div>

      {/* Period breakdown */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <StatCard
          label="PnL (24h)"
          value={lb.day ? fmtUsd(lb.day.pnl) : "—"}
          sub={lb.day ? `Vol: ${fmtUsd(lb.day.vol)}` : undefined}
          color={pnlColor(lb.day?.pnl ?? 0)}
        />
        <StatCard
          label="PnL (7d)"
          value={lb.week ? fmtUsd(lb.week.pnl) : "—"}
          sub={lb.week ? `Vol: ${fmtUsd(lb.week.vol)}` : undefined}
          color={pnlColor(lb.week?.pnl ?? 0)}
        />
        <StatCard
          label="PnL (30d)"
          value={lb.month ? fmtUsd(lb.month.pnl) : "—"}
          sub={lb.month ? `Vol: ${fmtUsd(lb.month.vol)}` : undefined}
          color={pnlColor(lb.month?.pnl ?? 0)}
        />
      </div>

      {/* Extra stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatCard
          label="Total PnL (Absolute)"
          value={fmtUsd(totalAbsPnl)}
          sub="Sum of |each position PnL|"
        />
        <StatCard
          label="Open Positions"
          value={String(w.positions.length)}
        />
        <StatCard
          label="Recent Trades"
          value={String(w.recentActivity.filter((a) => a.type === "TRADE").length)}
          sub={`Last ${w.recentActivity.length} activities`}
        />
        <StatCard
          label="Closed Positions"
          value={String(w.closedPositions.length)}
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
            {t === "positions" && `Open (${w.positions.length})`}
            {t === "closed" && `Closed (${w.closedPositions.length})`}
            {t === "activity" && `Activity (${w.recentActivity.length})`}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "positions" && (
        <div className="space-y-2">
          {w.positions.length === 0 ? (
            <div className="text-poly-muted text-sm py-8 text-center">No open positions</div>
          ) : (
            w.positions.map((p) => (
              <a
                key={p.asset}
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
          {w.closedPositions.length === 0 ? (
            <div className="text-poly-muted text-sm py-8 text-center">No closed positions</div>
          ) : (
            w.closedPositions.map((p) => (
              <a
                key={`${p.asset}-${p.timestamp}`}
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
          {w.recentActivity.length === 0 ? (
            <div className="text-poly-muted text-sm py-8 text-center">No recent activity</div>
          ) : (
            w.recentActivity.map((a, i) => (
              <div
                key={`${a.transactionHash}-${i}`}
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
