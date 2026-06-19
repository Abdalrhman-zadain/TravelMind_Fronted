# Admin Page Test Cases

## Recommended Technology

Use **Playwright** for the admin page.

Why it fits this project:

- The frontend is a static multi-page HTML/CSS/JavaScript app.
- The admin page behavior is mostly browser-level: auth redirect, DOM rendering, filters, pagination, form submission, and API-driven CRUD.
- Playwright can test the full real user flow in one place and can easily mock backend API responses when needed.

## Priority Test Cases

### TC-ADMIN-001: Redirect unauthenticated user to login

- Objective: Verify that a user without a token cannot access the admin page.
- Preconditions: `localStorage` does not contain `tm_token`.
- Steps:
  1. Open `admin.html`.
  2. Wait for the page script to run.
- Expected result:
  1. User is redirected to `auth.html?redirect=admin.html`.

### TC-ADMIN-002: Block non-admin user

- Objective: Verify that a logged-in non-admin user is denied access.
- Preconditions:
  1. `localStorage.tm_token` exists.
  2. `localStorage.tm_user` contains a valid JSON object with `role` not equal to `ADMIN`.
- Steps:
  1. Open `admin.html`.
- Expected result:
  1. Access denied alert appears.
  2. User is redirected to `index.html`.

### TC-ADMIN-003: Load catalog items for selected entity

- Objective: Verify that the catalog manager loads data for the selected entity type.
- Preconditions:
  1. Admin token exists in `localStorage`.
  2. API for `GET /attractions` returns valid data.
- Steps:
  1. Open `admin.html`.
  2. Click `Catalog Manager`.
  3. Keep entity filter on `Attractions`.
- Expected result:
  1. Table loads attraction rows.
  2. Table header shows attraction columns plus `Actions`.

### TC-ADMIN-004: Filter catalog by search text

- Objective: Verify free-text filtering in catalog manager.
- Preconditions:
  1. Attraction data is loaded.
  2. At least one record contains a unique name or city value.
- Steps:
  1. Open `Catalog Manager`.
  2. Enter a unique attraction name or city in the search field.
- Expected result:
  1. Only matching rows remain visible.
  2. Pagination updates to the filtered result set.

### TC-ADMIN-005: Filter catalog by city

- Objective: Verify city dropdown filtering.
- Preconditions:
  1. Attraction data contains more than one city.
- Steps:
  1. Open `Catalog Manager`.
  2. Select a city from the city filter.
- Expected result:
  1. Only rows from the selected city are shown.

### TC-ADMIN-006: Pagination navigation

- Objective: Verify next and previous page behavior.
- Preconditions:
  1. Loaded entity has more than 10 items.
- Steps:
  1. Open `Catalog Manager`.
  2. Click `Next`.
  3. Click `Previous`.
- Expected result:
  1. Page info changes correctly.
  2. `Previous` is disabled on page 1.
  3. `Next` is disabled on the last page.

### TC-ADMIN-007: Create new attraction successfully

- Objective: Verify admin can create a new attraction.
- Preconditions:
  1. Admin token exists.
  2. API `POST /attractions` accepts valid payload.
- Steps:
  1. Open `Add New Item`.
  2. Select `Attraction`.
  3. Fill required fields: `Name (English)` and `City`.
  4. Submit the form.
- Expected result:
  1. Success message appears.
  2. Catalog reloads.
  3. Form resets after successful creation.

### TC-ADMIN-008: Show validation message for missing required fields

- Objective: Verify client-side validation before submitting the form.
- Preconditions:
  1. Admin token exists.
- Steps:
  1. Open `Add New Item`.
  2. Leave required fields empty.
  3. Submit the form.
- Expected result:
  1. Error message appears.
  2. No create request is sent.

### TC-ADMIN-009: Edit existing catalog item

- Objective: Verify admin can edit an existing item.
- Preconditions:
  1. At least one catalog record exists.
  2. Update API returns success.
- Steps:
  1. Open `Catalog Manager`.
  2. Click `Edit` on an item.
  3. Update one or more fields.
  4. Submit the form.
- Expected result:
  1. Form title changes to edit mode.
  2. Success message appears after submit.
  3. Updated value appears after reload.

### TC-ADMIN-010: Delete catalog item

- Objective: Verify admin can delete an item after confirmation.
- Preconditions:
  1. At least one catalog record exists.
  2. Delete API returns success.
- Steps:
  1. Open `Catalog Manager`.
  2. Click `Delete` on an item.
  3. Confirm the browser dialog.
- Expected result:
  1. Delete request is sent.
  2. Item is removed from the table.
  3. Success toast appears.

### TC-ADMIN-011: Load traveler stories for moderation

- Objective: Verify stories moderation section loads story rows.
- Preconditions:
  1. Admin token exists.
  2. Stories API returns story data.
- Steps:
  1. Open `Stories Moderation`.
- Expected result:
  1. Stories table renders rows.
  2. Each row shows story, traveler, destination, status, and action buttons.

### TC-ADMIN-012: Filter stories by status

- Objective: Verify filtering active and inactive stories.
- Preconditions:
  1. Stories dataset contains both active and inactive stories.
- Steps:
  1. Open `Stories Moderation`.
  2. Select `Active`.
  3. Select `Inactive`.
- Expected result:
  1. Table updates to show only the chosen status each time.

### TC-ADMIN-013: Toggle story status

- Objective: Verify admin can enable or disable a story.
- Preconditions:
  1. At least one story exists.
  2. Story status update API returns success.
- Steps:
  1. Open `Stories Moderation`.
  2. Click `Disable` or `Enable` on a story.
- Expected result:
  1. Update request is sent with the new `isActive` value.
  2. Stories table reloads.
  3. Success toast appears.

### TC-ADMIN-014: Delete story

- Objective: Verify admin can delete a story after confirmation.
- Preconditions:
  1. At least one story exists.
  2. Delete story API returns success.
- Steps:
  1. Open `Stories Moderation`.
  2. Click `Delete`.
  3. Confirm the browser dialog.
- Expected result:
  1. Story is removed after reload.
  2. Success toast appears.

### TC-ADMIN-015: Create new hotel successfully

- Objective: Verify admin can create a new hotel from the shared item form.
- Preconditions:
  1. Admin token exists.
  2. API `POST /hotels` accepts valid payload.
- Steps:
  1. Open `Add New Item`.
  2. Select `Hotel`.
  3. Fill required fields: `Name (English)` and `City`.
  4. Submit the form.
- Expected result:
  1. Success message appears.
  2. Hotel catalog reloads successfully.
  3. The new hotel can be found in `Catalog Manager`.

### TC-ADMIN-016: Create new restaurant successfully

- Objective: Verify admin can create a new restaurant from the shared item form.
- Preconditions:
  1. Admin token exists.
  2. API `POST /restaurants` accepts valid payload.
- Steps:
  1. Open `Add New Item`.
  2. Select `Restaurant`.
  3. Fill required fields: `Name (English)` and `City`.
  4. Submit the form.
- Expected result:
  1. Success message appears.
  2. Restaurant catalog reloads successfully.
  3. The new restaurant can be found in `Catalog Manager`.

### TC-ADMIN-017: Create new company successfully

- Objective: Verify admin can create a new company from the shared item form.
- Preconditions:
  1. Admin token exists.
  2. API `POST /companies` accepts valid payload.
- Steps:
  1. Open `Add New Item`.
  2. Select `Company`.
  3. Fill required fields: `Company Name` and `City`.
  4. Submit the form.
- Expected result:
  1. Success message appears.
  2. Company catalog reloads successfully.
  3. The new company can be found in `Catalog Manager`.
