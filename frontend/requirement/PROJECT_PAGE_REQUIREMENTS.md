# TravelMind Frontend Requirements

## 1. Document Purpose

This document defines the current functional requirements for the TravelMind frontend based on the pages that exist in the project today.

It replaces older attraction-only requirement notes and should be treated as the main product requirement reference for the frontend.

## 2. Project Scope

TravelMind is a Jordan travel platform with:

1. Public discovery pages for destinations, attractions, hotels, restaurants, tours, companies, and stories.
2. Planning flows for trip building and checkout.
3. Account and analytics experiences for signed-in users and business/admin roles.
4. Backend-powered data loaded through `frontend/js/api.js`.

## 3. Shared Requirements For All Pages

1. Every page must use the shared global styles from `frontend/css/style.css`.
2. Every page must load through the static frontend structure under `frontend/`.
3. Every data-driven page must use `frontend/js/api.js` for backend communication.
4. Navigation should allow users to move between discovery, planning, account, and support flows.
5. UI must be responsive on desktop and mobile.
6. Pages that depend on login must handle unauthenticated users clearly and redirect to `auth.html` when required.
7. Images, cards, and buttons should degrade gracefully when API data is empty or unavailable.
8. Pages should keep Jordan travel branding and a consistent TravelMind look and feel.

## 4. Page Requirements

### 4.1 Home Page - `index.html`

- `FR-HOME-1` The home page shall introduce TravelMind and the Jordan travel value proposition.
- `FR-HOME-2` The home page shall present a hero section with search and discovery entry points.
- `FR-HOME-3` The home page shall highlight featured destinations in Jordan.
- `FR-HOME-4` The home page shall promote events, attractions, and visual gallery content.
- `FR-HOME-5` The home page shall route users into attractions, hotels, restaurants, stories, and planning flows.

### 4.2 Attractions Page - `attractions.html`

- `FR-ATTRACTIONS-1` The attractions page shall display a browsable list of attractions in Jordan.
- `FR-ATTRACTIONS-2` The attractions page shall support filtering or narrowing by city or category where available.
- `FR-ATTRACTIONS-3` The attractions page shall show attraction cards with image, name, location, and summary details.
- `FR-ATTRACTIONS-4` The attractions page shall allow users to open attraction-related detail or planning flows.
- `FR-ATTRACTIONS-5` The attractions page shall show related traveler story previews when available.

### 4.3 Hotels Page - `hotels.html`

- `FR-HOTELS-1` The hotels page shall display hotel inventory from the backend.
- `FR-HOTELS-2` The hotels page shall support city-based browsing and detail selection.
- `FR-HOTELS-3` The hotels page shall show hotel cards with image, location, rating, and booking-oriented information.
- `FR-HOTELS-4` The hotels page shall allow users to open a selected hotel context or continue to planning.
- `FR-HOTELS-5` The hotels page shall handle empty states when no hotels are returned.

### 4.4 Restaurants Page - `restaurants.html`

- `FR-RESTAURANTS-1` The restaurants page shall display restaurants relevant to travel in Jordan.
- `FR-RESTAURANTS-2` The restaurants page shall support browsing by city or cuisine when backend data supports it.
- `FR-RESTAURANTS-3` The restaurants page shall show restaurant cards with image, title, cuisine or location, and rating or summary data.
- `FR-RESTAURANTS-4` The restaurants page shall allow users to continue to trip planning from restaurant discovery.
- `FR-RESTAURANTS-5` The restaurants page shall handle empty states and missing media safely.

### 4.5 Companies Page - `companies.html`

- `FR-COMPANIES-1` The companies page shall present verified tourism companies across Jordan.
- `FR-COMPANIES-2` The companies page shall show company cards with brand image, summary, and action links.
- `FR-COMPANIES-3` The companies page shall support map and list style exploration where applicable.
- `FR-COMPANIES-4` The companies page shall allow users to open a company profile page.
- `FR-COMPANIES-5` The companies page shall provide a bridge between discovery content and booking providers.

