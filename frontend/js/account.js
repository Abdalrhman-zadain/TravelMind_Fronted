const ACCOUNT_PREFS_KEY = "tm_account_preferences_v1";

const accountState = {
  user: null,
  trips: [],
  bookings: [],
  reviews: [],
  stories: [],
  notifications: [],
  orders: [],
  activeTab: "overview",
};

const ACCOUNT_TRAVEL_STYLES = ["Balanced", "Luxury", "Budget", "Adventure", "Relaxed"];
const ACCOUNT_PACES = ["Slow", "Steady", "Fast"];
const ACCOUNT_TABS = [
  { id: "overview", label: "Overview" },
  { id: "trips", label: "Trips" },
  { id: "preferences", label: "Preferences" },
  { id: "stories", label: "Stories" },
  { id: "finance", label: "Finance" },
  { id: "security", label: "Security" },
];

function accountById(id) {
  return document.getElementById(id);
}

function accountEsc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function accountReadJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (_error) {
    return fallback;
  }
}

function accountWriteJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function getAccountPreferences() {
  const user = getUser();
  const all = accountReadJson(ACCOUNT_PREFS_KEY, {});
  return all[String(user?.id || "guest")] || {};
}

function saveAccountPreferences(preferences) {
  const user = getUser();
  const all = accountReadJson(ACCOUNT_PREFS_KEY, {});
  all[String(user?.id || "guest")] = {
    ...all[String(user?.id || "guest")],
    ...preferences,
    updatedAt: new Date().toISOString(),
  };
  accountWriteJson(ACCOUNT_PREFS_KEY, all);
}

async function loadAccountTrips(userId) {
  if (window.TripsAPI?.getByUser) {
    try {
      const data = await TripsAPI.getByUser(userId);
      return Array.isArray(data) ? data : [];
    } catch (_error) {
      // fall back to local cache
    }
  }
  return accountReadJson("tm_trips_local_v1", []).filter((trip) => String(trip.userId) === String(userId));
}

async function loadAccountReviews(userId) {
  if (window.ReviewsAPI?.getByUser) {
    try {
      const data = await ReviewsAPI.getByUser(userId);
      if (Array.isArray(data)) return data;
    } catch (_error) {
      // fall back to local cache
    }
  }
  return accountReadJson("tm_reviews_v1", []).filter((review) => String(review.userId) === String(userId));
}

async function loadAccountStories(userId) {
  if (window.TravelerStoriesAPI?.getMine) {
    try {
      const data = await TravelerStoriesAPI.getMine(userId);
      if (Array.isArray(data)) return data;
    } catch (_error) {
      return [];
    }
  }
  return [];
}

async function loadAccountNotifications(userId) {
  if (window.DashboardNotificationsAPI?.getAll) {
    try {
      const data = await DashboardNotificationsAPI.getAll({ userId, role: "traveler" });
      return Array.isArray(data) ? data : [];
    } catch (_error) {
      return [];
    }
  }
  return [];
}

async function loadAccountOrders(userId) {
  if (window.CheckoutOrdersAPI?.getAll) {
    try {
      const data = await CheckoutOrdersAPI.getAll({ userId });
      return Array.isArray(data) ? data : [];
    } catch (_error) {
      return [];
    }
  }
  return [];
}

function bookingStatusClass(status) {
  return String(status || "").toLowerCase() === "confirmed" ? "account-badge account-badge-success" : "account-badge";
}

function formatAccountDate(value) {
  if (!value) return "Not set";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Not set" : date.toLocaleDateString();
}

function formatAccountDateTime(value) {
  if (!value) return "Not set";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Not set" : date.toLocaleString();
}

function accountCurrency(value) {
  return `${Number(value || 0).toFixed(2)} JOD`;
}

function renderPreferenceChoiceGroup(name, options, selectedValue) {
  return `
    <div class="account-choice-grid" role="radiogroup" aria-label="${accountEsc(name)}">
      ${options
        .map(
          (option) => `
            <label class="account-choice-pill">
              <input type="radio" name="${accountEsc(name)}" value="${accountEsc(option)}" ${option === selectedValue ? "checked" : ""} />
              <span>${accountEsc(option)}</span>
            </label>
          `
        )
        .join("")}
    </div>
  `;
}

function getAccountSelectedChoice(name, fallback = "") {
  const selected = document.querySelector(`input[name="${name}"]:checked`);
  return selected?.value || fallback;
}

function preferenceSnapshotItems() {
  return [
    {
      label: "Travel style",
      value: getAccountSelectedChoice("pref-travel-style", "Balanced"),
    },
    {
      label: "Trip pace",
      value: getAccountSelectedChoice("pref-pace", "Steady"),
    },
    {
      label: "Preferred places",
      value: accountById("pref-places")?.value.trim() || "No place preferences yet",
    },
    {
      label: "Food",
      value: accountById("pref-food")?.value.trim() || "No food notes yet",
    },
    {
      label: "Stay",
      value: accountById("pref-stay")?.value.trim() || "No stay preference yet",
    },
  ];
}

