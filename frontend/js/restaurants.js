const REST_CENTER = [31.24, 36.51];
const RESTAURANT_FALLBACK_IMAGES = [
  "image/restaurant in jordan/restaurants in jordan/restaurants  (1).jpg",
  "image/restaurant in jordan/restaurants in jordan/restaurants  (2).jpg",
  "image/restaurant in jordan/restaurants in jordan/restaurants  (3).jpg",
  "image/restaurant in jordan/restaurants in jordan/restaurants  (4).jpg",
  "image/restaurant in jordan/restaurants in jordan/restaurants  (5).jpg",
  "image/restaurant in jordan/restaurants in jordan/restaurants  (6).jpg",
  "image/restaurant in jordan/restaurants in jordan/restaurants  (7).jpg",
  "image/restaurant in jordan/restaurants in jordan/restaurants  (8).jpg",
  "image/restaurant in jordan/restaurants in jordan/restaurants  (9).jpg",
  "image/restaurant in jordan/restaurants in jordan/restaurants  (10).jpg",
  "image/restaurant in jordan/restaurants in jordan/restaurants  (11).jpg",
  "image/restaurant in jordan/restaurants in jordan/restaurants  (12).jpg",
];

const restaurantState = {
  items: [],
  filtered: [],
  currentPage: 1,
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
function rLocalFallbackImage(seed) {
  return RESTAURANT_FALLBACK_IMAGES[rHash(seed) % RESTAURANT_FALLBACK_IMAGES.length];
}
function rPriceLevel(level) {
  const text = String(level || "$$");
  const matches = (text.match(/\$/g) || []).length;
  return matches || 2;
}
function rImage(item) {
  return item.photoUrl || item.photo_url || item.imageUrl || item.image || rLocalFallbackImage(item.id || item.nameEn || item.city || "restaurant");
}
function rImages(item) {
  const list = [];
  if (Array.isArray(item.images)) list.push(...item.images);
  if (typeof item.images === "string" && item.images.trim()) list.push(...item.images.split(",").map((x) => x.trim()).filter(Boolean));
  const primary = rImage(item);
  if (primary) list.unshift(primary);
  return [...new Set(list.filter(Boolean))].slice(0, 4);
}
function rHash(v) {
  const s = String(v ?? "");
  let h = 0;
  for (let i = 0; i < s.length; i += 1) { h = (h << 5) - h + s.charCodeAt(i); h |= 0; }
  return Math.abs(h);
}
function normalizeRestaurant(item) {
  const images = rImages(item);
  return {
    ...item,
    title: item.nameEn || item.name || "Restaurant",
    titleAr: item.nameAr || "",
    city: item.city || "Jordan",
    cuisineLabel: rCuisine(item),
    rating: Number(item.rating || 0),
    priceRange: item.priceRange || "$$",
    priceLevel: rPriceLevel(item.priceRange || "$$"),
    latitude: Number.isFinite(Number(item.latitude)) ? Number(item.latitude) : null,
    longitude: Number.isFinite(Number(item.longitude)) ? Number(item.longitude) : null,
    image: images[0] || rImage(item),
    images,
    reviewCount: Number(item.reviewCount || 0) || 20 + (rHash(item.id || item.nameEn) % 600),
    description: item.descriptionEn || "Discover a restaurant with local flavor, strong ratings, and a location synced to the live map.",
    descriptionAr: item.descriptionAr || "",
  };
}
function restaurantBilingualBlock(item) {
  const englishTitle = item.title || "Restaurant";
  const arabicTitle = item.titleAr || "لا يوجد اسم عربي متاح";
  const englishDescription = item.description || "Description unavailable.";
  const arabicDescription = item.descriptionAr || "لا يوجد وصف عربي متاح حالياً.";

  return `
    <div class="restaurant-bilingual-grid">
      <article class="restaurant-language-card">
        <span class="restaurant-language-label">English</span>
        <h5>${rEsc(englishTitle)}</h5>
        <p>${rEsc(englishDescription)}</p>
      </article>
      <article class="restaurant-language-card restaurant-language-card-ar" dir="rtl">
        <span class="restaurant-language-label">العربية</span>
        <h5>${rEsc(arabicTitle)}</h5>
        <p>${rEsc(arabicDescription)}</p>
      </article>
    </div>
  `;
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

function restaurantPageSize() {
  return 4;
}

function restaurantTotalPages() {
  return Math.max(1, Math.ceil(restaurantState.filtered.length / restaurantPageSize()));
}

function restaurantPageSlice() {
  const size = restaurantPageSize();
  const page = Math.min(Math.max(restaurantState.currentPage, 1), restaurantTotalPages());
  const start = (page - 1) * size;
  return restaurantState.filtered.slice(start, start + size);
}

function restaurantPageForId(id) {
  const index = restaurantState.filtered.findIndex((item) => item.id === id);
  if (index < 0) return 1;
  return Math.floor(index / restaurantPageSize()) + 1;
}

function setRestaurantPage(page, { scroll = false } = {}) {
  const nextPage = Math.min(Math.max(Number(page) || 1, 1), restaurantTotalPages());
  if (nextPage === restaurantState.currentPage) return;
  restaurantState.currentPage = nextPage;
  renderRestaurantResults();
  if (scroll) restaurantEls.resultsPanel?.scrollIntoView({ behavior: "smooth", block: "start" });
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
  restaurantState.currentPage = 1;
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
  const thumbs = item.images.slice(1, 4);
  return `
    <article class="restaurant-card ${item.id === restaurantState.selectedId ? "active" : ""}" data-restaurant-id="${item.id}">
      <div class="restaurant-card-media ${thumbs.length ? "" : "single-image"}">
        <img class="restaurant-card-main-image" src="${rEsc(item.image)}" alt="${rEsc(item.title)}" loading="lazy" onerror="this.onerror=null;this.src='${rEsc(rLocalFallbackImage(item.id || item.title || item.city))}'" />
        ${thumbs.length ? `<div class="restaurant-card-thumbs">
          ${thumbs.map((img) => `<img src="${rEsc(img)}" alt="${rEsc(item.title)}" loading="lazy" onerror="this.onerror=null;this.src='${rEsc(rLocalFallbackImage(`${item.id}-${img}`))}'" />`).join("")}
        </div>` : ""}
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
            ${item.titleAr ? `<div class="restaurant-card-title-ar" dir="rtl">${rEsc(item.titleAr)}</div>` : ""}
            <div class="restaurant-card-location">${rEsc(item.city)}</div>
          </div>
          <div class="restaurant-card-distance">${dist ? `${dist.toFixed(1)} km away` : "Location pending"}</div>
        </div>
        <div class="restaurant-card-desc">${rEsc(item.description)}</div>
        ${item.descriptionAr ? `<div class="restaurant-card-desc restaurant-card-desc-ar" dir="rtl">${rEsc(item.descriptionAr)}</div>` : ""}
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
            <button class="btn btn-primary btn-sm" type="button" data-action="reserve" data-restaurant-id="${item.id}">Reserve</button>
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
  const pageItems = restaurantPageSlice();
  if (!pageItems.length) {
    restaurantEls.list.innerHTML = `<div class="empty-state"><div><h3>No restaurants on this page</h3><p>Try another page or adjust your filters.</p></div></div>`;
    return;
  }
  restaurantEls.list.innerHTML = pageItems.map(restaurantCard).join("");
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
  restaurantEls.list.querySelectorAll("[data-action='reserve']").forEach((btn) => btn.addEventListener("click", (e) => {
    e.stopPropagation();
    openReservationForm(Number(btn.getAttribute("data-restaurant-id")));
  }));
}

function renderRestaurantPagination() {
  if (!restaurantEls.pagination || !restaurantEls.paginationSummary) return;
  const total = restaurantState.filtered.length;
  const totalPages = restaurantTotalPages();
  const currentPage = Math.min(Math.max(restaurantState.currentPage, 1), totalPages);
  const pageSize = restaurantPageSize();
  const start = total === 0 ? 0 : ((currentPage - 1) * pageSize) + 1;
  const end = total === 0 ? 0 : Math.min(currentPage * pageSize, total);

  restaurantEls.paginationSummary.textContent = total === 0
    ? "Showing 0 restaurants"
    : `Showing ${start}-${end} of ${total} restaurants`;

  if (total <= pageSize) {
    restaurantEls.pagination.innerHTML = "";
    return;
  }

  const controls = [];
  const pageWindow = 1;
  controls.push(`<button class="explorer-page-btn" type="button" data-page-action="prev" ${currentPage === 1 ? "disabled" : ""}>Previous</button>`);
  for (let page = Math.max(1, currentPage - pageWindow); page <= Math.min(totalPages, currentPage + pageWindow); page += 1) {
    controls.push(`<button class="explorer-page-btn ${page === currentPage ? "active" : ""}" type="button" data-page="${page}" aria-current="${page === currentPage ? "page" : "false"}">${page}</button>`);
  }
  controls.push(`<button class="explorer-page-btn" type="button" data-page-action="next" ${currentPage === totalPages ? "disabled" : ""}>Next</button>`);
  restaurantEls.pagination.innerHTML = controls.join("");

  restaurantEls.pagination.querySelectorAll("[data-page]").forEach((btn) => {
    btn.addEventListener("click", () => setRestaurantPage(Number(btn.getAttribute("data-page")), { scroll: true }));
  });
  restaurantEls.pagination.querySelectorAll("[data-page-action]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const delta = btn.getAttribute("data-page-action") === "next" ? 1 : -1;
      setRestaurantPage(currentPage + delta, { scroll: true });
    });
  });
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
  renderRestaurantPagination();
  renderRestaurantMarkers();
  updateRestaurantSummary();
}

function selectRestaurant(id, centerMap = true, scrollCard = true, openPopup = false) {
  restaurantState.selectedId = id;
  const selectedPage = restaurantPageForId(id);
  if (selectedPage !== restaurantState.currentPage) restaurantState.currentPage = selectedPage;
  renderRestaurantList();
  renderRestaurantPagination();
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
  try {
    const localItem = restaurantState.items.find((entry) => String(entry.id) === String(id));
    const rawItem = localItem || await RestaurantsAPI.getById(id);
    const item = normalizeRestaurant(rawItem || {});
    if (!Array.isArray(item.images) || !item.images.length) item.images = [item.image];
    if (!item) {
      showToast("Could not open restaurant details right now.", "error");
      return;
    }
    const reviews = typeof loadPlaceReviews === "function" ? await loadPlaceReviews("restaurant", id) : [];
    const summary = typeof summarizeReviews === "function"
      ? summarizeReviews(reviews, item.rating, item.reviewCount)
      : { rating: item.rating, count: item.reviewCount };
    item.rating = summary.rating;
    item.reviewCount = summary.count;
    restaurantEls.modalTitle.textContent = item.titleAr ? `${item.title} / ${item.titleAr}` : item.title;
    const detailThumbs = item.images.slice(1, 4);
    restaurantEls.modalContent.innerHTML = `
    <div class="restaurant-detail">
      <div class="restaurant-detail-gallery ${detailThumbs.length ? "" : "single-image"}">
        <div class="restaurant-detail-hero"><img src="${rEsc(item.image)}" alt="${rEsc(item.title)}" onerror="this.onerror=null;this.src='${rEsc(rLocalFallbackImage(item.id || item.title || item.city))}'" /></div>
        ${detailThumbs.length ? `<div class="restaurant-detail-thumb-grid">${detailThumbs.map((img) => `<div class="restaurant-detail-thumb"><img src="${rEsc(img)}" alt="${rEsc(item.title)}" onerror="this.onerror=null;this.src='${rEsc(rLocalFallbackImage(`${item.id}-${img}`))}'" /></div>`).join("")}</div>` : ""}
      </div>
      <div class="restaurant-detail-summary">
        <h4>${rEsc(item.title)}${item.titleAr ? ` <span class="restaurant-detail-title-divider">/</span> <span class="restaurant-detail-title-ar" dir="rtl">${rEsc(item.titleAr)}</span>` : ""}</h4>
        <div class="restaurant-detail-meta"><span>${rEsc(item.city)}</span><span>${rEsc(item.cuisineLabel)}</span><span>${item.rating.toFixed(1)} rating</span><span>${item.reviewCount} reviews</span></div>
        <p class="restaurant-detail-description">${rEsc(item.description)}</p>
      </div>
      ${restaurantBilingualBlock(item)}
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
        <button class="btn btn-primary" type="button" onclick="openReservationForm(${item.id})">Reserve Table</button>
        <button class="btn btn-outline" type="button" onclick="saveRestaurant(${item.id})">Add to Trip</button>
        <button class="btn btn-outline" type="button" onclick="focusRestaurantOnMap(${item.id})">Show On Map</button>
        <button class="btn btn-ghost" type="button" onclick="closeModal()">Close</button>
      </div>
      ${typeof buildReviewSection === "function" ? buildReviewSection({
      placeType: "restaurant",
      placeId: item.id,
      reviews,
      summary,
      submitHandler: "submitRestaurantReview",
      deleteHandler: "deleteRestaurantReview",
    }) : ""}
    </div>
  `;
    restaurantEls.modal.classList.add("open");
    const existing = restaurantState.items.find((entry) => String(entry.id) === String(id));
    if (existing) {
      existing.rating = summary.rating;
      existing.reviewCount = summary.count;
      try {
        renderRestaurantResults();
      } catch (renderError) {
        console.error("Failed to refresh restaurant list after opening details", renderError);
      }
    }
  } catch (error) {
    console.error("Failed to open restaurant details", error);
    showToast("Could not open restaurant details right now.", "error");
  }
}

function closeModal() { restaurantEls.modal.classList.remove("open"); }

function formatReservationDate(dateValue) {
  if (!dateValue) return "Not set";
  const date = new Date(dateValue);
  return Number.isNaN(date.getTime()) ? dateValue : date.toLocaleDateString();
}

function renderReservationReceipt(booking) {
  restaurantEls.reservationContent.innerHTML = `
    <div class="reservation-confirmation">
      <div class="reservation-confirmation-badge">Confirmed</div>
      <h4>${rEsc(booking.itemTitle)}</h4>
      <p>Your reservation details have been saved to your booking history.</p>
      <div class="reservation-receipt-grid">
        <div class="reservation-receipt-card"><span>Name</span><strong>${rEsc(booking.contact.name)}</strong></div>
        <div class="reservation-receipt-card"><span>Date</span><strong>${formatReservationDate(booking.startDate)}</strong></div>
        <div class="reservation-receipt-card"><span>Time</span><strong>${rEsc(booking.reservationTime)}</strong></div>
        <div class="reservation-receipt-card"><span>Party size</span><strong>${booking.guests}</strong></div>
      </div>
      <div class="reservation-actions">
        <button class="btn btn-primary" type="button" onclick="closeReservationModal()">Close</button>
        <a class="btn btn-outline" href="trip-planner.html">Open Trip Planner</a>
      </div>
    </div>
  `;
}

function openReservationForm(id) {
  const item = restaurantState.items.find((entry) => entry.id === id);
  if (!item) return;
  const user = getUser();
  const profile = typeof getBookingProfile === "function" ? getBookingProfile() : {};
  const selectedTripId = typeof getSelectedTripId === "function" ? getSelectedTripId() : "";
  restaurantEls.reservationTitle.textContent = `Reserve ${item.title}`;
  restaurantEls.reservationContent.innerHTML = `
    <form id="reservation-form" class="reservation-form">
      <div class="reservation-summary">
        <strong>${rEsc(item.title)}</strong>
        <span>${rEsc(item.city)} - ${rEsc(item.cuisineLabel)} - ${rEsc(item.priceRange)}</span>
      </div>
      <div class="reservation-grid">
        <label class="explorer-field"><span class="explorer-field-label">Name</span><input class="reservation-input" id="reservation-name" type="text" value="${rEsc(profile.name || user?.name || "")}" placeholder="Your full name" /></label>
        <label class="explorer-field"><span class="explorer-field-label">Email</span><input class="reservation-input" id="reservation-email" type="email" value="${rEsc(profile.email || user?.email || "")}" placeholder="you@example.com" /></label>
      </div>
      <div class="reservation-grid">
        <label class="explorer-field"><span class="explorer-field-label">Phone</span><input class="reservation-input" id="reservation-phone" type="tel" value="${rEsc(profile.phone || "")}" placeholder="+962 ..." /></label>
        <label class="explorer-field"><span class="explorer-field-label">Party size</span><select id="reservation-guests" class="reservation-input"><option value="2" selected>2 people</option><option value="4">4 people</option><option value="6">6 people</option><option value="8">8 people</option></select></label>
      </div>
      <div class="reservation-grid">
        <label class="explorer-field"><span class="explorer-field-label">Date</span><input class="reservation-input" id="reservation-date" type="date" /></label>
        <label class="explorer-field"><span class="explorer-field-label">Time</span><input class="reservation-input" id="reservation-time" type="time" value="19:00" /></label>
      </div>
      <label class="explorer-field"><span class="explorer-field-label">Trip link</span><select id="reservation-trip" class="reservation-input"><option value="">No linked trip</option></select></label>
      <label class="explorer-field"><span class="explorer-field-label">Special requests</span><textarea id="reservation-notes" class="reservation-input" rows="2" placeholder="Outdoor seating, allergies, celebration note..."></textarea></label>
      <div class="reservation-actions">
        <button class="btn btn-primary" type="submit">Confirm Reservation</button>
        <button class="btn btn-outline" type="button" onclick="closeReservationModal()">Cancel</button>
      </div>
    </form>
  `;
  const tripSelect = rById("reservation-trip");
  if (tripSelect && typeof fetchTripsForSelection === "function") {
    fetchTripsForSelection().then((trips) => {
      if (!Array.isArray(trips) || !trips.length) return;
      tripSelect.innerHTML = `<option value="">No linked trip</option>${trips.map((trip) => `<option value="${rEsc(trip.id)}" ${String(trip.id) === String(selectedTripId) ? "selected" : ""}>${rEsc(trip.name)} - ${rEsc(trip.destination)}</option>`).join("")}`;
    });
  }
  const dateInput = rById("reservation-date");
  dateInput.min = new Date().toISOString().split("T")[0];
  rById("reservation-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const contact = {
      name: rById("reservation-name").value.trim(),
      email: rById("reservation-email").value.trim(),
      phone: rById("reservation-phone").value.trim(),
    };
    if (!contact.name || !contact.email) {
      showToast("Please add your name and email.", "error");
      return;
    }
    if (!rById("reservation-date").value || !rById("reservation-time").value) {
      showToast("Please choose the reservation date and time.", "error");
      return;
    }
    if (typeof saveBookingProfile === "function") saveBookingProfile(contact);
    startCheckoutFlow({
      sourceType: "restaurant",
      itemType: "Restaurant",
      itemId: item.id,
      itemTitle: item.title,
      serviceName: `${item.cuisineLabel} reservation`,
      destination: item.city,
      image: item.image,
      bookingDate: rById("reservation-date").value,
      reservationTime: rById("reservation-time").value,
      travelersCount: Number(rById("reservation-guests").value),
      tripId: tripSelect?.value || "",
      notes: rById("reservation-notes").value.trim(),
      contact,
      priceBreakdown: {
        base: 0,
        taxes: 0,
        fees: 3,
        addOns: 0,
        total: 3,
        currency: "JOD",
      },
    });
  });
  restaurantEls.reservationModal.classList.add("open");
}

function closeReservationModal() {
  restaurantEls.reservationModal.classList.remove("open");
}

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

async function submitRestaurantReview(id) {
  if (!isLoggedIn()) {
    showToast("Please login first to leave a review.", "error");
    return;
  }
  const rating = Number(rById("detail-review-rating")?.value || 0);
  const comment = rById("detail-review-comment")?.value.trim() || "";
  if (!rating || !comment) {
    showToast("Please add both a rating and a short review.", "error");
    return;
  }
  const user = getUser();
  await createPlaceReview({
    placeType: "restaurant",
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

async function deleteRestaurantReview(reviewId, placeId) {
  await deletePlaceReview(reviewId);
  showToast("Review deleted.", "info");
  await openDetail(placeId);
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
  restaurantEls.mobileFilters?.addEventListener("click", toggleRestaurantFilters);
  restaurantEls.resetMap?.addEventListener("click", fitRestaurantMap);
  restaurantEls.clear?.addEventListener("click", () => {
    restaurantState.filters = { search: "", city: "", cuisine: "", rating: 0, sort: "recommended" };
    syncRestaurantInputs();
    applyRestaurantFilters();
    fitRestaurantMap();
  });
  restaurantEls.search?.addEventListener("input", (e) => { restaurantState.filters.search = e.target.value; applyRestaurantFilters(); });
  restaurantEls.city?.addEventListener("change", (e) => { restaurantState.filters.city = e.target.value; applyRestaurantFilters(); });
  restaurantEls.cuisine?.addEventListener("change", (e) => { restaurantState.filters.cuisine = e.target.value; applyRestaurantFilters(); });
  restaurantEls.rating?.addEventListener("change", (e) => { restaurantState.filters.rating = Number(e.target.value); applyRestaurantFilters(); });
  restaurantEls.sort?.addEventListener("change", (e) => { restaurantState.filters.sort = e.target.value; applyRestaurantFilters(); });
  restaurantEls.modal?.addEventListener("click", (e) => { if (e.target === restaurantEls.modal) closeModal(); });
  restaurantEls.reservationModal?.addEventListener("click", (e) => { if (e.target === restaurantEls.reservationModal) closeReservationModal(); });
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
  restaurantEls.resultsPanel = restaurantEls.list?.closest(".explorer-results-card");
  restaurantEls.paginationSummary = rById("pagination-summary");
  restaurantEls.pagination = rById("pagination-controls");
  restaurantEls.modal = rById("detail-modal");
  restaurantEls.modalTitle = rById("modal-title");
  restaurantEls.modalContent = rById("modal-content");
  restaurantEls.reservationModal = rById("reservation-modal");
  restaurantEls.reservationTitle = rById("reservation-modal-title");
  restaurantEls.reservationContent = rById("reservation-content");
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
window.submitRestaurantReview = submitRestaurantReview;
window.deleteRestaurantReview = deleteRestaurantReview;
window.openReservationForm = openReservationForm;
window.closeReservationModal = closeReservationModal;
window.focusRestaurantOnMap = focusRestaurantOnMap;

document.addEventListener("DOMContentLoaded", initRestaurantPage);
