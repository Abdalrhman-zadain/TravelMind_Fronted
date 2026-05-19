# Component Structure & File Organization

## 📁 File Organization

### Frontend Files

#### HTML

```
company-detail.html        # Main profile page (420+ lines)
admin.html                 # Admin dashboard (140+ lines)
attractions.html           # Listings page (entry point)
index.html                 # Home page
auth.html                  # Login/Register
```

#### CSS

```
css/
├── company-detail.css      # Profile page styles (600+ lines)
│   ├── .company-shell
│   ├── .company-hero
│   ├── .company-main
│   ├── .company-sidebar
│   ├── .company-booking-card
│   ├── .company-tabs
│   ├── .tour-card
│   ├── .review-card
│   └── [responsive breakpoints]
│
├── admin.css              # Admin dashboard styles (400+ lines)
│   ├── .admin-shell
│   ├── .admin-sidebar
│   ├── .admin-nav
│   ├── .attractions-table
│   ├── .attraction-form
│   └── [responsive breakpoints]
│
└── style.css              # Global styles
    ├── CSS variables (colors, fonts)
    ├── Utility classes
    ├── Navbar styles
    ├── Button styles
    └── Footer styles
```

#### JavaScript

```
js/
├── company-detail.js       # Profile page logic (230+ lines)
│   ├── getIdFromQuery()
│   ├── fetchDetail()
│   ├── renderStats()
│   ├── renderBadges()
│   ├── renderGallery()
│   ├── renderToursGrid()
│   ├── renderReviews()
│   ├── switchTab()
│   ├── initMapPlaceholder()
│   └── initCompanyDetail()
│
├── admin.js               # Admin logic (330+ lines)
│   ├── checkAdminAuth()
│   ├── showSection()
│   ├── loadAttractions()
│   ├── applyFilters()
│   ├── renderAttractionTable()
│   ├── submitAttractionForm()
│   ├── startEdit()
│   └── deleteAttraction()
│
├── app.js                 # Shared app logic
│   ├── getUser()
│   ├── toggleLanguage()
│   ├── renderAttractionCard()
│   ├── renderHotelCard()
│   ├── renderRestaurantCard()
│   └── [utility functions]
│
└── api.js                 # API helper classes
    ├── AttractionsAPI
    ├── HotelsAPI
    ├── RestaurantsAPI
    └── PhotosAPI
```

### Backend Files

#### Routes

```
backend/src/modules/catalog/
├── catalog.routes.js          # All catalog endpoints (600+ lines)
│   ├── GET /api/attractions
│   ├── GET /api/attractions/:id
│   ├── GET /api/attractions/:id/detail
│   ├── GET /api/attractions/:id/tours
│   ├── GET /api/attractions/:id/packages
│   ├── GET /api/attractions/:id/transport
│   ├── GET /api/attractions/:id/reviews
│   ├── POST /api/attractions/:id/reviews
│   ├── POST /api/favorites
│   ├── GET /api/users/:id/favorites
│   ├── POST /api/attractions (admin)
│   ├── PUT /api/attractions/:id (admin)
│   └── DELETE /api/attractions/:id (admin)
│
└── attraction-geoapify-enrichment.service.js
    └── Enrichment service for attraction data
```

#### Database

```
backend/prisma/
├── schema.prisma          # Database schema (200+ lines)
│   ├── model Attraction
│   ├── model Tour
│   ├── model Package
│   ├── model Transport
│   ├── model Review
│   ├── model Favorite
│   ├── model User
│   ├── model Hotel
│   ├── model Restaurant
│   └── [other models]
│
└── seed.js               # Database seed script
    ├── Create demo users
    ├── Create demo attractions
    ├── Create demo tours/packages
    └── Reset sequences
```

#### Config

```
backend/
├── .env                   # Environment variables
├── package.json           # Dependencies
└── data/
    └── db.json           # Demo data fallback
```

---

## 🏗️ Component Breakdown

### Page Sections

#### 1. Hero Section

**HTML:** `company-detail.html` lines 38-58  
**CSS:** `.company-hero` in `company-detail.css`  
**JS:** Populated in `initCompanyDetail()`

**Components:**

- Background image with gradient
- Attraction name (h1)
- Subtitle text
- Meta information (rating, reviews, location)
- Share button
- Favorite button (heart icon)

