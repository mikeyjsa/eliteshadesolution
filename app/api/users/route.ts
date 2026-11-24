import { NextRequest, NextResponse } from "next/server";
import { getDB, mutate, uid } from "@/lib/db";
import type { AdminUser } from "@/lib/types";
import { currentUser } from "@/lib/auth";
import { hashPassword } from "@/lib/passwords";

async function requireAdmin() {
  const me = await currentUser();
  return me?.role === "admin" ? me : null;
}

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Admin only" }, { status: 403 });
  const db = await getDB();
  return NextResponse.json(db.users.map((u) => ({ ...u, password: undefined })));
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Admin only" }, { status: 403 });
  const body = await req.json();
  if (!body.email || !body.password || !body.name) {
    return NextResponse.json({ error: "name, email, password required" }, { status: 400 });
  }
  const user: AdminUser = await mutate((db) => {
    const existing = db.users.find((u) => u.email.toLowerCase() === body.email.toLowerCase());
    if (existing) {
      existing.name = body.name;
      existing.password = hashPassword(String(body.password));
      existing.role = body.role ?? "manager";
      existing.active = true;
      existing.receive_admin_notifications = typeof body.receive_admin_notifications === "boolean" ? body.receive_admin_notifications : true;
      return existing;
    }
    const u: AdminUser = {
      id: uid("usr_"),
      name: body.name,
      email: body.email,
      password: hashPassword(String(body.password)),
      role: body.role ?? "manager",
      active: true,
      receive_admin_notifications: typeof body.receive_admin_notifications === "boolean" ? body.receive_admin_notifications : true,
      created_at: new Date().toISOString(),
    };
    db.users.push(u);
    return u;
  });
  return NextResponse.json({ ok: true, user: { ...user, password: undefined } });
}

export async function PATCH(req: NextRequest) {
  const me = await requireAdmin();
  if (!me) return NextResponse.json({ error: "Admin only" }, { status: 403 });
  const body = await req.json();
  const result = await mutate((db) => {
    const u = db.users.find((x) => x.id === body.id);
    if (!u) return { error: "User not found", status: 404 };
    const requestedEmail = typeof body.email === "string" ? body.email.trim().toLowerCase() : u.email.toLowerCase();
    if (db.users.some((candidate) => candidate.id !== u.id && candidate.email.toLowerCase() === requestedEmail)) {
      return { error: "That email address is already in use", status: 409 };
    }
    const removingAdminAccess = u.role === "admin" && (body.role === "manager" || body.active === false);
    const activeAdmins = db.users.filter((candidate) => candidate.role === "admin" && candidate.active);
    if (removingAdminAccess && activeAdmins.length <= 1) {
      return { error: "Keep at least one active administrator", status: 400 };
    }
    if (u.id === me.id && body.active === false) {
      return { error: "You cannot deactivate your own account", status: 400 };
    }
    if (typeof body.name === "string") u.name = body.name;
    if (typeof body.email === "string") u.email = body.email.trim();
    if (typeof body.password === "string" && body.password) u.password = hashPassword(body.password);
    if (body.role === "admin" || body.role === "manager") u.role = body.role;
    if (typeof body.active === "boolean") u.active = body.active;
    if (typeof body.receive_admin_notifications === "boolean") {
      u.receive_admin_notifications = body.receive_admin_notifications;
    }
    return { ok: true };
  });
  if (result?.error) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ ok: true });
}
