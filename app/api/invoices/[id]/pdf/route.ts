import { NextRequest, NextResponse } from "next/server";
import { getDB } from "@/lib/db";
import { invoicePDF } from "@/lib/pdf";
import { gatewayEnabled } from "@/lib/site";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = await getDB();
  const inv = db.invoices.find((i) => i.id === id);
  if (!inv) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const q = db.quotes.find((x) => x.id === inv.quote_id);
  const c = q && db.customers.find((x) => x.id === q.customer_id);
  if (!q || !c) return NextResponse.json({ error: "Missing quote/customer" }, { status: 404 });

  const bytes = await invoicePDF(inv, q, c, db.settings, gatewayEnabled(db.settings) ? `${req.nextUrl.origin}/pay/${inv.id}` : undefined);
  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${inv.number}.pdf"`,
    },
  });
}
