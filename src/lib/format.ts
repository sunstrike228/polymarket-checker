export function fmt(n: number, decimals = 2): string {
  if (Math.abs(n) >= 1_000_000) {
    return `${(n / 1_000_000).toFixed(2)}M`;
  }
  if (Math.abs(n) >= 1_000) {
    return `${(n / 1_000).toFixed(2)}K`;
  }
  return n.toFixed(decimals);
}

export function fmtUsd(n: number): string {
  const prefix = n < 0 ? "-$" : "$";
  return `${prefix}${fmt(Math.abs(n))}`;
}

export function fmtPct(n: number): string {
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(2)}%`;
}

export function shortAddr(addr: string): string {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export function timeAgo(ts: number): string {
  const seconds = Math.floor(Date.now() / 1000 - ts);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export function pnlColor(n: number): string {
  if (n > 0) return "text-sw-green";
  if (n < 0) return "text-sw-red";
  return "text-sw-muted";
}