function renderPreferenceSnapshot() {
  const snapshot = accountById("account-preference-snapshot");
  if (!snapshot) return;
  snapshot.innerHTML = preferenceSnapshotItems()
    .map(
      (item) => `
        <article class="account-preference-summary-item">
          <span>${accountEsc(item.label)}</span>
          <strong>${accountEsc(item.value)}</strong>
        </article>
      `
    )
    .join("");
}

function updatePreferenceNoteMeter() {
  const notes = accountById("pref-notes");
  const meter = accountById("account-notes-meter");
  if (!notes || !meter) return;
  const count = notes.value.trim().length;
  meter.textContent = count
    ? `${count} character${count === 1 ? "" : "s"} added`
    : "Add details that help us plan smarter";
}

function bindAccountPreferenceComposer() {
  const panel = accountById("account-preferences-panel");
  if (!panel) return;
  panel
    .querySelectorAll('input[name="pref-travel-style"], input[name="pref-pace"], #pref-places, #pref-food, #pref-stay, #pref-notes')
    .forEach((field) => {
      const eventName = field.tagName === "INPUT" && field.type === "radio" ? "change" : "input";
      field.addEventListener(eventName, () => {
        renderPreferenceSnapshot();
        updatePreferenceNoteMeter();
      });
    });
  renderPreferenceSnapshot();
  updatePreferenceNoteMeter();
}

function tripStatus(trip) {
  if (!trip?.endDate && !trip?.startDate) return "Planning";
  const endDate = trip?.endDate ? new Date(trip.endDate) : null;
  const startDate = trip?.startDate ? new Date(trip.startDate) : null;
  const now = new Date();

  if (endDate && !Number.isNaN(endDate.getTime())) {
    const remaining = Math.ceil((endDate - now) / 86400000);
    if (remaining < 0) return "Completed";
    if (remaining === 0) return "Ends today";
    return `${remaining} day${remaining === 1 ? "" : "s"} left`;
  }

  if (startDate && !Number.isNaN(startDate.getTime())) {
    if (startDate > now) return "Upcoming";
    return "In progress";
  }

  return "Planning";
}

function sortByNewest(list, keyA, keyB) {
  return [...list].sort((a, b) => new Date(b[keyA] || b[keyB] || 0) - new Date(a[keyA] || a[keyB] || 0));
}

function sortTripsForDisplay(list) {
  return [...list].sort((a, b) => new Date(a.startDate || a.createdDate || a.createdAt || 0) - new Date(b.startDate || b.createdDate || b.createdAt || 0));
}

function inferCountryLabel(value) {
  const text = String(value || "").trim();
  if (!text) return "";
  if (/jordan/i.test(text)) return "Jordan";
  if (text.includes(",")) return text.split(",").pop().trim();
  return "";
}

function uniqueCountriesVisited() {
  const countries = new Set();

  accountState.trips.forEach((trip) => {
    [trip.country, trip.destinationCountry, trip.destination].forEach((value) => {
      const label = inferCountryLabel(value);
      if (label) countries.add(label);
    });
  });

  accountState.bookings.forEach((booking) => {
    [booking.country, booking.city].forEach((value) => {
      const label = inferCountryLabel(value);
      if (label) countries.add(label);
    });
  });

  accountState.stories.forEach((story) => {
    [story.country, story.destination].forEach((value) => {
      const label = inferCountryLabel(value);
      if (label) countries.add(label);
    });
  });

  if (!countries.size && (accountState.trips.length || accountState.bookings.length || accountState.stories.length)) {
    countries.add("Jordan");
  }

  return countries.size;
}

function nextTripSummary() {
  const now = new Date();
  const upcoming = sortTripsForDisplay(
    accountState.trips.filter((trip) => {
      const startDate = new Date(trip.startDate || trip.createdDate || trip.createdAt || 0);
      return !Number.isNaN(startDate.getTime()) && startDate >= now;
    })
  )[0];

  if (!upcoming) {
    return {
      title: "No upcoming trip",
      detail: "Plan your next stay, route, or reservation from the Trips tab.",
    };
  }

  return {
    title: upcoming.name || "Upcoming trip",
    detail: `${upcoming.destination || "Jordan"} • ${formatAccountDate(upcoming.startDate)}`,
  };
}

function profileCompletion(preferences, bookingProfile) {
  const checks = [
    accountState.user?.name,
    accountState.user?.email,
    bookingProfile?.phone,
    preferences?.nationality,
    preferences?.travelStyle,
    preferences?.preferredPlaces,
    preferences?.foodPreference,
    preferences?.stayPreference,
  ];
  const filled = checks.filter((value) => String(value || "").trim()).length;
  return Math.round((filled / checks.length) * 100);
}

