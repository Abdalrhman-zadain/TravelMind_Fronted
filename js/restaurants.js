// RESTAURANTS PAGE LOGIC

let allRestaurants = [];
let filteredRestaurants = [];
let currentCity = '';
let currentCuisine = '';
let currentView = 'grid';
let currentPage = 1;
const PAGE_SIZE = 9;
let restaurantsMap = null;
let mapMarkers = [];

const cuisineEmojis = {
  Arabic: '??',
  Italian: '??',
  'Fast Food': '??',
  Seafood: '??',
  Indian: '??',
  Chinese: '??',
  Turkish: '??',
  Lebanese: '??'
};

function getCuisineEmoji(cuisine) {
  return cuisineEmojis[cuisine] || '???';
}

function getRestaurantImageUrl(restaurant) {
  return restaurant?.photoUrl || restaurant?.photo_url || '';
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderCard(r) {
  const cuisine = r.cuisine || r.category || 'Restaurant';
  const emoji = getCuisineEmoji(cuisine);
  const imageUrl = getRestaurantImageUrl(r);
  const desc = r.descriptionEn
    ? `${r.descriptionEn.substring(0, 90)}...`
    : 'Enjoy delicious food in a great atmosphere.';

  return `
    <div class="restaurant-card" onclick="openDetail(${r.id})">
      <div class="restaurant-card-image">
        ${
          imageUrl
            ? `<img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(r.nameEn)}" class="restaurant-photo" loading="lazy" referrerpolicy="no-referrer">`
            : emoji
        }
        <div class="restaurant-card-cuisine">${cuisine}</div>
        <div class="restaurant-card-price">${r.priceRange || '$$'}</div>
      </div>
      <div class="restaurant-card-body">
        <div class="restaurant-card-title">${r.nameEn}</div>
        <div class="restaurant-card-title-ar">${r.nameAr || ''}</div>
        <div class="restaurant-card-desc">${desc}</div>
        <div class="restaurant-card-info">
          ${r.phone ? '<span class="restaurant-info-tag">?? Phone</span>' : ''}
          ${cuisine ? `<span class="restaurant-info-tag">${getCuisineEmoji(cuisine)} ${cuisine}</span>` : ''}
        </div>
      </div>
      <div class="restaurant-card-footer">
        <div class="restaurant-card-rating">
          <span class="star">${renderStars(r.rating || 0)}</span>
          ${(r.rating || 0).toFixed(1)}
        </div>
        <div class="restaurant-card-city">?? ${r.city}</div>
      </div>
    </div>
  `;
}

function renderRestaurants(list) {
  const count = document.getElementById('results-count');
  filteredRestaurants = list;
  currentPage = Math.min(currentPage, Math.max(1, Math.ceil(list.length / PAGE_SIZE)));

  count.textContent = `${list.length} restaurant${list.length !== 1 ? 's' : ''} found`;

  if (currentView === 'map') {
    document.getElementById('pagination')?.classList.add('hidden');
    renderMap(list);
    return;
  }

  document.getElementById('pagination')?.classList.remove('hidden');
  renderGridPage();
}

function renderGridPage() {
  const grid = document.getElementById('restaurants-grid');
  const totalPages = Math.ceil(filteredRestaurants.length / PAGE_SIZE);
  currentPage = Math.min(currentPage, totalPages || 1);

  const start = (currentPage - 1) * PAGE_SIZE;
  const pageItems = filteredRestaurants.slice(start, start + PAGE_SIZE);

  if (filteredRestaurants.length === 0) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1">
        <div class="empty-state-icon">???</div>
        <div class="empty-state-title">No Restaurants Found</div>
        <div class="empty-state-desc">Try a different city or cuisine</div>
      </div>`;
    document.getElementById('pagination').innerHTML = '';
    return;
  }

  grid.innerHTML = pageItems.map(renderCard).join('');
  renderPagination(totalPages);
}

