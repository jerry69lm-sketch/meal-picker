import { NextRequest, NextResponse } from "next/server";

// Temporary debug endpoint — visit /api/debug?lat=LAT&lng=LNG to see raw response
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = searchParams.get("lat") ?? "22.3193";  // default: Hong Kong
  const lng = searchParams.get("lng") ?? "114.1694";

  const apiKey = process.env.FOURSQUARE_API_KEY ?? "";

  const url = new URL("https://api.foursquare.com/v3/places/nearby");
  url.searchParams.set("ll", `${lat},${lng}`);
  url.searchParams.set("radius", "500");
  url.searchParams.set("categories", "13065");
  url.searchParams.set("limit", "3");
  url.searchParams.set("fields", "fsq_id,name,rating,stats,location,geocodes,categories,photos,distance");

  const res = await fetch(url.toString(), {
    headers: { Authorization: apiKey, Accept: "application/json" },
    cache: "no-store",
  });

  const text = await res.text();

  return new NextResponse(text, {
    status: res.status,
    headers: { "Content-Type": "application/json" },
  });
}