### 4.6 Company Detail Page - `company-detail.html`

- `FR-COMPANY-DETAIL-1` The company detail page shall show one tourism company profile using backend data.
- `FR-COMPANY-DETAIL-2` The company detail page shall include company identity, hero content, and descriptive overview.
- `FR-COMPANY-DETAIL-3` The company detail page shall display offerings such as tours, packages, transport, and related services.
- `FR-COMPANY-DETAIL-4` The company detail page shall support booking and contact-oriented actions.
- `FR-COMPANY-DETAIL-5` The company detail page shall show reviews, FAQs, and trust-building content where available.
- `FR-COMPANY-DETAIL-6` The company detail page shall allow navigation into related tour or checkout flows.

### 4.7 Destination Detail Page - `destination-detail.html`

- `FR-DESTINATION-DETAIL-1` The destination detail page shall present a destination-level page for a Jordan city or area.
- `FR-DESTINATION-DETAIL-2` The destination detail page shall show destination name, summary, and supporting visual gallery.
- `FR-DESTINATION-DETAIL-3` The destination detail page shall surface related attractions, hotels, companies, or restaurants for that destination.
- `FR-DESTINATION-DETAIL-4` The destination detail page shall connect destination discovery to stories and trip planning.
- `FR-DESTINATION-DETAIL-5` The destination detail page shall handle destination-specific query parameters cleanly.

### 4.8 Tour Detail Page - `tour-detail.html`

- `FR-TOUR-DETAIL-1` The tour detail page shall show one specific tour offering.
- `FR-TOUR-DETAIL-2` The tour detail page shall display title, provider reference, destination context, and pricing-related details.
- `FR-TOUR-DETAIL-3` The tour detail page shall support navigation back to the company profile.
- `FR-TOUR-DETAIL-4` The tour detail page shall allow users to move from tour detail into planning or booking.
- `FR-TOUR-DETAIL-5` The tour detail page shall remain usable even when some optional fields are missing.

### 4.9 Gallery Page - `gallery.html`

- `FR-GALLERY-1` The gallery page shall showcase Jordan travel imagery and event media.
- `FR-GALLERY-2` The gallery page shall present a visual-first browsing experience.
- `FR-GALLERY-3` The gallery page shall include event or place imagery with clear labels where possible.
- `FR-GALLERY-4` The gallery page shall reinforce brand inspiration rather than transactional booking.
- `FR-GALLERY-5` The gallery page shall load cleanly as a static content page with shared TravelMind navigation.

### 4.10 AI Chatbot Page - `chatbot.html`

- `FR-CHATBOT-1` The chatbot page shall provide an AI travel assistant experience for TravelMind users.
- `FR-CHATBOT-2` The chatbot page shall allow users to ask Jordan travel questions in a conversational UI.
- `FR-CHATBOT-3` The chatbot page shall show sent and received messages clearly.
- `FR-CHATBOT-4` The chatbot page shall remain usable even if the AI backend or external provider is unavailable.
- `FR-CHATBOT-5` The chatbot page shall position the chatbot as a support and discovery tool, not a replacement for booking pages.

### 4.11 Trip Planner Page - `trip-planner.html`

- `FR-TRIP-PLANNER-1` The trip planner page shall let a signed-in user create or manage a Jordan trip plan.
- `FR-TRIP-PLANNER-2` The trip planner page shall accept planning inputs such as destination, days, budget, travelers, and interests.
- `FR-TRIP-PLANNER-3` The trip planner page shall display generated or assembled itinerary content.
- `FR-TRIP-PLANNER-4` The trip planner page shall support synchronization with trip data from the backend.
- `FR-TRIP-PLANNER-5` The trip planner page shall redirect unauthenticated users to login when trip creation requires an account.

### 4.12 Checkout Page - `checkout.html`

