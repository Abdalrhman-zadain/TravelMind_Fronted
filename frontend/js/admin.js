const adminState = {
  stories: [],
  filteredStories: [],
  currentEditId: null,
  currentPage: 1,
  itemsPerPage: 10,
  currentEntity: "attraction",
  catalog: {
    attraction: [],
    hotel: [],
    restaurant: [],
    company: [],
  },
  filtered: [],
  users: [],
  filteredUsers: [],
  companies: [],
  bookings: [],
  filteredBookings: [],
  checkoutOrders: [],
  filteredCheckoutOrders: [],
  guideBookings: [],
  filteredGuideBookings: [],
  guides: [],
  filteredGuides: [],
  notifications: [],
  filteredNotifications: [],
};

const ENTITY_CONFIG = {
  attraction: {
    label: "Attraction",
    pluralLabel: "Attractions",
    listPath: "/attractions",
    createPath: "/attractions",
    updatePath: (id) => `/attractions/${id}`,
    deletePath: (id) => `/attractions/${id}`,
    searchFields: ["nameEn", "nameAr", "city", "descriptionEn", "descriptionAr"],
    cityField: "city",
    columns: [
      { label: "ID", value: (item) => item.id ?? "-" },
      { label: "Name", value: (item) => item.nameEn || item.title || "N/A" },
      { label: "City", value: (item) => item.city || "-" },
      { label: "Category", value: (item) => item.category || item.categoryName || "-" },
      { label: "Rating", value: (item) => formatNumber(item.rating, 1) || "-" },
      {
        label: "Entry Fee",
        value: (item) => (Number(item.entryFee || 0) > 0 ? `${item.entryFee} JOD` : "Free"),
      },
    ],
    fields: [
      { key: "nameEn", label: "Name (English)", type: "text", required: true },
      { key: "nameAr", label: "Name (Arabic)", type: "text" },
      { key: "city", label: "City", type: "text", required: true },
      { key: "category", label: "Category", type: "text" },
      { key: "descriptionEn", label: "Description (English)", type: "textarea" },
      { key: "descriptionAr", label: "Description (Arabic)", type: "textarea" },
      { key: "image", label: "Main Image URL", type: "url" },
      { key: "latitude", label: "Latitude", type: "number", step: "0.000001" },
      { key: "longitude", label: "Longitude", type: "number", step: "0.000001" },
      { key: "rating", label: "Rating", type: "number", min: "0", max: "5", step: "0.1" },
      { key: "entryFee", label: "Entry Fee (JOD)", type: "number", min: "0", step: "0.01" },
      { key: "openingHours", label: "Opening Hours", type: "text" },
      { key: "languages", label: "Languages (comma-separated)", type: "text" },
    ],
    requiredFields: ["nameEn", "city"],
    toPayload() {
      return {
        nameEn: fieldValue("nameEn"),
        nameAr: fieldValue("nameAr"),
        city: fieldValue("city"),
        category: fieldValue("category"),
        descriptionEn: fieldValue("descriptionEn"),
        descriptionAr: fieldValue("descriptionAr"),
        image: fieldValue("image"),
        latitude: numberOrNull("latitude"),
        longitude: numberOrNull("longitude"),
        rating: numberOrZero("rating"),
        entryFee: numberOrZero("entryFee"),
        openingHours: fieldValue("openingHours"),
        languages: csvValue("languages"),
      };
    },
  },
  hotel: {
    label: "Hotel",
    pluralLabel: "Hotels",
    listPath: "/hotels",
    createPath: "/hotels",
    updatePath: (id) => `/hotels/${id}`,
    deletePath: (id) => `/hotels/${id}`,
    searchFields: ["nameEn", "nameAr", "city", "descriptionEn", "descriptionAr", "country"],
    cityField: "city",
    columns: [
      { label: "ID", value: (item) => item.id ?? "-" },
      { label: "Name", value: (item) => item.nameEn || "N/A" },
      { label: "City", value: (item) => item.city || "-" },
      { label: "Stars", value: (item) => item.stars || "-" },
      { label: "Rating", value: (item) => formatNumber(item.rating, 1) || "-" },
      { label: "Price / Night", value: (item) => (item.pricePerNight ? `${item.pricePerNight} JOD` : "-") },
    ],
    fields: [
      { key: "nameEn", label: "Name (English)", type: "text", required: true },
      { key: "nameAr", label: "Name (Arabic)", type: "text" },
      { key: "city", label: "City", type: "text", required: true },
      { key: "country", label: "Country", type: "text" },
      { key: "descriptionEn", label: "Description (English)", type: "textarea" },
      { key: "descriptionAr", label: "Description (Arabic)", type: "textarea" },
      { key: "stars", label: "Stars", type: "number", min: "1", max: "7", step: "1" },
      { key: "pricePerNight", label: "Price Per Night", type: "number", min: "0", step: "0.01" },
      { key: "rating", label: "Rating", type: "number", min: "0", max: "5", step: "0.1" },
      { key: "imageUrl", label: "Image URL", type: "url" },
      { key: "latitude", label: "Latitude", type: "number", step: "0.000001" },
      { key: "longitude", label: "Longitude", type: "number", step: "0.000001" },
    ],
    requiredFields: ["nameEn", "city"],
    toPayload() {
      return {
        nameEn: fieldValue("nameEn"),
        nameAr: fieldValue("nameAr"),
        city: fieldValue("city"),
        country: fieldValue("country"),
        descriptionEn: fieldValue("descriptionEn"),
        descriptionAr: fieldValue("descriptionAr"),
        stars: numberOrNull("stars"),
        pricePerNight: numberOrZero("pricePerNight"),
        rating: numberOrZero("rating"),
        imageUrl: fieldValue("imageUrl"),
        latitude: numberOrNull("latitude"),
        longitude: numberOrNull("longitude"),
      };
    },
  },
  restaurant: {
    label: "Restaurant",
    pluralLabel: "Restaurants",
    listPath: "/restaurants",
    createPath: "/restaurants",
    updatePath: (id) => `/restaurants/${id}`,
    deletePath: (id) => `/restaurants/${id}`,
    searchFields: ["nameEn", "nameAr", "city", "cuisine", "descriptionEn", "descriptionAr"],
    cityField: "city",
    columns: [
      { label: "ID", value: (item) => item.id ?? "-" },
      { label: "Name", value: (item) => item.nameEn || "N/A" },
      { label: "City", value: (item) => item.city || "-" },
      { label: "Cuisine", value: (item) => item.cuisine || "-" },
      { label: "Rating", value: (item) => formatNumber(item.rating, 1) || "-" },
      { label: "Phone", value: (item) => item.phone || "-" },
    ],
    fields: [
      { key: "nameEn", label: "Name (English)", type: "text", required: true },
      { key: "nameAr", label: "Name (Arabic)", type: "text" },
      { key: "city", label: "City", type: "text", required: true },
      { key: "cuisine", label: "Cuisine", type: "text" },
      { key: "priceRange", label: "Price Range", type: "text" },
      { key: "descriptionEn", label: "Description (English)", type: "textarea" },
      { key: "descriptionAr", label: "Description (Arabic)", type: "textarea" },
      { key: "phone", label: "Phone", type: "text" },
      { key: "rating", label: "Rating", type: "number", min: "0", max: "5", step: "0.1" },
      { key: "photo_url", label: "Photo URL", type: "url" },
    ],
    requiredFields: ["nameEn", "city"],
    toPayload() {
      return {
        nameEn: fieldValue("nameEn"),
        nameAr: fieldValue("nameAr"),
        city: fieldValue("city"),
        cuisine: fieldValue("cuisine"),
        priceRange: fieldValue("priceRange"),
        descriptionEn: fieldValue("descriptionEn"),
        descriptionAr: fieldValue("descriptionAr"),
        phone: fieldValue("phone"),
        rating: numberOrZero("rating"),
        photo_url: fieldValue("photo_url"),
      };
    },
  },
  company: {
    label: "Company",
    pluralLabel: "Companies",
    listPath: "/companies",
    createPath: "/companies",
    updatePath: (id) => `/companies/id/${id}`,
    deletePath: (id) => `/companies/id/${id}`,
    searchFields: ["name", "city", "location", "tagline", "description", "website"],
    cityField: "city",
    columns: [
      { label: "ID", value: (item) => item.id ?? "-" },
      { label: "Name", value: (item) => item.name || "N/A" },
      { label: "City", value: (item) => item.city || "-" },
      { label: "Verified", value: (item) => (item.isVerified ? "Yes" : "No") },
      { label: "Rating", value: (item) => formatNumber(item.rating, 1) || "-" },
      { label: "Website", value: (item) => item.website || "-" },
    ],
    fields: [
      { key: "name", label: "Company Name", type: "text", required: true },
      { key: "slug", label: "Slug", type: "text", placeholder: "auto-generated if left blank" },
      { key: "city", label: "City", type: "text", required: true },
      { key: "location", label: "Location", type: "text" },
      { key: "country", label: "Country", type: "text" },
      { key: "tagline", label: "Tagline", type: "text" },
      { key: "description", label: "Description", type: "textarea" },
      { key: "longDescription", label: "Long Description", type: "textarea" },
      { key: "logo", label: "Logo URL / Path", type: "text" },
      { key: "heroImage", label: "Hero Image URL / Path", type: "text" },
      { key: "phone", label: "Phone", type: "text" },
      { key: "email", label: "Email", type: "email" },
      { key: "whatsapp", label: "WhatsApp", type: "text" },
      { key: "website", label: "Website", type: "url" },
      { key: "foundedYear", label: "Founded Year", type: "number", min: "1900", step: "1" },
      { key: "latitude", label: "Latitude", type: "number", step: "0.000001" },
      { key: "longitude", label: "Longitude", type: "number", step: "0.000001" },
      { key: "rating", label: "Rating", type: "number", min: "0", max: "5", step: "0.1" },
      { key: "reviewsCount", label: "Reviews Count", type: "number", min: "0", step: "1" },
      { key: "supportedLanguages", label: "Supported Languages (comma-separated)", type: "text" },
      { key: "servicesOffered", label: "Services Offered (comma-separated)", type: "text" },
      { key: "badges", label: "Badges (comma-separated)", type: "text" },
      { key: "isVerified", label: "Verified Company", type: "checkbox" },
      { key: "isLicensed", label: "Licensed Company", type: "checkbox" },
    ],
    requiredFields: ["name", "city"],
    toPayload() {
      return {
        name: fieldValue("name"),
        slug: fieldValue("slug"),
        city: fieldValue("city"),
        location: fieldValue("location"),
        country: fieldValue("country") || "Jordan",
        tagline: fieldValue("tagline"),
        description: fieldValue("description"),
        longDescription: fieldValue("longDescription"),
        logo: fieldValue("logo"),
        heroImage: fieldValue("heroImage") || fieldValue("logo"),
        phone: fieldValue("phone"),
        email: fieldValue("email"),
        whatsapp: fieldValue("whatsapp"),
        website: fieldValue("website"),
        foundedYear: numberOrNull("foundedYear"),
        latitude: numberOrNull("latitude"),
        longitude: numberOrNull("longitude"),
        rating: numberOrNull("rating"),
        reviewsCount: numberOrZero("reviewsCount"),
        supportedLanguages: csvValue("supportedLanguages"),
        servicesOffered: csvValue("servicesOffered"),
        badges: csvValue("badges"),
        isVerified: checkboxValue("isVerified"),
        isLicensed: checkboxValue("isLicensed"),
        gallery: [fieldValue("heroImage") || fieldValue("logo")].filter(Boolean),
      };
    },
  },
};