**Key Elements:**

```html
<header class="company-hero">
  <div class="company-hero-copy">
    <h1 id="company-title">Petra Treasury</h1>
    <div id="company-meta">⭐ 4.9 | Petra, Jordan</div>
  </div>
  <div class="company-hero-actions">
    <button id="share-btn">Share</button>
    <button id="fav-btn">♡</button>
  </div>
</header>
```

**Data Flow:**

```
API Response → Populate IDs → Render Content
company-hero → company-title (h1)
company-meta → rating + reviews + location
hero image → backgroundImage style
```

#### 2. Trust Badges

**HTML:** `company-detail.html` lines 44-46  
**CSS:** `.company-badges` in `company-detail.css`  
**Function:** `renderBadges(container, badges)`

**Badges Displayed:**

- Best Price Guarantee
- Verified Guide Network
- Free Cancellation
- Instant Booking

**Rendering:**

```js
renderBadges(document.getElementById("company-badges"), item.badges || []);
```

#### 3. About Card

**HTML:** `company-detail.html` lines 62-100  
**CSS:** `.company-about-card`, `.company-stats`, `.company-gallery`  
**Functions:**

- `renderStats()` - Shows tours, years, languages
- `renderGallery()` - Shows image thumbnails

**Key Elements:**

```html
<div class="company-about-card">
  <h3>About</h3>
  <p id="company-description">Description...</p>
  <div id="company-stats">Stats here</div>
  <div id="company-gallery">Images here</div>
</div>
```

**Stats Generated:**

```json
{
  "Tours": "21",
  "Years": "10+",
  "Languages": "English, Arabic"
}
```

#### 4. Booking Card (Sticky)

**HTML:** `company-detail.html` lines 251-285  
**CSS:** `.company-booking-card.sticky` (sticky positioning)  
**Styling:** `position: sticky; top: 88px;`

**Components:**

- Price display
- Rating
- Availability status
- Book Now button
- Ask Question button
- Call/WhatsApp buttons
- Special offer box

**Key CSS:**

```css
.company-booking-card.sticky {
  position: sticky;
  top: 88px;
  z-index: 10;
}
```

#### 5. Tabs Navigation

**HTML:** `company-detail.html` lines 102-145  
**CSS:** `.company-tabs`, `.company-tabs-panels`  
**Function:** `switchTab(selectedId)`

**Tabs:**

1. Overview (default)
2. Tours
3. Packages
4. Transport
5. Location
6. Reviews
7. FAQ

**Tab Switching Logic:**

```js
function switchTab(selectedId) {
  const tabs = document.querySelectorAll('.company-tabs [role="tab"]');
  tabs.forEach((t) => {
    const panel = document.getElementById(t.getAttribute("aria-controls"));
    const sel =
      t.id === selectedId + "-btn" ||
      t.getAttribute("aria-controls") === selectedId;
    t.setAttribute("aria-selected", sel ? "true" : "false");
    if (panel) panel.hidden = !sel;
  });
}
```

#### 6. Tours Grid

**HTML:** `company-detail.html` lines 148-162  
**CSS:** `.tours-grid`, `.tour-card`  
**Function:** `renderToursGrid(container, tours, fallbackImg)`

**Tour Card Structure:**

```html
<article class="tour-card">
  <img src="..." alt="..." loading="lazy" />
  <h4>Tour Title</h4>
  <p>Summary</p>
  <div class="tour-meta">
    <strong>From $65</strong>
  </div>
</article>
```

**Data Mapping:**

```json
{
  "id": 1,
  "attractionId": 1,
  "title": "Petra Full Day Tour",
  "summary": "Explore the ancient city",
  "duration": "8 Hours",
  "price": 65,
  "image": "https://..."
}
```

#### 7. Packages Section

**HTML:** `company-detail.html` lines 164-179  
**CSS:** `.packages-list`

**Package Card Structure:**

```html
<div class="package-item">
  <img src="..." alt="..." />
  <h4>Package Title</h4>
  <p>Description</p>
  <span>3 Days | 2-10 people</span>
  <strong>From 299 JOD</strong>
</div>
```

#### 8. Transport Services

**HTML:** `company-detail.html` lines 181-186  
**CSS:** `.transport-list`

