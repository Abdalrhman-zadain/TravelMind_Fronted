// ═══════════════════════════════════════════════
// RESTAURANTS PAGE LOGIC
// ═══════════════════════════════════════════════

let allRestaurants = [];
let currentCity = '';
let currentCuisine = '';

// ── CUISINE EMOJI MAP ───────────────────────────
const cuisineEmojis = {
    'Arabic': '🥙',
    'Italian': '🍕',
    'Fast Food': '🍔',
    'Seafood': '🦞',
    'Indian': '🍛',
    'Chinese': '🥡',
    'Turkish': '🥗',
    'Lebanese': '🧆',
};

function getCuisineEmoji(cuisine) {
    return cuisineEmojis[cuisine] || '🍽️';
}

// ── RENDER CARD ─────────────────────────────────
function renderCard(r) {
    const emoji = getCuisineEmoji(r.cuisine);
    const desc = r.descriptionEn
        ? r.descriptionEn.substring(0, 90) + '...'
        : 'Enjoy delicious food in a great atmosphere.';

    return `
    <div class="restaurant-card" onclick="openDetail(${r.id})">
      <div class="restaurant-card-image">
        ${emoji}
        <div class="restaurant-card-cuisine">${r.cuisine || 'Restaurant'}</div>
        <div class="restaurant-card-price">${r.priceRange || '$$'}</div>
      </div>
      <div class="restaurant-card-body">
        <div class="restaurant-card-title">${r.nameEn}</div>
        <div class="restaurant-card-title-ar">${r.nameAr || ''}</div>
        <div class="restaurant-card-desc">${desc}</div>
        <div class="restaurant-card-info">
          ${r.phone ? '<span class="restaurant-info-tag">📞 Phone</span>' : ''}
          ${r.cuisine ? `<span class="restaurant-info-tag">${getCuisineEmoji(r.cuisine)} ${r.cuisine}</span>` : ''}
        </div>
      </div>
      <div class="restaurant-card-footer">
        <div class="restaurant-card-rating">
          <span class="star">${renderStars(r.rating || 0)}</span>
          ${(r.rating || 0).toFixed(1)}
        </div>
        <div class="restaurant-card-city">📍 ${r.city}</div>
      </div>
    </div>
  `;
}