function renderPagination(totalPages) {
  const container = document.getElementById('pagination');
  if (!container) return;
  if (totalPages <= 1) {
    container.innerHTML = '';
    return;
  }

  let html = '';
  html += `<button class="page-btn ${currentPage === 1 ? 'disabled' : ''}" onclick="goToPage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>Prev</button>`;

  for (let i = 1; i <= totalPages; i += 1) {
    if (totalPages > 7 && i > 2 && i < totalPages - 1 && Math.abs(i - currentPage) > 1) {
      if (i === 3 || i === totalPages - 2) html += '<span class="page-dots">...</span>';
      continue;
    }
    html += `<button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="goToPage(${i})">${i}</button>`;
  }

  html += `<button class="page-btn ${currentPage === totalPages ? 'disabled' : ''}" onclick="goToPage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>Next</button>`;
  container.innerHTML = html;
}

function goToPage(page) {
  const totalPages = Math.ceil(filteredRestaurants.length / PAGE_SIZE);
  if (page < 1 || page > totalPages) return;
  currentPage = page;
  renderGridPage();
  document.getElementById('restaurants-grid')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function setView(view) {
  currentView = view === 'map' ? 'map' : 'grid';

  document.getElementById('view-grid-btn')?.classList.toggle('active', currentView === 'grid');
  document.getElementById('view-map-btn')?.classList.toggle('active', currentView === 'map');
  document.getElementById('restaurants-grid')?.classList.toggle('hidden', currentView === 'map');
  document.getElementById('map-container')?.classList.toggle('hidden', currentView === 'grid');
  document.getElementById('pagination')?.classList.toggle('hidden', currentView === 'map');

  if (currentView === 'map') renderMap(filteredRestaurants);
  else renderGridPage();
}

function renderMap(list) {
  const mapEl = document.getElementById('restaurants-map');
  if (!mapEl || typeof L === 'undefined') return;

  if (!restaurantsMap) {
    restaurantsMap = L.map('restaurants-map').setView([31.5, 36.0], 7);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(restaurantsMap);
  }

  mapMarkers.forEach((m) => restaurantsMap.removeLayer(m));
  mapMarkers = [];

  const bounds = [];
  list.forEach((r) => {
    const lat = Number(r.latitude);
    const lng = Number(r.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

    const marker = L.marker([lat, lng]).addTo(restaurantsMap).bindPopup(`
      <strong>${escapeHtml(r.nameEn)}</strong><br/>
      ?? ${escapeHtml(r.cuisine || r.category || 'Restaurant')}<br/>
      ?? ${escapeHtml(r.city || 'Jordan')}<br/>
      ? ${(r.rating || 0).toFixed(1)}
    `);

    mapMarkers.push(marker);
    bounds.push([lat, lng]);
  });

  setTimeout(() => {
    restaurantsMap.invalidateSize();
    if (bounds.length > 0) restaurantsMap.fitBounds(bounds, { padding: [30, 30] });
  }, 150);
}

function filterByCity(btn, city) {
  document.querySelectorAll('.filter-btn').forEach((b) => b.classList.remove('active'));
  btn.classList.add('active');
  currentCity = city;
  currentCuisine = '';
  currentPage = 1;
  applyFilters();
}

function filterByCuisine(btn, cuisine) {
  document.querySelectorAll('.filter-btn').forEach((b) => b.classList.remove('active'));
  btn.classList.add('active');
  currentCuisine = cuisine;
  currentCity = '';
  currentPage = 1;
  applyFilters();
}

function filterBySearch(keyword) {
  currentPage = 1;
  applyFilters(String(keyword || '').toLowerCase());
}

function applyFilters(keyword = '') {
  let filtered = allRestaurants;

  if (currentCity) filtered = filtered.filter((r) => r.city === currentCity);
  if (currentCuisine) filtered = filtered.filter((r) => (r.cuisine || r.category) === currentCuisine);
  if (keyword) {
    filtered = filtered.filter((r) =>
      r.nameEn.toLowerCase().includes(keyword) ||
      r.nameAr?.toLowerCase().includes(keyword) ||
      r.city.toLowerCase().includes(keyword) ||
      (r.cuisine || r.category || '').toLowerCase().includes(keyword)
    );
  }

  renderRestaurants(filtered);
}

async function openDetail(id) {
  const modal = document.getElementById('detail-modal');
  const content = document.getElementById('modal-content');
  const title = document.getElementById('modal-title');

  modal.classList.add('open');
  content.innerHTML = '<div class="loading"><div class="spinner"></div> Loading...</div>';

  try {
    const r = await RestaurantsAPI.getById(id);
    const cuisine = r.cuisine || r.category || 'Not specified';
    const emoji = getCuisineEmoji(cuisine);
    const imageUrl = getRestaurantImageUrl(r);
    title.textContent = r.nameEn;

    content.innerHTML = `
      <div class="modal-detail-image">
        ${imageUrl
          ? `<img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(r.nameEn)}" class="modal-restaurant-image" referrerpolicy="no-referrer">`
          : emoji}
      </div>

      <div class="modal-detail-grid">
        <div class="modal-detail-item">
          <div class="modal-detail-item-label">?? City</div>
          <div class="modal-detail-item-value">${r.city}</div>
        </div>
        <div class="modal-detail-item">
          <div class="modal-detail-item-label">?? Cuisine</div>
          <div class="modal-detail-item-value">${cuisine}</div>
        </div>
        <div class="modal-detail-item">
          <div class="modal-detail-item-label">?? Price Range</div>
          <div class="modal-detail-item-value">${r.priceRange || '$$'}</div>
        </div>
        <div class="modal-detail-item">
          <div class="modal-detail-item-label">? Rating</div>
          <div class="modal-detail-item-value">${renderStars(r.rating || 0)} ${(r.rating || 0).toFixed(1)}</div>
        </div>
        ${r.phone ? `
          <div class="modal-detail-item">
            <div class="modal-detail-item-label">?? Phone</div>
            <div class="modal-detail-item-value">${r.phone}</div>
          </div>` : ''}
      </div>

      ${r.descriptionEn ? `
        <div class="modal-detail-item-label" style="margin-bottom:8px">?? Description</div>
        <div class="modal-detail-desc">${r.descriptionEn}</div>
      ` : ''}

      ${r.descriptionAr ? `
        <div class="modal-detail-item-label" style="margin-bottom:8px; text-align:right">????? ????????</div>
        <div class="modal-detail-desc-ar">${r.descriptionAr}</div>
      ` : ''}

      <div class="modal-actions">
        <button class="btn btn-primary" onclick="saveRestaurant(${r.id}, '${String(r.nameEn).replace(/'/g, "\\'")}')">?? Save</button>
        <button class="btn btn-outline" onclick="closeModal()">Close</button>
      </div>
    `;
  } catch (_err) {
    content.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">??</div>
        <div class="empty-state-title">Could not load details</div>
      </div>`;
  }
}