function computeAccountStats() {
  const completedTrips = accountState.trips.filter((trip) => tripStatus(trip) === "Completed").length;
  const upcomingTrips = accountState.trips.filter((trip) => {
    const status = tripStatus(trip);
    return status.includes("day") || status === "Ends today" || status === "Upcoming" || status === "In progress";
  }).length;
  const totalSpent = accountState.bookings.reduce((sum, booking) => sum + Number(booking.total || 0), 0);
  const totalOrderSpend = accountState.orders.reduce((sum, order) => sum + Number(order.total || 0), 0);
  const walletBalance = Number(accountState.user?.walletBalance || accountState.user?.wallet || 0);
  const paidOrders = accountState.orders.filter((order) => String(order.orderStatus || "").toLowerCase() === "paid").length;
  const pendingOrders = accountState.orders.filter((order) => String(order.orderStatus || "").toLowerCase() === "pending").length;

  return {
    trips: accountState.trips.length,
    completedTrips,
    bookings: accountState.bookings.length,
    reviews: accountState.reviews.length,
    stories: accountState.stories.length,
    notifications: accountState.notifications.filter((item) => !item.isRead).length,
    upcomingTrips,
    totalSpent,
    totalOrderSpend,
    walletBalance,
    countriesVisited: uniqueCountriesVisited(),
    paidOrders,
    pendingOrders,
  };
}

function renderInsightMetric(label, value, tone = "") {
  return `
    <article class="account-insight-metric ${tone ? `account-insight-metric-${tone}` : ""}">
      <span>${accountEsc(label)}</span>
      <strong>${accountEsc(value)}</strong>
    </article>
  `;
}

function renderSectionCard(title, copy, bodyMarkup, actionsMarkup = "") {
  return `
    <section class="account-card">
      <div class="account-card-header">
        <div>
          <h3>${accountEsc(title)}</h3>
          <p>${accountEsc(copy)}</p>
        </div>
        ${actionsMarkup}
      </div>
      ${bodyMarkup}
    </section>
  `;
}

function renderEmptyState(text) {
  return `<div class="account-empty"><p>${accountEsc(text)}</p></div>`;
}

function renderTripList(limit = 4, emptyText = "No saved trips yet.") {
  const items = sortTripsForDisplay(accountState.trips)
    .slice(0, limit)
    .map(
      (trip) => `
        <article class="account-list-item">
          <div class="account-list-topline">
            <div>
              <div class="account-list-title">${accountEsc(trip.name || "Traveler Trip")}</div>
              <div class="account-list-meta">${accountEsc(trip.destination || "Jordan")} • ${formatAccountDate(trip.startDate)} to ${formatAccountDate(trip.endDate)}</div>
            </div>
            <span class="account-badge">${accountEsc(tripStatus(trip))}</span>
          </div>
          <div class="account-actions">
            <button class="btn btn-outline btn-sm" type="button" onclick="openAccountTrip('${accountEsc(trip.id)}')">Open Planner</button>
          </div>
        </article>
      `
    );

  return `<div class="account-list">${items.length ? items.join("") : renderEmptyState(emptyText)}</div>`;
}

function renderBookingList(limit = 4, emptyText = "No bookings saved yet.") {
  const items = sortByNewest(accountState.bookings, "createdAt")
    .slice(0, limit)
    .map((booking) => {
      const bookingType = booking.type === "hotel" ? "Hotel booking" : "Restaurant reservation";
      return `
        <article class="account-list-item">
          <div class="account-list-topline">
            <div>
              <div class="account-list-title">${accountEsc(booking.itemTitle || "Booking")}</div>
              <div class="account-list-meta">${accountEsc(bookingType)} • ${accountEsc(booking.city || "Jordan")}</div>
              <div class="account-list-meta">${booking.startDate ? formatAccountDate(booking.startDate) : "Date flexible"}${booking.total ? ` • ${accountCurrency(booking.total)}` : ""}</div>
            </div>
            <span class="${bookingStatusClass(booking.status)}">${accountEsc(booking.status || "Confirmed")}</span>
          </div>
        </article>
      `;
    });

  return `<div class="account-list">${items.length ? items.join("") : renderEmptyState(emptyText)}</div>`;
}

function renderReviewList(limit = 4, emptyText = "No reviews written yet.") {
  const items = sortByNewest(accountState.reviews, "createdAt")
    .slice(0, limit)
    .map(
      (review) => `
        <article class="account-list-item">
          <div class="account-list-topline">
            <div>
              <div class="account-list-title">${"★".repeat(Math.max(0, Math.round(Number(review.rating || 0))))}${"☆".repeat(Math.max(0, 5 - Math.round(Number(review.rating || 0))))}</div>
              <div class="account-list-meta">${accountEsc(review.placeType || "Place review")} • ${formatAccountDate(review.createdAt)}</div>
              <div class="account-list-meta">${accountEsc(review.comment || "No written review.")}</div>
            </div>
          </div>
        </article>
      `
    );

  return `<div class="account-list">${items.length ? items.join("") : renderEmptyState(emptyText)}</div>`;
}

