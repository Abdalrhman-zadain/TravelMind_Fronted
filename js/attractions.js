// ═══════════════════════════════════════════════
// ATTRACTIONS PAGE LOGIC — FULL-FEATURED
// ═══════════════════════════════════════════════

let allAttractions = [];
let filteredAttractions = [];
let currentCity = '';
let currentCategory = '';
let currentSort = '';
let currentView = 'grid';
let currentPage = 1;
const PAGE_SIZE = 9;
let compareList = [];
let leafletMap = null;
let mapMarkers = [];
let favorites = JSON.parse(localStorage.getItem('tm_favorites') || '[]');

// ── CITY EMOJI MAP ──────────────────────────────
const cityEmojis = {
  'Petra': '🏛️', 'Amman': '🏙️', 'Wadi Rum': '🏜️',
  'Aqaba': '🌊', 'Dead Sea': '🧂', 'Jerash': '🏟️',
};
function getCityEmoji(city) { return cityEmojis[city] || '📍'; }

// ── GALLERY IMAGES (per city — placeholder system) ──
const cityGallery = {
  'Petra': ['🏛️', '🌄', '🏜️', '🐪'],
  'Amman': ['🏙️', '🕌', '🏟️', '🏢'],
  'Wadi Rum': ['🏜️', '⛺', '🌅', '🐪'],
  'Aqaba': ['🌊', '🐠', '🚤', '🏖️'],
  'Dead Sea': ['🧂', '🌊', '🧖', '🏞️'],
  'Jerash': ['🏟️', '🏛️', '🪨', '📜'],
};

// ── VISITOR TIPS (per city) ──────────────────────
const visitorTips = {
  'Petra': {
    bestTime: 'March–May or Sept–Nov (cooler weather)',
    duration: '1–2 full days recommended',
    dressCode: 'Comfortable walking shoes, hat, sunscreen',
    accessibility: 'Some areas require moderate hiking',
    proTips: ['Start early morning to avoid crowds', 'Bring plenty of water (2L+)', 'The Monastery is less crowded than the Treasury', 'Night tours available certain evenings']
  },
  'Amman': {
    bestTime: 'April–May or October (pleasant temperatures)',
    duration: '2–3 hours per attraction',
    dressCode: 'Casual, modest clothing for mosques',
    accessibility: 'Most city attractions are accessible',
    proTips: ['Visit the Citadel at sunset for best views', 'Rainbow Street has great cafes', 'Try knafeh at Habibah downtown', 'Friday is the weekend — some places may be closed']
  },
  'Wadi Rum': {
    bestTime: 'March–May or Sept–Nov (avoid summer heat)',
    duration: 'At least 1 overnight stay',
    dressCode: 'Layers — hot days, cold nights',
    accessibility: 'Requires 4x4 vehicle for most sites',
    proTips: ['Book a Bedouin camp for stargazing', 'Sunrise jeep tours are unforgettable', 'Bring warm clothes for desert nights', 'Negotiate jeep tour prices in advance']
  },
  'Aqaba': {
    bestTime: 'October–April (cooler, great diving)',
    duration: '2–4 days for full experience',
    dressCode: 'Beach/resort wear, swimwear for snorkeling',
    accessibility: 'Beach areas are generally accessible',
    proTips: ['Snorkeling at the Japanese Garden reef', 'Glass-bottom boats available for non-swimmers', 'Visit the souk for local spices', 'Aqaba is duty-free — great for shopping']
  },
  'Dead Sea': {
    bestTime: 'March–May or Oct–Nov',
    duration: 'Half-day to full day',
    dressCode: 'Swimwear, avoid shaving before visiting',
    accessibility: 'Resort beaches are accessible',
    proTips: ['Don\'t shave 24h before floating', 'Mud is free at public beaches', 'Don\'t get water in your eyes', 'Float for max 15–20 minutes at a time']
  },
  'Jerash': {
    bestTime: 'March–May or September–November',
    duration: '2–4 hours',
    dressCode: 'Comfortable walking shoes, sun protection',
    accessibility: 'Uneven ancient ruins — moderate difficulty',
    proTips: ['Catch the gladiator show (included in ticket)', 'Hire a local guide for deeper history', 'The South Theater acoustics are amazing', 'Visit during Jerash Festival (July) for cultural events']
  }
};

