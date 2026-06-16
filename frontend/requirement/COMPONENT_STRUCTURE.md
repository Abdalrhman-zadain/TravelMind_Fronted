# TravelMind Frontend Structure

## 1. Folder Structure

```text
frontend/
|- account.html
|- admin.html
|- attractions.html
|- auth.html
|- chatbot.html
|- checkout.html
|- companies.html
|- company-detail.html
|- dashboard.html
|- destination-detail.html
|- gallery.html
|- hotels.html
|- index.html
|- restaurants.html
|- stories.html
|- tour-detail.html
|- traveler-stories.html
|- trip-planner.html
|- css/
|- image/
|- js/
`- requirement/
```

## 2. Shared Frontend Files

1. `css/style.css` contains shared design tokens and global styles.
2. `js/api.js` contains backend API helpers and endpoint access.
3. `js/app.js` contains shared frontend utilities and app-wide behaviors.

## 3. Page To Script Mapping

1. `index.html` -> `js/home.js`
2. `attractions.html` -> `js/attractions.js`
3. `hotels.html` -> `js/hotels.js`
4. `restaurants.html` -> `js/restaurants.js`
5. `companies.html` -> `js/companies.js`, `js/travel-map.js`
6. `company-detail.html` -> `js/company-detail.js`, `js/travel-map.js`, `js/booking-sync.js`
7. `destination-detail.html` -> `js/destination-detail.js`
8. `tour-detail.html` -> `js/tour-detail.js`, `js/travel-map.js`
9. `gallery.html` -> `js/gallery.js`
10. `chatbot.html` -> chatbot UI logic with shared app/api helpers
11. `trip-planner.html` -> `js/trip-planner.js`, `js/trip-sync.js`, `js/booking-sync.js`
12. `checkout.html` -> `js/checkout.js`, `js/booking-sync.js`
13. `stories.html` -> `js/traveler-stories.js`, `js/traveler-stories-data.js`
14. `traveler-stories.html` -> legacy story entry behavior
15. `auth.html` -> `js/auth.js`
16. `account.html` -> `js/account.js`, `js/trip-sync.js`, `js/booking-sync.js`, `js/reviews-sync.js`
17. `dashboard.html` -> `js/dashboard.js`
18. `admin.html` -> `js/admin.js`, `js/dashboard.js`

## 4. Asset Structure

1. `image/city/` contains destination and city visuals.
2. `image/Event/` contains event imagery.
3. `image/` root contains additional gallery and place images.

## 5. Documentation Rule

1. Keep `PROJECT_PAGE_REQUIREMENTS.md` as the source of truth for page requirements.
2. Use this file only to understand where each page is implemented.
