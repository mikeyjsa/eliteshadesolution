import type { MetadataRoute } from "next";
import { getDB } from "@/lib/db";
import { SITE_URL } from "@/lib/site";

const STATIC_ROUTES = [
  "",
  "/quote",
  "/shade-sails",
  "/how-it-works",
  "/gallery",
  "/blog",
  "/about",
  "/contact",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const db = await getDB();
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((route, i) => ({
    url: `${SITE_URL}${route || "/"}`,
    lastModified: now,
    changeFrequency: route === "" ? "weekly" : "monthly",
    priority: route === "" ? 1 : route === "/quote" ? 0.95 : 0.8,
  }));

  const blogEntries: MetadataRoute.Sitemap = db.content
    .filter((c) => c.type === "post" && c.published)
    .map((post) => ({
      url: `${SITE_URL}/blog/${post.slug}`,
      lastModified: new Date(post.created_at),
      changeFrequency: "monthly" as const,
      priority: 0.72,
    }));

  return [...staticEntries, ...blogEntries];
}
