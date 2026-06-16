# TravelMind System Design And Architecture

## 1. Purpose

This document describes the current system design and software architecture of the TravelMind project based on the existing codebase.

It is intended to complement the functional and non-functional requirements by explaining how the system is structured and how the major parts interact.

## 2. System Overview

TravelMind is a travel platform focused on Jordan tourism.

The system provides:

1. Public travel discovery pages.
2. Account and authentication features.
3. Trip planning and checkout workflows.
4. Business, analytics, and admin features.
5. Community content such as traveler stories.

At a high level, the system is split into:

1. `frontend/` for the client-side static web application.
2. `backend/` for the Node.js and Express API.
3. PostgreSQL through Prisma for persistent data storage.

## 3. Architecture Style

The project currently follows a layered web application architecture with a clear frontend/backend split.

### 3.1 Architectural Pattern

1. Presentation layer: HTML, CSS, and JavaScript in `frontend/`.
2. Application/API layer: Express routes and business logic in `backend/src/`.
3. Data access layer: Prisma ORM and PostgreSQL schema in `backend/prisma/`.

### 3.2 Overall Style

1. Monolithic backend application.
2. Static multi-page frontend application.
3. REST-style API communication between frontend and backend.
4. Shared authentication and utility helpers reused across backend modules.

## 4. High-Level System Context

```text
+----------------------+
|      End Users       |
| Travelers / Admins   |
+----------+-----------+
           |
           v
+----------------------+
|   Frontend (MPA)     |
| HTML + CSS + JS      |
| frontend/            |
+----------+-----------+
           |
           | HTTP / JSON
           v
+----------------------+
| Backend API          |
| Node.js + Express    |
| backend/src/server.js|
+----------+-----------+
           |
           v
+----------------------+
| Prisma ORM           |
+----------+-----------+
           |
           v
+----------------------+
| PostgreSQL Database  |
+----------------------+
```

## 5. Frontend Architecture

### 5.1 Frontend Style

The frontend is a static multi-page application.

Each page is implemented as an individual HTML file and enhanced with page-specific JavaScript plus shared utilities.

### 5.2 Main Frontend Building Blocks

1. HTML pages under `frontend/`.
2. Shared CSS in `frontend/css/style.css`.
3. Page-specific CSS files in `frontend/css/`.
4. Shared JavaScript in `frontend/js/app.js`.
5. Shared API client logic in `frontend/js/api.js`.
6. Page-specific JavaScript modules such as `home.js`, `attractions.js`, `trip-planner.js`, and `admin.js`.

### 5.3 Frontend Responsibilities

1. Render static layout and page structure.
2. Fetch and display backend data.
3. Manage client-side interactions.
4. Store authentication token in browser storage.
5. Route users between pages using links and query parameters.

### 5.4 Frontend Design Decision

The frontend is intentionally framework-free and uses vanilla JavaScript.

This makes the project simple to run and easy to inspect, but it also means:

1. Shared state is lightweight and manually managed.
2. Cross-page reuse depends on helper files rather than a component framework.
3. Large pages can accumulate page-specific logic quickly.

## 6. Backend Architecture

### 6.1 Backend Entry Point

The main backend application starts from:

- `backend/src/server.js`

This file is responsible for:

1. Loading environment variables.
2. Creating the Express app.
3. Initializing Prisma.
4. Configuring middleware such as CORS, JSON parsing, and logging.
5. Registering route modules.
6. Providing API documentation support.

### 6.2 Backend Layering

The backend is organized by modules and common shared utilities.

```text
backend/src/
|- common/
|  |- auth/
|  |- http/
|  `- utils/
|- modules/
|  |- auth/
|  |- catalog/
|  |- community/
|  |- health/
|  |- meta/
|  `- planning/
`- server.js
```

### 6.3 Common Layer

The `common/` folder contains reusable infrastructure code:

1. `common/auth/` for JWT-based authentication helpers and authorization middleware.
2. `common/http/` for HTTP helpers such as async handler utilities.
3. `common/utils/` for request normalization and parsing helpers.

### 6.4 Module Layer

The `modules/` folder contains domain-focused route definitions:

1. `auth/` handles login and registration endpoints.
2. `catalog/` handles attractions, hotels, restaurants, companies, tours, packages, transport, and related discovery data.
3. `community/` handles traveler stories and community interactions.
4. `health/` exposes health-check endpoints.
5. `meta/` exposes metadata endpoints.
6. `planning/` handles trips, expenses, journals, analytics, checkout-related flows, guides, notifications, and other planning/business features.

### 6.5 Backend Design Decision

The backend is modular, but still deployed as one monolithic service.

This gives the project:

1. Simple local development.
2. Centralized configuration.
3. Easier early-stage iteration.

It also means:

1. `server.js` remains a high-responsibility file.
2. Some route modules may grow large over time.
3. Domain boundaries exist logically, but not as separate deployable services.

## 7. Data Architecture

### 7.1 Data Access Technology

The backend uses:

1. Prisma ORM for database access.
2. PostgreSQL as the primary relational database.

### 7.2 Core Domain Entities

Based on the Prisma schema, major entities include:

1. `User`
2. `Attraction`
3. `Hotel`
4. `Restaurant`
5. `Category`
6. `Trip`
7. `Expense`
8. `Journal`
9. `Review`
10. `Company`
11. `Tour`
12. `Package`
13. `Transport`
14. `TravelerStory`
15. `CheckoutOrder`
16. `DashboardNotification`
17. `GuideBooking`
18. `AiTripPlan`

### 7.3 Data Model Characteristics

The data model combines:

1. Travel catalog data.
2. User-generated content.
3. Planning and personal trip data.
4. Booking and commerce-related data.
5. Company and operational analytics data.

### 7.4 Data Relationships

Important relationship patterns include:

1. One user to many trips, journals, reviews, orders, and stories.
2. One attraction to many tours, packages, transport services, guides, and related stories.
3. One company to many services, bookings, and operational records.
4. Shared review and favorite behavior across different travel entities.

## 8. API Design

### 8.1 API Style

The backend exposes REST-style JSON endpoints under `/api`.

### 8.2 API Responsibilities

The API provides:

1. Authentication endpoints.
2. Catalog read and management endpoints.
3. Community/story endpoints.
4. Planning and trip management endpoints.
5. Checkout and analytics endpoints.

### 8.3 API Client Design

The frontend accesses the backend through `frontend/js/api.js`.

That file:

1. Resolves the API base URL.
2. Handles bearer token injection.
3. Provides grouped API helpers such as `AuthAPI`, `AttractionsAPI`, `TripsAPI`, `TravelerStoriesAPI`, and `CheckoutOrdersAPI`.

## 9. Authentication And Authorization Design

### 9.1 Authentication Method

The project uses JWT-based authentication.

### 9.2 Authentication Flow

```text
User logs in on auth.html
        |
        v