// ═════════════════════════════════════════════════
// 1. FAVORITES / WISHLIST
// ═════════════════════════════════════════════════
function isFavorite(id) { return favorites.includes(id); }

function toggleFavorite(e, id) {
  e.stopPropagation();
  if (isFavorite(id)) {
    favorites = favorites.filter(f => f !== id);
    showToast('Removed from wishlist', 'info');
  } else {
    favorites.push(id);
    showToast('Added to wishlist! ❤️', 'success');
  }
  localStorage.setItem('tm_favorites', JSON.stringify(favorites));
  renderCurrentView();
}

// ═════════════════════════════════════════════════
// 2. RENDER CARD (with favorites, compare checkbox)
// ═════════════════════════════════════════════════
function renderCard(a) {
  const emoji = getCityEmoji(a.city);
  const isFree = a.entryFee === 0 || a.entryFee === null;
  const desc = a.descriptionEn
    ? a.descriptionEn.substring(0, 100) + '...'
    : 'Discover this amazing attraction in Jordan.';
  const favClass = isFavorite(a.id) ? 'fav-active' : '';
  const isCompared = compareList.includes(a.id);

  return `
    <div class="attraction-card" onclick="openDetail(${a.id})">
      <div class="attraction-card-image">
        ${emoji}
        <div class="attraction-card-city">📍 ${a.city}</div>
        ${isFree ? '<div class="attraction-card-free">Free Entry</div>' : ''}
        <button class="fav-btn ${favClass}" onclick="toggleFavorite(event, ${a.id})" title="Add to Wishlist">
          ${isFavorite(a.id) ? '❤️' : '🤍'}
        </button>
        <label class="compare-checkbox" onclick="event.stopPropagation()">
          <input type="checkbox" ${isCompared ? 'checked' : ''} onchange="toggleCompare(${a.id})"/>
          <span class="compare-label">Compare</span>
        </label>
      </div>
      <div class="attraction-card-body">
        <div class="attraction-card-title">${a.nameEn}</div>
        <div class="attraction-card-title-ar">${a.nameAr || ''}</div>
        <div class="attraction-card-desc">${desc}</div>
      </div>
      <div class="attraction-card-footer">
        <div class="attraction-card-rating">
          <span class="star">${renderStars(a.rating || 0)}</span>
          ${(a.rating || 0).toFixed(1)}
        </div>
        <div class="attraction-card-fee">
          ${isFree ? '<span style="color:#228B22">Free</span>' : a.entryFee + ' JOD'}
        </div>
      </div>
    </div>
  `;
}

// ═════════════════════════════════════════════════
// 3. RENDER + PAGINATION
// ═════════════════════════════════════════════════
function renderAttractions(list) {
  filteredAttractions = list;
  const count = document.getElementById('results-count');
  count.textContent = `${list.length} attraction${list.length !== 1 ? 's' : ''} found`;

  if (currentView === 'grid') {
    renderGridPage();
  } else {
    renderMap(list);
  }
}