function renderStoryList(limit = 4, emptyText = "You have not published any stories yet.") {
  const items = sortByNewest(accountState.stories, "updatedAt", "createdAt")
    .slice(0, limit)
    .map(
      (story) => `
        <article class="account-list-item">
          <div class="account-list-topline">
            <div>
              <div class="account-list-title">${accountEsc(story.title || "Traveler Story")}</div>
              <div class="account-list-meta">${accountEsc(story.destination || "Jordan")} • ${formatAccountDate(story.createdAt)}</div>
              <div class="account-list-meta">${accountEsc(story.sponsorCompanyName || "Community story")}</div>
            </div>
            <span class="account-badge">${story.isActive === false ? "Hidden" : "Published"}</span>
          </div>
          <div class="account-actions">
            <a class="btn btn-outline btn-sm" href="stories.html?story=${encodeURIComponent(story.id)}">View</a>
            <a class="btn btn-outline btn-sm" href="stories.html?edit=${encodeURIComponent(story.id)}">Edit</a>
            <button class="btn btn-ghost btn-sm" type="button" onclick="deleteAccountStory(${Number(story.id)})">Delete</button>
          </div>
        </article>
      `
    );

  return `<div class="account-list">${items.length ? items.join("") : renderEmptyState(emptyText)}</div>`;
}

function renderNotificationList(limit = 6, emptyText = "No notifications yet.") {
  const items = sortByNewest(accountState.notifications, "createdAt")
    .slice(0, limit)
    .map(
      (notification) => `
        <article class="account-list-item ${notification.isRead ? "account-list-item-read" : "account-list-item-unread"}">
          <div class="account-list-topline">
            <div>
              <div class="account-list-title">${accountEsc(notification.title || "Notification")}</div>
              <div class="account-list-meta">${formatAccountDateTime(notification.createdAt)}</div>
              <div class="account-list-meta">${accountEsc(notification.message || "")}</div>
            </div>
            <span class="${notification.isRead ? "account-badge" : "account-badge account-badge-success"}">${notification.isRead ? "Read" : "New"}</span>
          </div>
          ${notification.isRead ? "" : `<div class="account-actions"><button class="btn btn-outline btn-sm" type="button" onclick="markAccountNotificationRead(${Number(notification.id)})">Mark Read</button></div>`}
        </article>
      `
    );

  return `<div class="account-list">${items.length ? items.join("") : renderEmptyState(emptyText)}</div>`;
}

function renderOrderList(limit = 6, emptyText = "No finance records yet.") {
  const items = sortByNewest(accountState.orders, "createdAt")
    .slice(0, limit)
    .map(
      (order) => `
        <article class="account-list-item">
          <div class="account-list-topline">
            <div>
              <div class="account-list-title">${accountEsc(order.serviceName || "Checkout order")}</div>
              <div class="account-list-meta">${accountEsc(order.orderType || "Order")} • ${accountEsc(order.destination || "Jordan")}</div>
              <div class="account-list-meta">${formatAccountDate(order.createdAt)} • ${accountCurrency(order.total || 0)}</div>
            </div>
            <span class="account-badge">${accountEsc(order.orderStatus || "Pending")}</span>
          </div>
        </article>
      `
    );

  return `<div class="account-list">${items.length ? items.join("") : renderEmptyState(emptyText)}</div>`;
}

function renderQuickActions() {
  const actions = [
    {
      title: "My Trips",
      copy: "Jump into upcoming plans and saved itineraries.",
      button: `<button class="btn btn-outline btn-sm" type="button" onclick="switchAccountTab('trips')">Open Trips</button>`,
    },
    {
      title: "Bookings",
      copy: "See recent reservations and payment activity.",
      button: `<button class="btn btn-outline btn-sm" type="button" onclick="switchAccountTab('finance')">Open Bookings</button>`,
    },
    {
      title: "Stories",
      copy: "Manage published stories and continue editing.",
      button: `<button class="btn btn-outline btn-sm" type="button" onclick="switchAccountTab('stories')">Open Stories</button>`,
    },
    {
      title: "Edit Profile",
      copy: "Update your account, contact details, and nationality.",
      button: `<button class="btn btn-primary btn-sm" type="button" onclick="switchAccountTab('security', 'account-name')">Edit Profile</button>`,
    },
  ];

  return `
    <section class="account-action-grid">
      ${actions
        .map(
          (action) => `
            <article class="account-action-card">
              <div>
                <h3>${accountEsc(action.title)}</h3>
                <p>${accountEsc(action.copy)}</p>
              </div>
              ${action.button}
            </article>
          `
        )
        .join("")}
    </section>
  `;
}