// ── RENDER ALL ──────────────────────────────────
function renderRestaurants(list) {
    const grid = document.getElementById('restaurants-grid');
    const count = document.getElementById('results-count');

    count.textContent = `${list.length} restaurant${list.length !== 1 ? 's' : ''} found`;

    if (list.length === 0) {
        grid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1">
        <div class="empty-state-icon">🍽️</div>
        <div class="empty-state-title">No Restaurants Found</div>
        <div class="empty-state-desc">Try a different city or cuisine</div>
      </div>`;
        return;
    }

    grid.innerHTML = list.map(renderCard).join('');
}

// ── FILTER BY CITY ──────────────────────────────
function filterByCity(btn, city) {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentCity = city;
    currentCuisine = '';
    applyFilters();
}

// ── FILTER BY CUISINE ───────────────────────────
function filterByCuisine(btn, cuisine) {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentCuisine = cuisine;
    currentCity = '';
    applyFilters();
}

// ── FILTER BY SEARCH ────────────────────────────
function filterBySearch(keyword) {
    applyFilters(keyword.toLowerCase());
}

// ── APPLY FILTERS ───────────────────────────────
function applyFilters(keyword = '') {
    let filtered = allRestaurants;

    if (currentCity) filtered = filtered.filter(r => r.city === currentCity);
    if (currentCuisine) filtered = filtered.filter(r => r.cuisine === currentCuisine);
    if (keyword) filtered = filtered.filter(r =>
        r.nameEn.toLowerCase().includes(keyword) ||
        r.nameAr?.toLowerCase().includes(keyword) ||
        r.city.toLowerCase().includes(keyword) ||
        r.cuisine?.toLowerCase().includes(keyword)
    );

    renderRestaurants(filtered);
}

// ── OPEN DETAIL MODAL ───────────────────────────
async function openDetail(id) {
    const modal = document.getElementById('detail-modal');
    const content = document.getElementById('modal-content');
    const title = document.getElementById('modal-title');

    modal.classList.add('open');
    content.innerHTML = '<div class="loading"><div class="spinner"></div> Loading...</div>';

    try {
        const r = await RestaurantsAPI.getById(id);
        const emoji = getCuisineEmoji(r.cuisine);
        title.textContent = r.nameEn;

        content.innerHTML = `
      <div class="modal-detail-image">${emoji}</div>

      <div class="modal-detail-grid">
        <div class="modal-detail-item">
          <div class="modal-detail-item-label">📍 City</div>
          <div class="modal-detail-item-value">${r.city}</div>
        </div>
        <div class="modal-detail-item">
          <div class="modal-detail-item-label">🍴 Cuisine</div>
          <div class="modal-detail-item-value">${r.cuisine || 'Not specified'}</div>
        </div>
        <div class="modal-detail-item">
          <div class="modal-detail-item-label">💰 Price Range</div>
          <div class="modal-detail-item-value">${r.priceRange || '$$'}</div>
        </div>
        <div class="modal-detail-item">
          <div class="modal-detail-item-label">⭐ Rating</div>
          <div class="modal-detail-item-value">${renderStars(r.rating || 0)} ${(r.rating || 0).toFixed(1)}</div>
        </div>
        ${r.phone ? `
        <div class="modal-detail-item">
          <div class="modal-detail-item-label">📞 Phone</div>
          <div class="modal-detail-item-value">${r.phone}</div>
        </div>` : ''}
      </div>

      ${r.descriptionEn ? `
        <div class="modal-detail-item-label" style="margin-bottom:8px">📖 Description</div>
        <div class="modal-detail-desc">${r.descriptionEn}</div>
      ` : ''}

      ${r.descriptionAr ? `
        <div class="modal-detail-item-label" style="margin-bottom:8px; text-align:right">الوصف بالعربية</div>
        <div class="modal-detail-desc-ar">${r.descriptionAr}</div>
      ` : ''}

      <div class="modal-actions">
        <button class="btn btn-primary" onclick="saveRestaurant(${r.id}, '${r.nameEn}')">
          ❤️ Save
        </button>
        <button class="btn btn-outline" onclick="closeModal()">Close</button>
      </div>
    `;
    } catch (err) {
        content.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">⚠️</div>
        <div class="empty-state-title">Could not load details</div>
      </div>`;
    }
}

// ── CLOSE MODAL ─────────────────────────────────
function closeModal() {
    document.getElementById('detail-modal').classList.remove('open');
}

// ── SAVE RESTAURANT ─────────────────────────────
function saveRestaurant(id, name) {
    if (!isLoggedIn()) {
        showToast('Please login first!', 'error');
        setTimeout(() => location.href = 'auth.html', 1500);
        return;
    }
    showToast(`${name} saved! ❤️`, 'success');
    closeModal();
}

// ── CLOSE ON OVERLAY CLICK ──────────────────────
document.getElementById('detail-modal').addEventListener('click', function (e) {
    if (e.target === this) closeModal();
});

// ── LOAD RESTAURANTS ────────────────────────────
async function loadRestaurants() {
    const grid = document.getElementById('restaurants-grid');
    try {
        const data = await RestaurantsAPI.getAll();
        allRestaurants = Array.isArray(data) ? data : [];
        renderRestaurants(allRestaurants);
    } catch (e) {
        grid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1">
        <div class="empty-state-icon">⚠️</div>
        <div class="empty-state-title">Could not load restaurants</div>
        <div class="empty-state-desc">Make sure the API is running</div>
      </div>`;
        document.getElementById('results-count').textContent = '0 restaurants found';
    }
}

// ── CHECK URL PARAMS ────────────────────────────
function checkUrlParams() {
    const params = new URLSearchParams(window.location.search);
    const city = params.get('city');
    const cuisine = params.get('cuisine');
    const search = params.get('search');

    if (city) {
        const btn = Array.from(document.querySelectorAll('.filter-btn'))
            .find(b => b.textContent.includes(city));
        if (btn) filterByCity(btn, city);
        else currentCity = city;
    }

    if (cuisine) {
        const btn = Array.from(document.querySelectorAll('.filter-btn'))
            .find(b => b.textContent.includes(cuisine));
        if (btn) filterByCuisine(btn, cuisine);
    }

    if (search) {
        document.getElementById('search-input').value = search;
        filterBySearch(search);
    }
}

// ── INIT ────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
    await loadRestaurants();
    checkUrlParams();
});
