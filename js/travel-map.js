const TRAVEL_MAP_TYPES = {
  attractions: { label: "Attractions", actionLabel: "Open attraction", href: (item) => `attractions.html?city=${encodeURIComponent(item.city || "")}` },
  hotels: { label: "Hotels", actionLabel: "View hotel", href: (item) => `hotels.html?id=${item.id}` },
  companies: { label: "Tour Companies", actionLabel: "Explore company", href: (item) => `company-detail.html?slug=${item.slug}` },
  tours: { label: "Tours", actionLabel: "View tour", href: (item) => `tour-detail.html?company=${encodeURIComponent(item.companySlug || "")}&tour=${item.id}` },
  restaurants: { label: "Restaurants", actionLabel: "View restaurant", href: (item) => `restaurants.html?id=${item.id}` },
  transport: { label: "Transport Services", actionLabel: "View transport", href: (item) => item.companySlug ? `company-detail.html?slug=${encodeURIComponent(item.companySlug)}&tab=transport` : "companies.html" },
};

function explorerEsc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

async function createTravelExplorerMap(config) {
  const root = document.getElementById(config.rootId);
  if (!root || !window.L) return null;

  root.innerHTML = `
    <div class="travel-map-section">
      <div class="travel-map-heading">
        <div>
          <div class="section-tag">${explorerEsc(config.kicker || "Explore Nearby")}</div>
          <h2>${explorerEsc(config.title || "Interactive Map")}</h2>
        </div>
        <button class="btn btn-outline btn-sm" type="button" data-map-reset>Reset View</button>
      </div>
      <div class="travel-map-layout">
        <div id="${explorerEsc(config.mapId)}" class="travel-map-canvas"></div>
        <div class="travel-map-side">
          <div class="travel-map-filters">
            <h3>Filters</h3>
            <div class="travel-map-chip-row" data-map-filters></div>
          </div>
          <div class="travel-map-preview" data-map-preview>
            <div class="travel-map-empty">Select a map marker to preview the location, rating, and quick action.</div>
          </div>
        </div>
      </div>
    </div>
  `;

  const mapElement = root.querySelector(`#${config.mapId}`);
  const filterContainer = root.querySelector("[data-map-filters]");
  const previewContainer = root.querySelector("[data-map-preview]");
  const resetButton = root.querySelector("[data-map-reset]");

  const types = config.types || Object.keys(TRAVEL_MAP_TYPES);
  const filters = Object.fromEntries(types.map((type) => [type, true]));

  filterContainer.innerHTML = types.map((type) => `<button class="travel-map-chip active" type="button" data-type="${type}">${TRAVEL_MAP_TYPES[type]?.label || type}</button>`).join("");

  const [attractions, hotels, restaurants, companies, tours, transport] = await Promise.all([
    AttractionsAPI.getAll().catch(() => []),
    HotelsAPI.getAll().catch(() => []),
    RestaurantsAPI.getAll().catch(() => []),
    typeof CompaniesAPI !== "undefined" ? CompaniesAPI.getAll().catch(() => []) : [],
    typeof ToursAPI !== "undefined" ? ToursAPI.getAll().catch(() => []) : [],
    typeof TransportAPI !== "undefined" ? TransportAPI.getAll().catch(() => []) : [],
  ]);

  const companyById = new Map((companies || []).map((company) => [Number(company.id), company]));
  const attractionById = new Map((attractions || []).map((item) => [Number(item.id), item]));

  function normalizeByCity(list, cityKeys) {
    const wanted = String(typeof config.city === "function" ? config.city() : config.city || "").toLowerCase();
    if (!wanted) return list;
    return list.filter((item) => cityKeys.some((key) => String(item[key] || "").toLowerCase().includes(wanted)));
  }

  function normalizeRecords() {
    const currentCity = String(typeof config.city === "function" ? config.city() : config.city || "").toLowerCase();
    const recordSets = {
      attractions: normalizeByCity(attractions || [], ["city"]).map((item) => ({
        ...item,
        type: "attractions",
        title: item.nameEn || item.title || "Attraction",
        latitude: Number(item.latitude || item.lat),
        longitude: Number(item.longitude || item.lng),
        image: item.photoUrl || item.imageUrl || item.image || "",
        rating: Number(item.rating || 4.7),
      })),
      hotels: normalizeByCity(hotels || [], ["city"]).map((item) => ({
        ...item,
        type: "hotels",
        title: item.nameEn || "Hotel",
        latitude: Number(item.latitude),
        longitude: Number(item.longitude),
        image: item.imageUrl || item.image || "",
        rating: Number(item.rating || 4.6),
      })),
      companies: normalizeByCity(companies || [], ["city", "location"]).map((item) => ({
        ...item,
        type: "companies",
        title: item.name,
        latitude: Number(item.latitude),
        longitude: Number(item.longitude),
        image: item.heroImage || item.logo || "",
        rating: Number(item.rating || 4.7),
      })),
      restaurants: normalizeByCity(restaurants || [], ["city"]).map((item) => ({
        ...item,
        type: "restaurants",
        title: item.nameEn || item.title || "Restaurant",
        latitude: Number(item.latitude || item.lat),
        longitude: Number(item.longitude || item.lng),
        image: item.photoUrl || item.photo_url || item.image || "",
        rating: Number(item.rating || 4.5),
      })),
      tours: (tours || [])
        .map((item) => {
          const company = companyById.get(Number(item.companyId));
          if (currentCity && !String(item.location || company?.city || "").toLowerCase().includes(currentCity)) return null;
          return {
            ...item,
            type: "tours",
            title: item.title,
            latitude: Number(company?.latitude),
            longitude: Number(company?.longitude),
            image: item.image || company?.heroImage || "",
            rating: Number(item.rating || 4.8),
            companySlug: company?.slug || "",
          };
        })
        .filter(Boolean),
      transport: (transport || [])
        .map((item) => {
          const company = companyById.get(Number(item.companyId));
          const attraction = attractionById.get(Number(item.attractionId));
          const cityText = `${company?.city || ""} ${attraction?.city || ""} ${item.pickupLocation || ""} ${item.dropOffLocation || ""}`.toLowerCase();
          if (currentCity && !cityText.includes(currentCity)) return null;
          return {
            ...item,
            type: "transport",
            title: item.title || item.provider || "Transport",
            latitude: Number(company?.latitude || attraction?.latitude),
            longitude: Number(company?.longitude || attraction?.longitude),
            image: item.image || company?.heroImage || attraction?.photoUrl || "",
            rating: Number(company?.rating || 4.4),
            companySlug: company?.slug || "",
          };
        })
        .filter(Boolean),
    };
    return types.flatMap((type) => recordSets[type] || []);
  }

  const map = L.map(mapElement).setView(config.center || [31.24, 36.51], config.zoom || 7);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors",
  }).addTo(map);

  let markers = [];
  let lastSelected = null;

  function preview(item) {
    const meta = TRAVEL_MAP_TYPES[item.type] || { actionLabel: "Open", href: () => "#" };
    previewContainer.innerHTML = `
      ${item.image ? `<img src="${explorerEsc(item.image)}" alt="${explorerEsc(item.title)}" />` : ""}
      <h3>${explorerEsc(item.title)}</h3>
      <div class="travel-map-meta"><span>${explorerEsc(meta.label || item.type)}</span><span>${Number(item.rating || 0).toFixed(1)} rating</span></div>
      <a class="btn btn-primary btn-sm" href="${explorerEsc(meta.href(item))}">${explorerEsc(meta.actionLabel)}</a>
    `;
  }

  function markerIcon(item, active) {
    return L.divIcon({
      className: "",
      html: `<div class="travel-map-marker ${active ? "active" : ""}">${explorerEsc((TRAVEL_MAP_TYPES[item.type]?.label || item.type).slice(0, 10))}</div>`,
      iconSize: [98, 34],
      iconAnchor: [49, 34],
      popupAnchor: [0, -30],
    });
  }

  function render() {
    markers.forEach((entry) => entry.marker.remove());
    markers = [];
    const bounds = [];
    const data = normalizeRecords().filter((item) => filters[item.type] && Number.isFinite(item.latitude) && Number.isFinite(item.longitude));
    data.forEach((item) => {
      const marker = L.marker([item.latitude, item.longitude], { icon: markerIcon(item, false) }).addTo(map);
      marker.bindPopup(`<strong>${explorerEsc(item.title)}</strong><br />${explorerEsc(TRAVEL_MAP_TYPES[item.type]?.label || item.type)}`);
      marker.on("click", () => {
        lastSelected = { item, marker };
        markers.forEach((entry) => entry.marker.setIcon(markerIcon(entry.item, entry.item === item)));
        preview(item);
      });
      markers.push({ item, marker });
      bounds.push([item.latitude, item.longitude]);
    });
    if (bounds.length) map.fitBounds(bounds, { padding: [30, 30] });
    else map.setView(config.center || [31.24, 36.51], config.zoom || 7);
  }

  filterContainer.querySelectorAll("[data-type]").forEach((button) => {
    button.addEventListener("click", () => {
      const type = button.getAttribute("data-type");
      filters[type] = !filters[type];
      button.classList.toggle("active", filters[type]);
      render();
    });
  });

  resetButton.addEventListener("click", () => render());
  render();

  return {
    refresh() {
      render();
      if (lastSelected) preview(lastSelected.item);
    },
  };
}

window.createTravelExplorerMap = createTravelExplorerMap;
