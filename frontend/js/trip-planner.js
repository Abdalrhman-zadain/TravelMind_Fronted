
const TRIP_STORAGE_KEY = "tm_trips_local_v1";
const EXPENSE_STORAGE_KEY = "tm_trip_expenses_local_v1";
const JOURNAL_STORAGE_KEY = "tm_trip_journals_local_v1";
const ITINERARY_STORAGE_KEY = "tm_trip_itineraries_v1";
const COLLAB_STORAGE_KEY = "tm_trip_collaboration_v1";
const AI_PLAN_STORAGE_KEY = "tm_ai_trip_plans_v1";
const AI_PLAN_FAVORITES_KEY = "tm_ai_trip_plan_favorites_v1";
const DEFAULT_DESTINATIONS = ["Jordan", "Amman", "Petra", "Wadi Rum", "Aqaba", "Dead Sea", "Jerash", "Madaba"];
const AI_INTERESTS = ["History", "Adventure", "Nature", "Food", "Culture", "Luxury", "Relaxation", "Family"];

const plannerState = {
  trips: [],
  currentTripId: null,
  currentTrip: null,
  editingTripId: null,
  destinations: [...DEFAULT_DESTINATIONS],
  aiPlans: [],
  currentAiPlanId: null,
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
function getItineraryMap() { return readJson(ITINERARY_STORAGE_KEY, {}); }
function saveItineraryMap(map) { writeJson(ITINERARY_STORAGE_KEY, map); }
function getCollaborationMap() { return readJson(COLLAB_STORAGE_KEY, {}); }
function saveCollaborationMap(map) { writeJson(COLLAB_STORAGE_KEY, map); }
function getTripItinerary(tripId) { return getItineraryMap()[String(tripId)] || null; }
function setTripItinerary(tripId, itinerary) {
  const map = getItineraryMap();
  map[String(tripId)] = itinerary;
  saveItineraryMap(map);
}
function clearTripItinerary(tripId) {
  const map = getItineraryMap();
  delete map[String(tripId)];
  saveItineraryMap(map);
}
function uid(prefix) { return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`; }
function getCurrentUserProfile() {
  const user = typeof getUser === "function" ? getUser() : null;
  return {
    id: user?.id || "guest",
    name: user?.name || "Traveler",
    email: user?.email || "",
  };
}
function defaultCollaborator(profile, role = "Owner") {
  return {
    id: `member-${profile.id}`,
    userId: profile.id,
    name: profile.name,
    email: profile.email || "",
    role,
    status: role === "Owner" ? "Owner" : "Invited",
    invitedAt: new Date().toISOString(),
  };
}
function getTripCollaboration(tripId) {
  const map = getCollaborationMap();
  const record = map[String(tripId)] || {};
  return {
    collaborators: Array.isArray(record.collaborators) ? record.collaborators : [],
    comments: Array.isArray(record.comments) ? record.comments : [],
    activity: Array.isArray(record.activity) ? record.activity : [],
    votes: record.votes && typeof record.votes === "object" ? record.votes : {},
  };
}
function setTripCollaboration(tripId, record) {
  const map = getCollaborationMap();
  map[String(tripId)] = record;
  saveCollaborationMap(map);
}
function ensureTripCollaboration(trip) {
  const profile = getCurrentUserProfile();
  const record = getTripCollaboration(trip.id);
  const collaborators = [...record.collaborators];
  const ownerExists = collaborators.some((member) => String(member.userId) === String(trip.userId || profile.id));
  if (!ownerExists) {
    const ownerProfile = {
      id: trip.userId || profile.id,
      name: trip.ownerName || profile.name,
      email: trip.ownerEmail || profile.email,
    };
    collaborators.unshift(defaultCollaborator(ownerProfile, "Owner"));
  }
  const normalized = { ...record, collaborators };
  setTripCollaboration(trip.id, normalized);
  return normalized;
}
function recordTripActivity(tripId, entry) {
  if (!tripId) return;
  const record = getTripCollaboration(tripId);
  record.activity = [
    {
      id: uid("activity"),
      type: entry.type || "update",
      authorId: entry.authorId || null,
      authorName: entry.authorName || "Traveler",
      text: entry.text || "Updated the trip.",
      createdAt: entry.createdAt || new Date().toISOString(),
    },
    ...record.activity,
  ].slice(0, 40);
  setTripCollaboration(tripId, record);
  window.dispatchEvent(new CustomEvent("trip-collaboration-updated", { detail: { tripId } }));
}
function collaboratorInitials(name) {
  const tokens = String(name || "T").trim().split(/\s+/).filter(Boolean).slice(0, 2);
  return tokens.map((token) => token[0]?.toUpperCase() || "").join("") || "T";
}
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
function slugText(value) {
  return String(value || "").toLowerCase();
}
function parsePriceLabelToNumber(label) {
  const match = String(label || "").match(/(\d+(?:\.\d+)?)/);
  return match ? Number(match[1]) : 0;
}
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
function tripDateList(trip) {
  if (!trip.startDate || !trip.endDate) return [];
  const dates = [];
  const start = new Date(trip.startDate);
  const end = new Date(trip.endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) return [];
  const cursor = new Date(start);
  while (cursor <= end) {
    dates.push(cursor.toISOString().split("T")[0]);
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
}
function fallbackIdeasForDestination(destination) {
  const text = slugText(destination);
  if (text.includes("petra")) {
    return {
      morning: "Start early at Petra Visitor Center and walk the Siq before the main crowds arrive.",
      afternoon: "Explore the Royal Tombs and rest with lunch near the archaeological park.",
      evening: "Slow down with a scenic dinner and a relaxed walk through Wadi Musa.",
    };
  }
  if (text.includes("wadi")) {
    return {
      morning: "Take a sunrise jeep tour through Wadi Rum's sandstone valleys.",
      afternoon: "Pause for a Bedouin-style lunch and short canyon walk.",
      evening: "Wrap up with a desert camp dinner and stargazing session.",
    };
  }
  if (text.includes("amman")) {
    return {
      morning: "Visit Amman Citadel and Roman Theatre while temperatures are mild.",
      afternoon: "Plan a downtown lunch stop and browse Rainbow Street or local cafes.",
      evening: "Reserve dinner in the city and leave time for a relaxed evening walk.",
    };
  }
  return {
    morning: `Start the day exploring the highlights around ${destination || "Jordan"}.`,
    afternoon: "Leave space for lunch, a second stop, and time to recharge.",
    evening: "Finish with a relaxed dinner and an easy evening plan.",
  };
}
function buildGeneratedItinerary(trip) {
  const links = typeof getTripLinks === "function" ? getTripLinks(trip.id) : [];
  const bookings = typeof getBookingsByUser === "function"
    ? getBookingsByUser(getUser()?.id || 0).filter((booking) => String(booking.tripId) === String(trip.id))
    : [];
  const dates = tripDateList(trip);
  const duration = dates.length || Math.max(1, inclusiveTripDuration(trip.startDate, trip.endDate) || 3);
  const attractions = links.filter((item) => item.itemType === "Attraction");
  const restaurants = links.filter((item) => item.itemType === "Restaurant");
  const hotels = links.filter((item) => item.itemType === "Hotel");
  const hotelBookings = bookings.filter((item) => item.type === "hotel");
  const restaurantBookings = bookings.filter((item) => item.type === "restaurant");
  const fallback = fallbackIdeasForDestination(trip.destination);
  const totalBudget = Number(trip.budget || 0);
  const estimatedDailyBudget = duration > 0 ? totalBudget / duration : totalBudget;

  const days = Array.from({ length: duration }, (_, index) => {
    const attraction = attractions[index % Math.max(1, attractions.length)] || null;
    const restaurant = restaurants[index % Math.max(1, restaurants.length)] || null;
    const hotel = hotels[0] || hotelBookings[0] || null;
    const restaurantBooking = restaurantBookings[index % Math.max(1, restaurantBookings.length)] || null;
    const date = dates[index] || null;
    const activities = [
      {
        slot: "Morning",
        title: attraction?.title || `Discover ${trip.destination || "Jordan"}`,
        note: attraction
          ? `Focus on ${attraction.title}${attraction.location ? ` in ${attraction.location}` : ""} while energy is high.`
          : fallback.morning,
        estimatedCost: attraction ? parsePriceLabelToNumber(attraction.priceLabel) : 0,
      },
      {
        slot: "Afternoon",
        title: restaurant?.title || "Flexible midday plan",
        note: restaurant
          ? `Plan lunch or a break at ${restaurant.title} and keep extra time for nearby stops.`
          : fallback.afternoon,
        estimatedCost: restaurant ? parsePriceLabelToNumber(restaurant.priceLabel) : estimatedDailyBudget * 0.15,
      },
      {
        slot: "Evening",
        title: restaurantBooking?.itemTitle || hotel?.title || "Evening wind-down",
        note: restaurantBooking
          ? `Reservation booked for ${restaurantBooking.reservationTime || "the evening"}.`
          : hotel
            ? `Return to ${hotel.title || hotel.itemTitle} and keep the evening relaxed.`
            : fallback.evening,
        estimatedCost: hotel ? parsePriceLabelToNumber(hotel.priceLabel || hotel.total) : estimatedDailyBudget * 0.2,
      },
    ];

    return {
      dayNumber: index + 1,
      date,
      headline: attraction?.title || `Day ${index + 1} in ${trip.destination || "Jordan"}`,
      focus: attraction?.location || trip.destination || "Jordan",
      estimatedBudget: Math.max(0, activities.reduce((sum, activity) => sum + Number(activity.estimatedCost || 0), 0)),
      stay: hotel ? (hotel.title || hotel.itemTitle) : "Accommodation to be confirmed",
      activities,
    };
  });

  return {
    generatedAt: new Date().toISOString(),
    summary: `Generated for ${trip.name} using your dates, saved places, bookings, and budget.`,
    dailyBudget: estimatedDailyBudget,
    days,
  };
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
  const collaborationMap = getCollaborationMap();
  delete collaborationMap[String(id)];
  saveCollaborationMap(collaborationMap);
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
    const collaboration = ensureTripCollaboration(trip);
    return `<article class="trip-item ${String(trip.id) === String(plannerState.currentTripId) ? "active" : ""}" id="trip-item-${plannerEsc(trip.id)}" onclick="selectTrip('${plannerEsc(trip.id)}')">
      <div class="trip-item-budget">${formatCurrency(trip.budget)}</div>
      <div class="trip-item-name">${plannerEsc(trip.name)}</div>
      <div class="trip-item-dest">Location ${plannerEsc(trip.destination)}</div>
      <div class="trip-item-dates">Dates ${formatDate(trip.startDate)} to ${formatDate(trip.endDate)}</div>
      <div class="trip-item-meta-row"><span>${tripStatusLabel(trip)}</span><span>${duration ? `${duration} days` : "Dates pending"}</span></div>
      <div class="trip-item-collab"><span>${collaboration.collaborators.length} collaborator${collaboration.collaborators.length === 1 ? "" : "s"}</span><span>${collaboration.comments.length} note${collaboration.comments.length === 1 ? "" : "s"}</span></div>
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
      <div class="linked-item-meta"><span>${plannerEsc(item.location || "Jordan")}</span>${item.priceLabel ? `<span>${plannerEsc(item.priceLabel)}</span>` : ""}<span>Added ${formatDate(item.addedAt)}</span><span>By ${plannerEsc(item.addedByName || "Traveler")}</span></div>
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
function renderGeneratedItinerary(trip) {
  const itinerary = getTripItinerary(trip.id);
  if (!itinerary || !Array.isArray(itinerary.days) || !itinerary.days.length) {
    return `<div class="planner-empty-inline"><div class="planner-empty-inline-icon">AI</div><div><h4>No AI itinerary yet</h4><p>Generate a smart day-by-day plan using your trip dates, linked places, bookings, and budget.</p></div></div>`;
  }
  return `<div class="itinerary-generated-shell">
    <div class="itinerary-generated-summary">
      <div>
        <h4>AI Itinerary Summary</h4>
        <p>${plannerEsc(itinerary.summary || "")}</p>
      </div>
      <div class="itinerary-summary-metrics">
        <span>${itinerary.days.length} day plan</span>
        <span>${formatCurrency(itinerary.dailyBudget || 0)} average/day</span>
        <span>Generated ${formatDate(itinerary.generatedAt)}</span>
      </div>
    </div>
    <div class="itinerary-day-list">
      ${itinerary.days.map((day) => `<article class="itinerary-day-card">
        <div class="itinerary-day-topline">
          <div>
            <div class="linked-item-type">Day ${day.dayNumber}</div>
            <h4>${plannerEsc(day.headline)}</h4>
          </div>
          <div class="itinerary-day-meta">
            <span>${day.date ? formatDate(day.date) : "Date flexible"}</span>
            <span>${plannerEsc(day.focus || trip.destination || "Jordan")}</span>
            <span>${formatCurrency(day.estimatedBudget || 0)}</span>
          </div>
        </div>
        <div class="detail-card itinerary-stay-card"><span>Stay</span><strong>${plannerEsc(day.stay || "To be confirmed")}</strong></div>
        <div class="itinerary-slot-list">
          ${day.activities.map((activity) => `<div class="itinerary-slot-card">
            <div class="linked-item-type">${plannerEsc(activity.slot)}</div>
            <strong>${plannerEsc(activity.title)}</strong>
            <p>${plannerEsc(activity.note)}</p>
          </div>`).join("")}
        </div>
      </article>`).join("")}
    </div>
  </div>`;
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
function renderCollaborationTab(trip) {
  const collaboration = ensureTripCollaboration(trip);
  const links = typeof getTripLinks === "function" ? getTripLinks(trip.id) : [];
  const currentUser = getCurrentUserProfile();
  const ownerUserId = String(trip.userId || currentUser.id);
  const collaborators = collaboration.collaborators;
  const comments = collaboration.comments;
  const activity = collaboration.activity;
  const votes = collaboration.votes || {};
  const votedLinkIds = new Set(
    Object.entries(votes)
      .filter(([, entries]) => Array.isArray(entries) && entries.some((entry) => String(entry.userId) === String(currentUser.id)))
      .map(([linkId]) => linkId)
  );

  const collaboratorsHtml = collaborators.length
    ? collaborators.map((member) => `
        <article class="collab-member-card">
          <div class="collab-member-avatar">${plannerEsc(collaboratorInitials(member.name))}</div>
          <div class="collab-member-body">
            <div class="collab-member-topline">
              <strong>${plannerEsc(member.name)}</strong>
              <span class="account-badge">${plannerEsc(member.role || member.status || "Traveler")}</span>
            </div>
            <div class="linked-item-meta">
              <span>${plannerEsc(member.email || "No email added")}</span>
              <span>${plannerEsc(member.status || "Active")}</span>
            </div>
          </div>
          ${String(member.userId) !== ownerUserId
            ? `<button class="btn btn-ghost btn-xs" type="button" onclick="removeCollaborator('${plannerEsc(trip.id)}', '${plannerEsc(member.id)}')">Remove</button>`
            : ""}
        </article>`)
      .join("")
    : `<div class="planner-empty-inline"><div class="planner-empty-inline-icon">Team</div><div><h4>No collaborators yet</h4><p>Invite friends or family to plan this trip together.</p></div></div>`;

  const commentsHtml = comments.length
    ? comments.map((comment) => `
        <article class="collab-comment-card">
          <div class="collab-comment-topline">
            <strong>${plannerEsc(comment.authorName)}</strong>
            <span>${formatDate(comment.createdAt)}</span>
          </div>
          <p>${plannerEsc(comment.message)}</p>
        </article>`)
      .join("")
    : `<div class="planner-empty-inline"><div class="planner-empty-inline-icon">Chat</div><div><h4>No shared notes yet</h4><p>Post ideas, decisions, or questions so everyone stays aligned.</p></div></div>`;

  const activityHtml = activity.length
    ? activity.map((entry) => `
        <article class="activity-item">
          <div class="activity-dot"></div>
          <div>
            <strong>${plannerEsc(entry.authorName || "Traveler")}</strong>
            <p>${plannerEsc(entry.text)}</p>
            <span>${formatDate(entry.createdAt)}</span>
          </div>
        </article>`)
      .join("")
    : `<div class="planner-empty-inline"><div class="planner-empty-inline-icon">Pulse</div><div><h4>No activity yet</h4><p>Trip changes, comments, bookings, and votes will show up here.</p></div></div>`;

  const votingHtml = links.length
    ? links.map((item) => {
        const entryVotes = Array.isArray(votes[item.id]) ? votes[item.id] : [];
        const voterNames = entryVotes.map((entry) => entry.name).filter(Boolean);
        return `<article class="vote-card">
          <div>
            <div class="linked-item-type">${plannerEsc(item.itemType)}</div>
            <h4>${plannerEsc(item.title)}</h4>
            <p>${plannerEsc(item.location || "Jordan")}</p>
          </div>
          <div class="vote-card-side">
            <strong>${entryVotes.length} vote${entryVotes.length === 1 ? "" : "s"}</strong>
            <span>${plannerEsc(voterNames.join(", ") || "No votes yet")}</span>
            <button class="btn ${votedLinkIds.has(item.id) ? "btn-outline" : "btn-primary"} btn-xs" type="button" onclick="toggleTripVote('${plannerEsc(trip.id)}', '${plannerEsc(item.id)}')">${votedLinkIds.has(item.id) ? "Remove Vote" : "Vote For This"}</button>
          </div>
        </article>`;
      }).join("")
    : `<div class="planner-empty-inline"><div class="planner-empty-inline-icon">Vote</div><div><h4>No saved places to vote on</h4><p>Add attractions, hotels, or restaurants to start deciding as a group.</p></div></div>`;

  return `<section class="planner-section-grid collaboration-grid">
    <div class="planner-panel">
      <div class="tab-header">
        <div><h4>Collaborators</h4><p class="planner-section-copy">Invite people to co-plan this trip and keep track of who is involved.</p></div>
      </div>
      <div class="collab-invite-form">
        <div class="input-row">
          <div class="input-group">
            <label class="input-label">Name</label>
            <input type="text" id="collab-name" class="input" placeholder="e.g. Sara" />
          </div>
          <div class="input-group">
            <label class="input-label">Email</label>
            <input type="email" id="collab-email" class="input" placeholder="friend@example.com" />
          </div>
        </div>
        <div class="input-row">
          <div class="input-group">
            <label class="input-label">Role</label>
            <select id="collab-role" class="input">
              <option value="Editor">Editor</option>
              <option value="Viewer">Viewer</option>
              <option value="Budget Lead">Budget Lead</option>
              <option value="Food Planner">Food Planner</option>
            </select>
          </div>
          <div class="input-group collab-invite-action">
            <label class="input-label">Invite</label>
            <button class="btn btn-primary" type="button" onclick="inviteCollaborator('${plannerEsc(trip.id)}')">Send Invite</button>
          </div>
        </div>
      </div>
      <div class="collab-member-list">${collaboratorsHtml}</div>
    </div>
    <div class="planner-panel">
      <div class="tab-header">
        <div><h4>Shared Notes</h4><p class="planner-section-copy">Keep trip conversations and decisions attached to the plan.</p></div>
      </div>
      <div class="input-group">
        <label class="input-label">Post an update</label>
        <textarea id="collab-comment" class="input" rows="4" placeholder="Share an idea, ask a question, or confirm a decision."></textarea>
      </div>
      <div class="trip-detail-actions" style="margin-bottom:16px">
        <button class="btn btn-primary btn-sm" type="button" onclick="addTripComment('${plannerEsc(trip.id)}')">Post Note</button>
      </div>
      <div class="collab-comment-list">${commentsHtml}</div>
    </div>
    <div class="planner-panel">
      <div class="tab-header">
        <div><h4>Group Voting</h4><p class="planner-section-copy">Vote on saved places to decide what the group wants most.</p></div>
      </div>
      <div class="vote-list">${votingHtml}</div>
    </div>
    <div class="planner-panel">
      <div class="tab-header">
        <div><h4>Activity Feed</h4><p class="planner-section-copy">A live log of changes across bookings, notes, saved places, and planning updates.</p></div>
      </div>
      <div class="activity-list">${activityHtml}</div>
    </div>
  </section>`;
}
async function renderTripDetail(trip) {
  const main = plannerById("planner-main");
  const expenses = await loadExpensesForTrip(trip.id);
  const journals = await loadJournalsForTrip(trip.id);
  const linkedItems = typeof getTripLinks === "function" ? getTripLinks(trip.id) : [];
  const collaboration = ensureTripCollaboration(trip);
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
      <div class="trip-stat-card"><span>Collaborators</span><strong>${collaboration.collaborators.length}</strong></div>
      <div class="trip-stat-card"><span>Budget Remaining</span><strong>${formatCurrency(remaining)}</strong></div>
      <div class="trip-stat-card"><span>Budget Used</span><strong>${percentUsed}%</strong></div>
    </section>
    <div class="trip-tabs">
      <button class="trip-tab active" type="button" onclick="showTab(this, 'overview')">Overview</button>
      <button class="trip-tab" type="button" onclick="showTab(this, 'itinerary')">Itinerary</button>
      <button class="trip-tab" type="button" onclick="showTab(this, 'budget')">Budget</button>
      <button class="trip-tab" type="button" onclick="showTab(this, 'journal')">Journal</button>
      <button class="trip-tab" type="button" onclick="showTab(this, 'collaboration')">Collaboration</button>
    </div>
    <div class="tab-content active" id="tab-overview"><section class="planner-section-grid"><div class="planner-panel"><div class="tab-header"><div><h4>Trip Details</h4><p class="planner-section-copy">Core travel information for this trip.</p></div><button class="btn btn-outline btn-sm" type="button" onclick="openTripModal('${plannerEsc(trip.id)}')">Update</button></div><div class="detail-grid"><div class="detail-card"><span>Destination</span><strong>${plannerEsc(trip.destination)}</strong></div><div class="detail-card"><span>Duration</span><strong>${duration ? `${duration} days` : "TBD"}</strong></div><div class="detail-card"><span>Created</span><strong>${formatDate(trip.createdDate)}</strong></div><div class="detail-card"><span>Total Budget</span><strong>${formatCurrency(trip.budget)}</strong></div></div></div><div class="planner-panel"><div class="tab-header"><div><h4>Added To This Trip</h4><p class="planner-section-copy">Selections from attractions, hotels, and restaurants.</p></div></div><div class="linked-item-list">${renderLinkedItems(trip.id, { emptyText: "Browse the map pages and use Add to Trip to build this plan." })}</div></div><div class="planner-panel"><div class="tab-header"><div><h4>Booking History</h4><p class="planner-section-copy">Confirmed stays and reservations linked to this trip.</p></div></div><div class="linked-item-list">${renderBookingHistory(trip.id)}</div></div></section></div>
    <div class="tab-content" id="tab-itinerary"><div class="planner-panel"><div class="tab-header"><div><h4>Itinerary Timeline</h4><p class="planner-section-copy">Generate a smart day-by-day plan and compare it with your manually added items.</p></div><div class="trip-detail-actions"><button class="btn btn-primary btn-sm" type="button" onclick="generateAiItinerary('${plannerEsc(trip.id)}')">Generate AI Itinerary</button><button class="btn btn-outline btn-sm" type="button" onclick="clearAiItinerary('${plannerEsc(trip.id)}')">Clear</button></div></div>${renderGeneratedItinerary(trip)}<div class="tab-header" style="margin-top:18px"><div><h4>Saved Stops</h4><p class="planner-section-copy">Your manually selected places still appear here for reference.</p></div></div>${renderItinerary(trip.id)}</div></div>
    <div class="tab-content" id="tab-budget"><div class="planner-panel">${renderExpensesTab(trip, expenses)}</div></div>
    <div class="tab-content" id="tab-journal"><div class="planner-panel">${renderJournalTab(journals)}</div></div>
    <div class="tab-content" id="tab-collaboration">${renderCollaborationTab(trip)}</div>
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

function getAiPlanStore() { return readJson(AI_PLAN_STORAGE_KEY, []); }
function saveAiPlanStore(plans) { writeJson(AI_PLAN_STORAGE_KEY, plans); }
function getAiPlanFavorites() { return readJson(AI_PLAN_FAVORITES_KEY, []); }
function saveAiPlanFavorites(items) { writeJson(AI_PLAN_FAVORITES_KEY, items); }
function aiDestinationOptions() { return plannerState.destinations.length ? plannerState.destinations : DEFAULT_DESTINATIONS; }
function selectedInterests() { return Array.from(document.querySelectorAll(".ai-interest-chip.active")).map((button) => button.getAttribute("data-interest")); }

async function loadAiPlansFromSource(userId) {
  if (window.AiTripPlansAPI?.getByUser) {
    try {
      const data = await AiTripPlansAPI.getByUser(userId);
      const plans = Array.isArray(data) ? data.map((plan) => ({
        ...plan,
        planId: plan.id,
        createdDate: plan.createdAt || plan.createdDate,
        updatedDate: plan.updatedAt || plan.updatedDate,
      })) : [];
      saveAiPlanStore(plans);
      return plans;
    } catch (_error) {
      return getAiPlanStore().filter((plan) => String(plan.userId) === String(userId));
    }
  }
  return getAiPlanStore().filter((plan) => String(plan.userId) === String(userId));
}

async function createAiPlanInSource(plan) {
  if (window.AiTripPlansAPI?.create) {
    try {
      const created = await AiTripPlansAPI.create({
        userId: plan.userId,
        destination: plan.destination,
        duration: plan.duration,
        budget: plan.budget,
        travelersCount: plan.travelersCount,
        travelInterests: plan.travelInterests,
        generatedItinerary: plan.generatedItinerary,
        estimatedCost: plan.estimatedCost,
      });
      return {
        ...plan,
        planId: created.id,
        id: created.id,
        createdDate: created.createdAt,
        updatedDate: created.updatedAt,
      };
    } catch (_error) {
      const local = { ...plan, planId: plan.planId || uid("plan") };
      const stored = getAiPlanStore().filter((item) => String(item.planId) !== String(local.planId));
      stored.unshift(local);
      saveAiPlanStore(stored);
      return local;
    }
  }
  const local = { ...plan, planId: plan.planId || uid("plan") };
  const stored = getAiPlanStore().filter((item) => String(item.planId) !== String(local.planId));
  stored.unshift(local);
  saveAiPlanStore(stored);
  return local;
}

async function updateAiPlanInSource(planId, plan) {
  if (window.AiTripPlansAPI?.update) {
    try {
      const updated = await AiTripPlansAPI.update(planId, {
        destination: plan.destination,
        duration: plan.duration,
        budget: plan.budget,
        travelersCount: plan.travelersCount,
        travelInterests: plan.travelInterests,
        generatedItinerary: plan.generatedItinerary,
        estimatedCost: plan.estimatedCost,
      });
      return {
        ...plan,
        planId: updated.id,
        id: updated.id,
        createdDate: updated.createdAt || plan.createdDate,
        updatedDate: updated.updatedAt || new Date().toISOString(),
      };
    } catch (_error) {
      const local = { ...plan, planId };
      const stored = getAiPlanStore().filter((item) => String(item.planId) !== String(planId));
      stored.unshift(local);
      saveAiPlanStore(stored);
      return local;
    }
  }
  const local = { ...plan, planId };
  const stored = getAiPlanStore().filter((item) => String(item.planId) !== String(planId));
  stored.unshift(local);
  saveAiPlanStore(stored);
  return local;
}

async function deleteAiPlanFromSource(planId) {
  if (window.AiTripPlansAPI?.delete) {
    try {
      await AiTripPlansAPI.delete(planId);
    } catch (_error) {
      // fallback handled below
    }
  }
  saveAiPlanStore(getAiPlanStore().filter((plan) => String(plan.planId) !== String(planId)));
}

function renderAiInterestChips(selected = []) {
  const container = plannerById("ai-interest-grid");
  if (!container) return;
  container.innerHTML = AI_INTERESTS.map((interest) => `<button class="ai-interest-chip ${selected.includes(interest) ? "active" : ""}" type="button" data-interest="${plannerEsc(interest)}">${plannerEsc(interest)}</button>`).join("");
  container.querySelectorAll(".ai-interest-chip").forEach((button) => button.addEventListener("click", () => button.classList.toggle("active")));
}

function fillAiDestinationOptions() {
  const select = plannerById("ai-destination");
  if (!select) return;
  const current = select.value;
  select.innerHTML = `<option value="">Select a destination</option>${aiDestinationOptions().map((destination) => `<option value="${plannerEsc(destination)}">${plannerEsc(destination)}</option>`).join("")}`;
  if (current && aiDestinationOptions().includes(current)) select.value = current;
}

function readAiPlannerForm() {
  return {
    destination: plannerById("ai-destination")?.value || "",
    duration: Number(plannerById("ai-days")?.value || 0),
    budget: Number(plannerById("ai-budget")?.value || 0),
    travelersCount: Number(plannerById("ai-travelers")?.value || 0),
    travelInterests: selectedInterests(),
  };
}

function scoreByInterests(item, interests) {
  const text = `${item.nameEn || item.title || ""} ${item.descriptionEn || item.description || ""} ${item.category || ""}`.toLowerCase();
  return interests.reduce((score, interest) => {
    const value = String(interest || "").toLowerCase();
    if (value === "history" && /(history|roman|archae|ancient|heritage|treasury)/.test(text)) return score + 3;
    if (value === "adventure" && /(desert|jeep|camp|hike|adventure|trail)/.test(text)) return score + 3;
    if (value === "nature" && /(nature|wadi|sea|view|landscape|mountain)/.test(text)) return score + 3;
    if (value === "food" && /(food|restaurant|kitchen|grill|cuisine)/.test(text)) return score + 2;
    if (value === "culture" && /(culture|local|guide|festival|museum|tradition)/.test(text)) return score + 2;
    if (value === "luxury" && /(luxury|premium|resort|spa|exclusive)/.test(text)) return score + 2;
    if (value === "relaxation" && /(spa|sea|relax|camp|sunset|wellness)/.test(text)) return score + 2;
    if (value === "family" && /(family|easy|kids|group)/.test(text)) return score + 1;
    return score;
  }, Number(item.rating || 0));
}

async function fetchAiPlannerSources() {
  const [attractions, hotels, restaurants, companies, tours] = await Promise.all([
    AttractionsAPI.getAll().catch(() => []),
    HotelsAPI.getAll().catch(() => []),
    RestaurantsAPI.getAll().catch(() => []),
    typeof CompaniesAPI !== "undefined" ? CompaniesAPI.getAll().catch(() => []) : [],
    typeof ToursAPI !== "undefined" ? ToursAPI.getAll().catch(() => []) : [],
  ]);
  return { attractions, hotels, restaurants, companies, tours };
}

function filterByDestination(list, destination, keys = ["city"]) {
  const wanted = String(destination || "").toLowerCase();
  return (list || []).filter((item) => keys.some((key) => String(item[key] || "").toLowerCase().includes(wanted)));
}

function buildAiTripPlan(payload, sources) {
  const destinationAttractions = filterByDestination(sources.attractions, payload.destination, ["city"]);
  const destinationHotels = filterByDestination(sources.hotels, payload.destination, ["city"]);
  const destinationRestaurants = filterByDestination(sources.restaurants, payload.destination, ["city"]);
  const destinationCompanies = filterByDestination(sources.companies, payload.destination, ["city", "location"]);
  const destinationTours = filterByDestination(sources.tours, payload.destination, ["location", "title", "summary"]);
  const rankedAttractions = destinationAttractions.map((item) => ({ ...item, score: scoreByInterests(item, payload.travelInterests) })).sort((a, b) => b.score - a.score).slice(0, Math.max(3, payload.duration));
  const rankedTours = destinationTours.map((item) => ({ ...item, score: scoreByInterests(item, payload.travelInterests) })).sort((a, b) => b.score - a.score).slice(0, Math.max(2, Math.ceil(payload.duration / 2)));
  const rankedHotels = destinationHotels.slice().sort((a, b) => (Number(b.rating || 0) - Number(a.rating || 0)) || (Number(a.pricePerNight || 0) - Number(b.pricePerNight || 0))).slice(0, 3);
  const rankedRestaurants = destinationRestaurants.slice().sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0)).slice(0, Math.max(2, payload.duration));
  const rankedCompanies = destinationCompanies.slice().sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0)).slice(0, 3);
  const hotelEstimate = (rankedHotels[0]?.pricePerNight || Math.max(45, Math.round((payload.budget || 240) * 0.28))) * payload.duration;
  const attractionEstimate = rankedAttractions.slice(0, payload.duration).reduce((sum, item) => sum + Number(item.entryFee || 12), 0) * Math.max(1, payload.travelersCount);
  const tourEstimate = rankedTours.reduce((sum, item) => sum + Number(item.price || 35), 0) * Math.max(1, payload.travelersCount);
  const foodEstimate = Math.max(18, Math.round((payload.budget || 240) * 0.18)) * payload.duration;
  const estimatedCost = Math.round(hotelEstimate + attractionEstimate + tourEstimate + foodEstimate);
  const itinerary = Array.from({ length: payload.duration }, (_, index) => {
    const attraction = rankedAttractions[index % Math.max(rankedAttractions.length, 1)];
    const tour = rankedTours[index % Math.max(rankedTours.length, 1)];
    const restaurant = rankedRestaurants[index % Math.max(rankedRestaurants.length, 1)];
    return {
      day: index + 1,
      headline: attraction?.nameEn || attraction?.title || `Explore ${payload.destination}`,
      items: [
        `Morning: ${attraction?.nameEn || attraction?.title || `Discover ${payload.destination}`} with photo stops and easy pacing.`,
        `Afternoon: ${tour?.title || "flexible local experience"}${tour?.duration ? ` (${tour.duration})` : ""}.`,
        `Evening: Dinner at ${restaurant?.nameEn || restaurant?.title || "a local restaurant"} and time to unwind.`,
      ],
    };
  });
  return {
    planId: plannerState.currentAiPlanId || uid("plan"),
    userId: getUser()?.id || "guest",
    destination: payload.destination,
    duration: payload.duration,
    budget: payload.budget,
    travelersCount: payload.travelersCount,
    travelInterests: payload.travelInterests,
    generatedItinerary: itinerary,
    suggestedAttractions: rankedAttractions.map((item) => ({ id: item.id, title: item.nameEn || item.title, rating: Number(item.rating || 4.7), price: Number(item.entryFee || 0) })),
    recommendedTours: rankedTours.map((item) => ({ id: item.id, title: item.title, duration: item.duration || "Half day", price: Number(item.price || 0) })),
    recommendedHotels: rankedHotels.map((item) => ({ id: item.id, title: item.nameEn, rating: Number(item.rating || 4.5), price: Number(item.pricePerNight || 0) })),
    recommendedCompanies: rankedCompanies.map((item) => ({ id: item.id, title: item.name, rating: Number(item.rating || 4.7) })),
    estimatedCost,
    createdDate: new Date().toISOString(),
    updatedDate: new Date().toISOString(),
  };
}