function renderTabNav() {
  return `
    <div class="account-tabs-shell">
      <div class="account-tabs" role="tablist" aria-label="Account sections">
        ${ACCOUNT_TABS.map(
          (tab) => `
            <button
              class="account-tab ${accountState.activeTab === tab.id ? "is-active" : ""}"
              type="button"
              role="tab"
              aria-selected="${accountState.activeTab === tab.id ? "true" : "false"}"
              onclick="switchAccountTab('${tab.id}')"
            >
              ${accountEsc(tab.label)}
            </button>
          `
        ).join("")}
      </div>
    </div>
  `;
}

function renderOverviewTab(preferences, bookingProfile, stats) {
  const nextTrip = nextTripSummary();
  const completion = profileCompletion(preferences, bookingProfile);

  return `
    <section class="account-dashboard-grid">
      <div class="account-main-column">
        ${renderSectionCard(
          "Upcoming Trips",
          "Your next trips stay at the top so planning starts without digging.",
          renderTripList(3),
          `<a class="btn btn-outline btn-sm" href="trip-planner.html">Trip Planner</a>`
        )}
        ${renderSectionCard(
          "Recent Bookings",
          "Keep your latest confirmations visible without opening a separate page.",
          renderBookingList(3)
        )}
        ${renderSectionCard(
          "Published Stories",
          "Recent stories are surfaced as reusable content, not buried at the bottom.",
          renderStoryList(3),
          `<a class="btn btn-outline btn-sm" href="stories.html">Open Stories</a>`
        )}
      </div>
      <aside class="account-side-column">
        ${renderSectionCard(
          "Traveler Snapshot",
          "The essentials most people check first: where they are going, how complete their profile is, and how active they are.",
          `
            <div class="account-insight-grid">
              ${renderInsightMetric("Next trip", nextTrip.title, "warm")}
              ${renderInsightMetric("Profile complete", `${completion}%`, "cool")}
              ${renderInsightMetric("Travel style", preferences.travelStyle || "Balanced")}
              ${renderInsightMetric("Saved reviews", String(stats.reviews))}
            </div>
            <div class="account-note-card">
              <strong>${accountEsc(nextTrip.title)}</strong>
              <p>${accountEsc(nextTrip.detail)}</p>
            </div>
          `
        )}
        ${renderSectionCard(
          "Finance Snapshot",
          "Money-related signals stay in a tight summary card so totals are visible near the top.",
          `
            <div class="account-insight-grid">
              ${renderInsightMetric("Wallet balance", accountCurrency(stats.walletBalance), "warm")}
              ${renderInsightMetric("Booked spend", accountCurrency(stats.totalSpent + stats.totalOrderSpend), "cool")}
              ${renderInsightMetric("Paid orders", String(stats.paidOrders))}
              ${renderInsightMetric("Pending payments", String(stats.pendingOrders))}
            </div>
          `,
          `<button class="btn btn-outline btn-sm" type="button" onclick="switchAccountTab('finance')">Open Finance</button>`
        )}
        ${renderSectionCard(
          "Alerts & Notifications",
          "Unread alerts remain visible in the side column because they are time-sensitive.",
          renderNotificationList(4)
        )}
      </aside>
    </section>
  `;
}

function renderTripsTab() {
  return `
    <section class="account-detail-grid">
      ${renderSectionCard(
        "All Trips",
        "Trip planning is grouped in one place, with the newest and next departures easiest to scan.",
        renderTripList(8),
        `<a class="btn btn-primary btn-sm" href="trip-planner.html">Create Or Edit Trips</a>`
      )}
      ${renderSectionCard(
        "Bookings",
        "Reservations stay adjacent to trips so itinerary changes and confirmations are reviewed together.",
        renderBookingList(8)
      )}
      ${renderSectionCard(
        "Reviews",
        "Your feedback remains accessible without competing with higher-priority dashboard content.",
        renderReviewList(8)
      )}
    </section>
  `;
}

