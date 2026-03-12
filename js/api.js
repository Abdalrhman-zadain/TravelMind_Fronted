// ═══════════════════════════════════════════════
// TRAVELMIND — API HELPER
// ═══════════════════════════════════════════════

const API_BASE = 'https://localhost:7263/api';

// ── CORE FETCH ──────────────────────────────────
async function api(method, path, body = null) {
    const token = localStorage.getItem('tm_token');

    const options = {
        method,
        headers: { 'Content-Type': 'application/json' }
    };

    if (token) options.headers['Authorization'] = `Bearer ${token}`;
    if (body) options.body = JSON.stringify(body);

    try {
        const response = await fetch(API_BASE + path, options);

        if (response.status === 204) return [];
        if (!response.ok) {
            const error = await response.text();
            throw new Error(error || 'Something went wrong');
        }

        return await response.json();
    } catch (err) {
        console.error(`API Error [${method} ${path}]:`, err.message);
        throw err;
    }
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
