import { redirect } from "next/navigation";

export default function LegacyGoogleAnalyticsPage() {
  redirect("/admin/reports?tab=google-analytics");
}
