import type { Settings } from "@/lib/types";

export interface GoogleAnalyticsDashboard {
  configured: boolean;
  trackingConfigured: boolean;
  measurementId: string;
  propertyId: string;
  generatedAt?: string;
  error?: string;
  summary?: {
    activeUsers30d: number;
    activeUsers7d: number;
    newUsers30d: number;
    sessions30d: number;
    pageViews30d: number;
    engagedSessions30d: number;
    engagementRate30d: number;
    bounceRate30d: number;
    avgSessionDuration30d: number;
    events30d: number;
  };
  topPages?: Array<{
    title: string;
    path: string;
    views: number;
    activeUsers: number;
  }>;
  channels?: Array<{
    channel: string;
    sessions: number;
    activeUsers: number;
    engagedSessions: number;
  }>;
  events?: Array<{
    name: string;
    count: number;
    users: number;
  }>;
}

function metricNumber(value?: string | null): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizePrivateKey(key: string): string {
  return key.replace(/\\n/g, "\n").trim();
}

function cleanValue(value?: string | null): string {
  return value?.trim() || "";
}

export function hasGoogleAnalyticsReporting(settings: Settings): boolean {
  return Boolean(
    cleanValue(settings.ga_property_id) &&
      cleanValue(settings.ga_service_account_email) &&
      cleanValue(settings.ga_service_account_private_key)
  );
}

export async function getGoogleAnalyticsDashboard(
  settings: Settings
): Promise<GoogleAnalyticsDashboard> {
  const measurementId = cleanValue(settings.ga_measurement_id);
  const propertyId = cleanValue(settings.ga_property_id);
  const trackingConfigured = Boolean(measurementId);

  if (!hasGoogleAnalyticsReporting(settings)) {
    return {
      configured: false,
      trackingConfigured,
      measurementId,
      propertyId,
    };
  }

  try {
    const { BetaAnalyticsDataClient } = await import("@google-analytics/data");
    const client = new BetaAnalyticsDataClient({
      credentials: {
        client_email: cleanValue(settings.ga_service_account_email),
        private_key: normalizePrivateKey(
          cleanValue(settings.ga_service_account_private_key)
        ),
      },
    });

    const property = `properties/${propertyId}`;

    const [batch] = await client.batchRunReports({
      property,
      requests: [
        {
          dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
          metrics: [
            { name: "activeUsers" },
            { name: "newUsers" },
            { name: "sessions" },
            { name: "screenPageViews" },
            { name: "engagedSessions" },
            { name: "engagementRate" },
            { name: "bounceRate" },
            { name: "averageSessionDuration" },
            { name: "eventCount" },
          ],
        },
        {
          dateRanges: [{ startDate: "7daysAgo", endDate: "today" }],
          metrics: [{ name: "activeUsers" }],
        },
        {
          dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
          dimensions: [{ name: "pageTitle" }, { name: "pagePath" }],
          metrics: [{ name: "screenPageViews" }, { name: "activeUsers" }],
          orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
          limit: 8,
        },
        {
          dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
          dimensions: [{ name: "sessionDefaultChannelGroup" }],
          metrics: [
            { name: "sessions" },
            { name: "activeUsers" },
            { name: "engagedSessions" },
          ],
          orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
          limit: 8,
        },
        {
          dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
          dimensions: [{ name: "eventName" }],
          metrics: [{ name: "eventCount" }, { name: "totalUsers" }],
          orderBys: [{ metric: { metricName: "eventCount" }, desc: true }],
          limit: 10,
        },
      ],
    });

    const reports = batch.reports ?? [];
    const overview30 = reports[0]?.rows?.[0];
    const overview7 = reports[1]?.rows?.[0];
    const topPagesRows = reports[2]?.rows ?? [];
    const channelRows = reports[3]?.rows ?? [];
    const eventRows = reports[4]?.rows ?? [];

    return {
      configured: true,
      trackingConfigured,
      measurementId,
      propertyId,
      generatedAt: new Date().toISOString(),
      summary: {
        activeUsers30d: metricNumber(
          overview30?.metricValues?.[0]?.value
        ),
        newUsers30d: metricNumber(overview30?.metricValues?.[1]?.value),
        sessions30d: metricNumber(overview30?.metricValues?.[2]?.value),
        pageViews30d: metricNumber(overview30?.metricValues?.[3]?.value),
        engagedSessions30d: metricNumber(
          overview30?.metricValues?.[4]?.value
        ),
        engagementRate30d: metricNumber(
          overview30?.metricValues?.[5]?.value
        ),
        bounceRate30d: metricNumber(overview30?.metricValues?.[6]?.value),
        avgSessionDuration30d: metricNumber(
          overview30?.metricValues?.[7]?.value
        ),
        events30d: metricNumber(overview30?.metricValues?.[8]?.value),
        activeUsers7d: metricNumber(overview7?.metricValues?.[0]?.value),
      },
      topPages: topPagesRows.map((row) => ({
        title: row.dimensionValues?.[0]?.value || "Untitled page",
        path: row.dimensionValues?.[1]?.value || "/",
        views: metricNumber(row.metricValues?.[0]?.value),
        activeUsers: metricNumber(row.metricValues?.[1]?.value),
      })),
      channels: channelRows.map((row) => ({
        channel: row.dimensionValues?.[0]?.value || "Unassigned",
        sessions: metricNumber(row.metricValues?.[0]?.value),
        activeUsers: metricNumber(row.metricValues?.[1]?.value),
        engagedSessions: metricNumber(row.metricValues?.[2]?.value),
      })),
      events: eventRows.map((row) => ({
        name: row.dimensionValues?.[0]?.value || "unknown_event",
        count: metricNumber(row.metricValues?.[0]?.value),
        users: metricNumber(row.metricValues?.[1]?.value),
      })),
    };
  } catch (error) {
    return {
      configured: true,
      trackingConfigured,
      measurementId,
      propertyId,
      error:
        error instanceof Error
          ? error.message
          : "Could not load Google Analytics data.",
    };
  }
}