function renderPreferencesTab(preferences) {
  return `
    <section class="account-preferences-layout">
      <article class="account-card account-card-preferences">
        <div class="account-card-header">
          <div>
            <h3>Travel Preferences</h3>
            <p>These settings now live in their own tab so the main dashboard stays concise while planning preferences remain editable.</p>
          </div>
        </div>
        <div class="account-preferences-panel" id="account-preferences-panel">
          <div class="account-preferences-main">
            <div class="account-preferences-grid">
              <section class="account-preference-block">
                <div class="account-preference-heading">
                  <span class="account-preference-kicker">Trip vibe</span>
                  <h3>Travel Style</h3>
                  <p>Choose the kind of experience TravelMind should prioritize when suggesting stays and activities.</p>
                </div>
                ${renderPreferenceChoiceGroup("pref-travel-style", ACCOUNT_TRAVEL_STYLES, preferences.travelStyle || "Balanced")}
              </section>
              <section class="account-preference-block">
                <div class="account-preference-heading">
                  <span class="account-preference-kicker">Trip rhythm</span>
                  <h3>Trip Pace</h3>
                  <p>Keep your previous pacing preference, but separate it from the overview so it does not add visual noise.</p>
                </div>
                ${renderPreferenceChoiceGroup("pref-pace", ACCOUNT_PACES, preferences.pace || "Steady")}
              </section>
              <label class="account-field account-preference-block">
                <div class="account-preference-heading">
                  <span class="account-preference-kicker">Destinations</span>
                  <h3>Preferred Places</h3>
                  <p>Capture the destinations, neighborhoods, or trip types you want to see more often.</p>
                </div>
                <input id="pref-places" type="text" value="${accountEsc(preferences.preferredPlaces || "")}" placeholder="Petra, Wadi Rum, seaside stays, historic districts..." />
              </label>
              <label class="account-field account-preference-block">
                <div class="account-preference-heading">
                  <span class="account-preference-kicker">Dining</span>
                  <h3>Food Preferences</h3>
                  <p>Dietary needs, favorite cuisines, and anything you want the planner to keep in mind.</p>
                </div>
                <input id="pref-food" type="text" value="${accountEsc(preferences.foodPreference || "")}" placeholder="Vegetarian, local cuisine, seafood, no spicy food..." />
              </label>
              <label class="account-field account-preference-block">
                <div class="account-preference-heading">
                  <span class="account-preference-kicker">Stays</span>
                  <h3>Accommodation Preferences</h3>
                  <p>Tell us whether to lean toward boutique, comfort-first, luxury, value, or family-friendly stays.</p>
                </div>
                <input id="pref-stay" type="text" value="${accountEsc(preferences.stayPreference || "")}" placeholder="Boutique hotel, desert camp, luxury resort, budget stay..." />
              </label>
              <label class="account-field account-field-wide account-preference-block">
                <div class="account-preference-heading">
                  <span class="account-preference-kicker">Planner notes</span>
                  <h3>Travel Notes</h3>
                  <p>Use this for accessibility notes, must-sees, timing constraints, or anything a human planner would ask next.</p>
                </div>
                <textarea id="pref-notes" placeholder="Accessibility needs, family travel notes, must-see priorities, arrival timing, preferred neighborhoods...">${accountEsc(preferences.notes || "")}</textarea>
                <div class="account-notes-meter" id="account-notes-meter"></div>
              </label>
            </div>
          </div>
          <aside class="account-preferences-side">
            <div class="account-preference-summary-card">
              <span class="account-preference-kicker">Live summary</span>
              <h3>Planner Snapshot</h3>
              <p>This condensed summary mirrors the information TravelMind can reuse for itineraries and recommendations.</p>
              <div class="account-preference-summary-list" id="account-preference-snapshot"></div>
              <div class="account-preference-meta">
                <span>Last updated</span>
                <strong>${accountEsc(formatAccountDate(preferences.updatedAt))}</strong>
              </div>
            </div>
          </aside>
        </div>
        <div class="account-actions">
          <button class="btn btn-primary" type="button" onclick="saveAccountPreferencesForm()">Save Preferences</button>
        </div>
      </article>
    </section>
  `;
}

function renderStoriesTab(stats) {
  return `
    <section class="account-detail-grid">
      ${renderSectionCard(
        "Published Stories",
        "Stories now have their own workspace so content management no longer competes with profile editing and bookings.",
        renderStoryList(12),
        `<a class="btn btn-primary btn-sm" href="stories.html">Create Or Manage Stories</a>`
      )}
      ${renderSectionCard(
        "Story Snapshot",
        "A quick publishing summary keeps story performance visible without turning the page into a long editorial feed.",
        `
          <div class="account-insight-grid">
            ${renderInsightMetric("Published", String(stats.stories), "warm")}
            ${renderInsightMetric("Trips completed", String(stats.completedTrips), "cool")}
            ${renderInsightMetric("Countries visited", String(stats.countriesVisited))}
            ${renderInsightMetric("Reviews written", String(stats.reviews))}
          </div>
        `
      )}
    </section>
  `;
}

function renderFinanceTab(stats) {
  return `
    <section class="account-detail-grid">
      ${renderSectionCard(
        "Finance Snapshot",
        "Money-related details are grouped together so spending, orders, and balance checks feel task-oriented.",
        `
          <div class="account-summary-strip">
            ${renderInsightMetric("Wallet balance", accountCurrency(stats.walletBalance), "warm")}
            ${renderInsightMetric("Booking spend", accountCurrency(stats.totalSpent), "cool")}
            ${renderInsightMetric("Order spend", accountCurrency(stats.totalOrderSpend))}
            ${renderInsightMetric("Pending orders", String(stats.pendingOrders))}
          </div>
        `
      )}
      ${renderSectionCard(
        "Recent Booking Activity",
        "Reservations remain available here as the operational view of travel spending.",
        renderBookingList(8)
      )}
      ${renderSectionCard(
        "Checkout Orders",
        "Paid and pending orders are separated into a finance-friendly list rather than mixed into the profile overview.",
        renderOrderList(8)
      )}
    </section>
  `;
}

