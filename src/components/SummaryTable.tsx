"use client";

import { WalletData } from "@/lib/types";
import { fmtUsd, shortAddr, pnlColor } from "@/lib/format";

interface Props {
  wallets: WalletData[];
  selectedIndex: number;
  onSelect: (idx: number) => void;
}

function swPnlColor(val: number): string {
  if (val > 0) return "text-sw-green text-glow-green";
  if (val < 0) return "text-sw-red text-glow-red";
  return "text-sw-muted";
}

export default function SummaryTable({ wallets, selectedIndex, onSelect }: Props) {
  return (
    <div className="w-full overflow-x-auto scrollbar-thin">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-sw-muted text-xs uppercase tracking-widest border-b border-sw-border font-display">
            <th className="text-left py-3 px-4 font-medium">Wallet</th>
            <th className="text-right py-3 px-4 font-medium">USDC Vol</th>
            <th className="text-right py-3 px-4 font-medium">Shares Vol</th>
            <th className="text-right py-3 px-4 font-medium">PnL (All)</th>
            <th className="text-right py-3 px-4 font-medium">PnL (30d)</th>
            <th className="text-right py-3 px-4 font-medium">Portfolio</th>
            <th className="text-right py-3 px-4 font-medium">Markets</th>
            <th className="text-right py-3 px-4 font-medium">Positions</th>
            <th className="text-right py-3 px-4 font-medium">Rank</th>
          </tr>
        </thead>
        <tbody>
          {wallets.map((w, idx) => {
            const lb = w.leaderboard;
            const isSelected = idx === selectedIndex;
            const computedNetPnl =
              w.positions.reduce((sum, p) => sum + p.cashPnl, 0) +
              w.closedPositions.reduce((sum, p) => sum + p.realizedPnl, 0);
            return (
              <tr
                key={w.address}
                onClick={() => onSelect(idx)}
                className={`border-b border-sw-border/30 cursor-pointer transition-all ${
                  isSelected
                    ? "bg-sw-neon/5 border-l-2 border-l-sw-neon"
                    : "hover:bg-sw-card-alt/50"
                }`}
              >
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    {w.profile?.profileImage ? (
                      <img
                        src={w.profile.profileImage}
                        alt=""
                        className="w-6 h-6 rounded-full ring-1 ring-sw-border"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-sw-border/50 ring-1 ring-sw-border" />
                    )}
                    <div>
                      <div className="font-medium text-sw-text">
                        {w.profile?.name || w.profile?.pseudonym || shortAddr(w.address)}
                      </div>
                      <div className="text-xs text-sw-muted font-mono">
                        {shortAddr(w.address)}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4 text-right font-mono text-sw-cyan">
                  {w.usdcVolume ? fmtUsd(w.usdcVolume) + (w.usdcVolumeTruncated ? "+" : "") : "—"}
                </td>
                <td className="py-3 px-4 text-right font-mono text-sw-muted">
                  {lb.all ? fmtUsd(lb.all.vol) : "—"}
                </td>
                <td className={`py-3 px-4 text-right font-mono ${swPnlColor(computedNetPnl)}`}>
                  {fmtUsd(computedNetPnl)}
                </td>
                <td className={`py-3 px-4 text-right font-mono ${swPnlColor(lb.month?.pnl ?? 0)}`}>
                  {lb.month ? fmtUsd(lb.month.pnl) : "—"}
                </td>
                <td className="py-3 px-4 text-right font-mono text-sw-text">
                  {fmtUsd(w.portfolioValue)}
                </td>
                <td className="py-3 px-4 text-right font-mono text-sw-purple">
                  {w.marketsTraded || "—"}
                </td>
                <td className="py-3 px-4 text-right font-mono text-sw-text">
                  {w.positions.length || "—"}
                </td>
                <td className="py-3 px-4 text-right font-mono text-sw-yellow">
                  {lb.all?.rank ? `#${lb.all.rank}` : "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
