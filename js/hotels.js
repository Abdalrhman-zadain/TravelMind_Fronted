// Import hotels from external API and reload
async function fetchExternalHotels() {
  try {
    await api('POST', '/hotels/fetch-external');
    showToast('Hotels imported from external API!', 'success');
    await loadHotels();
  } catch (e) {
    showToast('Failed to import hotels: ' + (e.message || e), 'error');
  }
}
// ═══════════════════════════════════════════════
// HOTELS PAGE LOGIC — FULL-FEATURED
// ═══════════════════════════════════════════════

let allHotels = [];
let filteredHotels = [];
let currentCity = '';
let currentStars = 0;
let currentSort = '';
let currentView = 'grid';
let currentPage = 1;
const PAGE_SIZE = 9;
let compareList = [];
let leafletMap = null;
let mapMarkers = [];
let priceMin = 0;
let priceMax = 500;
let favorites = JSON.parse(localStorage.getItem('tm_hotel_favorites') || '[]');

// ── RENDER STARS ────────────────────────────────
function renderHotelStars(count) {
  return '⭐'.repeat(count || 3);
}

function hashString(value) {
  const s = String(value || '');
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

function pickByKey(list, key) {
  if (!Array.isArray(list) || list.length === 0) return '';
  return list[hashString(key) % list.length];
}

function cityFallbackImage(city, key = '') {
  const c = String(city || '').toLowerCase();
  const stableKey = `${city}-${key || city}`;
  if (c.includes('amman')) return pickByKey([
    'image/city/New_Abdali_2024.png',
    'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=1200&q=80'
  ], stableKey);
  if (c.includes('petra')) return pickByKey([
    'image/city/petra-world-heritage-jordan_16x9.avif',
    'https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=1200&q=80'
  ], stableKey);
  if (c.includes('aqaba')) return pickByKey([
    'image/city/Aqaba_Red_Sea_Jordan_Canva-1.webp',
    'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=1200&q=80'
  ], stableKey);
  if (c.includes('wadi')) return pickByKey([
    'image/city/wadi-rum-bedouin-camp-travel.webp',
    'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&w=1200&q=80'
  ], stableKey);
  if (c.includes('dead sea')) return 'image/city/deadsea.jpg';
  if (c.includes('jerash')) return 'image/city/sites-jerash.jpg';
  return pickByKey([
    'image/city/petra-world-heritage-jordan_16x9.avif',
    'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1200&q=80'
  ], stableKey);
}

// ── HOTEL GALLERY EMOJIS (per star level) ───────
const hotelGallery = {
  5: ['🏨', '🏊', '🍽️', '🧖'],
  4: ['🏨', '🏊', '☕', '🛎️'],
  3: ['🏨', '🛏️', '☕', '🅿️'],
  2: ['🏨', '🛏️', '🚿', '📶'],
  1: ['🏨', '🛏️', '🚿', '🔑'],
};

// ── AMENITIES BY STAR LEVEL ─────────────────────
const amenitiesByStars = {
  5: ['🏊 Pool', '🧖 Spa', '🏋️ Gym', '🍽️ Restaurant', '📶 WiFi', '🅿️ Parking', '🛎️ Room Service', '✈️ Airport Shuttle'],
  4: ['🏊 Pool', '🏋️ Gym', '🍽️ Restaurant', '📶 WiFi', '🅿️ Parking', '🛎️ Room Service', '☕ Breakfast'],
  3: ['📶 WiFi', '🅿️ Parking', '☕ Breakfast', '🛎️ Room Service', '❄️ AC'],
  2: ['📶 WiFi', '☕ Breakfast', '❄️ AC'],
  1: ['📶 WiFi', '❄️ AC'],
};

// ── PRICE VALUE BADGE ───────────────────────────
function getPriceBadge(h) {
  const price = h.pricePerNight || 0;
  const stars = h.stars || 3;
  const ratio = price / stars;
  if (stars >= 4 && ratio <= 30) return { text: '🏆 Best Value', cls: 'badge-value' };
  if (stars >= 4 && price >= 150) return { text: '💎 Luxury Pick', cls: 'badge-luxury' };
  if (price <= 40) return { text: '💰 Budget Friendly', cls: 'badge-budget' };
  return null;
}

// ═════════════════════════════════════════════════
// FAVORITES / WISHLIST
// ═════════════════════════════════════════════════
function isHotelFavorite(id) { return favorites.includes(id); }

function toggleHotelFavorite(e, id) {
  e.stopPropagation();
  if (isHotelFavorite(id)) {
    favorites = favorites.filter(f => f !== id);
    showToast('Removed from wishlist', 'info');
  } else {
    favorites.push(id);
    showToast('Added to wishlist! ❤️', 'success');
  }
  localStorage.setItem('tm_hotel_favorites', JSON.stringify(favorites));
  renderCurrentView();
}

// ═════════════════════════════════════════════════
// RENDER CARD
// ═════════════════════════════════════════════════
function renderCard(h) {
  const desc = h.descriptionEn
    ? h.descriptionEn.substring(0, 90) + '...'
    : 'Comfortable and welcoming stay in Jordan.';
  const badge = getPriceBadge(h);
  const favClass = isHotelFavorite(h.id) ? 'fav-active' : '';
  const isCompared = compareList.includes(h.id);
  const starAmenities = amenitiesByStars[h.stars] || amenitiesByStars[3];
  const imageUrl = h.imageUrl || cityFallbackImage(h.city, h.id || h.nameEn);

  return `
    <div class="hotel-card" onclick="openDetail(${h.id})">
      <div class="hotel-card-image">
        <img class="hotel-photo" src="${imageUrl}" alt="${h.nameEn}" loading="lazy" />
        <div class="hotel-card-stars">${renderHotelStars(h.stars)}</div>
        <div class="hotel-card-city">📍 ${h.city}</div>
        ${badge ? `<div class="hotel-card-badge ${badge.cls}">${badge.text}</div>` : ''}
        <button class="fav-btn ${favClass}" onclick="toggleHotelFavorite(event, ${h.id})" title="Add to Wishlist">
          ${isHotelFavorite(h.id) ? '❤️' : '🤍'}
        </button>
        <label class="compare-checkbox" onclick="event.stopPropagation()">
          <input type="checkbox" ${isCompared ? 'checked' : ''} onchange="toggleCompare(${h.id})"/>
          <span class="compare-label">Compare</span>
        </label>
      </div>
      <div class="hotel-card-body">
        <div class="hotel-card-title">${h.nameEn}</div>
        <div class="hotel-card-title-ar">${h.nameAr || ''}</div>
        <div class="hotel-card-desc">${desc}</div>
        <div class="hotel-card-amenities">
          ${starAmenities.slice(0, 4).map(a => `<span class="amenity-tag">${a}</span>`).join('')}
        </div>
      </div>
      <div class="hotel-card-footer">
        <div class="hotel-card-rating">
          <span class="star">${renderStars(h.rating || 0)}</span>
          ${(h.rating || 0).toFixed(1)}
        </div>
        <div class="hotel-card-price">
          <div class="hotel-card-price-amount">${h.pricePerNight} JOD</div>
          <div class="hotel-card-price-label">per night</div>
        </div>
      </div>
    </div>
  `;
}

// ═════════════════════════════════════════════════
// RENDER + PAGINATION
// ═════════════════════════════════════════════════
function renderHotels(list) {
  filteredHotels = list;
  const count = document.getElementById('results-count');
  count.textContent = `${list.length} hotel${list.length !== 1 ? 's' : ''} found`;

  if (currentView === 'grid') {
    renderGridPage();
  } else {
    renderMap(list);
  }
}

function renderGridPage() {
  const grid = document.getElementById('hotels-grid');
  const totalPages = Math.ceil(filteredHotels.length / PAGE_SIZE);
  currentPage = Math.min(currentPage, totalPages || 1);

  const start = (currentPage - 1) * PAGE_SIZE;
  const pageItems = filteredHotels.slice(start, start + PAGE_SIZE);

  if (filteredHotels.length === 0) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1">
        <div class="empty-state-icon">🏨</div>
        <div class="empty-state-title">No Hotels Found</div>
        <div class="empty-state-desc">Try a different city, star rating, or price range</div>
      </div>`;
    document.getElementById('pagination').innerHTML = '';
    return;
  }

  grid.innerHTML = pageItems.map(renderCard).join('');
  renderPagination(totalPages);
}

function renderPagination(totalPages) {
  const container = document.getElementById('pagination');
  if (totalPages <= 1) { container.innerHTML = ''; return; }

  let html = '';
  html += `<button class="page-btn ${currentPage === 1 ? 'disabled' : ''}" onclick="goToPage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>← Prev</button>`;
  for (let i = 1; i <= totalPages; i++) {
    if (totalPages > 7 && i > 2 && i < totalPages - 1 && Math.abs(i - currentPage) > 1) {
      if (i === 3 || i === totalPages - 2) html += `<span class="page-dots">...</span>`;
      continue;
    }
    html += `<button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="goToPage(${i})">${i}</button>`;
  }
  html += `<button class="page-btn ${currentPage === totalPages ? 'disabled' : ''}" onclick="goToPage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>Next →</button>`;
  container.innerHTML = html;
}

function goToPage(page) {
  const totalPages = Math.ceil(filteredHotels.length / PAGE_SIZE);
  if (page < 1 || page > totalPages) return;
  currentPage = page;
  renderGridPage();
  document.getElementById('hotels-grid').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function renderCurrentView() {
  renderHotels(filteredHotels);
}

// ═════════════════════════════════════════════════
// VIEW TOGGLE (Grid / Map)
// ═════════════════════════════════════════════════
function setView(view) {
  currentView = view;
  document.getElementById('view-grid-btn').classList.toggle('active', view === 'grid');
  document.getElementById('view-map-btn').classList.toggle('active', view === 'map');
  document.getElementById('hotels-grid').classList.toggle('hidden', view === 'map');
  document.getElementById('map-container').classList.toggle('hidden', view === 'grid');
  document.getElementById('pagination').classList.toggle('hidden', view === 'map');

  if (view === 'map') {
    renderMap(filteredHotels);
  } else {
    renderGridPage();
  }
}

function renderMap(list) {
  if (!leafletMap) {
    leafletMap = L.map('hotels-map').setView([31.5, 36.0], 7);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(leafletMap);
  }

  mapMarkers.forEach(m => leafletMap.removeLayer(m));
  mapMarkers = [];

  const bounds = [];
  list.forEach(h => {
    if (h.latitude && h.longitude) {
      const marker = L.marker([h.latitude, h.longitude])
        .addTo(leafletMap)
        .bindPopup(`
                    <strong>${h.nameEn}</strong><br/>
                    ${renderHotelStars(h.stars)}<br/>
                    📍 ${h.city}<br/>
                    💰 ${h.pricePerNight} JOD/night<br/>
                    ⭐ ${(h.rating || 0).toFixed(1)}<br/>
                    <button onclick="openDetail(${h.id})" style="margin-top:6px;padding:4px 12px;background:var(--clay);color:#fff;border:none;border-radius:6px;cursor:pointer">View Details</button>
                `);
      mapMarkers.push(marker);
      bounds.push([h.latitude, h.longitude]);
    }
  });

  if (bounds.length > 0) {
    setTimeout(() => { leafletMap.invalidateSize(); leafletMap.fitBounds(bounds, { padding: [30, 30] }); }, 200);
  } else {
    setTimeout(() => leafletMap.invalidateSize(), 200);
  }
}

// ═════════════════════════════════════════════════
// PRICE RANGE FILTER
// ═════════════════════════════════════════════════
function updatePriceRange() {
  let min = parseInt(document.getElementById('price-min').value);
  let max = parseInt(document.getElementById('price-max').value);
  if (min > max) { const t = min; min = max; max = t; }
  priceMin = min;
  priceMax = max;
  document.getElementById('price-range-display').textContent = `${min} – ${max} JOD`;
  currentPage = 1;
  applyAllFilters();
}

function resetPriceRange() {
  priceMin = 0;
  priceMax = 500;
  document.getElementById('price-min').value = 0;
  document.getElementById('price-max').value = 500;
  document.getElementById('price-range-display').textContent = '0 – 500 JOD';
  currentPage = 1;
  applyAllFilters();
}

// ═════════════════════════════════════════════════
// FILTERS + SORT
// ═════════════════════════════════════════════════
function filterByCity(btn, city) {
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  currentCity = city;
  currentStars = 0;
  currentPage = 1;
  applyAllFilters();
}

function filterByStars(btn, stars) {
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  currentStars = stars;
  currentCity = '';
  currentPage = 1;
  applyAllFilters();
}

function filterBySearch(keyword) {
  currentPage = 1;
  applyAllFilters();
}

function applySort(sortValue) {
  currentSort = sortValue;
  applyAllFilters();
}

function applyAllFilters() {
  const keyword = document.getElementById('search-input').value.toLowerCase();
  let list = [...allHotels];

  if (currentCity) list = list.filter(h => h.city === currentCity);
  if (currentStars) list = list.filter(h => h.stars === currentStars);
  if (keyword) list = list.filter(h =>
    h.nameEn.toLowerCase().includes(keyword) ||
    h.nameAr?.toLowerCase().includes(keyword) ||
    h.city.toLowerCase().includes(keyword)
  );

  // Price range
  list = list.filter(h => {
    const price = h.pricePerNight || 0;
    return price >= priceMin && price <= priceMax;
  });

  // Sort
  switch (currentSort) {
    case 'price-asc': list.sort((a, b) => (a.pricePerNight || 0) - (b.pricePerNight || 0)); break;
    case 'price-desc': list.sort((a, b) => (b.pricePerNight || 0) - (a.pricePerNight || 0)); break;
    case 'rating-desc': list.sort((a, b) => (b.rating || 0) - (a.rating || 0)); break;
    case 'rating-asc': list.sort((a, b) => (a.rating || 0) - (b.rating || 0)); break;
    case 'stars-desc': list.sort((a, b) => (b.stars || 0) - (a.stars || 0)); break;
    case 'stars-asc': list.sort((a, b) => (a.stars || 0) - (b.stars || 0)); break;
    case 'name-asc': list.sort((a, b) => a.nameEn.localeCompare(b.nameEn)); break;
    case 'name-desc': list.sort((a, b) => b.nameEn.localeCompare(a.nameEn)); break;
  }

  renderHotels(list);
}

// ═════════════════════════════════════════════════
// COMPARISON
// ═════════════════════════════════════════════════
function toggleCompare(id) {
  if (compareList.includes(id)) {
    compareList = compareList.filter(c => c !== id);
  } else {
    if (compareList.length >= 3) {
      showToast('You can compare up to 3 hotels', 'error');
      renderCurrentView();
      return;
    }
    compareList.push(id);
  }
  document.getElementById('compare-count').textContent = compareList.length;
  document.getElementById('compare-btn').disabled = compareList.length < 2;
  renderCurrentView();
}

function openCompare() {
  if (compareList.length < 2) return;
  const modal = document.getElementById('compare-modal');
  const content = document.getElementById('compare-content');
  modal.classList.add('open');

  const items = compareList.map(id => allHotels.find(h => h.id === id)).filter(Boolean);

  content.innerHTML = `
    <div class="compare-table">
      <table>
        <thead><tr><th>Feature</th>${items.map(h => `<th>${h.nameEn}</th>`).join('')}</tr></thead>
        <tbody>
          <tr><td>City</td>${items.map(h => `<td>📍 ${h.city}</td>`).join('')}</tr>
          <tr><td>Stars</td>${items.map(h => `<td>${renderHotelStars(h.stars)}</td>`).join('')}</tr>
          <tr><td>Rating</td>${items.map(h => `<td>${renderStars(h.rating || 0)} ${(h.rating || 0).toFixed(1)}</td>`).join('')}</tr>
          <tr><td>Price/Night</td>${items.map(h => `<td><strong>${h.pricePerNight} JOD</strong></td>`).join('')}</tr>
          <tr><td>Phone</td>${items.map(h => `<td>${h.phone || 'N/A'}</td>`).join('')}</tr>
          <tr><td>Website</td>${items.map(h => `<td>${h.website ? '✅' : '❌'}</td>`).join('')}</tr>
          <tr><td>Amenities</td>${items.map(h => {
    const amenities = amenitiesByStars[h.stars] || amenitiesByStars[3];
    return `<td class="compare-amenities">${amenities.join(', ')}</td>`;
  }).join('')}</tr>
          <tr><td>Description</td>${items.map(h => `<td class="compare-desc">${h.descriptionEn ? h.descriptionEn.substring(0, 120) + '...' : 'N/A'}</td>`).join('')}</tr>
          <tr><td>Actions</td>${items.map(h => `<td><button class="btn btn-primary btn-sm" onclick="closeCompare(); openDetail(${h.id})">View Details</button></td>`).join('')}</tr>
        </tbody>
      </table>
    </div>
  `;
}

function closeCompare() {
  document.getElementById('compare-modal').classList.remove('open');
}

document.getElementById('compare-modal').addEventListener('click', function (e) {
  if (e.target === this) closeCompare();
});

// ═════════════════════════════════════════════════
// DETAIL MODAL (Gallery, Reviews, Nearby, Amenities, Share)
// ═════════════════════════════════════════════════
async function openDetail(id) {
  const modal = document.getElementById('detail-modal');
  const content = document.getElementById('modal-content');
  const title = document.getElementById('modal-title');

  modal.classList.add('open');
  content.innerHTML = '<div class="loading"><div class="spinner"></div> Loading...</div>';

  try {
    const h = await HotelsAPI.getById(id);
    title.textContent = h.nameEn;

    const gallery = hotelGallery[h.stars] || hotelGallery[3];
    const amenities = amenitiesByStars[h.stars] || amenitiesByStars[3];
    const badge = getPriceBadge(h);

    content.innerHTML = `
      <!-- IMAGE GALLERY -->
      <div class="gallery-carousel" id="gallery-${h.id}">
        <div class="gallery-main" id="gallery-main-${h.id}" style="background:linear-gradient(135deg,#0891b2,#0e7490)">${gallery[0]}</div>
        <div class="gallery-thumbs">
          ${gallery.map((g, i) => `<button class="gallery-thumb ${i === 0 ? 'active' : ''}" onclick="setHotelGallerySlide(${h.id}, ${i}, ${h.stars})">${g}</button>`).join('')}
        </div>
      </div>

      ${badge ? `<div class="detail-badge ${badge.cls}">${badge.text}</div>` : ''}

      <!-- INFO GRID -->
      <div class="modal-detail-grid">
        <div class="modal-detail-item">
          <div class="modal-detail-item-label">📍 City</div>
          <div class="modal-detail-item-value">${h.city}</div>
        </div>
        <div class="modal-detail-item">
          <div class="modal-detail-item-label">⭐ Stars</div>
          <div class="modal-detail-item-value">${renderHotelStars(h.stars)}</div>
        </div>
        <div class="modal-detail-item">
          <div class="modal-detail-item-label">💰 Price Per Night</div>
          <div class="modal-detail-item-value">${h.pricePerNight} JOD</div>
        </div>
        <div class="modal-detail-item">
          <div class="modal-detail-item-label">⭐ Rating</div>
          <div class="modal-detail-item-value">${renderStars(h.rating || 0)} ${(h.rating || 0).toFixed(1)}</div>
        </div>
        ${h.phone ? `<div class="modal-detail-item"><div class="modal-detail-item-label">📞 Phone</div><div class="modal-detail-item-value">${h.phone}</div></div>` : ''}
        ${h.website ? `<div class="modal-detail-item"><div class="modal-detail-item-label">🌐 Website</div><div class="modal-detail-item-value"><a href="${h.website}" target="_blank" rel="noopener noreferrer" style="color:var(--clay)">Visit Website</a></div></div>` : ''}
      </div>

      <!-- AMENITIES -->
      <div class="amenities-section">
        <h4 class="section-subtitle">🛎️ Amenities</h4>
        <div class="amenities-grid">
          ${amenities.map(a => `<span class="amenity-chip">${a}</span>`).join('')}
        </div>
      </div>

      ${h.descriptionEn ? `
        <div class="modal-detail-item-label" style="margin-bottom:8px">📖 Description</div>
        <div class="modal-detail-desc">${h.descriptionEn}</div>
      ` : ''}

      ${h.descriptionAr ? `
        <div class="modal-detail-item-label" style="margin-bottom:8px; text-align:right">الوصف بالعربية</div>
        <div class="modal-detail-desc-ar">${h.descriptionAr}</div>
      ` : ''}

      <!-- DATE PICKER / COST CALCULATOR -->
      <div class="booking-calculator">
        <h4 class="section-subtitle">📅 Estimate Your Stay</h4>
        <div class="calc-row">
          <div class="calc-field">
            <label>Check-in</label>
            <input type="date" id="checkin-${h.id}" class="input" onchange="calcStayCost(${h.id}, ${h.pricePerNight})" />
          </div>
          <div class="calc-field">
            <label>Check-out</label>
            <input type="date" id="checkout-${h.id}" class="input" onchange="calcStayCost(${h.id}, ${h.pricePerNight})" />
          </div>
          <div class="calc-result" id="calc-result-${h.id}">
            <span class="calc-total">Select dates</span>
          </div>
        </div>
      </div>

      <!-- REVIEWS SECTION -->
      <div class="reviews-section" id="reviews-section-${h.id}">
        <h4 class="section-subtitle">📝 Reviews</h4>
        <div id="reviews-list-${h.id}"><div class="loading"><div class="spinner"></div></div></div>
        ${isLoggedIn() ? `
        <div class="review-form">
          <h5>Leave a Review</h5>
          <div class="review-stars-input" id="review-stars-input-${h.id}">
            ${[1, 2, 3, 4, 5].map(s => `<button class="review-star-btn" onclick="setReviewRating(${h.id}, ${s})">☆</button>`).join('')}
          </div>
          <textarea id="review-text-${h.id}" class="input" rows="3" placeholder="Share your experience..."></textarea>
          <button class="btn btn-primary btn-sm" onclick="submitReview(${h.id})" style="margin-top:8px;">Submit Review</button>
        </div>` : `
        <div class="review-login-prompt"><a href="auth.html">Login</a> to leave a review</div>`}
      </div>

      <!-- NEARBY ATTRACTIONS & RESTAURANTS -->
      <div class="nearby-section">
        <h4 class="section-subtitle">🏛️ Attractions in ${h.city}</h4>
        <div class="nearby-scroll" id="nearby-attractions-${h.id}"><div class="loading"><div class="spinner"></div></div></div>
        <h4 class="section-subtitle" style="margin-top:16px;">🍽️ Restaurants in ${h.city}</h4>
        <div class="nearby-scroll" id="nearby-restaurants-${h.id}"><div class="loading"><div class="spinner"></div></div></div>
      </div>

      <!-- ACTIONS -->
      <div class="modal-actions">
        <button class="btn btn-primary" onclick="openBookingForm(${h.id}, '${h.nameEn.replace(/'/g, "\\'")}', ${h.pricePerNight})">🏨 Book Now</button>
        <button class="btn btn-outline" onclick="toggleHotelFavorite(event, ${h.id})">
          ${isHotelFavorite(h.id) ? '❤️ Wishlisted' : '🤍 Wishlist'}
        </button>
        <button class="btn btn-ghost" onclick="shareHotel(${h.id}, '${h.nameEn.replace(/'/g, "\\'")}')">📤 Share</button>
        <button class="btn btn-outline" onclick="closeModal()">Close</button>
      </div>
    `;

    loadReviews(h.id);
    loadNearbyAttractions(h.id, h.city);
    loadNearbyRestaurants(h.id, h.city);

  } catch (err) {
    content.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">⚠️</div>
        <div class="empty-state-title">Could not load details</div>
      </div>`;
  }
}

// ── Gallery ──────────────────────────────────────
function setHotelGallerySlide(id, index, stars) {
  const gallery = hotelGallery[stars] || hotelGallery[3];
  document.getElementById(`gallery-main-${id}`).textContent = gallery[index];
  document.querySelectorAll(`#gallery-${id} .gallery-thumb`).forEach((t, i) => {
    t.classList.toggle('active', i === index);
  });
}

// ── Date Calculator ──────────────────────────────
function calcStayCost(id, pricePerNight) {
  const checkin = document.getElementById(`checkin-${id}`).value;
  const checkout = document.getElementById(`checkout-${id}`).value;
  const result = document.getElementById(`calc-result-${id}`);

  if (!checkin || !checkout) { result.innerHTML = '<span class="calc-total">Select dates</span>'; return; }

  const d1 = new Date(checkin);
  const d2 = new Date(checkout);
  const nights = Math.ceil((d2 - d1) / (1000 * 60 * 60 * 24));

  if (nights <= 0) {
    result.innerHTML = '<span class="calc-total" style="color:var(--clay)">Check-out must be after check-in</span>';
    return;
  }

  const total = nights * pricePerNight;
  result.innerHTML = `<span class="calc-nights">${nights} night${nights > 1 ? 's' : ''}</span><span class="calc-total">${total} JOD total</span>`;
}

// ═════════════════════════════════════════════════
// REVIEWS
// ═════════════════════════════════════════════════
let reviewRatings = {};

function setReviewRating(hotelId, rating) {
  reviewRatings[hotelId] = rating;
  const container = document.getElementById(`review-stars-input-${hotelId}`);
  if (!container) return;
  container.querySelectorAll('.review-star-btn').forEach((btn, i) => { btn.textContent = i < rating ? '★' : '☆'; });
}

async function loadReviews(hotelId) {
  const container = document.getElementById(`reviews-list-${hotelId}`);
  try {
    const reviews = await ReviewsAPI.getByPlace('Hotel', hotelId);
    const list = Array.isArray(reviews) ? reviews : [];
    if (list.length === 0) { container.innerHTML = '<div class="no-reviews">No reviews yet. Be the first!</div>'; return; }
    container.innerHTML = list.map(r => `
      <div class="review-item">
        <div class="review-item-header">
          <span class="review-item-stars">${renderStars(r.rating || 0)}</span>
          <span class="review-item-date">${r.createdAt ? new Date(r.createdAt).toLocaleDateString() : ''}</span>
        </div>
        <div class="review-item-text">${r.comment || ''}</div>
      </div>
    `).join('');
  } catch (e) {
    container.innerHTML = '<div class="no-reviews">Could not load reviews</div>';
  }
}

async function submitReview(hotelId) {
  const rating = reviewRatings[hotelId] || 0;
  const comment = document.getElementById(`review-text-${hotelId}`)?.value?.trim();
  if (!rating) { showToast('Please select a star rating', 'error'); return; }
  if (!comment) { showToast('Please write a comment', 'error'); return; }

  const user = getUser();
  try {
    await ReviewsAPI.create({
      id: 0, userId: user.id, placeType: 'Hotel', placeId: hotelId,
      rating, comment, createdAt: new Date().toISOString()
    });
    showToast('Review submitted! Thank you 🎉', 'success');
    loadReviews(hotelId);
    document.getElementById(`review-text-${hotelId}`).value = '';
    setReviewRating(hotelId, 0);
  } catch (e) {
    showToast('Could not submit review', 'error');
  }
}

// ═════════════════════════════════════════════════
// NEARBY ATTRACTIONS & RESTAURANTS
// ═════════════════════════════════════════════════
async function loadNearbyAttractions(hotelId, city) {
  const container = document.getElementById(`nearby-attractions-${hotelId}`);
  try {
    const data = await AttractionsAPI.getByCity(city);
    const list = Array.isArray(data) ? data.slice(0, 4) : [];
    if (list.length === 0) { container.innerHTML = '<div class="no-reviews">No attractions found in this city</div>'; return; }
    container.innerHTML = list.map(a => `
      <div class="nearby-card" onclick="location.href='attractions.html?id=${a.id}'">
        <div class="nearby-card-icon">🏛️</div>
        <div class="nearby-card-info">
          <div class="nearby-card-name">${a.nameEn}</div>
          <div class="nearby-card-meta">${a.entryFee > 0 ? a.entryFee + ' JOD' : 'Free'} • ⭐ ${(a.rating || 0).toFixed(1)}</div>
        </div>
      </div>
    `).join('');
  } catch (e) { container.innerHTML = '<div class="no-reviews">Could not load nearby attractions</div>'; }
}

async function loadNearbyRestaurants(hotelId, city) {
  const container = document.getElementById(`nearby-restaurants-${hotelId}`);
  try {
    const data = await RestaurantsAPI.getByCity(city);
    const list = Array.isArray(data) ? data.slice(0, 4) : [];
    if (list.length === 0) { container.innerHTML = '<div class="no-reviews">No restaurants found in this city</div>'; return; }
    container.innerHTML = list.map(r => `
      <div class="nearby-card" onclick="location.href='restaurants.html?id=${r.id}'">
        <div class="nearby-card-icon">🍽️</div>
        <div class="nearby-card-info">
          <div class="nearby-card-name">${r.nameEn}</div>
          <div class="nearby-card-meta">${r.cuisine || 'Restaurant'} • ${r.priceRange || '$$'}</div>
        </div>
      </div>
    `).join('');
  } catch (e) { container.innerHTML = '<div class="no-reviews">Could not load nearby restaurants</div>'; }
}

// ═════════════════════════════════════════════════
// SHARE
// ═════════════════════════════════════════════════
function shareHotel(id, name) {
  const url = `${location.origin}${location.pathname}?id=${id}`;
  if (navigator.clipboard) {
    navigator.clipboard.writeText(`Check out ${name} on TravelMind Jordan! ${url}`)
      .then(() => showToast('Link copied to clipboard! 📋', 'success'))
      .catch(() => showToast('Could not copy link', 'error'));
  } else {
    showToast('Sharing not supported in this browser', 'info');
  }
}

// ═════════════════════════════════════════════════
// BOOKING FORM
// ═════════════════════════════════════════════════
function openBookingForm(hotelId, hotelName, pricePerNight) {
  if (!isLoggedIn()) {
    showToast('Please login first to book a hotel!', 'error');
    setTimeout(() => location.href = 'auth.html', 1500);
    return;
  }

  const modal = document.getElementById('booking-modal');
  const content = document.getElementById('booking-content');
  document.getElementById('booking-modal-title').textContent = `Book ${hotelName}`;

  const user = getUser();
  const today = new Date().toISOString().split('T')[0];

  content.innerHTML = `
    <div class="booking-form">
      <div class="booking-hotel-info">
        <span class="booking-hotel-name">🏨 ${hotelName}</span>
        <span class="booking-hotel-price">${pricePerNight} JOD / night</span>
      </div>

      <div class="input-group">
        <label class="input-label">Full Name</label>
        <input type="text" id="book-name" class="input" value="${user.name || ''}" placeholder="Your full name" />
      </div>

      <div class="input-row">
        <div class="input-group">
          <label class="input-label">Check-in Date</label>
          <input type="date" id="book-checkin" class="input" min="${today}" onchange="updateBookingTotal(${pricePerNight})" />
        </div>
        <div class="input-group">
          <label class="input-label">Check-out Date</label>
          <input type="date" id="book-checkout" class="input" min="${today}" onchange="updateBookingTotal(${pricePerNight})" />
        </div>
      </div>

      <div class="input-group">
        <label class="input-label">Number of Guests</label>
        <select id="book-guests" class="input">
          <option value="1">1 Guest</option>
          <option value="2" selected>2 Guests</option>
          <option value="3">3 Guests</option>
          <option value="4">4 Guests</option>
          <option value="5">5+ Guests</option>
        </select>
      </div>

      <div class="input-group">
        <label class="input-label">Special Requests</label>
        <textarea id="book-requests" class="input" rows="2" placeholder="Any special requests..."></textarea>
      </div>

      <div class="booking-total" id="booking-total">
        <span>Select dates to see total</span>
      </div>

      <div class="modal-actions">
        <button class="btn btn-primary" onclick="submitBooking(${hotelId}, '${hotelName.replace(/'/g, "\\'")}', ${pricePerNight})">✅ Confirm Booking</button>
        <button class="btn btn-outline" onclick="closeBookingModal()">Cancel</button>
      </div>
    </div>
  `;

  modal.classList.add('open');
}

function updateBookingTotal(pricePerNight) {
  const checkin = document.getElementById('book-checkin').value;
  const checkout = document.getElementById('book-checkout').value;
  const container = document.getElementById('booking-total');

  if (!checkin || !checkout) { container.innerHTML = '<span>Select dates to see total</span>'; return; }

  const d1 = new Date(checkin);
  const d2 = new Date(checkout);
  const nights = Math.ceil((d2 - d1) / (1000 * 60 * 60 * 24));

  if (nights <= 0) {
    container.innerHTML = '<span style="color:var(--clay)">Check-out must be after check-in</span>';
    return;
  }

  const total = nights * pricePerNight;
  container.innerHTML = `<span>${nights} night${nights > 1 ? 's' : ''} × ${pricePerNight} JOD = </span><strong>${total} JOD</strong>`;
}

function submitBooking(hotelId, hotelName, pricePerNight) {
  const name = document.getElementById('book-name').value.trim();
  const checkin = document.getElementById('book-checkin').value;
  const checkout = document.getElementById('book-checkout').value;
  const guests = document.getElementById('book-guests').value;

  if (!name) { showToast('Please enter your name', 'error'); return; }
  if (!checkin || !checkout) { showToast('Please select check-in and check-out dates', 'error'); return; }

  const d1 = new Date(checkin);
  const d2 = new Date(checkout);
  const nights = Math.ceil((d2 - d1) / (1000 * 60 * 60 * 24));
  if (nights <= 0) { showToast('Check-out must be after check-in', 'error'); return; }

  const total = nights * pricePerNight;

  closeBookingModal();
  closeModal();
  showToast(`Booking confirmed! ${hotelName} — ${nights} nights, ${total} JOD. 🎉`, 'success');
}

function closeBookingModal() {
  document.getElementById('booking-modal').classList.remove('open');
}

document.getElementById('booking-modal').addEventListener('click', function (e) {
  if (e.target === this) closeBookingModal();
});

// ═════════════════════════════════════════════════
// CLOSE MODAL
// ═════════════════════════════════════════════════
function closeModal() {
  document.getElementById('detail-modal').classList.remove('open');
}

document.getElementById('detail-modal').addEventListener('click', function (e) {
  if (e.target === this) closeModal();
});

// ═════════════════════════════════════════════════
// LOAD + INIT
// ═════════════════════════════════════════════════
async function loadHotels() {
  const grid = document.getElementById('hotels-grid');
  try {
    const data = await HotelsAPI.getAll();
    allHotels = Array.isArray(data) ? data : [];

    // Set price slider max dynamically
    if (allHotels.length > 0) {
      const maxPrice = Math.max(...allHotels.map(h => h.pricePerNight || 0));
      const roundedMax = Math.ceil(maxPrice / 50) * 50;
      document.getElementById('price-max').max = roundedMax;
      document.getElementById('price-max').value = roundedMax;
      document.getElementById('price-min').max = roundedMax;
      priceMax = roundedMax;
      document.getElementById('price-range-display').textContent = `0 – ${roundedMax} JOD`;
    }

    applyAllFilters();
  } catch (e) {
    const details = (e && e.message) ? e.message : 'Unknown error';
    grid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1">
        <div class="empty-state-icon">⚠️</div>
        <div class="empty-state-title">Could not load hotels</div>
        <div class="empty-state-desc">${details}</div>
      </div>`;
    document.getElementById('results-count').textContent = '0 hotels found';
  }
}

function checkUrlParams() {
  const params = new URLSearchParams(window.location.search);
  const city = params.get('city');
  const search = params.get('search');
  const detailId = params.get('id');

  if (city) {
    const btn = Array.from(document.querySelectorAll('.filter-btn'))
      .find(b => b.textContent.includes(city));
    if (btn) filterByCity(btn, city);
    else { currentCity = city; applyAllFilters(); }
  }

  if (search) {
    document.getElementById('search-input').value = search;
    applyAllFilters();
  }

  if (detailId) {
    openDetail(parseInt(detailId));
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  await loadHotels();
  checkUrlParams();
});
