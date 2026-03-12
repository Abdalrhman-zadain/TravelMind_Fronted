// ═══════════════════════════════════════════════
// TRIP PLANNER LOGIC
// ═══════════════════════════════════════════════

let currentTrip = null;
let currentTripId = null;
let editingTripId = null;

// ── CHECK LOGIN ─────────────────────────────────
function checkLogin() {
    if (!isLoggedIn()) {
        document.querySelector('.planner-layout').innerHTML = `
      <div class="login-required" style="grid-column:1/-1">
        <div class="login-required-icon">🔐</div>
        <h3>Login Required</h3>
        <p>Please login to access your trip planner</p>
        <button class="btn btn-primary btn-lg" onclick="location.href='auth.html'">
          Login Now
        </button>
      </div>`;
        return false;
    }
    return true;
}

// ── LOAD TRIPS ──────────────────────────────────
async function loadTrips() {
    if (!checkLogin()) return;

    const user = getUser();
    const list = document.getElementById('trips-list');

    try {
        const trips = await TripsAPI.getByUser(user.id);
        const data = Array.isArray(trips) ? trips : [];

        if (data.length === 0) {
            list.innerHTML = `
        <div class="empty-state" style="padding: 30px 0; text-align:center">
          <div style="font-size:36px; margin-bottom:10px">🗺️</div>
          <div style="font-size:13px; color:var(--gray)">No trips yet.<br/>Create your first trip!</div>
        </div>`;
            return;
        }

        list.innerHTML = data.map(t => `
      <div class="trip-item" id="trip-item-${t.id}" onclick="selectTrip(${t.id})">
        <div class="trip-item-name">${t.name}</div>
        <div class="trip-item-dest">📍 ${t.destination}</div>
        <div class="trip-item-dates">
          📅 ${t.startDate ? new Date(t.startDate).toLocaleDateString() : 'No date'}
        </div>
        <div class="trip-item-budget">${t.budget} JOD</div>
        <button class="trip-item-delete" onclick="deleteTrip(event, ${t.id})">🗑️</button>
      </div>
    `).join('');

    } catch (e) {
        list.innerHTML = `<div style="font-size:13px; color:var(--gray); padding:16px">Could not load trips</div>`;
    }
}

// ── SELECT TRIP ─────────────────────────────────
async function selectTrip(id) {
    currentTripId = id;

    // highlight active
    document.querySelectorAll('.trip-item').forEach(t => t.classList.remove('active'));
    const item = document.getElementById(`trip-item-${id}`);
    if (item) item.classList.add('active');

    const main = document.getElementById('planner-main');
    main.innerHTML = '<div class="loading"><div class="spinner"></div> Loading trip...</div>';

    try {
        const trip = await TripsAPI.getById(id);
        currentTrip = trip;
        renderTripDetail(trip);
    } catch (e) {
        main.innerHTML = `<div class="empty-state"><div class="empty-state-icon">⚠️</div><div class="empty-state-title">Could not load trip</div></div>`;
    }
}

