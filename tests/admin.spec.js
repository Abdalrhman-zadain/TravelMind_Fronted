const { test, expect } = require("@playwright/test");

const attractions = [
  {
    id: 11,
    nameEn: "Petra",
    nameAr: "البتراء",
    city: "Maan",
    category: "Historic",
    descriptionEn: "Rose-red city",
    descriptionAr: "مدينة وردية",
    rating: 4.9,
    entryFee: 50,
  },
  {
    id: 12,
    nameEn: "Jerash",
    nameAr: "جرش",
    city: "Jerash",
    category: "Ruins",
    descriptionEn: "Roman ruins",
    descriptionAr: "آثار رومانية",
    rating: 4.8,
    entryFee: 15,
  },
];

const hotels = [
  {
    id: 41,
    nameEn: "Petra Moon Hotel",
    city: "Wadi Musa",
    stars: 4,
    rating: 4.5,
    pricePerNight: 110,
    country: "Jordan",
  },
];

const restaurants = [
  {
    id: 51,
    nameEn: "Sufra Restaurant",
    city: "Amman",
    cuisine: "Jordanian",
    rating: 4.6,
    phone: "+962700000000",
  },
];

const companies = [
  {
    id: 1,
    name: "Petra Trails",
    city: "Amman",
    rating: 4.7,
    reviewsCount: 52,
    tours: [{ id: 101, title: "Petra Full Day", active: true }],
    packages: [{ id: 201, title: "Jordan Explorer", active: true }],
    transportServices: [],
    specialOffer: { active: true, discountPercentage: 15 },
  },
];

const stories = [
  {
    id: 301,
    title: "Sunrise in Petra",
    user: { name: "Nour" },
    destination: "Petra",
    sponsorCompanyName: "Petra Trails",
    viewsCount: 120,
    isActive: true,
  },
  {
    id: 302,
    title: "Dead Sea Weekend",
    user: { name: "Sami" },
    destination: "Dead Sea",
    sponsorCompanyName: "Jordan Escape",
    viewsCount: 80,
    isActive: false,
  },
];

