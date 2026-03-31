const REST_CENTER = [31.24, 36.51];
const restaurantState = {
  items: [],
  filtered: [],
  selectedId: null,
  map: null,
  markers: new Map(),
  filtersOpen: false,
  filters: { search: "", city: "", cuisine: "", rating: 0, sort: "recommended" },
};

const restaurantEls = {};

function rById(id) { return document.getElementById(id); }
function rEsc(v) {
  return String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;").replace(/'/g, "&#39;");
}
function rStars(n) { return "★".repeat(Math.max(0, Math.round(n || 0))) + "☆".repeat(Math.max(0, 5 - Math.round(n || 0))); }
function rCuisine(item) { return item.cuisine || item.category || "Restaurant"; }
function rPriceLevel(level) {
  const text = String(level || "$$");
  const matches = (text.match(/\$/g) || []).length;
  return matches || 2;
}
function rImage(item) {
  return item.photoUrl || item.photo_url || item.imageUrl || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80";
}
function rHash(v) {
  const s = String(v ?? "");
  let h = 0;
  for (let i = 0; i < s.length; i += 1) { h = (h << 5) - h + s.charCodeAt(i); h |= 0; }
  return Math.abs(h);
}
function normalizeRestaurant(item) {
  return {
    ...item,
    title: item.nameEn || item.name || "Restaurant",
    city: item.city || "Jordan",
    cuisineLabel: rCuisine(item),
    rating: Number(item.rating || 0),
    priceRange: item.priceRange || "$$",
    priceLevel: rPriceLevel(item.priceRange || "$$"),
    latitude: Number.isFinite(Number(item.latitude)) ? Number(item.latitude) : null,
    longitude: Number.isFinite(Number(item.longitude)) ? Number(item.longitude) : null,
    image: rImage(item),
    images: [rImage(item), rImage(item), rImage(item)],
    reviewCount: Number(item.reviewCount || 0) || 20 + (rHash(item.id || item.nameEn) % 600),
    description: item.descriptionEn || "Discover a restaurant with local flavor, strong ratings, and a location synced to the live map.",
  };
}
function rRefPoint() {
  if (!restaurantState.map) return REST_CENTER;
  const c = restaurantState.map.getCenter();
  return [c.lat, c.lng];
}
function rDist(lat1, lon1, lat2, lon2) {
  const r = (d) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = r(lat2 - lat1);
  const dLon = r(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(r(lat1)) * Math.cos(r(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
function restaurantDistance(item) {
  if (!item.latitude || !item.longitude) return null;
  const [lat, lng] = rRefPoint();
  return rDist(lat, lng, item.latitude, item.longitude);
}
function selectedRestaurant() {
  return restaurantState.items.find((item) => item.id === restaurantState.selectedId) || null;
}

function syncRestaurantInputs() {
  restaurantEls.search.value = restaurantState.filters.search;
  restaurantEls.city.value = restaurantState.filters.city;
  restaurantEls.cuisine.value = restaurantState.filters.cuisine;
  restaurantEls.rating.value = String(restaurantState.filters.rating);
  restaurantEls.sort.value = restaurantState.filters.sort;
}

function renderRestaurantCities() {
  const cities = [...new Set(restaurantState.items.map((item) => item.city).filter(Boolean))].sort((a, b) => a.localeCompare(b));
  restaurantEls.city.innerHTML = `<option value="">All destinations</option>${cities.map((city) => `<option value="${rEsc(city)}">${rEsc(city)}</option>`).join("")}`;
  restaurantEls.city.value = restaurantState.filters.city;
}

function renderRestaurantCuisines() {
  const cuisines = [...new Set(restaurantState.items.map((item) => item.cuisineLabel).filter(Boolean))].sort((a, b) => a.localeCompare(b));
  restaurantEls.cuisine.innerHTML = `<option value="">All cuisines</option>${cuisines.map((cuisine) => `<option value="${rEsc(cuisine)}">${rEsc(cuisine)}</option>`).join("")}`;
  restaurantEls.cuisine.value = restaurantState.filters.cuisine;
}

function sortRestaurants(list) {
  const items = [...list];
  switch (restaurantState.filters.sort) {
    case "rating-desc": items.sort((a, b) => b.rating - a.rating); break;
    case "price-asc": items.sort((a, b) => a.priceLevel - b.priceLevel); break;
    case "distance-asc":
      items.sort((a, b) => {
        const da = restaurantDistance(a);
        const db = restaurantDistance(b);
        if (da == null) return 1;
        if (db == null) return -1;
        return da - db;
      });
      break;
    default:
      items.sort((a, b) => (b.rating * 18 - b.priceLevel * 3) - (a.rating * 18 - a.priceLevel * 3));
      break;
  }
  return items;
}

function applyRestaurantFilters() {
  const q = restaurantState.filters.search.trim().toLowerCase();
  restaurantState.filtered = sortRestaurants(restaurantState.items.filter((item) => {
    if (restaurantState.filters.city && item.city !== restaurantState.filters.city) return false;
    if (restaurantState.filters.cuisine && item.cuisineLabel !== restaurantState.filters.cuisine) return false;
    if (item.rating < restaurantState.filters.rating) return false;
    if (!q) return true;
    return `${item.title} ${item.city} ${item.cuisineLabel} ${item.description}`.toLowerCase().includes(q);
  }));
  if (!restaurantState.filtered.some((item) => item.id === restaurantState.selectedId)) restaurantState.selectedId = restaurantState.filtered[0]?.id || null;
  renderRestaurantResults();
}

function updateRestaurantSummary() {
  const item = selectedRestaurant();
  if (!item) {
    restaurantEls.mapSummary.textContent = "Click a marker or card to focus a restaurant.";
    restaurantEls.subtitle.textContent = "Map and listings stay in sync.";
    return;
  }
  const dist = restaurantDistance(item);
  restaurantEls.mapSummary.textContent = `${item.title} - ${item.priceRange}`;
  restaurantEls.subtitle.textContent = `${item.city}${dist ? ` - ${dist.toFixed(1)} km from map center` : ""}`;
}

function restaurantCard(item) {
  const dist = restaurantDistance(item);
  return `
    <article class="restaurant-card ${item.id === restaurantState.selectedId ? "active" : ""}" data-restaurant-id="${item.id}">
      <div class="restaurant-card-media">
        <img class="restaurant-card-main-image" src="${rEsc(item.image)}" alt="${rEsc(item.title)}" />
        <div class="restaurant-card-thumbs">
          ${item.images.slice(1, 4).map((img) => `<img src="${rEsc(img)}" alt="${rEsc(item.title)}" />`).join("")}
        </div>
        <div class="restaurant-card-overlay">
          <span class="restaurant-chip">${rEsc(item.cuisineLabel)}</span>
          <span class="restaurant-badge">${item.rating.toFixed(1)} rating</span>
        </div>
        <span class="restaurant-price-chip">${rEsc(item.priceRange)}</span>
      </div>
      <div class="restaurant-card-body">
        <div class="restaurant-card-topline">
          <div>
            <h3 class="restaurant-card-title">${rEsc(item.title)}</h3>
            <div class="restaurant-card-location">${rEsc(item.city)}</div>
          </div>
          <div class="restaurant-card-distance">${dist ? `${dist.toFixed(1)} km away` : "Location pending"}</div>
        </div>
        <div class="restaurant-card-desc">${rEsc(item.description)}</div>
        <div class="restaurant-card-meta">
          <span class="restaurant-tag">${rEsc(item.cuisineLabel)}</span>
          <span class="restaurant-tag">${item.reviewCount} reviews</span>
          <span class="restaurant-tag">${rStars(item.rating)}</span>
        </div>
        <div class="restaurant-card-footer">
          <div class="restaurant-card-rating">
            <strong>${rEsc(item.priceRange)}</strong>
            <span>price range</span>
          </div>
          <div class="restaurant-card-actions">
            <button class="btn btn-outline btn-sm" type="button" data-action="details" data-restaurant-id="${item.id}">View Details</button>
            <button class="btn btn-primary btn-sm" type="button" data-action="save" data-restaurant-id="${item.id}">Save</button>
          </div>
        </div>
      </div>
    </article>
  `;
}

function renderRestaurantList() {
  if (!restaurantState.filtered.length) {
    restaurantEls.list.innerHTML = `<div class="empty-state"><div><h3>No restaurants match these filters</h3><p>Try changing the city, cuisine, or search term.</p></div></div>`;
    return;
  }
  restaurantEls.list.innerHTML = restaurantState.filtered.map(restaurantCard).join("");
  restaurantEls.list.querySelectorAll(".restaurant-card").forEach((card) => {
    const id = Number(card.getAttribute("data-restaurant-id"));
    card.addEventListener("click", (e) => {
      if (e.target.closest("[data-action]")) return;
      selectRestaurant(id, true, false, true);
    });
  });
  restaurantEls.list.querySelectorAll("[data-action='details']").forEach((btn) => btn.addEventListener("click", (e) => {
    e.stopPropagation();
    openDetail(Number(btn.getAttribute("data-restaurant-id")));
  }));
  restaurantEls.list.querySelectorAll("[data-action='save']").forEach((btn) => btn.addEventListener("click", (e) => {
    e.stopPropagation();
    saveRestaurant(Number(btn.getAttribute("data-restaurant-id")));
  }));
}

function restaurantMarkerIcon(item, active) {
  return L.divIcon({
    className: "",
    html: `<div class="restaurant-marker ${active ? "active" : ""}"><div class="restaurant-marker-badge"><span>${rEsc(item.priceRange)}</span><span>${item.rating.toFixed(1)}</span></div><div class="restaurant-marker-tail"></div></div>`,
    iconSize: [110, 44],
    iconAnchor: [55, 44],
    popupAnchor: [0, -42],
  });
}

function restaurantPopup(item) {
  return `<div class="restaurant-popup"><h4>${rEsc(item.title)}</h4><p>${rEsc(item.city)} - ${rEsc(item.cuisineLabel)}</p><div class="restaurant-popup-meta"><span>${rEsc(item.priceRange)}</span><span>${item.rating.toFixed(1)} rating</span></div><div style="margin-top:12px;display:flex;gap:8px;"><button class="btn btn-outline btn-sm" type="button" onclick="openDetail(${item.id})">Details</button></div></div>`;
}

function renderRestaurantMarkers() {
  restaurantState.markers.forEach((marker) => marker.remove());
  restaurantState.markers.clear();
  const bounds = [];
  restaurantState.filtered.forEach((item) => {
    if (!item.latitude || !item.longitude) return;
    const marker = L.marker([item.latitude, item.longitude], { icon: restaurantMarkerIcon(item, item.id === restaurantState.selectedId) }).addTo(restaurantState.map);
    marker.bindPopup(restaurantPopup(item));
    marker.on("click", () => selectRestaurant(item.id, false, true, true));
    restaurantState.markers.set(item.id, marker);
    bounds.push([item.latitude, item.longitude]);
  });
  const selected = selectedRestaurant();
  if (selected && selected.latitude && selected.longitude) restaurantState.map.setView([selected.latitude, selected.longitude], Math.max(restaurantState.map.getZoom(), 11));
  else if (bounds.length) restaurantState.map.fitBounds(bounds, { padding: [40, 40] });
}

function renderRestaurantResults() {
  restaurantEls.results.textContent = `${restaurantState.filtered.length} restaurant${restaurantState.filtered.length === 1 ? "" : "s"} available`;
  renderRestaurantList();
  renderRestaurantMarkers();
  updateRestaurantSummary();
}

function selectRestaurant(id, centerMap = true, scrollCard = true, openPopup = false) {
  restaurantState.selectedId = id;
  renderRestaurantList();
  updateRestaurantSummary();
  restaurantState.markers.forEach((marker, markerId) => {
    const item = restaurantState.items.find((entry) => entry.id === markerId);
    if (item) marker.setIcon(restaurantMarkerIcon(item, markerId === id));
  });
  const item = selectedRestaurant();
  const marker = restaurantState.markers.get(id);
  if (item && marker && centerMap) restaurantState.map.setView([item.latitude, item.longitude], Math.max(restaurantState.map.getZoom(), 12), { animate: true });
  if (marker && openPopup) marker.openPopup();
  if (scrollCard) {
    const card = restaurantEls.list.querySelector(`[data-restaurant-id="${id}"]`);
    if (card) card.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
}

function fitRestaurantMap() {
  const points = restaurantState.filtered.filter((item) => item.latitude && item.longitude).map((item) => [item.latitude, item.longitude]);
  if (!points.length) { restaurantState.map.setView(REST_CENTER, 7); return; }
  restaurantState.map.fitBounds(points, { padding: [40, 40] });
}

async function openDetail(id) {
  const item = restaurantState.items.find((entry) => entry.id === id) || await RestaurantsAPI.getById(id).then(normalizeRestaurant);
  restaurantEls.modalTitle.textContent = item.title;
  restaurantEls.modalContent.innerHTML = `
    <div class="restaurant-detail">
      <div class="restaurant-detail-gallery">
        <div class="restaurant-detail-hero"><img src="${rEsc(item.image)}" alt="${rEsc(item.title)}" /></div>
        <div class="restaurant-detail-thumb-grid">${item.images.slice(1, 4).map((img) => `<div class="restaurant-detail-thumb"><img src="${rEsc(img)}" alt="${rEsc(item.title)}" /></div>`).join("")}</div>
      </div>
      <div class="restaurant-detail-summary">
        <h4>${rEsc(item.title)}</h4>
        <div class="restaurant-detail-meta"><span>${rEsc(item.city)}</span><span>${rEsc(item.cuisineLabel)}</span><span>${item.rating.toFixed(1)} rating</span><span>${item.reviewCount} reviews</span></div>
        <p class="restaurant-detail-description">${rEsc(item.description)}</p>
      </div>
      <div class="restaurant-detail-grid">
        <div class="restaurant-detail-stat"><span>Price range</span><strong>${rEsc(item.priceRange)}</strong></div>
        <div class="restaurant-detail-stat"><span>Rating</span><strong>${rStars(item.rating)}</strong></div>
        <div class="restaurant-detail-stat"><span>Phone</span><strong>${rEsc(item.phone || "Not listed")}</strong></div>
      </div>
      <div>
        <h4 class="section-subtitle">Highlights</h4>
        <div class="restaurant-detail-tags">
          <span class="restaurant-tag">${rEsc(item.cuisineLabel)}</span>
          <span class="restaurant-tag">${rEsc(item.priceRange)}</span>
          <span class="restaurant-tag">${rEsc(item.city)}</span>
        </div>
      </div>
      <div class="restaurant-card-actions">
        <button class="btn btn-primary" type="button" onclick="saveRestaurant(${item.id})">Save Restaurant</button>
        <button class="btn btn-outline" type="button" onclick="focusRestaurantOnMap(${item.id})">Show On Map</button>
        <button class="btn btn-ghost" type="button" onclick="closeModal()">Close</button>
      </div>
    </div>
  `;
  restaurantEls.modal.classList.add("open");
}

function closeModal() { restaurantEls.modal.classList.remove("open"); }

function saveRestaurant(id) {
  const item = restaurantState.items.find((entry) => entry.id === id);
  if (!isLoggedIn()) {
    showToast("Please login first to save this restaurant.", "error");
    return;
  }
  if (!item || typeof promptAddItemToTrip !== "function") {
    showToast("Trip planner is not available right now.", "error");
    return;
  }
  promptAddItemToTrip({
    itemType: "Restaurant",
    itemId: item.id,
    title: item.title,
    location: item.city,
    priceLabel: item.priceRange,
    image: item.image,
    href: `restaurants.html?id=${item.id}`,
  });
}

function focusRestaurantOnMap(id) {
  closeModal();
  selectRestaurant(id, true, true, true);
}

function toggleRestaurantFilters() {
  restaurantState.filtersOpen = !restaurantState.filtersOpen;
  restaurantEls.filters.classList.toggle("open", restaurantState.filtersOpen);
}

async function loadRestaurants() {
  try {
    const data = await RestaurantsAPI.getAll();
    restaurantState.items = Array.isArray(data) ? data.map(normalizeRestaurant) : [];
    renderRestaurantCities();
    renderRestaurantCuisines();
    syncRestaurantInputs();
    const params = new URLSearchParams(window.location.search);
    if (params.get("city")) restaurantState.filters.city = params.get("city");
    if (params.get("cuisine")) restaurantState.filters.cuisine = params.get("cuisine");
    if (params.get("search")) restaurantState.filters.search = params.get("search");
    syncRestaurantInputs();
    applyRestaurantFilters();
    fitRestaurantMap();
    const id = Number(params.get("id"));
    if (id && restaurantState.filtered.some((item) => item.id === id)) selectRestaurant(id, true, true, true);
    else if (restaurantState.filtered[0]) selectRestaurant(restaurantState.filtered[0].id, false, false, false);
  } catch (e) {
    restaurantEls.list.innerHTML = `<div class="empty-state"><div><h3>Could not load restaurants</h3><p>${rEsc(e.message || "Unknown error")}</p></div></div>`;
    restaurantEls.results.textContent = "0 restaurants available";
  }
}

function bindRestaurantEvents() {
  restaurantEls.mobileFilters.addEventListener("click", toggleRestaurantFilters);
  restaurantEls.resetMap.addEventListener("click", fitRestaurantMap);
  restaurantEls.clear.addEventListener("click", () => {
    restaurantState.filters = { search: "", city: "", cuisine: "", rating: 0, sort: "recommended" };
    syncRestaurantInputs();
    applyRestaurantFilters();
    fitRestaurantMap();
  });
  restaurantEls.search.addEventListener("input", (e) => { restaurantState.filters.search = e.target.value; applyRestaurantFilters(); });
  restaurantEls.city.addEventListener("change", (e) => { restaurantState.filters.city = e.target.value; applyRestaurantFilters(); });
  restaurantEls.cuisine.addEventListener("change", (e) => { restaurantState.filters.cuisine = e.target.value; applyRestaurantFilters(); });
  restaurantEls.rating.addEventListener("change", (e) => { restaurantState.filters.rating = Number(e.target.value); applyRestaurantFilters(); });
  restaurantEls.sort.addEventListener("change", (e) => { restaurantState.filters.sort = e.target.value; applyRestaurantFilters(); });
  restaurantEls.modal.addEventListener("click", (e) => { if (e.target === restaurantEls.modal) closeModal(); });
  window.addEventListener("resize", () => { if (restaurantState.map) restaurantState.map.invalidateSize(); });
}

function initRestaurantMap() {
  restaurantState.map = L.map("restaurants-map").setView(REST_CENTER, 7);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "&copy; OpenStreetMap contributors" }).addTo(restaurantState.map);
  restaurantState.map.on("moveend", () => {
    if (restaurantState.filters.sort === "distance-asc") applyRestaurantFilters();
    else { renderRestaurantList(); updateRestaurantSummary(); }
  });
}

function cacheRestaurantEls() {
  restaurantEls.search = rById("restaurant-search-input");
  restaurantEls.mobileFilters = rById("mobile-filters-toggle");
  restaurantEls.resetMap = rById("reset-map-view-btn");
  restaurantEls.city = rById("city-filter");
  restaurantEls.cuisine = rById("cuisine-filter");
  restaurantEls.rating = rById("rating-filter");
  restaurantEls.sort = rById("sort-filter");
  restaurantEls.filters = rById("filters-panel");
  restaurantEls.clear = rById("clear-filters-btn");
  restaurantEls.results = rById("results-count");
  restaurantEls.subtitle = rById("results-subtitle");
  restaurantEls.mapSummary = rById("map-selection-summary");
  restaurantEls.list = rById("restaurant-list");
  restaurantEls.modal = rById("detail-modal");
  restaurantEls.modalTitle = rById("modal-title");
  restaurantEls.modalContent = rById("modal-content");
}

async function initRestaurantPage() {
  cacheRestaurantEls();
  initRestaurantMap();
  bindRestaurantEvents();
  await loadRestaurants();
}

window.openDetail = openDetail;
window.closeModal = closeModal;
window.saveRestaurant = saveRestaurant;
window.focusRestaurantOnMap = focusRestaurantOnMap;

document.addEventListener("DOMContentLoaded", initRestaurantPage);
