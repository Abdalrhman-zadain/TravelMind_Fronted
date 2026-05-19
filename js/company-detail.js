async function getIdFromQuery() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
}

function aEsc(v) { return String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'); }

function renderStats(container, item) {
    container.innerHTML = '';
    const stats = [
        { k: 'Tours', v: item.toursCount || 8 },
        { k: 'Years', v: item.experienceYears || 5 },
        { k: 'Languages', v: (item.languages || ['English']).join(', ') },
    ];
    stats.forEach(s => {
        const el = document.createElement('div'); el.className = 'stat'; el.textContent = `${s.v} ${s.k}`; container.appendChild(el);
    });
}

async function fetchDetail(id) {
    if (!window.AttractionsAPI || typeof AttractionsAPI.getById !== 'function') {
        // fallback to fetch
        const res = await fetch(`/api/attractions/${encodeURIComponent(id)}`);
        if (!res.ok) throw new Error('Failed to fetch');
        return res.json();
    }
    return AttractionsAPI.getById(id);
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
        document.getElementById('company-title').textContent = item.title || item.name || `Company ${id}`;
        document.getElementById('company-description').textContent = item.description || item.about || 'No description available.';
        document.getElementById('company-meta').textContent = `${item.city || item.location || ''} · ${item.rating ? item.rating.toFixed(1) + '★' : ''} · ${item.reviewCount || 0} reviews`;
        const hero = document.getElementById('company-hero');
        const img = item.image || (item.images && item.images[0]) || 'image/city/petra-world-heritage-jordan_16x9.avif';
        hero.style.backgroundImage = `linear-gradient(120deg, rgba(12,34,32,0.46), rgba(12,34,32,0.18)), url('${aEsc(img)}')`;
        renderStats(document.getElementById('company-stats'), item);

        // Tours placeholder: if item.tours exists, render cards
        const toursGrid = document.getElementById('tours-grid');
        if (Array.isArray(item.tours) && item.tours.length) {
            toursGrid.innerHTML = item.tours.map(t => `<article class="tour-card"><img src="${aEsc(t.image || img)}" alt="${aEsc(t.title)}" style="width:100%;height:120px;object-fit:cover;border-radius:8px;" /><h4>${aEsc(t.title)}</h4><p>${aEsc(t.summary || '')}</p><div><strong>From ${t.price ? '$' + t.price : 'TBD'}</strong></div></article>`).join('');
        } else {
            toursGrid.innerHTML = '<div class="empty-state"><p>No tours listed yet.</p></div>';
        }

        document.getElementById('book-now').addEventListener('click', () => {
            // navigate to trip planner with prefilled item
            location.href = `trip-planner.html?add=${encodeURIComponent(id)}`;
        });
        document.getElementById('chat-btn').addEventListener('click', () => { location.href = 'chatbot.html'; });
    } catch (e) {
        console.error(e);
        document.getElementById('company-description').textContent = 'Could not load company details.';
    }
}

document.addEventListener('DOMContentLoaded', initCompanyDetail);
