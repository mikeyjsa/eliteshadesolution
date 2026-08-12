import AdminHead from "@/components/AdminHead";
import EmailMarketingManager from "@/components/EmailMarketingManager";
import { currentUser } from "@/lib/auth";
import { getDB } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function EmailMarketingPage() {
  const [db, user] = await Promise.all([getDB(), currentUser()]);
  const salesEmail = db.settings.sales_email?.trim() || "sales@eliteshadesolutions.co.za";
  const infoEmail = db.settings.info_email?.trim() || "info@eliteshadesolutions.co.za";

  return (
    <>
      <AdminHead eyebrow="Engagement" title="Email Marketing" />
      <div style={{ padding: 28 }}>
        <EmailMarketingManager
          initialLists={db.mailing_lists}
          initialCampaigns={db.email_campaigns}
          initialSends={db.email_campaign_sends}
          salesEmail={salesEmail}
          infoEmail={infoEmail}
          testEmail={user?.email || salesEmail}
          testName={user?.name || "Test Recipient"}
        />
      </div>
    </>
  );
}
