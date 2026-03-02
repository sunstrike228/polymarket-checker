"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { WalletData } from "@/lib/types";
import AddressInput from "@/components/AddressInput";
import SummaryTable from "@/components/SummaryTable";
import WalletDetail from "@/components/WalletDetail";
import LoadingSkeleton from "@/components/LoadingSkeleton";

const REFRESH_INTERVAL = 30; // seconds

export default function Home() {
  const [wallets, setWallets] = useState<WalletData[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [addresses, setAddresses] = useState<string[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Read addresses from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const a = params.get("a");
    if (a) {
      const addrs = a.split(",").filter((x) => /^0x[a-fA-F0-9]{40}$/i.test(x));
      if (addrs.length > 0) {
        setAddresses(addrs);
      }
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

  // Initial fetch when addresses change
  useEffect(() => {
    if (addresses.length > 0) {
      fetchData(addresses);
      // Update URL
      const url = new URL(window.location.href);
      url.searchParams.set("a", addresses.join(","));
      window.history.replaceState({}, "", url.toString());
    }
  }, [addresses, fetchData]);

  // Auto-refresh timer
  useEffect(() => {
    if (!autoRefresh || addresses.length === 0) return;

    intervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          fetchData(addresses, true);
          return REFRESH_INTERVAL;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [autoRefresh, addresses, fetchData]);

  function handleSubmit(addrs: string[]) {
    setSelectedIndex(0);
    setAddresses(addrs);
  }

  const selected = wallets[selectedIndex];

  return (
    <main className="min-h-screen bg-poly-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-1">
            Polymarket Wallet Checker
          </h1>
          <p className="text-sm text-poly-muted">
            Batch check wallets — volume, PnL, positions & activity. Paste
            addresses below to get started.
          </p>
        </div>

        {/* Input */}
        <div className="mb-8">
          <AddressInput onSubmit={handleSubmit} loading={loading} />
        </div>

        {/* Status bar */}
        {wallets.length > 0 && (
          <div className="flex items-center justify-between mb-4 text-xs text-poly-muted">
            <div className="flex items-center gap-3">
              <span>{wallets.length} wallet{wallets.length !== 1 ? "s" : ""} loaded</span>
              {lastUpdated && (
                <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => fetchData(addresses, true)}
                className="hover:text-poly-accent transition-colors"
              >
                Refresh now
              </button>
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`flex items-center gap-1.5 transition-colors ${
                  autoRefresh ? "text-poly-accent" : "text-poly-muted"
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${autoRefresh ? "bg-poly-accent pulse-dot" : "bg-poly-muted"}`} />
                Auto-refresh {autoRefresh ? `(${countdown}s)` : "off"}
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                }}
                className="hover:text-poly-accent transition-colors"
              >
                Share link
              </button>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-poly-red/10 border border-poly-red/20 text-poly-red rounded-xl p-4 mb-6 text-sm">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && wallets.length === 0 && <LoadingSkeleton />}

        {/* Results */}
        {wallets.length > 0 && (
          <div className="space-y-6">
            {/* Summary table */}
            <div className="bg-poly-card border border-poly-border rounded-xl overflow-hidden">
              <SummaryTable
                wallets={wallets}
                selectedIndex={selectedIndex}
                onSelect={setSelectedIndex}
              />
            </div>

            {/* Detail views for all wallets */}
            {wallets.map((w, idx) => (
              <div
                key={w.address}
                id={`wallet-${idx}`}
                className="bg-poly-card/50 border border-poly-border rounded-xl p-6"
              >
                <WalletDetail wallet={w} />
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && wallets.length === 0 && addresses.length === 0 && (
          <div className="text-center py-20">
            <div className="text-4xl mb-4 opacity-20">&#x1F50D;</div>
            <div className="text-poly-muted text-sm">
              Paste wallet addresses above and hit Check to get started
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
