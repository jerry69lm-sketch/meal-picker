/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";

// Edge runtime = runs on Vercel's global CDN nodes, not blocked by Overpass
export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const lat = req.nextUrl.searchParams.get("lat");
    const lng = req.nextUrl.searchParams.get("lng");
    const radius = req.nextUrl.searchParams.get("radius") || "500";

    if (!lat || !lng) {
      return NextResponse.json({ error: "Missing lat/lng" }, { status: 400 });
    }

    const query = `[out:json][timeout:8];node["amenity"~"restaurant|cafe|fast_food"](around:${radius},${lat},${lng});out 50;`;

    const mirrors = [
      "https://overpass-api.de/api/interpreter",
      "https://lz4.overpass-api.de/api/interpreter",
      "https://overpass.kumi.systems/api/interpreter",
    ];

    let json: any = null;
    let lastErr = "";

    for (const mirror of mirrors) {
      try {
        const res = await fetch(`${mirror}?data=${encodeURIComponent(query)}`);
        const text = await res.text();
        if (text.trim().startsWith("{")) {
          json = JSON.parse(text);
          break;
        }
        lastErr = `${mirror} returned status ${res.status}`;
      } catch (e) {
        lastErr = e instanceof Error ? e.message : String(e);
      }
    }

    if (!json) {
      return NextResponse.json({ error: `Map unavailable: ${lastErr}` }, { status: 502 });
    }

    const results = ((json.elements || []) as any[])
      .filter((el: any) => el.tags?.name)
      .map((el: any) => {
        const tags = el.tags as Record<string, string>;
        const cuisines: string[] = tags.cuisine
          ? tags.cuisine.split(";").map((c: string) => c.trim().replace(/_/g, " "))
          : [tags.amenity === "cafe" ? "咖啡廳" : "餐廳"];
        const addr = [tags["addr:housenumber"], tags["addr:street"]]
          .filter(Boolean).join(" ") || tags["addr:full"] || "";
        return {
          place_id: String(el.id),
          name: tags.name,
          rating: null,
          rating_raw: null,
          user_ratings_total: 0,
          vicinity: addr,
          types: cuisines.slice(0, 3),
          distance: 0,
          photo: null,
          geometry: { location: { lat: Number(el.lat) || parseFloat(lat), lng: Number(el.lon) || parseFloat(lng) } },
        };
      });

    return NextResponse.json({ results });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Server error" },
      { status: 500 }
    );
  }
}
