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
      { label: "ID", value: (item) => item.id ?? "—" },
      { label: "Name", value: (item) => item.nameEn || item.title || "N/A" },
      { label: "City", value: (item) => item.city || "—" },
      { label: "Category", value: (item) => item.category || item.categoryName || "—" },
      { label: "Rating", value: (item) => formatNumber(item.rating, 1) || "—" },
      { label: "Entry Fee", value: (item) => Number(item.entryFee || 0) > 0 ? `${item.entryFee} JOD` : "Free" },
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
      { label: "ID", value: (item) => item.id ?? "—" },
      { label: "Name", value: (item) => item.nameEn || "N/A" },
      { label: "City", value: (item) => item.city || "—" },
      { label: "Stars", value: (item) => item.stars || "—" },
      { label: "Rating", value: (item) => formatNumber(item.rating, 1) || "—" },
      { label: "Price / Night", value: (item) => item.pricePerNight ? `${item.pricePerNight} JOD` : "—" },
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
      { label: "ID", value: (item) => item.id ?? "—" },
      { label: "Name", value: (item) => item.nameEn || "N/A" },
      { label: "City", value: (item) => item.city || "—" },
      { label: "Cuisine", value: (item) => item.cuisine || "—" },
      { label: "Rating", value: (item) => formatNumber(item.rating, 1) || "—" },
      { label: "Phone", value: (item) => item.phone || "—" },
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
      { label: "ID", value: (item) => item.id ?? "—" },
      { label: "Name", value: (item) => item.name || "N/A" },
      { label: "City", value: (item) => item.city || "—" },
      { label: "Verified", value: (item) => item.isVerified ? "Yes" : "No" },
      { label: "Rating", value: (item) => formatNumber(item.rating, 1) || "—" },
      { label: "Website", value: (item) => item.website || "—" },
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

function getAdminApiHeaders(includeJson = false) {
  const token = localStorage.getItem("tm_token");
  const headers = {};
  if (includeJson) headers["Content-Type"] = "application/json";
  if (token) headers["Authorization"] = `Bearer ${token}`;
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
    const tmUser = localStorage.getItem("tm_user") ? JSON.parse(localStorage.getItem("tm_user")) : null;

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

function adminById(id) {
  return document.getElementById(id);
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
  return fieldValue(key)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
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
        <label>
          <input id="${fieldId(field.key)}" class="form-field" type="checkbox" />
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

async function loadCatalogItems() {
  const tbody = adminById("attractions-tbody");
  const config = currentConfig();

  try {
    adminState.catalog[adminState.currentEntity] = await adminApiRequest("GET", config.listPath);
    adminState.currentPage = 1;
    applyFilters();
    populateCityFilter();
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
  document.querySelector("html").scrollTop = 0;
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
          <td>${adminEsc(story.sponsorCompanyName || "—")}</td>
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
  adminById("attraction-form").addEventListener("submit", submitCatalogForm);

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
  showSection("dashboard");
});

window.handleLogout = handleLogout;
window.resetForm = resetForm;
window.startEdit = startEdit;
window.deleteCatalogItem = deleteCatalogItem;
window.toggleStoryStatus = toggleStoryStatus;
window.deleteStoryAsAdmin = deleteStoryAsAdmin;
window.closeEditModal = closeEditModal;
