/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";
export const dynamic = "force-dynamic";

const CHAIN_KEYWORDS = [
  "starbucks", "mcdonald", "kfc", "subway", "burger king", "pizza hut",
  "yoshinoya", "mos burger", "fairwood", "cafe de coral", "maxim",
  "七仔", "OK便利店", "circle k", "wellcome", "parknshop",
];

const HIGH_PROTEIN_CUISINES = [
  "chicken", "steak", "japanese", "korean", "american", "burger",
  "seafood", "fish", "beef", "bbq", "grill", "sushi", "ramen",
  "hot_pot", "thai", "vietnamese", "mediterranean", "greek", "turkish",
  "poke", "chinese", "dim_sum", "korean_bbq",
];

const HIGH_PROTEIN_NAME_KEYWORDS = [
  "chicken", "steak", "beef", "fish", "poke", "protein", "grill", "bbq",
  "sushi", "ramen", "salad", "bowl", "healthy", "fit",
  "雞", "牛", "豬", "魚", "蛋", "燒", "燉", "烤", "炭", "扒",
];

function isChain(name: string): boolean {
  const lower = name.toLowerCase();
  return CHAIN_KEYWORDS.some((k) => lower.includes(k));
}

function getProteinScore(name: string, cuisines: string[]): number {
  const lowerName = name.toLowerCase();
  const cuisineStr = cuisines.join(" ").toLowerCase();
  let score = 0;
  for (const kw of HIGH_PROTEIN_NAME_KEYWORDS) {
    if (lowerName.includes(kw)) score += 2;
  }
  for (const cu of HIGH_PROTEIN_CUISINES) {
    if (cuisineStr.includes(cu)) score += 1;
  }
  return score;
}

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
    const highProtein = req.nextUrl.searchParams.get("highProtein") === "true";

    if (!lat || !lng) {
      return NextResponse.json({ error: "Missing lat/lng" }, { status: 400 });
    }

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
        if (!tags.name) return false;
        if (tags.disused === "yes") return false;
        if (tags["disused:amenity"]) return false;
        if (tags.opening_hours === "closed") return false;
        if (tags.abandoned === "yes") return false;
        return true;
      })
      .map((el: any) => {
        const tags = el.tags as Record<string, string>;
        const elLat: number = el.lat ?? el.center?.lat ?? parseFloat(lat);
        const elLng: number = el.lon ?? el.center?.lon ?? parseFloat(lng);

        const cuisines: string[] = tags.cuisine
          ? tags.cuisine.split(";").map((c: string) => c.trim().replace(/_/g, " "))
          : [tags.amenity === "cafe" ? "咖啡廳" : tags.amenity === "fast_food" ? "快餐" : "餐廳"];

        const addr = [tags["addr:housenumber"], tags["addr:street"]]
          .filter(Boolean).join(" ") || tags["addr:full"] || tags["addr:city"] || "";

        const proteinScore = getProteinScore(tags.name, cuisines);

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
          proteinScore,
          geometry: { location: { lat: elLat, lng: elLng } },
        };
      });

    const seen = new Set<string>();
    const unique = places.filter((p) => {
      const key = p.name.toLowerCase().trim();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    const locals = unique.filter((p) => !p.chain);
    const chains = unique.filter((p) => p.chain);

    if (highProtein) {
      const proteinLocals = shuffle(locals.filter((p) => p.proteinScore > 0));
      const otherLocals   = shuffle(locals.filter((p) => p.proteinScore === 0));
      const proteinChains = shuffle(chains.filter((p) => p.proteinScore > 0));
      const mixed = [...proteinLocals, ...proteinChains.slice(0, 1), ...otherLocals, ...chains.slice(0, 1)];
      return NextResponse.json({ results: mixed });
    }

    const mixed = [...shuffle(locals), ...shuffle(chains).slice(0, 2)];
    return NextResponse.json({ results: shuffle(mixed) });

  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Server error" },
      { status: 500 }
    );
  }
}
