const companyListState = {
  all: [],
  filtered: [],
  explorerMap: null,
  filters: {
    search: "",
    city: "",
    service: "",
    language: "",
    rating: 0,
    sort: "popular",
    verifiedOnly: false,
  },
};

async function fetchCompanies() {
  return api("GET", "/companies");
}

function cById(id) {
  return document.getElementById(id);
}

function cEsc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function companyStartingPrice(company) {
  const prices = []
    .concat((company.tours || []).map((item) => Number(item.price) || 0))
    .concat((company.packages || []).map((item) => Number(item.price) || 0))
    .concat((company.transportServices || []).map((item) => Number(item.price) || 0))
    .filter((price) => price > 0);

  if (!prices.length) return "Custom";
  return `$${Math.min(...prices)}`;
}

function populateFilters() {
  const cities = [...new Set(companyListState.all.map((company) => company.city).filter(Boolean))];
  const services = [
    ...new Set(
      companyListState.all.flatMap((company) => company.servicesOffered || [])
    ),
  ];
  const languages = [
    ...new Set(
      companyListState.all.flatMap((company) => company.supportedLanguages || [])
    ),
  ];

  cById("company-city-filter").innerHTML =
    `<option value="">All locations</option>` +
    cities.map((city) => `<option value="${cEsc(city)}">${cEsc(city)}</option>`).join("");
  cById("company-service-filter").innerHTML =
    `<option value="">All services</option>` +
    services.map((service) => `<option value="${cEsc(service)}">${cEsc(service)}</option>`).join("");
  cById("company-language-filter").innerHTML =
    `<option value="">All languages</option>` +
    languages.map((language) => `<option value="${cEsc(language)}">${cEsc(language)}</option>`).join("");
}

function sortCompanies(list) {
  const items = list.slice();

  switch (companyListState.filters.sort) {
    case "rating":
      items.sort((a, b) => b.rating - a.rating);
      break;
    case "newest":
      items.sort((a, b) => (b.foundedYear || 0) - (a.foundedYear || 0));
      break;
    case "price-asc":
      items.sort((a, b) => {
        const aPrice = Number(companyStartingPrice(a).replace(/[^\d.]/g, "")) || Number.MAX_SAFE_INTEGER;
        const bPrice = Number(companyStartingPrice(b).replace(/[^\d.]/g, "")) || Number.MAX_SAFE_INTEGER;
        return aPrice - bPrice;
      });
      break;
    case "price-desc":
      items.sort((a, b) => {
        const aPrice = Number(companyStartingPrice(a).replace(/[^\d.]/g, "")) || 0;
        const bPrice = Number(companyStartingPrice(b).replace(/[^\d.]/g, "")) || 0;
        return bPrice - aPrice;
      });
      break;
    case "reviews":
      items.sort((a, b) => (b.reviewsCount || 0) - (a.reviewsCount || 0));
      break;
    default:
      items.sort((a, b) => (b.rating * 10 + b.reviewsCount) - (a.rating * 10 + a.reviewsCount));
      break;
  }

  return items;
}

