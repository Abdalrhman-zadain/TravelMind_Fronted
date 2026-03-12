// ═══════════════════════════════════════════════
// TRAVELMIND — SHARED APP LOGIC
// ═══════════════════════════════════════════════

// ── TRANSLATIONS ────────────────────────────────
const translations = {
  en: {
    'nav.home': 'Home',
    'nav.attractions': 'Attractions',
    'nav.hotels': 'Hotels',
    'nav.restaurants': 'Restaurants',
    'nav.tripPlanner': 'Trip Planner',
    'nav.chatbot': 'AI Chatbot',
    'nav.login': 'Login',
    'nav.register': 'Register',
    'nav.logout': 'Logout',
    'hero.tag': '🇯🇴 Discover Jordan',
    'hero.title': 'Explore the<br /><em>Wonders</em> of<br />Jordan',
    'hero.desc': 'From the rose-red city of Petra to the stunning Wadi Rum desert — plan your perfect Jordan adventure with TravelMind.',
    'hero.explore': 'Explore Now',
    'hero.planTrip': 'Plan a Trip',
    'hero.statAttractions': 'Attractions',
    'hero.statHotels': 'Hotels',
    'hero.statRestaurants': 'Restaurants',
    'events.tag': "What's Coming",
    'events.title': 'Upcoming <em>Events</em>',
    'events.desc': "Don't miss Jordan's most exciting cultural festivals and gatherings.",
    'attractions.tag': 'Must Visit',
    'attractions.title': 'Top <em>Attractions</em>',
    'attractions.desc': "Discover Jordan's most iconic landmarks and hidden gems.",
    'cities.tag': 'Explore By City',
    'cities.title': 'Popular <em>Destinations</em>',
    'gallery.tag': 'Visual Journey',
    'gallery.title': 'Jordan in <em>Photos</em>',
    'hotels.homeTag': 'Stay in Comfort',
    'hotels.homeTitle': 'Top <em>Hotels</em>',
    'hotels.homeDesc': 'Find the perfect accommodation for your Jordan adventure.',
    'restaurants.homeTag': 'Taste Jordan',
    'restaurants.homeTitle': 'Top <em>Restaurants</em>',
    'restaurants.homeDesc': 'Savor the best Jordanian cuisine — from mansaf to knafeh.',
    'testimonials.tag': 'Traveler Stories',
    'testimonials.title': 'What People <em>Say</em>',
    'why.tag': 'Why TravelMind',
    'why.title': 'Everything You Need to<br /><em>Explore Jordan</em>',
    'tips.tag': 'Travel Smart',
    'tips.title': 'Essential <em>Travel Tips</em>',
    'cta.title': 'Ready to Explore <em>Jordan</em>?',
    'cta.desc': 'Build your perfect itinerary with our smart trip planner. Add attractions, hotels, and restaurants — all in one place.',
    'cta.start': 'Start Planning →',
    'cta.askAI': 'Ask AI Assistant',
    'newsletter.title': 'Stay in the Loop 🇯🇴',
    'newsletter.desc': 'Get the latest travel tips, hidden gems, and exclusive deals for Jordan delivered to your inbox.',
    'newsletter.placeholder': 'Enter your email address',
    'newsletter.btn': 'Subscribe',
    'footer.explore': 'Explore',
    'footer.plan': 'Plan',
    'footer.account': 'Account',
    'footer.desc': 'Your ultimate guide to exploring the beautiful Kingdom of Jordan. Discover, plan, and experience Jordan like never before.',
    'footer.rights': '© 2025 TravelMind Jordan. All rights reserved.',
    'footer.made': 'Made with ❤️ for Jordan 🇯🇴',
    'common.viewAll': 'View All →',
    'common.loading': 'Loading...',
    // Page headers
    'hotels.pageTag': '🏨 Accommodations',
    'hotels.pageTitle': 'Find Your Perfect <em>Hotel</em>',
    'hotels.pageDesc': 'From luxury resorts by the Dead Sea to budget-friendly stays in Amman — discover the best places to stay in Jordan.',
    'attractions.pageTag': '🏛️ Explore Jordan',
    'attractions.pageTitle': 'Discover <em>Attractions</em>',
    'attractions.pageDesc': "From ancient Petra to the stunning Wadi Rum — explore Jordan's top attractions and hidden gems.",
    'restaurants.pageTag': '🍽️ Dining',
    'restaurants.pageTitle': 'Discover <em>Restaurants</em>',
    'restaurants.pageDesc': 'From traditional Jordanian mansaf to international cuisine — find the best dining in Jordan.',
    'tripPlanner.pageTag': '📋 Plan Your Trip',
    'tripPlanner.pageTitle': 'Your Jordan <em>Trip Planner</em>',
    'tripPlanner.pageDesc': 'Create, manage and track your Jordan trips — all in one place.',
    'chatbot.sidebarTitle': 'Quick Questions',
    'chatbot.clearBtn': '🗑️ Clear Chat',
    'chatbot.inputPlaceholder': 'Ask me anything about Jordan...',
    'chatbot.inputHint': 'Press Enter to send • Shift+Enter for new line',
  },
  ar: {
    'nav.home': 'الرئيسية',
    'nav.attractions': 'المعالم السياحية',
    'nav.hotels': 'الفنادق',
    'nav.restaurants': 'المطاعم',
    'nav.tripPlanner': 'مخطط الرحلات',
    'nav.chatbot': 'المساعد الذكي',
    'nav.login': 'تسجيل الدخول',
    'nav.register': 'إنشاء حساب',
    'nav.logout': 'تسجيل الخروج',
    'hero.tag': '🇯🇴 اكتشف الأردن',
    'hero.title': 'استكشف<br /><em>عجائب</em><br />الأردن',
    'hero.desc': 'من مدينة البتراء الوردية إلى صحراء وادي رم الساحرة — خطط لمغامرتك المثالية في الأردن مع TravelMind.',
    'hero.explore': 'استكشف الآن',
    'hero.planTrip': 'خطط لرحلتك',
    'hero.statAttractions': 'معالم سياحية',
    'hero.statHotels': 'فنادق',
    'hero.statRestaurants': 'مطاعم',
    'events.tag': 'قادم قريباً',
    'events.title': 'الفعاليات <em>القادمة</em>',
    'events.desc': 'لا تفوت أهم المهرجانات والفعاليات الثقافية في الأردن.',
    'attractions.tag': 'يجب زيارتها',
    'attractions.title': 'أفضل <em>المعالم السياحية</em>',
    'attractions.desc': 'اكتشف أشهر معالم الأردن والجواهر الخفية.',
    'cities.tag': 'استكشف حسب المدينة',
    'cities.title': 'الوجهات <em>الشائعة</em>',
    'gallery.tag': 'رحلة بصرية',
    'gallery.title': 'الأردن في <em>صور</em>',
    'hotels.homeTag': 'إقامة مريحة',
    'hotels.homeTitle': 'أفضل <em>الفنادق</em>',
    'hotels.homeDesc': 'اعثر على الإقامة المثالية لمغامرتك في الأردن.',
    'restaurants.homeTag': 'تذوق الأردن',
    'restaurants.homeTitle': 'أفضل <em>المطاعم</em>',
    'restaurants.homeDesc': 'استمتع بأفضل المأكولات الأردنية — من المنسف إلى الكنافة.',
    'testimonials.tag': 'قصص المسافرين',
    'testimonials.title': 'ماذا يقول <em>الناس</em>',
    'why.tag': 'لماذا TravelMind',
    'why.title': 'كل ما تحتاجه<br /><em>لاستكشاف الأردن</em>',
    'tips.tag': 'سافر بذكاء',
    'tips.title': 'نصائح <em>سفر أساسية</em>',
    'cta.title': 'مستعد لاستكشاف <em>الأردن</em>؟',
    'cta.desc': 'أنشئ خط سير رحلتك المثالي باستخدام مخطط الرحلات الذكي. أضف المعالم السياحية والفنادق والمطاعم — كل ذلك في مكان واحد.',
    'cta.start': '← ابدأ التخطيط',
    'cta.askAI': 'اسأل المساعد الذكي',
    'newsletter.title': 'ابقَ على اطلاع 🇯🇴',
    'newsletter.desc': 'احصل على أحدث نصائح السفر والجواهر الخفية والعروض الحصرية للأردن.',
    'newsletter.placeholder': 'أدخل بريدك الإلكتروني',
    'newsletter.btn': 'اشترك',
    'footer.explore': 'استكشف',
    'footer.plan': 'تخطيط',
    'footer.account': 'الحساب',
    'footer.desc': 'دليلك الشامل لاستكشاف المملكة الأردنية الهاشمية الجميلة. اكتشف، خطط، وعش التجربة.',
    'footer.rights': '© 2025 TravelMind الأردن. جميع الحقوق محفوظة.',
    'footer.made': 'صنع بـ ❤️ للأردن 🇯🇴',
    'common.viewAll': '← عرض الكل',
    'common.loading': 'جارٍ التحميل...',
    'hotels.pageTag': '🏨 أماكن الإقامة',
    'hotels.pageTitle': 'اعثر على <em>فندقك</em> المثالي',
    'hotels.pageDesc': 'من المنتجعات الفاخرة على البحر الميت إلى الإقامة الاقتصادية في عمان — اكتشف أفضل أماكن الإقامة في الأردن.',
    'attractions.pageTag': '🏛️ استكشف الأردن',
    'attractions.pageTitle': 'اكتشف <em>المعالم السياحية</em>',
    'attractions.pageDesc': 'من البتراء القديمة إلى وادي رم الساحر — استكشف أفضل المعالم السياحية والجواهر الخفية في الأردن.',
    'restaurants.pageTag': '🍽️ تناول الطعام',
    'restaurants.pageTitle': 'اكتشف <em>المطاعم</em>',
    'restaurants.pageDesc': 'من المنسف الأردني التقليدي إلى المأكولات العالمية — اعثر على أفضل المطاعم في الأردن.',
    'tripPlanner.pageTag': '📋 خطط لرحلتك',
    'tripPlanner.pageTitle': 'مخطط <em>رحلاتك</em> في الأردن',
    'tripPlanner.pageDesc': 'أنشئ وأدر وتابع رحلاتك في الأردن — كل ذلك في مكان واحد.',
    'chatbot.sidebarTitle': 'أسئلة سريعة',
    'chatbot.clearBtn': '🗑️ مسح المحادثة',
    'chatbot.inputPlaceholder': 'اسألني أي شيء عن الأردن...',
    'chatbot.inputHint': 'اضغط Enter للإرسال • Shift+Enter لسطر جديد',
  }
};

