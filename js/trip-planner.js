
const TRIP_STORAGE_KEY = "tm_trips_local_v1";
const EXPENSE_STORAGE_KEY = "tm_trip_expenses_local_v1";
const JOURNAL_STORAGE_KEY = "tm_trip_journals_local_v1";
const DEFAULT_DESTINATIONS = ["Jordan", "Amman", "Petra", "Wadi Rum", "Aqaba", "Dead Sea", "Jerash", "Madaba"];

const plannerState = {
  trips: [],
  currentTripId: null,
  currentTrip: null,
  editingTripId: null,
  destinations: [...DEFAULT_DESTINATIONS],
};

function plannerById(id) { return document.getElementById(id); }
function plannerEsc(value) {
  return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (_error) {
    return fallback;
  }
}
function writeJson(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
function tripCacheKey() { return typeof TRIP_CACHE_KEY !== "undefined" ? TRIP_CACHE_KEY : "tm_trip_cache_v1"; }
function setTripCache(trips) { writeJson(tripCacheKey(), trips); }
function getLocalTrips(userId) { return readJson(TRIP_STORAGE_KEY, []).filter((trip) => String(trip.userId) === String(userId)); }
function saveLocalTrips(trips) { writeJson(TRIP_STORAGE_KEY, trips); }
function getLocalExpenses(tripId) { return readJson(EXPENSE_STORAGE_KEY, []).filter((expense) => String(expense.tripId) === String(tripId)); }
function saveLocalExpenses(expenses) { writeJson(EXPENSE_STORAGE_KEY, expenses); }
function getLocalJournals(tripId) { return readJson(JOURNAL_STORAGE_KEY, []).filter((journal) => String(journal.tripId) === String(tripId)); }
function saveLocalJournals(journals) { writeJson(JOURNAL_STORAGE_KEY, journals); }
function uid(prefix) { return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`; }
function normalizeTrip(trip) {
  return { ...trip, id: trip.id, userId: trip.userId, name: trip.name || "Untitled Trip", destination: trip.destination || "Jordan", startDate: trip.startDate || null, endDate: trip.endDate || null, budget: Number(trip.budget || 0), notes: trip.notes || "", createdDate: trip.createdDate || trip.createdAt || new Date().toISOString() };
}
function normalizeExpense(expense) {
  return { ...expense, amount: Number(expense.amount || 0), category: expense.category || "Other", description: expense.description || "Expense", date: expense.date || expense.createdAt || new Date().toISOString() };
}
function normalizeJournal(journal) {
  return { ...journal, title: journal.title || "Journal Entry", content: journal.content || "", date: journal.date || journal.createdAt || new Date().toISOString() };
}
function formatDate(value) {
  if (!value) return "Not set";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Not set" : date.toLocaleDateString();
}
function formatCurrency(value) { return `${Number(value || 0).toFixed(2)} JOD`; }
function daysBetween(startDate, endDate) {
  if (!startDate || !endDate) return 0;
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;
  return Math.max(0, Math.ceil((end - start) / 86400000));
}
function inclusiveTripDuration(startDate, endDate) { return startDate && endDate ? daysBetween(startDate, endDate) + 1 : 0; }
function daysRemaining(endDate) {
  if (!endDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);
  return Math.ceil((end - today) / 86400000);
}
function tripProgressPercent(trip) {
  if (!trip.startDate || !trip.endDate) return 0;
  const start = new Date(trip.startDate);
  const end = new Date(trip.endDate);
  const today = new Date();
  if (today <= start) return 0;
  if (today >= end) return 100;
  const total = end - start;
  return total <= 0 ? 0 : Math.max(0, Math.min(100, Math.round(((today - start) / total) * 100)));
}
function tripStatusLabel(trip) {
  const remaining = daysRemaining(trip.endDate);
  if (remaining == null) return "No dates yet";
  if (remaining < 0) return "Completed";
  if (remaining === 0) return "Ends today";
  return `${remaining} day${remaining === 1 ? "" : "s"} left`;
}
function groupBudgetCategories(expenses) {
  const groups = { accommodation: 0, attractions: 0, food: 0, other: 0 };
  expenses.forEach((expense) => {
    const category = String(expense.category || "").toLowerCase();
    if (category.includes("hotel") || category.includes("accommodation")) groups.accommodation += expense.amount;
    else if (category.includes("food") || category.includes("restaurant")) groups.food += expense.amount;
    else if (category.includes("activit") || category.includes("attraction")) groups.attractions += expense.amount;
    else groups.other += expense.amount;
  });
  return groups;
}
function renderEmptyMain() {
  plannerById("planner-main").innerHTML = `
    <div class="planner-welcome">
      <div class="planner-welcome-icon">Map</div>
      <h3>Select a Trip</h3>
      <p>Choose a trip from the left or create a new one to get started.</p>
      <button class="btn btn-primary btn-lg" type="button" onclick="openTripModal()">+ Create New Trip</button>
    </div>`;
}
function ensureTripFieldErrors() {
  [["trip-name", "trip-name-error"],["trip-destination", "trip-destination-error"],["trip-start", "trip-start-error"],["trip-end", "trip-end-error"],["trip-budget", "trip-budget-error"]].forEach(([fieldId, errorId]) => {
    const field = plannerById(fieldId);
    if (!field || plannerById(errorId)) return;
    const error = document.createElement("div");
    error.id = errorId;
    error.className = "field-error hidden";
    field.insertAdjacentElement("afterend", error);
  });
  const inputRow = document.querySelector("#trip-modal .input-row");
  if (inputRow && !plannerById("trip-duration-preview")) {
    const note = document.createElement("div");
    note.id = "trip-duration-preview";
    note.className = "trip-form-inline-note";
    note.textContent = "Trip duration will be calculated automatically.";
    inputRow.insertAdjacentElement("afterend", note);
  }
}
function clearTripErrors() {
  ["trip-name", "trip-destination", "trip-start", "trip-end", "trip-budget"].forEach((fieldId) => {
    const input = plannerById(fieldId);
    const error = plannerById(`${fieldId}-error`);
    if (input) input.classList.remove("input-invalid");
    if (error) { error.textContent = ""; error.classList.add("hidden"); }
  });
  const topError = plannerById("trip-error");
  if (topError) { topError.textContent = ""; topError.classList.add("hidden"); }
}
function setTripFieldError(fieldId, message) {
  const input = plannerById(fieldId);
  const error = plannerById(`${fieldId}-error`);
  if (input) input.classList.add("input-invalid");
  if (error) { error.textContent = message; error.classList.remove("hidden"); }
}
function updateDurationPreview() {
  const startDate = plannerById("trip-start")?.value;
  const endDate = plannerById("trip-end")?.value;
  const preview = plannerById("trip-duration-preview");
  if (!preview) return;
  if (!startDate || !endDate) { preview.textContent = "Trip duration will be calculated automatically."; return; }
  const duration = inclusiveTripDuration(startDate, endDate);
  preview.textContent = duration <= 0 ? "End date must be after the start date." : `${duration} day${duration === 1 ? "" : "s"} planned for this trip.`;
}
function validateTripForm(payload) {
  clearTripErrors();
  let valid = true;
  if (!payload.name) { setTripFieldError("trip-name", "Trip name is required."); valid = false; }
  if (!payload.destination) { setTripFieldError("trip-destination", "Please choose a destination."); valid = false; }
  if (payload.startDate && payload.endDate && new Date(payload.startDate) > new Date(payload.endDate)) {
    setTripFieldError("trip-start", "Start date must be before end date.");
    setTripFieldError("trip-end", "End date must be after start date.");
    valid = false;
  }
  if (payload.budget !== "" && (!Number.isFinite(payload.budgetValue) || payload.budgetValue <= 0)) { setTripFieldError("trip-budget", "Budget must be a positive number."); valid = false; }
  if (!valid) { const topError = plannerById("trip-error"); if (topError) { topError.textContent = "Please fix the highlighted fields and try again."; topError.classList.remove("hidden"); } }
  return valid;
}
async function loadDestinations() {
  const options = new Set(DEFAULT_DESTINATIONS);
  const sources = [];
  if (window.AttractionsAPI?.getAll) sources.push(AttractionsAPI.getAll());
  if (window.HotelsAPI?.getAll) sources.push(HotelsAPI.getAll());
  if (window.RestaurantsAPI?.getAll) sources.push(RestaurantsAPI.getAll());
  if (sources.length) {
    const results = await Promise.allSettled(sources);
    results.forEach((result) => {
      if (result.status !== "fulfilled" || !Array.isArray(result.value)) return;
      result.value.forEach((item) => {
        const city = item.city || item.destination || item.location;
        if (city) options.add(city);
      });
    });
  }
  plannerState.destinations = [...options].sort((a, b) => a.localeCompare(b));
  const select = plannerById("trip-destination");
  if (!select) return;
  const currentValue = select.value;
  select.innerHTML = `<option value="">Select a destination</option>${plannerState.destinations.map((destination) => `<option value="${plannerEsc(destination)}">${plannerEsc(destination)}</option>`).join("")}`;
  if (currentValue && plannerState.destinations.includes(currentValue)) select.value = currentValue;
}
async function loadTripsFromSource(userId) {
  if (window.TripsAPI?.getByUser) {
    try {
      const data = await TripsAPI.getByUser(userId);
      const trips = Array.isArray(data) ? data.map(normalizeTrip) : [];
      setTripCache(trips);
      saveLocalTrips([...readJson(TRIP_STORAGE_KEY, []).filter((trip) => String(trip.userId) !== String(userId)), ...trips]);
      return trips;
    } catch (_error) {
      return getLocalTrips(userId).map(normalizeTrip);
    }
  }
  return getLocalTrips(userId).map(normalizeTrip);
}
async function createTripInSource(trip) {
  if (window.TripsAPI?.create) {
    try { return normalizeTrip(await TripsAPI.create(trip)); }
    catch (_error) {
      const all = readJson(TRIP_STORAGE_KEY, []);
      const localTrip = { ...trip, id: uid("trip"), createdDate: trip.createdDate || new Date().toISOString() };
      all.push(localTrip);
      saveLocalTrips(all);
      return normalizeTrip(localTrip);
    }
  }
  const all = readJson(TRIP_STORAGE_KEY, []);
  const localTrip = { ...trip, id: uid("trip"), createdDate: trip.createdDate || new Date().toISOString() };
  all.push(localTrip);
  saveLocalTrips(all);
  return normalizeTrip(localTrip);
}
async function updateTripInSource(id, trip) {
  if (window.TripsAPI?.update) {
    try { return normalizeTrip(await TripsAPI.update(id, trip)); }
    catch (_error) {
      const all = readJson(TRIP_STORAGE_KEY, []);
      const index = all.findIndex((item) => String(item.id) === String(id));
      if (index >= 0) all[index] = { ...all[index], ...trip, id };
      saveLocalTrips(all);
      return normalizeTrip(all[index]);
    }
  }
  const all = readJson(TRIP_STORAGE_KEY, []);
  const index = all.findIndex((item) => String(item.id) === String(id));
  if (index >= 0) all[index] = { ...all[index], ...trip, id };
  saveLocalTrips(all);
  return normalizeTrip(all[index]);
}
async function deleteTripFromSource(id) {
  if (window.TripsAPI?.delete) {
    try { await TripsAPI.delete(id); }
    catch (_error) { saveLocalTrips(readJson(TRIP_STORAGE_KEY, []).filter((trip) => String(trip.id) !== String(id))); }
  } else {
    saveLocalTrips(readJson(TRIP_STORAGE_KEY, []).filter((trip) => String(trip.id) !== String(id)));
  }
  const linksMap = readJson(typeof TRIP_LINKS_KEY !== "undefined" ? TRIP_LINKS_KEY : "tm_trip_links_v1", {});
  delete linksMap[String(id)];
  writeJson(typeof TRIP_LINKS_KEY !== "undefined" ? TRIP_LINKS_KEY : "tm_trip_links_v1", linksMap);
}
async function loadExpensesForTrip(tripId) {
  if (window.ExpensesAPI?.getByTrip) {
    try {
      const data = await ExpensesAPI.getByTrip(tripId);
      return Array.isArray(data) ? data.map(normalizeExpense) : [];
    } catch (_error) {
      return getLocalExpenses(tripId).map(normalizeExpense);
    }
  }
  return getLocalExpenses(tripId).map(normalizeExpense);
}
async function createExpenseInSource(expense) {
  if (window.ExpensesAPI?.create) {
    try { return normalizeExpense(await ExpensesAPI.create(expense)); }
    catch (_error) {
      const all = readJson(EXPENSE_STORAGE_KEY, []);
      const localExpense = { ...expense, id: uid("expense") };
      all.push(localExpense);
      saveLocalExpenses(all);
      return normalizeExpense(localExpense);
    }
  }
  const all = readJson(EXPENSE_STORAGE_KEY, []);
  const localExpense = { ...expense, id: uid("expense") };
  all.push(localExpense);
  saveLocalExpenses(all);
  return normalizeExpense(localExpense);
}
async function deleteExpenseFromSource(id) {
  if (window.ExpensesAPI?.delete) {
    try { await ExpensesAPI.delete(id); return; }
    catch (_error) { saveLocalExpenses(readJson(EXPENSE_STORAGE_KEY, []).filter((expense) => String(expense.id) !== String(id))); return; }
  }
  saveLocalExpenses(readJson(EXPENSE_STORAGE_KEY, []).filter((expense) => String(expense.id) !== String(id)));
}
async function loadJournalsForTrip(tripId) {
  const user = getUser();
  if (window.JournalsAPI?.getByUser && user?.id) {
    try {
      const data = await JournalsAPI.getByUser(user.id);
      return Array.isArray(data) ? data.filter((journal) => String(journal.tripId) === String(tripId)).map(normalizeJournal) : [];
    } catch (_error) {
      return getLocalJournals(tripId).map(normalizeJournal);
    }
  }
  return getLocalJournals(tripId).map(normalizeJournal);
}
async function createJournalInSource(journal) {
  if (window.JournalsAPI?.create) {
    try { return normalizeJournal(await JournalsAPI.create(journal)); }
    catch (_error) {
      const all = readJson(JOURNAL_STORAGE_KEY, []);
      const localJournal = { ...journal, id: uid("journal") };
      all.push(localJournal);
      saveLocalJournals(all);
      return normalizeJournal(localJournal);
    }
  }
  const all = readJson(JOURNAL_STORAGE_KEY, []);
  const localJournal = { ...journal, id: uid("journal") };
  all.push(localJournal);
  saveLocalJournals(all);
  return normalizeJournal(localJournal);
}
async function deleteJournalFromSource(id) {
  if (window.JournalsAPI?.delete) {
    try { await JournalsAPI.delete(id); return; }
    catch (_error) { saveLocalJournals(readJson(JOURNAL_STORAGE_KEY, []).filter((journal) => String(journal.id) !== String(id))); return; }
  }
  saveLocalJournals(readJson(JOURNAL_STORAGE_KEY, []).filter((journal) => String(journal.id) !== String(id)));
}
function renderTripsList() {
  const container = plannerById("trips-list");
  if (!container) return;
  if (!plannerState.trips.length) {
    container.innerHTML = `<div class="planner-empty-card"><div class="planner-empty-icon">Bag</div><h4>No trips yet</h4><p>Create your first trip and start linking stays, attractions, and dining spots.</p></div>`;
    return;
  }
  container.innerHTML = plannerState.trips.map((trip) => {
    const duration = inclusiveTripDuration(trip.startDate, trip.endDate);
    const progress = tripProgressPercent(trip);
    return `<article class="trip-item ${String(trip.id) === String(plannerState.currentTripId) ? "active" : ""}" id="trip-item-${plannerEsc(trip.id)}" onclick="selectTrip('${plannerEsc(trip.id)}')">
      <div class="trip-item-budget">${formatCurrency(trip.budget)}</div>
      <div class="trip-item-name">${plannerEsc(trip.name)}</div>
      <div class="trip-item-dest">Location ${plannerEsc(trip.destination)}</div>
      <div class="trip-item-dates">Dates ${formatDate(trip.startDate)} to ${formatDate(trip.endDate)}</div>
      <div class="trip-item-meta-row"><span>${tripStatusLabel(trip)}</span><span>${duration ? `${duration} days` : "Dates pending"}</span></div>
      <div class="trip-item-progress"><div class="trip-item-progress-bar" style="width:${progress}%"></div></div>
      <div class="trip-item-actions">
        <button class="btn btn-outline btn-xs" type="button" onclick="openTripModal('${plannerEsc(trip.id)}'); event.stopPropagation();">Edit</button>
        <button class="btn btn-ghost btn-xs" type="button" onclick="deleteTrip(event, '${plannerEsc(trip.id)}')">Delete</button>
      </div>
    </article>`;
  }).join("");
}
function renderLinkedItems(tripId, options = {}) {
  const links = typeof getTripLinks === "function" ? getTripLinks(tripId) : [];
  const emptyText = options.emptyText || "Nothing has been added to this trip yet.";
  if (!links.length) {
    return `<div class="planner-empty-inline"><div class="planner-empty-inline-icon">Plus</div><div><h4>No saved items yet</h4><p>${plannerEsc(emptyText)}</p></div></div>`;
  }
  return links.sort((a, b) => new Date(a.addedAt) - new Date(b.addedAt)).map((item) => `<article class="linked-item-card">
    <div class="linked-item-media">${item.image ? `<img src="${plannerEsc(item.image)}" alt="${plannerEsc(item.title)}" />` : `<div class="linked-item-placeholder">${plannerEsc(item.itemType?.slice(0, 1) || "?")}</div>`}</div>
    <div class="linked-item-body">
      <div class="linked-item-topline"><div><div class="linked-item-type">${plannerEsc(item.itemType)}</div><h4>${plannerEsc(item.title)}</h4></div><button class="icon-button" type="button" onclick="removeItemFromTrip('${plannerEsc(tripId)}', '${plannerEsc(item.id)}')" aria-label="Remove item">x</button></div>
      <div class="linked-item-meta"><span>${plannerEsc(item.location || "Jordan")}</span>${item.priceLabel ? `<span>${plannerEsc(item.priceLabel)}</span>` : ""}<span>Added ${formatDate(item.addedAt)}</span></div>
      <div class="linked-item-actions">${item.href ? `<a class="btn btn-outline btn-xs" href="${plannerEsc(item.href)}">Open</a>` : ""}</div>
    </div>
  </article>`).join("");
}
function renderBookingHistory(tripId) {
  const user = getUser();
  const bookings = typeof getBookingsByUser === "function"
    ? getBookingsByUser(user?.id || 0).filter((booking) => String(booking.tripId) === String(tripId))
    : [];
  if (!bookings.length) {
    return `<div class="planner-empty-inline"><div class="planner-empty-inline-icon">Book</div><div><h4>No bookings linked yet</h4><p>Confirm a hotel or restaurant booking and link it to this trip to see it here.</p></div></div>`;
  }
  return bookings.map((booking) => `<article class="linked-item-card booking-history-card">
    <div class="linked-item-body">
      <div class="linked-item-topline"><div><div class="linked-item-type">${plannerEsc(booking.type === "hotel" ? "Hotel Booking" : "Restaurant Reservation")}</div><h4>${plannerEsc(booking.itemTitle)}</h4></div><span class="booking-status-pill">${plannerEsc(booking.status || "Confirmed")}</span></div>
      <div class="linked-item-meta"><span>${plannerEsc(booking.city || "Jordan")}</span>${booking.total ? `<span>${formatCurrency(booking.total)}</span>` : ""}<span>${formatDate(booking.createdAt)}</span></div>
      <div class="linked-item-actions"><span>${booking.startDate ? `Date ${formatDate(booking.startDate)}` : ""}</span>${booking.reservationTime ? `<span>${plannerEsc(booking.reservationTime)}</span>` : ""}</div>
    </div>
  </article>`).join("");
}
function renderItinerary(tripId) {
  const links = typeof getTripLinks === "function" ? getTripLinks(tripId) : [];
  if (!links.length) {
    return `<div class="planner-empty-inline"><div class="planner-empty-inline-icon">Plan</div><div><h4>No itinerary items yet</h4><p>Add attractions, hotels, and restaurants from the map pages to start building the trip timeline.</p></div></div>`;
  }
  return `<div class="timeline-list">${links.sort((a, b) => new Date(a.addedAt) - new Date(b.addedAt)).map((item, index) => `<article class="timeline-item"><div class="timeline-marker">${index + 1}</div><div class="timeline-card"><div class="timeline-label">${plannerEsc(item.itemType)}</div><h4>${plannerEsc(item.title)}</h4><p>${plannerEsc(item.location || "Jordan")}</p><div class="timeline-meta">${item.priceLabel ? `<span>${plannerEsc(item.priceLabel)}</span>` : ""}<span>${formatDate(item.addedAt)}</span></div></div></article>`).join("")}</div>`;
}
function renderExpensesTab(trip, expenses) {
  const spent = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const remaining = trip.budget - spent;
  const percentUsed = trip.budget > 0 ? Math.min(100, Math.round((spent / trip.budget) * 100)) : 0;
  const categories = groupBudgetCategories(expenses);
  return `<div class="tab-header"><div><h4>Budget Tracking</h4><p class="planner-section-copy">Track spending against your total budget and by category.</p></div><button class="btn btn-primary btn-sm" type="button" onclick="openExpenseModal()">+ Add Expense</button></div>
    <div class="budget-overview">
      <div class="budget-card budget-card-total"><div class="budget-card-amount">${formatCurrency(trip.budget)}</div><div class="budget-card-label">Total Budget</div></div>
      <div class="budget-card budget-card-spent"><div class="budget-card-amount">${formatCurrency(spent)}</div><div class="budget-card-label">Total Spent</div></div>
      <div class="budget-card budget-card-left"><div class="budget-card-amount">${formatCurrency(remaining)}</div><div class="budget-card-label">Remaining Budget</div></div>
    </div>
    <div class="budget-progress-panel"><div class="budget-progress-header"><strong>${percentUsed}% of budget used</strong><span>${formatCurrency(spent)} / ${formatCurrency(trip.budget)}</span></div><div class="budget-progress-track"><div class="budget-progress-fill" style="width:${percentUsed}%"></div></div></div>
    <div class="category-grid">
      <div class="category-card"><span>Accommodation</span><strong>${formatCurrency(categories.accommodation)}</strong></div>
      <div class="category-card"><span>Attractions</span><strong>${formatCurrency(categories.attractions)}</strong></div>
      <div class="category-card"><span>Food</span><strong>${formatCurrency(categories.food)}</strong></div>
      <div class="category-card"><span>Other</span><strong>${formatCurrency(categories.other)}</strong></div>
    </div>
    <div class="expense-list">${expenses.length ? expenses.sort((a, b) => new Date(b.date) - new Date(a.date)).map((expense) => `<div class="expense-item"><div class="expense-item-left"><div class="expense-item-icon">${expense.category?.slice(0, 1) || "E"}</div><div><div class="expense-item-desc">${plannerEsc(expense.description)}</div><div class="expense-item-meta">${plannerEsc(expense.category)} • ${formatDate(expense.date)}</div></div></div><div class="expense-item-right"><div class="expense-item-amount">${formatCurrency(expense.amount)}</div><button class="expense-item-delete" type="button" onclick="deleteExpense('${plannerEsc(expense.id)}')">Delete</button></div></div>`).join("") : `<div class="planner-empty-inline"><div class="planner-empty-inline-icon">Cash</div><div><h4>No expenses yet</h4><p>Add your first expense to start tracking the trip budget.</p></div></div>`}</div>`;
}
function renderJournalTab(journals) {
  return `<div class="tab-header"><div><h4>Trip Journal</h4><p class="planner-section-copy">Capture notes, memories, and planning updates in one place.</p></div><button class="btn btn-primary btn-sm" type="button" onclick="openJournalModal()">+ New Entry</button></div>
    <div class="journal-list">${journals.length ? journals.sort((a, b) => new Date(b.date) - new Date(a.date)).map((journal) => `<article class="journal-item"><div class="journal-item-header"><div><div class="journal-item-title">${plannerEsc(journal.title)}</div><div class="journal-item-date">${formatDate(journal.date)}</div></div><button class="journal-item-delete" type="button" onclick="deleteJournal('${plannerEsc(journal.id)}')">Delete</button></div><div class="journal-item-content">${plannerEsc(journal.content)}</div></article>`).join("") : `<div class="planner-empty-inline"><div class="planner-empty-inline-icon">Note</div><div><h4>No journal entries yet</h4><p>Save memories, plans, and reminders for this trip here.</p></div></div>`}</div>`;
}
async function renderTripDetail(trip) {
  const main = plannerById("planner-main");
  const expenses = await loadExpensesForTrip(trip.id);
  const journals = await loadJournalsForTrip(trip.id);
  const linkedItems = typeof getTripLinks === "function" ? getTripLinks(trip.id) : [];
  const spent = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const remaining = trip.budget - spent;
  const duration = inclusiveTripDuration(trip.startDate, trip.endDate);
  const daysLeft = daysRemaining(trip.endDate);
  const percentUsed = trip.budget > 0 ? Math.min(100, Math.round((spent / trip.budget) * 100)) : 0;
  main.innerHTML = `<div class="trip-detail-shell">
    <section class="trip-detail-hero">
      <div class="trip-detail-title-wrap">
        <div class="trip-detail-kicker">Trip overview</div>
        <h2 class="trip-detail-title">${plannerEsc(trip.name)}</h2>
        <div class="trip-detail-meta"><span class="trip-meta-item">Location ${plannerEsc(trip.destination)}</span><span class="trip-meta-item">Dates ${formatDate(trip.startDate)} to ${formatDate(trip.endDate)}</span><span class="trip-meta-item">Duration ${duration ? `${duration} days` : "Dates pending"}</span></div>
        <p class="trip-detail-notes">${plannerEsc(trip.notes || "No trip notes yet. Use the edit form to add planning notes or reminders.")}</p>
      </div>
      <div class="trip-detail-actions"><button class="btn btn-outline btn-sm" type="button" onclick="openTripModal('${plannerEsc(trip.id)}')">Edit Trip</button><button class="btn btn-ghost btn-sm" type="button" onclick="deleteTrip(null, '${plannerEsc(trip.id)}')">Delete</button></div>
    </section>
    <section class="trip-stats-grid">
      <div class="trip-stat-card"><span>Status</span><strong>${plannerEsc(daysLeft == null ? "Planning" : tripStatusLabel(trip))}</strong></div>
      <div class="trip-stat-card"><span>Items Added</span><strong>${linkedItems.length}</strong></div>
      <div class="trip-stat-card"><span>Budget Remaining</span><strong>${formatCurrency(remaining)}</strong></div>
      <div class="trip-stat-card"><span>Budget Used</span><strong>${percentUsed}%</strong></div>
    </section>
    <div class="trip-tabs">
      <button class="trip-tab active" type="button" onclick="showTab(this, 'overview')">Overview</button>
      <button class="trip-tab" type="button" onclick="showTab(this, 'itinerary')">Itinerary</button>
      <button class="trip-tab" type="button" onclick="showTab(this, 'budget')">Budget</button>
      <button class="trip-tab" type="button" onclick="showTab(this, 'journal')">Journal</button>
    </div>
    <div class="tab-content active" id="tab-overview"><section class="planner-section-grid"><div class="planner-panel"><div class="tab-header"><div><h4>Trip Details</h4><p class="planner-section-copy">Core travel information for this trip.</p></div><button class="btn btn-outline btn-sm" type="button" onclick="openTripModal('${plannerEsc(trip.id)}')">Update</button></div><div class="detail-grid"><div class="detail-card"><span>Destination</span><strong>${plannerEsc(trip.destination)}</strong></div><div class="detail-card"><span>Duration</span><strong>${duration ? `${duration} days` : "TBD"}</strong></div><div class="detail-card"><span>Created</span><strong>${formatDate(trip.createdDate)}</strong></div><div class="detail-card"><span>Total Budget</span><strong>${formatCurrency(trip.budget)}</strong></div></div></div><div class="planner-panel"><div class="tab-header"><div><h4>Added To This Trip</h4><p class="planner-section-copy">Selections from attractions, hotels, and restaurants.</p></div></div><div class="linked-item-list">${renderLinkedItems(trip.id, { emptyText: "Browse the map pages and use Add to Trip to build this plan." })}</div></div><div class="planner-panel"><div class="tab-header"><div><h4>Booking History</h4><p class="planner-section-copy">Confirmed stays and reservations linked to this trip.</p></div></div><div class="linked-item-list">${renderBookingHistory(trip.id)}</div></div></section></div>
    <div class="tab-content" id="tab-itinerary"><div class="planner-panel"><div class="tab-header"><div><h4>Itinerary Timeline</h4><p class="planner-section-copy">A simple running plan based on the items added to this trip.</p></div></div>${renderItinerary(trip.id)}</div></div>
    <div class="tab-content" id="tab-budget"><div class="planner-panel">${renderExpensesTab(trip, expenses)}</div></div>
    <div class="tab-content" id="tab-journal"><div class="planner-panel">${renderJournalTab(journals)}</div></div>
  </div>`;
}
function showTab(button, tabName) {
  document.querySelectorAll(".trip-tab").forEach((tab) => tab.classList.remove("active"));
  document.querySelectorAll(".tab-content").forEach((panel) => panel.classList.remove("active"));
  button.classList.add("active");
  plannerById(`tab-${tabName}`)?.classList.add("active");
}
async function selectTrip(id) {
  plannerState.currentTripId = id;
  plannerState.currentTrip = plannerState.trips.find((trip) => String(trip.id) === String(id)) || null;
  if (typeof setSelectedTripId === "function") setSelectedTripId(id);
  renderTripsList();
  const main = plannerById("planner-main");
  main.innerHTML = `<div class="loading"><div class="spinner"></div></div>`;
  if (plannerState.currentTrip) { await renderTripDetail(plannerState.currentTrip); return; }
  try {
    const trip = window.TripsAPI?.getById ? normalizeTrip(await TripsAPI.getById(id)) : null;
    if (!trip) throw new Error("Trip not found");
    plannerState.currentTrip = trip;
    await renderTripDetail(trip);
  } catch (_error) {
    main.innerHTML = `<div class="planner-empty-card"><div class="planner-empty-icon">Warn</div><h4>Could not load trip</h4><p>Please try again.</p></div>`;
  }
}
function checkLogin() {
  if (isLoggedIn()) return true;
  document.querySelector(".planner-layout").innerHTML = `<div class="login-required" style="grid-column:1/-1"><div class="login-required-icon">Lock</div><h3>Login Required</h3><p>Please login to create and manage your trip planner.</p><button class="btn btn-primary btn-lg" type="button" onclick="location.href='auth.html'">Login Now</button></div>`;
  return false;
}
async function loadTrips() {
  if (!checkLogin()) return;
  const user = getUser();
  plannerState.trips = await loadTripsFromSource(user.id);
  setTripCache(plannerState.trips);
  renderTripsList();
  const selectedId = typeof getSelectedTripId === "function" ? getSelectedTripId() : null;
  if (selectedId && plannerState.trips.some((trip) => String(trip.id) === String(selectedId))) { await selectTrip(selectedId); return; }
  if (plannerState.currentTripId && plannerState.trips.some((trip) => String(trip.id) === String(plannerState.currentTripId))) { await selectTrip(plannerState.currentTripId); return; }
  renderEmptyMain();
}
function openTripModal(tripId = null) {
  plannerState.editingTripId = tripId;
  clearTripErrors();
  ensureTripFieldErrors();
  plannerById("trip-modal-title").textContent = tripId ? "Edit Trip" : "New Trip";
  const trip = plannerState.trips.find((item) => String(item.id) === String(tripId)) || plannerState.currentTrip;
  plannerById("trip-name").value = tripId && trip ? trip.name || "" : "";
  plannerById("trip-destination").value = tripId && trip ? trip.destination || "" : "";
  plannerById("trip-start").value = tripId && trip?.startDate ? String(trip.startDate).split("T")[0] : "";
  plannerById("trip-end").value = tripId && trip?.endDate ? String(trip.endDate).split("T")[0] : "";
  plannerById("trip-budget").value = tripId && trip ? trip.budget || "" : "";
  plannerById("trip-notes").value = tripId && trip ? trip.notes || "" : "";
  updateDurationPreview();
  plannerById("trip-modal").classList.add("open");
}
function closeTripModal() {
  plannerById("trip-modal").classList.remove("open");
  plannerState.editingTripId = null;
}
async function saveTrip() {
  const user = getUser();
  const payload = { name: plannerById("trip-name").value.trim(), destination: plannerById("trip-destination").value, startDate: plannerById("trip-start").value || null, endDate: plannerById("trip-end").value || null, budget: plannerById("trip-budget").value, budgetValue: Number(plannerById("trip-budget").value), notes: plannerById("trip-notes").value.trim() };
  if (!validateTripForm(payload)) return;
  const tripDto = { id: plannerState.editingTripId || 0, userId: user.id, name: payload.name, destination: payload.destination, startDate: payload.startDate, endDate: payload.endDate, budget: payload.budget ? payload.budgetValue : 0, notes: payload.notes, createdDate: plannerState.trips.find((trip) => String(trip.id) === String(plannerState.editingTripId))?.createdDate || new Date().toISOString(), durationDays: inclusiveTripDuration(payload.startDate, payload.endDate) };
  const isEditing = Boolean(plannerState.editingTripId);
  try {
    const savedTrip = isEditing ? await updateTripInSource(plannerState.editingTripId, tripDto) : await createTripInSource(tripDto);
    closeTripModal();
    showToast(isEditing ? "Trip updated successfully." : "Trip created successfully.", "success");
    await loadTrips();
    await selectTrip(savedTrip.id);
  } catch (_error) {
    const topError = plannerById("trip-error");
    topError.textContent = "Failed to save trip. Please try again.";
    topError.classList.remove("hidden");
  }
}
async function deleteTrip(event, id) {
  if (event) event.stopPropagation();
  if (!confirm("Are you sure you want to delete this trip?")) return;
  await deleteTripFromSource(id);
  showToast("Trip deleted.", "info");
  if (String(plannerState.currentTripId) === String(id)) { plannerState.currentTripId = null; plannerState.currentTrip = null; }
  if (typeof getSelectedTripId === "function" && String(getSelectedTripId()) === String(id)) setSelectedTripId("");
  await loadTrips();
}
function openExpenseModal() {
  plannerById("expense-desc").value = "";
  plannerById("expense-amount").value = "";
  plannerById("expense-category").value = "Transport";
  plannerById("expense-date").value = new Date().toISOString().split("T")[0];
  plannerById("expense-modal").classList.add("open");
}
function closeExpenseModal() { plannerById("expense-modal").classList.remove("open"); }
async function saveExpense() {
  const description = plannerById("expense-desc").value.trim();
  const amount = Number(plannerById("expense-amount").value);
  const category = plannerById("expense-category").value;
  const date = plannerById("expense-date").value || new Date().toISOString();
  if (!plannerState.currentTripId) { showToast("Select a trip first.", "error"); return; }
  if (!description || !Number.isFinite(amount) || amount <= 0) { showToast("Please enter a description and a positive amount.", "error"); return; }
  await createExpenseInSource({ id: 0, userId: getUser()?.id || 0, tripId: plannerState.currentTripId, description, amount, category, date, createdAt: new Date().toISOString() });
  closeExpenseModal();
  showToast("Expense added.", "success");
  await selectTrip(plannerState.currentTripId);
}
async function deleteExpense(id) {
  if (!confirm("Delete this expense?")) return;
  await deleteExpenseFromSource(id);
  showToast("Expense deleted.", "info");
  await selectTrip(plannerState.currentTripId);
}
function openJournalModal() {
  plannerById("journal-title").value = "";
  plannerById("journal-content").value = "";
  plannerById("journal-date").value = new Date().toISOString().split("T")[0];
  plannerById("journal-modal").classList.add("open");
}
function closeJournalModal() { plannerById("journal-modal").classList.remove("open"); }
async function saveJournal() {
  const title = plannerById("journal-title").value.trim();
  const content = plannerById("journal-content").value.trim();
  const date = plannerById("journal-date").value || new Date().toISOString();
  if (!plannerState.currentTripId) { showToast("Select a trip first.", "error"); return; }
  if (!title || !content) { showToast("Please add both a title and some notes.", "error"); return; }
  await createJournalInSource({ id: 0, userId: getUser()?.id || 0, tripId: plannerState.currentTripId, title, content, date, createdAt: new Date().toISOString() });
  closeJournalModal();
  showToast("Journal entry saved.", "success");
  await selectTrip(plannerState.currentTripId);
}
async function deleteJournal(id) {
  if (!confirm("Delete this journal entry?")) return;
  await deleteJournalFromSource(id);
  showToast("Journal entry deleted.", "info");
  await selectTrip(plannerState.currentTripId);
}
function removeItemFromTrip(tripId, linkId) {
  if (typeof removeTripLink !== "function") return;
  removeTripLink(tripId, linkId);
  showToast("Item removed from trip.", "info");
  if (String(plannerState.currentTripId) === String(tripId)) selectTrip(tripId);
}
function bindPlannerEvents() {
  ["trip-modal", "expense-modal", "journal-modal"].forEach((id) => {
    plannerById(id)?.addEventListener("click", (event) => {
      if (event.target === event.currentTarget) event.currentTarget.classList.remove("open");
    });
  });
  plannerById("trip-start")?.addEventListener("input", updateDurationPreview);
  plannerById("trip-end")?.addEventListener("input", updateDurationPreview);
  window.addEventListener("trip-links-updated", async (event) => {
    if (!plannerState.currentTripId) return;
    if (!event.detail?.tripId || String(event.detail.tripId) === String(plannerState.currentTripId)) await selectTrip(plannerState.currentTripId);
  });
  window.addEventListener("bookings-updated", async () => {
    if (plannerState.currentTripId) await selectTrip(plannerState.currentTripId);
  });
  window.addEventListener("trip-selection-updated", async (event) => {
    const tripId = event.detail?.tripId;
    if (
      tripId &&
      String(tripId) !== String(plannerState.currentTripId) &&
      plannerState.trips.some((trip) => String(trip.id) === String(tripId))
    ) await selectTrip(tripId);
  });
}
async function initTripPlanner() {
  ensureTripFieldErrors();
  await loadDestinations();
  bindPlannerEvents();
  await loadTrips();
}
window.openTripModal = openTripModal;
window.closeTripModal = closeTripModal;
window.saveTrip = saveTrip;
window.selectTrip = selectTrip;
window.deleteTrip = deleteTrip;
window.showTab = showTab;
window.openExpenseModal = openExpenseModal;
window.closeExpenseModal = closeExpenseModal;
window.saveExpense = saveExpense;
window.deleteExpense = deleteExpense;
window.openJournalModal = openJournalModal;
window.closeJournalModal = closeJournalModal;
window.saveJournal = saveJournal;
window.deleteJournal = deleteJournal;
window.removeItemFromTrip = removeItemFromTrip;
document.addEventListener("DOMContentLoaded", initTripPlanner);
