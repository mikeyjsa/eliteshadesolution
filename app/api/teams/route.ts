import { NextRequest, NextResponse } from "next/server";
import { getDB, mutate, uid } from "@/lib/db";
import type { Team } from "@/lib/types";

export async function GET() {
  const db = await getDB();
  return NextResponse.json(db.teams);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!body.name) {
    return NextResponse.json({ error: "Team name required" }, { status: 400 });
  }

  const team: Team = await mutate((db) => {
    const next: Team = {
      id: uid("team_"),
      name: String(body.name).trim(),
      email: String(body.email || "").trim(),
      members: String(body.members || "").trim(),
      active: body.active !== false,
      created_at: new Date().toISOString(),
    };
    db.teams.unshift(next);
    return next;
  });

  return NextResponse.json({ ok: true, team });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  if (!body.id) return NextResponse.json({ error: "Team id required" }, { status: 400 });

  await mutate((db) => {
    const team = db.teams.find((item) => item.id === body.id);
    if (!team) return;
    if (typeof body.name === "string") team.name = body.name.trim();
    if (typeof body.email === "string") team.email = body.email.trim();
    if (typeof body.members === "string") team.members = body.members.trim();
    if (typeof body.active === "boolean") team.active = body.active;

    db.installations.forEach((installation) => {
      if (installation.team_id === team.id) {
        installation.installer = team.name;
      }
    });
  });

  return NextResponse.json({ ok: true });
}
