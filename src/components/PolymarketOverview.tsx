"use client";

import { useState, useEffect } from "react";
import {
  BarChart, Bar, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";

/* eslint-disable @typescript-eslint/no-explicit-any */

interface OverviewStats {
  totalVolume: number;
  totalVolume24h: number;
  totalVolume1wk: number;
  totalVolume1mo: number;
  totalLiquidity: number;
  activeMarkets: number;
  totalEvents: number;
}

interface Category {
  name: string;
  count: number;
  volume: number;
  volume24h: number;
}

interface TopMarket {
  question: string;
  slug: string;
  icon: string;
  volume24h: number;
  volume: number;
  liquidity: number;
  outcomes: string;
  outcomePrices: string;
}

interface TopEvent {
  title: string;
  slug: string;
  volume24h: number;
  volume: number;
  liquidity: number;
  marketsCount: number;
}

interface VolumeChartEntry {
  name: string;
  vol24h: number;
  volTotal: number;
  liquidity: number;
}

interface LeaderboardEntry {
  rank: string;
  userName: string;
  profileImage: string;
  vol: number;
  pnl: number;
}

interface StatsData {
  overview: OverviewStats;
  categories: Category[];
  topMarkets: TopMarket[];
  topEvents: TopEvent[];
  volumeChart: VolumeChartEntry[];
  leaderboard: {
    allTime: LeaderboardEntry[];
    daily: LeaderboardEntry[];
  };
}

const NEON_COLORS = ["#ff2d95", "#00f0ff", "#b44dff", "#ffe44d", "#00ff88", "#ff3355", "#ff6b35", "#44ffcc", "#ff44aa", "#8844ff"];

/* ── Hardcoded monthly volume data (approx. from Dune @filarm) ── */
const MONTHLY_VOLUME = [
  { month: "Jan 24", ctf: 8e6, neg: 2e6 },
  { month: "Feb 24", ctf: 10e6, neg: 3e6 },
  { month: "Mar 24", ctf: 15e6, neg: 5e6 },
  { month: "Apr 24", ctf: 18e6, neg: 7e6 },
  { month: "May 24", ctf: 25e6, neg: 10e6 },
  { month: "Jun 24", ctf: 40e6, neg: 20e6 },
  { month: "Jul 24", ctf: 100e6, neg: 100e6 },
  { month: "Aug 24", ctf: 150e6, neg: 250e6 },
  { month: "Sep 24", ctf: 250e6, neg: 950e6 },
  { month: "Oct 24", ctf: 350e6, neg: 1.65e9 },
  { month: "Nov 24", ctf: 250e6, neg: 1.35e9 },
  { month: "Dec 24", ctf: 180e6, neg: 620e6 },
  { month: "Jan 25", ctf: 200e6, neg: 500e6 },
  { month: "Feb 25", ctf: 150e6, neg: 350e6 },
  { month: "Mar 25", ctf: 180e6, neg: 320e6 },
  { month: "Apr 25", ctf: 170e6, neg: 330e6 },
  { month: "May 25", ctf: 200e6, neg: 300e6 },
  { month: "Jun 25", ctf: 180e6, neg: 320e6 },
  { month: "Jul 25", ctf: 200e6, neg: 500e6 },
  { month: "Aug 25", ctf: 180e6, neg: 420e6 },
  { month: "Sep 25", ctf: 300e6, neg: 700e6 },
  { month: "Oct 25", ctf: 400e6, neg: 1.1e9 },
  { month: "Nov 25", ctf: 600e6, neg: 1.9e9 },
  { month: "Dec 25", ctf: 800e6, neg: 2.7e9 },
  { month: "Jan 26", ctf: 1e9, neg: 3e9 },
  { month: "Feb 26", ctf: 500e6, neg: 2.5e9 },
];

/* ── Hardcoded monthly active wallets (approx. from Dune @filarm) ── */
const MONTHLY_WALLETS = [
  { month: "Jan 24", ctf: 800, neg: 200, unique: 900 },
  { month: "Feb 24", ctf: 1200, neg: 400, unique: 1400 },
  { month: "Mar 24", ctf: 2000, neg: 600, unique: 2200 },
  { month: "Apr 24", ctf: 3000, neg: 1000, unique: 3500 },
  { month: "May 24", ctf: 5000, neg: 2000, unique: 6000 },
  { month: "Jun 24", ctf: 8000, neg: 3000, unique: 9500 },
  { month: "Jul 24", ctf: 15000, neg: 8000, unique: 18000 },
  { month: "Aug 24", ctf: 20000, neg: 15000, unique: 28000 },
  { month: "Sep 24", ctf: 25000, neg: 25000, unique: 40000 },
  { month: "Oct 24", ctf: 30000, neg: 40000, unique: 55000 },
  { month: "Nov 24", ctf: 28000, neg: 35000, unique: 50000 },
  { month: "Dec 24", ctf: 20000, neg: 25000, unique: 35000 },
  { month: "Jan 25", ctf: 22000, neg: 28000, unique: 38000 },
  { month: "Feb 25", ctf: 18000, neg: 22000, unique: 32000 },
  { month: "Mar 25", ctf: 20000, neg: 25000, unique: 35000 },
  { month: "Apr 25", ctf: 22000, neg: 28000, unique: 38000 },
  { month: "May 25", ctf: 25000, neg: 30000, unique: 42000 },
  { month: "Jun 25", ctf: 28000, neg: 32000, unique: 45000 },
  { month: "Jul 25", ctf: 30000, neg: 35000, unique: 50000 },
  { month: "Aug 25", ctf: 35000, neg: 45000, unique: 60000 },
  { month: "Sep 25", ctf: 45000, neg: 55000, unique: 75000 },
  { month: "Oct 25", ctf: 50000, neg: 60000, unique: 85000 },
  { month: "Nov 25", ctf: 60000, neg: 70000, unique: 100000 },
  { month: "Dec 25", ctf: 70000, neg: 80000, unique: 120000 },
  { month: "Jan 26", ctf: 80000, neg: 90000, unique: 150000 },
  { month: "Feb 26", ctf: 50000, neg: 60000, unique: 90000 },
];

function fmtM(n: number | undefined | null): string {
  if (n == null || isNaN(n)) return "$0";
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

function StatBox({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="bg-sw-card/80 border border-sw-border rounded-xl p-4 card-hover backdrop-blur-sm">
      <div className="text-[10px] text-sw-muted uppercase tracking-[0.15em] font-display mb-1.5">{label}</div>
      <div className={`text-xl font-bold font-mono ${color || "text-sw-text"}`}>{value}</div>
      {sub && <div className="text-[10px] text-sw-muted mt-1 tracking-wider">{sub}</div>}
    </div>
  );
}

function fmtCount(n: number | undefined | null): string {
  if (n == null || isNaN(n)) return "0";
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return String(Math.round(n));
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-sw-bg/95 border border-sw-border rounded-lg p-3 text-xs backdrop-blur-sm">
      <div className="text-sw-text-bright font-mono mb-1">{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-sw-muted">{p.name}:</span>
          <span className="text-sw-text font-mono">{fmtM(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

const WalletTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-sw-bg/95 border border-sw-border rounded-lg p-3 text-xs backdrop-blur-sm">
      <div className="text-sw-text-bright font-mono mb-1">{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-sw-muted">{p.name}:</span>
          <span className="text-sw-text font-mono">{fmtCount(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

export default function PolymarketOverview() {
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lbTab, setLbTab] = useState<"allTime" | "daily">("allTime");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/polymarket-stats");
        if (!res.ok) throw new Error("Failed to fetch");
        setData(await res.json());
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4 animate-fade-in">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="skeleton h-32 rounded-xl" />
        ))}
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-sw-red/10 border border-sw-red/30 text-sw-red rounded-xl p-4 text-sm text-glow-red">
        Failed to load Polymarket stats: {error}
      </div>
    );
  }

  const { overview, topMarkets, topEvents, leaderboard } = data;

  return (
    <div className="animate-fade-in space-y-6">
      {/* ═══ Overview Stats ═══ */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        <StatBox label="24H Volume" value={fmtM(overview.totalVolume24h)} color="text-sw-cyan text-glow-cyan" sub="top 200 markets" />
        <StatBox label="7D Volume" value={fmtM(overview.totalVolume1wk)} color="text-sw-green text-glow-green" />
        <StatBox label="30D Volume" value={fmtM(overview.totalVolume1mo)} color="text-sw-purple text-glow-purple" />
        <StatBox label="Total Volume" value={fmtM(overview.totalVolume)} color="text-sw-neon text-glow-pink" sub="all time" />
        <StatBox label="Total Liquidity" value={fmtM(overview.totalLiquidity)} color="text-sw-yellow" />
        <StatBox label="Active Markets" value={String(overview.activeMarkets)} />
        <StatBox label="Active Events" value={String(overview.totalEvents)} />
        <StatBox label="Avg Mkt Volume" value={overview.activeMarkets > 0 ? fmtM(overview.totalVolume / overview.activeMarkets) : "—"} sub="per market" />
      </div>

      {/* ═══ Monthly Volume — Stacked Bar Chart ═══ */}
      <div className="bg-sw-card/60 border border-sw-border rounded-xl p-4 backdrop-blur-sm border-glow">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-[11px] tracking-[0.2em] text-sw-muted uppercase">Volume (USDC) — Order Matched</h3>
          <a href="https://dune.com/filarm/polymarket-activity" target="_blank" rel="noopener noreferrer" className="text-[9px] text-sw-muted/60 hover:text-sw-cyan transition-colors">source: dune.com/@filarm</a>
        </div>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={MONTHLY_VOLUME} margin={{ left: 10, right: 10, top: 5, bottom: 5 }}>
              <XAxis dataKey="month" tick={{ fontSize: 9, fill: "#8866aa" }} axisLine={{ stroke: "#b44dff33" }} tickLine={false} interval={2} />
              <YAxis tick={{ fontSize: 9, fill: "#8866aa" }} tickFormatter={(v) => fmtM(v)} width={55} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="ctf" name="CTF USDC" stackId="vol" fill="#4466ff" radius={[0, 0, 0, 0]} />
              <Bar dataKey="neg" name="NegRisk USDC" stackId="vol" fill="#ff6b35" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ═══ Active Wallets — Stacked Area Chart ═══ */}
      <div className="bg-sw-card/60 border border-sw-border rounded-xl p-4 backdrop-blur-sm border-glow">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-[11px] tracking-[0.2em] text-sw-muted uppercase">Polymarket Active Wallets</h3>
          <a href="https://dune.com/filarm/polymarket-activity" target="_blank" rel="noopener noreferrer" className="text-[9px] text-sw-muted/60 hover:text-sw-cyan transition-colors">source: dune.com/@filarm</a>
        </div>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={MONTHLY_WALLETS} margin={{ left: 10, right: 10, top: 5, bottom: 5 }}>
              <defs>
                <linearGradient id="walletGradCtf" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4466ff" stopOpacity={0.6} />
                  <stop offset="95%" stopColor="#4466ff" stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="walletGradNeg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ff6b35" stopOpacity={0.6} />
                  <stop offset="95%" stopColor="#ff6b35" stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="walletGradUnique" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ff2d95" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="#ff2d95" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" tick={{ fontSize: 9, fill: "#8866aa" }} axisLine={{ stroke: "#b44dff33" }} tickLine={false} interval={2} />
              <YAxis tick={{ fontSize: 9, fill: "#8866aa" }} tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v)} width={45} axisLine={false} tickLine={false} />
              <Tooltip content={<WalletTooltip />} />
              <Area type="monotone" dataKey="ctf" name="CTF Wallets" stroke="#4466ff" strokeWidth={1.5} fill="url(#walletGradCtf)" stackId="wallets" />
              <Area type="monotone" dataKey="neg" name="NegRisk Wallets" stroke="#ff6b35" strokeWidth={1.5} fill="url(#walletGradNeg)" stackId="wallets" />
              <Area type="monotone" dataKey="unique" name="Unique Wallets" stroke="#ff2d95" strokeWidth={2} fill="url(#walletGradUnique)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ═══ Top Events ═══ */}
      <div className="bg-sw-card/60 border border-sw-border rounded-xl p-4 backdrop-blur-sm">
        <h3 className="font-display text-[11px] tracking-[0.2em] text-sw-muted uppercase mb-4">Top Events by 24H Volume</h3>
        <div className="space-y-2">
          {topEvents.map((e, i) => (
            <a key={e.slug} href={`https://polymarket.com/event/${e.slug}`} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-3 bg-sw-card border border-sw-border rounded-xl p-3 card-hover">
              <div className="w-7 h-7 rounded-lg bg-sw-neon/10 border border-sw-neon/30 flex items-center justify-center text-xs font-display font-bold text-sw-neon flex-shrink-0">
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-sw-text truncate">{e.title}</div>
                <div className="text-[10px] text-sw-muted mt-0.5">{e.marketsCount} market{e.marketsCount !== 1 ? "s" : ""} · liq: {fmtM(e.liquidity)}</div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-sm font-mono text-sw-cyan">{fmtM(e.volume24h)}</div>
                <div className="text-[10px] text-sw-muted font-mono">total: {fmtM(e.volume)}</div>
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* ═══ Top Markets ═══ */}
      <div className="bg-sw-card/60 border border-sw-border rounded-xl p-4 backdrop-blur-sm">
        <h3 className="font-display text-[11px] tracking-[0.2em] text-sw-muted uppercase mb-4">Top Markets by 24H Volume</h3>
        <div className="space-y-2">
          {topMarkets.map((m, i) => {
            let prices: number[] = [];
            try { prices = JSON.parse(m.outcomePrices); } catch { /* */ }
            const yesPrice = prices[0] ?? 0;
            return (
              <a key={m.slug} href={`https://polymarket.com/event/${m.slug}`} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-3 bg-sw-card border border-sw-border rounded-xl p-3 card-hover">
                {m.icon ? (
                  <img src={m.icon} alt="" className="w-8 h-8 rounded-lg flex-shrink-0" />
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-sw-border/50 flex-shrink-0 flex items-center justify-center text-xs font-bold text-sw-muted">{i + 1}</div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-sw-text truncate">{m.question}</div>
                  <div className="text-[10px] text-sw-muted mt-0.5">liq: {fmtM(m.liquidity)}</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-sm font-mono text-sw-cyan">{fmtM(m.volume24h)}</div>
                  <div className={`text-xs font-mono ${yesPrice >= 0.5 ? "text-sw-green" : "text-sw-red"}`}>
                    Yes: {(yesPrice * 100).toFixed(1)}%
                  </div>
                </div>
              </a>
            );
          })}
        </div>
      </div>

      {/* ═══ Leaderboard ═══ */}
      <div className="bg-sw-card/60 border border-sw-border rounded-xl p-4 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-[11px] tracking-[0.2em] text-sw-muted uppercase">Top Traders</h3>
          <div className="flex gap-1 bg-sw-card rounded-lg p-0.5 border border-sw-border">
            <button onClick={() => setLbTab("allTime")} className={`px-3 py-1 text-[10px] rounded font-display tracking-wider uppercase transition-all ${lbTab === "allTime" ? "bg-sw-neon/10 text-sw-neon" : "text-sw-muted hover:text-sw-text"}`}>
              All Time
            </button>
            <button onClick={() => setLbTab("daily")} className={`px-3 py-1 text-[10px] rounded font-display tracking-wider uppercase transition-all ${lbTab === "daily" ? "bg-sw-neon/10 text-sw-neon" : "text-sw-muted hover:text-sw-text"}`}>
              24H
            </button>
          </div>
        </div>
        <div className="space-y-2">
          {(leaderboard[lbTab] || []).map((t, i) => (
            <div key={t.userName + i} className="flex items-center gap-3 bg-sw-card border border-sw-border rounded-xl p-3 card-hover">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-display font-bold flex-shrink-0 ${
                i === 0 ? "bg-sw-yellow/20 text-sw-yellow border border-sw-yellow/50" :
                i === 1 ? "bg-sw-text/10 text-sw-text border border-sw-text/30" :
                i === 2 ? "bg-sw-neon/10 text-sw-neon border border-sw-neon/30" :
                "bg-sw-card border border-sw-border text-sw-muted"
              }`}>
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-sw-text font-mono">{t.userName || "Anonymous"}</div>
                <div className="text-[10px] text-sw-muted">vol: {fmtM(t.vol)}</div>
              </div>
              <div className={`text-sm font-mono font-bold ${t.pnl >= 0 ? "text-sw-green text-glow-green" : "text-sw-red text-glow-red"}`}>
                {t.pnl >= 0 ? "+" : ""}{fmtM(t.pnl)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
