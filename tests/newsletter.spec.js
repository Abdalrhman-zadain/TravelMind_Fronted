const { test, expect } = require("@playwright/test");

test("newsletter form submits email to the API and clears the field", async ({ page }) => {
  await page.route("**/api/attractions", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([])
    });
  });

  await page.route("**/api/hotels", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([])
    });
  });

  await page.route("**/api/restaurants", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([])
    });
  });

  let requestPayload = null;
  await page.route("**/api/newsletter/subscribe", async (route) => {
    requestPayload = route.request().postDataJSON();
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({
        message: "Subscription saved successfully.",
        subscription: {
          id: 1,
          email: requestPayload.email,
          source: requestPayload.source
        }
      })
    });
  });

  await page.goto("/index.html");

  const newsletterSection = page.locator(".newsletter-section");
  await expect(newsletterSection).toBeVisible();
  await expect(newsletterSection.locator("h3")).toContainText("Stay in the Loop");

  const emailInput = newsletterSection.locator('input[type="email"]');
  await emailInput.fill("traveler@example.com");
  await newsletterSection.locator('button[type="submit"]').click();

  await expect.poll(() => requestPayload).not.toBeNull();
  expect(requestPayload).toEqual({
    email: "traveler@example.com",
    source: "homepage"
  });

  await expect(emailInput).toHaveValue("");
  await expect(page.locator("#toast-container .toast")).toContainText("Thanks for subscribing!");
});