function renderAiPlanResult(plan) {
  const result = plannerById("ai-plan-result");
  if (!result) return;
  if (!plan) {
    result.innerHTML = `<div class="planner-empty-inline"><div class="planner-empty-inline-icon">AI</div><div><h4>No itinerary generated yet</h4><p>Generate a plan to view your daily itinerary, recommended stays, tours, attractions, and total estimated trip cost.</p></div></div>`;
    return;
  }
  result.innerHTML = `<div class="ai-plan-topline"><div><h3>${plannerEsc(plan.destination)} itinerary</h3><p class="ai-plan-copy">${plan.duration} day${plan.duration === 1 ? "" : "s"} for ${plan.travelersCount} traveler${plan.travelersCount === 1 ? "" : "s"} focused on ${plannerEsc(plan.travelInterests.join(", ") || "general travel")}.</p></div><div class="ai-plan-toolbar"><button class="btn btn-outline btn-sm" type="button" onclick="loadAiPlanForEditing('${plannerEsc(plan.planId)}')">Edit</button><button class="btn btn-ghost btn-sm" type="button" onclick="deleteAiPlan('${plannerEsc(plan.planId)}')">Delete</button></div></div><div class="ai-plan-detail-grid"><div class="ai-plan-summary-card"><span>Estimated Cost</span><strong>${formatCurrency(plan.estimatedCost)}</strong></div><div class="ai-plan-summary-card"><span>Budget</span><strong>${formatCurrency(plan.budget)}</strong></div><div class="ai-plan-summary-card"><span>Created</span><strong>${formatDate(plan.updatedDate || plan.createdDate)}</strong></div></div><div class="ai-plan-suggestion-grid"><div class="ai-plan-suggestion-card"><h4>Suggested Attractions</h4><ul class="ai-plan-list">${plan.suggestedAttractions.map((item) => `<li>${plannerEsc(item.title)} • ${item.rating.toFixed(1)} • ${formatCurrency(item.price)}</li>`).join("")}</ul></div><div class="ai-plan-suggestion-card"><h4>Recommended Tours</h4><ul class="ai-plan-list">${plan.recommendedTours.map((item) => `<li>${plannerEsc(item.title)} • ${plannerEsc(item.duration)} • ${formatCurrency(item.price)}</li>`).join("")}</ul></div><div class="ai-plan-suggestion-card"><h4>Recommended Hotels</h4><ul class="ai-plan-list">${plan.recommendedHotels.map((item) => `<li>${plannerEsc(item.title)} • ${item.rating.toFixed(1)} • ${formatCurrency(item.price)}/night</li>`).join("")}</ul></div></div><div class="ai-plan-days" style="margin-top:18px">${plan.generatedItinerary.map((day) => `<article class="ai-day-card"><div class="ai-day-topline"><h4>Day ${day.day}</h4><strong>${plannerEsc(day.headline)}</strong></div><ul class="ai-day-list">${day.items.map((item) => `<li>${plannerEsc(item)}</li>`).join("")}</ul></article>`).join("")}</div>`;
}

