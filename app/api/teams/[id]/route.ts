import { NextRequest, NextResponse } from "next/server";
import { mutate } from "@/lib/db";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
