const ACCOUNT_PREFS_KEY = "tm_account_preferences_v1";

const accountState = {
  user: null,
  trips: [],
  bookings: [],
  reviews: [],
};

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
    upcomingTrips,
    totalSpent,
  };
}

function renderListSection(title, copy, items, emptyText) {
  return `
    <section class="account-card">
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

  shell.innerHTML = `
    <section class="account-top-grid">
      <article class="account-card">
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
      <article class="account-card">
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
    </section>

    <section class="account-stats-grid">
      <article class="account-stat-card"><span>Total Trips</span><strong>${stats.trips}</strong></article>
      <article class="account-stat-card"><span>Completed Trips</span><strong>${stats.completedTrips}</strong></article>
      <article class="account-stat-card"><span>Saved Bookings</span><strong>${stats.bookings}</strong></article>
      <article class="account-stat-card"><span>Booked Spend</span><strong>${accountCurrency(stats.totalSpent)}</strong></article>
    </section>

    <section class="account-content-grid">
      <article class="account-card">
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

      <article class="account-card">
        <div class="account-card-header">
          <div>
            <h2>Travel Preferences</h2>
            <p>These preferences can be reused by itinerary generation and future recommendations.</p>
          </div>
        </div>
        <div class="account-preferences-grid">
          <label class="account-field">
            <span>Travel Style</span>
            <select id="pref-travel-style">
              <option value="Balanced" ${preferences.travelStyle === "Balanced" ? "selected" : ""}>Balanced</option>
              <option value="Luxury" ${preferences.travelStyle === "Luxury" ? "selected" : ""}>Luxury</option>
              <option value="Budget" ${preferences.travelStyle === "Budget" ? "selected" : ""}>Budget</option>
              <option value="Adventure" ${preferences.travelStyle === "Adventure" ? "selected" : ""}>Adventure</option>
              <option value="Relaxed" ${preferences.travelStyle === "Relaxed" ? "selected" : ""}>Relaxed</option>
            </select>
          </label>
          <label class="account-field">
            <span>Preferred Pace</span>
            <select id="pref-pace">
              <option value="Steady" ${preferences.pace === "Steady" ? "selected" : ""}>Steady</option>
              <option value="Fast" ${preferences.pace === "Fast" ? "selected" : ""}>Fast</option>
              <option value="Slow" ${preferences.pace === "Slow" ? "selected" : ""}>Slow</option>
            </select>
          </label>
          <label class="account-field">
            <span>Food Preference</span>
            <input id="pref-food" type="text" value="${accountEsc(preferences.foodPreference || "")}" placeholder="Local cuisine, vegetarian, ..." />
          </label>
          <label class="account-field">
            <span>Accommodation Preference</span>
            <input id="pref-stay" type="text" value="${accountEsc(preferences.stayPreference || "")}" placeholder="Boutique, luxury, budget..." />
          </label>
          <label class="account-field" style="grid-column:1/-1">
            <span>Notes For Planning</span>
            <textarea id="pref-notes" placeholder="Accessibility needs, family travel notes, must-see priorities...">${accountEsc(preferences.notes || "")}</textarea>
          </label>
        </div>
        <div class="account-actions">
          <button class="btn btn-primary" type="button" onclick="saveAccountPreferencesForm()">Save Preferences</button>
        </div>
      </article>
    </section>

    <section class="account-history-grid">
      ${renderListSection("Recent Trips", "Your latest saved trips.", tripsMarkup, "No saved trips yet.")}
      ${renderListSection("Recent Bookings", "Latest hotel and restaurant confirmations.", bookingsMarkup, "No bookings saved yet.")}
      ${renderListSection("Recent Reviews", "Reviews you have written across the platform.", reviewsMarkup, "No reviews written yet.")}
    </section>
  `;
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
    travelStyle: accountById("pref-travel-style").value,
    pace: accountById("pref-pace").value,
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
  renderAccountDashboard();
}

window.saveAccountProfile = saveAccountProfile;
window.saveAccountPreferencesForm = saveAccountPreferencesForm;

document.addEventListener("DOMContentLoaded", initAccountPage);
