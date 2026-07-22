export const SITE_NAME = "Elite Shade Solutions";
export const SITE_TAGLINE = "Engineered Shade. Exceptional Spaces.";
export const SITE_DESCRIPTION =
  "Premium Kalahari shade sails, professionally installed in Cape Town. Get a real online estimate in two minutes with transparent pricing, engineered fixings, and owner-led service.";
const DEFAULT_SITE_URL = "https://eliteshadesolutions.co.za";
const PRIVATE_HOSTS = new Set(["0.0.0.0", "127.0.0.1", "localhost", "::1"]);

function publicSiteUrl(value?: string): string {
  try {
    const url = new URL(value?.trim() || DEFAULT_SITE_URL);
    const hostname = url.hostname.toLowerCase();
    if (!/^https?:$/.test(url.protocol) || PRIVATE_HOSTS.has(hostname)) {
      return DEFAULT_SITE_URL;
    }
    if (hostname === "www.eliteshadesolutions.co.za") return DEFAULT_SITE_URL;
    return url.origin;
  } catch {
    return DEFAULT_SITE_URL;
  }
}

export const SITE_URL = publicSiteUrl(process.env.NEXT_PUBLIC_SITE_URL);

export function absUrl(path = "/") {
  return new URL(path, SITE_URL).toString();
}

export const DEFAULT_EFT_DETAILS =
  "Bank: FNB\nAccount name: Elite Shade Solutions\nAccount number: 630 123 4567\nBranch code: 250 655";

export function cleanEmail(value?: string) {
  return value?.trim().toLowerCase() || "";
}

export function notificationEmails(settings: {
  info_email?: string;
  notification_emails?: string;
}) {
  const list = [
    cleanEmail(settings.info_email),
    ...(settings.notification_emails || "")
      .split(/[\n,;]/)
      .map((item) => cleanEmail(item))
      .filter(Boolean),
  ];
  return Array.from(new Set(list)).filter(Boolean);
}

export function adminNotificationEmails(source: {
  settings: {
    info_email?: string;
    notification_emails?: string;
  };
  users?: Array<{
    email: string;
    active: boolean;
    receive_admin_notifications?: boolean;
    role?: string;
  }>;
}) {
  const optedInUsers = (source.users || [])
    .filter((user) => user.active && user.receive_admin_notifications !== false)
    .map((user) => cleanEmail(user.email))
    .filter(Boolean);

  return Array.from(
    new Set([
      ...notificationEmails(source.settings),
      ...optedInUsers,
    ]),
  ).filter(Boolean);
}

export function eftDetails(settings: { eft_details?: string }): string {
  return settings.eft_details?.trim() || DEFAULT_EFT_DETAILS;
}

export function paymentMode(settings: { payment_mode?: "payfast_and_eft" | "eft_only" }) {
  return settings.payment_mode === "eft_only" ? "eft_only" : "payfast_and_eft";
}

export function gatewayEnabled(settings: { payment_mode?: "payfast_and_eft" | "eft_only" }) {
  return paymentMode(settings) === "payfast_and_eft";
}

export function paymentOptionsLabel(settings: { payment_mode?: "payfast_and_eft" | "eft_only" }) {
  return gatewayEnabled(settings) ? "PayFast or EFT" : "EFT";
}

export function paymentOptionsSentence(settings: { payment_mode?: "payfast_and_eft" | "eft_only" }) {
  return gatewayEnabled(settings) ? "PayFast card payment or direct EFT" : "direct EFT";
}
