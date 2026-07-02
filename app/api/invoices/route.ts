import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { generateInvoice } from "@/lib/invoices";

// Generate a deposit or balance invoice for a confirmed quote.
export async function POST(req: NextRequest) {
  const { quoteId, type } = (await req.json()) as { quoteId: string; type: "deposit" | "balance" };
  const actor = await currentUser();
  const result = await generateInvoice(quoteId, type, actor?.name ?? "owner", actor?.id ?? "system");
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ ok: true, invoice: result.invoice });
}
