import { NextRequest, NextResponse } from "next/server";
import { mutate, uid } from "@/lib/db";
import type { Content } from "@/lib/types";

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const item: Content = await mutate((db) => {
    const it: Content = {
      id: uid(body.type === "post" ? "pst_" : "gal_"),
      type: body.type,
      slug: body.slug || slugify(body.title || "untitled") || uid(),
      title: body.title || "Untitled",
      body: body.body || "",
      image: body.image || "",
      meta: body.meta || {},
      published: body.published ?? true,
      created_at: new Date().toISOString(),
    };
    db.content.unshift(it);
    return it;
  });
  return NextResponse.json({ ok: true, item });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  await mutate((db) => {
    const it = db.content.find((c) => c.id === body.id);
    if (!it) return;
    if (typeof body.title === "string") it.title = body.title;
    if (typeof body.body === "string") it.body = body.body;
    if (typeof body.published === "boolean") it.published = body.published;
    if (body.meta) it.meta = { ...it.meta, ...body.meta };
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  await mutate((db) => {
    db.content = db.content.filter((c) => c.id !== id);
  });
  return NextResponse.json({ ok: true });
}