Frontend calls /api/auth/login
        |
        v
Backend validates credentials
        |
        v
JWT token returned
        |
        v
Token stored in browser localStorage
        |
        v
Future API requests include Authorization header
```

### 9.3 Authorization

Authorization is enforced through backend helpers such as:

1. `requireAuth`
2. `requireAdmin`
3. `requireSelfOrAdmin`
4. `requireCompanyOwnerOrAdmin`

This supports role-based access for:

1. Travelers
2. Company owners
3. Admin users

## 10. Major Functional Subsystems

### 10.1 Discovery Subsystem

Responsible for:

1. Home page browsing.
2. Attractions, hotels, restaurants, companies, and gallery experiences.
3. Destination and tour detail pages.

### 10.2 Planning Subsystem

Responsible for:

1. Trip planning.
2. Trip persistence.
3. Expenses and journals.
4. AI trip plan support.

### 10.3 Community Subsystem

Responsible for:

1. Traveler stories.
2. Story interactions.
3. Story moderation.

### 10.4 Commerce And Booking Subsystem

Responsible for:

1. Checkout flows.
2. Orders and payment transaction records.
3. Company booking-related data.

### 10.5 Administration And Analytics Subsystem

Responsible for:

1. Admin management pages.
2. Dashboard analytics.
3. Operational notifications.
4. Moderation and privileged access flows.

## 11. Request Flow Example

### 11.1 Example: Load Attractions

```text
User opens attractions.html
        |
        v
frontend/js/attractions.js calls AttractionsAPI.getAll()
        |
        v
frontend/js/api.js sends GET /api/attractions
        |
        v
backend catalog module processes request
        |
        v
Prisma queries PostgreSQL
        |
        v
JSON response returned to frontend
        |
        v
Frontend renders attraction cards
```

### 11.2 Example: Save A Trip

```text
User fills trip planner form
        |
        v
Frontend sends POST /api/trips
        |
        v
Backend planning module validates auth and payload
        |
        v
Prisma stores the trip record
        |
        v
Frontend updates planner state and UI
```

## 12. Deployment And Runtime View

### 12.1 Development Runtime

In development, the system is expected to run as:

1. Static frontend files opened from `frontend/`.
2. Backend API running locally from `backend/` on port `3000` by default.
3. PostgreSQL running locally or through a configured environment connection.

### 12.2 Runtime Dependencies

Main runtime dependencies include:

1. Node.js
2. Express
3. Prisma
4. PostgreSQL
5. Browser localStorage
6. External data or service integrations where configured

## 13. Architectural Strengths

1. Clear separation between frontend and backend folders.
2. Modular backend domain grouping.
3. Centralized API access on the frontend.
4. Scalable relational data model for travel, community, and planning features.
5. Easy local development for a student or small-team project.

## 14. Architectural Constraints And Improvement Areas

1. The frontend is a static multi-page app, so shared state and reuse are manual.
2. Some backend route files are large and may need further service-level extraction later.
3. `server.js` carries multiple responsibilities and could be split further.
4. The architecture would benefit from a dedicated service layer between routes and Prisma for large features.
5. Future deployment would benefit from a clearer static hosting strategy for the frontend and API hosting strategy for the backend.

## 15. Recommended Documentation Set

For this project, the documentation set should now include:

1. `PROJECT_PAGE_REQUIREMENTS.md` for functional and non-functional requirements.
2. `SYSTEM_DESIGN_AND_ARCHITECTURE.md` for system structure and technical architecture.
3. `COMPONENT_STRUCTURE.md` for frontend file mapping.
4. Optional future `API_SPECIFICATION.md` for endpoint-by-endpoint API documentation.
5. Optional future `DATABASE_DESIGN.md` for entity relationships and schema explanation.