function renderSavedAiPlans() {
  const list = plannerById("saved-ai-plans");
  if (!list) return;
  if (!plannerState.aiPlans.length) {
    list.innerHTML = `<div class="planner-empty-inline"><div class="planner-empty-inline-icon">Save</div><div><h4>No saved plans yet</h4><p>Save an AI plan to reopen and edit it later.</p></div></div>`;
    return;
  }
  list.innerHTML = plannerState.aiPlans.map((plan) => `<article class="saved-ai-plan-item ${String(plan.planId) === String(plannerState.currentAiPlanId) ? "active" : ""}"><div class="saved-ai-plan-topline"><div class="saved-ai-plan-copy"><h4>${plannerEsc(plan.destination)}</h4><p>${plan.duration} days • ${plan.travelersCount} travelers • ${formatCurrency(plan.estimatedCost)}</p></div><span>${formatDate(plan.updatedDate || plan.createdDate)}</span></div><div class="saved-ai-plan-actions"><button class="btn btn-outline btn-xs" type="button" onclick="openAiPlan('${plannerEsc(plan.planId)}')">Open</button><button class="btn btn-ghost btn-xs" type="button" onclick="loadAiPlanForEditing('${plannerEsc(plan.planId)}')">Edit</button></div></article>`).join("");
}