function applyCompanyFilters() {
  const query = companyListState.filters.search.trim().toLowerCase();

  companyListState.filtered = sortCompanies(
    companyListState.all.filter((company) => {
      if (companyListState.filters.city && company.city !== companyListState.filters.city) return false;
      if (
        companyListState.filters.service &&
        !(company.servicesOffered || []).includes(companyListState.filters.service)
      ) {
        return false;
      }
      if (
        companyListState.filters.language &&
        !(company.supportedLanguages || []).includes(companyListState.filters.language)
      ) {
        return false;
      }
      if (company.rating < companyListState.filters.rating) return false;
      if (companyListState.filters.verifiedOnly && !company.isVerified) return false;
      if (!query) return true;

      const haystack = [
        company.name,
        company.city,
        company.location,
        company.tagline,
        company.description,
        ...(company.servicesOffered || []),
        ...((company.tours || []).map((tour) => tour.title)),
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    })
  );

  renderCompanies();
  if (companyListState.explorerMap) companyListState.explorerMap.refresh();
}

function companyCard(company) {
  return `
    <article class="company-list-card">
      <img class="company-card-hero" src="${cEsc(company.heroImage)}" alt="${cEsc(company.name)}" />
      <div class="company-card-body">
        <div class="company-card-header">
          <img class="company-card-logo" src="${cEsc(company.logo)}" alt="${cEsc(company.name)} logo" />
          <div class="company-card-copy">
            <h3>${cEsc(company.name)}</h3>
            <div class="company-card-location">${cEsc(company.location)}</div>
            <div class="company-card-summary">${company.rating.toFixed(1)} rating · ${company.reviewsCount} reviews</div>
          </div>
          ${company.isVerified ? '<span class="company-card-verified">Verified</span>' : ""}
        </div>
        <p>${cEsc(company.tagline)}</p>
        <div class="company-card-meta">
          <span class="company-card-chip">${(company.tours || []).length} tours</span>
          <span class="company-card-chip">${(company.packages || []).length} packages</span>
          <span class="company-card-chip">${(company.transportServices || []).length} transport services</span>
        </div>
        <div class="company-card-services">
          ${(company.servicesOffered || [])
            .map((service) => `<span class="company-card-chip">${cEsc(service)}</span>`)
            .join("")}
        </div>
        <div class="company-card-footer">
          <div class="company-card-price">
            <span>Starting from</span>
            <strong>${companyStartingPrice(company)}</strong>
          </div>
          <a class="btn btn-primary" href="company-detail.html?slug=${cEsc(company.slug)}">View Profile</a>
        </div>
      </div>
    </article>
  `;
}

function renderCompanies() {
  const countEl = cById("companies-count");
  const gridEl = cById("companies-grid");

  countEl.textContent = `${companyListState.filtered.length} companies found`;

  if (!companyListState.filtered.length) {
    gridEl.innerHTML = `
      <div class="companies-empty">
        <div>
          <h3>No companies match these filters</h3>
          <p>Try changing the city, service, or rating filters.</p>
        </div>
      </div>
    `;
    return;
  }

  gridEl.innerHTML = companyListState.filtered.map(companyCard).join("");
}

function bindCompanyFilters() {
  cById("company-search").addEventListener("input", (event) => {
    companyListState.filters.search = event.target.value;
    applyCompanyFilters();
  });
  cById("company-city-filter").addEventListener("change", (event) => {
    companyListState.filters.city = event.target.value;
    applyCompanyFilters();
  });
  cById("company-service-filter").addEventListener("change", (event) => {
    companyListState.filters.service = event.target.value;
    applyCompanyFilters();
  });
  cById("company-language-filter").addEventListener("change", (event) => {
    companyListState.filters.language = event.target.value;
    applyCompanyFilters();
  });
  cById("company-rating-filter").addEventListener("change", (event) => {
    companyListState.filters.rating = Number(event.target.value) || 0;
    applyCompanyFilters();
  });
  cById("company-sort").addEventListener("change", (event) => {
    companyListState.filters.sort = event.target.value;
    applyCompanyFilters();
  });
  cById("company-verified-only").addEventListener("change", (event) => {
    companyListState.filters.verifiedOnly = Boolean(event.target.checked);
    applyCompanyFilters();
  });
}

async function initCompaniesPage() {
  try {
    companyListState.all = await fetchCompanies();
    companyListState.filtered = companyListState.all.slice();
    populateFilters();
    bindCompanyFilters();
    applyCompanyFilters();
    if (typeof createTravelExplorerMap === "function") {
      companyListState.explorerMap = await createTravelExplorerMap({
        rootId: "companies-explorer-map",
        mapId: "companies-explorer-map-canvas",
        title: "Destination services around your selected companies",
        kicker: "Multi-category explorer",
        city: () => companyListState.filters.city || companyListState.filtered[0]?.city || companyListState.all[0]?.city || "",
      });
    }
  } catch (error) {
    cById("companies-count").textContent = "Failed to load companies";
    cById("companies-grid").innerHTML = `
      <div class="companies-empty">
        <div>
          <h3>Failed to load companies</h3>
          <p>${cEsc(error.message || "Please try again later.")}</p>
        </div>
      </div>
    `;
  }
}

document.addEventListener("DOMContentLoaded", initCompaniesPage);