- `FR-CHECKOUT-1` The checkout page shall present a booking or order checkout flow.
- `FR-CHECKOUT-2` The checkout page shall show selected item summary, image, pricing, and contextual details.
- `FR-CHECKOUT-3` The checkout page shall require authentication before final order actions when needed.
- `FR-CHECKOUT-4` The checkout page shall submit checkout or order data through backend APIs.
- `FR-CHECKOUT-5` The checkout page shall confirm success or failure clearly for the user.

### 4.13 Stories Page - `stories.html`

- `FR-STORIES-1` The stories page shall present short travel stories from real TravelMind travelers.
- `FR-STORIES-2` The stories page shall support browsing of story cards or story detail states using query parameters.
- `FR-STORIES-3` The stories page shall show visual-first content including cover or thumbnail media.
- `FR-STORIES-4` The stories page shall allow engagement actions such as viewing or opening one story.
- `FR-STORIES-5` The stories page shall connect stories back to destinations and trip-planning inspiration.

### 4.14 Traveler Stories Compatibility Page - `traveler-stories.html`

- `FR-TRAVELER-STORIES-1` The traveler stories compatibility page shall preserve compatibility for older links into traveler stories.
- `FR-TRAVELER-STORIES-2` The traveler stories compatibility page shall continue to route users into the active story experience.
- `FR-TRAVELER-STORIES-3` The traveler stories compatibility page shall avoid broken navigation for legacy references inside the frontend.

### 4.15 Authentication Page - `auth.html`

- `FR-AUTH-1` The authentication page shall provide login and registration in one TravelMind auth experience.
- `FR-AUTH-2` The authentication page shall store authentication state required by the frontend.
- `FR-AUTH-3` The authentication page shall respect redirect parameters so users return to their intended page after login.
- `FR-AUTH-4` The authentication page shall show clear validation and error feedback.
- `FR-AUTH-5` The authentication page shall support regular users and role-aware flows used elsewhere in the product.

### 4.16 Account Page - `account.html`

- `FR-ACCOUNT-1` The account page shall show the signed-in user's TravelMind dashboard and account area.
- `FR-ACCOUNT-2` The account page shall surface saved trips, bookings, reviews, and traveler story actions where available.
- `FR-ACCOUNT-3` The account page shall provide quick links into stories, planning, and booking history.
- `FR-ACCOUNT-4` The account page shall handle unauthenticated access by asking the user to sign in.
- `FR-ACCOUNT-5` The account page shall act as the main personal control center for non-admin users.

### 4.17 Analytics Dashboard Page - `dashboard.html`

- `FR-DASHBOARD-1` The dashboard page shall present analytics and operational signals for privileged users.
- `FR-DASHBOARD-2` The dashboard page shall show metrics, reports, or summaries relevant to TravelMind operations or company performance.
- `FR-DASHBOARD-3` The dashboard page shall load backend analytics data safely.
- `FR-DASHBOARD-4` The dashboard page shall restrict access appropriately based on role assumptions in the frontend and backend flow.
- `FR-DASHBOARD-5` The dashboard page shall provide a readable monitoring experience rather than public discovery content.

### 4.18 Admin Page - `admin.html`

- `FR-ADMIN-1` The admin page shall provide admin-facing management tools.
- `FR-ADMIN-2` The admin page shall support attraction management workflows such as listing, creating, editing, and deleting records.
- `FR-ADMIN-3` The admin page shall include moderation capability for traveler stories.
- `FR-ADMIN-4` The admin page shall display platform analytics or operational widgets where implemented.
- `FR-ADMIN-5` The admin page shall enforce admin-only access behavior through frontend checks and backend authorization.

## 5. Shared Technical Requirements

1. Shared JavaScript helpers must remain centralized in `frontend/js/app.js` and `frontend/js/api.js`.
2. Backend base URL resolution must continue to support local development defaults and manual override through browser storage.
3. Data pages should prefer backend APIs over hard-coded content when API support exists.
4. Static content pages may still use local assets in `frontend/image/`.
5. Query-parameter-driven pages must handle missing or invalid parameters gracefully.