function openAiPlan(planId) {
  const plan = plannerState.aiPlans.find((item) => String(item.planId) === String(planId));
  if (!plan) return;
  plannerState.currentAiPlanId = plan.planId;
  renderSavedAiPlans();
  renderAiPlanResult(plan);
}

function loadAiPlanForEditing(planId) {
  const plan = plannerState.aiPlans.find((item) => String(item.planId) === String(planId));
  if (!plan) return;
  plannerState.currentAiPlanId = plan.planId;
  plannerById("ai-destination").value = plan.destination;
  plannerById("ai-days").value = plan.duration;
  plannerById("ai-budget").value = plan.budget;
  plannerById("ai-travelers").value = plan.travelersCount;
  renderAiInterestChips(plan.travelInterests || []);
  renderSavedAiPlans();
  renderAiPlanResult(plan);
}

async function deleteAiPlan(planId) {
  await deleteAiPlanFromSource(planId);
  plannerState.aiPlans = plannerState.aiPlans.filter((plan) => String(plan.planId) !== String(planId));
  if (String(plannerState.currentAiPlanId) === String(planId)) {
    plannerState.currentAiPlanId = null;
    renderAiPlanResult(null);
  }
  renderSavedAiPlans();
  showToast("AI plan deleted.", "info");
}

