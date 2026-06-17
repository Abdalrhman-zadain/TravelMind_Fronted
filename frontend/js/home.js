// ═══════════════════════════════════════════════
// HOME PAGE LOGIC
// ═══════════════════════════════════════════════

let currentSearchTab = 'attractions';
let eventCarouselIndex = 0;
let cityCarouselIndex = 0;
let homeChatbotTypingDiv = null;

function getEventCardsPerView() {
    if (window.innerWidth <= 768) return 1;
    if (window.innerWidth <= 1024) return 2;
    return 3;
}

function updateEventCarousel() {
    const track = document.querySelector('#events-carousel-bottom .events-grid');
    const cards = track ? Array.from(track.querySelectorAll('.event-card')) : [];
    const prevBtn = document.getElementById('events-prev-bottom');
    const nextBtn = document.getElementById('events-next-bottom');
    if (!track || !cards.length || !prevBtn || !nextBtn) return;

    const perView = getEventCardsPerView();
    const maxIndex = Math.max(0, cards.length - perView);
    eventCarouselIndex = Math.min(eventCarouselIndex, maxIndex);

    const gap = 18;
    const cardWidth = cards[0].getBoundingClientRect().width;
    const offset = eventCarouselIndex * (cardWidth + gap);
    track.style.transform = `translateX(-${offset}px)`;

    prevBtn.disabled = eventCarouselIndex === 0;
    nextBtn.disabled = eventCarouselIndex >= maxIndex;
}

function moveEventCarousel(direction) {
    const track = document.querySelector('#events-carousel-bottom .events-grid');
    const totalCards = track ? track.querySelectorAll('.event-card').length : 0;
    if (!totalCards) return;

    const perView = getEventCardsPerView();
    const maxIndex = Math.max(0, totalCards - perView);
    eventCarouselIndex = Math.max(0, Math.min(maxIndex, eventCarouselIndex + direction));
    updateEventCarousel();
}

function initEventCarousel() {
    const prevBtn = document.getElementById('events-prev-bottom');
    const nextBtn = document.getElementById('events-next-bottom');
    const track = document.querySelector('#events-carousel-bottom .events-grid');
    if (!prevBtn || !nextBtn || !track) return;

    prevBtn.addEventListener('click', () => moveEventCarousel(-1));
    nextBtn.addEventListener('click', () => moveEventCarousel(1));
    window.addEventListener('resize', updateEventCarousel);
    updateEventCarousel();
}

function getCityCardsPerView() {
    if (window.innerWidth <= 768) return 1;
    if (window.innerWidth <= 1024) return 2;
    return 3;
}

function updateCityCarousel() {
    const track = document.querySelector('#cities-carousel .cities-grid');
    const cards = track ? Array.from(track.querySelectorAll('.city-card')) : [];
    const prevBtn = document.getElementById('cities-prev');
    const nextBtn = document.getElementById('cities-next');
    if (!track || !cards.length || !prevBtn || !nextBtn) return;

    const perView = getCityCardsPerView();
    const maxIndex = Math.max(0, cards.length - perView);
    cityCarouselIndex = Math.min(cityCarouselIndex, maxIndex);

    const gap = 18;
    const cardWidth = cards[0].getBoundingClientRect().width;
    const offset = cityCarouselIndex * (cardWidth + gap);
    track.style.transform = `translateX(-${offset}px)`;

    prevBtn.disabled = cityCarouselIndex === 0;
    nextBtn.disabled = cityCarouselIndex >= maxIndex;
}

function moveCityCarousel(direction) {
    const track = document.querySelector('#cities-carousel .cities-grid');
    const totalCards = track ? track.querySelectorAll('.city-card').length : 0;
    if (!totalCards) return;

    const perView = getCityCardsPerView();
    const maxIndex = Math.max(0, totalCards - perView);
    cityCarouselIndex = Math.max(0, Math.min(maxIndex, cityCarouselIndex + direction));
    updateCityCarousel();
}

function initCityCarousel() {
    const prevBtn = document.getElementById('cities-prev');
    const nextBtn = document.getElementById('cities-next');
    const track = document.querySelector('#cities-carousel .cities-grid');
    if (!prevBtn || !nextBtn || !track) return;

    prevBtn.addEventListener('click', () => moveCityCarousel(-1));
    nextBtn.addEventListener('click', () => moveCityCarousel(1));
    window.addEventListener('resize', updateCityCarousel);
    updateCityCarousel();
}

function fixTipIcons() {
    const icons = ["🌤️", "🎒", "🤝", "💳", "🚗", "📱"];
    document.querySelectorAll('.tips-grid .tip-icon span').forEach((icon, index) => {
        if (icons[index]) icon.textContent = icons[index];
    });
}

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
function toggleHomeChatbot(forceOpen = null) {
    const chatbot = document.getElementById('homeChatbot');
    if (!chatbot) return;

    const shouldOpen = forceOpen === null
        ? chatbot.classList.contains('collapsed')
        : forceOpen;

    chatbot.classList.toggle('collapsed', !shouldOpen);

    const toggle = chatbot.querySelector('.home-chatbot-toggle');
    if (toggle) toggle.textContent = shouldOpen ? '-' : '+';

    if (shouldOpen) {
        const input = document.getElementById('homeChatbotInput');
        if (input) input.focus();
    }
}

function openHomeChatbot() {
    toggleHomeChatbot(true);
}

function addHomeChatbotMessage(text, sender) {
    const container = document.getElementById('homeChatbotMessages');
    if (!container) return;

    const div = document.createElement('div');
    div.className = `home-chatbot-message ${sender}`;
    div.innerText = text;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
}

function showHomeChatbotTyping() {
    const container = document.getElementById('homeChatbotMessages');
    if (!container) return;

    homeChatbotTypingDiv = document.createElement('div');
    homeChatbotTypingDiv.className = 'home-chatbot-typing';
    homeChatbotTypingDiv.innerHTML = '<span></span><span></span><span></span>';
    container.appendChild(homeChatbotTypingDiv);
    container.scrollTop = container.scrollHeight;
}

function hideHomeChatbotTyping() {
    if (homeChatbotTypingDiv) {
        homeChatbotTypingDiv.remove();
        homeChatbotTypingDiv = null;
    }
}

async function sendHomeChatbotMessage() {
    const input = document.getElementById('homeChatbotInput');
    if (!input) return;

    const message = input.value.trim();
    if (!message) return;

    openHomeChatbot();
    addHomeChatbotMessage(message, 'user');
    input.value = '';
    showHomeChatbotTyping();

    const history = Array.from(document.querySelectorAll('#homeChatbotMessages .home-chatbot-message')).map((node) => ({
        role: node.classList.contains('user') ? 'user' : 'assistant',
        content: node.innerText.trim()
    })).filter((entry) => entry.content);

    let reply = 'Sorry, I could not generate a response.';

    try {
        const data = await ChatAPI.reply({
            message,
            history
        });
        reply = data?.reply || reply;
    } catch (_) {
        reply = "I'm sorry, I'm having trouble connecting right now. Please try again in a moment!";
    }

    hideHomeChatbotTyping();
    addHomeChatbotMessage(reply, 'bot');
}

window.toggleHomeChatbot = toggleHomeChatbot;
window.openHomeChatbot = openHomeChatbot;
window.sendHomeChatbotMessage = sendHomeChatbotMessage;

document.addEventListener('DOMContentLoaded', () => {
    loadFeaturedAttractions();
    loadFeaturedHotels();
    loadFeaturedRestaurants();
    initEventCarousel();
    initCityCarousel();
    fixTipIcons();
});