// ── LANGUAGE TOGGLE ─────────────────────────────
function getCurrentLang() {
  return localStorage.getItem('tm_lang') || 'en';
}

function toggleLanguage() {
  const current = getCurrentLang();
  const newLang = current === 'en' ? 'ar' : 'en';
  localStorage.setItem('tm_lang', newLang);
  applyLanguage(newLang);
}

function applyLanguage(lang) {
  const t = translations[lang];

  // Update lang button label
  const langLabel = document.getElementById('lang-label');
  if (langLabel) {
    langLabel.textContent = lang === 'en' ? 'عربي' : 'EN';
  }

  // Update all data-i18n elements
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (t[key]) {
      el.innerHTML = t[key];
    }
  });

  // Update data-i18n-placeholder elements
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (t[key]) {
      el.placeholder = t[key];
    }
  });

  // Update direction and lang attribute
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.body.style.direction = lang === 'ar' ? 'rtl' : 'ltr';
  document.body.style.textAlign = lang === 'ar' ? 'right' : 'left';
}

// ── NAVBAR SCROLL ───────────────────────────────
window.addEventListener('scroll', () => {
  const navbar = document.getElementById('navbar');
  if (navbar) {
    navbar.classList.toggle('scrolled', window.scrollY > 20);
  }
});

