import { NextRequest, NextResponse } from "next/server";
import { isPublicSiteOrigin } from "./lib/public-origin";

/** Exact-origin CORS for public guest endpoints only. Admin endpoints are excluded. */
export function middleware(req: NextRequest) {
  const origin = req.headers.get("origin");
  const allowed = isPublicSiteOrigin(origin);
  if (req.method === "OPTIONS") {
    if (!allowed) return new NextResponse(null, { status: 403 });
    return new NextResponse(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": origin!,
        "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, X-Photo-Delete-Token",
        "Access-Control-Max-Age": "600",
        Vary: "Origin"
      }
    });
  }
  const response = NextResponse.next();
  if (allowed) {
    response.headers.set("Access-Control-Allow-Origin", origin!);
    response.headers.set("Vary", "Origin");
  }
  return response;
}
export const config = {
  matcher: [
    "/api/public/:path*",
    "/api/rsvp",
    "/api/reservations/:path*",
    "/api/messages",
    "/api/photos/:path*"
  ]
};
