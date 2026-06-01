/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";

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

    const res = await fetch(
      `https://api.foursquare.com/v3/places/search?${params.toString()}`,
      {
        headers: { Authorization: apiKey, Accept: "application/json" },
        cache: "no-store",
      }
    );

    const json: any = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { error: `Foursquare error: ${JSON.stringify(json)}` },
        { status: 502 }
      );
    }

    const results = ((json.results || []) as any[]).map((place: any) => {
      let photo: string | null = null;
      try {
        const p = place.photos?.[0];
        if (p?.prefix && p?.suffix) {
          photo = `${p.prefix}400x300${p.suffix}`;
          new URL(photo); // validate
        }
      } catch {
        photo = null;
      }

      const placeLat: number =
        place.geocodes?.main?.latitude ?? parseFloat(lat);
      const placeLng: number =
        place.geocodes?.main?.longitude ?? parseFloat(lng);

      return {
        place_id: place.fsq_id || String(Math.random()),
        name: place.name || "未知餐廳",
        rating: typeof place.rating === "number" ? place.rating / 2 : null,
        rating_raw: place.rating ?? null,
        user_ratings_total: place.stats?.total_ratings ?? 0,
        vicinity:
          place.location?.formatted_address ||
          place.location?.address ||
          "",
        types: ((place.categories || []) as any[]).map((c: any) => c.name),
        distance: place.distance || 0,
        photo,
        geometry: { location: { lat: placeLat, lng: placeLng } },
      };
    });

    return NextResponse.json({ results });
  } catch (e) {
    return NextResponse.json(
      { error: `Server error: ${e instanceof Error ? e.message : String(e)}` },
      { status: 500 }
    );
  }
}
