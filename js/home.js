// ═══════════════════════════════════════════════
// HOME PAGE LOGIC
// ═══════════════════════════════════════════════

let currentSearchTab = 'attractions';

// ── SEARCH TAB ──────────────────────────────────
function setSearchTab(btn, tab) {
    document.querySelectorAll('.search-tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentSearchTab = tab;
}

// ── SEARCH ──────────────────────────────────────
function doSearch() {
    const city = document.getElementById('search-city').value;
    const keyword = document.getElementById('search-keyword').value;

    let url = `${currentSearchTab}.html?`;
    if (city) url += `city=${encodeURIComponent(city)}&`;
    if (keyword) url += `search=${encodeURIComponent(keyword)}`;

    location.href = url;
}

// ── LOAD ATTRACTIONS ────────────────────────────
async function loadFeaturedAttractions() {
    const grid = document.getElementById('attractions-grid');
    try {
        const data = await AttractionsAPI.getAll();
        const items = Array.isArray(data) ? data.slice(0, 3) : [];

        if (items.length === 0) {
            grid.innerHTML = `
        <div class="empty-state" style="grid-column: 1/-1">
          <div class="empty-state-icon">🏛️</div>
          <div class="empty-state-title">No Attractions Yet</div>
          <div class="empty-state-desc">Check back soon!</div>
        </div>`;
            return;
        }

        grid.innerHTML = items.map(renderAttractionCard).join('');

        // update stat
        document.getElementById('stat-attractions').textContent = data.length + '+';
    } catch (e) {
        grid.innerHTML = `
      <div class="empty-state" style="grid-column: 1/-1">
        <div class="empty-state-icon">⚠️</div>
        <div class="empty-state-title">Could not load attractions</div>
        <div class="empty-state-desc">Make sure the API is running</div>
      </div>`;
    }
}

// ── LOAD HOTELS ─────────────────────────────────
async function loadFeaturedHotels() {
    const grid = document.getElementById('hotels-grid');
    try {
        const data = await HotelsAPI.getAll();
        const items = Array.isArray(data) ? data.slice(0, 3) : [];

        if (items.length === 0) {
            grid.innerHTML = `
        <div class="empty-state" style="grid-column: 1/-1">
          <div class="empty-state-icon">🏨</div>
          <div class="empty-state-title">No Hotels Yet</div>
          <div class="empty-state-desc">Check back soon!</div>
        </div>`;
            return;
        }

        grid.innerHTML = items.map(renderHotelCard).join('');
        document.getElementById('stat-hotels').textContent = data.length + '+';
    } catch (e) {
        grid.innerHTML = `
      <div class="empty-state" style="grid-column: 1/-1">
        <div class="empty-state-icon">⚠️</div>
        <div class="empty-state-title">Could not load hotels</div>
        <div class="empty-state-desc">Make sure the API is running</div>
      </div>`;
    }
}

// ── LOAD RESTAURANTS ────────────────────────────
async function loadFeaturedRestaurants() {
    const grid = document.getElementById('restaurants-grid');
    try {
        const data = await RestaurantsAPI.getAll();
        const items = Array.isArray(data) ? data.slice(0, 3) : [];

        if (items.length === 0) {
            grid.innerHTML = `
        <div class="empty-state" style="grid-column: 1/-1">
          <div class="empty-state-icon">🍽️</div>
          <div class="empty-state-title">No Restaurants Yet</div>
          <div class="empty-state-desc">Check back soon!</div>
        </div>`;
            return;
        }

        grid.innerHTML = items.map(renderRestaurantCard).join('');
        document.getElementById('stat-restaurants').textContent = data.length + '+';
    } catch (e) {
        grid.innerHTML = `
      <div class="empty-state" style="grid-column: 1/-1">
        <div class="empty-state-icon">⚠️</div>
        <div class="empty-state-title">Could not load restaurants</div>
        <div class="empty-state-desc">Make sure the API is running</div>
      </div>`;
    }
}

// ── NEWSLETTER ──────────────────────────────────
function subscribeNewsletter(e) {
    e.preventDefault();
    const input = e.target.querySelector('input[type="email"]');
    if (input.value) {
        showToast('Thanks for subscribing! 🎉', 'success');
        input.value = '';
    }
}

// ── INIT ────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    loadFeaturedAttractions();
    loadFeaturedHotels();
    loadFeaturedRestaurants();
});