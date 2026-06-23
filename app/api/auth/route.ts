import { NextRequest, NextResponse } from "next/server";
import { findUser, sessionToken, COOKIE, COOKIE_USER } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();
  const user = await findUser(email ?? "", password ?? "");
  if (!user) {
    return NextResponse.json({ error: "Incorrect email or password" }, { status: 401 });
  }
  const token = sessionToken(user.id, user.password);
  const res = NextResponse.json({ ok: true, user: { id: user.id, name: user.name, role: user.role } });
  const cookieOpts = { httpOnly: true, sameSite: "lax" as const, path: "/", maxAge: 60 * 60 * 24 * 7 };
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
