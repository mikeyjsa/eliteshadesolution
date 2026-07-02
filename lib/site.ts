export const SITE_NAME = "Elite Shade Solutions";
export const SITE_TAGLINE = "Engineered Shade. Exceptional Spaces.";
export const SITE_DESCRIPTION =
  "Premium Kalahari shade sails, professionally installed in Cape Town. Get a real online estimate in two minutes with transparent pricing, engineered fixings, and owner-led service.";
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.eliteshadesolutions.co.za";

export function absUrl(path = "/") {
  return new URL(path, SITE_URL).toString();
}

export const DEFAULT_EFT_DETAILS =
  "Bank: FNB\nAccount name: Elite Shade Solutions\nAccount number: 630 123 4567\nBranch code: 250 655";

export function eftDetails(settings: { eft_details?: string }): string {
  return settings.eft_details?.trim() || DEFAULT_EFT_DETAILS;
}
