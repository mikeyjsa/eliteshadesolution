import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

function isAppHost(host: string) {
  const bareHost = host.toLowerCase().split(":")[0];
  const configured = process.env.APP_HOSTNAME?.toLowerCase().trim();

  if (configured) return bareHost === configured;

  return bareHost === "app.eliteshadesolutions.co.za" || bareHost === "app.eliteshadesolutions";
}

export function middleware(req: NextRequest) {
  if (req.nextUrl.pathname !== "/") return NextResponse.next();
  if (!isAppHost(req.headers.get("host") || "")) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = "/admin";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/"],
};
