/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const lat = req.nextUrl.searchParams.get("lat");
    const lng = req.nextUrl.searchParams.get("lng");
    const radius = req.nextUrl.searchParams.get("radius") || "500";

    if (!lat || !lng) {
      return NextResponse.json({ error: "Missing lat/lng" }, { status: 400 });
    }

    // OpenStreetMap Overpass API — free, no key, no cloud IP blocking
    const query = `[out:json][timeout:9];(node["amenity"~"restaurant|cafe|fast_food"](around:${radius},${lat},${lng});way["amenity"~"restaurant|cafe|fast_food"](around:${radius},${lat},${lng}););out center body 60;`;
    const encoded = encodeURIComponent(query);

    // Try multiple mirrors with GET request (more reliable than POST)
    const mirrors = [
      "https://overpass-api.de/api/interpreter",
      "https://lz4.overpass-api.de/api/interpreter",
      "https://overpass.kumi.systems/api/interpreter",
    ];

    let text = "";
    let lastError = "";
    for (const mirror of mirrors) {
      try {
        const res = await fetch(`${mirror}?data=${encoded}`, {
          headers: { "Accept": "application/json" },
        });
        const raw = await res.text();
        if (raw.trim().startsWith("{")) { text = raw; break; }
        lastError = `Status ${res.status}`;
      } catch (err) {
        lastError = err instanceof Error ? err.message : String(err);
      }
    }

    if (!text) {
      return NextResponse.json({ error: `Map service unavailable: ${lastError}` }, { status: 502 });
    }

    const data = JSON.parse(text) as { elements: any[] };
    const elements: any[] = data.elements || [];

    const results = elements
      .filter((el: any) => el.tags && el.tags.name)
      .map((el: any) => {
        const tags = el.tags as Record<string, string>;
        const elLat: number = el.lat ?? el.center?.lat ?? parseFloat(lat);
        const elLng: number = el.lon ?? el.center?.lon ?? parseFloat(lng);

        const cuisines: string[] = tags.cuisine
          ? tags.cuisine.split(";").map((c: string) => c.trim().replace(/_/g, " "))
          : [tags.amenity === "cafe" ? "咖啡廳" : "餐廳"];

        const addr = [tags["addr:housenumber"], tags["addr:street"]]
          .filter(Boolean)
          .join(" ") || tags["addr:full"] || "";

        return {
          place_id: String(el.id),
          name: tags.name,
          rating: null as null,
          rating_raw: null as null,
          user_ratings_total: 0,
          vicinity: addr,
          types: cuisines.slice(0, 3),
          distance: 0,
          photo: null as null,
          geometry: { location: { lat: elLat, lng: elLng } },
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
