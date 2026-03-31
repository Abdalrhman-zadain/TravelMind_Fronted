const TRIP_LINKS_KEY = "tm_trip_links_v1";
const TRIP_SELECTED_KEY = "tm_selected_trip_id";
const TRIP_CACHE_KEY = "tm_trip_cache_v1";

function safeReadJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (_error) {
    return fallback;
  }
}

function safeWriteJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function getTripLinkMap() {
  return safeReadJson(TRIP_LINKS_KEY, {});
}

function saveTripLinkMap(map) {
  safeWriteJson(TRIP_LINKS_KEY, map);
}

function getTripLinks(tripId) {
  const map = getTripLinkMap();
  return Array.isArray(map[String(tripId)]) ? map[String(tripId)] : [];
}

function setTripLinks(tripId, links) {
  const map = getTripLinkMap();
  map[String(tripId)] = links;
  saveTripLinkMap(map);
  window.dispatchEvent(new CustomEvent("trip-links-updated", { detail: { tripId } }));
}

function addTripLink(tripId, item) {
  const links = getTripLinks(tripId);
  const exists = links.some(
    (entry) => entry.itemType === item.itemType && String(entry.itemId) === String(item.itemId)
  );
  if (exists) return false;
  const user = typeof getUser === "function" ? getUser() : null;
  const addedByName = user?.name || "Traveler";

  links.push({
    id: `link-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    itemType: item.itemType,
    itemId: item.itemId,
    title: item.title,
    location: item.location || "",
    priceLabel: item.priceLabel || "",
    dateLabel: item.dateLabel || "",
    image: item.image || "",
    href: item.href || "",
    addedAt: new Date().toISOString(),
    addedByUserId: user?.id || null,
    addedByName,
  });
  setTripLinks(tripId, links);
  if (typeof window.recordTripActivity === "function") {
    window.recordTripActivity(tripId, {
      type: "item-added",
      authorId: user?.id || null,
      authorName: addedByName,
      text: `${addedByName} added ${item.title} to the trip.`,
    });
  }
  return true;
}

function removeTripLink(tripId, linkId) {
  const links = getTripLinks(tripId).filter((entry) => entry.id !== linkId);
  setTripLinks(tripId, links);
}

function getSelectedTripId() {
  return localStorage.getItem(TRIP_SELECTED_KEY);
}

function setSelectedTripId(tripId) {
  if (tripId == null || tripId === "") {
    localStorage.removeItem(TRIP_SELECTED_KEY);
  } else {
    localStorage.setItem(TRIP_SELECTED_KEY, String(tripId));
  }
  window.dispatchEvent(new CustomEvent("trip-selection-updated", { detail: { tripId } }));
}

async function fetchTripsForSelection() {
  const cached = safeReadJson(TRIP_CACHE_KEY, []);

  if (!window.TripsAPI || typeof TripsAPI.getByUser !== "function" || typeof getUser !== "function") {
    return cached;
  }

  const user = getUser();
  if (!user?.id) return cached;

  try {
    const data = await TripsAPI.getByUser(user.id);
    const trips = Array.isArray(data) ? data : [];
    safeWriteJson(TRIP_CACHE_KEY, trips);
    return trips;
  } catch (_error) {
    return cached;
  }
}

function ensureTripPickerModal() {
  let modal = document.getElementById("trip-picker-modal");
  if (modal) return modal;

  modal = document.createElement("div");
  modal.className = "modal-overlay";
  modal.id = "trip-picker-modal";
  modal.innerHTML = `
    <div class="modal modal-medium trip-picker-modal">
      <div class="modal-header">
        <h3 class="modal-title">Add To Trip</h3>
        <button class="modal-close" type="button" onclick="closeTripPickerModal()">x</button>
      </div>
      <div class="trip-picker-body">
        <p class="trip-picker-text" id="trip-picker-text"></p>
        <div class="input-group">
          <label class="input-label" for="trip-picker-select">Choose Trip</label>
          <select id="trip-picker-select" class="input"></select>
        </div>
        <div class="trip-picker-error hidden" id="trip-picker-error"></div>
        <div class="trip-picker-actions">
          <button class="btn btn-primary" type="button" id="trip-picker-confirm">Add To Trip</button>
          <button class="btn btn-ghost" type="button" onclick="closeTripPickerModal()">Cancel</button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  modal.addEventListener("click", (event) => {
    if (event.target === modal) closeTripPickerModal();
  });
  return modal;
}

let tripPickerPayload = null;

async function promptAddItemToTrip(item) {
  if (typeof isLoggedIn === "function" && !isLoggedIn()) {
    showToast("Please login first to add items to a trip.", "error");
    return;
  }

  const modal = ensureTripPickerModal();
  const text = document.getElementById("trip-picker-text");
  const select = document.getElementById("trip-picker-select");
  const error = document.getElementById("trip-picker-error");
  const confirmBtn = document.getElementById("trip-picker-confirm");
  const trips = await fetchTripsForSelection();

  if (!Array.isArray(trips) || trips.length === 0) {
    showToast("Create a trip first in the Trip Planner.", "info");
    if (typeof location !== "undefined") {
      setTimeout(() => {
        location.href = "trip-planner.html";
      }, 600);
    }
    return;
  }

  tripPickerPayload = item;
  text.textContent = `Add "${item.title}" to one of your saved trips.`;
  error.classList.add("hidden");
  error.textContent = "";

  const selectedId = getSelectedTripId();
  select.innerHTML = trips
    .map((trip) => {
      const selected = String(trip.id) === String(selectedId) ? "selected" : "";
      return `<option value="${trip.id}" ${selected}>${trip.name} - ${trip.destination}</option>`;
    })
    .join("");

  confirmBtn.onclick = () => {
    const tripId = select.value;
    if (!tripId) {
      error.textContent = "Please choose a trip.";
      error.classList.remove("hidden");
      return;
    }

    const added = addTripLink(tripId, item);
    setSelectedTripId(tripId);
    closeTripPickerModal();
    showToast(added ? `${item.title} added to your trip.` : `${item.title} is already in that trip.`, added ? "success" : "info");
  };

  modal.classList.add("open");
}

function closeTripPickerModal() {
  const modal = document.getElementById("trip-picker-modal");
  if (modal) modal.classList.remove("open");
  tripPickerPayload = null;
}

window.getTripLinks = getTripLinks;
window.setTripLinks = setTripLinks;
window.addTripLink = addTripLink;
window.removeTripLink = removeTripLink;
window.getSelectedTripId = getSelectedTripId;
window.setSelectedTripId = setSelectedTripId;
window.fetchTripsForSelection = fetchTripsForSelection;
window.promptAddItemToTrip = promptAddItemToTrip;
window.closeTripPickerModal = closeTripPickerModal;
