// ═══════════════════════════════════════════════
// TRAVELMIND — API HELPER
// ═══════════════════════════════════════════════

function normalizeBaseUrl(url) {
    if (!url || typeof url !== 'string') return '';
    return url.trim().replace(/\/+$/, '');
}

function ensureApiPath(url) {
    const normalized = normalizeBaseUrl(url);
    if (!normalized) return '';
    if (/\/api$/i.test(normalized)) return normalized;
    return `${normalized}/api`;
}

function resolveApiBases() {
    const fromWindow = ensureApiPath(window.TRAVELMIND_API_BASE);
    const fromStorage = ensureApiPath(localStorage.getItem('tm_api_base'));
    const fromOrigin = window.location?.origin && window.location.origin !== 'null'
        ? ensureApiPath(window.location.origin)
        : '';
    const fallbacks = [
        'http://localhost:3000/api',
        'https://localhost:3000/api',
        'https://localhost:55391/api',
        'http://localhost:55392/api',
        'https://localhost:7058/api',
        'http://localhost:5268/api'
    ];

    const ordered = [
        fromWindow,
        ...fallbacks,
        fromOrigin,
        fromStorage
    ].filter(Boolean);
    return [...new Set(ordered)];
}

let API_BASES = resolveApiBases();
let ACTIVE_API_BASE = API_BASES[0] || 'http://localhost:3000/api';

// Optional helper for quick environment switching from browser console.
window.setTravelMindApiBase = function setTravelMindApiBase(baseUrl) {
    if (!baseUrl || typeof baseUrl !== 'string') {
        throw new Error('Please provide a valid API base URL.');
    }

    const normalized = ensureApiPath(baseUrl);
    localStorage.setItem('tm_api_base', normalized);
    API_BASES = resolveApiBases();
    ACTIVE_API_BASE = API_BASES[0] || normalized;
    return normalized;
};

window.getTravelMindApiBase = function getTravelMindApiBase() {
    return ACTIVE_API_BASE;
};

window.resetTravelMindApiBase = function resetTravelMindApiBase() {
    localStorage.removeItem('tm_api_base');
    API_BASES = resolveApiBases();
    ACTIVE_API_BASE = API_BASES[0] || 'http://localhost:3000/api';
    return ACTIVE_API_BASE;
};

// ── CORE FETCH ──────────────────────────────────
async function api(method, path, body = null) {
    const token = localStorage.getItem('tm_token');

    const options = {
        method,
        headers: { 'Content-Type': 'application/json' }
    };

    if (token) options.headers['Authorization'] = `Bearer ${token}`;
    if (body) options.body = JSON.stringify(body);

    let lastError = null;

    for (const base of API_BASES) {
        try {
            const response = await fetch(base + path, options);

            if (response.status === 204) {
                ACTIVE_API_BASE = base;
                return [];
            }

            if (!response.ok) {
                const raw = await response.text();
                let message = raw;

                // Handle ASP.NET validation/problem details payloads when returned as JSON.
                try {
                    const parsed = JSON.parse(raw);
                    message = parsed.message || parsed.title || parsed.error || raw;
                } catch (_) {
                    // Keep original text when the response is plain text.
                }

                const httpError = new Error(message || 'Something went wrong');
                httpError.status = response.status;
                throw httpError;
            }

            ACTIVE_API_BASE = base;
            return await response.json();
        } catch (err) {
            lastError = err;

            // Try next URL for network failures and "wrong base" 404 responses.
            if (!(err instanceof TypeError) && err?.status !== 404) {
                break;
            }
        }
    }

    const message = lastError?.message || 'Unable to reach API.';
    console.error(`API Error [${method} ${path}]:`, message);
    throw lastError || new Error(message);
}

// ── AUTH ────────────────────────────────────────
const AuthAPI = {
    register: (data) => api('POST', '/auth/register', data),
    login: (data) => api('POST', '/auth/login', data),
};

