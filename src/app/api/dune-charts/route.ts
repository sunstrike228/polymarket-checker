import { NextResponse } from "next/server";

const DUNE_API = "https://api.dune.com/api/v1";
const VOLUME_QUERY_ID = "2683517";
const WALLETS_QUERY_ID = "3343123";

interface DuneRow {
  [key: string]: string | number | null;
}

interface DuneResponse {
  result?: {
    rows?: DuneRow[];
    metadata?: {
      column_names?: string[];
    };
  };
}

/**
 * Transform Dune volume query rows into chart format.
 * Expected Dune columns: period (date/string), ctf_volume (number), neg_risk_volume (number)
 * We normalize to: { month: "Jan 24", ctf: number, neg: number }
 */
function transformVolume(rows: DuneRow[]): { month: string; ctf: number; neg: number }[] {
  return rows
    .map((row) => {
      // Try common column name patterns from Dune
      const period = row.period || row.month || row.time || row.date || row.evt_month || "";
      const ctf = Number(row.ctf_volume || row.ctf || row.ctf_usdc || row.volume_ctf || 0);
      const neg = Number(row.neg_risk_volume || row.neg || row.neg_usdc || row.volume_neg || row.negrisk_volume || 0);

      // Format period to "Mon YY"
      let month = String(period);
      try {
        const d = new Date(String(period));
        if (!isNaN(d.getTime())) {
          const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
          month = `${months[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`;
        }
      } catch { /* keep raw */ }

      return { month, ctf, neg };
    })
    .filter((r) => r.ctf > 0 || r.neg > 0);
}

/**
 * Transform Dune wallets query rows into chart format.
 * Expected columns: period, ctf_wallets, neg_risk_wallets, unique_wallets
 * We normalize to: { month: "Jan 24", ctf: number, neg: number, unique: number }
 */
function transformWallets(rows: DuneRow[]): { month: string; ctf: number; neg: number; unique: number }[] {
  return rows
    .map((row) => {
      const period = row.period || row.month || row.time || row.date || row.evt_month || "";
      const ctf = Number(row.ctf_wallets || row.ctf || row.ctf_traders || row.traders_ctf || 0);
      const neg = Number(row.neg_risk_wallets || row.neg || row.neg_traders || row.traders_neg || row.negrisk_wallets || 0);
      const unique = Number(row.unique_wallets || row.unique || row.unique_traders || row.total_wallets || row.total_traders || 0);

      let month = String(period);
      try {
        const d = new Date(String(period));
        if (!isNaN(d.getTime())) {
          const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
          month = `${months[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`;
        }
      } catch { /* keep raw */ }

      return { month, ctf, neg, unique };
    })
    .filter((r) => r.ctf > 0 || r.neg > 0 || r.unique > 0);
}

export async function GET() {
  const apiKey = process.env.DUNE_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { volume: null, wallets: null, live: false },
      {
        headers: {
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200",
        },
      }
    );
  }

  try {
    const headers = { "X-Dune-Api-Key": apiKey };

    const [volRes, walRes] = await Promise.all([
      fetch(`${DUNE_API}/query/${VOLUME_QUERY_ID}/results?limit=100`, {
        headers,
        signal: AbortSignal.timeout(15000),
      }),
      fetch(`${DUNE_API}/query/${WALLETS_QUERY_ID}/results?limit=100`, {
        headers,
        signal: AbortSignal.timeout(15000),
      }),
    ]);

    let volume = null;
    let wallets = null;

    if (volRes.ok) {
      const volData: DuneResponse = await volRes.json();
      if (volData.result?.rows?.length) {
        volume = transformVolume(volData.result.rows);
      }
    }

    if (walRes.ok) {
      const walData: DuneResponse = await walRes.json();
      if (walData.result?.rows?.length) {
        wallets = transformWallets(walData.result.rows);
      }
    }

    return NextResponse.json(
      { volume, wallets, live: true },
      {
        headers: {
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200",
        },
      }
    );
  } catch (e) {
    console.error("Dune API error:", e);
    return NextResponse.json(
      { volume: null, wallets: null, live: false },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      }
    );
  }
}
