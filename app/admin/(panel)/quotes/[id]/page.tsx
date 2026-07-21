import Link from "next/link";
import { notFound } from "next/navigation";
import { getDB } from "@/lib/db";
import { ratesFromPricing } from "@/lib/quote-engine";
import AdminHead from "@/components/AdminHead";
import QuoteDetail from "@/components/QuoteDetail";
import ViewTracker from "@/components/ViewTracker";

export const dynamic = "force-dynamic";

export default async function QuotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = await getDB();
  const quote = db.quotes.find((q) => q.id === id);
  if (!quote) notFound();
  const customer = db.customers.find((c) => c.id === quote.customer_id)!;
  const invoices = db.invoices.filter((i) => i.quote_id === id);
  const activities = db.activities.filter((a) => a.quote_id === id);
  const install = db.installations.find((i) => i.quote_id === id);
  const rates = ratesFromPricing(db.pricing);

  return (
    <>
      <AdminHead eyebrow="Lead detail" title={`Quote ${quote.id.slice(0, 10)}`}>
        <Link href="/admin/leads" className="btn-ghost" style={{ padding: "0.5rem 1rem", fontSize: 13 }}>← Pipeline</Link>
      </AdminHead>
      <ViewTracker quoteId={quote.id} type="Quote" />
      <div style={{ padding: 28 }}>
        <QuoteDetail
          quote={quote}
          customer={customer}
          invoices={invoices}
          activities={activities}
          teams={db.teams.filter((team) => team.active)}
          scheduledTeamId={install?.team_id ?? null}
          depositPct={db.settings.deposit_pct}
          scheduledDate={install?.scheduled_date ?? null}
          addOptions={db.pricing.map((p) => ({ label: p.label, amount: p.rate }))}
          rates={rates}
        />
      </div>
    </>
  );
}
