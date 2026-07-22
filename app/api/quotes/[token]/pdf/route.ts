import { NextRequest, NextResponse } from "next/server";
import { getDB } from "@/lib/db";
import { quotePDF, quoteNumber } from "@/lib/pdf";
import { quoteUrl } from "@/lib/quote-flow";

// Public: download the quote PDF via its unguessable token.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const db = await getDB();
  const q = db.quotes.find((x) => x.public_token === token);
  if (!q) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const c = db.customers.find((x) => x.id === q.customer_id);
  if (!c) return NextResponse.json({ error: "Missing customer" }, { status: 404 });

  const bytes = await quotePDF(q, c, db.settings, quoteUrl(token));
  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${quoteNumber(q)}.pdf"`,
    },
  });
}