async function mockAdminApis(page) {
  const attractionRows = attractions.map((item) => ({ ...item }));
  const hotelRows = hotels.map((item) => ({ ...item }));
  const restaurantRows = restaurants.map((item) => ({ ...item }));
  const companyRows = companies.map((item) => ({ ...item }));

  await page.route("**/api/companies", async (route) => {
    const method = route.request().method();
    if (method === "POST") {
      const body = route.request().postDataJSON();
      companyRows.push({
        id: 2,
        name: body.name,
        city: body.city,
        website: body.website || "",
        rating: body.rating ?? null,
        reviewsCount: body.reviewsCount ?? 0,
        tours: [],
        packages: [],
        transportServices: [],
      });
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify(companyRows[companyRows.length - 1]),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(companyRows),
    });
  });

  await page.route("**/api/bookings", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([
        {
          id: 9001,
          customerName: "Layla",
          companyId: 1,
          serviceId: 101,
          serviceType: "Tour",
          bookingStatus: "Confirmed",
          totalPrice: 120,
          createdAt: "2026-06-15T10:00:00.000Z",
        },
        {
          id: 9002,
          customerName: "Omar",
          companyId: 1,
          serviceId: 201,
          serviceType: "Package",
          bookingStatus: "Pending",
          totalPrice: 240,
          createdAt: "2026-06-16T12:00:00.000Z",
        },
      ]),
    });
  });

  await page.route("**/api/users", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([
        { id: 1, name: "Admin User" },
        { id: 2, name: "Traveler" },
      ]),
    });
  });

  await page.route("**/api/analytics/admin*", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        totalUsers: 2,
        totalCompanies: 1,
        totalBookings: 2,
        totalRevenue: 360,
        mostPopularDestinations: [{ name: "Amman" }],
        mostBookedTours: [{ name: "Petra Full Day" }],
        topPerformingCompanies: [{ name: "Petra Trails" }],
      }),
    });
  });

  await page.route("**/api/dashboard-notifications*", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([
        {
          id: 501,
          title: "New booking received",
          message: "Layla booked Petra Full Day.",
          timestamp: "2026-06-16T12:00:00.000Z",
          isRead: false,
        },
      ]),
    });
  });

  await page.route("**/api/attractions", async (route) => {
    const method = route.request().method();
    if (method === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(attractionRows),
      });
      return;
    }

    if (method === "POST") {
      const body = route.request().postDataJSON();
      attractionRows.push({
        id: 13,
        nameEn: body.nameEn,
        city: body.city,
        category: body.category || "",
        rating: body.rating ?? 0,
        entryFee: body.entryFee ?? 0,
      });
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify(attractionRows[attractionRows.length - 1]),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true }),
    });
  });

  await page.route("**/api/hotels", async (route) => {
    const method = route.request().method();
    if (method === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(hotelRows),
      });
      return;
    }

    if (method === "POST") {
      const body = route.request().postDataJSON();
      hotelRows.push({
        id: 42,
        nameEn: body.nameEn,
        city: body.city,
        stars: body.stars ?? null,
        rating: body.rating ?? 0,
        pricePerNight: body.pricePerNight ?? 0,
        country: body.country || "Jordan",
      });
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify(hotelRows[hotelRows.length - 1]),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true }),
    });
  });

  await page.route("**/api/restaurants", async (route) => {
    const method = route.request().method();
    if (method === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(restaurantRows),
      });
      return;
    }

    if (method === "POST") {
      const body = route.request().postDataJSON();
      restaurantRows.push({
        id: 52,
        nameEn: body.nameEn,
        city: body.city,
        cuisine: body.cuisine || "",
        rating: body.rating ?? 0,
        phone: body.phone || "",
      });
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify(restaurantRows[restaurantRows.length - 1]),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true }),
    });
  });

  await page.route("**/api/admin/traveler-stories", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(stories),
    });
  });
}

async function loginAsAdmin(page) {
  await page.addInitScript(() => {
    localStorage.setItem("tm_token", "fake-admin-token");
    localStorage.setItem(
      "tm_user",
      JSON.stringify({ id: 1, name: "Admin User", role: "ADMIN" })
    );
  });
}

test("redirects unauthenticated users to auth", async ({ page }) => {
  await page.goto("/admin.html");
  await expect(page).toHaveURL(/auth\.html\?redirect=admin\.html/);
});