function adminById(id) {
  return document.getElementById(id);
}

function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem("tm_user") || "null");
  } catch (_error) {
    return null;
  }
}

function adminEsc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatNumber(value, digits = 0) {
  const num = Number(value);
  if (!Number.isFinite(num)) return "";
  return num.toFixed(digits);
}

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

function formatCurrency(value, currency = "JOD") {
  const amount = Number(value || 0);
  return `${amount.toFixed(2)} ${currency || "JOD"}`;
}

function currentConfig() {
  return ENTITY_CONFIG[adminState.currentEntity];
}

function fieldId(key) {
  return `field-${key}`;
}

function fieldElement(key) {
  return adminById(fieldId(key));
}

function fieldValue(key) {
  return String(fieldElement(key)?.value || "").trim();
}

function checkboxValue(key) {
  return Boolean(fieldElement(key)?.checked);
}

function numberOrNull(key) {
  const value = fieldValue(key);
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function numberOrZero(key) {
  const value = numberOrNull(key);
  return value ?? 0;
}

function csvValue(key) {
  return String(fieldValue(key) || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function getAdminApiHeaders(includeJson = false) {
  const token = localStorage.getItem("tm_token");
  const headers = {};
  if (includeJson) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

async function adminApiRequest(method, path, body = null) {
  if (typeof api === "function") return api(method, path, body);

  const response = await fetch(path, {
    method,
    headers: getAdminApiHeaders(Boolean(body)),
    body: body ? JSON.stringify(body) : undefined,
  });

  if (response.status === 204) return null;

  const raw = await response.text();
  let payload = raw || null;
  try {
    payload = raw ? JSON.parse(raw) : null;
  } catch (_error) {
    payload = raw || null;
  }

  if (!response.ok) {
    throw new Error(payload?.message || payload || `Request failed with status ${response.status}`);
  }

  return payload;
}

async function checkAdminAuth() {
  try {
    const token = localStorage.getItem("tm_token");
    const tmUser = getCurrentUser();

    if (!token) {
      location.href = "auth.html?redirect=admin.html";
      return false;
    }

    if (tmUser && tmUser.role && tmUser.role !== "ADMIN") {
      alert("Access denied. Admin role required.");
      location.href = "index.html";
      return false;
    }

    return true;
  } catch (error) {
    console.error("Auth check failed:", error);
    location.href = "auth.html?redirect=admin.html";
    return false;
  }
}

function handleLogout() {
  localStorage.removeItem("tm_token");
  localStorage.removeItem("tm_user");
  location.href = "auth.html";
}

function showSection(sectionName) {
  if (!sectionName) return;

  document.querySelectorAll(".admin-section").forEach((section) => section.classList.remove("active"));
  adminById(`section-${sectionName}`)?.classList.add("active");

  document.querySelectorAll(".admin-nav-item").forEach((item) => {
    item.classList.toggle("active", item.dataset.section === sectionName);
  });

  if (sectionName === "list") {
    loadCatalogItems();
  } else if (sectionName === "stories") {
    loadStories();
  } else if (sectionName === "create") {
    syncFormEntitySelector();
    if (!adminState.currentEditId) {
      renderEntityForm();
      resetForm();
    }
  } else if (sectionName === "users") {
    loadUsers();
  } else if (sectionName === "operations") {
    loadOperationsData();
  } else if (sectionName === "guides") {
    loadGuides();
  } else if (sectionName === "notifications") {
    loadNotifications();
  }
}

function syncFormEntitySelector() {
  const selector = adminById("form-entity-type");
  if (selector) selector.value = adminState.currentEntity;
}

function renderEntityForm() {
  const container = adminById("entity-form-fields");
  const config = currentConfig();
  const rows = [];

  for (let i = 0; i < config.fields.length; i += 2) {
    rows.push(config.fields.slice(i, i + 2));
  }

  container.innerHTML = rows
    .map(
      (row) => `
        <div class="form-row">
          ${row.map(renderFieldMarkup).join("")}
        </div>
      `
    )
    .join("");
}

function renderFieldMarkup(field) {
  if (field.type === "checkbox") {
    return `
      <div class="form-group">
        <label for="${fieldId(field.key)}">${adminEsc(field.label)}</label>
        <label class="checkbox-row">
          <input id="${fieldId(field.key)}" class="form-field form-checkbox" type="checkbox" />
          <span>Enabled</span>
        </label>
      </div>
    `;
  }

  const attrs = [
    `id="${fieldId(field.key)}"`,
    `class="form-field"`,
    field.placeholder ? `placeholder="${adminEsc(field.placeholder)}"` : "",
    field.required ? "required" : "",
    field.step ? `step="${field.step}"` : "",
    field.min ? `min="${field.min}"` : "",
    field.max ? `max="${field.max}"` : "",
  ]
    .filter(Boolean)
    .join(" ");

  const control =
    field.type === "textarea"
      ? `<textarea ${attrs} rows="4"></textarea>`
      : `<input ${attrs} type="${field.type || "text"}" />`;

  return `
    <div class="form-group">
      <label for="${fieldId(field.key)}">${adminEsc(field.label)}${field.required ? " *" : ""}</label>
      ${control}
    </div>
  `;
}

function updateCatalogLabels() {
  const config = currentConfig();
  const formMode = adminState.currentEditId ? "Edit" : "Add New";
  adminById("form-title").textContent = `${formMode} ${config.label}`;
  adminById("submit-btn").textContent = `${adminState.currentEditId ? "Update" : "Create"} ${config.label}`;
  adminById("search-input").placeholder = `Search ${config.pluralLabel.toLowerCase()} by name, city...`;
  renderCatalogTableHead();
}

function renderCatalogTableHead() {
  const config = currentConfig();
  adminById("catalog-table-head").innerHTML = `
    ${config.columns.map((column) => `<th>${adminEsc(column.label)}</th>`).join("")}
    <th>Actions</th>
  `;
}

function resetForm() {
  adminState.currentEditId = null;
  adminById("attraction-form").reset();
  adminById("attr-id").value = "";
  syncFormEntitySelector();
  updateCatalogLabels();
  adminById("form-message").hidden = true;
}

function populateFormForEdit(item) {
  const config = currentConfig();
  adminState.currentEditId = item.id;
  adminById("attr-id").value = item.id;

  config.fields.forEach((field) => {
    const element = fieldElement(field.key);
    if (!element) return;
    if (field.type === "checkbox") {
      element.checked = Boolean(item[field.key]);
      return;
    }
    const value = item[field.key];
    element.value = Array.isArray(value) ? value.join(", ") : value ?? "";
  });

  updateCatalogLabels();
}

async function ensureCompaniesLoaded() {
  if (adminState.companies.length) return adminState.companies;
  try {
    adminState.companies = await CompaniesAPI.getAll();
  } catch (error) {
    console.error("Error loading companies:", error);
    adminState.companies = [];
  }
  populateCompanySelects();
  return adminState.companies;
}

function populateCompanySelects() {
  const options = ['<option value="">No company</option>']
    .concat(
      adminState.companies.map(
        (company) => `<option value="${Number(company.id)}">${adminEsc(company.name || `Company #${company.id}`)}</option>`
      )
    )
    .join("");

  const guideSelect = adminById("guide-company-id");
  const notificationSelect = adminById("notification-company-id");
  if (guideSelect) guideSelect.innerHTML = options;
  if (notificationSelect) notificationSelect.innerHTML = options;
}

async function loadCatalogItems() {
  const tbody = adminById("attractions-tbody");
  const config = currentConfig();

  try {
    adminState.catalog[adminState.currentEntity] = await adminApiRequest("GET", config.listPath);
    adminState.currentPage = 1;
    applyFilters();
    populateCityFilter();
    if (adminState.currentEntity === "company") {
      adminState.companies = adminState.catalog.company.slice();
      populateCompanySelects();
    }
  } catch (error) {
    console.error(`Error loading ${config.pluralLabel.toLowerCase()}:`, error);
    tbody.innerHTML = `<tr><td colspan="${config.columns.length + 1}" class="loading-cell">Error loading ${config.pluralLabel.toLowerCase()}</td></tr>`;
  }
}

function populateCityFilter() {
  const config = currentConfig();
  const cityFilter = adminById("city-filter");
  const currentCity = cityFilter.value;
  const cities = [
    ...new Set(
      (adminState.catalog[adminState.currentEntity] || [])
        .map((item) => item[config.cityField])
        .filter(Boolean)
    ),
  ];

  cityFilter.innerHTML = `<option value="">All Cities</option>${cities
    .map((city) => `<option value="${adminEsc(city)}">${adminEsc(city)}</option>`)
    .join("")}`;
  cityFilter.value = cities.includes(currentCity) ? currentCity : "";
}

function applyFilters() {
  const config = currentConfig();
  const search = adminById("search-input").value.toLowerCase();
  const city = adminById("city-filter").value;

  adminState.filtered = (adminState.catalog[adminState.currentEntity] || []).filter((item) => {
    const matchesSearch =
      !search ||
      config.searchFields.some((field) => String(item[field] || "").toLowerCase().includes(search));
    const matchesCity = !city || String(item[config.cityField] || "") === city;
    return matchesSearch && matchesCity;
  });

  adminState.currentPage = 1;
  renderCatalogTable();
}

function renderCatalogTable() {
  const tbody = adminById("attractions-tbody");
  const config = currentConfig();
  const start = (adminState.currentPage - 1) * adminState.itemsPerPage;
  const end = start + adminState.itemsPerPage;
  const pageItems = adminState.filtered.slice(start, end);

  if (!pageItems.length) {
    tbody.innerHTML = `<tr><td colspan="${config.columns.length + 1}" class="loading-cell">No ${config.pluralLabel.toLowerCase()} found</td></tr>`;
    updatePaginationControls();
    return;
  }

  tbody.innerHTML = pageItems
    .map(
      (item) => `
        <tr>
          ${config.columns.map((column) => `<td>${adminEsc(column.value(item))}</td>`).join("")}
          <td>
            <div class="action-buttons">
              <button class="btn btn-outline btn-sm" onclick="startEdit(${Number(item.id)})">Edit</button>
              <button class="btn btn-danger btn-sm" onclick="deleteCatalogItem(${Number(item.id)})">Delete</button>
            </div>
          </td>
        </tr>
      `
    )
    .join("");

  updatePaginationControls();
}

function updatePaginationControls() {
  const totalPages = Math.max(1, Math.ceil(adminState.filtered.length / adminState.itemsPerPage));
  adminById("page-info").textContent = `Page ${adminState.currentPage} of ${totalPages}`;
  adminById("prev-page").disabled = adminState.currentPage === 1;
  adminById("next-page").disabled = adminState.currentPage >= totalPages;
}

function startEdit(id) {
  const item = (adminState.catalog[adminState.currentEntity] || []).find((row) => Number(row.id) === Number(id));
  if (!item) return;
  showSection("create");
  syncFormEntitySelector();
  renderEntityForm();
  populateFormForEdit(item);
  document.documentElement.scrollTop = 0;
}

async function deleteCatalogItem(id) {
  const config = currentConfig();
  if (!confirm(`Are you sure you want to delete this ${config.label.toLowerCase()}? This action cannot be undone.`)) {
    return;
  }

  try {
    await adminApiRequest("DELETE", config.deletePath(id));
    adminState.catalog[adminState.currentEntity] = (adminState.catalog[adminState.currentEntity] || []).filter(
      (item) => Number(item.id) !== Number(id)
    );
    applyFilters();
    showToast(`${config.label} deleted successfully`, "success");
  } catch (error) {
    console.error(`Error deleting ${config.label.toLowerCase()}:`, error);
    showToast(error.message || `Could not delete ${config.label.toLowerCase()}.`, "error");
  }
}

function validatePayload(config, payload) {
  const missing = config.requiredFields.find((key) => {
    const value = payload[key];
    return value === null || value === undefined || value === "";
  });
  return missing ? `${config.label} ${missing} is required.` : "";
}

async function submitCatalogForm(event) {
  event.preventDefault();

  const messageEl = adminById("form-message");
  const config = currentConfig();
  const payload = config.toPayload();
  const validationMessage = validatePayload(config, payload);

  messageEl.className = "form-message";
  if (validationMessage) {
    messageEl.className = "form-message error";
    messageEl.textContent = validationMessage;
    messageEl.hidden = false;
    return;
  }

  try {
    if (adminState.currentEditId) {
      await adminApiRequest("PUT", config.updatePath(adminState.currentEditId), payload);
    } else {
      await adminApiRequest("POST", config.createPath, payload);
    }

    messageEl.className = "form-message success";
    messageEl.textContent = `${config.label} ${adminState.currentEditId ? "updated" : "created"} successfully`;
    messageEl.hidden = false;

    await loadCatalogItems();
    setTimeout(() => resetForm(), 1200);
  } catch (error) {
    console.error("Error submitting form:", error);
    messageEl.className = "form-message error";
    messageEl.textContent = error.message || `Could not save ${config.label.toLowerCase()}.`;
    messageEl.hidden = false;
  }
}

async function loadStories() {
  const tbody = adminById("stories-tbody");
  try {
    adminState.stories = await TravelerStoriesAPI.adminGetAll();
    adminState.filteredStories = adminState.stories.slice();
    renderStoriesTable();
  } catch (error) {
    console.error("Error loading stories:", error);
    tbody.innerHTML = `<tr><td colspan="8" class="loading-cell">Error loading stories</td></tr>`;
  }
}

function applyStoryFilters() {
  const search = adminById("story-search-input").value.toLowerCase();
  const status = adminById("story-status-filter").value;

  adminState.filteredStories = adminState.stories.filter((story) => {
    const matchesSearch =
      !search ||
      String(story.title || "").toLowerCase().includes(search) ||
      String(story.destination || "").toLowerCase().includes(search) ||
      String(story.sponsorCompanyName || "").toLowerCase().includes(search) ||
      String(story.user?.name || story.userName || "").toLowerCase().includes(search);
    const active = story.isActive !== false;
    const matchesStatus = !status || (status === "active" ? active : !active);
    return matchesSearch && matchesStatus;
  });

  renderStoriesTable();
}

function renderStoriesTable() {
  const tbody = adminById("stories-tbody");
  const items = adminState.filteredStories || [];

  if (!items.length) {
    tbody.innerHTML = `<tr><td colspan="8" class="loading-cell">No stories found</td></tr>`;
    return;
  }

  tbody.innerHTML = items
    .map(
      (story) => `
        <tr>
          <td>${story.id}</td>
          <td><strong>${adminEsc(story.title || "Traveler Story")}</strong></td>
          <td>${adminEsc(story.user?.name || story.userName || "Traveler")}</td>
          <td>${adminEsc(story.destination || "Jordan")}</td>
          <td>${adminEsc(story.sponsorCompanyName || "-")}</td>
          <td>${Number(story.viewsCount || 0)}</td>
          <td>
            <span class="story-status-badge ${story.isActive === false ? "story-status-badge-off" : ""}">
              ${story.isActive === false ? "Inactive" : "Active"}
            </span>
          </td>
          <td>
            <div class="action-buttons">
              <button class="btn btn-outline btn-sm" onclick="toggleStoryStatus(${story.id}, ${story.isActive === false ? "true" : "false"})">
                ${story.isActive === false ? "Enable" : "Disable"}
              </button>
              <button class="btn btn-danger btn-sm" onclick="deleteStoryAsAdmin(${story.id})">Delete</button>
            </div>
          </td>
        </tr>
      `
    )
    .join("");
}

async function toggleStoryStatus(storyId, isActive) {
  try {
    await TravelerStoriesAPI.adminUpdateStatus(storyId, { isActive });
    await loadStories();
    showToast(`Story ${isActive ? "enabled" : "disabled"}.`, "success");
  } catch (error) {
    showToast(error.message || "Could not update story status.", "error");
  }
}

async function deleteStoryAsAdmin(storyId) {
  if (!confirm("Are you sure you want to delete this story?")) return;

  try {
    await TravelerStoriesAPI.delete(storyId);
    await loadStories();
    showToast("Story deleted.", "success");
  } catch (error) {
    showToast(error.message || "Could not delete the story.", "error");
  }
}

async function loadUsers() {
  const tbody = adminById("users-tbody");
  tbody.innerHTML = `<tr><td colspan="4" class="loading-cell">Loading users...</td></tr>`;

  try {
    adminState.users = await UsersAPI.getAll();
    applyUserFilters();
  } catch (error) {
    console.error("Error loading users:", error);
    tbody.innerHTML = `<tr><td colspan="4" class="loading-cell">Error loading users</td></tr>`;
  }
}

function applyUserFilters() {
  const search = adminById("user-search-input").value.toLowerCase();
  adminState.filteredUsers = adminState.users.filter((user) => {
    return (
      !search ||
      String(user.name || "").toLowerCase().includes(search) ||
      String(user.email || "").toLowerCase().includes(search)
    );
  });
  renderUsersTable();
}

function renderUsersTable() {
  const tbody = adminById("users-tbody");
  if (!adminState.filteredUsers.length) {
    tbody.innerHTML = `<tr><td colspan="4" class="loading-cell">No users found</td></tr>`;
    return;
  }

  tbody.innerHTML = adminState.filteredUsers
    .map(
      (user) => `
        <tr>
          <td>${Number(user.id)}</td>
          <td>${adminEsc(user.name || "-")}</td>
          <td>${adminEsc(user.email || "-")}</td>
          <td>${adminEsc(formatDate(user.createdAt))}</td>
        </tr>
      `
    )
    .join("");
}

async function loadOperationsData() {
  const bookingBody = adminById("booking-requests-tbody");
  const orderBody = adminById("checkout-orders-tbody");
  const guideBody = adminById("guide-bookings-tbody");
  bookingBody.innerHTML = `<tr><td colspan="7" class="loading-cell">Loading bookings...</td></tr>`;
  orderBody.innerHTML = `<tr><td colspan="7" class="loading-cell">Loading orders...</td></tr>`;
  guideBody.innerHTML = `<tr><td colspan="7" class="loading-cell">Loading guide bookings...</td></tr>`;

  try {
    const [bookings, orders, guideBookings] = await Promise.all([
      BookingsAPI.getAll(),
      CheckoutOrdersAPI.getAll(),
      GuideBookingsAPI.getAll(),
      ensureCompaniesLoaded(),
    ]);

    adminState.bookings = bookings || [];
    adminState.checkoutOrders = orders || [];
    adminState.guideBookings = guideBookings || [];
    renderOperationsSummary();
    applyOperationFilters();
  } catch (error) {
    console.error("Error loading operations data:", error);
    bookingBody.innerHTML = `<tr><td colspan="7" class="loading-cell">Error loading bookings</td></tr>`;
    orderBody.innerHTML = `<tr><td colspan="7" class="loading-cell">Error loading orders</td></tr>`;
    guideBody.innerHTML = `<tr><td colspan="7" class="loading-cell">Error loading guide bookings</td></tr>`;
  }
}

function renderOperationsSummary() {
  const companiesById = new Map(adminState.companies.map((company) => [Number(company.id), company]));
  const totalRevenue = adminState.bookings.reduce((sum, booking) => sum + Number(booking.totalPrice || 0), 0);
  const pendingOrders = adminState.checkoutOrders.filter(
    (order) => String(order.orderStatus || "").toLowerCase() === "pending"
  ).length;
  const activeCompanies = new Set(adminState.bookings.map((booking) => Number(booking.companyId)).filter(Boolean)).size;
  const latestBooking = adminState.bookings[0];

  adminById("ops-summary-grid").innerHTML = [
    { label: "Company Bookings", value: adminState.bookings.length, meta: "Live booking requests" },
    { label: "Checkout Orders", value: adminState.checkoutOrders.length, meta: `${pendingOrders} pending right now` },
    { label: "Guide Bookings", value: adminState.guideBookings.length, meta: "Guide demand pipeline" },
    { label: "Revenue", value: formatCurrency(totalRevenue), meta: `${activeCompanies} active companies` },
    {
      label: "Latest Booking",
      value: latestBooking ? adminEsc(latestBooking.customerName || "Traveler") : "-",
      meta: latestBooking
        ? adminEsc(companiesById.get(Number(latestBooking.companyId))?.name || latestBooking.serviceType || "Service")
        : "No recent activity",
    },
  ]
    .map(
      (card) => `
        <article class="ops-stat-card">
          <span>${card.label}</span>
          <strong>${card.value}</strong>
          <small>${card.meta}</small>
        </article>
      `
    )
    .join("");
}

function applyOperationFilters() {
  const bookingSearch = adminById("booking-search-input").value.toLowerCase();
  const bookingStatus = adminById("booking-status-filter").value;
  const orderSearch = adminById("order-search-input").value.toLowerCase();
  const orderStatus = adminById("order-status-filter").value;
  const guideSearch = adminById("guide-booking-search-input").value.toLowerCase();

  const companiesById = new Map(adminState.companies.map((company) => [Number(company.id), company]));

  adminState.filteredBookings = adminState.bookings.filter((booking) => {
    const companyName = companiesById.get(Number(booking.companyId))?.name || "";
    const matchesSearch =
      !bookingSearch ||
      String(booking.customerName || "").toLowerCase().includes(bookingSearch) ||
      String(booking.serviceType || "").toLowerCase().includes(bookingSearch) ||
      String(companyName).toLowerCase().includes(bookingSearch);
    const matchesStatus =
      !bookingStatus || String(booking.bookingStatus || "").toLowerCase() === bookingStatus;
    return matchesSearch && matchesStatus;
  });

  adminState.filteredCheckoutOrders = adminState.checkoutOrders.filter((order) => {
    const matchesSearch =
      !orderSearch ||
      String(order.customerName || "").toLowerCase().includes(orderSearch) ||
      String(order.serviceName || "").toLowerCase().includes(orderSearch) ||
      String(order.destination || "").toLowerCase().includes(orderSearch);
    const matchesStatus = !orderStatus || String(order.orderStatus || "").toLowerCase() === orderStatus;
    return matchesSearch && matchesStatus;
  });

  adminState.filteredGuideBookings = adminState.guideBookings.filter((booking) => {
    return (
      !guideSearch ||
      String(booking.customerName || "").toLowerCase().includes(guideSearch) ||
      String(booking.guide?.fullName || "").toLowerCase().includes(guideSearch) ||
      String(booking.attraction?.nameEn || "").toLowerCase().includes(guideSearch)
    );
  });

  renderBookingRequestsTable(companiesById);
  renderCheckoutOrdersTable();
  renderGuideBookingsTable();
}

function renderBookingRequestsTable(companiesById) {
  const tbody = adminById("booking-requests-tbody");
  if (!adminState.filteredBookings.length) {
    tbody.innerHTML = `<tr><td colspan="7" class="loading-cell">No bookings found</td></tr>`;
    return;
  }

  tbody.innerHTML = adminState.filteredBookings
    .map((booking) => {
      const company = companiesById.get(Number(booking.companyId));
      return `
        <tr>
          <td>${Number(booking.id)}</td>
          <td>${adminEsc(booking.customerName || "-")}</td>
          <td>${adminEsc(company?.name || `Company #${booking.companyId || "-"}`)}</td>
          <td>${adminEsc(booking.serviceType || "-")}</td>
          <td>${adminEsc(booking.bookingStatus || "-")}</td>
          <td>${adminEsc(formatCurrency(booking.totalPrice || 0, booking.currency || "JOD"))}</td>
          <td>${adminEsc(formatDate(booking.createdAt))}</td>
        </tr>
      `;
    })
    .join("");
}

function renderCheckoutOrdersTable() {
  const tbody = adminById("checkout-orders-tbody");
  if (!adminState.filteredCheckoutOrders.length) {
    tbody.innerHTML = `<tr><td colspan="7" class="loading-cell">No checkout orders found</td></tr>`;
    return;
  }

  tbody.innerHTML = adminState.filteredCheckoutOrders
    .map(
      (order) => `
        <tr>
          <td>${Number(order.id)}</td>
          <td>${adminEsc(order.customerName || "-")}</td>
          <td>${adminEsc(order.serviceName || "-")}</td>
          <td>${adminEsc(order.destination || "-")}</td>
          <td>${adminEsc(formatCurrency(order.total || 0, order.currency || "JOD"))}</td>
          <td>${adminEsc(order.orderStatus || "-")}</td>
          <td>
            <div class="order-action-row">
              <select id="order-status-${Number(order.id)}" class="table-select">
                ${["Pending", "Paid", "Confirmed", "Cancelled"]
                  .map(
                    (status) =>
                      `<option value="${status}" ${String(order.orderStatus || "").toLowerCase() === status.toLowerCase() ? "selected" : ""}>${status}</option>`
                  )
                  .join("")}
              </select>
              <button class="btn btn-outline btn-sm" onclick="updateCheckoutOrderStatus(${Number(order.id)})">
                Save
              </button>
            </div>
          </td>
        </tr>
      `
    )
    .join("");
}

function renderGuideBookingsTable() {
  const tbody = adminById("guide-bookings-tbody");
  if (!adminState.filteredGuideBookings.length) {
    tbody.innerHTML = `<tr><td colspan="7" class="loading-cell">No guide bookings found</td></tr>`;
    return;
  }

  tbody.innerHTML = adminState.filteredGuideBookings
    .map(
      (booking) => `
        <tr>
          <td>${Number(booking.id)}</td>
          <td>${adminEsc(booking.customerName || "-")}</td>
          <td>${adminEsc(booking.guide?.fullName || "-")}</td>
          <td>${adminEsc(booking.attraction?.nameEn || "-")}</td>
          <td>${adminEsc(booking.bookingStatus || "-")}</td>
          <td>${adminEsc(formatCurrency(booking.totalPrice || 0, booking.currency || "JOD"))}</td>
          <td>${adminEsc(formatDate(booking.bookingDate || booking.createdAt))}</td>
        </tr>
      `
    )
    .join("");
}

async function updateCheckoutOrderStatus(orderId) {
  const selector = adminById(`order-status-${orderId}`);
  if (!selector) return;

  try {
    await CheckoutOrdersAPI.updateStatus(orderId, { orderStatus: selector.value });
    showToast("Order status updated.", "success");
    await loadOperationsData();
  } catch (error) {
    console.error("Error updating order status:", error);
    showToast(error.message || "Could not update order status.", "error");
  }
}

async function runAdminAction(action) {
  const messageEl = adminById("system-action-message");
  const actionMap = {
    "import-attractions": {
      path: "/attractions/import-overpass",
      body: { limit: 100 },
      success: "Attractions import started successfully.",
    },
    "refresh-attraction-images": {
      path: "/attractions/update-images",
      body: { batchSize: 10, perRequestDelayMs: 200 },
      success: "Attraction images refresh completed.",
    },
    "import-restaurants": {
      path: "/restaurants/import-overpass",
      body: { limit: 100, batchSize: 50 },
      success: "Restaurants import started successfully.",
    },
    "refresh-restaurant-images": {
      path: "/restaurants/update-photos",
      body: { batchSize: 10, perRequestDelayMs: 300 },
      success: "Restaurant photos refresh completed.",
    },
  };

  const config = actionMap[action];
  if (!config) return;

  messageEl.hidden = true;
  try {
    const response = await adminApiRequest("POST", config.path, config.body);
    messageEl.className = "inline-message success";
    messageEl.textContent = response?.message || config.success;
    messageEl.hidden = false;
    showToast(response?.message || config.success, "success");
  } catch (error) {
    console.error("Error running admin action:", error);
    messageEl.className = "inline-message error";
    messageEl.textContent = error.message || "Action failed.";
    messageEl.hidden = false;
    showToast(error.message || "Action failed.", "error");
  }
}

async function loadGuides() {
  const tbody = adminById("guides-tbody");
  tbody.innerHTML = `<tr><td colspan="7" class="loading-cell">Loading guides...</td></tr>`;

  try {
    await ensureCompaniesLoaded();
    adminState.guides = await CertifiedGuidesAPI.getAll();
    applyGuideFilters();
  } catch (error) {
    console.error("Error loading guides:", error);
    tbody.innerHTML = `<tr><td colspan="7" class="loading-cell">Error loading guides</td></tr>`;
  }
}

function applyGuideFilters() {
  const search = adminById("guide-search-input").value.toLowerCase();
  adminState.filteredGuides = adminState.guides.filter((guide) => {
    return (
      !search ||
      String(guide.fullName || "").toLowerCase().includes(search) ||
      String((guide.languages || []).join(", ")).toLowerCase().includes(search) ||
      String((guide.destinations || []).join(", ")).toLowerCase().includes(search) ||
      String(guide.company?.name || "").toLowerCase().includes(search)
    );
  });
  renderGuidesTable();
}

function renderGuidesTable() {
  const tbody = adminById("guides-tbody");
  if (!adminState.filteredGuides.length) {
    tbody.innerHTML = `<tr><td colspan="7" class="loading-cell">No guides found</td></tr>`;
    return;
  }

  tbody.innerHTML = adminState.filteredGuides
    .map(
      (guide) => `
        <tr>
          <td>${Number(guide.id)}</td>
          <td>${adminEsc(guide.fullName || "-")}</td>
          <td>${adminEsc(guide.company?.name || "-")}</td>
          <td>${adminEsc((guide.languages || []).join(", ") || "-")}</td>
          <td>${adminEsc(String(guide.yearsExperience || 0))} yrs</td>
          <td>${adminEsc(guide.hourlyRate != null ? formatCurrency(guide.hourlyRate) : "-")}</td>
          <td>${guide.isVerified === false ? "Unverified" : "Verified"}</td>
        </tr>
      `
    )
    .join("");
}

async function submitGuideForm(event) {
  event.preventDefault();
  const messageEl = adminById("guide-form-message");
  messageEl.hidden = true;

  const payload = {
    fullName: adminById("guide-full-name").value.trim(),
    companyId: adminById("guide-company-id").value ? Number(adminById("guide-company-id").value) : null,
    attractionId: adminById("guide-attraction-id").value ? Number(adminById("guide-attraction-id").value) : null,
    languages: csvFromValue(adminById("guide-languages").value),
    destinations: csvFromValue(adminById("guide-destinations").value),
    hourlyRate: adminById("guide-hourly-rate").value ? Number(adminById("guide-hourly-rate").value) : null,
    yearsExperience: adminById("guide-years-experience").value ? Number(adminById("guide-years-experience").value) : 0,
    bio: adminById("guide-bio").value.trim(),
  };

  if (!payload.fullName) {
    messageEl.className = "inline-message error";
    messageEl.textContent = "Guide full name is required.";
    messageEl.hidden = false;
    return;
  }

  try {
    await CertifiedGuidesAPI.create(payload);
    adminById("guide-form").reset();
    messageEl.className = "inline-message success";
    messageEl.textContent = "Guide created successfully.";
    messageEl.hidden = false;
    showToast("Guide created successfully.", "success");
    await loadGuides();
  } catch (error) {
    console.error("Error creating guide:", error);
    messageEl.className = "inline-message error";
    messageEl.textContent = error.message || "Could not create guide.";
    messageEl.hidden = false;
    showToast(error.message || "Could not create guide.", "error");
  }
}

function csvFromValue(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

async function loadNotifications() {
  const list = adminById("notifications-list");
  list.innerHTML = `<div class="loading-cell">Loading notifications...</div>`;

  try {
    await ensureCompaniesLoaded();
    adminState.notifications = await DashboardNotificationsAPI.getAll();
    applyNotificationFilters();
  } catch (error) {
    console.error("Error loading notifications:", error);
    list.innerHTML = `<div class="loading-cell">Error loading notifications</div>`;
  }
}

function applyNotificationFilters() {
  const search = adminById("notification-search-input").value.toLowerCase();
  const role = adminById("notification-role-filter").value;
  const readState = adminById("notification-read-filter").value;

  adminState.filteredNotifications = adminState.notifications.filter((notification) => {
    const matchesSearch =
      !search ||
      String(notification.title || "").toLowerCase().includes(search) ||
      String(notification.message || "").toLowerCase().includes(search);
    const matchesRole = !role || String(notification.audienceRole || "").toLowerCase() === role;
    const matchesRead =
      !readState ||
      (readState === "read" ? Boolean(notification.isRead) : !Boolean(notification.isRead));
    return matchesSearch && matchesRole && matchesRead;
  });

  renderNotificationsList();
}

function renderNotificationsList() {
  const list = adminById("notifications-list");
  const companiesById = new Map(adminState.companies.map((company) => [Number(company.id), company]));

  if (!adminState.filteredNotifications.length) {
    list.innerHTML = `<div class="empty-panel">No notifications found</div>`;
    return;
  }

  list.innerHTML = adminState.filteredNotifications
    .map((notification) => {
      const companyName = notification.companyId
        ? companiesById.get(Number(notification.companyId))?.name || `Company #${notification.companyId}`
        : "Global";

      return `
        <article class="notification-card ${notification.isRead ? "notification-card-read" : ""}">
          <div class="notification-card-top">
            <div>
              <strong>${adminEsc(notification.title || "Notification")}</strong>
              <p>${adminEsc(notification.message || "")}</p>
            </div>
            <span class="notification-badge">${adminEsc(notification.audienceRole || "admin")}</span>
          </div>
          <div class="notification-card-meta">
            <span>${adminEsc(companyName)}</span>
            <span>${adminEsc(formatDate(notification.createdAt))}</span>
            <span>${notification.isRead ? "Read" : "Unread"}</span>
          </div>
          <div class="action-buttons">
            ${
              notification.isRead
                ? ""
                : `<button class="btn btn-outline btn-sm" onclick="markNotificationRead(${Number(notification.id)})">Mark Read</button>`
            }
          </div>
        </article>
      `;
    })
    .join("");
}

async function markNotificationRead(id) {
  try {
    await DashboardNotificationsAPI.markRead(id, true);
    showToast("Notification marked as read.", "success");
    await loadNotifications();
  } catch (error) {
    console.error("Error updating notification:", error);
    showToast(error.message || "Could not update notification.", "error");
  }
}

async function submitNotificationForm(event) {
  event.preventDefault();
  const messageEl = adminById("notification-form-message");
  messageEl.hidden = true;

  const currentUser = getCurrentUser();
  const payload = {
    audienceRole: adminById("notification-audience-role").value,
    userId: adminById("notification-user-id").value
      ? Number(adminById("notification-user-id").value)
      : adminById("notification-audience-role").value === "admin"
        ? currentUser?.id || null
        : null,
    companyId: adminById("notification-company-id").value ? Number(adminById("notification-company-id").value) : null,
    title: adminById("notification-title").value.trim(),
    message: adminById("notification-message").value.trim(),
  };

  if (!payload.title || !payload.message) {
    messageEl.className = "inline-message error";
    messageEl.textContent = "Notification title and message are required.";
    messageEl.hidden = false;
    return;
  }

  try {
    await DashboardNotificationsAPI.create(payload);
    adminById("notification-form").reset();
    messageEl.className = "inline-message success";
    messageEl.textContent = "Notification created successfully.";
    messageEl.hidden = false;
    showToast("Notification created successfully.", "success");
    await loadNotifications();
  } catch (error) {
    console.error("Error creating notification:", error);
    messageEl.className = "inline-message error";
    messageEl.textContent = error.message || "Could not create notification.";
    messageEl.hidden = false;
    showToast(error.message || "Could not create notification.", "error");
  }
}

function closeEditModal() {
  adminById("edit-modal").hidden = true;
}

function bindAdminEvents() {
  document.querySelectorAll(".admin-nav-item").forEach((item) => {
    item.addEventListener("click", (event) => {
      if (!item.dataset.section) return;
      event.preventDefault();
      showSection(item.dataset.section);
    });
  });

  adminById("entity-filter").addEventListener("change", (event) => {
    adminState.currentEntity = event.target.value;
    adminById("form-entity-type").value = adminState.currentEntity;
    resetForm();
    loadCatalogItems();
  });

  adminById("form-entity-type").addEventListener("change", (event) => {
    adminState.currentEntity = event.target.value;
    adminById("entity-filter").value = adminState.currentEntity;
    renderEntityForm();
    resetForm();
  });

  adminById("search-input").addEventListener("input", applyFilters);
  adminById("city-filter").addEventListener("change", applyFilters);
  adminById("story-search-input").addEventListener("input", applyStoryFilters);
  adminById("story-status-filter").addEventListener("change", applyStoryFilters);
  adminById("user-search-input").addEventListener("input", applyUserFilters);
  adminById("booking-search-input").addEventListener("input", applyOperationFilters);
  adminById("booking-status-filter").addEventListener("change", applyOperationFilters);
  adminById("order-search-input").addEventListener("input", applyOperationFilters);
  adminById("order-status-filter").addEventListener("change", applyOperationFilters);
  adminById("guide-booking-search-input").addEventListener("input", applyOperationFilters);
  adminById("guide-search-input").addEventListener("input", applyGuideFilters);
  adminById("notification-search-input").addEventListener("input", applyNotificationFilters);
  adminById("notification-role-filter").addEventListener("change", applyNotificationFilters);
  adminById("notification-read-filter").addEventListener("change", applyNotificationFilters);
  adminById("attraction-form").addEventListener("submit", submitCatalogForm);
  adminById("guide-form").addEventListener("submit", submitGuideForm);
  adminById("notification-form").addEventListener("submit", submitNotificationForm);

  document.querySelectorAll(".admin-action-btn").forEach((button) => {
    button.addEventListener("click", () => runAdminAction(button.dataset.adminAction));
  });

  adminById("prev-page").addEventListener("click", () => {
    if (adminState.currentPage > 1) {
      adminState.currentPage -= 1;
      renderCatalogTable();
    }
  });

  adminById("next-page").addEventListener("click", () => {
    const totalPages = Math.max(1, Math.ceil(adminState.filtered.length / adminState.itemsPerPage));
    if (adminState.currentPage < totalPages) {
      adminState.currentPage += 1;
      renderCatalogTable();
    }
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  const isAuth = await checkAdminAuth();
  if (!isAuth) return;

  renderEntityForm();
  resetForm();
  bindAdminEvents();
  ensureCompaniesLoaded();
  showSection("dashboard");
});

window.handleLogout = handleLogout;
window.resetForm = resetForm;
window.startEdit = startEdit;
window.deleteCatalogItem = deleteCatalogItem;
window.toggleStoryStatus = toggleStoryStatus;
window.deleteStoryAsAdmin = deleteStoryAsAdmin;
window.closeEditModal = closeEditModal;
window.updateCheckoutOrderStatus = updateCheckoutOrderStatus;
window.markNotificationRead = markNotificationRead;
