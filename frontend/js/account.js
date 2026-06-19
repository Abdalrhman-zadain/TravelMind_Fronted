const ACCOUNT_PREFS_KEY = "tm_account_preferences_v1";

const accountState = {
  user: null,
  trips: [],
  bookings: [],
  reviews: [],
  stories: [],
  notifications: [],
};

const ACCOUNT_TRAVEL_STYLES = ["Balanced", "Luxury", "Budget", "Adventure", "Relaxed"];
const ACCOUNT_PACES = ["Slow", "Steady", "Fast"];

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

function bookingStatusClass(status) {
  return String(status || "").toLowerCase() === "confirmed" ? "account-badge account-badge-success" : "account-badge";
}

function formatAccountDate(value) {
  if (!value) return "Not set";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Not set" : date.toLocaleDateString();
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
      label: "Trip style",
      value: getAccountSelectedChoice("pref-travel-style", "Balanced"),
    },
    {
      label: "Pace",
      value: getAccountSelectedChoice("pref-pace", "Steady"),
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
  panel.querySelectorAll('input[name="pref-travel-style"], input[name="pref-pace"], #pref-food, #pref-stay, #pref-notes').forEach((field) => {
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
  if (!trip.endDate) return "Planning";
  const remaining = Math.ceil((new Date(trip.endDate) - new Date()) / 86400000);
  if (remaining < 0) return "Completed";
  if (remaining === 0) return "Ends today";
  return `${remaining} day${remaining === 1 ? "" : "s"} left`;
}

function computeAccountStats() {
  const completedTrips = accountState.trips.filter((trip) => tripStatus(trip) === "Completed").length;
  const upcomingTrips = accountState.trips.filter((trip) => tripStatus(trip).includes("day") || tripStatus(trip) === "Ends today").length;
  const totalSpent = accountState.bookings.reduce((sum, booking) => sum + Number(booking.total || 0), 0);
  return {
    trips: accountState.trips.length,
    completedTrips,
    bookings: accountState.bookings.length,
    reviews: accountState.reviews.length,
    stories: accountState.stories.length,
    notifications: accountState.notifications.filter((item) => !item.isRead).length,
    upcomingTrips,
    totalSpent,
  };
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

function renderListSection(title, copy, items, emptyText) {
  return `
    <section class="account-card account-card-activity">
      <div class="account-card-header">
        <div>
          <h3>${title}</h3>
          <p>${copy}</p>
        </div>
      </div>
      <div class="account-list">
        ${items.length ? items.join("") : `<div class="account-empty"><p>${emptyText}</p></div>`}
      </div>
    </section>
  `;
}

function renderAccountDashboard() {
  const shell = accountById("account-shell");
  const user = accountState.user;
  const preferences = getAccountPreferences();
  const bookingProfile = typeof getBookingProfile === "function" ? getBookingProfile() : {};
  const stats = computeAccountStats();

  const tripsMarkup = accountState.trips
    .sort((a, b) => new Date(b.createdDate || b.createdAt || 0) - new Date(a.createdDate || a.createdAt || 0))
    .slice(0, 4)
    .map((trip) => `
      <article class="account-list-item">
        <div class="account-list-topline">
          <div>
            <div class="account-list-title">${accountEsc(trip.name)}</div>
            <div class="account-list-meta">${accountEsc(trip.destination)} • ${formatAccountDate(trip.startDate)} to ${formatAccountDate(trip.endDate)}</div>
          </div>
          <span class="account-badge">${accountEsc(tripStatus(trip))}</span>
        </div>
      </article>
    `);

  const bookingsMarkup = accountState.bookings
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .slice(0, 4)
    .map((booking) => `
      <article class="account-list-item">
        <div class="account-list-topline">
          <div>
            <div class="account-list-title">${accountEsc(booking.itemTitle)}</div>
            <div class="account-list-meta">${accountEsc(booking.type === "hotel" ? "Hotel booking" : "Restaurant reservation")} • ${accountEsc(booking.city || "Jordan")}</div>
            <div class="account-list-meta">${booking.startDate ? formatAccountDate(booking.startDate) : "Date flexible"}${booking.total ? ` • ${accountCurrency(booking.total)}` : ""}</div>
          </div>
          <span class="${bookingStatusClass(booking.status)}">${accountEsc(booking.status || "Confirmed")}</span>
        </div>
      </article>
    `);

  const reviewsMarkup = accountState.reviews
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .slice(0, 4)
    .map((review) => `
      <article class="account-list-item">
        <div class="account-list-topline">
          <div>
            <div class="account-list-title">${"★".repeat(Math.max(0, Math.round(Number(review.rating || 0))))}${"☆".repeat(Math.max(0, 5 - Math.round(Number(review.rating || 0))))}</div>
            <div class="account-list-meta">${accountEsc(review.placeType || "Place review")} • ${formatAccountDate(review.createdAt)}</div>
            <div class="account-list-meta">${accountEsc(review.comment || "No written review.")}</div>
          </div>
        </div>
      </article>
    `);

  const storiesMarkup = accountState.stories
    .sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0))
    .slice(0, 4)
    .map((story) => `
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
    `);

  const notificationsMarkup = accountState.notifications
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .slice(0, 6)
    .map((notification) => `
      <article class="account-list-item ${notification.isRead ? "account-list-item-read" : "account-list-item-unread"}">
        <div class="account-list-topline">
          <div>
            <div class="account-list-title">${accountEsc(notification.title || "Notification")}</div>
            <div class="account-list-meta">${formatAccountDate(notification.createdAt)}</div>
            <div class="account-list-meta">${accountEsc(notification.message || "")}</div>
          </div>
          <span class="${notification.isRead ? "account-badge" : "account-badge account-badge-success"}">${notification.isRead ? "Read" : "New"}</span>
        </div>
        ${notification.isRead ? "" : `<div class="account-actions"><button class="btn btn-outline btn-sm" type="button" onclick="markAccountNotificationRead(${Number(notification.id)})">Mark Read</button></div>`}
      </article>
    `);

  shell.innerHTML = `
    <section class="account-zone">
      <div class="account-zone-header">
        <span class="account-zone-kicker">Overview</span>
        <h2>Account Snapshot</h2>
        <p>Your profile and current travel activity, separated into quick-scan cards.</p>
      </div>
      <div class="account-top-grid">
      <article class="account-card account-card-profile">
        <div class="account-profile-hero">
          <div class="account-avatar">${accountEsc((user.name || "T").slice(0, 1).toUpperCase())}</div>
          <div class="account-profile-meta">
            <h2>${accountEsc(user.name || "Traveler")}</h2>
            <div class="account-detail-meta">
              <span>${accountEsc(user.email || "No email")}</span>
              <span>${accountEsc(bookingProfile.phone || "Phone not added")}</span>
              <span>${accountEsc(preferences.travelStyle || "Travel style not set")}</span>
            </div>
          </div>
        </div>
      </article>
      <article class="account-card account-card-snapshot">
        <div class="account-card-header">
          <div>
            <h2>Traveler Snapshot</h2>
            <p>Quick overview of your recent activity and saved planning data.</p>
          </div>
        </div>
        <div class="account-copy">
          <p>You currently have <strong>${stats.upcomingTrips}</strong> upcoming trip${stats.upcomingTrips === 1 ? "" : "s"}, <strong>${stats.bookings}</strong> booking${stats.bookings === 1 ? "" : "s"}, and <strong>${stats.reviews}</strong> review${stats.reviews === 1 ? "" : "s"} stored in TravelMind.</p>
        </div>
      </article>
      </div>
    </section>

    <section class="account-zone">
      <div class="account-zone-header">
        <span class="account-zone-kicker">Stats</span>
        <h2>Travel Numbers</h2>
        <p>Each metric lives in its own card so the dashboard feels easier to scan.</p>
      </div>
      <div class="account-stats-grid">
      <article class="account-stat-card"><span>Total Trips</span><strong>${stats.trips}</strong></article>
      <article class="account-stat-card"><span>Completed Trips</span><strong>${stats.completedTrips}</strong></article>
      <article class="account-stat-card"><span>Saved Bookings</span><strong>${stats.bookings}</strong></article>
      <article class="account-stat-card"><span>Published Stories</span><strong>${stats.stories}</strong></article>
      <article class="account-stat-card"><span>Unread Alerts</span><strong>${stats.notifications}</strong></article>
      <article class="account-stat-card"><span>Booked Spend</span><strong>${accountCurrency(stats.totalSpent)}</strong></article>
      </div>
    </section>

    <section class="account-zone">
      <div class="account-zone-header">
        <span class="account-zone-kicker">Planning</span>
        <h2>Profile And Preferences</h2>
        <p>Personal details and trip-planning settings are now separate feature blocks instead of one blended area.</p>
      </div>
      <div class="account-content-grid">
      <article class="account-card account-card-editor">
        <div class="account-card-header">
          <div>
            <h2>Profile Details</h2>
            <p>Update your contact details and keep your saved traveler profile current.</p>
          </div>
        </div>
        <div class="account-form-grid">
          <label class="account-field">
            <span>Full Name</span>
            <input id="account-name" type="text" value="${accountEsc(user.name || "")}" />
          </label>
          <label class="account-field">
            <span>Email</span>
            <input id="account-email" type="email" value="${accountEsc(user.email || "")}" />
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

      <article class="account-card account-card-preferences">
        <div class="account-card-header">
          <div>
            <h2>Travel Preferences</h2>
            <p>Shape the kind of trip TravelMind plans for you, from pace and comfort level to food and special notes.</p>
          </div>
        </div>
        <div class="account-preferences-panel" id="account-preferences-panel">
          <div class="account-preferences-main">
            <div class="account-preferences-grid">
              <section class="account-preference-block">
                <div class="account-preference-heading">
                  <span class="account-preference-kicker">Trip vibe</span>
                  <h3>Travel Style</h3>
                  <p>Choose the experience you want us to prioritize when we recommend stays and activities.</p>
                </div>
                ${renderPreferenceChoiceGroup("pref-travel-style", ACCOUNT_TRAVEL_STYLES, preferences.travelStyle || "Balanced")}
              </section>
              <section class="account-preference-block">
                <div class="account-preference-heading">
                  <span class="account-preference-kicker">Trip rhythm</span>
                  <h3>Preferred Pace</h3>
                  <p>Set how packed or relaxed your days should feel across the itinerary.</p>
                </div>
                ${renderPreferenceChoiceGroup("pref-pace", ACCOUNT_PACES, preferences.pace || "Steady")}
              </section>
              <label class="account-field account-preference-block">
                <div class="account-preference-heading">
                  <span class="account-preference-kicker">Dining</span>
                  <h3>Food Preference</h3>
                  <p>Dietary needs, cuisine interests, or anything you definitely want more or less of.</p>
                </div>
                <input id="pref-food" type="text" value="${accountEsc(preferences.foodPreference || "")}" placeholder="Local cuisine, vegetarian, seafood, no spicy food..." />
              </label>
              <label class="account-field account-preference-block">
                <div class="account-preference-heading">
                  <span class="account-preference-kicker">Stay style</span>
                  <h3>Accommodation Preference</h3>
                  <p>Tell us whether to lean toward boutique, comfort-first, luxury, value, or family-friendly stays.</p>
                </div>
                <input id="pref-stay" type="text" value="${accountEsc(preferences.stayPreference || "")}" placeholder="Boutique hotel, desert camp, luxury resort, budget stay..." />
              </label>
              <label class="account-field account-field-wide account-preference-block">
                <div class="account-preference-heading">
                  <span class="account-preference-kicker">Planner notes</span>
                  <h3>Notes For Planning</h3>
                  <p>Share anything a real travel planner would need to know before building your trip.</p>
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
              <p>This is the profile TravelMind will reuse for itinerary suggestions and future recommendations.</p>
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
      </div>
    </section>

    <section class="account-zone">
      <div class="account-zone-header">
        <span class="account-zone-kicker">Activity</span>
        <h2>Trips, Alerts, And Bookings</h2>
        <p>Recent activity is broken into distinct cards so each list stands on its own.</p>
      </div>
      <div class="account-history-grid">
      ${renderListSection("Notifications", "Application updates and account alerts sent to you.", notificationsMarkup, "No notifications yet.")}
      ${renderListSection("Recent Trips", "Your latest saved trips.", tripsMarkup, "No saved trips yet.")}
      ${renderListSection("Recent Bookings", "Latest hotel and restaurant confirmations.", bookingsMarkup, "No bookings saved yet.")}
      ${renderListSection("Recent Reviews", "Reviews you have written across the platform.", reviewsMarkup, "No reviews written yet.")}
      </div>
    </section>

    <section class="account-zone">
      <div class="account-zone-header">
        <span class="account-zone-kicker">Stories</span>
        <h2>Your Published Stories</h2>
        <p>A dedicated card for the content you have already shared with other travelers.</p>
      </div>
      <section class="account-card account-card-stories">
      <div class="account-card-header">
        <div>
          <h2>My Stories</h2>
          <p>Manage the stories you have published and jump straight back into editing.</p>
        </div>
        <a class="btn btn-primary btn-sm" href="stories.html">Open Stories Page</a>
      </div>
      <div class="account-list">
        ${storiesMarkup.length ? storiesMarkup.join("") : `<div class="account-empty"><p>You have not published any stories yet.</p></div>`}
      </div>
      </section>
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
              <p>Sign in to view your profile, trips, bookings, and reviews.</p>
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
  renderAccountDashboard();
}

window.saveAccountProfile = saveAccountProfile;
window.saveAccountPreferencesForm = saveAccountPreferencesForm;
window.deleteAccountStory = deleteAccountStory;
window.markAccountNotificationRead = markAccountNotificationRead;

document.addEventListener("DOMContentLoaded", initAccountPage);
