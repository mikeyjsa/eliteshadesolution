import { NextResponse } from "next/server";
import { mutate, uid } from "@/lib/db";

// Archive all completed/paid jobs (status "installed") in one action.
export async function POST() {
  const now = new Date().toISOString();
  const count = await mutate((db) => {
    let n = 0;
    for (const q of db.quotes) {
      if (q.status === "installed" && !q.archived) {
        q.archived = true;
        n++;
        db.activities.unshift({ id: uid("act_"), quote_id: q.id, user: "owner", user_id: "system", type: "archive", message: "Archived (bulk — paid & complete).", created_at: now });
      }
    }
    return n;
  });
  return NextResponse.json({ ok: true, archived: count });
}
