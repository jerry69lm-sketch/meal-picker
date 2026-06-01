import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");
  const radius = searchParams.get("radius") ?? "500";

  if (!lat || !lng) {
    return NextResponse.json({ error: "Missing lat/lng" }, { status: 400 });
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey || apiKey === "YOUR_GOOGLE_PLACES_API_KEY_HERE") {
    return NextResponse.json(
      { error: "API key not configured. Add GOOGLE_PLACES_API_KEY to .env.local" },
      { status: 500 }
    );
  }

  const url = new URL("https://maps.googleapis.com/maps/api/place/nearbysearch/json");
  url.searchParams.set("location", `${lat},${lng}`);
  url.searchParams.set("radius", radius);
  url.searchParams.set("type", "restaurant");
  url.searchParams.set("key", apiKey);

  const res = await fetch(url.toString(), { cache: "no-store" });
  const data = await res.json();

  if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
    return NextResponse.json(
      { error: `Google API error: ${data.status}` },
      { status: 502 }
    );
  }

  // Strip API key from photo references before returning to client
  const results = (data.results ?? []).map((place: Record<string, unknown>) => ({
    place_id: place.place_id,
    name: place.name,
    rating: place.rating,
    user_ratings_total: place.user_ratings_total,
    vicinity: place.vicinity,
    types: place.types,
    geometry: place.geometry,
    photos: (place.photos as Array<{ photo_reference: string }>)
      ? [{ photo_reference: (place.photos as Array<{ photo_reference: string }>)[0]?.photo_reference }]
      : [],
  }));

  return NextResponse.json({ results });
}
