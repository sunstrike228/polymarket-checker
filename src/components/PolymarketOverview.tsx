"use client";

import { useState, useEffect } from "react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
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

  const { overview, categories, topMarkets, topEvents, volumeChart, leaderboard } = data;

  // Pie chart data for categories
  const pieData = categories.slice(0, 8).map((c) => ({
    name: c.name,
    value: Math.round(c.volume24h),
  }));

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

      {/* ═══ Volume Overview — Area Chart ═══ */}
      <div className="bg-sw-card/60 border border-sw-border rounded-xl p-4 backdrop-blur-sm border-glow">
        <h3 className="font-display text-[11px] tracking-[0.2em] text-sw-muted uppercase mb-4">Polymarket Volume Overview</h3>
        <div className="h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={[
              { period: "24H", volume: overview.totalVolume24h },
              { period: "7D", volume: overview.totalVolume1wk },
              { period: "30D", volume: overview.totalVolume1mo },
              { period: "All Time", volume: overview.totalVolume },
            ]} margin={{ left: 10, right: 20, top: 10, bottom: 5 }}>
              <defs>
                <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00f0ff" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#00f0ff" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <XAxis dataKey="period" tick={{ fontSize: 11, fill: "#c8a0ee", fontFamily: "Orbitron" }} axisLine={{ stroke: "#b44dff33" }} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: "#8866aa" }} tickFormatter={(v) => fmtM(v)} width={60} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="volume" name="Volume" stroke="#00f0ff" strokeWidth={2.5} fill="url(#volGrad)" dot={{ r: 5, fill: "#00f0ff", stroke: "#0a0014", strokeWidth: 2 }} activeDot={{ r: 7, fill: "#00f0ff", stroke: "#fff", strokeWidth: 2 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ═══ Category Breakdown ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-sw-card/60 border border-sw-border rounded-xl p-5 backdrop-blur-sm border-glow">
          <h3 className="font-display text-[11px] tracking-[0.2em] text-sw-muted uppercase mb-4">Category Volume (24H)</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={110} dataKey="value" paddingAngle={2} label={(props: any) => `${props.name} ${((props.percent ?? 0) * 100).toFixed(0)}%`} labelLine={{ stroke: "#b44dff44", strokeWidth: 1 }} fontSize={10}>
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={NEON_COLORS[i % NEON_COLORS.length]} stroke="#0a0014" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: any) => fmtM(Number(v))} contentStyle={{ background: "#1a0033ee", border: "1px solid #b44dff44", borderRadius: "8px", fontSize: "12px" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-sw-card/60 border border-sw-border rounded-xl p-5 backdrop-blur-sm border-glow">
          <h3 className="font-display text-[11px] tracking-[0.2em] text-sw-muted uppercase mb-4">Categories</h3>
          <div className="space-y-2.5">
            {categories.map((c, i) => {
              const maxVol = categories[0]?.volume24h || 1;
              const pct = Math.round((c.volume24h / maxVol) * 100);
              return (
                <div key={c.name} className="bg-sw-card/50 border border-sw-border/50 rounded-lg p-2.5 hover:border-sw-neon/30 transition-colors">
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <div className="w-3 h-3 rounded-full flex-shrink-0 shadow-[0_0_6px_var(--dot-color)]" style={{ background: NEON_COLORS[i % NEON_COLORS.length], "--dot-color": NEON_COLORS[i % NEON_COLORS.length] } as React.CSSProperties} />
                    <span className="text-xs text-sw-text font-medium flex-1 truncate">{c.name}</span>
                    <span className="text-xs font-mono text-sw-cyan text-glow-cyan">{fmtM(c.volume24h)}</span>
                    <span className="text-[9px] font-mono text-sw-muted">{c.count} events</span>
                  </div>
                  <div className="h-1 bg-sw-border/30 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: NEON_COLORS[i % NEON_COLORS.length], boxShadow: `0 0 6px ${NEON_COLORS[i % NEON_COLORS.length]}66` }} />
                  </div>
                </div>
              );
            })}
          </div>
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
