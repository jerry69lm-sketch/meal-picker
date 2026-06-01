import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
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
      { error: "Foursquare API key not set. Add FOURSQUARE_API_KEY to .env.local" },
      { status: 500 }
    );
  }

  // Foursquare v3 Nearby Search
  // Category 13065 = Food & Dining (all restaurants, cafes, etc.)
  const url = new URL("https://api.foursquare.com/v3/places/nearby");
  url.searchParams.set("ll", `${lat},${lng}`);
  url.searchParams.set("radius", radius);
  url.searchParams.set("categories", "13065");
  url.searchParams.set("limit", "50");
  // Request rating + photos + location in one call
  url.searchParams.set("fields", "fsq_id,name,rating,stats,location,categories,photos,distance");

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: apiKey,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const err = await res.text();
    return NextResponse.json({ error: `Foursquare error: ${err}` }, { status: 502 });
  }

  const data = await res.json();

  const results = (data.results ?? []).map((place: FoursquarePlace) => ({
    place_id: place.fsq_id,
    name: place.name,
    // Foursquare rating is 0–10; convert to 0–5 stars for display
    rating: place.rating ? place.rating / 2 : null,
    rating_raw: place.rating ?? null,         // keep original /10 for display
    user_ratings_total: place.stats?.total_ratings ?? 0,
    vicinity: place.location?.formatted_address ?? place.location?.address ?? "",
    types: (place.categories ?? []).map((c) => c.name),
    distance: place.distance ?? 0,
    // First photo from Foursquare: prefix + "300x300" + suffix
    photo: place.photos?.[0]
      ? `${place.photos[0].prefix}400x300${place.photos[0].suffix}`
      : null,
    geometry: {
      location: {
        lat: place.geocodes?.main?.latitude ?? parseFloat(lat),
        lng: place.geocodes?.main?.longitude ?? parseFloat(lng),
      },
    },
  }));

  return NextResponse.json({ results });
}

interface FoursquarePlace {
  fsq_id: string;
  name: string;
  rating?: number;
  stats?: { total_ratings: number };
  location?: { address?: string; formatted_address?: string };
  categories?: { name: string }[];
  photos?: { prefix: string; suffix: string }[];
  distance?: number;
  geocodes?: { main?: { latitude: number; longitude: number } };
}