// ── AUTH STATE ──────────────────────────────────
function getUser() {
  const user = localStorage.getItem('tm_user');
  return user ? JSON.parse(user) : null;
}

function isLoggedIn() {
  return !!localStorage.getItem('tm_token');
}

function logout() {
  localStorage.removeItem('tm_token');
  localStorage.removeItem('tm_user');
  location.href = 'index.html';
}

function updateNavbar() {
  const navActions = document.getElementById('nav-actions');
  if (!navActions) return;

  const user = getUser();
  if (user) {
    const lang = getCurrentLang();
    const t = translations[lang];
    navActions.innerHTML = `
      <button class="btn-lang" onclick="toggleLanguage()" title="Switch Language">
        <span id="lang-label">${lang === 'en' ? 'عربي' : 'EN'}</span>
      </button>
      <span class="nav-user-name">👋 ${user.name}</span>
      <button class="btn btn-ghost btn-sm" onclick="logout()" data-i18n="nav.logout">${t['nav.logout']}</button>
    `;
  }
}

// ── TOAST ───────────────────────────────────────
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span>${icons[type]}</span> ${message}`;
  container.appendChild(toast);

  setTimeout(() => toast.remove(), 3500);
}

// ── STAR RATING ─────────────────────────────────
function renderStars(rating) {
  const full = Math.floor(rating);
  const empty = 5 - full;
  return '★'.repeat(full) + '☆'.repeat(empty);
}

// ── RENDER ATTRACTION CARD ──────────────────────
function renderAttractionCard(a) {
  return `
    <div class="card" onclick="location.href='attractions.html?id=${a.id}'">
      <div class="card-image-placeholder">🏛️</div>
      <div class="card-body">
        <span class="card-tag">Attraction</span>
        <div class="card-title">${a.nameEn}</div>
        <div class="card-desc">${a.city} • ${a.descriptionEn ? a.descriptionEn.substring(0, 80) + '...' : 'Discover this amazing place'}</div>
      </div>
      <div class="card-footer">
        <div class="card-rating">
          <span class="star">${renderStars(a.rating || 0)}</span>
          ${a.rating || '0.0'}
        </div>
        <div class="card-price">${a.entryFee > 0 ? a.entryFee + ' JOD' : 'Free'}</div>
      </div>
    </div>
  `;
}

// ── RENDER HOTEL CARD ───────────────────────────
function renderHotelCard(h) {
  const stars = '⭐'.repeat(h.stars || 3);
  return `
    <div class="card" onclick="location.href='hotels.html?id=${h.id}'">
      <div class="card-image-placeholder">🏨</div>
      <div class="card-body">
        <span class="card-tag">${stars}</span>
        <div class="card-title">${h.nameEn}</div>
        <div class="card-desc">${h.city} • ${h.descriptionEn ? h.descriptionEn.substring(0, 80) + '...' : 'Comfortable stay awaits'}</div>
      </div>
      <div class="card-footer">
        <div class="card-rating">
          <span class="star">${renderStars(h.rating || 0)}</span>
          ${h.rating || '0.0'}
        </div>
        <div class="card-price">${h.pricePerNight} JOD/night</div>
      </div>
    </div>
  `;
}

// ── RENDER RESTAURANT CARD ──────────────────────
function renderRestaurantCard(r) {
  return `
    <div class="card" onclick="location.href='restaurants.html?id=${r.id}'">
      <div class="card-image-placeholder">🍽️</div>
      <div class="card-body">
        <span class="card-tag">${r.cuisine || 'Restaurant'}</span>
        <div class="card-title">${r.nameEn}</div>
        <div class="card-desc">${r.city} • ${r.descriptionEn ? r.descriptionEn.substring(0, 80) + '...' : 'Great food awaits'}</div>
      </div>
      <div class="card-footer">
        <div class="card-rating">
          <span class="star">${renderStars(r.rating || 0)}</span>
          ${r.rating || '0.0'}
        </div>
        <div class="card-price">${r.priceRange || '$$'}</div>
      </div>
    </div>
  `;
}

// ── INIT ────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  updateNavbar();
  applyLanguage(getCurrentLang());
});