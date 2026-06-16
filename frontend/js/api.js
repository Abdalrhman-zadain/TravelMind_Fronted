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

// —— PHOTOS ———————————————————————————————————————
const PhotosAPI = {
    getAll: ({ location = '', category = '', limit = 30 } = {}) => {
        const params = new URLSearchParams();
        if (location) params.set('location', location);
        if (category) params.set('category', category);
        if (limit) params.set('limit', String(limit));
        const query = params.toString();
        return api('GET', `/photos${query ? `?${query}` : ''}`);
    },
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

const CompaniesAPI = {
    getAll: () => api('GET', '/companies'),
    getBySlug: (slug) => api('GET', `/companies/${slug}`),
    getById: (id) => api('GET', `/companies/id/${id}`),
};

const ToursAPI = {
    getAll: () => api('GET', '/tours'),
    getById: (id) => api('GET', `/tours/${id}`),
};

const PackagesAPI = {
    getAll: () => api('GET', '/packages'),
    getById: (id) => api('GET', `/packages/${id}`),
};

const TransportAPI = {
    getAll: () => api('GET', '/transport'),
    getById: (id) => api('GET', `/transport/${id}`),
};

const BookingsAPI = {
    getAll: () => api('GET', '/bookings'),
    getByCompany: (companyId) => api('GET', `/bookings/company/${companyId}`),
};

const UsersAPI = {
    getAll: () => api('GET', '/users'),
};

const AiTripPlansAPI = {
    getByUser: (userId) => api('GET', `/ai-plans/user/${userId}`),
    getById: (id) => api('GET', `/ai-plans/${id}`),
    create: (data) => api('POST', '/ai-plans', data),
    update: (id, data) => api('PUT', `/ai-plans/${id}`, data),
    delete: (id) => api('DELETE', `/ai-plans/${id}`),
};

const AnalyticsAPI = {
    getOwner: (companyId, params = {}) => {
        const query = new URLSearchParams();
        if (params.from) query.set('from', params.from);
        if (params.to) query.set('to', params.to);
        return api('GET', `/analytics/owner/${companyId}${query.toString() ? `?${query.toString()}` : ''}`);
    },
    getAdmin: (params = {}) => {
        const query = new URLSearchParams();
        if (params.from) query.set('from', params.from);
        if (params.to) query.set('to', params.to);
        return api('GET', `/analytics/admin${query.toString() ? `?${query.toString()}` : ''}`);
    },
    getCompanyRecords: (companyId) => api('GET', `/analytics/company/${companyId}/records`),
};

const DashboardNotificationsAPI = {
    getAll: ({ companyId = '', userId = '', role = '' } = {}) => {
        const query = new URLSearchParams();
        if (companyId) query.set('companyId', companyId);
        if (userId) query.set('userId', userId);
        if (role) query.set('role', role);
        return api('GET', `/dashboard-notifications${query.toString() ? `?${query.toString()}` : ''}`);
    },
    create: (data) => api('POST', '/dashboard-notifications', data),
    markRead: (id, isRead = true) => api('PATCH', `/dashboard-notifications/${id}/read`, { isRead }),
};

const TravelerStoriesAPI = {
    getAll: ({ destination = '', tag = '' } = {}) => {
        const query = new URLSearchParams();
        if (destination) query.set('destination', destination);
        if (tag) query.set('tag', tag);
        return api('GET', `/traveler-stories${query.toString() ? `?${query.toString()}` : ''}`);
    },
    getMine: (userId) => api('GET', `/traveler-stories/mine/${userId}`),
    getById: (id) => api('GET', `/traveler-stories/${id}`),
    create: (data) => api('POST', '/traveler-stories', data),
    update: (id, data) => api('PUT', `/traveler-stories/${id}`, data),
    delete: (id) => api('DELETE', `/traveler-stories/${id}`),
    incrementView: (id) => api('POST', `/traveler-stories/${id}/view`),
    interact: (id, data) => api('POST', `/traveler-stories/${id}/interactions`, data),
    adminGetAll: () => api('GET', '/admin/traveler-stories'),
    adminUpdateStatus: (id, data) => api('PATCH', `/admin/traveler-stories/${id}/status`, data),
};

const CertifiedGuidesAPI = {
    getAll: ({ attractionId = '', companyId = '', language = '', availability = '', minRating = '' } = {}) => {
        const query = new URLSearchParams();
        if (attractionId) query.set('attractionId', attractionId);
        if (companyId) query.set('companyId', companyId);
        if (language) query.set('language', language);
        if (availability) query.set('availability', availability);
        if (minRating) query.set('minRating', minRating);
        return api('GET', `/certified-guides${query.toString() ? `?${query.toString()}` : ''}`);
    },
    getById: (id) => api('GET', `/certified-guides/${id}`),
    create: (data) => api('POST', '/certified-guides', data),
};

const GuideBookingsAPI = {
    getAll: ({ guideId = '', userId = '' } = {}) => {
        const query = new URLSearchParams();
        if (guideId) query.set('guideId', guideId);
        if (userId) query.set('userId', userId);
        return api('GET', `/guide-bookings${query.toString() ? `?${query.toString()}` : ''}`);
    },
    create: (data) => api('POST', '/guide-bookings', data),
};

const CheckoutOrdersAPI = {
    getAll: ({ userId = '', companyId = '' } = {}) => {
        const query = new URLSearchParams();
        if (userId) query.set('userId', userId);
        if (companyId) query.set('companyId', companyId);
        return api('GET', `/checkout-orders${query.toString() ? `?${query.toString()}` : ''}`);
    },
    getById: (id) => api('GET', `/checkout-orders/${id}`),
    create: (data) => api('POST', '/checkout-orders', data),
    updateStatus: (id, data) => api('PATCH', `/checkout-orders/${id}/status`, data),
};

const PaymentTransactionsAPI = {
    getByOrder: (checkoutOrderId) => api('GET', `/payment-transactions/order/${checkoutOrderId}`),
    create: (data) => api('POST', '/payment-transactions', data),
};

const CompanyChatAPI = {
    getByCompany: (companyId, { userId = '' } = {}) => {
        const query = new URLSearchParams();
        if (userId) query.set('userId', userId);
        return api('GET', `/company-chat/${companyId}${query.toString() ? `?${query.toString()}` : ''}`);
    },
    create: (data) => api('POST', '/company-chat', data),
    markRead: (id, isRead = true) => api('PATCH', `/company-chat/${id}/read`, { isRead }),
};
