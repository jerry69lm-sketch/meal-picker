/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import https from "node:https";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function httpGet(hostname: string, path: string, body?: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const options: https.RequestOptions = {
      hostname,
      path,
      method: body ? "POST" : "GET",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "MealPicker/1.0",
        ...(body ? { "Content-Length": Buffer.byteLength(body) } : {}),
      },
    };

    const req = https.request(options, (res) => {
      const chunks: Buffer[] = [];
      res.on("data", (c: Buffer) => chunks.push(c));
      res.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    });

    req.setTimeout(10000, () => { req.destroy(); reject(new Error("Request timed out")); });
    req.on("error", reject);
    if (body) req.write(body);
    req.end();
  });
}

export async function GET(req: NextRequest) {
  try {
    const lat = req.nextUrl.searchParams.get("lat");
    const lng = req.nextUrl.searchParams.get("lng");
    const radius = req.nextUrl.searchParams.get("radius") || "500";

    if (!lat || !lng) {
      return NextResponse.json({ error: "Missing lat/lng" }, { status: 400 });
    }

    // Overpass API — completely free, no key, works everywhere
    const query = `[out:json][timeout:9];(node["amenity"~"restaurant|cafe|fast_food|food_court"](around:${radius},${lat},${lng});way["amenity"~"restaurant|cafe|fast_food|food_court"](around:${radius},${lat},${lng}););out center body 60;`;
    const body = `data=${encodeURIComponent(query)}`;

    const raw = await httpGet("overpass-api.de", "/api/interpreter", body);

    if (!raw || raw.trim() === "") {
      return NextResponse.json({ error: "No response from map server" }, { status: 502 });
    }

    const data = JSON.parse(raw) as { elements: any[] };

    const results = (data.elements || [])
      .filter((el: any) => el.tags?.name)
      .map((el: any) => {
        const tags = el.tags || {};
        const elLat: number = el.lat ?? el.center?.lat ?? parseFloat(lat);
        const elLng: number = el.lon ?? el.center?.lon ?? parseFloat(lng);

        // Build cuisine tags
        const cuisines: string[] = tags.cuisine
          ? tags.cuisine.split(";").map((c: string) => c.trim().replace(/_/g, " "))
          : [];
        const amenityLabel: Record<string, string> = {
          restaurant: "餐廳", cafe: "咖啡廳", fast_food: "快餐",
          food_court: "美食廣場",
        };
        const typeLabel = amenityLabel[tags.amenity] || "餐廳";
        if (cuisines.length === 0) cuisines.push(typeLabel);

        const addressParts = [tags["addr:housenumber"], tags["addr:street"]].filter(Boolean);
        const address = addressParts.join(" ") || tags["addr:full"] || tags["addr:city"] || "";

        return {
          place_id: String(el.id),
          name: tags.name,
          rating: null,
          rating_raw: null,
          user_ratings_total: 0,
          vicinity: address,
          types: cuisines.slice(0, 3),
          distance: 0,
          photo: null,
          geometry: { location: { lat: elLat, lng: elLng } },
        };
      });

    return NextResponse.json({ results });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}
