import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const DUNE_API = "https://api.dune.com/api/v1";

/**
 * Computes global absolute PnL rank for given Polymarket wallet addresses.
 *
 * Absolute PnL = SUM(|position PnL|) for each position per user.
 * e.g. -$500 + $500 = $1000, not $0.
 *
 * Uses Dune's curated polymarket_polygon.market_trades spell table.
 * Requires DUNE_API_KEY env var.
 *
 * GET /api/dune-abs-rank?addresses=0x123,0x456
 */
export async function GET(request: Request) {
  const apiKey = process.env.DUNE_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "no_key", ranks: {} });
  }

  const url = new URL(request.url);
  const raw = url.searchParams.get("addresses") || "";
  const addresses = raw
    .split(",")
    .map((a) => a.trim().toLowerCase())
    .filter((a) => /^0x[0-9a-f]{40}$/i.test(a));

  if (addresses.length === 0) {
    return NextResponse.json({ error: "no_addresses", ranks: {} });
  }

  // Build Dune hex address literals: 0xabcd...
  const addressLiterals = addresses.map((a) => a).join(", ");

  // SQL: compute absolute PnL per user globally, rank, return only requested addresses
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
    // 1. Execute query
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
      return NextResponse.json({ error: `dune_exec: ${execRes.status} ${err.slice(0, 200)}`, ranks: {} });
    }

    const execData = await execRes.json();
    const executionId = execData.execution_id;

    if (!executionId) {
      return NextResponse.json({ error: "no_execution_id", ranks: {} });
    }

    // 2. Poll for results (up to 120s with 3s intervals)
    for (let i = 0; i < 40; i++) {
      await new Promise((r) => setTimeout(r, 3000));

      const statusRes = await fetch(`${DUNE_API}/execution/${executionId}/status`, {
        headers: { "X-Dune-Api-Key": apiKey },
      });

      if (!statusRes.ok) continue;

      const statusData = await statusRes.json();

      if (statusData.is_execution_finished) {
        if (statusData.state === "QUERY_STATE_COMPLETED") {
          // 3. Get results
          const resultsRes = await fetch(`${DUNE_API}/execution/${executionId}/results?limit=100`, {
            headers: { "X-Dune-Api-Key": apiKey },
          });

          if (!resultsRes.ok) {
            return NextResponse.json({ error: "dune_results_fetch_failed", ranks: {} });
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

          return NextResponse.json({ ranks, executionId });
        } else {
          return NextResponse.json({
            error: `dune_query_failed: ${statusData.state}`,
            executionId,
            ranks: {},
          });
        }
      }
    }

    // Timeout — return execution ID so frontend can retry
    return NextResponse.json({
      error: "dune_timeout",
      executionId,
      ranks: {},
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message, ranks: {} });
  }
}
