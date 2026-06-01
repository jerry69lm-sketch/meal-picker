import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");
    const radius = searchParams.get("radius") ?? "500";

    if (!lat || !lng) {
      return NextResponse.json({ error: "Missing lat/lng" }, { status: 400 });
    }

    const apiKey = process.env.FOURSQUARE_API_KEY;
    if (!apiKey || apiKey === "YOUR_FOURSQUARE_API_KEY_HERE") {
      return NextResponse.json(
        { error: "Foursquare API key not configured" },
        { status: 500 }
      );
    }

    // Use /places/search — more reliable than /nearby for free tier
    const url = new URL("https://api.foursquare.com/v3/places/search");
    url.searchParams.set("ll", `${lat},${lng}`);
    url.searchParams.set("radius", radius);
    url.searchParams.set("categories", "13065"); // Food & Dining
    url.searchParams.set("limit", "50");
    url.searchParams.set(
      "fields",
      "fsq_id,name,rating,stats,location,geocodes,categories,photos,distance"
    );

    const res = await fetch(url.toString(), {
      headers: {
        Authorization: apiKey,
        Accept: "application/json",
      },
      cache: "no-store",
    });

    const text = await res.text();

    if (!res.ok) {
      console.error("Foursquare error:", res.status, text);
      return NextResponse.json(
        { error: `Foursquare 錯誤 (${res.status}): ${text}` },
        { status: 502 }
      );
    }

    const data = JSON.parse(text);

    const results = (data.results ?? []).map((place: FoursquarePlace) => {
      // Safely build photo URL
      let photo: string | null = null;
      try {
        const p = place.photos?.[0];
        if (p?.prefix && p?.suffix) {
          const candidate = `${p.prefix}400x300${p.suffix}`;
          // Quick sanity check — must be a valid https URL
          new URL(candidate);
          photo = candidate;
        }
      } catch {
        photo = null;
      }

      // Safely get coordinates
      const placeLat =
        place.geocodes?.main?.latitude ??
        place.location?.lat ??
        parseFloat(lat);
      const placeLng =
        place.geocodes?.main?.longitude ??
        place.location?.lng ??
        parseFloat(lng);

      return {
        place_id: place.fsq_id ?? String(Math.random()),
        name: place.name ?? "未知餐廳",
        rating: typeof place.rating === "number" ? place.rating / 2 : null,
        rating_raw: place.rating ?? null,
        user_ratings_total: place.stats?.total_ratings ?? 0,
        vicinity:
          place.location?.formatted_address ??
          place.location?.address ??
          "",
        types: (place.categories ?? []).map((c) => c.name),
        distance: place.distance ?? 0,
        photo,
        geometry: { location: { lat: placeLat, lng: placeLng } },
      };
    });

    return NextResponse.json({ results });

  } catch (err) {
    console.error("Places route error:", err);
    return NextResponse.json(
      { error: "伺服器錯誤，請稍後再試" },
      { status: 500 }
    );
  }
}

interface FoursquarePlace {
  fsq_id?: string;
  name?: string;
  rating?: number;
  stats?: { total_ratings: number };
  location?: {
    address?: string;
    formatted_address?: string;
    lat?: number;
    lng?: number;
  };
  categories?: { name: string }[];
  photos?: { prefix: string; suffix: string }[];
  distance?: number;
  geocodes?: { main?: { latitude: number; longitude: number } };
}