**Transport Card Structure:**

```html
<div class="transport-item">
  <img src="..." alt="..." />
  <h4>Service Title</h4>
  <p>Route description</p>
  <span>From 25 JOD</span>
</div>
```

#### 9. Interactive Map

**HTML:** `company-detail.html` line 191  
**CSS:** `#map` styling  
**Function:** `initMapPlaceholder(containerId, coords, title)`

**Map Setup:**

```js
const map = L.map(containerId).setView([lat, lng], 13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {...}).addTo(map);
L.marker([lat, lng]).addTo(map).bindPopup(title);
```

**Dependencies:**

- Leaflet.js v1.9.4 (via CDN)
- OpenStreetMap tiles

#### 10. Reviews Section

**HTML:** `company-detail.html` lines 194-212  
**CSS:** `.review-card`, `.add-review`  
**Functions:**

- `renderReviews(container, reviews)`
- Review form submission handler

**Review Card Structure:**

```html
<div class="review-card">
  <div class="review-header">
    <strong>User Name</strong>
    <span>5★</span>
  </div>
  <p>Review text</p>
</div>
```

**Form Structure:**

```html
<form id="add-review-form">
  <select id="review-rating">
    <option value="5">5</option>
    ...
  </select>
  <textarea id="review-text"></textarea>
  <button type="submit">Submit</button>
</form>
```

#### 11. FAQ Section

**HTML:** `company-detail.html` lines 214-222  
**CSS:** `.faq-list`, `.faq-item`

**FAQ Item Structure:**

```html
<div class="faq-item">
  <h5 class="faq-question">Is booking required?</h5>
  <p class="faq-answer">Answer text...</p>
</div>
```

#### 12. Bottom CTA

**HTML:** `company-detail.html` lines 224-235  
**CSS:** `.company-bottom-cta`

**CTA Structure:**

```html
<section class="company-bottom-cta">
  <div class="cta-card">
    <h3>Ready to explore Petra?</h3>
    <p>Book your experience now...</p>
    <button class="btn btn-primary">Book Your Adventure</button>
  </div>
</section>
```

---

## 🎮 Admin Components

### Admin Sections

#### Section 1: Attractions List

**HTML:** `admin.html` lines 47-100  
**CSS:** `.admin-section#section-list`  
**Functions:**

- `loadAttractions()` - Fetch all attractions
- `applyFilters()` - Filter & search
- `renderAttractionTable()` - Display table
- `updatePaginationControls()` - Update page info

**Table Columns:**

- ID
- Name
- City
- Category
- Rating
- Entry Fee
- Actions (Edit, Delete)

#### Section 2: Create/Edit Form

**HTML:** `admin.html` lines 109-170  
**CSS:** `.attraction-form`  
**Function:** `submitAttractionForm(e)`

**Form Fields:**

- Name (EN/AR)
- City, Category
- Description (EN/AR)
- Image URL
- Latitude, Longitude
- Rating, Entry Fee
- Opening Hours
- Languages

---

## 🔄 Data Flow Diagrams

### Profile Page Data Flow

```
URL (?id=1)
    ↓
getIdFromQuery()
    ↓
fetchDetail(id)
    ↓
GET /api/attractions/1/detail
    ↓
Response: Enriched attraction object
{
  id, name, city, description,
  image, images[], badges[],
  tours[], packages[], transport[],
  reviews[], latitude, longitude,
  rating, entryFee, ...
}
    ↓
initCompanyDetail()
    ↓
renderStats() → company-stats
renderBadges() → company-badges
renderGallery() → company-gallery
renderToursGrid() → tours-grid
renderReviews() → reviews-list
initMapPlaceholder() → map
    ↓
User sees complete profile
```

### Admin CRUD Flow

```
Admin Action
    ↓
Load attractions: GET /api/attractions
    ↓
Display table
    ↓
User selects Create/Edit/Delete
    ↓
Create: POST /api/attractions
Edit: PUT /api/attractions/:id
Delete: DELETE /api/attractions/:id
    ↓
API validates & processes
    ↓
Reload table
    ↓
Show success/error message
```

### Favorites Flow