async function generateAiTripPlan(event) {
  if (event) event.preventDefault();
  const payload = readAiPlannerForm();
  if (!payload.destination || payload.duration < 1 || payload.budget < 0 || payload.travelersCount < 1 || !payload.travelInterests.length) {
    showToast("Please complete destination, days, budget, travelers, and interests before generating.", "error");
    return;
  }
  const existing = plannerState.currentAiPlanId ? plannerState.aiPlans.find((item) => String(item.planId) === String(plannerState.currentAiPlanId)) : null;
  const plan = buildAiTripPlan(payload, await fetchAiPlannerSources());
  plan.planId = existing?.planId || plan.planId;
  plan.createdDate = existing?.createdDate || plan.createdDate;
  plan.updatedDate = new Date().toISOString();
  plannerState.currentAiPlanId = plan.planId;
  const persisted = existing
    ? await updateAiPlanInSource(existing.planId, plan)
    : await createAiPlanInSource(plan);
  plannerState.currentAiPlanId = persisted.planId;
  plannerState.aiPlans = [persisted, ...plannerState.aiPlans.filter((item) => String(item.planId) !== String(persisted.planId))];
  renderSavedAiPlans();
  renderAiPlanResult(persisted);
  showToast("AI itinerary generated.", "success");
}

async function saveCurrentAiPlan() {
  const plan = plannerState.currentAiPlanId ? plannerState.aiPlans.find((item) => String(item.planId) === String(plannerState.currentAiPlanId)) : null;
  if (!plan) {
    showToast("Generate a plan first, then save it.", "error");
    return;
  }
  const persisted = await updateAiPlanInSource(plan.planId, { ...plan, updatedDate: new Date().toISOString() });
  plannerState.aiPlans = [persisted, ...plannerState.aiPlans.filter((item) => String(item.planId) !== String(persisted.planId))];
  renderSavedAiPlans();
  showToast("AI itinerary saved.", "success");
}

