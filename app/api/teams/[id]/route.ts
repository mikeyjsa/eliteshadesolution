import { NextRequest, NextResponse } from "next/server";
import { mutate } from "@/lib/db";
import { currentUser } from "@/lib/auth";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await currentUser())) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const { id } = await params;

  await mutate((db) => {
    db.teams = db.teams.filter((team) => team.id !== id);
    db.installations.forEach((installation) => {
      if (installation.team_id === id) {
        installation.team_id = null;
      }
    });
  });

  return NextResponse.json({ ok: true });
}