```
User clicks favorite button (♡)
    ↓
Event listener: favBtn.click
    ↓
Toggle aria-pressed state
    ↓
Change icon: ♡ ↔ ♥
    ↓
POST /api/favorites
Body: { attractionId, favorite, userId }
    ↓
API creates/deletes Favorite record
    ↓
Response: { userId, attractionId, favorite }
    ↓
UI reflects change
```

---

## 📡 API Response Examples

### GET /api/attractions/:id/detail

```json
{
  "id": 1,
  "nameEn": "Petra Treasury",
  "nameAr": "خزنة فرعون",
  "city": "Petra",
  "category": "Historical Site",
  "descriptionEn": "The iconic rose-red city carved into rock...",
  "descriptionAr": "المدينة الوردية...",
  "photoUrl": "https://...",
  "image": "https://...",
  "images": ["https://...", "https://...", "https://..."],
  "latitude": 30.3285,
  "longitude": 35.4444,
  "rating": 4.9,
  "entryFee": 50,
  "openingHours": "06:00 - 17:00",
  "languages": ["English", "Arabic"],
  "reviewCount": 248,
  "badges": [
    "Best Price Guarantee",
    "Verified Guide Network",
    "Free Cancellation"
  ],
  "tours": [
    {
      "id": 1,
      "attractionId": 1,
      "title": "Petra Full Day Tour",
      "summary": "Explore the ancient city of Petra",
      "duration": "8 Hours",
      "price": 65,
      "image": "https://..."
    }
  ],
  "packages": [
    {
      "id": 1,
      "attractionId": 1,
      "title": "Jordan Highlights - 3 Days",
      "description": "Petra, Wadi Rum & Dead Sea",
      "price": 299
    }
  ],
  "transport": [
    {
      "id": 1,
      "attractionId": 1,
      "provider": "Airport Transfer",
      "description": "Queen Alia Airport ↔ Petra",
      "price": 25,
      "contact": "+966..."
    }
  ],
  "reviews": [
    {
      "id": 1,
      "userId": 1,
      "placeId": 1,
      "placeType": "attraction",
      "rating": 5,
      "comment": "Amazing experience!",
      "createdAt": "2026-05-15T10:00:00Z"
    }
  ]
}
```

---

## 🛠️ Key Functions Reference

### Profile Page (js/company-detail.js)

```js
// Get attraction ID from URL query parameter
async getIdFromQuery()

// Fetch attraction detail from API
async fetchDetail(id)

// Render stats (tours, languages, years)
renderStats(container, item)

// Render trust badges
renderBadges(container, badges)

// Render gallery images with lazy loading
renderGallery(container, images)

// Render tours grid
renderToursGrid(container, tours, fallbackImg)

// Initialize Leaflet map
initMapPlaceholder(containerId, coords, title)

// Render reviews list
renderReviews(container, reviews)

// Switch between tabs
switchTab(selectedId)

// Main initialization function
initCompanyDetail()
```

### Admin Page (js/admin.js)

```js
// Check authentication
async checkAdminAuth()

// Show specific section (list or create)
showSection(sectionName)

// Load all attractions from API
async loadAttractions()

// Apply search and filter
applyFilters()

// Render attractions table
renderAttractionTable()

// Update pagination controls
updatePaginationControls()

// Start editing an attraction
startEdit(id)

// Delete an attraction
async deleteAttraction(id)

// Submit form (create or update)
async submitAttractionForm(e)

// Close edit modal
closeEditModal()
```

---

## 📦 Dependencies

### Frontend

- **Leaflet.js v1.9.4** - Interactive maps
- **Vanilla JavaScript ES6+** - No frameworks
- **HTML5 Web APIs:**
  - Web Share API
  - Fetch API
  - localStorage
  - Clipboard API

### Backend

- **Express.js** - Web framework
- **Prisma ORM** - Database client
- **PostgreSQL 17** - Database
- **Node.js** - Runtime

---

## 🔐 Authentication Flow

```
User logs in (auth.html)
    ↓
POST /api/auth/login
    ↓
Server returns JWT token
    ↓
localStorage.setItem('tm_token', token)
    ↓
Page stores: window.currentUser = { id, email, ... }
    ↓
Protected pages check token
    ↓
Include Authorization header on API calls
    ↓
Backend verifies token (requireAuth middleware)
    ↓
Allow/deny based on auth status
```

---

_Last Updated: May 20, 2026_  
_Complete & Production Ready_
