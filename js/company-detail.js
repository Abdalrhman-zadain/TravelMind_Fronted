async function getIdFromQuery() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
}

function aEsc(v) { return String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'); }

function renderStats(container, item) {
    container.innerHTML = '';
    const stats = [
        { k: 'Tours', v: item.tours ? item.tours.length : (item.toursCount || '—') },
        { k: 'Years', v: item.experienceYears || '—' },
        { k: 'Languages', v: (item.languages || ['English']).join(', ') },
    ];
    stats.forEach(s => {
        const el = document.createElement('div'); el.className = 'stat'; el.textContent = `${s.v} ${s.k}`; container.appendChild(el);
    });
}

async function fetchDetail(id) {
    // prefer the richer detail endpoint when available
    try {
        const res = await fetch(`/api/attractions/${encodeURIComponent(id)}/detail`);
        if (res.ok) return res.json();
    } catch (e) {
        // ignore and fallback
    }

    if (!window.AttractionsAPI || typeof AttractionsAPI.getById !== 'function') {
        const res = await fetch(`/api/attractions/${encodeURIComponent(id)}`);
        if (!res.ok) throw new Error('Failed to fetch');
        return res.json();
    }
    return AttractionsAPI.getById(id);
}

function switchTab(selectedId) {
    const tabs = document.querySelectorAll('.company-tabs [role="tab"]');
    tabs.forEach(t => {
        const panel = document.getElementById(t.getAttribute('aria-controls'));
        const sel = t.id === selectedId + '-btn' || t.getAttribute('aria-controls') === selectedId;
        t.setAttribute('aria-selected', sel ? 'true' : 'false');
        if (panel) panel.hidden = !sel;
    });
}

function renderBadges(container, badges) {
    container.innerHTML = '';
    (badges || []).forEach(b => {
        const el = document.createElement('span'); el.className = 'badge'; el.textContent = b; container.appendChild(el);
    });
}

function renderGallery(container, images) {
    container.innerHTML = '';
    (images || []).slice(0, 6).forEach(src => {
        const img = document.createElement('img'); img.src = src; img.alt = ''; img.loading = 'lazy'; container.appendChild(img);
    });
}

function renderToursGrid(container, tours, fallbackImg) {
    container.innerHTML = '';
    if (!Array.isArray(tours) || !tours.length) {
        container.innerHTML = '<div class="empty-state"><p>No tours listed yet.</p></div>';
        return;
    }
    tours.forEach(t => {
        const art = document.createElement('article'); art.className = 'tour-card';
        art.innerHTML = `<img src="${aEsc(t.image || fallbackImg)}" alt="${aEsc(t.title)}" loading="lazy"><h4>${aEsc(t.title)}</h4><p>${aEsc(t.summary || '')}</p><div class="tour-meta"><strong>From ${t.price ? '$' + t.price : 'TBD'}</strong></div>`;
        container.appendChild(art);
    });
}

function initMapPlaceholder(containerId, coords, title) {
    const el = document.getElementById(containerId);
    if (!el) return;
    if (window.L) {
        try {
            el.innerHTML = '';
            const map = L.map(containerId).setView([coords.lat || 0, coords.lng || 0], 13);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap contributors' }).addTo(map);
            L.marker([coords.lat || 0, coords.lng || 0]).addTo(map).bindPopup(title || 'Location');
        } catch (e) {
            el.textContent = 'Map failed to initialize.';
        }
    } else {
        el.textContent = 'Map not available (Leaflet not loaded).';
    }
}

function renderReviews(container, reviews) {
    container.innerHTML = '';
    if (!Array.isArray(reviews) || !reviews.length) { container.innerHTML = '<p>No reviews yet.</p>'; return; }
    reviews.forEach(r => {
        const d = document.createElement('div'); d.className = 'review-card';
        d.innerHTML = `<div class="review-header"><strong>${aEsc(r.user || 'Guest')}</strong> · <span>${r.rating || 5}★</span></div><p>${aEsc(r.text || '')}</p>`;
        container.appendChild(d);
    });
}

async function initCompanyDetail() {
    const id = await getIdFromQuery();
    if (!id) {
        document.getElementById('company-title').textContent = 'No company selected';
        return;
    }
    try {
        const raw = await fetchDetail(id);
        const item = raw || {};
        const title = item.title || item.nameEn || item.name || `Company ${id}`;
        const desc = item.description || item.about || 'No description available.';
        const imgUrl = item.image || (item.images && item.images[0]) || 'image/city/petra-world-heritage-jordan_16x9.avif';
        
        document.getElementById('company-title').textContent = title;
        document.getElementById('company-description').textContent = desc;
        document.getElementById('overview-text').textContent = item.longDescription || item.description || '';
        document.getElementById('company-meta').textContent = `${item.city || item.location || ''} · ${item.rating ? item.rating.toFixed(1) + '★' : ''} · ${item.reviewCount || 0} reviews`;

        // Update OG meta tags for SEO
        document.querySelector('meta[property="og:title"]').content = title;
        document.querySelector('meta[property="og:description"]').content = desc;
        document.querySelector('meta[property="og:image"]').content = imgUrl;
        document.querySelector('meta[property="og:url"]').content = window.location.href;
        document.querySelector('meta[name="description"]').content = desc;
        document.querySelector('meta[name="twitter:title"]').content = title;
        document.querySelector('meta[name="twitter:description"]').content = desc;
        document.querySelector('meta[name="twitter:image"]').content = imgUrl;
        document.title = title;

        const hero = document.getElementById('company-hero');
        hero.style.backgroundImage = `linear-gradient(120deg, rgba(12,34,32,0.46), rgba(12,34,32,0.18)), url('${aEsc(imgUrl)}')`;

        renderStats(document.getElementById('company-stats'), item);
        renderBadges(document.getElementById('company-badges'), item.badges || []);
        renderGallery(document.getElementById('company-gallery'), item.images || [imgUrl]);

        // Tours
        renderToursGrid(document.getElementById('tours-grid'), item.tours || [], imgUrl);
        // Related
        renderToursGrid(document.getElementById('related-grid'), item.related || [], imgUrl);

        // Packages / Transport placeholders
        document.getElementById('packages-list').textContent = (item.packages && item.packages.length) ? '' : 'No packages available.';
        document.getElementById('transport-list').textContent = (item.transport && item.transport.length) ? '' : 'No transport options.';

        // Map with Leaflet
        if (item.latitude && item.longitude) {
            initMapPlaceholder('map', { lat: item.latitude, lng: item.longitude }, item.nameEn || item.title || item.name);
        }

        // Reviews
        document.getElementById('reviews-summary').textContent = item.reviewSummary || '';
        renderReviews(document.getElementById('reviews-list'), item.reviews || []);
        // show add-review if logged in (simple heuristic)
        const addReviewForm = document.getElementById('add-review-form');
        if (window.currentUser) addReviewForm.hidden = false;

        // Tabs wiring
        document.querySelectorAll('.company-tabs [role="tab"]').forEach(btn => {
            btn.addEventListener('click', () => switchTab(btn.getAttribute('aria-controls')));
        });

        // CTA actions
        document.getElementById('book-now').addEventListener('click', () => { location.href = `trip-planner.html?add=${encodeURIComponent(id)}`; });
        document.getElementById('book-now-cta').addEventListener('click', () => { location.href = `trip-planner.html?add=${encodeURIComponent(id)}`; });
        document.getElementById('chat-btn').addEventListener('click', () => { location.href = 'chatbot.html'; });

        // Favorite toggle
        const favBtn = document.getElementById('fav-btn');
        async function refreshFavoriteState() {
            try {
                const uid = window.currentUser?.id || 0;
                if (!uid) return;
                const res = await fetch(`/api/users/${uid}/favorites`);
                if (!res.ok) return;
                const list = await res.json();
                const isFav = Array.isArray(list) && list.indexOf(Number(id)) !== -1;
                favBtn.setAttribute('aria-pressed', isFav ? 'true' : 'false');
            } catch (e) { /* ignore */ }
        }

        favBtn.addEventListener('click', async () => {
            const isFav = favBtn.getAttribute('aria-pressed') === 'true';
            favBtn.setAttribute('aria-pressed', (!isFav).toString());
            favBtn.textContent = !isFav ? '♥' : '♡';
            const payload = { attractionId: id, favorite: !isFav };
            if (window.currentUser && window.currentUser.id) payload.userId = window.currentUser.id;
            try {
                const headers = { 'Content-Type': 'application/json' };
                const token = localStorage.getItem('tm_token');
                if (token) headers['Authorization'] = `Bearer ${token}`;
                const res = await fetch('/api/favorites', { method: 'POST', headers, body: JSON.stringify(payload) });
                if (res.ok) {
                    await refreshFavoriteState();
                }
            } catch (e) { /* ignore */ }
        });
        // initial state
        async function setInitialFavoriteIcon() {
            await refreshFavoriteState();
            const isFav = favBtn.getAttribute('aria-pressed') === 'true';
            favBtn.textContent = isFav ? '♥' : '♡';
        }
        setInitialFavoriteIcon();

        // Share
        const shareBtn = document.getElementById('share-btn');
        shareBtn.addEventListener('click', async () => {
            const url = location.href;
            if (navigator.share) {
                try { await navigator.share({ title: item.title || 'Attraction', url }); } catch (e) { /* cancelled */ }
            } else {
                await navigator.clipboard.writeText(url);
                alert('Link copied to clipboard');
            }
        });

        // Review submit
        addReviewForm.addEventListener('submit', async (ev) => {
            ev.preventDefault();
            const rating = document.getElementById('review-rating').value;
            const text = document.getElementById('review-text').value;
            try {
                const headers = { 'Content-Type': 'application/json' };
                const token = localStorage.getItem('tm_token');
                if (token) headers['Authorization'] = `Bearer ${token}`;
                const res = await fetch(`/api/attractions/${encodeURIComponent(id)}/reviews`, { method: 'POST', headers, body: JSON.stringify({ rating: Number(rating), text }) });
                if (res.ok) {
                    const created = await res.json();
                    renderReviews(document.getElementById('reviews-list'), [created].concat(item.reviews || []));
                    addReviewForm.reset();
                } else alert('Failed to submit review');
            } catch (e) { alert('Failed to submit review'); }
        });

    } catch (e) {
        console.error(e);
        document.getElementById('company-description').textContent = 'Could not load company details.';
    }
}

document.addEventListener('DOMContentLoaded', initCompanyDetail);
