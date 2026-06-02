/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";
export const dynamic = "force-dynamic";

// Chains we want to limit to max 1 appearance so they don't dominate
const CHAIN_KEYWORDS = [
  "starbucks", "mcdonald", "kfc", "subway", "burger king", "pizza hut",
  "yoshinoya", "mos burger", "fairwood", "cafe de coral", "maxim",
  "七仔", "OK便利店", "circle k", "wellcome", "parknshop",
];

function isChain(name: string): boolean {
  const lower = name.toLowerCase();
  return CHAIN_KEYWORDS.some((k) => lower.includes(k));
}

// Fisher-Yates shuffle for true randomness
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export async function GET(req: NextRequest) {
  try {
    const lat = req.nextUrl.searchParams.get("lat");
    const lng = req.nextUrl.searchParams.get("lng");
    const radius = req.nextUrl.searchParams.get("radius") || "500";

    if (!lat || !lng) {
      return NextResponse.json({ error: "Missing lat/lng" }, { status: 400 });
    }

    // Broader amenity search + exclude closed places + higher limit
    const query = `[out:json][timeout:10];
(
  node["amenity"~"restaurant|cafe|fast_food|food_court|bar|pub"]["name"](around:${radius},${lat},${lng});
  way["amenity"~"restaurant|cafe|fast_food|food_court"]["name"](around:${radius},${lat},${lng});
);
out center 120;`;

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
        lastErr = `status ${res.status}`;
      } catch (e) {
        lastErr = e instanceof Error ? e.message : String(e);
      }
    }

    if (!json) {
      return NextResponse.json({ error: `Map unavailable: ${lastErr}` }, { status: 502 });
    }

    const elements: any[] = json.elements || [];

    const places = elements
      .filter((el: any) => {
        const tags = el.tags || {};
        // Must have a name
        if (!tags.name) return false;
        // Filter out places explicitly marked as closed/disused
        if (tags.disused === "yes") return false;
        if (tags["disused:amenity"]) return false;
        if (tags.opening_hours === "closed") return false;
        if (tags.abandoned === "yes") return false;
        return true;
      })
      .map((el: any) => {
        const tags = el.tags as Record<string, string>;
        // way elements have a center, node elements have lat/lon directly
        const elLat: number = el.lat ?? el.center?.lat ?? parseFloat(lat);
        const elLng: number = el.lon ?? el.center?.lon ?? parseFloat(lng);

        const cuisines: string[] = tags.cuisine
          ? tags.cuisine.split(";").map((c: string) => c.trim().replace(/_/g, " "))
          : [tags.amenity === "cafe" ? "咖啡廳" : tags.amenity === "fast_food" ? "快餐" : "餐廳"];

        const addr = [tags["addr:housenumber"], tags["addr:street"]]
          .filter(Boolean).join(" ") || tags["addr:full"] || tags["addr:city"] || "";

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
          chain: isChain(tags.name),
          geometry: { location: { lat: elLat, lng: elLng } },
        };
      });

    // De-duplicate by name (OSM sometimes has same place as node + way)
    const seen = new Set<string>();
    const unique = places.filter((p) => {
      const key = p.name.toLowerCase().trim();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Separate chains and locals, shuffle each group independently
    const locals = shuffle(unique.filter((p) => !p.chain));
    const chains = shuffle(unique.filter((p) => p.chain));

    // Mix: mostly locals, chains appear less frequently
    // Take up to 2 chains and the rest locals so chains don't dominate
    const mixed = [...locals, ...chains.slice(0, 2)];
    const results = shuffle(mixed);

    return NextResponse.json({ results });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Server error" },
      { status: 500 }
    );
  }
}
