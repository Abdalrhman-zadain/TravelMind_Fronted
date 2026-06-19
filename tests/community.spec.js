const { test, expect } = require("@playwright/test");

const mockTravelers = [
  {
    id: 2,
    name: "Alex Johnson",
    role: "TRAVELER",
    preferredLanguage: "en",
    profileImage: "",
    createdAt: "2026-01-10T12:00:00Z",
    _count: {
      travelerStories: 2,
      trips: 3,
      journals: 1
    }
  },
  {
    id: 3,
    name: "Fatima Al-Saeed",
    role: "TRAVELER",
    preferredLanguage: "ar",
    profileImage: "",
    createdAt: "2026-02-15T12:00:00Z",
    _count: {
      travelerStories: 0,
      trips: 1,
      journals: 0
    }
  }
];

const mockAlexProfile = {
  id: 2,
  name: "Alex Johnson",
  role: "TRAVELER",
  preferredLanguage: "en",
  profileImage: "",
  createdAt: "2026-01-10T12:00:00Z",
  travelerStories: [
    {
      id: 301,
      title: "Sunrise in Wadi Rum",
      destination: "Wadi Rum",
      thumbnailUrl: "",
      videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
      viewsCount: 15,
      createdAt: "2026-03-01T08:00:00Z"
    }
  ],
  _count: {
    trips: 3,
    journals: 1
  }
};

async function loginAsTraveler(page) {
  await page.addInitScript(() => {
    localStorage.setItem("tm_token", "fake-traveler-token");
    localStorage.setItem(
      "tm_user",
      JSON.stringify({ id: 9, name: "Sami Explorer", role: "TRAVELER" })
    );
  });
}

async function mockCommunityApis(page) {
  // Mock users list search
  await page.route("**/api/community/users**", async (route) => {
    const url = new URL(route.request().url());
    const q = url.searchParams.get("q") || "";
    
    // Check if it's user profile endpoint or list search
    const pathParts = url.pathname.split("/");
    const lastPart = pathParts[pathParts.length - 1];
    
    if (lastPart !== "users" && !isNaN(Number(lastPart))) {
      // It's the user detail endpoint
      const userId = Number(lastPart);
      if (userId === 2) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(mockAlexProfile)
        });
      } else {
        await route.fulfill({
          status: 404,
          contentType: "application/json",
          body: JSON.stringify({ message: "User not found" })
        });
      }
      return;
    }

    // Filter by query name
    let list = [...mockTravelers];
    if (q) {
      list = list.filter(u => u.name.toLowerCase().includes(q.toLowerCase()));
    }
    
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(list)
    });
  });
}

test("shows auth required screen for unauthenticated users", async ({ page }) => {
  await page.goto("/community.html");
  const noticeCard = page.locator("#auth-required-container");
  await expect(noticeCard).toBeVisible();
  await expect(noticeCard.locator("h2")).toContainText("Unlock the TravelMind Community");
});

test.describe("authenticated traveler", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTraveler(page);
    await mockCommunityApis(page);
  });

  test("loads community travelers and performs search", async ({ page }) => {
    await page.goto("/community.html");
    
    // Check main container is visible
    await expect(page.locator("#community-main-container")).toBeVisible();
    
    // Expect 2 travelers loaded initially
    await expect(page.locator(".traveler-card")).toHaveCount(2);
    await expect(page.locator(".traveler-card").nth(0).locator("h3")).toContainText("Alex Johnson");
    await expect(page.locator(".traveler-card").nth(1).locator("h3")).toContainText("Fatima Al-Saeed");

    // Perform search
    const searchInput = page.locator("#traveler-search-input");
    await searchInput.fill("Fatima");
    
    // Wait for debounce and search result update
    await page.waitForTimeout(500);
    await expect(page.locator(".traveler-card")).toHaveCount(1);
    await expect(page.locator(".traveler-card").locator("h3")).toContainText("Fatima Al-Saeed");
  });

  test("filters travelers by language", async ({ page }) => {
    await page.goto("/community.html");
    
    // Apply Arabic filter
    const langSelect = page.locator("#traveler-lang-filter");
    await langSelect.selectOption("ar");
    
    await expect(page.locator(".traveler-card")).toHaveCount(1);
    await expect(page.locator(".traveler-card").locator("h3")).toContainText("Fatima Al-Saeed");
  });

  test("opens traveler profile details and plays story", async ({ page }) => {
    await page.goto("/community.html");
    
    // Click View Profile on Alex Johnson
    const viewProfileBtn = page.locator(".traveler-card").nth(0).locator(".btn-view-profile");
    await viewProfileBtn.click();
    
    // Expect modal to be visible
    const profileModal = page.locator("#profile-modal");
    await expect(profileModal).toBeVisible();
    await expect(profileModal.locator("h2")).toContainText("Alex Johnson");
    
    // Check stats are rendered correctly
    await expect(page.locator("#profile-stat-stories")).toContainText("1");
    await expect(page.locator("#profile-stat-trips")).toContainText("3");
    await expect(page.locator("#profile-stat-journals")).toContainText("1");
    
    // Check story is visible
    const storyCard = page.locator(".story-card-mini");
    await expect(storyCard).toBeVisible();
    await expect(storyCard.locator("h4")).toContainText("Sunrise in Wadi Rum");
    
    // Click story to play video
    await storyCard.click();
    
    // Check video player overlay is open
    const videoModal = page.locator("#modal-story-video-viewer");
    await expect(videoModal).toBeVisible();
    await expect(videoModal.locator("video")).toBeVisible();
    
    // Close video player
    await page.locator("#close-video-viewer-btn").click();
    await expect(videoModal).toBeHidden();
  });
});
