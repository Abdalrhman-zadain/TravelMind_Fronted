const ATTRACTION_CENTER = [31.24, 36.51];
const attractionState = {
  items: [],
  filtered: [],
  selectedId: null,
  map: null,
  markers: new Map(),
  maxFee: 50,
  filtersOpen: false,
  filters: { search: "", city: "", category: "", rating: 0, fee: 50, sort: "recommended" },
};

const attractionEls = {};

function aById(id) { return document.getElementById(id); }
function aEsc(v) {
  return String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function aStars(n) { return "★".repeat(Math.max(0, Math.round(n || 0))) + "☆".repeat(Math.max(0, 5 - Math.round(n || 0))); }
function aFee(v) { return Number(v || 0) <= 0 ? "Free" : `${Math.round(Number(v || 0))} JOD`; }
function aHash(v) {
  const s = String(v ?? "");
  let h = 0;
  for (let i = 0; i < s.length; i += 1) { h = (h << 5) - h + s.charCodeAt(i); h |= 0; }
  return Math.abs(h);
}
function attractionImage(item) {
  return item.photoUrl || item.photo_url || item.imageUrl || cityFallback(item.city);
}
function cityFallback(city) {
  const c = String(city || "").toLowerCase();
  if (c.includes("petra")) return "image/city/petra-world-heritage-jordan_16x9.avif";
  if (c.includes("amman")) return "image/city/New_Abdali_2024.png";
  if (c.includes("wadi")) return "image/city/wadi-rum-bedouin-camp-travel.webp";
  if (c.includes("aqaba")) return "image/city/Aqaba_Red_Sea_Jordan_Canva-1.webp";
  if (c.includes("dead sea")) return "image/city/deadsea.jpg";
  if (c.includes("jerash")) return "image/city/sites-jerash.jpg";
  return "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80";
}
function attractionCategory(item) {
  return item.categoryName || item.category?.name || item.category || "Attraction";
}
function normalizeAttraction(item) {
  return {
    ...item,
    title: item.nameEn || item.name || "Attraction",
    city: item.city || "Jordan",
    categoryLabel: attractionCategory(item),
    rating: Number(item.rating || 0),
    entryFee: Number(item.entryFee || 0),
    latitude: Number.isFinite(Number(item.latitude)) ? Number(item.latitude) : null,
    longitude: Number.isFinite(Number(item.longitude)) ? Number(item.longitude) : null,
    image: attractionImage(item),
    images: [attractionImage(item), attractionImage(item), attractionImage(item)],
    reviewCount: Number(item.reviewCount || 0) || 20 + (aHash(item.id || item.nameEn) % 650),
    description: item.descriptionEn || "Explore one of Jordan's standout destinations with easy access to nearby stays and dining.",
  };
}
function aRefPoint() {
  if (!attractionState.map) return ATTRACTION_CENTER;
  const c = attractionState.map.getCenter();
  return [c.lat, c.lng];
}
function aDist(lat1, lon1, lat2, lon2) {
  const r = (d) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = r(lat2 - lat1);
  const dLon = r(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(r(lat1)) * Math.cos(r(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
function attractionDistance(item) {
  if (!item.latitude || !item.longitude) return null;
  const [lat, lng] = aRefPoint();
  return aDist(lat, lng, item.latitude, item.longitude);
}
function selectedAttraction() {
  return attractionState.items.find((item) => item.id === attractionState.selectedId) || null;
}

function syncAttractionInputs() {
  attractionEls.search.value = attractionState.filters.search;
  attractionEls.city.value = attractionState.filters.city;
  attractionEls.category.value = attractionState.filters.category;
  attractionEls.rating.value = String(attractionState.filters.rating);
  attractionEls.sort.value = attractionState.filters.sort;
  attractionEls.fee.value = String(attractionState.filters.fee);
  attractionEls.feeOut.textContent = `Up to ${aFee(attractionState.filters.fee)}`;
}

function renderAttractionCities() {
  const cities = [...new Set(attractionState.items.map((item) => item.city).filter(Boolean))].sort((a, b) => a.localeCompare(b));
  attractionEls.city.innerHTML = `<option value="">All destinations</option>${cities.map((city) => `<option value="${aEsc(city)}">${aEsc(city)}</option>`).join("")}`;
  attractionEls.city.value = attractionState.filters.city;
}

async function renderAttractionCategories() {
  let categories = [];
  try {
    const data = await CategoriesAPI.getByType("Attraction");
    categories = Array.isArray(data) ? data.map((item) => ({ value: String(item.id), label: item.name })) : [];
  } catch (_e) {
    categories = [...new Set(attractionState.items.map((item) => item.categoryLabel).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b))
      .map((label) => ({ value: label, label }));
  }
  attractionEls.category.innerHTML = `<option value="">All categories</option>${categories.map((item) => `<option value="${aEsc(item.value)}">${aEsc(item.label)}</option>`).join("")}`;
  attractionEls.category.value = attractionState.filters.category;
}

function sortAttractions(list) {
  const items = [...list];
  switch (attractionState.filters.sort) {
    case "rating-desc": items.sort((a, b) => b.rating - a.rating); break;
    case "fee-asc": items.sort((a, b) => a.entryFee - b.entryFee); break;
    case "fee-desc": items.sort((a, b) => b.entryFee - a.entryFee); break;
    case "distance-asc":
      items.sort((a, b) => {
        const da = attractionDistance(a);
        const db = attractionDistance(b);
        if (da == null) return 1;
        if (db == null) return -1;
        return da - db;
      });
      break;
    default:
      items.sort((a, b) => (b.rating * 20 - b.entryFee * 0.2) - (a.rating * 20 - a.entryFee * 0.2));
      break;
  }
  return items;
}

function applyAttractionFilters() {
  const q = attractionState.filters.search.trim().toLowerCase();
  attractionState.filtered = sortAttractions(attractionState.items.filter((item) => {
    if (attractionState.filters.city && item.city !== attractionState.filters.city) return false;
    if (attractionState.filters.category) {
      const direct = String(item.categoryId ?? "") === attractionState.filters.category;
      const label = item.categoryLabel === attractionState.filters.category;
      if (!direct && !label) return false;
    }
    if (item.rating < attractionState.filters.rating) return false;
    if (item.entryFee > attractionState.filters.fee) return false;
    if (!q) return true;
    return `${item.title} ${item.city} ${item.categoryLabel} ${item.description}`.toLowerCase().includes(q);
  }));
  if (!attractionState.filtered.some((item) => item.id === attractionState.selectedId)) attractionState.selectedId = attractionState.filtered[0]?.id || null;
  renderAttractionResults();
}

function updateAttractionSummary() {
  const item = selectedAttraction();
  if (!item) {
    attractionEls.mapSummary.textContent = "Click a marker or card to focus an attraction.";
    attractionEls.subtitle.textContent = "Map and listings stay in sync.";
    return;
  }
  const dist = attractionDistance(item);
  attractionEls.mapSummary.textContent = `${item.title} - ${aFee(item.entryFee)} entry`;
  attractionEls.subtitle.textContent = `${item.city}${dist ? ` - ${dist.toFixed(1)} km from map center` : ""}`;
}

function attractionCard(item) {
  const dist = attractionDistance(item);
  return `
    <article class="attraction-card ${item.id === attractionState.selectedId ? "active" : ""}" data-attraction-id="${item.id}">
      <div class="attraction-card-media">
        <img class="attraction-card-main-image" src="${aEsc(item.image)}" alt="${aEsc(item.title)}" />
        <div class="attraction-card-thumbs">
          ${item.images.slice(1, 4).map((img) => `<img src="${aEsc(img)}" alt="${aEsc(item.title)}" />`).join("")}
        </div>
        <div class="attraction-card-overlay">
          <span class="attraction-chip">${aEsc(item.categoryLabel)}</span>
          <span class="attraction-badge">${item.rating.toFixed(1)} rating</span>
        </div>
        <span class="attraction-chip attraction-price-chip">${aFee(item.entryFee)}</span>
      </div>
      <div class="attraction-card-body">
        <div class="attraction-card-topline">
          <div>
            <h3 class="attraction-card-title">${aEsc(item.title)}</h3>
            <div class="attraction-card-location">${aEsc(item.city)}</div>
          </div>
          <div class="attraction-card-distance">${dist ? `${dist.toFixed(1)} km away` : "Location pending"}</div>
        </div>
        <div class="attraction-card-desc">${aEsc(item.description)}</div>
        <div class="attraction-card-meta">
          <span class="attraction-tag">${aStars(item.rating)}</span>
          <span class="attraction-tag">${item.reviewCount} reviews</span>
          <span class="attraction-tag">${aEsc(item.categoryLabel)}</span>
        </div>
        <div class="attraction-card-footer">
          <div class="attraction-card-price">
            <strong>${aFee(item.entryFee)}</strong>
            <span>${item.entryFee > 0 ? "entry fee" : "free to visit"}</span>
          </div>
          <div class="attraction-card-actions">
            <button class="btn btn-outline btn-sm" type="button" data-action="details" data-attraction-id="${item.id}">View Details</button>
            <button class="btn btn-primary btn-sm" type="button" data-action="trip" data-attraction-id="${item.id}">Add to Trip</button>
          </div>
        </div>
      </div>
    </article>
  `;
}

function renderAttractionList() {
  if (!attractionState.filtered.length) {
    attractionEls.list.innerHTML = `<div class="empty-state"><div><h3>No attractions match these filters</h3><p>Try changing the city, category, or fee range.</p></div></div>`;
    return;
  }
  attractionEls.list.innerHTML = attractionState.filtered.map(attractionCard).join("");
  attractionEls.list.querySelectorAll(".attraction-card").forEach((card) => {
    const id = Number(card.getAttribute("data-attraction-id"));
    card.addEventListener("click", (e) => {
      if (e.target.closest("[data-action]")) return;
      selectAttraction(id, true, false, true);
    });
  });
  attractionEls.list.querySelectorAll("[data-action='details']").forEach((btn) => btn.addEventListener("click", (e) => {
    e.stopPropagation();
    openDetail(Number(btn.getAttribute("data-attraction-id")));
  }));
  attractionEls.list.querySelectorAll("[data-action='trip']").forEach((btn) => btn.addEventListener("click", (e) => {
    e.stopPropagation();
    addToTrip(Number(btn.getAttribute("data-attraction-id")));
  }));
}

function attractionMarkerIcon(item, active) {
  return L.divIcon({
    className: "",
    html: `<div class="attraction-marker ${active ? "active" : ""}"><div class="attraction-marker-badge"><span>${aFee(item.entryFee)}</span><span>${item.rating.toFixed(1)}</span></div><div class="attraction-marker-tail"></div></div>`,
    iconSize: [110, 44],
    iconAnchor: [55, 44],
    popupAnchor: [0, -42],
  });
}

function attractionPopup(item) {
  return `<div class="attraction-popup"><h4>${aEsc(item.title)}</h4><p>${aEsc(item.city)} - ${aEsc(item.categoryLabel)}</p><div class="attraction-popup-meta"><span>${aFee(item.entryFee)}</span><span>${item.rating.toFixed(1)} rating</span></div><div style="margin-top:12px;display:flex;gap:8px;"><button class="btn btn-outline btn-sm" type="button" onclick="openDetail(${item.id})">Details</button></div></div>`;
}

function renderAttractionMarkers() {
  attractionState.markers.forEach((marker) => marker.remove());
  attractionState.markers.clear();
  const bounds = [];
  attractionState.filtered.forEach((item) => {
    if (!item.latitude || !item.longitude) return;
    const marker = L.marker([item.latitude, item.longitude], { icon: attractionMarkerIcon(item, item.id === attractionState.selectedId) }).addTo(attractionState.map);
    marker.bindPopup(attractionPopup(item));
    marker.on("click", () => selectAttraction(item.id, false, true, true));
    attractionState.markers.set(item.id, marker);
    bounds.push([item.latitude, item.longitude]);
  });
  const selected = selectedAttraction();
  if (selected && selected.latitude && selected.longitude) attractionState.map.setView([selected.latitude, selected.longitude], Math.max(attractionState.map.getZoom(), 11));
  else if (bounds.length) attractionState.map.fitBounds(bounds, { padding: [40, 40] });
}

function renderAttractionResults() {
  attractionEls.results.textContent = `${attractionState.filtered.length} attraction${attractionState.filtered.length === 1 ? "" : "s"} available`;
  renderAttractionList();
  renderAttractionMarkers();
  updateAttractionSummary();
}

function selectAttraction(id, centerMap = true, scrollCard = true, openPopup = false) {
  attractionState.selectedId = id;
  renderAttractionList();
  updateAttractionSummary();
  attractionState.markers.forEach((marker, markerId) => {
    const item = attractionState.items.find((entry) => entry.id === markerId);
    if (item) marker.setIcon(attractionMarkerIcon(item, markerId === id));
  });
  const item = selectedAttraction();
  const marker = attractionState.markers.get(id);
  if (item && marker && centerMap) attractionState.map.setView([item.latitude, item.longitude], Math.max(attractionState.map.getZoom(), 12), { animate: true });
  if (marker && openPopup) marker.openPopup();
  if (scrollCard) {
    const card = attractionEls.list.querySelector(`[data-attraction-id="${id}"]`);
    if (card) card.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
}

function fitAttractionMap() {
  const points = attractionState.filtered.filter((item) => item.latitude && item.longitude).map((item) => [item.latitude, item.longitude]);
  if (!points.length) { attractionState.map.setView(ATTRACTION_CENTER, 7); return; }
  attractionState.map.fitBounds(points, { padding: [40, 40] });
}

async function openDetail(id) {
  try {
    const localItem = attractionState.items.find((entry) => String(entry.id) === String(id));
    const rawItem = localItem || await AttractionsAPI.getById(id);
    const item = normalizeAttraction(rawItem || {});
    if (!Array.isArray(item.images) || !item.images.length) {
      item.images = [item.image, item.image, item.image];
    }
    if (!item) {
      showToast("Could not open attraction details right now.", "error");
      return;
    }
    const reviews = typeof loadPlaceReviews === "function" ? await loadPlaceReviews("attraction", id) : [];
    const summary = typeof summarizeReviews === "function"
      ? summarizeReviews(reviews, item.rating, item.reviewCount)
      : { rating: item.rating, count: item.reviewCount };
    item.rating = summary.rating;
    item.reviewCount = summary.count;
    attractionEls.modalTitle.textContent = item.title;
    attractionEls.modalContent.innerHTML = `
    <div class="attraction-detail">
      <div class="attraction-detail-gallery">
        <div class="attraction-detail-hero"><img src="${aEsc(item.image)}" alt="${aEsc(item.title)}" /></div>
        <div class="attraction-detail-thumb-grid">${item.images.slice(1, 4).map((img) => `<div class="attraction-detail-thumb"><img src="${aEsc(img)}" alt="${aEsc(item.title)}" /></div>`).join("")}</div>
      </div>
      <div class="attraction-detail-summary">
        <h4>${aEsc(item.title)}</h4>
        <div class="attraction-detail-meta"><span>${aEsc(item.city)}</span><span>${aEsc(item.categoryLabel)}</span><span>${item.rating.toFixed(1)} rating</span><span>${item.reviewCount} reviews</span></div>
        <p class="attraction-detail-description">${aEsc(item.description)}</p>
      </div>
      <div class="attraction-detail-grid">
        <div class="attraction-detail-stat"><span>Entry fee</span><strong>${aFee(item.entryFee)}</strong></div>
        <div class="attraction-detail-stat"><span>Rating</span><strong>${aStars(item.rating)}</strong></div>
        <div class="attraction-detail-stat"><span>Coordinates</span><strong>${item.latitude && item.longitude ? `${item.latitude.toFixed(3)}, ${item.longitude.toFixed(3)}` : "N/A"}</strong></div>
      </div>
      <div>
        <h4 class="section-subtitle">Highlights</h4>
        <div class="attraction-detail-tags">
          <span class="attraction-tag">${aEsc(item.categoryLabel)}</span>
          <span class="attraction-tag">${aFee(item.entryFee)}</span>
          <span class="attraction-tag">${aEsc(item.city)}</span>
        </div>
      </div>
      <div class="attraction-card-actions">
        <button class="btn btn-primary" type="button" onclick="addToTrip(${item.id})">Add to Trip</button>
        <button class="btn btn-outline" type="button" onclick="focusAttractionOnMap(${item.id})">Show On Map</button>
        <button class="btn btn-ghost" type="button" onclick="closeModal()">Close</button>
      </div>
      ${typeof buildReviewSection === "function" ? buildReviewSection({
      placeType: "attraction",
      placeId: item.id,
      reviews,
      summary,
      submitHandler: "submitAttractionReview",
      deleteHandler: "deleteAttractionReview",
    }) : ""}
    </div>
  `;
    attractionEls.modal.classList.add("open");
    const existing = attractionState.items.find((entry) => String(entry.id) === String(id));
    if (existing) {
      existing.rating = summary.rating;
      existing.reviewCount = summary.count;
      try {
        renderAttractionResults();
      } catch (renderError) {
        console.error("Failed to refresh attraction list after opening details", renderError);
      }
    }
  } catch (error) {
    console.error("Failed to open attraction details", error);
    showToast("Could not open attraction details right now.", "error");
  }
}

function closeModal() { attractionEls.modal.classList.remove("open"); }

function addToTrip(id) {
  const item = attractionState.items.find((entry) => entry.id === id);
  if (!isLoggedIn()) {
    showToast("Please login first to add this to your trip.", "error");
    return;
  }
  if (!item || typeof promptAddItemToTrip !== "function") {
    showToast("Trip planner is not available right now.", "error");
    return;
  }
  promptAddItemToTrip({
    itemType: "Attraction",
    itemId: item.id,
    title: item.title,
    location: item.city,
    priceLabel: aFee(item.entryFee),
    image: item.image,
    href: `attractions.html?id=${item.id}`,
  });
}

async function submitAttractionReview(id) {
  if (!isLoggedIn()) {
    showToast("Please login first to leave a review.", "error");
    return;
  }
  const rating = Number(aById("detail-review-rating")?.value || 0);
  const comment = aById("detail-review-comment")?.value.trim() || "";
  if (!rating || !comment) {
    showToast("Please add both a rating and a short review.", "error");
    return;
  }
  const user = getUser();
  await createPlaceReview({
    placeType: "attraction",
    placeId: id,
    userId: user?.id || 0,
    userName: user?.name || "Traveler",
    rating,
    comment,
    createdAt: new Date().toISOString(),
  });
  showToast("Review submitted.", "success");
  await openDetail(id);
}

async function deleteAttractionReview(reviewId, placeId) {
  await deletePlaceReview(reviewId);
  showToast("Review deleted.", "info");
  await openDetail(placeId);
}

function focusAttractionOnMap(id) {
  closeModal();
  selectAttraction(id, true, true, true);
}

function toggleAttractionFilters() {
  attractionState.filtersOpen = !attractionState.filtersOpen;
  attractionEls.filters.classList.toggle("open", attractionState.filtersOpen);
}

async function loadAttractions() {
  try {
    const data = await AttractionsAPI.getAll();
    attractionState.items = Array.isArray(data) ? data.map(normalizeAttraction) : [];
    attractionState.maxFee = Math.max(25, ...attractionState.items.map((item) => Math.ceil(item.entryFee / 5) * 5));
    attractionState.filters.fee = attractionState.maxFee;
    attractionEls.fee.max = String(attractionState.maxFee);
    renderAttractionCities();
    await renderAttractionCategories();
    syncAttractionInputs();
    const params = new URLSearchParams(window.location.search);
    if (params.get("city")) attractionState.filters.city = params.get("city");
    if (params.get("search")) attractionState.filters.search = params.get("search");
    if (params.get("category")) attractionState.filters.category = params.get("category");
    syncAttractionInputs();
    applyAttractionFilters();
    fitAttractionMap();
    const id = Number(params.get("id"));
    if (id && attractionState.filtered.some((item) => item.id === id)) selectAttraction(id, true, true, true);
    else if (attractionState.filtered[0]) selectAttraction(attractionState.filtered[0].id, false, false, false);
  } catch (e) {
    attractionEls.list.innerHTML = `<div class="empty-state"><div><h3>Could not load attractions</h3><p>${aEsc(e.message || "Unknown error")}</p></div></div>`;
    attractionEls.results.textContent = "0 attractions available";
  }
}

function bindAttractionEvents() {
  if (attractionEls.mobileFilters) attractionEls.mobileFilters.addEventListener("click", toggleAttractionFilters);
  if (attractionEls.resetMap) attractionEls.resetMap.addEventListener("click", fitAttractionMap);
  if (attractionEls.clear) attractionEls.clear.addEventListener("click", () => {
    attractionState.filters = { search: "", city: "", category: "", rating: 0, fee: attractionState.maxFee, sort: "recommended" };
    syncAttractionInputs();
    applyAttractionFilters();
    fitAttractionMap();
  });
  if (attractionEls.search) attractionEls.search.addEventListener("input", (e) => { attractionState.filters.search = e.target.value; applyAttractionFilters(); });
  if (attractionEls.city) attractionEls.city.addEventListener("change", (e) => { attractionState.filters.city = e.target.value; applyAttractionFilters(); });
  if (attractionEls.category) attractionEls.category.addEventListener("change", (e) => { attractionState.filters.category = e.target.value; applyAttractionFilters(); });
  if (attractionEls.rating) attractionEls.rating.addEventListener("change", (e) => { attractionState.filters.rating = Number(e.target.value); applyAttractionFilters(); });
  if (attractionEls.sort) attractionEls.sort.addEventListener("change", (e) => { attractionState.filters.sort = e.target.value; applyAttractionFilters(); });
  if (attractionEls.fee) attractionEls.fee.addEventListener("input", (e) => { attractionState.filters.fee = Number(e.target.value); attractionEls.feeOut.textContent = `Up to ${aFee(attractionState.filters.fee)}`; applyAttractionFilters(); });
  if (attractionEls.modal) attractionEls.modal.addEventListener("click", (e) => { if (e.target === attractionEls.modal) closeModal(); });
  window.addEventListener("resize", () => { if (attractionState.map) attractionState.map.invalidateSize(); });
}

function initAttractionMap() {
  attractionState.map = L.map("attractions-map").setView(ATTRACTION_CENTER, 7);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "&copy; OpenStreetMap contributors" }).addTo(attractionState.map);
  attractionState.map.on("moveend", () => {
    if (attractionState.filters.sort === "distance-asc") applyAttractionFilters();
    else { renderAttractionList(); updateAttractionSummary(); }
  });
}

function cacheAttractionEls() {
  attractionEls.search = aById("attraction-search-input");
  attractionEls.mobileFilters = aById("mobile-filters-toggle");
  attractionEls.resetMap = aById("reset-map-view-btn");
  attractionEls.city = aById("city-filter");
  attractionEls.category = aById("category-filter");
  attractionEls.rating = aById("rating-filter");
  attractionEls.sort = aById("sort-filter");
  attractionEls.fee = aById("fee-range");
  attractionEls.feeOut = aById("fee-range-output");
  attractionEls.filters = aById("filters-panel");
  attractionEls.clear = aById("clear-filters-btn");
  attractionEls.results = aById("results-count");
  attractionEls.subtitle = aById("results-subtitle");
  attractionEls.mapSummary = aById("map-selection-summary");
  attractionEls.list = aById("attraction-list");
  attractionEls.modal = aById("detail-modal");
  attractionEls.modalTitle = aById("modal-title");
  attractionEls.modalContent = aById("modal-content");
}

async function initAttractionPage() {
  cacheAttractionEls();
  initAttractionMap();
  bindAttractionEvents();
  await loadAttractions();
}

window.openDetail = openDetail;
window.closeModal = closeModal;
window.addToTrip = addToTrip;
window.submitAttractionReview = submitAttractionReview;
window.deleteAttractionReview = deleteAttractionReview;
window.focusAttractionOnMap = focusAttractionOnMap;

document.addEventListener("DOMContentLoaded", initAttractionPage);