// ── RENDER TRIP DETAIL ──────────────────────────
function renderTripDetail(trip) {
    const main = document.getElementById('planner-main');

    const startDate = trip.startDate ? new Date(trip.startDate).toLocaleDateString() : 'Not set';
    const endDate = trip.endDate ? new Date(trip.endDate).toLocaleDateString() : 'Not set';

    main.innerHTML = `
    <div class="trip-detail-header">
      <div>
        <div class="trip-detail-title">${trip.name}</div>
        <div class="trip-detail-meta">
          <div class="trip-meta-item">📍 ${trip.destination}</div>
          <div class="trip-meta-item">📅 ${startDate} → ${endDate}</div>
          <div class="trip-meta-item">💰 Budget: ${trip.budget} JOD</div>
        </div>
      </div>
      <div class="trip-detail-actions">
        <button class="btn btn-outline btn-sm" onclick="openTripModal(${trip.id})">✏️ Edit</button>
        <button class="btn btn-ghost btn-sm" onclick="deleteTrip(null, ${trip.id})">🗑️ Delete</button>
      </div>
    </div>

    <!-- TABS -->
    <div class="trip-tabs">
      <button class="trip-tab active" onclick="showTab(this, 'expenses')">💰 Expenses</button>
      <button class="trip-tab" onclick="showTab(this, 'journal')">📖 Journal</button>
    </div>

    <!-- EXPENSES TAB -->
    <div class="tab-content active" id="tab-expenses">
      <div id="expenses-content">
        <div class="loading"><div class="spinner"></div></div>
      </div>
    </div>

    <!-- JOURNAL TAB -->
    <div class="tab-content" id="tab-journal">
      <div id="journal-content">
        <div class="loading"><div class="spinner"></div></div>
      </div>
    </div>
  `;

    loadExpenses(trip.id);
    loadJournals(trip.id);
}

