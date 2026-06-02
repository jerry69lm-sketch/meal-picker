/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";

// This route now just proxies with Node's native https to avoid undici "terminated" issues
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
      return NextResponse.json({ error: "API key not configured" }, { status: 500 });
    }

    const params = new URLSearchParams({
      ll: `${lat},${lng}`,
      radius,
      categories: "13065",
      limit: "50",
      fields: "fsq_id,name,rating,stats,location,geocodes,categories,photos,distance",
    });

    const targetUrl = `https://api.foursquare.com/v3/places/search?${params}`;

    // Use Node.js https directly — avoids undici "terminated" bug in Next.js
    const data = await new Promise<any>((resolve, reject) => {
      const https = require("https") as typeof import("https");
      const options = {
        hostname: "api.foursquare.com",
        path: `/v3/places/search?${params}`,
        method: "GET",
        headers: {
          Authorization: apiKey,
          Accept: "application/json",
          "User-Agent": "MealPicker/1.0",
        },
        timeout: 9000,
      };

      const request = https.request(options, (res) => {
        let body = "";
        res.on("data", (chunk: Buffer) => { body += chunk.toString(); });
        res.on("end", () => {
          try {
            const parsed = JSON.parse(body);
            if (res.statusCode && res.statusCode >= 400) {
              reject(new Error(`Foursquare ${res.statusCode}: ${body}`));
            } else {
              resolve(parsed);
            }
          } catch {
            reject(new Error(`Invalid JSON: ${body.slice(0, 100)}`));
          }
        });
      });

      request.on("error", reject);
      request.on("timeout", () => { request.destroy(); reject(new Error("Request timed out")); });
      request.end();
    });

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
