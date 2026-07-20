import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const CANONICAL_HOST = (process.env.CANONICAL_HOSTNAME || "eliteshadesolutions.co.za").toLowerCase().trim();

function isAppHost(host: string) {
  const bareHost = host.toLowerCase().split(":")[0];
  const configured = process.env.APP_HOSTNAME?.toLowerCase().trim();

  if (configured) return bareHost === configured;

  return bareHost === "app.eliteshadesolutions.co.za" || bareHost === "app.eliteshadesolutions";
}

function isLocalHost(host: string) {
  return host === "localhost" || host === "127.0.0.1" || host.endsWith(".local");
}

export function middleware(req: NextRequest) {
  const host = (req.headers.get("host") || "").toLowerCase().split(":")[0];
  if (!host || isLocalHost(host)) return NextResponse.next();

  const isHttps = (req.headers.get("x-forwarded-proto") || req.nextUrl.protocol.replace(":", "")).toLowerCase() === "https";
  const isApp = isAppHost(host);
  const isCanonical = host === CANONICAL_HOST;
  const isWwwCanonical = host === `www.${CANONICAL_HOST}`;

  if (!isApp && (!isHttps || isWwwCanonical || !isCanonical)) {
    const url = req.nextUrl.clone();
    url.protocol = "https:";
    url.host = CANONICAL_HOST;
    return NextResponse.redirect(url, 308);
  }

  if (isApp && req.nextUrl.pathname === "/") {
    const url = req.nextUrl.clone();
    url.protocol = "https:";
    url.pathname = "/admin";
    return NextResponse.redirect(url, 307);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