// ── SHOW TAB ────────────────────────────────────
function showTab(btn, tab) {
    document.querySelectorAll('.trip-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(`tab-${tab}`).classList.add('active');
}

// ── LOAD EXPENSES ───────────────────────────────
async function loadExpenses(tripId) {
    const container = document.getElementById('expenses-content');

    try {
        const data = await ExpensesAPI.getByTrip(tripId);
        const expenses = Array.isArray(data) ? data : [];
        const spent = expenses.reduce((sum, e) => sum + e.amount, 0);
        const budget = currentTrip?.budget || 0;
        const left = budget - spent;

        const categoryIcons = {
            'Transport': '🚗', 'Hotel': '🏨', 'Food': '🍽️',
            'Activities': '🎯', 'Shopping': '🛍️', 'Other': '📦'
        };

        container.innerHTML = `
      <div class="tab-header">
        <h4>Expenses</h4>
        <button class="btn btn-primary btn-sm" onclick="openExpenseModal()">+ Add Expense</button>
      </div>

      <div class="budget-overview">
        <div class="budget-card budget-card-total">
          <div class="budget-card-amount">${budget} JOD</div>
          <div class="budget-card-label">Total Budget</div>
        </div>
        <div class="budget-card budget-card-spent">
          <div class="budget-card-amount">${spent.toFixed(2)} JOD</div>
          <div class="budget-card-label">Total Spent</div>
        </div>
        <div class="budget-card budget-card-left">
          <div class="budget-card-amount">${left.toFixed(2)} JOD</div>
          <div class="budget-card-label">Remaining</div>
        </div>
      </div>

      ${expenses.length === 0 ? `
        <div class="empty-state">
          <div class="empty-state-icon">💰</div>
          <div class="empty-state-title">No Expenses Yet</div>
          <div class="empty-state-desc">Start tracking your spending!</div>
        </div>` :
                expenses.map(e => `
          <div class="expense-item">
            <div class="expense-item-left">
              <div class="expense-item-icon">${categoryIcons[e.category] || '📦'}</div>
              <div>
                <div class="expense-item-desc">${e.description}</div>
                <div class="expense-item-meta">${e.category} • ${e.date ? new Date(e.date).toLocaleDateString() : ''}</div>
              </div>
            </div>
            <div style="display:flex; align-items:center; gap:10px">
              <div class="expense-item-amount">${e.amount} JOD</div>
              <button class="expense-item-delete" onclick="deleteExpense(${e.id})">🗑️</button>
            </div>
          </div>
        `).join('')
            }
    `;
    } catch (e) {
        container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">⚠️</div><div class="empty-state-title">Could not load expenses</div></div>`;
    }
}

// ── LOAD JOURNALS ───────────────────────────────
async function loadJournals(tripId) {
    const container = document.getElementById('journal-content');

    try {
        const user = getUser();
        const data = await JournalsAPI.getByUser(user.id);
        const journals = Array.isArray(data)
            ? data.filter(j => j.tripId === tripId)
            : [];

        container.innerHTML = `
      <div class="tab-header">
        <h4>Journal</h4>
        <button class="btn btn-primary btn-sm" onclick="openJournalModal()">+ New Entry</button>
      </div>

      ${journals.length === 0 ? `
        <div class="empty-state">
          <div class="empty-state-icon">📖</div>
          <div class="empty-state-title">No Journal Entries Yet</div>
          <div class="empty-state-desc">Write about your experiences!</div>
        </div>` :
                journals.map(j => `
          <div class="journal-item">
            <div class="journal-item-header">
              <div class="journal-item-title">${j.title}</div>
              <div style="display:flex; align-items:center; gap:10px">
                <div class="journal-item-date">${j.date ? new Date(j.date).toLocaleDateString() : ''}</div>
                <button class="journal-item-delete" onclick="deleteJournal(${j.id})">🗑️</button>
              </div>
            </div>
            <div class="journal-item-content">${j.content}</div>
          </div>
        `).join('')
            }
    `;
    } catch (e) {
        container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">⚠️</div><div class="empty-state-title">Could not load journal</div></div>`;
    }
}

// ── TRIP MODAL ──────────────────────────────────
function openTripModal(tripId = null) {
    editingTripId = tripId;
    document.getElementById('trip-modal-title').textContent = tripId ? 'Edit Trip' : 'New Trip';
    document.getElementById('trip-error').classList.add('hidden');

    if (tripId && currentTrip) {
        document.getElementById('trip-name').value = currentTrip.name;
        document.getElementById('trip-destination').value = currentTrip.destination;
        document.getElementById('trip-budget').value = currentTrip.budget;
        document.getElementById('trip-notes').value = currentTrip.notes || '';
        if (currentTrip.startDate)
            document.getElementById('trip-start').value = currentTrip.startDate.split('T')[0];
        if (currentTrip.endDate)
            document.getElementById('trip-end').value = currentTrip.endDate.split('T')[0];
    } else {
        document.getElementById('trip-name').value = '';
        document.getElementById('trip-destination').value = 'Jordan';
        document.getElementById('trip-budget').value = '';
        document.getElementById('trip-notes').value = '';
        document.getElementById('trip-start').value = '';
        document.getElementById('trip-end').value = '';
    }

    document.getElementById('trip-modal').classList.add('open');
}

function closeTripModal() {
    document.getElementById('trip-modal').classList.remove('open');
}

async function saveTrip() {
    const name = document.getElementById('trip-name').value.trim();
    const destination = document.getElementById('trip-destination').value;
    const startDate = document.getElementById('trip-start').value;
    const endDate = document.getElementById('trip-end').value;
    const budget = document.getElementById('trip-budget').value;
    const notes = document.getElementById('trip-notes').value.trim();

    if (!name) {
        document.getElementById('trip-error').textContent = 'Trip name is required!';
        document.getElementById('trip-error').classList.remove('hidden');
        return;
    }

    const user = getUser();
    const dto = {
        id: editingTripId || 0,
        userId: user.id,
        name, destination,
        startDate: startDate || null,
        endDate: endDate || null,
        budget: parseFloat(budget) || 0,
        notes: notes || null,
        createdAt: new Date().toISOString()
    };

    try {
        if (editingTripId) {
            await TripsAPI.update(editingTripId, dto);
            showToast('Trip updated! ✅', 'success');
        } else {
            await TripsAPI.create(dto);
            showToast('Trip created! 🎉', 'success');
        }
        closeTripModal();
        loadTrips();
    } catch (e) {
        document.getElementById('trip-error').textContent = 'Failed to save trip!';
        document.getElementById('trip-error').classList.remove('hidden');
    }
}

// ── DELETE TRIP ─────────────────────────────────
async function deleteTrip(event, id) {
    if (event) event.stopPropagation();
    if (!confirm('Are you sure you want to delete this trip?')) return;

    try {
        await TripsAPI.delete(id);
        showToast('Trip deleted!', 'info');
        currentTripId = null;
        document.getElementById('planner-main').innerHTML = `
      <div class="planner-welcome">
        <div class="planner-welcome-icon">🗺️</div>
        <h3>Select a Trip</h3>
        <p>Choose a trip from the left or create a new one!</p>
        <button class="btn btn-primary btn-lg" onclick="openTripModal()">+ Create New Trip</button>
      </div>`;
        loadTrips();
    } catch (e) {
        showToast('Failed to delete trip!', 'error');
    }
}

// ── EXPENSE MODAL ───────────────────────────────
function openExpenseModal() {
    document.getElementById('expense-desc').value = '';
    document.getElementById('expense-amount').value = '';
    document.getElementById('expense-date').value = new Date().toISOString().split('T')[0];
    document.getElementById('expense-modal').classList.add('open');
}

function closeExpenseModal() {
    document.getElementById('expense-modal').classList.remove('open');
}

async function saveExpense() {
    const description = document.getElementById('expense-desc').value.trim();
    const amount = document.getElementById('expense-amount').value;
    const category = document.getElementById('expense-category').value;
    const date = document.getElementById('expense-date').value;

    if (!description || !amount) {
        showToast('Description and amount are required!', 'error');
        return;
    }

    const user = getUser();
    try {
        await ExpensesAPI.create({
            id: 0, userId: user.id,
            tripId: currentTripId,
            description, amount: parseFloat(amount),
            category, date: date || null,
            createdAt: new Date().toISOString()
        });
        showToast('Expense added! 💰', 'success');
        closeExpenseModal();
        loadExpenses(currentTripId);
    } catch (e) {
        showToast('Failed to add expense!', 'error');
    }
}

// ── DELETE EXPENSE ──────────────────────────────
async function deleteExpense(id) {
    if (!confirm('Delete this expense?')) return;
    try {
        await ExpensesAPI.delete(id);
        showToast('Expense deleted!', 'info');
        loadExpenses(currentTripId);
    } catch (e) {
        showToast('Failed to delete expense!', 'error');
    }
}

// ── JOURNAL MODAL ───────────────────────────────
function openJournalModal() {
    document.getElementById('journal-title').value = '';
    document.getElementById('journal-content').value = '';
    document.getElementById('journal-date').value = new Date().toISOString().split('T')[0];
    document.getElementById('journal-modal').classList.add('open');
}

function closeJournalModal() {
    document.getElementById('journal-modal').classList.remove('open');
}

async function saveJournal() {
    const title = document.getElementById('journal-title').value.trim();
    const content = document.getElementById('journal-content').value.trim();
    const date = document.getElementById('journal-date').value;

    if (!title || !content) {
        showToast('Title and content are required!', 'error');
        return;
    }

    const user = getUser();
    try {
        await JournalsAPI.create({
            id: 0, userId: user.id,
            tripId: currentTripId,
            title, content,
            date: date || null,
            createdAt: new Date().toISOString()
        });
        showToast('Journal entry saved! 📖', 'success');
        closeJournalModal();
        loadJournals(currentTripId);
    } catch (e) {
        showToast('Failed to save journal entry!', 'error');
    }
}

// ── DELETE JOURNAL ──────────────────────────────
async function deleteJournal(id) {
    if (!confirm('Delete this journal entry?')) return;
    try {
        await JournalsAPI.delete(id);
        showToast('Journal entry deleted!', 'info');
        loadJournals(currentTripId);
    } catch (e) {
        showToast('Failed to delete journal entry!', 'error');
    }
}

// ── CLOSE MODALS ON OVERLAY CLICK ───────────────
['trip-modal', 'expense-modal', 'journal-modal'].forEach(id => {
    document.getElementById(id).addEventListener('click', function (e) {
        if (e.target === this) this.classList.remove('open');
    });
});

// ── INIT ────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    loadTrips();
});