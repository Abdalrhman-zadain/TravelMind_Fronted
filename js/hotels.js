const DEFAULT_CENTER = [31.24, 36.51];
const state = {
  hotels: [],
  filtered: [],
  selectedId: null,
  map: null,
  markers: new Map(),
  maxPrice: 500,
  filtersOpen: false,
  filters: { search: "", city: "", rating: 0, stars: 0, price: 500, sort: "recommended", amenities: [] },
};

const els = {};

function byId(id) { return document.getElementById(id); }
function esc(v) {
  return String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function hash(v) {
  const s = String(v ?? "");
  let h = 0;
  for (let i = 0; i < s.length; i += 1) { h = (h << 5) - h + s.charCodeAt(i); h |= 0; }
  return Math.abs(h);
}
function stars(n) { return "★".repeat(Math.max(0, n || 0)) + "☆".repeat(Math.max(0, 5 - (n || 0))); }
function price(v) { return `${Math.round(Number(v || 0))} JOD`; }
function cityFallback(city) {
  const c = String(city || "").toLowerCase();
  if (c.includes("amman")) return "image/city/New_Abdali_2024.png";
  if (c.includes("petra")) return "image/city/petra-world-heritage-jordan_16x9.avif";
  if (c.includes("aqaba")) return "image/city/Aqaba_Red_Sea_Jordan_Canva-1.webp";
  if (c.includes("dead sea")) return "image/city/deadsea.jpg";
  if (c.includes("wadi")) return "image/city/wadi-rum-bedouin-camp-travel.webp";
  return "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1200&q=80";
}
function normalizeAmenities(v, s) {
  let list = [];
  if (Array.isArray(v)) list = v;
  else if (typeof v === "string" && v.trim()) list = v.split(",").map((x) => x.trim()).filter(Boolean);
  if (list.length) return [...new Set(list)];
  if (s >= 5) return ["WiFi", "Parking", "Pool", "Spa", "Restaurant"];
  if (s >= 4) return ["WiFi", "Parking", "Breakfast", "Gym"];
  return ["WiFi", "Parking", "Air Conditioning"];
}
function normalizeImages(h) {
  const list = [];
  if (Array.isArray(h.images)) list.push(...h.images);
  if (typeof h.images === "string" && h.images.trim()) list.push(...h.images.split(",").map((x) => x.trim()).filter(Boolean));
  if (h.imageUrl) list.unshift(h.imageUrl);
  if (!list.length) list.push(cityFallback(h.city));
  while (list.length < 4) list.push(list[list.length - 1]);
  return list.slice(0, 4);
}
function normalizeHotel(h) {
  const rating = Number(h.rating || 0);
  const starsValue = Number(h.stars || 0);
  return {
    ...h,
    name: h.nameEn || h.name || "Hotel",
    city: h.city || "Jordan",
    country: h.country || "Jordan",
    rating,
    stars: starsValue,
    pricePerNight: Number(h.pricePerNight || 0),
    reviewCount: Number(h.reviewCount || h.reviewsCount || 0) || 25 + (hash(h.id || h.nameEn) % 750),
    latitude: Number.isFinite(Number(h.latitude)) ? Number(h.latitude) : null,
    longitude: Number.isFinite(Number(h.longitude)) ? Number(h.longitude) : null,
    amenities: normalizeAmenities(h.amenities, starsValue),
    images: normalizeImages(h),
    description: h.descriptionEn || `Stay in ${h.city || "Jordan"} with quick access to local attractions and dining.`,
  };
}
function refPoint() {
  if (!state.map) return DEFAULT_CENTER;
  const c = state.map.getCenter();
  return [c.lat, c.lng];
}
function distanceKm(lat1, lon1, lat2, lon2) {
  const r = (d) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = r(lat2 - lat1);
  const dLon = r(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(r(lat1)) * Math.cos(r(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
function hotelDistance(h) {
  if (!h.latitude || !h.longitude) return null;
  const [lat, lng] = refPoint();
  return distanceKm(lat, lng, h.latitude, h.longitude);
}
function selectedHotel() { return state.hotels.find((h) => h.id === state.selectedId) || null; }

function syncInputs() {
  els.search.value = state.filters.search;
  els.city.value = state.filters.city;
  els.rating.value = String(state.filters.rating);
  els.stars.value = String(state.filters.stars);
  els.sort.value = state.filters.sort;
  els.price.value = String(state.filters.price);
  els.priceOut.textContent = `Up to ${price(state.filters.price)}`;
}

function renderAmenityFilters() {
  const counts = new Map();
  state.hotels.forEach((h) => h.amenities.forEach((a) => counts.set(a, (counts.get(a) || 0) + 1)));
  const list = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([name]) => name);
  els.amenities.innerHTML = list.map((a) => `<button class="amenity-filter-pill ${state.filters.amenities.includes(a) ? "active" : ""}" type="button" data-amenity="${esc(a)}">${esc(a)}</button>`).join("");
  els.amenities.querySelectorAll("[data-amenity]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const a = btn.getAttribute("data-amenity");
      state.filters.amenities = state.filters.amenities.includes(a) ? state.filters.amenities.filter((x) => x !== a) : [...state.filters.amenities, a];
      applyFilters();
    });
  });
}

function renderCities() {
  const cities = [...new Set(state.hotels.map((h) => h.city).filter(Boolean))].sort((a, b) => a.localeCompare(b));
  els.city.innerHTML = `<option value="">All destinations</option>${cities.map((c) => `<option value="${esc(c)}">${esc(c)}</option>`).join("")}`;
  els.city.value = state.filters.city;
}

function sortHotels(list) {
  const items = [...list];
  switch (state.filters.sort) {
    case "price-asc": items.sort((a, b) => a.pricePerNight - b.pricePerNight); break;
    case "price-desc": items.sort((a, b) => b.pricePerNight - a.pricePerNight); break;
    case "rating-desc": items.sort((a, b) => b.rating - a.rating || b.stars - a.stars); break;
    case "distance-asc":
      items.sort((a, b) => {
        const da = hotelDistance(a);
        const db = hotelDistance(b);
        if (da == null) return 1;
        if (db == null) return -1;
        return da - db;
      });
      break;
    default:
      items.sort((a, b) => (b.rating * 20 + b.stars * 4 - b.pricePerNight * 0.05) - (a.rating * 20 + a.stars * 4 - a.pricePerNight * 0.05));
      break;
  }
  return items;
}

function applyFilters() {
  const q = state.filters.search.trim().toLowerCase();
  state.filtered = sortHotels(state.hotels.filter((h) => {
    if (state.filters.city && h.city !== state.filters.city) return false;
    if (h.rating < state.filters.rating) return false;
    if (h.stars < state.filters.stars) return false;
    if (h.pricePerNight > state.filters.price) return false;
    if (state.filters.amenities.length && !state.filters.amenities.every((a) => h.amenities.includes(a))) return false;
    if (!q) return true;
    return `${h.name} ${h.city} ${h.country} ${h.description}`.toLowerCase().includes(q);
  }));
  if (!state.filtered.some((h) => h.id === state.selectedId)) state.selectedId = state.filtered[0]?.id || null;
  renderResults();
}

function resultsText() {
  const h = selectedHotel();
  if (!h) {
    els.mapSummary.textContent = "Click a marker or card to focus a hotel.";
    els.resultsSub.textContent = "Map and listings stay in sync.";
    return;
  }
  const dist = hotelDistance(h);
  els.mapSummary.textContent = `${h.name} - ${price(h.pricePerNight)}/night`;
  els.resultsSub.textContent = `${h.city}${dist ? ` - ${dist.toFixed(1)} km from map center` : ""}`;
}

function listCard(h) {
  const dist = hotelDistance(h);
  return `
    <article class="hotel-card ${h.id === state.selectedId ? "active" : ""}" data-hotel-id="${h.id}">
      <div class="hotel-card-media">
        <img class="hotel-card-main-image" src="${esc(h.images[0])}" alt="${esc(h.name)}" loading="lazy" />
        <div class="hotel-card-thumbs">
          ${h.images.slice(1, 4).map((img) => `<img src="${esc(img)}" alt="${esc(h.name)}" loading="lazy" />`).join("")}
        </div>
        <div class="hotel-card-overlay">
          <span class="hotel-chip">${stars(h.stars)}</span>
          <span class="hotel-rating-chip">${h.rating.toFixed(1)} rating</span>
        </div>
        <span class="hotel-price-chip">${price(h.pricePerNight)}</span>
      </div>
      <div class="hotel-card-body">
        <div class="hotel-card-topline">
          <div>
            <h3 class="hotel-card-title">${esc(h.name)}</h3>
            <div class="hotel-card-location">${esc(h.city)}, ${esc(h.country)}</div>
          </div>
          <div class="hotel-card-distance">${dist ? `${dist.toFixed(1)} km away` : "Location pending"}</div>
        </div>
        <div class="hotel-card-reviews"><span>${stars(Math.round(h.rating || 0))}</span><strong>${h.reviewCount}</strong><span>reviews</span></div>
        <div class="hotel-card-amenities">${h.amenities.slice(0, 6).map((a) => `<span class="hotel-amenity-tag">${esc(a)}</span>`).join("")}</div>
        <div class="hotel-card-footer">
          <div class="hotel-card-price-block"><strong>${price(h.pricePerNight)}</strong><span>per night</span></div>
          <div class="hotel-card-actions">
            <button class="btn btn-outline btn-sm" type="button" data-action="details" data-hotel-id="${h.id}">View Details</button>
            <button class="btn btn-primary btn-sm" type="button" data-action="book" data-hotel-id="${h.id}">Book Now</button>
          </div>
        </div>
      </div>
    </article>`;
}

function renderList() {
  if (!state.filtered.length) {
    els.list.innerHTML = `<div class="empty-state"><div><h3>No hotels match these filters</h3><p>Try changing the map area, amenities, or price range.</p></div></div>`;
    return;
  }
  els.list.innerHTML = state.filtered.map(listCard).join("");
  els.list.querySelectorAll(".hotel-card").forEach((card) => {
    const id = Number(card.getAttribute("data-hotel-id"));
    card.addEventListener("click", (e) => {
      if (e.target.closest("[data-action]")) return;
      selectHotel(id, true, false, true);
    });
  });
  els.list.querySelectorAll("[data-action='details']").forEach((btn) => btn.addEventListener("click", (e) => { e.stopPropagation(); openDetail(Number(btn.getAttribute("data-hotel-id"))); }));
  els.list.querySelectorAll("[data-action='book']").forEach((btn) => btn.addEventListener("click", (e) => { e.stopPropagation(); openBookingForm(Number(btn.getAttribute("data-hotel-id"))); }));
}

function markerIcon(h, active) {
  return L.divIcon({
    className: "",
    html: `<div class="hotel-marker ${active ? "active" : ""}"><div class="hotel-marker-badge"><span>${price(h.pricePerNight)}</span><span>${h.rating.toFixed(1)}</span></div><div class="hotel-marker-tail"></div></div>`,
    iconSize: [110, 44],
    iconAnchor: [55, 44],
    popupAnchor: [0, -42],
  });
}

function popupHtml(h) {
  return `<div class="hotel-popup"><h4>${esc(h.name)}</h4><p>${esc(h.city)}, ${esc(h.country)}</p><div class="hotel-popup-meta"><span>${price(h.pricePerNight)}/night</span><span>${h.rating.toFixed(1)} rating</span></div><div style="margin-top:12px;display:flex;gap:8px;"><button class="btn btn-outline btn-sm" type="button" onclick="openDetail(${h.id})">Details</button><button class="btn btn-primary btn-sm" type="button" onclick="addHotelToTrip(${h.id})">Add to Trip</button></div></div>`;
}

function renderMarkers() {
  state.markers.forEach((m) => m.remove());
  state.markers.clear();
  const bounds = [];
  state.filtered.forEach((h) => {
    if (!h.latitude || !h.longitude) return;
    const marker = L.marker([h.latitude, h.longitude], { icon: markerIcon(h, h.id === state.selectedId) }).addTo(state.map);
    marker.bindPopup(popupHtml(h));
    marker.on("click", () => selectHotel(h.id, false, true, true));
    state.markers.set(h.id, marker);
    bounds.push([h.latitude, h.longitude]);
  });
  const selected = selectedHotel();
  if (selected && selected.latitude && selected.longitude) state.map.setView([selected.latitude, selected.longitude], Math.max(state.map.getZoom(), 11));
  else if (bounds.length) state.map.fitBounds(bounds, { padding: [40, 40] });
}

function renderResults() {
  els.resultsCount.textContent = `${state.filtered.length} hotel${state.filtered.length === 1 ? "" : "s"} available`;
  renderList();
  renderMarkers();
  resultsText();
}

function selectHotel(id, centerMap = true, scrollCard = true, openPopup = false) {
  state.selectedId = id;
  renderList();
  resultsText();
  state.markers.forEach((marker, markerId) => {
    const hotel = state.hotels.find((item) => item.id === markerId);
    if (hotel) marker.setIcon(markerIcon(hotel, markerId === id));
  });
  const hotel = selectedHotel();
  const marker = state.markers.get(id);
  if (hotel && marker && centerMap) state.map.setView([hotel.latitude, hotel.longitude], Math.max(state.map.getZoom(), 12), { animate: true });
  if (marker && openPopup) marker.openPopup();
  if (scrollCard) {
    const card = els.list.querySelector(`[data-hotel-id="${id}"]`);
    if (card) card.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
}

function fitMapToResults() {
  const pts = state.filtered.filter((h) => h.latitude && h.longitude).map((h) => [h.latitude, h.longitude]);
  if (!pts.length) { state.map.setView(DEFAULT_CENTER, 7); return; }
  state.map.fitBounds(pts, { padding: [40, 40] });
}

function resetFilters() {
  state.filters = { search: "", city: "", rating: 0, stars: 0, price: state.maxPrice, sort: "recommended", amenities: [] };
  syncInputs();
  renderAmenityFilters();
  applyFilters();
  fitMapToResults();
}

async function fetchExternalHotels() {
  try {
    els.importBtn.disabled = true;
    els.importBtn.textContent = "Importing...";
    await api("POST", "/hotels/fetch-external");
    showToast("Hotels imported from external API.", "success");
    await loadHotels();
  } catch (e) {
    showToast(`Failed to import hotels: ${e.message || e}`, "error");
  } finally {
    els.importBtn.disabled = false;
    els.importBtn.textContent = "Import Hotels from External API";
  }
}

async function loadHotels() {
  els.list.innerHTML = `<div class="loading-state"><div class="spinner"></div><span>Loading hotels...</span></div>`;
  try {
    const data = await HotelsAPI.getAll();
    state.hotels = Array.isArray(data) ? data.map(normalizeHotel) : [];
    state.maxPrice = Math.max(300, ...state.hotels.map((h) => Math.ceil(h.pricePerNight / 25) * 25));
    state.filters.price = state.maxPrice;
    els.price.max = String(state.maxPrice);
    renderCities();
    renderAmenityFilters();
    syncInputs();
    const params = new URLSearchParams(window.location.search);
    if (params.get("city")) state.filters.city = params.get("city");
    if (params.get("search")) state.filters.search = params.get("search");
    syncInputs();
    applyFilters();
    fitMapToResults();
    const id = Number(params.get("id"));
    if (id && state.filtered.some((h) => h.id === id)) selectHotel(id, true, true, true);
    else if (state.filtered[0]) selectHotel(state.filtered[0].id, false, false, false);
  } catch (e) {
    els.list.innerHTML = `<div class="empty-state"><div><h3>Could not load hotels</h3><p>${esc(e.message || "Unknown error")}</p></div></div>`;
    els.resultsCount.textContent = "0 hotels available";
  }
}

async function openDetail(id) {
  try {
    const found = state.hotels.find((item) => String(item.id) === String(id));
    const h = found ? normalizeHotel(found) : null;
    if (!h) {
      showToast("Could not open hotel details right now.", "error");
      return;
    }
    const reviews = typeof loadPlaceReviews === "function" ? await loadPlaceReviews("hotel", id) : [];
    const summary = typeof summarizeReviews === "function"
      ? summarizeReviews(reviews, h.rating, h.reviewCount)
      : { rating: h.rating, count: h.reviewCount };
    h.rating = summary.rating;
    h.reviewCount = summary.count;
    els.modalTitle.textContent = h.name;
    els.modalContent.innerHTML = `
    <div class="hotel-detail">
      <div class="hotel-detail-gallery">
        <div class="hotel-detail-hero"><img src="${esc(h.images[0])}" alt="${esc(h.name)}" /></div>
        <div class="hotel-detail-thumb-grid">${h.images.slice(1, 4).map((img) => `<div class="hotel-detail-thumb"><img src="${esc(img)}" alt="${esc(h.name)}" /></div>`).join("")}</div>
      </div>
      <div class="hotel-detail-summary">
        <h4>${esc(h.name)}</h4>
        <div class="hotel-detail-meta"><span>${esc(h.city)}, ${esc(h.country)}</span><span>${stars(h.stars)}</span><span>${h.rating.toFixed(1)} rating</span><span>${h.reviewCount} reviews</span></div>
        <p class="hotel-detail-description">${esc(h.description)}</p>
      </div>
      <div class="hotel-detail-grid">
        <div class="hotel-detail-stat"><span>Nightly rate</span><strong>${price(h.pricePerNight)}</strong></div>
        <div class="hotel-detail-stat"><span>Class</span><strong>${h.stars || 0} star hotel</strong></div>
        <div class="hotel-detail-stat"><span>Map distance</span><strong>${hotelDistance(h)?.toFixed(1) || "N/A"} km</strong></div>
      </div>
      <div><h4 class="section-subtitle">Amenities</h4><div class="hotel-detail-amenities">${h.amenities.map((a) => `<span class="hotel-amenity-tag">${esc(a)}</span>`).join("")}</div></div>
      <div class="booking-actions">
        <button class="btn btn-outline" type="button" onclick="addHotelToTrip(${h.id})">Add to Trip</button>
        <button class="btn btn-primary" type="button" onclick="openBookingForm(${h.id})">Book Now</button>
        <button class="btn btn-outline" type="button" onclick="focusHotelOnMap(${h.id})">Show On Map</button>
        <button class="btn btn-ghost" type="button" onclick="closeModal()">Close</button>
      </div>
      ${typeof buildReviewSection === "function" ? buildReviewSection({
      placeType: "hotel",
      placeId: h.id,
      reviews,
      summary,
      submitHandler: "submitHotelReview",
      deleteHandler: "deleteHotelReview",
    }) : ""}
    </div>`;
    els.detailModal.classList.add("open");
    try {
      renderResults();
    } catch (renderError) {
      console.error("Failed to refresh hotel list after opening details", renderError);
    }
  } catch (error) {
    console.error("Failed to open hotel details", error);
    showToast("Could not open hotel details right now.", "error");
  }
}
function closeModal() { els.detailModal.classList.remove("open"); }

function formatBookingDate(dateValue) {
  if (!dateValue) return "Not set";
  const date = new Date(dateValue);
  return Number.isNaN(date.getTime()) ? dateValue : date.toLocaleDateString();
}

function renderHotelBookingReceipt(booking) {
  els.bookingContent.innerHTML = `
    <div class="booking-confirmation">
      <div class="booking-confirmation-badge">Confirmed</div>
      <h4>${esc(booking.itemTitle)}</h4>
      <p>Your hotel booking is saved and ready in your account history.</p>
      <div class="booking-receipt-grid">
        <div class="booking-receipt-card"><span>Guest</span><strong>${esc(booking.contact.name)}</strong></div>
        <div class="booking-receipt-card"><span>Dates</span><strong>${formatBookingDate(booking.startDate)} - ${formatBookingDate(booking.endDate)}</strong></div>
        <div class="booking-receipt-card"><span>Guests</span><strong>${booking.guests}</strong></div>
        <div class="booking-receipt-card"><span>Total</span><strong>${price(booking.total)}</strong></div>
      </div>
      <div class="booking-confirmation-actions">
        <button class="btn btn-primary" type="button" onclick="closeBookingModal()">Close</button>
        <a class="btn btn-outline" href="trip-planner.html">Open Trip Planner</a>
      </div>
    </div>`;
}

function openBookingForm(id) {
  const h = state.hotels.find((item) => item.id === id);
  if (!h) return;
  const user = getUser();
  const profile = typeof getBookingProfile === "function" ? getBookingProfile() : {};
  const selectedTripId = typeof getSelectedTripId === "function" ? getSelectedTripId() : "";
  els.bookingTitle.textContent = `Book ${h.name}`;
  els.bookingContent.innerHTML = `
    <form id="booking-form" class="booking-form">
      <div class="booking-summary"><strong>${esc(h.name)}</strong><span>${price(h.pricePerNight)} per night - ${h.rating.toFixed(1)} rating</span></div>
      <label class="hotel-field"><span>Guest name</span><input class="input" id="booking-name" type="text" value="${esc(profile.name || user?.name || "")}" placeholder="Your full name" /></label>
      <div class="booking-grid">
        <label class="hotel-field"><span>Email</span><input class="input" id="booking-email" type="email" value="${esc(profile.email || user?.email || "")}" placeholder="you@example.com" /></label>
        <label class="hotel-field"><span>Phone</span><input class="input" id="booking-phone" type="tel" value="${esc(profile.phone || "")}" placeholder="+962 ..." /></label>
      </div>
      <div class="booking-grid">
        <label class="hotel-field"><span>Check-in</span><input class="input" id="booking-checkin" type="date" /></label>
        <label class="hotel-field"><span>Check-out</span><input class="input" id="booking-checkout" type="date" /></label>
      </div>
      <div class="booking-grid">
        <label class="hotel-field"><span>Guests</span><select id="booking-guests"><option value="1">1 guest</option><option value="2" selected>2 guests</option><option value="3">3 guests</option><option value="4">4 guests</option></select></label>
        <label class="hotel-field"><span>Payment method</span><select id="booking-payment"><option value="Card">Card</option><option value="Cash on arrival">Cash on arrival</option><option value="Bank transfer">Bank transfer</option></select></label>
      </div>
      <label class="hotel-field"><span>Trip link</span><select id="booking-trip"><option value="">No linked trip</option></select></label>
      <label class="hotel-field"><span>Special requests</span><textarea id="booking-requests" rows="2" placeholder="Late check-in, airport pickup..."></textarea></label>
      <div id="booking-total" class="booking-total">Select your dates to calculate the total.</div>
      <div class="booking-actions"><button class="btn btn-primary" type="submit">Confirm Booking</button><button class="btn btn-outline" type="button" onclick="closeBookingModal()">Cancel</button></div>
    </form>`;
  const form = byId("booking-form");
  const checkin = byId("booking-checkin");
  const checkout = byId("booking-checkout");
  const total = byId("booking-total");
  const tripSelect = byId("booking-trip");
  const today = new Date().toISOString().split("T")[0];
  checkin.min = today;
  checkout.min = today;
  if (tripSelect && typeof fetchTripsForSelection === "function") {
    fetchTripsForSelection().then((trips) => {
      if (!Array.isArray(trips) || !trips.length) return;
      tripSelect.innerHTML = `<option value="">No linked trip</option>${trips.map((trip) => `<option value="${esc(trip.id)}" ${String(trip.id) === String(selectedTripId) ? "selected" : ""}>${esc(trip.name)} - ${esc(trip.destination)}</option>`).join("")}`;
    });
  }
  function recalc() {
    if (!checkin.value || !checkout.value) { total.textContent = "Select your dates to calculate the total."; return; }
    const nights = Math.ceil((new Date(checkout.value) - new Date(checkin.value)) / 86400000);
    if (nights <= 0) { total.textContent = "Check-out must be after check-in."; return; }
    total.innerHTML = `${nights} night${nights > 1 ? "s" : ""} x ${price(h.pricePerNight)} = <strong>${price(nights * h.pricePerNight)}</strong>`;
  }
  checkin.addEventListener("input", recalc);
  checkout.addEventListener("input", recalc);
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!byId("booking-name").value.trim()) { showToast("Please enter the guest name.", "error"); return; }
    if (!byId("booking-email").value.trim()) { showToast("Please enter the email address.", "error"); return; }
    if (!checkin.value || !checkout.value) { showToast("Please choose check-in and check-out dates.", "error"); return; }
    const nights = Math.ceil((new Date(checkout.value) - new Date(checkin.value)) / 86400000);
    if (nights <= 0) { showToast("Check-out must be after check-in.", "error"); return; }
    const contact = {
      name: byId("booking-name").value.trim(),
      email: byId("booking-email").value.trim(),
      phone: byId("booking-phone").value.trim(),
    };
    if (typeof saveBookingProfile === "function") saveBookingProfile(contact);
    const booking = typeof saveBookingRecord === "function"
      ? saveBookingRecord({
        type: "hotel",
        userId: user?.id || 0,
        tripId: tripSelect?.value || "",
        itemId: h.id,
        itemTitle: h.name,
        city: h.city,
        startDate: checkin.value,
        endDate: checkout.value,
        guests: Number(byId("booking-guests").value),
        paymentMethod: byId("booking-payment").value,
        total: nights * h.pricePerNight,
        contact,
        notes: byId("booking-requests").value.trim(),
      })
      : null;
    if (booking) renderHotelBookingReceipt(booking);
    showToast(`Booking confirmed for ${h.name}: ${nights} night${nights > 1 ? "s" : ""}, ${price(nights * h.pricePerNight)}.`, "success");
  });
  els.bookingModal.classList.add("open");
}
function closeBookingModal() { els.bookingModal.classList.remove("open"); }
function focusHotelOnMap(id) { closeModal(); closeBookingModal(); selectHotel(id, true, true, true); }
function addHotelToTrip(id) {
  const h = state.hotels.find((item) => item.id === id);
  if (!isLoggedIn()) {
    showToast("Please login first to add this hotel to your trip.", "error");
    return;
  }
  if (!h || typeof promptAddItemToTrip !== "function") {
    showToast("Trip planner is not available right now.", "error");
    return;
  }
  promptAddItemToTrip({
    itemType: "Hotel",
    itemId: h.id,
    title: h.name,
    location: `${h.city}, ${h.country}`,
    priceLabel: `${price(h.pricePerNight)}/night`,
    image: h.images[0],
    href: `hotels.html?id=${h.id}`,
  });
}
async function submitHotelReview(id) {
  if (!isLoggedIn()) {
    showToast("Please login first to leave a review.", "error");
    return;
  }
  const rating = Number(byId("detail-review-rating")?.value || 0);
  const comment = byId("detail-review-comment")?.value.trim() || "";
  if (!rating || !comment) {
    showToast("Please add both a rating and a short review.", "error");
    return;
  }
  const user = getUser();
  await createPlaceReview({
    placeType: "hotel",
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
async function deleteHotelReview(reviewId, placeId) {
  await deletePlaceReview(reviewId);
  showToast("Review deleted.", "info");
  await openDetail(placeId);
}
function toggleFiltersPanel() { state.filtersOpen = !state.filtersOpen; els.filtersPanel.classList.toggle("open", state.filtersOpen); }

function bindEvents() {
  els.importBtn.addEventListener("click", fetchExternalHotels);
  els.mobileFilters.addEventListener("click", toggleFiltersPanel);
  els.resetMap.addEventListener("click", fitMapToResults);
  els.clearFilters.addEventListener("click", resetFilters);
  els.search.addEventListener("input", (e) => { state.filters.search = e.target.value; applyFilters(); });
  els.city.addEventListener("change", (e) => { state.filters.city = e.target.value; applyFilters(); });
  els.rating.addEventListener("change", (e) => { state.filters.rating = Number(e.target.value); applyFilters(); });
  els.stars.addEventListener("change", (e) => { state.filters.stars = Number(e.target.value); applyFilters(); });
  els.sort.addEventListener("change", (e) => { state.filters.sort = e.target.value; applyFilters(); });
  els.price.addEventListener("input", (e) => { state.filters.price = Number(e.target.value); els.priceOut.textContent = `Up to ${price(state.filters.price)}`; applyFilters(); });
  els.detailModal.addEventListener("click", (e) => { if (e.target === els.detailModal) closeModal(); });
  els.bookingModal.addEventListener("click", (e) => { if (e.target === els.bookingModal) closeBookingModal(); });
  window.addEventListener("resize", () => { if (state.map) state.map.invalidateSize(); });
}

function initMap() {
  state.map = L.map("hotels-map").setView(DEFAULT_CENTER, 7);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "&copy; OpenStreetMap contributors" }).addTo(state.map);
  state.map.on("moveend", () => {
    if (!state.filtered.length) return;
    if (state.filters.sort === "distance-asc") applyFilters();
    else { renderList(); resultsText(); }
  });
}

function cacheEls() {
  els.importBtn = byId("import-hotels-btn");
  els.mobileFilters = byId("mobile-filters-toggle");
  els.resetMap = byId("reset-map-view-btn");
  els.search = byId("hotel-search-input");
  els.city = byId("city-filter");
  els.rating = byId("rating-filter");
  els.stars = byId("stars-filter");
  els.sort = byId("sort-filter");
  els.price = byId("price-range");
  els.priceOut = byId("price-range-output");
  els.amenities = byId("amenities-filter");
  els.filtersPanel = byId("hotel-filters-panel");
  els.clearFilters = byId("clear-filters-btn");
  els.resultsCount = byId("results-count");
  els.resultsSub = byId("results-subtitle");
  els.list = byId("hotel-list");
  els.mapSummary = byId("map-selection-summary");
  els.detailModal = byId("detail-modal");
  els.modalTitle = byId("modal-title");
  els.modalContent = byId("modal-content");
  els.bookingModal = byId("booking-modal");
  els.bookingTitle = byId("booking-modal-title");
  els.bookingContent = byId("booking-content");
}

async function initHotelsPage() {
  cacheEls();
  initMap();
  bindEvents();
  await loadHotels();
}

window.fetchExternalHotels = fetchExternalHotels;
window.openDetail = openDetail;
window.closeModal = closeModal;
window.openBookingForm = openBookingForm;
window.closeBookingModal = closeBookingModal;
window.focusHotelOnMap = focusHotelOnMap;
window.addHotelToTrip = addHotelToTrip;
window.submitHotelReview = submitHotelReview;
window.deleteHotelReview = deleteHotelReview;

document.addEventListener("DOMContentLoaded", initHotelsPage);
