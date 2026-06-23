export const SITE_NAME = "Elite Shade Solutions";
export const SITE_TAGLINE = "Engineered Shade. Exceptional Spaces.";
export const SITE_DESCRIPTION =
  "Premium Kalahari shade sails, professionally installed in Cape Town. Get a real online estimate in two minutes with transparent pricing, engineered fixings, and owner-led service.";
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.eliteshadesolutions.co.za";

export function absUrl(path = "/") {
  return new URL(path, SITE_URL).toString();
}
