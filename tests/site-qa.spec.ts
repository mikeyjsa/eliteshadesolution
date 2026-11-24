import { expect, test } from "@playwright/test";

const publicRoutes = ["/", "/quote", "/shade-sails", "/how-it-works", "/gallery", "/blog", "/about", "/contact"];

test.describe("public site", () => {
  for (const route of publicRoutes) {
    test(`${route} renders without horizontal overflow on mobile`, async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(route);
      await expect(page.locator("body")).toBeVisible();
      const dimensions = await page.evaluate(() => ({ viewport: window.innerWidth, document: document.documentElement.scrollWidth }));
      expect(dimensions.document).toBeLessThanOrEqual(dimensions.viewport + 1);
    });
  }

  test("quote lead capture has durable labels and privacy reassurance", async ({ page }) => {
    await page.goto("/quote");
    await page.getByRole("button", { name: "Email my estimate" }).click();
    await expect(page.getByLabel("Name *")).toBeVisible();
    await expect(page.getByLabel("Email *")).toBeVisible();
    await expect(page.getByText(/No spam/)).toBeVisible();
  });

  test("contact form has accessible labels", async ({ page }) => {
    await page.goto("/contact");
    await expect(page.getByLabel("Name")).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("How can we help?")).toBeVisible();
  });
});

test.describe("admin boundaries", () => {
  test("admin pages redirect anonymous visitors", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/admin\/login$/);
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
  });

  const protectedRequests = [
    { method: "get", path: "/api/notifications", status: 401 },
    { method: "get", path: "/api/users", status: 403 },
    { method: "post", path: "/api/content", status: 401 },
    { method: "post", path: "/api/pricing", status: 401 },
    { method: "post", path: "/api/teams", status: 401 },
    { method: "post", path: "/api/leads/archive", status: 401 },
    { method: "patch", path: "/api/settings", status: 403 },
    { method: "post", path: "/api/settings/test-email", status: 403 },
  ] as const;

  for (const item of protectedRequests) {
    test(`${item.method.toUpperCase()} ${item.path} rejects anonymous access`, async ({ request }) => {
      const response = await request[item.method](item.path, { data: {} });
      expect(response.status()).toBe(item.status);
    });
  }

  test("private uploads reject anonymous access", async ({ request }) => {
    const response = await request.get("/uploads/payment-proofs/example.pdf");
    expect(response.status()).toBe(401);
  });
});