test.describe("authenticated admin", () => {
  test.beforeEach(async ({ page }) => {
    await mockAdminApis(page);
    await loginAsAdmin(page);
  });

  test("loads dashboard and catalog data", async ({ page }) => {
    await page.goto("/admin.html");

    await expect(page.locator("#section-dashboard")).toHaveClass(/active/);
    await expect(page.locator("#metric-grid .metric-card")).toHaveCount(7);

    await page.getByRole("link", { name: "Catalog Manager" }).click();
    await expect(page.locator("#section-list")).toHaveClass(/active/);
    await expect(page.locator("#attractions-tbody tr")).toHaveCount(2);
    await expect(page.locator("#attractions-tbody")).toContainText("Petra");
    await expect(page.locator("#attractions-tbody")).toContainText("Jerash");
  });

  test("filters catalog rows by search text", async ({ page }) => {
    await page.goto("/admin.html");
    await page.getByRole("link", { name: "Catalog Manager" }).click();

    await page.locator("#search-input").fill("Jerash");
    await expect(page.locator("#attractions-tbody tr")).toHaveCount(1);
    await expect(page.locator("#attractions-tbody")).toContainText("Jerash");
    await expect(page.locator("#attractions-tbody")).not.toContainText("Petra");
  });

  test("shows client validation for missing required fields", async ({ page }) => {
    await page.goto("/admin.html");
    await page.getByRole("link", { name: "Add New Item" }).click();

    await page.locator("#field-nameEn").evaluate((element) => {
      element.removeAttribute("required");
    });
    await page.locator("#field-city").evaluate((element) => {
      element.removeAttribute("required");
    });
    await page.locator("#submit-btn").click();

    await expect(page.locator("#form-message")).toBeVisible();
    await expect(page.locator("#form-message")).toContainText(
      "Attraction nameEn is required."
    );
  });

  test("generates a filtered booking report from the dashboard button", async ({ page }) => {
    await page.goto("/admin.html");

    await page.locator("#report-tour-filter").selectOption("101");
    await page.getByRole("button", { name: "Generate Report" }).click();

    await expect(page.locator("#report-summary")).toContainText("Report ready: 1 booking");
    await expect(page.locator("#report-results")).toContainText("Petra Trails");
    await expect(page.locator("#report-results")).toContainText("Petra Full Day");
    await expect(page.locator("#report-results")).not.toContainText("Jordan Explorer");
  });

  test("creates a hotel from the admin item form", async ({ page }) => {
    await page.goto("/admin.html");
    await page.getByRole("link", { name: "Add New Item" }).click();

    await page.locator("#form-entity-type").selectOption("hotel");
    await page.locator("#field-nameEn").fill("Mosaic Gate Hotel");
    await page.locator("#field-city").fill("Madaba");
    await page.locator("#field-stars").fill("4");
    await page.locator("#field-pricePerNight").fill("95");
    await page.locator("#submit-btn").click();

    await expect(page.locator("#form-message")).toContainText("Hotel created successfully");

    await page.getByRole("link", { name: "Catalog Manager" }).click();
    await page.locator("#entity-filter").selectOption("hotel");
    await expect(page.locator("#attractions-tbody")).toContainText("Mosaic Gate Hotel");
  });

  test("creates a restaurant from the admin item form", async ({ page }) => {
    await page.goto("/admin.html");
    await page.getByRole("link", { name: "Add New Item" }).click();

    await page.locator("#form-entity-type").selectOption("restaurant");
    await page.locator("#field-nameEn").fill("Salt Oven Kitchen");
    await page.locator("#field-city").fill("Al Salt");
    await page.locator("#field-cuisine").fill("Levantine");
    await page.locator("#field-phone").fill("+962799999999");
    await page.locator("#submit-btn").click();

    await expect(page.locator("#form-message")).toContainText("Restaurant created successfully");

    await page.getByRole("link", { name: "Catalog Manager" }).click();
    await page.locator("#entity-filter").selectOption("restaurant");
    await expect(page.locator("#attractions-tbody")).toContainText("Salt Oven Kitchen");
  });

  test("creates a company from the admin item form", async ({ page }) => {
    await page.goto("/admin.html");
    await page.getByRole("link", { name: "Add New Item" }).click();

    await page.locator("#form-entity-type").selectOption("company");
    await page.locator("#field-name").fill("Desert Compass Travel");
    await page.locator("#field-city").fill("Aqaba");
    await page.locator("#field-website").fill("https://desertcompass.example");
    await page.locator("#submit-btn").click();

    await expect(page.locator("#form-message")).toContainText("Company created successfully");

    await page.getByRole("link", { name: "Catalog Manager" }).click();
    await page.locator("#entity-filter").selectOption("company");
    await expect(page.locator("#attractions-tbody")).toContainText("Desert Compass Travel");
  });

  test("loads and filters moderated stories", async ({ page }) => {
    await page.goto("/admin.html");
    await page.getByRole("link", { name: "Stories Moderation" }).click();

    await expect(page.locator("#stories-tbody tr")).toHaveCount(2);
    await page.locator("#story-status-filter").selectOption("inactive");
    await expect(page.locator("#stories-tbody tr")).toHaveCount(1);
    await expect(page.locator("#stories-tbody")).toContainText("Dead Sea Weekend");
  });
});
