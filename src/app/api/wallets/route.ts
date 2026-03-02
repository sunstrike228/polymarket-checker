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

  if (addressList.length > 20) {
    return NextResponse.json(
      { error: "Maximum 20 addresses per request" },
      { status: 400 }
    );
  }

  const results = await Promise.all(addressList.map(fetchWalletData));

  return NextResponse.json(results, {
    headers: {
      "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
    },
  });
}