function exportCurrentAiPlan() {
  const plan = plannerState.currentAiPlanId ? plannerState.aiPlans.find((item) => String(item.planId) === String(plannerState.currentAiPlanId)) : null;
  if (!plan) {
    showToast("Save a plan before exporting it.", "error");
    return;
  }
  const lines = [`${plan.destination} itinerary`, `Duration: ${plan.duration} days`, `Travelers: ${plan.travelersCount}`, `Budget: ${formatCurrency(plan.budget)}`, `Estimated Cost: ${formatCurrency(plan.estimatedCost)}`, `Interests: ${plan.travelInterests.join(", ")}`, "", ...plan.generatedItinerary.flatMap((day) => [`Day ${day.day}: ${day.headline}`, ...day.items.map((item) => `- ${item}`), ""])];
  const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
  const href = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = href;
  link.download = `${plan.destination.toLowerCase().replace(/\s+/g, "-")}-itinerary.txt`;
  link.click();
  URL.revokeObjectURL(href);
}

function favoriteCurrentAiPlanItems() {
  const plan = plannerState.currentAiPlanId ? plannerState.aiPlans.find((item) => String(item.planId) === String(plannerState.currentAiPlanId)) : null;
  if (!plan) {
    showToast("Save the itinerary first so we know what to favorite.", "error");
    return;
  }
  const current = getAiPlanFavorites();
  saveAiPlanFavorites([...current, ...plan.suggestedAttractions.map((item) => ({ type: "Attraction", title: item.title, planId: plan.planId })), ...plan.recommendedTours.map((item) => ({ type: "Tour", title: item.title, planId: plan.planId })), ...plan.recommendedHotels.map((item) => ({ type: "Hotel", title: item.title, planId: plan.planId }))]);
  showToast("Itinerary highlights added to favorites.", "success");
}