// ── ATTRACTIONS ─────────────────────────────────
const AttractionsAPI = {
    getAll: () => api('GET', '/attractions'),
    getById: (id) => api('GET', `/attractions/${id}`),
    getByCity: (city) => api('GET', `/attractions/city/${city}`),
    getByCategory: (categoryId) => api('GET', `/attractions/category/${categoryId}`),
    create: (data) => api('POST', '/attractions', data),
    update: (id, data) => api('PUT', `/attractions/${id}`, data),
    delete: (id) => api('DELETE', `/attractions/${id}`),
};

// ── HOTELS ──────────────────────────────────────
const HotelsAPI = {
    getAll: () => api('GET', '/hotels'),
    getById: (id) => api('GET', `/hotels/${id}`),
    getByCity: (city) => api('GET', `/hotels/city/${city}`),
    getByStars: (stars) => api('GET', `/hotels/stars/${stars}`),
    create: (data) => api('POST', '/hotels', data),
    update: (id, data) => api('PUT', `/hotels/${id}`, data),
    delete: (id) => api('DELETE', `/hotels/${id}`),
};

// ── RESTAURANTS ─────────────────────────────────
const RestaurantsAPI = {
    getAll: () => api('GET', '/restaurants'),
    getById: (id) => api('GET', `/restaurants/${id}`),
    getByCity: (city) => api('GET', `/restaurants/city/${city}`),
    getByCuisine: (cuisine) => api('GET', `/restaurants/cuisine/${cuisine}`),
    create: (data) => api('POST', '/restaurants', data),
    update: (id, data) => api('PUT', `/restaurants/${id}`, data),
    delete: (id) => api('DELETE', `/restaurants/${id}`),
};

// ── CATEGORIES ──────────────────────────────────
const CategoriesAPI = {
    getAll: () => api('GET', '/categories'),
    getById: (id) => api('GET', `/categories/${id}`),
    getByType: (type) => api('GET', `/categories/type/${type}`),
    create: (data) => api('POST', '/categories', data),
    update: (id, data) => api('PUT', `/categories/${id}`, data),
    delete: (id) => api('DELETE', `/categories/${id}`),
};

// ── TRIPS ───────────────────────────────────────
const TripsAPI = {
    getAll: () => api('GET', '/trips'),
    getById: (id) => api('GET', `/trips/${id}`),
    getByUser: (userId) => api('GET', `/trips/user/${userId}`),
    create: (data) => api('POST', '/trips', data),
    update: (id, data) => api('PUT', `/trips/${id}`, data),
    delete: (id) => api('DELETE', `/trips/${id}`),
};

// ── EXPENSES ────────────────────────────────────
const ExpensesAPI = {
    getByUser: (userId) => api('GET', `/expenses/user/${userId}`),
    getByTrip: (tripId) => api('GET', `/expenses/trip/${tripId}`),
    getById: (id) => api('GET', `/expenses/${id}`),
    create: (data) => api('POST', '/expenses', data),
    update: (id, data) => api('PUT', `/expenses/${id}`, data),
    delete: (id) => api('DELETE', `/expenses/${id}`),
};

// ── JOURNALS ────────────────────────────────────
const JournalsAPI = {
    getByUser: (userId) => api('GET', `/journals/user/${userId}`),
    getById: (id) => api('GET', `/journals/${id}`),
    create: (data) => api('POST', '/journals', data),
    update: (id, data) => api('PUT', `/journals/${id}`, data),
    delete: (id) => api('DELETE', `/journals/${id}`),
};

// ── REVIEWS ─────────────────────────────────────
const ReviewsAPI = {
    getByPlace: (type, id) => api('GET', `/reviews/place/${type}/${id}`),
    getByUser: (userId) => api('GET', `/reviews/user/${userId}`),
    create: (data) => api('POST', '/reviews', data),
    delete: (id) => api('DELETE', `/reviews/${id}`),
};

// ── CHAT ────────────────────────────────────────
const ChatAPI = {
    getHistory: (userId) => api('GET', `/chat/user/${userId}`),
    sendMessage: (data) => api('POST', '/chat', data),
    clearHistory: (userId) => api('DELETE', `/chat/user/${userId}`),
};