function renderSecurityTab(preferences, bookingProfile) {
  const completion = profileCompletion(preferences, bookingProfile);
  return `
    <section class="account-detail-grid account-security-grid">
      <article class="account-card account-card-editor">
        <div class="account-card-header">
          <div>
            <h3>Profile Details</h3>
            <p>The edit form moves into its own tab so the dashboard can prioritize quick reading over long form fields.</p>
          </div>
        </div>
        <div class="account-form-grid">
          <label class="account-field">
            <span>Full Name</span>
            <input id="account-name" type="text" value="${accountEsc(accountState.user?.name || "")}" />
          </label>
          <label class="account-field">
            <span>Email</span>
            <input id="account-email" type="email" value="${accountEsc(accountState.user?.email || "")}" />
          </label>
          <label class="account-field">
            <span>Phone</span>
            <input id="account-phone" type="tel" value="${accountEsc(bookingProfile.phone || "")}" />
          </label>
          <label class="account-field">
            <span>Nationality</span>
            <input id="account-nationality" type="text" value="${accountEsc(preferences.nationality || "")}" placeholder="Jordanian, American, ..." />
          </label>
        </div>
        <div class="account-actions">
          <button class="btn btn-primary" type="button" onclick="saveAccountProfile()">Save Profile</button>
        </div>
      </article>
      <article class="account-card">
        <div class="account-card-header">
          <div>
            <h3>Security & Access</h3>
            <p>Security information is kept compact and secondary, where users expect to manage account access rather than trip content.</p>
          </div>
        </div>
        <div class="account-insight-grid">
          ${renderInsightMetric("Logged in", isLoggedIn() ? "Yes" : "No", "cool")}
          ${renderInsightMetric("Profile complete", `${completion}%`, "warm")}
          ${renderInsightMetric("Member since", formatAccountDate(accountState.user?.createdAt))}
          ${renderInsightMetric("Unread alerts", String(accountState.notifications.filter((item) => !item.isRead).length))}
        </div>
        <div class="account-note-card">
          <strong>Account access</strong>
          <p>Password changes are handled through the authentication flow. Keep your contact details current so bookings and alerts stay accurate.</p>
        </div>
        <div class="account-actions">
          <button class="btn btn-ghost btn-sm" type="button" onclick="logout()">Sign Out</button>
        </div>
      </article>
    </section>
  `;
}

function renderActiveTab(preferences, bookingProfile, stats) {
  switch (accountState.activeTab) {
    case "trips":
      return renderTripsTab();
    case "preferences":
      return renderPreferencesTab(preferences);
    case "stories":
      return renderStoriesTab(stats);
    case "finance":
      return renderFinanceTab(stats);
    case "security":
      return renderSecurityTab(preferences, bookingProfile);
    case "overview":
    default:
      return renderOverviewTab(preferences, bookingProfile, stats);
  }
}

async function markAccountNotificationRead(id) {
  try {
    await DashboardNotificationsAPI.markRead(id, true);
    accountState.notifications = accountState.notifications.map((item) =>
      Number(item.id) === Number(id) ? { ...item, isRead: true } : item
    );
    renderAccountDashboard();
    showToast("Notification marked as read.", "success");
  } catch (error) {
    showToast(error.message || "Could not update the notification.", "error");
  }
}

async function deleteAccountStory(storyId) {
  if (!window.confirm("Delete this story?")) return;
  try {
    await TravelerStoriesAPI.delete(storyId);
    accountState.stories = accountState.stories.filter((story) => String(story.id) !== String(storyId));
    renderAccountDashboard();
    showToast("Story deleted.", "success");
  } catch (error) {
    showToast(error.message || "Could not delete the story.", "error");
  }
}

function switchAccountTab(tabId, focusId = "") {
  if (!ACCOUNT_TABS.some((tab) => tab.id === tabId)) return;
  accountState.activeTab = tabId;
  renderAccountDashboard();
  if (focusId) {
    requestAnimationFrame(() => {
      accountById(focusId)?.focus();
      accountById(focusId)?.scrollIntoView({ block: "center", behavior: "smooth" });
    });
  }
}

function openAccountTrip(tripId) {
  if (typeof setSelectedTripId === "function") setSelectedTripId(tripId);
  location.href = "trip-planner.html";
}

