import { NextRequest, NextResponse } from "next/server";
import { findUser, sessionToken, COOKIE, COOKIE_USER } from "@/lib/auth";
import { checkRateLimit, clearRateLimit, clientAddress } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const rateKey = `login:${clientAddress(req)}`;
  const limit = checkRateLimit(rateKey, 8, 15 * 60_000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many sign-in attempts. Please wait and try again." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
    );
  }
  const { email, password } = await req.json();
  const user = await findUser(email ?? "", password ?? "");
  if (!user) {
    return NextResponse.json({ error: "Incorrect email or password" }, { status: 401 });
  }
  clearRateLimit(rateKey);
  const token = sessionToken(user.id, user.password);
  const res = NextResponse.json({ ok: true, user: { id: user.id, name: user.name, role: user.role } });
  const cookieOpts = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  };
  res.cookies.set(COOKIE, token, cookieOpts);
  res.cookies.set(COOKIE_USER, user.id, cookieOpts);
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, "", { path: "/", maxAge: 0 });
  res.cookies.set(COOKIE_USER, "", { path: "/", maxAge: 0 });
  return res;
}
