import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const DUNE_API = "https://api.dune.com/api/v1";

/**
 * Two-phase Dune global absolute PnL rank API.
 *
 * Phase 1 — Start:
 *   GET /api/dune-abs-rank?addresses=0x123,0x456
 *   → { status: "started", executionId: "..." }
 *
 * Phase 2 — Poll:
 *   GET /api/dune-abs-rank?executionId=...
 *   → { status: "pending" }                              (still computing)
 *   → { status: "done", ranks: { "0x...": { rank, absolutePnl, totalUsers } } }
 *   → { status: "error", error: "..." }
 *
 * Requires DUNE_API_KEY env var.
 */
export async function GET(request: Request) {
  const apiKey = process.env.DUNE_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ status: "error", error: "no_key", ranks: {} });
  }

  const url = new URL(request.url);
  const executionId = url.searchParams.get("executionId");

  // ─── Phase 2: Poll for results ─────────────────────────────────────
  if (executionId) {
    try {
      const statusRes = await fetch(`${DUNE_API}/execution/${executionId}/status`, {
        headers: { "X-Dune-Api-Key": apiKey },
      });

      if (!statusRes.ok) {
        return NextResponse.json({ status: "error", error: `dune_status: ${statusRes.status}` });
      }

      const statusData = await statusRes.json();

      if (!statusData.is_execution_finished) {
        return NextResponse.json({ status: "pending" });
      }

      if (statusData.state !== "QUERY_STATE_COMPLETED") {
        return NextResponse.json({ status: "error", error: `dune_failed: ${statusData.state}` });
      }

      // Query done — fetch results
      const resultsRes = await fetch(`${DUNE_API}/execution/${executionId}/results?limit=100`, {
        headers: { "X-Dune-Api-Key": apiKey },
      });

      if (!resultsRes.ok) {
        return NextResponse.json({ status: "error", error: "dune_results_fetch_failed" });
      }

      const resultsData = await resultsRes.json();
      const ranks: Record<string, { rank: number; absolutePnl: number; totalUsers: number }> = {};

      for (const row of resultsData.result?.rows || []) {
        const addr = (row.trader || "").toLowerCase();
        ranks[addr] = {
          rank: Number(row.abs_rank),
          absolutePnl: Number(row.absolute_pnl),
          totalUsers: Number(row.total_users),
        };
      }

      return NextResponse.json({ status: "done", ranks, executionId });
    } catch (e) {
      return NextResponse.json({ status: "error", error: (e as Error).message });
    }
  }

  // ─── Phase 1: Start query ──────────────────────────────────────────
  const raw = url.searchParams.get("addresses") || "";
  const addresses = raw
    .split(",")
    .map((a) => a.trim().toLowerCase())
    .filter((a) => /^0x[0-9a-f]{40}$/i.test(a));

  if (addresses.length === 0) {
    return NextResponse.json({ status: "error", error: "no_addresses", ranks: {} });
  }

  const sql = `
    WITH position_flows AS (
      SELECT
        maker AS trader,
        asset_id,
        SUM(amount) AS net_usdc
      FROM polymarket_polygon.market_trades
      WHERE maker != 0x0000000000000000000000000000000000000000
      GROUP BY maker, asset_id
    ),
    user_abs_pnl AS (
      SELECT
        trader,
        SUM(ABS(net_usdc)) AS absolute_pnl
      FROM position_flows
      GROUP BY trader
      HAVING SUM(ABS(net_usdc)) > 0
    ),
    ranked AS (
      SELECT
        trader,
        absolute_pnl,
        ROW_NUMBER() OVER (ORDER BY absolute_pnl DESC) AS abs_rank,
        COUNT(*) OVER () AS total_users
      FROM user_abs_pnl
    )
    SELECT
      LOWER(CAST(trader AS VARCHAR)) AS trader,
      absolute_pnl,
      abs_rank,
      total_users
    FROM ranked
    WHERE LOWER(CAST(trader AS VARCHAR)) IN (${addresses.map((a) => `'${a}'`).join(", ")})
  `;

  try {
    const execRes = await fetch(`${DUNE_API}/sql/execute`, {
      method: "POST",
      headers: {
        "X-Dune-Api-Key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ sql, performance: "medium" }),
    });

    if (!execRes.ok) {
      const err = await execRes.text();
      return NextResponse.json({ status: "error", error: `dune_exec: ${execRes.status} ${err.slice(0, 200)}` });
    }

    const execData = await execRes.json();
    const newExecutionId = execData.execution_id;

    if (!newExecutionId) {
      return NextResponse.json({ status: "error", error: "no_execution_id" });
    }

    return NextResponse.json({ status: "started", executionId: newExecutionId });
  } catch (e) {
    return NextResponse.json({ status: "error", error: (e as Error).message });
  }
}