function closeModal() {
  document.getElementById('detail-modal').classList.remove('open');
}

function saveRestaurant(_id, name) {
  if (!isLoggedIn()) {
    showToast('Please login first!', 'error');
    setTimeout(() => {
      location.href = 'auth.html';
    }, 1500);
    return;
  }
  showToast(`${name} saved! ??`, 'success');
  closeModal();
}

document.getElementById('detail-modal').addEventListener('click', function (e) {
  if (e.target === this) closeModal();
});

async function loadRestaurants() {
  const grid = document.getElementById('restaurants-grid');
  try {
    const data = await RestaurantsAPI.getAll();
    allRestaurants = Array.isArray(data) ? data : [];
    renderRestaurants(allRestaurants);
  } catch (_e) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1">
        <div class="empty-state-icon">??</div>
        <div class="empty-state-title">Could not load restaurants</div>
        <div class="empty-state-desc">Make sure the API is running</div>
      </div>`;
    document.getElementById('results-count').textContent = '0 restaurants found';
  }
}

function checkUrlParams() {
  const params = new URLSearchParams(window.location.search);
  const city = params.get('city');
  const cuisine = params.get('cuisine');
  const search = params.get('search');

  if (city) {
    const btn = Array.from(document.querySelectorAll('.filter-btn')).find((b) => b.textContent.includes(city));
    if (btn) filterByCity(btn, city);
    else {
      currentCity = city;
      applyFilters();
    }
  }

  if (cuisine) {
    const btn = Array.from(document.querySelectorAll('.filter-btn')).find((b) => b.textContent.includes(cuisine));
    if (btn) filterByCuisine(btn, cuisine);
  }

  if (search) {
    document.getElementById('search-input').value = search;
    filterBySearch(search);
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  await loadRestaurants();
  checkUrlParams();
});