function renderAccountDashboard() {
  const shell = accountById("account-shell");
  const user = accountState.user;
  const preferences = getAccountPreferences();
  const bookingProfile = typeof getBookingProfile === "function" ? getBookingProfile() : {};
  const stats = computeAccountStats();
  const travelerMeta = [
    bookingProfile.phone || "Phone not added",
    preferences.nationality || "Nationality not added",
    preferences.travelStyle || "Travel style not set",
  ];

  shell.innerHTML = `
    <section class="account-dashboard-header account-card">
      <div class="account-dashboard-identity">
        <div class="account-avatar">${accountEsc((user.name || "T").slice(0, 1).toUpperCase())}</div>
        <div class="account-profile-meta">
          <span class="account-profile-tag">Traveler profile</span>
          <h2>${accountEsc(user.name || "Traveler")}</h2>
          <div class="account-profile-email">${accountEsc(user.email || "No email")}</div>
          <div class="account-detail-meta">
            ${travelerMeta.map((item) => `<span>${accountEsc(item)}</span>`).join("")}
          </div>
        </div>
      </div>
      <div class="account-header-actions">
        <button class="btn btn-primary" type="button" onclick="switchAccountTab('security', 'account-name')">Edit Profile</button>
      </div>
      <div class="account-stat-row">
        <article class="account-stat-card account-stat-card-highlight">
          <span>Total Trips</span>
          <strong>${stats.trips}</strong>
        </article>
        <article class="account-stat-card">
          <span>Countries Visited</span>
          <strong>${stats.countriesVisited}</strong>
        </article>
        <article class="account-stat-card">
          <span>Stories Published</span>
          <strong>${stats.stories}</strong>
        </article>
        <article class="account-stat-card">
          <span>Wallet Balance</span>
          <strong>${accountCurrency(stats.walletBalance)}</strong>
        </article>
      </div>
    </section>

    ${renderQuickActions()}
    ${renderTabNav()}
    <section class="account-tab-panel">
      ${renderActiveTab(preferences, bookingProfile, stats)}
    </section>
  `;

  bindAccountPreferenceComposer();
}

function saveAccountProfile() {
  const current = getUser();
  const updatedUser = {
    ...current,
    name: accountById("account-name").value.trim(),
    email: accountById("account-email").value.trim(),
  };

  if (!updatedUser.name || !updatedUser.email) {
    showToast("Please add both name and email.", "error");
    return;
  }

  localStorage.setItem("tm_user", JSON.stringify(updatedUser));
  if (typeof saveBookingProfile === "function") {
    saveBookingProfile({
      phone: accountById("account-phone").value.trim(),
    });
  }
  saveAccountPreferences({
    nationality: accountById("account-nationality").value.trim(),
  });
  accountState.user = updatedUser;
  if (typeof updateNavbar === "function") updateNavbar();
  renderAccountDashboard();
  showToast("Profile updated.", "success");
}

function saveAccountPreferencesForm() {
  saveAccountPreferences({
    travelStyle: getAccountSelectedChoice("pref-travel-style", "Balanced"),
    pace: getAccountSelectedChoice("pref-pace", "Steady"),
    preferredPlaces: accountById("pref-places").value.trim(),
    foodPreference: accountById("pref-food").value.trim(),
    stayPreference: accountById("pref-stay").value.trim(),
    notes: accountById("pref-notes").value.trim(),
  });
  renderAccountDashboard();
  showToast("Preferences saved.", "success");
}

async function initAccountPage() {
  const shell = accountById("account-shell");
  const user = getUser();

  if (!isLoggedIn() || !user) {
    shell.innerHTML = `
      <div class="account-login-required">
        <div class="account-card account-login-card">
          <div class="account-card-header">
            <div>
              <h2>Login Required</h2>
              <p>Sign in to view your profile, trips, bookings, and stories.</p>
            </div>
          </div>
          <div class="account-actions">
            <button class="btn btn-primary" type="button" onclick="location.href='auth.html'">Login</button>
          </div>
        </div>
      </div>
    `;
    return;
  }

  accountState.user = user;
  accountState.trips = await loadAccountTrips(user.id);
  accountState.bookings = typeof getBookingsByUser === "function" ? getBookingsByUser(user.id) : [];
  accountState.reviews = await loadAccountReviews(user.id);
  accountState.notifications = await loadAccountNotifications(user.id);
  accountState.stories = await loadAccountStories(user.id);
  accountState.orders = await loadAccountOrders(user.id);
  renderAccountDashboard();
}

window.saveAccountProfile = saveAccountProfile;
window.saveAccountPreferencesForm = saveAccountPreferencesForm;
window.deleteAccountStory = deleteAccountStory;
window.markAccountNotificationRead = markAccountNotificationRead;
window.switchAccountTab = switchAccountTab;
window.openAccountTrip = openAccountTrip;

document.addEventListener("DOMContentLoaded", initAccountPage);