## 6. Backend Integration Requirements

1. Authentication pages depend on `/auth` endpoints.
2. Discovery pages depend on catalog-style endpoints for attractions, hotels, restaurants, companies, tours, packages, transport, and photos.
3. Planning pages depend on trips, AI plans, bookings, reviews, and related account data.
4. Admin and dashboard pages depend on analytics, moderation, and management endpoints.
5. Frontend requirements must stay aligned with `frontend/js/api.js` as the source of active client-side API integration.

## 7. Content And UX Requirements

1. The product should consistently frame Jordan as the primary travel destination.
2. Discovery pages should feel inspirational first and transactional second.
3. Planning, checkout, account, and admin pages should be task-focused and clear.
4. Storytelling content should feel authentic and community-driven.
5. Empty states should always explain the next useful action.

## 8. Non-Functional Requirements

### 8.1 Performance

- `NFR-1` Public pages shall load fast enough for normal mobile and desktop browsing conditions.
- `NFR-2` Images shall use appropriate sizes and shall not block the initial page experience unnecessarily.
- `NFR-3` JavaScript shall fail gracefully when one API request is slow or unavailable.
- `NFR-4` Lists such as attractions, hotels, restaurants, and stories shall remain usable with moderate data volumes.

### 8.2 Availability And Reliability

- `NFR-5` Static frontend pages shall remain navigable even if some backend data fails to load.
- `NFR-6` Data-driven pages shall show loading, empty, or error states instead of breaking silently.
- `NFR-7` Query-parameter-driven pages shall handle invalid IDs, missing slugs, or unsupported destinations safely.
- `NFR-8` The frontend shall not assume every API response is complete or perfectly formatted.

### 8.3 Security

- `NFR-9` Authenticated requests shall send the stored bearer token only through the shared API layer.
- `NFR-10` Admin and dashboard pages shall rely on both frontend checks and backend authorization.
- `NFR-11` Sensitive actions such as create, update, delete, checkout, and moderation shall require authenticated backend access.
- `NFR-12` The frontend shall avoid exposing secrets or private configuration values in static files.

### 8.4 Usability

- `NFR-13` Navigation labels, buttons, and page actions shall be understandable to a general travel audience.
- `NFR-14` Important flows such as login, planning, booking, and account access shall require as few confusing steps as possible.
- `NFR-15` The interface shall remain readable across common screen sizes.
- `NFR-16` Error messages shall tell the user what happened and what to do next.

### 8.5 Accessibility

- `NFR-17` Pages shall use semantic headings and readable text structure.
- `NFR-18` Interactive elements shall remain usable through keyboard navigation where practical.
- `NFR-19` Images shall use meaningful `alt` text when they communicate content.
- `NFR-20` Color choices shall preserve readable contrast for key text and action elements.

### 8.6 Maintainability

- `NFR-21` Shared logic shall stay centralized in common frontend files instead of being duplicated across pages.
- `NFR-22` New pages shall be added to the requirements folder with a numbered page section.
- `NFR-23` Page-specific scripts shall remain mapped clearly to their HTML pages.
- `NFR-24` Legacy documentation shall be replaced or redirected instead of left conflicting with current behavior.

### 8.7 Compatibility

- `NFR-25` The frontend shall work in modern desktop and mobile browsers commonly used by the project audience.
- `NFR-26` Local development shall continue to support the API base fallback behavior defined in `frontend/js/api.js`.
- `NFR-27` Legacy links such as `traveler-stories.html` shall continue to resolve users into supported flows.

## 9. Documentation Maintenance Rules

1. Add a new numbered subsection in Section 4 whenever a new frontend page is added.
2. Update the page purpose and key actions whenever a page changes materially.
3. Remove legacy requirements instead of keeping outdated duplicate specs.
4. Treat this document as the primary requirements reference for the frontend.
