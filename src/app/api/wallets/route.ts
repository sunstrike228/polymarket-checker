import { NextRequest, NextResponse } from "next/server";
import { fetchWalletData } from "@/lib/polymarket";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const addresses = req.nextUrl.searchParams.get("addresses");

  if (!addresses) {
    return NextResponse.json(
      { error: "Missing addresses parameter" },
      { status: 400 }
    );
  }

  const addressList = addresses
    .split(",")
    .map((a) => a.trim())
    .filter((a) => /^0x[a-fA-F0-9]{40}$/.test(a));

  if (addressList.length === 0) {
    return NextResponse.json(
      { error: "No valid Ethereum addresses provided" },
      { status: 400 }
    );
  }

  // Fetch in batches of 10 to avoid overwhelming the API
  const BATCH_SIZE = 10;
  const results: Awaited<ReturnType<typeof fetchWalletData>>[] = [];
  for (let i = 0; i < addressList.length; i += BATCH_SIZE) {
    const batch = addressList.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.all(batch.map(fetchWalletData));
    results.push(...batchResults);
  }

  return NextResponse.json(results, {
    headers: {
      "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
    },
  });
}
