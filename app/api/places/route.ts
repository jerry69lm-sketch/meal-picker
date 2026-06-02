/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import https from "node:https";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function foursquareRequest(path: string, apiKey: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const options: https.RequestOptions = {
      hostname: "api.foursquare.com",
      path,
      method: "GET",
      headers: {
        Authorization: apiKey,
        Accept: "application/json",
        "User-Agent": "MealPicker/1.0",
      },
    };

    const req = https.request(options, (res) => {
      const chunks: Buffer[] = [];
      res.on("data", (chunk: Buffer) => chunks.push(chunk));
      res.on("end", () => {
        const body = Buffer.concat(chunks).toString("utf8");
        if (!body) { reject(new Error("Empty response from Foursquare")); return; }
        try {
          const json = JSON.parse(body);
          if ((res.statusCode ?? 200) >= 400) {
            reject(new Error(`Foursquare ${res.statusCode}: ${json.message ?? body}`));
          } else {
            resolve(json);
          }
        } catch {
          reject(new Error(`Bad JSON: ${body.slice(0, 80)}`));
        }
      });
    });

    req.setTimeout(9000, () => { req.destroy(); reject(new Error("Foursquare request timed out")); });
    req.on("error", (e) => reject(e));
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

    const apiKey = process.env.FOURSQUARE_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "FOURSQUARE_API_KEY not set in environment" }, { status: 500 });
    }

    const params = new URLSearchParams({
      ll: `${lat},${lng}`,
      radius,
      categories: "13065",
      limit: "50",
      fields: "fsq_id,name,rating,stats,location,geocodes,categories,photos,distance",
    });

    const data = await foursquareRequest(
      `/v3/places/search?${params.toString()}`,
      apiKey
    );

    const results = ((data.results || []) as any[]).map((place: any) => {
      let photo: string | null = null;
      try {
        const p = place.photos?.[0];
        if (p?.prefix && p?.suffix) {
          photo = `${p.prefix}400x300${p.suffix}`;
          new URL(photo);
        }
      } catch { photo = null; }

      return {
        place_id: place.fsq_id || String(Math.random()),
        name: place.name || "未知餐廳",
        rating: typeof place.rating === "number" ? place.rating / 2 : null,
        rating_raw: place.rating ?? null,
        user_ratings_total: place.stats?.total_ratings ?? 0,
        vicinity: place.location?.formatted_address || place.location?.address || "",
        types: ((place.categories || []) as any[]).map((c: any) => c.name),
        distance: place.distance || 0,
        photo,
        geometry: {
          location: {
            lat: place.geocodes?.main?.latitude ?? parseFloat(lat),
            lng: place.geocodes?.main?.longitude ?? parseFloat(lng),
          },
        },
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
