import Link from "next/link";
import { notFound } from "next/navigation";
import { getDB } from "@/lib/db";
import AdminHead from "@/components/AdminHead";
import InvoiceDetail from "@/components/InvoiceDetail";
import ViewTracker from "@/components/ViewTracker";

export const dynamic = "force-dynamic";

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = await getDB();
  const invoice = db.invoices.find((i) => i.id === id);
  if (!invoice) notFound();
  const quote = db.quotes.find((q) => q.id === invoice.quote_id)!;
  const customer = db.customers.find((c) => c.id === quote.customer_id)!;

  return (
    <>
      <AdminHead eyebrow="Invoice" title={invoice.number}>
        <Link href={`/admin/quotes/${quote.id}`} className="btn-ghost" style={{ padding: "0.5rem 1rem", fontSize: 13 }}>Lead →</Link>
        <Link href="/admin/invoices" className="btn-ghost" style={{ padding: "0.5rem 1rem", fontSize: 13 }}>← All invoices</Link>
      </AdminHead>
      <ViewTracker quoteId={quote.id} type={`Invoice ${invoice.number}`} />
      <div style={{ padding: 28 }}>
        <InvoiceDetail invoice={invoice} quote={quote} customer={customer} />
      </div>
    </>
  );
}
