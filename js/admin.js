// ════════════════════════════════════════════════════════════════════════════════
// ADMIN PAGE LOGIC
// ════════════════════════════════════════════════════════════════════════════════

const adminState = {
    attractions: [],
    filtered: [],
    currentEditId: null,
    currentPage: 1,
    itemsPerPage: 10,
    isLoading: false,
};

// ── AUTH CHECK ──────────────────────────────────────────────────────────────────
async function checkAdminAuth() {
    try {
        const token = localStorage.getItem('tm_token');
        if (!token) {
            location.href = 'auth.html?redirect=admin.html';
            return false;
        }

        // Verify token is still valid by making a simple API call
        const res = await fetch('/api/health', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) {
            localStorage.removeItem('tm_token');
            location.href = 'auth.html?redirect=admin.html';
            return false;
        }

        return true;
    } catch (e) {
        console.error('Auth check failed:', e);
        location.href = 'auth.html?redirect=admin.html';
        return false;
    }
}

function handleLogout() {
    localStorage.removeItem('tm_token');
    localStorage.removeItem('tm_user');
    location.href = 'auth.html';
}

// ── SECTION NAVIGATION ──────────────────────────────────────────────────────────
function showSection(sectionName) {
    document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
    document.getElementById(`section-${sectionName}`).classList.add('active');

    document.querySelectorAll('.admin-nav-item').forEach(item => {
        item.classList.toggle('active', item.dataset.section === sectionName);
    });

    if (sectionName === 'list') {
        loadAttractions();
    } else if (sectionName === 'create') {
        resetForm();
    }
}

// ── FORM MANAGEMENT ─────────────────────────────────────────────────────────────
function resetForm() {
    adminState.currentEditId = null;
    document.getElementById('attraction-form').reset();
    document.getElementById('attr-id').value = '';
    document.getElementById('form-title').textContent = 'Add New Attraction';
    document.getElementById('submit-btn').textContent = 'Create Attraction';
    document.getElementById('form-message').hidden = true;
}

function populateFormForEdit(attraction) {
    adminState.currentEditId = attraction.id;
    document.getElementById('attr-id').value = attraction.id;
    document.getElementById('attr-name-en').value = attraction.nameEn || attraction.title || '';
    document.getElementById('attr-name-ar').value = attraction.nameAr || '';
    document.getElementById('attr-city').value = attraction.city || '';
    document.getElementById('attr-category').value = attraction.category || attraction.categoryName || '';
    document.getElementById('attr-description-en').value = attraction.descriptionEn || attraction.description || '';
    document.getElementById('attr-description-ar').value = attraction.descriptionAr || '';
    document.getElementById('attr-image').value = attraction.image || attraction.photoUrl || '';
    document.getElementById('attr-latitude').value = attraction.latitude || '';
    document.getElementById('attr-longitude').value = attraction.longitude || '';
    document.getElementById('attr-rating').value = attraction.rating || '';
    document.getElementById('attr-entry-fee').value = attraction.entryFee || '';
    document.getElementById('attr-hours').value = attraction.openingHours || '';
    const langs = Array.isArray(attraction.languages) ? attraction.languages.join(', ') : (attraction.languages || '');
    document.getElementById('attr-languages').value = langs;

    document.getElementById('form-title').textContent = 'Edit Attraction';
    document.getElementById('submit-btn').textContent = 'Update Attraction';
}

// ── LOAD ATTRACTIONS ────────────────────────────────────────────────────────────
async function loadAttractions() {
    adminState.isLoading = true;
    const tbody = document.getElementById('attractions-tbody');

    try {
        const res = await fetch('/api/attractions');
        if (!res.ok) throw new Error('Failed to load attractions');

        adminState.attractions = await res.json();
        adminState.filtered = adminState.attractions;
        adminState.currentPage = 1;

        // Populate city filter
        const cities = [...new Set(adminState.attractions.map(a => a.city).filter(Boolean))];
        const cityFilter = document.getElementById('city-filter');
        const currentCity = cityFilter.value;
        cityFilter.innerHTML = '<option value="">All Cities</option>';
        cities.forEach(city => {
            const opt = document.createElement('option');
            opt.value = city;
            opt.textContent = city;
            cityFilter.appendChild(opt);
        });
        cityFilter.value = currentCity;

        renderAttractionTable();
    } catch (e) {
        console.error('Error loading attractions:', e);
        tbody.innerHTML = `<tr><td colspan="7" class="loading-cell">Error loading attractions</td></tr>`;
    } finally {
        adminState.isLoading = false;
    }
}

// ── FILTER & SEARCH ─────────────────────────────────────────────────────────────
function applyFilters() {
    const search = document.getElementById('search-input').value.toLowerCase();
    const city = document.getElementById('city-filter').value;

    adminState.filtered = adminState.attractions.filter(a => {
        const matchesSearch = !search ||
            (a.nameEn && a.nameEn.toLowerCase().includes(search)) ||
            (a.title && a.title.toLowerCase().includes(search)) ||
            (a.descriptionEn && a.descriptionEn.toLowerCase().includes(search));

        const matchesCity = !city || a.city === city;
        return matchesSearch && matchesCity;
    });

    adminState.currentPage = 1;
    renderAttractionTable();
}

