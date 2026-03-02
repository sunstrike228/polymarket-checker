"use client";

import { WalletData } from "@/lib/types";
import { fmtUsd, fmtPct, shortAddr, pnlColor } from "@/lib/format";

interface Props {
  wallets: WalletData[];
  selectedIndex: number;
  onSelect: (idx: number) => void;
}

export default function SummaryTable({ wallets, selectedIndex, onSelect }: Props) {
  return (
    <div className="w-full overflow-x-auto scrollbar-thin">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-poly-muted text-xs uppercase tracking-wider border-b border-poly-border">
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
                className={`border-b border-poly-border/50 cursor-pointer transition-colors ${
                  isSelected
                    ? "bg-poly-accent/5 border-l-2 border-l-poly-accent"
                    : "hover:bg-poly-card"
                }`}
              >
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    {w.profile?.profileImage ? (
                      <img
                        src={w.profile.profileImage}
                        alt=""
                        className="w-6 h-6 rounded-full"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-poly-border" />
                    )}
                    <div>
                      <div className="font-medium text-poly-text">
                        {w.profile?.name || w.profile?.pseudonym || shortAddr(w.address)}
                      </div>
                      <div className="text-xs text-poly-muted font-mono">
                        {shortAddr(w.address)}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4 text-right font-mono">
                  {w.usdcVolume ? fmtUsd(w.usdcVolume) + (w.usdcVolumeTruncated ? "+" : "") : "—"}
                </td>
                <td className="py-3 px-4 text-right font-mono text-poly-muted">
                  {lb.all ? fmtUsd(lb.all.vol) : "—"}
                </td>
                <td className={`py-3 px-4 text-right font-mono ${pnlColor(computedNetPnl)}`}>
                  {fmtUsd(computedNetPnl)}
                </td>
                <td className={`py-3 px-4 text-right font-mono ${pnlColor(lb.month?.pnl ?? 0)}`}>
                  {lb.month ? fmtUsd(lb.month.pnl) : "—"}
                </td>
                <td className="py-3 px-4 text-right font-mono">
                  {fmtUsd(w.portfolioValue)}
                </td>
                <td className="py-3 px-4 text-right font-mono">
                  {w.marketsTraded || "—"}
                </td>
                <td className="py-3 px-4 text-right font-mono">
                  {w.positions.length || "—"}
                </td>
                <td className="py-3 px-4 text-right font-mono text-poly-muted">
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