function renderGridPage() {
  const grid = document.getElementById('attractions-grid');
  const totalPages = Math.ceil(filteredAttractions.length / PAGE_SIZE);
  currentPage = Math.min(currentPage, totalPages || 1);

  const start = (currentPage - 1) * PAGE_SIZE;
  const pageItems = filteredAttractions.slice(start, start + PAGE_SIZE);

  if (filteredAttractions.length === 0) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1">
        <div class="empty-state-icon">🏛️</div>
        <div class="empty-state-title">No Attractions Found</div>
        <div class="empty-state-desc">Try a different city or search term</div>
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
  const totalPages = Math.ceil(filteredAttractions.length / PAGE_SIZE);
  if (page < 1 || page > totalPages) return;
  currentPage = page;
  renderGridPage();
  document.getElementById('attractions-grid').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function renderCurrentView() {
  renderAttractions(filteredAttractions);
}

// ═════════════════════════════════════════════════
// 4. VIEW TOGGLE (Grid / Map)
// ═════════════════════════════════════════════════
function setView(view) {
  currentView = view;
  document.getElementById('view-grid-btn').classList.toggle('active', view === 'grid');
  document.getElementById('view-map-btn').classList.toggle('active', view === 'map');
  document.getElementById('attractions-grid').classList.toggle('hidden', view === 'map');
  document.getElementById('map-container').classList.toggle('hidden', view === 'grid');
  document.getElementById('pagination').classList.toggle('hidden', view === 'map');

  if (view === 'map') {
    renderMap(filteredAttractions);
  } else {
    renderGridPage();
  }
}

function renderMap(list) {
  const mapEl = document.getElementById('attractions-map');
  if (!leafletMap) {
    leafletMap = L.map('attractions-map').setView([31.5, 36.0], 7);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(leafletMap);
  }

  // clear old markers
  mapMarkers.forEach(m => leafletMap.removeLayer(m));
  mapMarkers = [];

  const bounds = [];
  list.forEach(a => {
    if (a.latitude && a.longitude) {
      const marker = L.marker([a.latitude, a.longitude])
        .addTo(leafletMap)
        .bindPopup(`
                    <strong>${a.nameEn}</strong><br/>
                    📍 ${a.city}<br/>
                    ⭐ ${(a.rating || 0).toFixed(1)}<br/>
                    ${a.entryFee > 0 ? a.entryFee + ' JOD' : 'Free'}<br/>
                    <button onclick="openDetail(${a.id})" style="margin-top:6px;padding:4px 12px;background:var(--clay);color:#fff;border:none;border-radius:6px;cursor:pointer">View Details</button>
                `);
      mapMarkers.push(marker);
      bounds.push([a.latitude, a.longitude]);
    }
  });

  if (bounds.length > 0) {
    setTimeout(() => {
      leafletMap.invalidateSize();
      leafletMap.fitBounds(bounds, { padding: [30, 30] });
    }, 200);
  } else {
    setTimeout(() => leafletMap.invalidateSize(), 200);
  }
}

// ═════════════════════════════════════════════════
// 5. CATEGORY FILTERS
// ═════════════════════════════════════════════════
async function loadCategories() {
  try {
    const cats = await CategoriesAPI.getByType('Attraction');
    const container = document.getElementById('category-chips');
    if (!Array.isArray(cats) || cats.length === 0) return;

    const chips = cats.map(c =>
      `<button class="category-chip" onclick="filterByCategory(this, '${c.id}')">${c.name}</button>`
    ).join('');
    container.innerHTML = `<button class="category-chip active" onclick="filterByCategory(this, '')">All</button>` + chips;
  } catch (e) {
    // categories not available — keep "All" only
  }
}

function filterByCategory(btn, categoryId) {
  document.querySelectorAll('.category-chip').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  currentCategory = categoryId;
  currentPage = 1;
  applyAllFilters();
}

// ═════════════════════════════════════════════════
// 6. FILTER + SORT LOGIC
// ═════════════════════════════════════════════════
function filterByCity(btn, city) {
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  currentCity = city;
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
  let list = [...allAttractions];

  // City filter
  if (currentCity) list = list.filter(a => a.city === currentCity);

  // Category filter
  if (currentCategory) list = list.filter(a => a.categoryId == currentCategory);

  // Keyword filter
  if (keyword) list = list.filter(a =>
    a.nameEn.toLowerCase().includes(keyword) ||
    a.nameAr?.toLowerCase().includes(keyword) ||
    a.city.toLowerCase().includes(keyword)
  );

  // Sort
  switch (currentSort) {
    case 'rating-desc': list.sort((a, b) => (b.rating || 0) - (a.rating || 0)); break;
    case 'rating-asc': list.sort((a, b) => (a.rating || 0) - (b.rating || 0)); break;
    case 'fee-asc': list.sort((a, b) => (a.entryFee || 0) - (b.entryFee || 0)); break;
    case 'fee-desc': list.sort((a, b) => (b.entryFee || 0) - (a.entryFee || 0)); break;
    case 'name-asc': list.sort((a, b) => a.nameEn.localeCompare(b.nameEn)); break;
    case 'name-desc': list.sort((a, b) => b.nameEn.localeCompare(a.nameEn)); break;
    case 'free-first': list.sort((a, b) => (a.entryFee || 0) - (b.entryFee || 0)); break;
  }

  renderAttractions(list);
}

// ═════════════════════════════════════════════════
// 7. COMPARISON FEATURE
// ═════════════════════════════════════════════════
function toggleCompare(id) {
  if (compareList.includes(id)) {
    compareList = compareList.filter(c => c !== id);
  } else {
    if (compareList.length >= 3) {
      showToast('You can compare up to 3 attractions', 'error');
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

  const items = compareList.map(id => allAttractions.find(a => a.id === id)).filter(Boolean);

  content.innerHTML = `
    <div class="compare-table">
      <table>
        <thead>
          <tr>
            <th>Feature</th>
            ${items.map(a => `<th>${a.nameEn}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>City</td>
            ${items.map(a => `<td>${getCityEmoji(a.city)} ${a.city}</td>`).join('')}
          </tr>
          <tr>
            <td>Rating</td>
            ${items.map(a => `<td>${renderStars(a.rating || 0)} ${(a.rating || 0).toFixed(1)}</td>`).join('')}
          </tr>
          <tr>
            <td>Entry Fee</td>
            ${items.map(a => `<td>${(!a.entryFee) ? '<span style="color:#228B22">Free</span>' : a.entryFee + ' JOD'}</td>`).join('')}
          </tr>
          <tr>
            <td>Opening Hours</td>
            ${items.map(a => `<td>${a.openingHours || 'N/A'}</td>`).join('')}
          </tr>
          <tr>
            <td>Description</td>
            ${items.map(a => `<td class="compare-desc">${a.descriptionEn ? a.descriptionEn.substring(0, 150) + '...' : 'N/A'}</td>`).join('')}
          </tr>
          <tr>
            <td>Actions</td>
            ${items.map(a => `<td><button class="btn btn-primary btn-sm" onclick="closeCompare(); openDetail(${a.id})">View Details</button></td>`).join('')}
          </tr>
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
// 8. DETAIL MODAL (Gallery, Tips, Reviews, Nearby, Share)
// ═════════════════════════════════════════════════
async function openDetail(id) {
  const modal = document.getElementById('detail-modal');
  const content = document.getElementById('modal-content');
  const title = document.getElementById('modal-title');

  modal.classList.add('open');
  content.innerHTML = '<div class="loading"><div class="spinner"></div> Loading...</div>';

  try {
    const a = await AttractionsAPI.getById(id);
    const emoji = getCityEmoji(a.city);
    const isFree = a.entryFee === 0 || a.entryFee === null;
    const gallery = cityGallery[a.city] || [emoji];
    const tips = visitorTips[a.city] || null;

    title.textContent = a.nameEn;

    content.innerHTML = `
      <!-- IMAGE GALLERY / CAROUSEL -->
      <div class="gallery-carousel" id="gallery-${a.id}">
        <div class="gallery-main" id="gallery-main-${a.id}">${gallery[0]}</div>
        <div class="gallery-thumbs">
          ${gallery.map((g, i) => `<button class="gallery-thumb ${i === 0 ? 'active' : ''}" onclick="setGallerySlide(${a.id}, ${i})">${g}</button>`).join('')}
        </div>
      </div>

      <!-- INFO GRID -->
      <div class="modal-detail-grid">
        <div class="modal-detail-item">
          <div class="modal-detail-item-label">📍 City</div>
          <div class="modal-detail-item-value">${a.city}</div>
        </div>
        <div class="modal-detail-item">
          <div class="modal-detail-item-label">🎟️ Entry Fee</div>
          <div class="modal-detail-item-value">${isFree ? 'Free' : a.entryFee + ' JOD'}</div>
        </div>
        <div class="modal-detail-item">
          <div class="modal-detail-item-label">⏰ Opening Hours</div>
          <div class="modal-detail-item-value">${a.openingHours || 'Not specified'}</div>
        </div>
        <div class="modal-detail-item">
          <div class="modal-detail-item-label">⭐ Rating</div>
          <div class="modal-detail-item-value">${renderStars(a.rating || 0)} ${(a.rating || 0).toFixed(1)}</div>
        </div>
      </div>

      ${a.descriptionEn ? `
        <div class="modal-detail-item-label" style="margin-bottom:8px">📖 Description</div>
        <div class="modal-detail-desc">${a.descriptionEn}</div>
      ` : ''}

      ${a.descriptionAr ? `
        <div class="modal-detail-item-label" style="margin-bottom:8px; text-align:right">الوصف بالعربية</div>
        <div class="modal-detail-desc-ar">${a.descriptionAr}</div>
      ` : ''}

      ${a.latitude && a.longitude ? `
        <div class="modal-detail-item">
          <div class="modal-detail-item-label">🗺️ Coordinates</div>
          <div class="modal-detail-item-value">${a.latitude}, ${a.longitude}</div>
        </div>
      ` : ''}

      <!-- VISITOR TIPS -->
      ${tips ? `
      <div class="visitor-tips-section">
        <h4 class="section-subtitle">🧳 Visitor Tips for ${a.city}</h4>
        <div class="tips-grid">
          <div class="tip-card">
            <div class="tip-icon">🌤️</div>
            <div class="tip-label">Best Time</div>
            <div class="tip-value">${tips.bestTime}</div>
          </div>
          <div class="tip-card">
            <div class="tip-icon">⏱️</div>
            <div class="tip-label">Duration</div>
            <div class="tip-value">${tips.duration}</div>
          </div>
          <div class="tip-card">
            <div class="tip-icon">👔</div>
            <div class="tip-label">Dress Code</div>
            <div class="tip-value">${tips.dressCode}</div>
          </div>
          <div class="tip-card">
            <div class="tip-icon">♿</div>
            <div class="tip-label">Accessibility</div>
            <div class="tip-value">${tips.accessibility}</div>
          </div>
        </div>
        ${tips.proTips.length ? `
        <div class="pro-tips">
          <div class="pro-tips-title">💡 Pro Tips</div>
          <ul>${tips.proTips.map(t => `<li>${t}</li>`).join('')}</ul>
        </div>` : ''}
      </div>` : ''}

      <!-- REVIEWS SECTION -->
      <div class="reviews-section" id="reviews-section-${a.id}">
        <h4 class="section-subtitle">📝 Reviews</h4>
        <div id="reviews-list-${a.id}"><div class="loading"><div class="spinner"></div></div></div>
        ${isLoggedIn() ? `
        <div class="review-form">
          <h5>Leave a Review</h5>
          <div class="review-stars-input" id="review-stars-input-${a.id}">
            ${[1, 2, 3, 4, 5].map(s => `<button class="review-star-btn" onclick="setReviewRating(${a.id}, ${s})">☆</button>`).join('')}
          </div>
          <textarea id="review-text-${a.id}" class="input" rows="3" placeholder="Share your experience..."></textarea>
          <button class="btn btn-primary btn-sm" onclick="submitReview(${a.id})" style="margin-top:8px;">Submit Review</button>
        </div>` : `
        <div class="review-login-prompt">
          <a href="auth.html">Login</a> to leave a review
        </div>`}
      </div>

      <!-- NEARBY HOTELS & RESTAURANTS -->
      <div class="nearby-section">
        <h4 class="section-subtitle">🏨 Hotels in ${a.city}</h4>
        <div class="nearby-scroll" id="nearby-hotels-${a.id}"><div class="loading"><div class="spinner"></div></div></div>
        <h4 class="section-subtitle" style="margin-top:16px;">🍽️ Restaurants in ${a.city}</h4>
        <div class="nearby-scroll" id="nearby-restaurants-${a.id}"><div class="loading"><div class="spinner"></div></div></div>
      </div>

      <!-- ACTIONS -->
      <div class="modal-actions">
        <button class="btn btn-primary" onclick="addToTrip(${a.id}, '${a.nameEn.replace(/'/g, "\\'")}')">📋 Add to Trip</button>
        <button class="btn btn-outline" onclick="toggleFavorite(event, ${a.id})">
          ${isFavorite(a.id) ? '❤️ Wishlisted' : '🤍 Wishlist'}
        </button>
        <button class="btn btn-ghost" onclick="shareAttraction(${a.id}, '${a.nameEn.replace(/'/g, "\\'")}')">📤 Share</button>
        <button class="btn btn-outline" onclick="closeModal()">Close</button>
      </div>
    `;

    // load async sections
    loadReviews(a.id);
    loadNearbyHotels(a.id, a.city);
    loadNearbyRestaurants(a.id, a.city);

  } catch (err) {
    content.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">⚠️</div>
        <div class="empty-state-title">Could not load details</div>
      </div>`;
  }
}

// ── Gallery Carousel ─────────────────────────────
function setGallerySlide(id, index) {
  const attraction = allAttractions.find(a => a.id === id);
  const gallery = cityGallery[attraction?.city] || ['📍'];
  document.getElementById(`gallery-main-${id}`).textContent = gallery[index];
  document.querySelectorAll(`#gallery-${id} .gallery-thumb`).forEach((t, i) => {
    t.classList.toggle('active', i === index);
  });
}

// ═════════════════════════════════════════════════
// 9. REVIEWS
// ═════════════════════════════════════════════════
let reviewRatings = {};

function setReviewRating(attractionId, rating) {
  reviewRatings[attractionId] = rating;
  const container = document.getElementById(`review-stars-input-${attractionId}`);
  if (!container) return;
  const btns = container.querySelectorAll('.review-star-btn');
  btns.forEach((btn, i) => { btn.textContent = i < rating ? '★' : '☆'; });
}

async function loadReviews(attractionId) {
  const container = document.getElementById(`reviews-list-${attractionId}`);
  try {
    const reviews = await ReviewsAPI.getByPlace('Attraction', attractionId);
    const list = Array.isArray(reviews) ? reviews : [];

    if (list.length === 0) {
      container.innerHTML = '<div class="no-reviews">No reviews yet. Be the first!</div>';
      return;
    }

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

async function submitReview(attractionId) {
  const rating = reviewRatings[attractionId] || 0;
  const comment = document.getElementById(`review-text-${attractionId}`)?.value?.trim();

  if (!rating) { showToast('Please select a star rating', 'error'); return; }
  if (!comment) { showToast('Please write a comment', 'error'); return; }

  const user = getUser();
  try {
    await ReviewsAPI.create({
      id: 0,
      userId: user.id,
      placeType: 'Attraction',
      placeId: attractionId,
      rating: rating,
      comment: comment,
      createdAt: new Date().toISOString()
    });
    showToast('Review submitted! Thank you 🎉', 'success');
    loadReviews(attractionId);
    document.getElementById(`review-text-${attractionId}`).value = '';
    setReviewRating(attractionId, 0);
  } catch (e) {
    showToast('Could not submit review', 'error');
  }
}

// ═════════════════════════════════════════════════
// 10. NEARBY HOTELS & RESTAURANTS
// ═════════════════════════════════════════════════
async function loadNearbyHotels(attractionId, city) {
  const container = document.getElementById(`nearby-hotels-${attractionId}`);
  try {
    const hotels = await HotelsAPI.getByCity(city);
    const list = Array.isArray(hotels) ? hotels.slice(0, 4) : [];
    if (list.length === 0) {
      container.innerHTML = '<div class="no-reviews">No hotels found in this city</div>';
      return;
    }
    container.innerHTML = list.map(h => `
      <div class="nearby-card" onclick="location.href='hotels.html?id=${h.id}'">
        <div class="nearby-card-icon">🏨</div>
        <div class="nearby-card-info">
          <div class="nearby-card-name">${h.nameEn}</div>
          <div class="nearby-card-meta">${'⭐'.repeat(h.stars || 3)} • ${h.pricePerNight} JOD/night</div>
        </div>
      </div>
    `).join('');
  } catch (e) {
    container.innerHTML = '<div class="no-reviews">Could not load nearby hotels</div>';
  }
}

async function loadNearbyRestaurants(attractionId, city) {
  const container = document.getElementById(`nearby-restaurants-${attractionId}`);
  try {
    const restaurants = await RestaurantsAPI.getByCity(city);
    const list = Array.isArray(restaurants) ? restaurants.slice(0, 4) : [];
    if (list.length === 0) {
      container.innerHTML = '<div class="no-reviews">No restaurants found in this city</div>';
      return;
    }
    container.innerHTML = list.map(r => `
      <div class="nearby-card" onclick="location.href='restaurants.html?id=${r.id}'">
        <div class="nearby-card-icon">🍽️</div>
        <div class="nearby-card-info">
          <div class="nearby-card-name">${r.nameEn}</div>
          <div class="nearby-card-meta">${r.cuisine || 'Restaurant'} • ${r.priceRange || '$$'}</div>
        </div>
      </div>
    `).join('');
  } catch (e) {
    container.innerHTML = '<div class="no-reviews">Could not load nearby restaurants</div>';
  }
}

// ═════════════════════════════════════════════════
// 11. SHARE
// ═════════════════════════════════════════════════
function shareAttraction(id, name) {
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
// CLOSE MODAL / ADD TO TRIP
// ═════════════════════════════════════════════════
function closeModal() {
  document.getElementById('detail-modal').classList.remove('open');
}

function addToTrip(id, name) {
  if (!isLoggedIn()) {
    showToast('Please login first to add to your trip!', 'error');
    setTimeout(() => location.href = 'auth.html', 1500);
    return;
  }
  showToast(`${name} added to your trip! 📋`, 'success');
  closeModal();
}

document.getElementById('detail-modal').addEventListener('click', function (e) {
  if (e.target === this) closeModal();
});

// ═════════════════════════════════════════════════
// LOAD + INIT
// ═════════════════════════════════════════════════
async function loadAttractions() {
  const grid = document.getElementById('attractions-grid');
  try {
    const data = await AttractionsAPI.getAll();
    allAttractions = Array.isArray(data) ? data : [];
    applyAllFilters();
  } catch (e) {
    const activeApi = typeof window.getTravelMindApiBase === 'function'
      ? window.getTravelMindApiBase()
      : 'your API base URL';
    grid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1">
        <div class="empty-state-icon">⚠️</div>
        <div class="empty-state-title">Could not load attractions</div>
        <div class="empty-state-desc">Make sure the API is running at ${activeApi}</div>
      </div>`;
    document.getElementById('results-count').textContent = '0 attractions found';
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
  await Promise.all([loadAttractions(), loadCategories()]);
  checkUrlParams();
});