// ── RENDER TABLE ────────────────────────────────────────────────────────────────
function renderAttractionTable() {
    const tbody = document.getElementById('attractions-tbody');
    const start = (adminState.currentPage - 1) * adminState.itemsPerPage;
    const end = start + adminState.itemsPerPage;
    const pageItems = adminState.filtered.slice(start, end);

    if (pageItems.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="loading-cell">No attractions found</td></tr>`;
        updatePaginationControls();
        return;
    }

    tbody.innerHTML = pageItems.map(a => `
        <tr>
            <td>${a.id}</td>
            <td><strong>${a.nameEn || a.title || 'N/A'}</strong></td>
            <td>${a.city || '—'}</td>
            <td>${a.category || a.categoryName || '—'}</td>
            <td>${a.rating ? a.rating.toFixed(1) : '—'}</td>
            <td>${a.entryFee > 0 ? a.entryFee + ' JOD' : 'Free'}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-outline btn-sm" onclick="startEdit(${a.id})">Edit</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteAttraction(${a.id})">Delete</button>
                </div>
            </td>
        </tr>
    `).join('');

    updatePaginationControls();
}

function updatePaginationControls() {
    const totalPages = Math.ceil(adminState.filtered.length / adminState.itemsPerPage);
    document.getElementById('page-info').textContent = `Page ${adminState.currentPage} of ${totalPages}`;
    document.getElementById('prev-page').disabled = adminState.currentPage === 1;
    document.getElementById('next-page').disabled = adminState.currentPage >= totalPages;
}

// ── EDIT ATTRACTION ─────────────────────────────────────────────────────────────
function startEdit(id) {
    const attraction = adminState.attractions.find(a => a.id === id);
    if (!attraction) return;

    populateFormForEdit(attraction);
    showSection('create');
    document.querySelector('html').scrollTop = 0;
}

// ── DELETE ATTRACTION ────────────────────────────────────────────────────────────
async function deleteAttraction(id) {
    if (!confirm('Are you sure you want to delete this attraction? This action cannot be undone.')) {
        return;
    }

    try {
        const token = localStorage.getItem('tm_token');
        const headers = { 'Authorization': `Bearer ${token}` };

        const res = await fetch(`/api/attractions/${id}`, {
            method: 'DELETE',
            headers
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.message || 'Failed to delete attraction');
        }

        // Remove from local state and re-render
        adminState.attractions = adminState.attractions.filter(a => a.id !== id);
        applyFilters();
        alert('Attraction deleted successfully');
    } catch (e) {
        console.error('Error deleting attraction:', e);
        alert('Error: ' + e.message);
    }
}

// ── SUBMIT FORM (CREATE/UPDATE) ─────────────────────────────────────────────────
async function submitAttractionForm(e) {
    e.preventDefault();

    const messageEl = document.getElementById('form-message');
    messageEl.className = 'form-message';

    const payload = {
        nameEn: document.getElementById('attr-name-en').value,
        nameAr: document.getElementById('attr-name-ar').value,
        city: document.getElementById('attr-city').value,
        category: document.getElementById('attr-category').value,
        descriptionEn: document.getElementById('attr-description-en').value,
        descriptionAr: document.getElementById('attr-description-ar').value,
        image: document.getElementById('attr-image').value,
        latitude: parseFloat(document.getElementById('attr-latitude').value) || null,
        longitude: parseFloat(document.getElementById('attr-longitude').value) || null,
        rating: parseFloat(document.getElementById('attr-rating').value) || 0,
        entryFee: parseFloat(document.getElementById('attr-entry-fee').value) || 0,
        openingHours: document.getElementById('attr-hours').value,
        languages: document.getElementById('attr-languages').value
            .split(',')
            .map(l => l.trim())
            .filter(Boolean)
    };

    if (!payload.nameEn || !payload.city) {
        messageEl.className = 'form-message error';
        messageEl.textContent = '❌ Name and City are required';
        messageEl.hidden = false;
        return;
    }

    try {
        const token = localStorage.getItem('tm_token');
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };

        let res;
        if (adminState.currentEditId) {
            // Update existing
            res = await fetch(`/api/attractions/${adminState.currentEditId}`, {
                method: 'PUT',
                headers,
                body: JSON.stringify(payload)
            });
        } else {
            // Create new
            res = await fetch('/api/attractions', {
                method: 'POST',
                headers,
                body: JSON.stringify(payload)
            });
        }

        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.message || `Failed to ${adminState.currentEditId ? 'update' : 'create'} attraction`);
        }

        const result = await res.json();
        messageEl.className = 'form-message success';
        messageEl.textContent = `✓ Attraction ${adminState.currentEditId ? 'updated' : 'created'} successfully`;
        messageEl.hidden = false;

        // Reload and reset
        await loadAttractions();
        setTimeout(() => resetForm(), 1500);
    } catch (e) {
        console.error('Error submitting form:', e);
        messageEl.className = 'form-message error';
        messageEl.textContent = '❌ ' + e.message;
        messageEl.hidden = false;
    }
}

// ── MODAL ────────────────────────────────────────────────────────────────────────
function closeEditModal() {
    document.getElementById('edit-modal').hidden = true;
}

// ── EVENT LISTENERS ─────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
    // Check auth first
    const isAuth = await checkAdminAuth();
    if (!isAuth) return;

    // Section navigation
    document.querySelectorAll('.admin-nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            showSection(item.dataset.section);
        });
    });

    // Search and filter
    document.getElementById('search-input').addEventListener('input', applyFilters);
    document.getElementById('city-filter').addEventListener('change', applyFilters);

    // Form submission
    document.getElementById('attraction-form').addEventListener('submit', submitAttractionForm);

    // Pagination
    document.getElementById('prev-page').addEventListener('click', () => {
        if (adminState.currentPage > 1) {
            adminState.currentPage--;
            renderAttractionTable();
        }
    });

    document.getElementById('next-page').addEventListener('click', () => {
        const totalPages = Math.ceil(adminState.filtered.length / adminState.itemsPerPage);
        if (adminState.currentPage < totalPages) {
            adminState.currentPage++;
            renderAttractionTable();
        }
    });

    // Load initial data
    showSection('list');
});
