"use client";

import { useState, useEffect, useCallback, useRef, lazy, Suspense } from "react";
import { WalletData } from "@/lib/types";
import AddressInput from "@/components/AddressInput";
import SummaryTable from "@/components/SummaryTable";
import CombinedDetail from "@/components/CombinedDetail";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import MusicPlayer from "@/components/MusicPlayer";

const PolymarketOverview = lazy(() => import("@/components/PolymarketOverview"));

type ViewMode = "wallets" | "polymarket";
const REFRESH_INTERVAL = 30; // seconds

export default function Home() {
  const [viewMode, setViewMode] = useState<ViewMode>("wallets");
  const [wallets, setWallets] = useState<WalletData[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [addresses, setAddresses] = useState<string[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const a = params.get("a");
    if (a) {
      const addrs = a.split(",").filter((x) => /^0x[a-fA-F0-9]{40}$/i.test(x));
      if (addrs.length > 0) setAddresses(addrs);
    }
  }, []);

  const fetchData = useCallback(
    async (addrs: string[], isRefresh = false) => {
      if (!isRefresh) setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/wallets?addresses=${addrs.join(",")}`);
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "API error");
        }
        const data: WalletData[] = await res.json();
        setWallets(data);
        setLastUpdated(new Date());
        setCountdown(REFRESH_INTERVAL);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to fetch");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (addresses.length > 0) {
      fetchData(addresses);
      const url = new URL(window.location.href);
      url.searchParams.set("a", addresses.join(","));
      window.history.replaceState({}, "", url.toString());
    }
  }, [addresses, fetchData]);

  useEffect(() => {
    if (!autoRefresh || addresses.length === 0) return;
    intervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) { fetchData(addresses, true); return REFRESH_INTERVAL; }
        return prev - 1;
      });
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [autoRefresh, addresses, fetchData]);

  function handleSubmit(addrs: string[]) {
    setSelectedIndex(0);
    setAddresses(addrs);
    setViewMode("wallets");
  }

  const showEmptyState = !loading && wallets.length === 0 && addresses.length === 0;

  return (
    <main className="min-h-screen relative">
      {/* ═══ Synthwave Background ═══ */}
      <div className="synthwave-bg">
        <div className="synthwave-stars" />
        <div className="synthwave-mountains" />
        <div className="synthwave-grid" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 relative z-10">
        {/* ═══ Header ═══ */}
        <div className="mb-8 text-center">
          <h1 className="font-display text-3xl sm:text-4xl font-black tracking-wider text-sw-neon neon-title-glow mb-2">
            POLYMARKET BIG RACKS CHECKER
          </h1>
          <div className="neon-line max-w-md mx-auto mb-3" />
          <div className="flex items-center justify-center gap-4">
            <p className="text-sm text-sw-muted tracking-widest uppercase">
              made by <span className="text-sw-cyan text-glow-cyan font-bold">FTP</span>
            </p>
            <a
              href="https://t.me/ftp_crypto"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block font-display text-[8px] tracking-[0.15em] uppercase px-3 py-1 rounded border border-sw-red/70 text-sw-red hover:bg-sw-red/10 transition-all dont-touch-btn"
            >
              DON&apos;T TOUCH
            </a>
          </div>
        </div>

        {/* ═══ View Mode Switcher ═══ */}
        <div className="flex justify-center mb-6">
          <div className="flex bg-sw-card/80 rounded-xl p-1 border border-sw-border backdrop-blur-sm">
            <button
              onClick={() => setViewMode("wallets")}
              className={`px-5 py-2 text-xs rounded-lg transition-all font-display tracking-wider uppercase ${
                viewMode === "wallets"
                  ? "bg-sw-neon/10 text-sw-neon font-bold shadow-neon"
                  : "text-sw-muted hover:text-sw-text"
              }`}
            >
              🔍 Wallet Checker
            </button>
            <button
              onClick={() => setViewMode("polymarket")}
              className={`px-5 py-2 text-xs rounded-lg transition-all font-display tracking-wider uppercase ${
                viewMode === "polymarket"
                  ? "bg-sw-cyan/10 text-sw-cyan font-bold shadow-[0_0_10px_#00f0ff33]"
                  : "text-sw-muted hover:text-sw-text"
              }`}
            >
              📊 Polymarket Stats
            </button>
          </div>
        </div>

        {/* ═══ WALLET CHECKER VIEW ═══ */}
        {viewMode === "wallets" && (
          <>
            <div className="mb-8">
              <AddressInput onSubmit={handleSubmit} loading={loading} />
            </div>

            {wallets.length > 0 && (
              <div className="flex items-center justify-between mb-4 text-xs text-sw-muted font-mono">
                <div className="flex items-center gap-3">
                  <span className="text-sw-cyan">{wallets.length} wallet{wallets.length !== 1 ? "s" : ""}</span>
                  {lastUpdated && <span>@ {lastUpdated.toLocaleTimeString()}</span>}
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => fetchData(addresses, true)} className="hover:text-sw-neon transition-colors">REFRESH</button>
                  <button
                    onClick={() => setAutoRefresh(!autoRefresh)}
                    className={`flex items-center gap-1.5 transition-colors ${autoRefresh ? "text-sw-cyan" : "text-sw-muted"}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${autoRefresh ? "bg-sw-cyan pulse-dot" : "bg-sw-muted"}`} />
                    AUTO {autoRefresh ? `[${countdown}s]` : "OFF"}
                  </button>
                  <button onClick={() => navigator.clipboard.writeText(window.location.href)} className="hover:text-sw-neon transition-colors">SHARE</button>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-sw-red/10 border border-sw-red/30 text-sw-red rounded-xl p-4 mb-6 text-sm text-glow-red">{error}</div>
            )}

            {loading && wallets.length === 0 && <LoadingSkeleton />}

            {wallets.length > 0 && (
              <div className="space-y-6">
                <div className="bg-sw-card/80 border border-sw-border rounded-xl overflow-hidden border-glow backdrop-blur-sm">
                  <SummaryTable wallets={wallets} selectedIndex={selectedIndex} onSelect={setSelectedIndex} />
                </div>
                <div className="bg-sw-card/60 border border-sw-border rounded-xl p-6 border-glow-cyan backdrop-blur-sm">
                  <CombinedDetail wallets={wallets} />
                </div>
              </div>
            )}

            {showEmptyState && (
              <div className="flex justify-center py-10">
                <MusicPlayer />
              </div>
            )}

            {wallets.length > 0 && (
              <div className="flex justify-center py-8">
                <MusicPlayer />
              </div>
            )}
          </>
        )}

        {/* ═══ POLYMARKET STATS VIEW ═══ */}
        {viewMode === "polymarket" && (
          <Suspense fallback={
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-32 rounded-xl" />)}
            </div>
          }>
            <PolymarketOverview />
          </Suspense>
        )}

        {/* ═══ Footer ═══ */}
        <div className="mt-16 mb-8 text-center">
          <div className="neon-line max-w-xs mx-auto mb-6" />
          <p className="font-display text-sm tracking-[0.3em] text-sw-muted">
            FTP UNTIL THE GRAVE  &#x26B0;&#xFE0F;
          </p>
        </div>
      </div>
    </main>
  );
}