function bindAiPlannerEvents() {
  plannerById("ai-trip-form")?.addEventListener("submit", generateAiTripPlan);
  plannerById("save-ai-plan-btn")?.addEventListener("click", saveCurrentAiPlan);
  plannerById("export-ai-plan-btn")?.addEventListener("click", exportCurrentAiPlan);
  plannerById("favorite-ai-plan-btn")?.addEventListener("click", favoriteCurrentAiPlanItems);
}

function hydrateAiPlannerFromQuery() {
  const params = new URLSearchParams(window.location.search);
  if (params.get("destination")) plannerById("ai-destination").value = params.get("destination");
  if (params.get("days")) plannerById("ai-days").value = params.get("days");
  if (params.get("budget")) plannerById("ai-budget").value = params.get("budget");
  if (params.get("travelers")) plannerById("ai-travelers").value = params.get("travelers");
  const interests = String(params.get("interests") || "").split(",").map((item) => item.trim()).filter(Boolean).map((item) => item.charAt(0).toUpperCase() + item.slice(1).toLowerCase());
  renderAiInterestChips(interests);
}

async function initAiPlanner() {
  renderAiInterestChips();
  fillAiDestinationOptions();
  bindAiPlannerEvents();
  plannerState.aiPlans = await loadAiPlansFromSource(getUser()?.id || "guest");
  renderSavedAiPlans();
  hydrateAiPlannerFromQuery();
  const newestPlan = plannerState.aiPlans[0];
  if (newestPlan) {
    plannerState.currentAiPlanId = newestPlan.planId;
    renderSavedAiPlans();
    renderAiPlanResult(newestPlan);
  } else {
    renderAiPlanResult(null);
  }
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
    ensureTripCollaboration(savedTrip);
    recordTripActivity(savedTrip.id, {
      type: isEditing ? "trip-updated" : "trip-created",
      authorId: user?.id || null,
      authorName: user?.name || "Traveler",
      text: isEditing ? `${user?.name || "Traveler"} updated trip details.` : `${user?.name || "Traveler"} created this trip.`,
    });
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
  recordTripActivity(plannerState.currentTripId, {
    type: "expense-added",
    authorId: getUser()?.id || null,
    authorName: getUser()?.name || "Traveler",
    text: `${getUser()?.name || "Traveler"} logged a ${category.toLowerCase()} expense for ${formatCurrency(amount)}.`,
  });
  closeExpenseModal();
  showToast("Expense added.", "success");
  await selectTrip(plannerState.currentTripId);
}
async function deleteExpense(id) {
  if (!confirm("Delete this expense?")) return;
  await deleteExpenseFromSource(id);
  recordTripActivity(plannerState.currentTripId, {
    type: "expense-removed",
    authorId: getUser()?.id || null,
    authorName: getUser()?.name || "Traveler",
    text: `${getUser()?.name || "Traveler"} removed an expense from the budget.`,
  });
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
  recordTripActivity(plannerState.currentTripId, {
    type: "journal-added",
    authorId: getUser()?.id || null,
    authorName: getUser()?.name || "Traveler",
    text: `${getUser()?.name || "Traveler"} posted a journal entry: ${title}.`,
  });
  closeJournalModal();
  showToast("Journal entry saved.", "success");
  await selectTrip(plannerState.currentTripId);
}
async function deleteJournal(id) {
  if (!confirm("Delete this journal entry?")) return;
  await deleteJournalFromSource(id);
  recordTripActivity(plannerState.currentTripId, {
    type: "journal-removed",
    authorId: getUser()?.id || null,
    authorName: getUser()?.name || "Traveler",
    text: `${getUser()?.name || "Traveler"} removed a journal entry.`,
  });
  showToast("Journal entry deleted.", "info");
  await selectTrip(plannerState.currentTripId);
}
function generateAiItinerary(tripId) {
  const trip = plannerState.trips.find((entry) => String(entry.id) === String(tripId)) || plannerState.currentTrip;
  if (!trip) {
    showToast("Select a trip first.", "error");
    return;
  }
  const duration = inclusiveTripDuration(trip.startDate, trip.endDate);
  if (!duration) {
    showToast("Please add valid trip dates before generating an itinerary.", "error");
    return;
  }
  const itinerary = buildGeneratedItinerary(trip);
  setTripItinerary(trip.id, itinerary);
  recordTripActivity(trip.id, {
    type: "itinerary-generated",
    authorId: getUser()?.id || null,
    authorName: getUser()?.name || "Traveler",
    text: `${getUser()?.name || "Traveler"} generated a fresh AI itinerary.`,
  });
  showToast("AI itinerary generated.", "success");
  selectTrip(trip.id);
}
function clearAiItinerary(tripId) {
  clearTripItinerary(tripId);
  recordTripActivity(tripId, {
    type: "itinerary-cleared",
    authorId: getUser()?.id || null,
    authorName: getUser()?.name || "Traveler",
    text: `${getUser()?.name || "Traveler"} cleared the AI itinerary.`,
  });
  showToast("AI itinerary cleared.", "info");
  if (String(plannerState.currentTripId) === String(tripId)) selectTrip(tripId);
}
function removeItemFromTrip(tripId, linkId) {
  if (typeof removeTripLink !== "function") return;
  const item = typeof getTripLinks === "function"
    ? getTripLinks(tripId).find((entry) => String(entry.id) === String(linkId))
    : null;
  removeTripLink(tripId, linkId);
  recordTripActivity(tripId, {
    type: "item-removed",
    authorId: getUser()?.id || null,
    authorName: getUser()?.name || "Traveler",
    text: `${getUser()?.name || "Traveler"} removed ${item?.title || "an item"} from the trip.`,
  });
  showToast("Item removed from trip.", "info");
  if (String(plannerState.currentTripId) === String(tripId)) selectTrip(tripId);
}
function inviteCollaborator(tripId) {
  const name = plannerById("collab-name")?.value.trim();
  const email = plannerById("collab-email")?.value.trim();
  const role = plannerById("collab-role")?.value || "Editor";
  if (!name || !email) {
    showToast("Add both a name and email before sending an invite.", "error");
    return;
  }
  const record = getTripCollaboration(tripId);
  const exists = record.collaborators.some(
    (member) => member.email && member.email.toLowerCase() === email.toLowerCase()
  );
  if (exists) {
    showToast("That collaborator is already on this trip.", "info");
    return;
  }
  record.collaborators.push({
    id: uid("member"),
    userId: email.toLowerCase(),
    name,
    email,
    role,
    status: "Invited",
    invitedAt: new Date().toISOString(),
  });
  setTripCollaboration(tripId, record);
  recordTripActivity(tripId, {
    type: "collaborator-invited",
    authorId: getUser()?.id || null,
    authorName: getUser()?.name || "Traveler",
    text: `${getUser()?.name || "Traveler"} invited ${name} as ${role.toLowerCase()}.`,
  });
  plannerById("collab-name").value = "";
  plannerById("collab-email").value = "";
  plannerById("collab-role").value = "Editor";
  showToast("Collaborator invited.", "success");
  if (String(plannerState.currentTripId) === String(tripId)) selectTrip(tripId);
}
function removeCollaborator(tripId, memberId) {
  const record = getTripCollaboration(tripId);
  const member = record.collaborators.find((entry) => String(entry.id) === String(memberId));
  if (!member) return;
  record.collaborators = record.collaborators.filter((entry) => String(entry.id) !== String(memberId));
  setTripCollaboration(tripId, record);
  recordTripActivity(tripId, {
    type: "collaborator-removed",
    authorId: getUser()?.id || null,
    authorName: getUser()?.name || "Traveler",
    text: `${getUser()?.name || "Traveler"} removed ${member.name} from the trip.`,
  });
  showToast("Collaborator removed.", "info");
  if (String(plannerState.currentTripId) === String(tripId)) selectTrip(tripId);
}
function addTripComment(tripId) {
  const message = plannerById("collab-comment")?.value.trim();
  if (!message) {
    showToast("Write a note before posting it.", "error");
    return;
  }
  const record = getTripCollaboration(tripId);
  record.comments.unshift({
    id: uid("comment"),
    authorId: getUser()?.id || null,
    authorName: getUser()?.name || "Traveler",
    message,
    createdAt: new Date().toISOString(),
  });
  setTripCollaboration(tripId, record);
  recordTripActivity(tripId, {
    type: "comment-added",
    authorId: getUser()?.id || null,
    authorName: getUser()?.name || "Traveler",
    text: `${getUser()?.name || "Traveler"} posted a shared note.`,
  });
  plannerById("collab-comment").value = "";
  showToast("Shared note posted.", "success");
  if (String(plannerState.currentTripId) === String(tripId)) selectTrip(tripId);
}
function toggleTripVote(tripId, linkId) {
  const record = getTripCollaboration(tripId);
  const currentUser = getCurrentUserProfile();
  const votes = Array.isArray(record.votes[linkId]) ? record.votes[linkId] : [];
  const existing = votes.find((entry) => String(entry.userId) === String(currentUser.id));
  const item = typeof getTripLinks === "function"
    ? getTripLinks(tripId).find((entry) => String(entry.id) === String(linkId))
    : null;
  if (existing) {
    record.votes[linkId] = votes.filter((entry) => String(entry.userId) !== String(currentUser.id));
    setTripCollaboration(tripId, record);
    recordTripActivity(tripId, {
      type: "vote-removed",
      authorId: currentUser.id,
      authorName: currentUser.name,
      text: `${currentUser.name} removed a vote from ${item?.title || "a saved place"}.`,
    });
    showToast("Vote removed.", "info");
  } else {
    record.votes[linkId] = [{ userId: currentUser.id, name: currentUser.name, createdAt: new Date().toISOString() }, ...votes];
    setTripCollaboration(tripId, record);
    recordTripActivity(tripId, {
      type: "vote-added",
      authorId: currentUser.id,
      authorName: currentUser.name,
      text: `${currentUser.name} voted for ${item?.title || "a saved place"}.`,
    });
    showToast("Vote added.", "success");
  }
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
  window.addEventListener("trip-collaboration-updated", async (event) => {
    if (!plannerState.currentTripId) return;
    if (!event.detail?.tripId || String(event.detail.tripId) === String(plannerState.currentTripId)) {
      await selectTrip(plannerState.currentTripId);
    }
  });
}
async function initTripPlanner() {
  ensureTripFieldErrors();
  await loadDestinations();
  await initAiPlanner();
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
window.generateAiItinerary = generateAiItinerary;
window.clearAiItinerary = clearAiItinerary;
window.removeItemFromTrip = removeItemFromTrip;
window.recordTripActivity = recordTripActivity;
window.inviteCollaborator = inviteCollaborator;
window.removeCollaborator = removeCollaborator;
window.addTripComment = addTripComment;
window.toggleTripVote = toggleTripVote;
window.openAiPlan = openAiPlan;
window.loadAiPlanForEditing = loadAiPlanForEditing;
window.deleteAiPlan = deleteAiPlan;
document.addEventListener("DOMContentLoaded", initTripPlanner);
