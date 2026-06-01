import { NextRequest, NextResponse } from "next/server";

// Proxy the Places Photo API so the key never reaches the browser
export async function GET(req: NextRequest) {
  const ref = new URL(req.url).searchParams.get("ref");
  if (!ref) return NextResponse.json({ error: "Missing ref" }, { status: 400 });

  const apiKey = process.env.GOOGLE_PLACES_API_KEY!;
  const url = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=600&photo_reference=${ref}&key=${apiKey}`;

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return NextResponse.json({ error: "Photo fetch failed" }, { status: 502 });

  const buffer = await res.arrayBuffer();
  const contentType = res.headers.get("content-type") ?? "image/jpeg";

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=86400",
    },
  });
}
