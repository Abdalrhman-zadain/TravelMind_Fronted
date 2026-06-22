const ATTRACTION_CENTER = [31.24, 36.51];
const attractionState = {
  items: [],
  filtered: [],
  selectedId: null,
  map: null,
  markers: new Map(),
  favorites: new Set(),
  maxFee: 50,
  filtersOpen: false,
  currentPage: 1,
  activeGuides: [],
  guideFilters: { language: "", price: "", rating: 0, availability: "" },
  filters: { search: "", city: "", category: "", language: "", rating: 0, fee: 50, sort: "recommended" },
};

const attractionEls = {};

function aById(id) { return document.getElementById(id); }
function aEsc(v) {
  return String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function aStars(n) { return "★".repeat(Math.max(0, Math.round(n || 0))) + "☆".repeat(Math.max(0, 5 - Math.round(n || 0))); }
function aFee(v) { return Number(v || 0) <= 0 ? "Free" : `${Math.round(Number(v || 0))} JOD`; }
function aHash(v) {
  const s = String(v ?? "");
  let h = 0;
  for (let i = 0; i < s.length; i += 1) { h = (h << 5) - h + s.charCodeAt(i); h |= 0; }
  return Math.abs(h);
}
function attractionImage(item) {
  return item.photoUrl || item.photo_url || item.imageUrl || cityFallback(item.city);
}
function cityFallback(city) {
  const c = String(city || "").toLowerCase();
  if (c.includes("petra")) return "image/city/petra-world-heritage-jordan_16x9.avif";
  if (c.includes("amman")) return "image/city/New_Abdali_2024.png";
  if (c.includes("wadi")) return "image/city/wadi-rum-bedouin-camp-travel.webp";
  if (c.includes("aqaba")) return "image/city/Aqaba_Red_Sea_Jordan_Canva-1.webp";
  if (c.includes("dead sea")) return "image/city/deadsea.jpg";
  if (c.includes("jerash")) return "image/city/sites-jerash.jpg";
  return "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80";
}
function attractionCategory(item) {
  return item.categoryName || item.category?.name || item.category || "Attraction";
}
function attractionLanguages(item) {
  if (Array.isArray(item.languages) && item.languages.length) return item.languages;
  if (typeof item.languages === "string" && item.languages.trim()) {
    return item.languages.split(",").map((lang) => lang.trim()).filter(Boolean);
  }
  return ["English", "Arabic"];
}
function attractionToursCount(item) {
  return 12 + (aHash(item.id || item.nameEn || item.title) % 14);
}
function attractionExperienceYears(item) {
  return 4 + (aHash(item.city || item.nameEn || item.title) % 7);
}
function normalizeAttraction(item) {
  return {
    ...item,
    title: item.nameEn || item.name || "Attraction",
    titleAr: item.nameAr || "",
    city: item.city || "Jordan",
    categoryLabel: attractionCategory(item),
    rating: Number(item.rating || 0),
    entryFee: Number(item.entryFee || 0),
    latitude: Number.isFinite(Number(item.latitude)) ? Number(item.latitude) : null,
    longitude: Number.isFinite(Number(item.longitude)) ? Number(item.longitude) : null,
    image: attractionImage(item),
    images: [attractionImage(item), attractionImage(item), attractionImage(item)],
    reviewCount: Number(item.reviewCount || 0) || 20 + (aHash(item.id || item.nameEn) % 650),
    description: item.descriptionEn || "Explore one of Jordan's standout destinations with easy access to nearby stays and dining.",
    descriptionAr: item.descriptionAr || "",
    languages: attractionLanguages(item),
  };
}

function bilingualDetailBlock(item) {
  const englishTitle = item.title || "Attraction";
  const arabicTitle = item.titleAr || "لا يوجد اسم عربي متاح";
  const englishDescription = item.description || "Description unavailable.";
  const arabicDescription = item.descriptionAr || "لا يوجد وصف عربي متاح حالياً.";

  return `
    <div class="attraction-bilingual-grid">
      <article class="attraction-language-card">
        <span class="attraction-language-label">English</span>
        <h5>${aEsc(englishTitle)}</h5>
        <p>${aEsc(englishDescription)}</p>
      </article>
      <article class="attraction-language-card attraction-language-card-ar" dir="rtl">
        <span class="attraction-language-label">العربية</span>
        <h5>${aEsc(arabicTitle)}</h5>
        <p>${aEsc(arabicDescription)}</p>
      </article>
    </div>
  `;
}
function aRefPoint() {
  if (!attractionState.map) return ATTRACTION_CENTER;
  const c = attractionState.map.getCenter();
  return [c.lat, c.lng];
}
function aDist(lat1, lon1, lat2, lon2) {
  const r = (d) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = r(lat2 - lat1);
  const dLon = r(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(r(lat1)) * Math.cos(r(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
function attractionDistance(item) {
  if (!item.latitude || !item.longitude) return null;
  const [lat, lng] = aRefPoint();
  return aDist(lat, lng, item.latitude, item.longitude);
}
function selectedAttraction() {
  return attractionState.items.find((item) => item.id === attractionState.selectedId) || null;
}

function openSelectedAttractionInGoogleMaps() {
  const attraction = selectedAttraction() || attractionState.filtered[0] || attractionState.items[0];
  if (!attraction) {
    showToast("No attraction is available to open in Google Maps.", "error");
    return;
  }

  const hasCoordinates =
    Number.isFinite(Number(attraction.latitude)) && Number.isFinite(Number(attraction.longitude));
  const destination = hasCoordinates
    ? `${Number(attraction.latitude)},${Number(attraction.longitude)}`
    : encodeURIComponent(
        `${attraction.title || attraction.nameEn || "Attraction"}, ${attraction.city || "Jordan"}`
      );
  const url = hasCoordinates
    ? `https://www.google.com/maps/dir/?api=1&destination=${destination}`
    : `https://www.google.com/maps/search/?api=1&query=${destination}`;

  window.open(url, "_blank", "noopener,noreferrer");
}

function attractionGuideCatalog(item) {
  const city = String(item.city || "").toLowerCase();
  const allGuides = [
    {
      id: "guide-petra-maya",
      destinations: ["petra", "wadi musa"],
      name: "Maya Al-Hadid",
      photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=800&q=80",
      languages: ["English", "Arabic"],
      yearsExperience: 8,
      rating: 4.9,
      hourlyRate: 28,
      availability: "Available this week",
      bio: "Specializes in Petra storytelling routes, family pacing, and archaeology-rich tours.",
      services: ["Walking tours", "Family tours", "Sunrise routes"],
    },
    {
      id: "guide-wadi-rum-yousef",
      destinations: ["wadi rum", "aqaba"],
      name: "Yousef Zalabieh",
      photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80",
      languages: ["English", "Arabic", "French"],
      yearsExperience: 10,
      rating: 4.8,
      hourlyRate: 24,
      availability: "Available tomorrow",
      bio: "Bedouin desert expert for jeep routes, stargazing, and camp coordination.",
      services: ["Desert tours", "Camp coordination", "Adventure routes"],
    },
    {
      id: "guide-amman-lina",
      destinations: ["amman", "jerash"],
      name: "Lina Khoury",
      photo: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=800&q=80",
      languages: ["English", "Arabic", "German"],
      yearsExperience: 7,
      rating: 4.9,
      hourlyRate: 26,
      availability: "Weekend slots left",
      bio: "Culture-led city guide covering food walks, museums, and Roman-era highlights.",
      services: ["Food tours", "Cultural tours", "Private city walks"],
    },
    {
      id: "guide-deadsea-sami",
      destinations: ["dead sea", "madaba"],
      name: "Sami Haddad",
      photo: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=800&q=80",
      languages: ["English", "Arabic"],
      yearsExperience: 9,
      rating: 4.7,
      hourlyRate: 22,
      availability: "Available this week",
      bio: "Wellness and heritage-focused guide for Dead Sea escapes and nearby cultural day trips.",
      services: ["Wellness routes", "Private transfers", "Day trips"],
    },
  ];

  return allGuides.filter((guide) => guide.destinations.some((destination) => city.includes(destination)));
}

async function loadGuidesForAttraction(item) {
  try {
    const guides = await CertifiedGuidesAPI.getAll({ attractionId: item.id });
    if (Array.isArray(guides) && guides.length) {
      return guides.map((guide) => ({
        id: guide.id,
        name: guide.fullName,
        photo: guide.profilePhoto,
        languages: guide.languages || [],
        yearsExperience: guide.yearsExperience || 0,
        rating: Number(guide.rating || 0),
        hourlyRate: Number(guide.hourlyRate || 0),
        availability: guide.availability || "Available",
        bio: guide.bio || "",
        services: guide.services || [],
      }));
    }
  } catch (_error) {
    // Fall back to local guide catalog below.
  }
  return attractionGuideCatalog(item);
}

function filteredGuides() {
  return attractionState.activeGuides.filter((guide) => {
    if (attractionState.guideFilters.language && !guide.languages.includes(attractionState.guideFilters.language)) return false;
    if (attractionState.guideFilters.price === "low" && guide.hourlyRate > 20) return false;
    if (attractionState.guideFilters.price === "mid" && (guide.hourlyRate < 21 || guide.hourlyRate > 26)) return false;
    if (attractionState.guideFilters.price === "high" && guide.hourlyRate < 27) return false;
    if (Number(guide.rating || 0) < Number(attractionState.guideFilters.rating || 0)) return false;
    if (attractionState.guideFilters.availability && !String(guide.availability || "").toLowerCase().includes(attractionState.guideFilters.availability.toLowerCase())) return false;
    return true;
  });
}

function guideCard(guide) {
  return `
    <article class="guide-card">
      <div class="guide-card-head">
        <div class="guide-card-copy">
          <div class="guide-card-name">${aEsc(guide.name)}</div>
          <p>${aEsc(guide.bio)}</p>
        </div>
        <span class="guide-card-badge">Verified / Licensed Guide</span>
      </div>
      <div class="guide-card-meta">
        <span>${aEsc(guide.languages.join(", "))}</span>
        <span>${guide.yearsExperience}+ years</span>
        <span>${guide.rating.toFixed(1)} rating</span>
        <span>${guide.hourlyRate} JOD / hour</span>
        <span>${aEsc(guide.availability)}</span>
      </div>
      <div class="guide-card-actions">
        <button class="btn btn-outline btn-sm" type="button" onclick="openGuideProfile('${aEsc(guide.id)}')">View Profile</button>
        <button class="btn btn-primary btn-sm" type="button" onclick="bookGuide('${aEsc(guide.id)}')">Book Guide</button>
      </div>
    </article>
  `;
}

function renderGuideList() {
  const root = aById("guide-list");
  if (!root) return;
  const guides = filteredGuides();
  root.innerHTML = guides.length
    ? guides.map(guideCard).join("")
    : `<div class="guide-card"><div class="guide-card-copy"><div class="guide-card-name">No guides match these filters</div><p>Try another language, price range, or availability option.</p></div></div>`;
}

function bindGuideFilters() {
  [["guide-language-filter", "language"], ["guide-price-filter", "price"], ["guide-availability-filter", "availability"], ["guide-rating-filter", "rating"]]
    .forEach(([id, key]) => {
      const element = aById(id);
      if (!element) return;
      element.addEventListener("change", (event) => {
        attractionState.guideFilters[key] = event.target.value;
        renderGuideList();
      });
    });
}

async function loadStoriesForDestination(item) {
  try {
    const stories = await TravelerStoriesAPI.getAll({ destination: item.city });
    if (Array.isArray(stories)) return stories;
  } catch (_error) {
    // Fall back to bundled content.
  }
  return typeof findStoriesByDestination === "function" ? findStoriesByDestination(item.city) : [];
}

function relatedStoryCards(item, stories) {
  if (!stories.length) {
    return `<div class="story-preview-card"><div class="story-preview-copy"><div class="story-preview-title">No traveler stories yet</div><p>We will surface real visitor stories here as travelers share their experiences.</p></div><div class="story-preview-actions"><a class="btn btn-outline btn-sm" href="traveler-stories.html">Explore all stories</a></div></div>`;
  }
  return stories.slice(0, 2).map((story) => `
    <article class="story-preview-card">
      <img src="${aEsc(story.coverImage)}" alt="${aEsc(story.title)}" />
      <div class="story-preview-copy">
        <div class="story-preview-title">${aEsc(story.title)}</div>
        <p>${aEsc(story.description)}</p>
      </div>
      <div class="story-preview-meta">
        <span>${aEsc(story.userName)}</span>
        <span>${story.rating.toFixed(1)} rating</span>
        <span>${story.estimatedCost} JOD</span>
      </div>
      <div class="story-preview-actions">
        <a class="btn btn-outline btn-sm" href="traveler-stories.html?story=${encodeURIComponent(story.id)}">Open Story</a>
        <a class="btn btn-primary btn-sm" href="trip-planner.html?destination=${encodeURIComponent(story.destination)}&days=${encodeURIComponent(story.durationDays)}&budget=${encodeURIComponent(story.estimatedCost)}&travelers=${encodeURIComponent(story.travelers)}&interests=${encodeURIComponent(story.travelInterests.join(','))}">Create Trip Like This</a>
      </div>
    </article>
  `).join("");
}

function attractionPageSize() {
  return 4;
}

function attractionTotalPages() {
  return Math.max(1, Math.ceil(attractionState.filtered.length / attractionPageSize()));
}

function attractionPageSlice() {
  const size = attractionPageSize();
  const page = Math.min(Math.max(attractionState.currentPage, 1), attractionTotalPages());
  const start = (page - 1) * size;
  return attractionState.filtered.slice(start, start + size);
}

function attractionPageForId(id) {
  const index = attractionState.filtered.findIndex((item) => item.id === id);
  if (index < 0) return 1;
  return Math.floor(index / attractionPageSize()) + 1;
}

function scrollToAttractionResults() {
  attractionEls.resultsSection?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function scrollToDetailSection() {
  attractionEls.detailSection?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function setDetailView(open) {
  if (attractionEls.browseView) attractionEls.browseView.hidden = open;
  if (attractionEls.detailSection) attractionEls.detailSection.hidden = !open;
  document.body.classList.toggle("attraction-detail-mode", open);
  if (open) {
    window.scrollTo({ top: 0, behavior: "smooth" });
  } else {
    window.setTimeout(() => {
      if (attractionState.map) attractionState.map.invalidateSize();
    }, 0);
    attractionEls.resultsSection?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function syncDetailUrl(id, open) {
  if (!window.history?.replaceState) return;
  const params = new URLSearchParams(window.location.search);
  if (id) params.set("id", String(id));
  if (open && id) params.set("detail", "1");
  else params.delete("detail");
  const query = params.toString();
  const nextUrl = `${window.location.pathname}${query ? `?${query}` : ""}`;
  window.history.replaceState({}, "", nextUrl);
}

function setAttractionPage(page, { scroll = false } = {}) {
  const nextPage = Math.min(Math.max(Number(page) || 1, 1), attractionTotalPages());
  if (nextPage === attractionState.currentPage) {
    if (scroll) scrollToAttractionResults();
    return;
  }
  attractionState.currentPage = nextPage;
  renderAttractionResults();
  if (scroll) scrollToAttractionResults();
}

function syncAttractionInputs() {
  attractionEls.search.value = attractionState.filters.search;
  attractionEls.city.value = attractionState.filters.city;
  attractionEls.category.value = attractionState.filters.category;
  if (attractionEls.language) attractionEls.language.value = attractionState.filters.language;
  attractionEls.rating.value = String(attractionState.filters.rating);
  attractionEls.sort.value = attractionState.filters.sort;
  attractionEls.fee.value = String(attractionState.filters.fee);
  attractionEls.feeOut.textContent = `Up to ${aFee(attractionState.filters.fee)}`;
}

function renderAttractionCities() {
  const cities = [...new Set(attractionState.items.map((item) => item.city).filter(Boolean))].sort((a, b) => a.localeCompare(b));
  attractionEls.city.innerHTML = `<option value="">All destinations</option>${cities.map((city) => `<option value="${aEsc(city)}">${aEsc(city)}</option>`).join("")}`;
  attractionEls.city.value = attractionState.filters.city;
}

async function renderAttractionCategories() {
  let categories = [];
  try {
    const data = await CategoriesAPI.getByType("Attraction");
    categories = Array.isArray(data) ? data.map((item) => ({ value: String(item.id), label: item.name })) : [];
  } catch (_e) {
    categories = [...new Set(attractionState.items.map((item) => item.categoryLabel).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b))
      .map((label) => ({ value: label, label }));
  }
  attractionEls.category.innerHTML = `<option value="">All categories</option>${categories.map((item) => `<option value="${aEsc(item.value)}">${aEsc(item.label)}</option>`).join("")}`;
  attractionEls.category.value = attractionState.filters.category;
}

function sortAttractions(list) {
  const items = [...list];
  switch (attractionState.filters.sort) {
    case "rating-desc": items.sort((a, b) => b.rating - a.rating); break;
    case "fee-asc": items.sort((a, b) => a.entryFee - b.entryFee); break;
    case "fee-desc": items.sort((a, b) => b.entryFee - a.entryFee); break;
    case "distance-asc":
      items.sort((a, b) => {
        const da = attractionDistance(a);
        const db = attractionDistance(b);
        if (da == null) return 1;
        if (db == null) return -1;
        return da - db;
      });
      break;
    default:
      items.sort((a, b) => (b.rating * 20 - b.entryFee * 0.2) - (a.rating * 20 - a.entryFee * 0.2));
      break;
  }
  return items;
}

function applyAttractionFilters() {
  const q = attractionState.filters.search.trim().toLowerCase();
  const previousSelectedId = attractionState.selectedId;
  attractionState.filtered = sortAttractions(attractionState.items.filter((item) => {
    if (attractionState.filters.city && item.city !== attractionState.filters.city) return false;
    if (attractionState.filters.category) {
      const direct = String(item.categoryId ?? "") === attractionState.filters.category;
      const label = item.categoryLabel === attractionState.filters.category;
      if (!direct && !label) return false;
    }
    if (attractionState.filters.language) {
      const languages = attractionLanguages(item).map((lang) => lang.toLowerCase());
      if (!languages.includes(attractionState.filters.language.toLowerCase())) return false;
    }
    if (item.rating < attractionState.filters.rating) return false;
    if (item.entryFee > attractionState.filters.fee) return false;
    if (!q) return true;
    return `${item.title} ${item.city} ${item.categoryLabel} ${item.description}`.toLowerCase().includes(q);
  }));
  attractionState.currentPage = 1;
  if (!attractionState.filtered.some((item) => item.id === attractionState.selectedId)) attractionState.selectedId = attractionState.filtered[0]?.id || null;
  if (previousSelectedId && previousSelectedId !== attractionState.selectedId) {
    closeAttractionDetail();
  }
  renderAttractionResults();
}

function updateAttractionSummary() {
  const item = selectedAttraction();
  if (!attractionEls.mapSummary || !attractionEls.subtitle) {
    if (attractionEls.mapSummary) attractionEls.mapSummary.textContent = "Click a marker or card to focus an attraction.";
    if (attractionEls.subtitle) attractionEls.subtitle.textContent = "Browse the most trusted experiences across Jordan.";
    return;
  }
  if (!item) {
    attractionEls.mapSummary.textContent = "Click a marker or card to focus an attraction.";
    attractionEls.subtitle.textContent = "Browse the most trusted experiences across Jordan.";
    return;
  }
  const dist = attractionDistance(item);
  attractionEls.mapSummary.textContent = `${item.title} - ${aFee(item.entryFee)} starting price`;
  attractionEls.subtitle.textContent = `${item.city}${dist ? ` - ${dist.toFixed(1)} km from map center` : ""}`;
}

function attractionCard(item) {
  const dist = attractionDistance(item);
  const languages = attractionLanguages(item);
  const favorite = attractionState.favorites.has(item.id);
  return `
    <article class="attraction-card ${item.id === attractionState.selectedId ? "active" : ""}" data-attraction-id="${item.id}">
      <div class="attraction-card-media">
        <img class="attraction-card-main-image" src="${aEsc(item.image)}" alt="${aEsc(item.title)}" loading="lazy" />
      </div>
      <div class="attraction-card-body">
        <div class="attraction-card-topline">
          <div class="attraction-card-copy">
            <div class="attraction-card-header">
              <h3 class="attraction-card-title">${aEsc(item.title)}</h3>
              <span class="attraction-card-verified">Verified</span>
            </div>
            <div class="attraction-card-rating">
              <span class="attraction-card-rating-stars">${aStars(item.rating)}</span>
              <span>${item.rating.toFixed(1)} (${item.reviewCount} reviews)</span>
            </div>
            <div class="attraction-card-location">${aEsc(item.city)}, Jordan</div>
          </div>
          <button class="attraction-card-favorite ${favorite ? "active" : ""}" type="button" data-action="favorite" data-attraction-id="${item.id}" aria-label="Save ${aEsc(item.title)}">
            ${favorite ? "♥" : "♡"}
          </button>
        </div>
        <div class="attraction-card-details">
          <span class="attraction-card-stat">${attractionToursCount(item)} Tours</span>
          <span class="attraction-card-stat">${attractionExperienceYears(item)}+ Years</span>
          <span class="attraction-card-stat">${aEsc(languages.join(", "))}</span>
          <span class="attraction-card-stat">${aEsc(item.categoryLabel)}</span>
          <span class="attraction-card-stat">${dist ? `${dist.toFixed(1)} km away` : "City center"}</span>
        </div>
        <div class="attraction-card-desc">${aEsc(item.description)}</div>
        <div class="attraction-card-meta">
          <span class="attraction-tag">Verified guide network</span>
          <span class="attraction-tag">Best price guarantee</span>
        </div>
        <div class="attraction-card-footer">
          <div class="attraction-card-price">
            <span>From</span>
            <strong>${aFee(item.entryFee)}</strong>
          </div>
          <div class="attraction-card-actions">
            <button class="btn btn-outline btn-sm" type="button" data-action="details" data-attraction-id="${item.id}">View Details</button>
          </div>
        </div>
      </div>
    </article>
  `;
}

function topRatedItem(item) {
  return `
    <article class="explorer-top-rated-item" data-attraction-id="${item.id}">
      <div class="explorer-top-rated-thumb">
        <img src="${aEsc(item.image)}" alt="${aEsc(item.title)}" />
      </div>
      <div>
        <div class="explorer-top-rated-name">${aEsc(item.title)}</div>
        <div class="top-rated-subtext">${aEsc(item.city)}, Jordan</div>
      </div>
      <div class="explorer-top-rated-rating">${item.rating.toFixed(1)} ★</div>
    </article>
  `;
}

function renderTopRated() {
  if (!attractionEls.topRated) return;
  const topItems = [...attractionState.filtered]
    .sort((a, b) => (b.rating - a.rating) || (b.reviewCount - a.reviewCount))
    .slice(0, 5);

  if (!topItems.length) {
    attractionEls.topRated.innerHTML = `<div class="empty-state"><div><h3>No top rated results</h3><p>Try clearing filters to see more options.</p></div></div>`;
    return;
  }

  attractionEls.topRated.innerHTML = topItems.map(topRatedItem).join("");
  attractionEls.topRated.querySelectorAll(".explorer-top-rated-item").forEach((itemEl) => {
    itemEl.addEventListener("click", () => {
      const id = Number(itemEl.getAttribute("data-attraction-id"));
      selectAttraction(id, true, true, true);
    });
  });
}

function renderAttractionList() {
  const pageItems = attractionPageSlice();
  if (!attractionState.filtered.length) {
    attractionEls.list.innerHTML = `<div class="empty-state"><div><h3>No attractions match these filters</h3><p>Try changing the city, category, or fee range.</p></div></div>`;
    return;
  }
  if (!pageItems.length) {
    attractionEls.list.innerHTML = `<div class="empty-state"><div><h3>No attractions on this page</h3><p>Try another page or adjust your filters.</p></div></div>`;
    return;
  }
  attractionEls.list.innerHTML = pageItems.map(attractionCard).join("");
  attractionEls.list.querySelectorAll(".attraction-card").forEach((card) => {
    const id = Number(card.getAttribute("data-attraction-id"));
    card.addEventListener("click", (e) => {
      if (e.target.closest("[data-action]")) return;
      selectAttraction(id, true, false, true);
    });
  });
  attractionEls.list.querySelectorAll("[data-action='details']").forEach((btn) => btn.addEventListener("click", (e) => {
    e.stopPropagation();
    const id = Number(btn.getAttribute("data-attraction-id"));
    openDetail(id);
  }));
  attractionEls.list.querySelectorAll("[data-action='favorite']").forEach((btn) => btn.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleFavorite(Number(btn.getAttribute("data-attraction-id")));
  }));
  attractionEls.list.querySelectorAll("[data-action='trip']").forEach((btn) => btn.addEventListener("click", (e) => {
    e.stopPropagation();
    addToTrip(Number(btn.getAttribute("data-attraction-id")));
  }));
}

function attractionMarkerIcon(item, active) {
  return L.divIcon({
    className: "",
    html: `<div class="attraction-marker ${active ? "active" : ""}"><div class="attraction-marker-badge"><span>${aFee(item.entryFee)}</span><span>${item.rating.toFixed(1)}</span></div><div class="attraction-marker-tail"></div></div>`,
    iconSize: [110, 44],
    iconAnchor: [55, 44],
    popupAnchor: [0, -42],
  });
}

function attractionPopup(item) {
  return `<div class="attraction-popup"><h4>${aEsc(item.title)}</h4><p>${aEsc(item.city)} - ${aEsc(item.categoryLabel)}</p><div class="attraction-popup-meta"><span>${aFee(item.entryFee)}</span><span>${item.rating.toFixed(1)} rating</span></div><div style="margin-top:12px;display:flex;gap:8px;"><button class="btn btn-outline btn-sm" type="button" onclick="openDetail(${item.id})">Details</button></div></div>`;
}

function renderAttractionMarkers() {
  attractionState.markers.forEach((marker) => marker.remove());
  attractionState.markers.clear();
  const bounds = [];
  attractionState.filtered.forEach((item) => {
    if (!item.latitude || !item.longitude) return;
    const marker = L.marker([item.latitude, item.longitude], { icon: attractionMarkerIcon(item, item.id === attractionState.selectedId) }).addTo(attractionState.map);
    marker.bindPopup(attractionPopup(item));
    marker.on("click", () => selectAttraction(item.id, false, true, true));
    attractionState.markers.set(item.id, marker);
    bounds.push([item.latitude, item.longitude]);
  });
  const selected = selectedAttraction();
  if (selected && selected.latitude && selected.longitude) attractionState.map.setView([selected.latitude, selected.longitude], Math.max(attractionState.map.getZoom(), 11));
  else if (bounds.length) attractionState.map.fitBounds(bounds, { padding: [40, 40] });
}

function renderAttractionResults() {
  attractionEls.results.textContent = `${attractionState.filtered.length} attraction${attractionState.filtered.length === 1 ? "" : "s"} available`;
  renderAttractionList();
  renderAttractionMarkers();
  renderTopRated();
  renderAttractionPagination();
  updateAttractionSummary();
}

function renderAttractionPagination() {
  if (!attractionEls.pagination || !attractionEls.paginationSummary) return;
  const total = attractionState.filtered.length;
  const totalPages = attractionTotalPages();
  const currentPage = Math.min(Math.max(attractionState.currentPage, 1), totalPages);
  const pageSize = attractionPageSize();
  const start = total === 0 ? 0 : ((currentPage - 1) * pageSize) + 1;
  const end = total === 0 ? 0 : Math.min(currentPage * pageSize, total);

  attractionEls.paginationSummary.textContent = total === 0
    ? "No attractions to show."
    : `Showing ${start}-${end} of ${total} attractions.`;

  if (totalPages <= 1) {
    attractionEls.pagination.innerHTML = "";
    return;
  }

  const pageWindow = 2;
  const pageSet = new Set([1, totalPages]);
  for (let page = currentPage - pageWindow; page <= currentPage + pageWindow; page += 1) {
    if (page > 1 && page < totalPages) pageSet.add(page);
  }
  const pages = [...pageSet].sort((a, b) => a - b);
  const controls = [];

  controls.push(`<button class="explorer-page-btn" type="button" data-page-action="prev" ${currentPage === 1 ? "disabled" : ""}>Previous</button>`);
  pages.forEach((page, index) => {
    const prev = pages[index - 1];
    if (prev && page - prev > 1) {
      controls.push('<span class="explorer-page-ellipsis" aria-hidden="true">…</span>');
    }
    controls.push(`<button class="explorer-page-btn ${page === currentPage ? "active" : ""}" type="button" data-page="${page}" aria-current="${page === currentPage ? "page" : "false"}">${page}</button>`);
  });
  controls.push(`<button class="explorer-page-btn" type="button" data-page-action="next" ${currentPage === totalPages ? "disabled" : ""}>Next</button>`);

  attractionEls.pagination.innerHTML = controls.join("");
  attractionEls.pagination.querySelectorAll("[data-page]").forEach((btn) => {
    btn.addEventListener("click", () => setAttractionPage(Number(btn.getAttribute("data-page")), { scroll: true }));
  });
  attractionEls.pagination.querySelectorAll("[data-page-action]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const delta = btn.getAttribute("data-page-action") === "next" ? 1 : -1;
      setAttractionPage(currentPage + delta, { scroll: true });
    });
  });
}

function toggleFavorite(id) {
  if (attractionState.favorites.has(id)) attractionState.favorites.delete(id);
  else attractionState.favorites.add(id);
  renderAttractionList();
  renderTopRated();
}

function selectAttraction(id, centerMap = true, scrollCard = true, openPopup = false) {
  attractionState.selectedId = id;
  const selectedPage = attractionPageForId(id);
  if (selectedPage !== attractionState.currentPage) {
    attractionState.currentPage = selectedPage;
    renderAttractionResults();
  } else {
    renderAttractionList();
    updateAttractionSummary();
  }
  attractionState.markers.forEach((marker, markerId) => {
    const item = attractionState.items.find((entry) => entry.id === markerId);
    if (item) marker.setIcon(attractionMarkerIcon(item, markerId === id));
  });
  const item = selectedAttraction();
  const marker = attractionState.markers.get(id);
  if (item && marker && centerMap) attractionState.map.setView([item.latitude, item.longitude], Math.max(attractionState.map.getZoom(), 12), { animate: true });
  if (marker && openPopup) marker.openPopup();
  if (scrollCard) {
    const card = attractionEls.list.querySelector(`[data-attraction-id="${id}"]`);
    if (card) card.scrollIntoView({ behavior: "smooth", block: "start" });
    else scrollToAttractionResults();
  }
}

function fitAttractionMap() {
  const points = attractionState.filtered.filter((item) => item.latitude && item.longitude).map((item) => [item.latitude, item.longitude]);
  if (!points.length) { attractionState.map.setView(ATTRACTION_CENTER, 7); return; }
  attractionState.map.fitBounds(points, { padding: [40, 40] });
}

async function openDetail(id) {
  try {
    const localItem = attractionState.items.find((entry) => String(entry.id) === String(id));
    const rawItem = localItem || await AttractionsAPI.getById(id);
    const item = normalizeAttraction(rawItem || {});
    if (!Array.isArray(item.images) || !item.images.length) {
      item.images = [item.image, item.image, item.image];
    }
    if (!item) {
      showToast("Could not open attraction details right now.", "error");
      return;
    }
    const reviews = typeof loadPlaceReviews === "function" ? await loadPlaceReviews("attraction", id) : [];
    const summary = typeof summarizeReviews === "function"
      ? summarizeReviews(reviews, item.rating, item.reviewCount)
      : { rating: item.rating, count: item.reviewCount };
    item.rating = summary.rating;
    item.reviewCount = summary.count;
    selectAttraction(item.id, false, false, false);
    attractionState.activeGuides = await loadGuidesForAttraction(item);
    const stories = await loadStoriesForDestination(item);
    attractionState.guideFilters = { language: "", price: "", rating: 0, availability: "" };
    attractionEls.detailTitle.textContent = item.titleAr ? `${item.title} / ${item.titleAr}` : item.title;
    attractionEls.detailContent.innerHTML = `
    <div class="attraction-detail">
      <div class="attraction-detail-gallery">
        <div class="attraction-detail-hero"><img src="${aEsc(item.image)}" alt="${aEsc(item.title)}" /></div>
        <div class="attraction-detail-thumb-grid">${item.images.slice(1, 4).map((img) => `<div class="attraction-detail-thumb"><img src="${aEsc(img)}" alt="${aEsc(item.title)}" /></div>`).join("")}</div>
      </div>
      <div class="attraction-detail-summary">
        <h4>${aEsc(item.title)}${item.titleAr ? ` <span class="attraction-detail-title-divider">/</span> <span class="attraction-detail-title-ar" dir="rtl">${aEsc(item.titleAr)}</span>` : ""}</h4>
        <div class="attraction-detail-meta"><span>${aEsc(item.city)}</span><span>${aEsc(item.categoryLabel)}</span><span>${item.rating.toFixed(1)} rating</span><span>${item.reviewCount} reviews</span></div>
        ${bilingualDetailBlock(item)}
      </div>
      <div class="attraction-detail-grid">
        <div class="attraction-detail-stat"><span>Entry fee</span><strong>${aFee(item.entryFee)}</strong></div>
        <div class="attraction-detail-stat"><span>Rating</span><strong>${aStars(item.rating)}</strong></div>
        <div class="attraction-detail-stat"><span>Coordinates</span><strong>${item.latitude && item.longitude ? `${item.latitude.toFixed(3)}, ${item.longitude.toFixed(3)}` : "N/A"}</strong></div>
      </div>
      <div>
        <h4 class="section-subtitle">Highlights</h4>
        <div class="attraction-detail-tags">
          <span class="attraction-tag">${aEsc(item.categoryLabel)}</span>
          <span class="attraction-tag">${aFee(item.entryFee)}</span>
          <span class="attraction-tag">${aEsc(item.city)}</span>
        </div>
      </div>
      <div>
        <h4 class="section-subtitle">Certified Tour Guides</h4>
        <div class="guide-filter-bar">
          <select id="guide-language-filter">
            <option value="">All languages</option>
            <option value="English">English</option>
            <option value="Arabic">Arabic</option>
            <option value="French">French</option>
            <option value="German">German</option>
          </select>
          <select id="guide-price-filter">
            <option value="">All price ranges</option>
            <option value="low">Under 21 JOD/hr</option>
            <option value="mid">21-26 JOD/hr</option>
            <option value="high">27+ JOD/hr</option>
          </select>
          <select id="guide-rating-filter">
            <option value="0">Any rating</option>
            <option value="4.8">4.8+</option>
            <option value="4.5">4.5+</option>
          </select>
          <select id="guide-availability-filter">
            <option value="">Any availability</option>
            <option value="week">This week</option>
            <option value="tomorrow">Tomorrow</option>
            <option value="weekend">Weekend</option>
          </select>
        </div>
        <div id="guide-list" class="guide-list"></div>
      </div>
      <div>
        <h4 class="section-subtitle">Traveler Stories From ${aEsc(item.city)}</h4>
        <div class="story-preview-grid">${relatedStoryCards(item, stories)}</div>
      </div>
      <div class="attraction-card-actions">
        <button class="btn btn-primary" type="button" onclick="addToTrip(${item.id})">Add to Trip</button>
        <button class="btn btn-outline" type="button" onclick="focusAttractionOnMap(${item.id})">Show On Map</button>
        <button class="btn btn-ghost" type="button" onclick="closeAttractionDetail()">Close</button>
      </div>
      ${typeof buildReviewSection === "function" ? buildReviewSection({
      placeType: "attraction",
      placeId: item.id,
      reviews,
      summary,
      submitHandler: "submitAttractionReview",
      deleteHandler: "deleteAttractionReview",
    }) : ""}
    </div>
  `;
    setDetailView(true);
    syncDetailUrl(item.id, true);
    bindGuideFilters();
    renderGuideList();
    const existing = attractionState.items.find((entry) => String(entry.id) === String(id));
    if (existing) {
      existing.rating = summary.rating;
      existing.reviewCount = summary.count;
      try {
        renderAttractionResults();
      } catch (renderError) {
        console.error("Failed to refresh attraction list after opening details", renderError);
      }
    }
    scrollToDetailSection();
  } catch (error) {
    console.error("Failed to open attraction details", error);
    showToast("Could not open attraction details right now.", "error");
  }
}

function closeAttractionDetail() {
  if (!attractionEls.detailSection) return;
  setDetailView(false);
  syncDetailUrl(attractionState.selectedId, false);
}

function openGuideProfile(id) {
  const guide = attractionState.activeGuides.find((entry) => entry.id === id);
  if (!guide || !attractionEls.guideModal || !attractionEls.guideModalContent) return;
  attractionEls.guideModalTitle.textContent = guide.name;
  attractionEls.guideModalContent.innerHTML = `
    <div class="guide-profile-card">
      <div class="guide-card-head">
        <div class="guide-card-copy">
          <div class="guide-card-name">${aEsc(guide.name)}</div>
          <p>${aEsc(guide.bio)}</p>
        </div>
        <span class="guide-card-badge">Verified / Licensed Guide</span>
      </div>
      <div class="guide-profile-grid">
        <span>${aEsc(guide.languages.join(", "))}</span>
        <span>${guide.yearsExperience}+ years</span>
        <span>${guide.rating.toFixed(1)} rating</span>
        <span>${guide.hourlyRate} JOD / hour</span>
        <span>${aEsc(guide.availability)}</span>
      </div>
      <div>
        <h4 class="section-subtitle">Available services</h4>
        <div class="guide-card-meta">${guide.services.map((service) => `<span>${aEsc(service)}</span>`).join("")}</div>
      </div>
      <div class="guide-card-actions">
        <button class="btn btn-primary" type="button" onclick="bookGuide('${aEsc(guide.id)}')">Book Guide</button>
        <button class="btn btn-ghost" type="button" onclick="closeGuideModal()">Close</button>
      </div>
    </div>
  `;
  attractionEls.guideModal.classList.add("open");
}

function closeGuideModal() {
  attractionEls.guideModal?.classList.remove("open");
}

function bookGuide(id) {
  const guide = attractionState.activeGuides.find((entry) => entry.id === id);
  const item = selectedAttraction();
  if (!guide || !item) return;
  startCheckoutFlow({
    sourceType: "guide",
    itemType: "Certified Guide",
    itemId: guide.id,
    attractionId: item.id,
    itemTitle: guide.name,
    serviceName: `${item.title} guided experience`,
    destination: item.city,
    image: guide.photo || item.image,
    travelersCount: 1,
    selectedAddOns: guide.services.slice(0, 2),
    notes: `Requested guide booking for ${item.title}.`,
    contact: typeof getBookingProfile === "function" ? getBookingProfile() : {},
    priceBreakdown: {
      base: guide.hourlyRate * 4,
      taxes: Math.round(guide.hourlyRate * 4 * 0.08 * 100) / 100,
      fees: 4,
      addOns: 0,
      total: Math.round((guide.hourlyRate * 4 * 1.08 + 4) * 100) / 100,
      currency: "JOD",
    },
  });
}

function addToTrip(id) {
  const item = attractionState.items.find((entry) => entry.id === id);
  if (!isLoggedIn()) {
    showToast("Please login first to add this to your trip.", "error");
    return;
  }
  if (!item || typeof promptAddItemToTrip !== "function") {
    showToast("Trip planner is not available right now.", "error");
    return;
  }
  promptAddItemToTrip({
    itemType: "Attraction",
    itemId: item.id,
    title: item.title,
    location: item.city,
    priceLabel: aFee(item.entryFee),
    image: item.image,
    href: `attractions.html?id=${item.id}`,
  });
}

async function submitAttractionReview(id) {
  if (!isLoggedIn()) {
    showToast("Please login first to leave a review.", "error");
    return;
  }
  const rating = Number(aById("detail-review-rating")?.value || 0);
  const comment = aById("detail-review-comment")?.value.trim() || "";
  if (!rating || !comment) {
    showToast("Please add both a rating and a short review.", "error");
    return;
  }
  const user = getUser();
  await createPlaceReview({
    placeType: "attraction",
    placeId: id,
    userId: user?.id || 0,
    userName: user?.name || "Traveler",
    rating,
    comment,
    createdAt: new Date().toISOString(),
  });
  showToast("Review submitted.", "success");
  await openDetail(id);
}

async function deleteAttractionReview(reviewId, placeId) {
  await deletePlaceReview(reviewId);
  showToast("Review deleted.", "info");
  await openDetail(placeId);
}

function focusAttractionOnMap(id) {
  closeAttractionDetail();
  selectAttraction(id, true, true, true);
}

function toggleAttractionFilters() {
  attractionState.filtersOpen = !attractionState.filtersOpen;
  attractionEls.filters.classList.toggle("open", attractionState.filtersOpen);
}

async function loadAttractions() {
  try {
    const data = await AttractionsAPI.getAll();
    attractionState.items = Array.isArray(data) ? data.map(normalizeAttraction) : [];
    attractionState.maxFee = Math.max(25, ...attractionState.items.map((item) => Math.ceil(item.entryFee / 5) * 5));
    attractionState.filters.fee = attractionState.maxFee;
    attractionEls.fee.max = String(attractionState.maxFee);
    renderAttractionCities();
    await renderAttractionCategories();
    syncAttractionInputs();
    const params = new URLSearchParams(window.location.search);
    if (params.get("city")) attractionState.filters.city = params.get("city");
    if (params.get("search")) attractionState.filters.search = params.get("search");
    if (params.get("category")) attractionState.filters.category = params.get("category");
    if (params.get("language")) attractionState.filters.language = params.get("language");
    syncAttractionInputs();
    applyAttractionFilters();
    fitAttractionMap();
    const id = Number(params.get("id"));
    const shouldOpenDetail = params.get("detail") === "1";
    if (id && attractionState.filtered.some((item) => item.id === id)) {
      selectAttraction(id, true, true, true);
      if (shouldOpenDetail) {
        await openDetail(id);
      }
    } else if (attractionState.filtered[0]) {
      selectAttraction(attractionState.filtered[0].id, false, false, false);
    }
  } catch (e) {
    attractionEls.list.innerHTML = `<div class="empty-state"><div><h3>Could not load attractions</h3><p>${aEsc(e.message || "Unknown error")}</p></div></div>`;
    attractionEls.results.textContent = "0 attractions available";
  }
}

function bindAttractionEvents() {
  if (attractionEls.mobileFilters) attractionEls.mobileFilters.addEventListener("click", toggleAttractionFilters);
  if (attractionEls.resetMap) {
    attractionEls.resetMap.addEventListener("click", openSelectedAttractionInGoogleMaps);
  }
  if (attractionEls.clear) attractionEls.clear.addEventListener("click", () => {
    attractionState.filters = { search: "", city: "", category: "", language: "", rating: 0, fee: attractionState.maxFee, sort: "recommended" };
    syncAttractionInputs();
    applyAttractionFilters();
    fitAttractionMap();
  });
  if (attractionEls.search) attractionEls.search.addEventListener("input", (e) => { attractionState.filters.search = e.target.value; applyAttractionFilters(); });
  if (attractionEls.city) attractionEls.city.addEventListener("change", (e) => { attractionState.filters.city = e.target.value; applyAttractionFilters(); });
  if (attractionEls.category) attractionEls.category.addEventListener("change", (e) => { attractionState.filters.category = e.target.value; applyAttractionFilters(); });
  if (attractionEls.language) attractionEls.language.addEventListener("change", (e) => { attractionState.filters.language = e.target.value; applyAttractionFilters(); });
  if (attractionEls.rating) attractionEls.rating.addEventListener("change", (e) => { attractionState.filters.rating = Number(e.target.value); applyAttractionFilters(); });
  if (attractionEls.sort) attractionEls.sort.addEventListener("change", (e) => { attractionState.filters.sort = e.target.value; applyAttractionFilters(); });
  if (attractionEls.fee) attractionEls.fee.addEventListener("input", (e) => { attractionState.filters.fee = Number(e.target.value); attractionEls.feeOut.textContent = `Up to ${aFee(attractionState.filters.fee)}`; applyAttractionFilters(); });
  if (attractionEls.closeDetail) attractionEls.closeDetail.addEventListener("click", closeAttractionDetail);
  if (attractionEls.guideModal) attractionEls.guideModal.addEventListener("click", (e) => { if (e.target === attractionEls.guideModal) closeGuideModal(); });
  window.addEventListener("resize", () => {
    if (attractionState.map) attractionState.map.invalidateSize();
    renderAttractionResults();
  });
}

function initAttractionMap() {
  attractionState.map = L.map("attractions-map").setView(ATTRACTION_CENTER, 7);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "&copy; OpenStreetMap contributors" }).addTo(attractionState.map);
  attractionState.map.on("moveend", () => {
    if (attractionState.filters.sort === "distance-asc") applyAttractionFilters();
    else { renderAttractionList(); updateAttractionSummary(); }
  });
}

function cacheAttractionEls() {
  attractionEls.search = aById("attraction-search-input");
  attractionEls.mobileFilters = aById("mobile-filters-toggle");
  attractionEls.resetMap = aById("reset-map-view-btn");
  attractionEls.city = aById("city-filter");
  attractionEls.category = aById("category-filter");
  attractionEls.language = aById("language-filter");
  attractionEls.rating = aById("rating-filter");
  attractionEls.sort = aById("sort-filter");
  attractionEls.fee = aById("fee-range");
  attractionEls.feeOut = aById("fee-range-output");
  attractionEls.filters = aById("filters-panel");
  attractionEls.clear = aById("clear-filters-btn");
  attractionEls.results = aById("results-count");
  attractionEls.subtitle = aById("results-subtitle");
  attractionEls.mapSummary = aById("map-selection-summary");
  attractionEls.resultsSection = aById("attractions-results-section");
  attractionEls.paginationSummary = aById("pagination-summary");
  attractionEls.pagination = aById("pagination-controls");
  attractionEls.topRated = aById("top-rated-list");
  attractionEls.list = aById("attraction-list");
  attractionEls.browseView = aById("attractions-browse-view");
  attractionEls.detailSection = aById("attraction-detail-section");
  attractionEls.detailTitle = aById("inline-detail-title");
  attractionEls.detailContent = aById("inline-detail-content");
  attractionEls.closeDetail = aById("close-inline-detail-btn");
  attractionEls.guideModal = aById("guide-modal");
  attractionEls.guideModalTitle = aById("guide-modal-title");
  attractionEls.guideModalContent = aById("guide-modal-content");
}

async function initAttractionPage() {
  cacheAttractionEls();
  initAttractionMap();
  bindAttractionEvents();
  await loadAttractions();
}

window.openDetail = openDetail;
window.closeAttractionDetail = closeAttractionDetail;
window.closeModal = closeAttractionDetail;
window.openGuideProfile = openGuideProfile;
window.closeGuideModal = closeGuideModal;
window.bookGuide = bookGuide;
window.addToTrip = addToTrip;
window.submitAttractionReview = submitAttractionReview;
window.deleteAttractionReview = deleteAttractionReview;
window.focusAttractionOnMap = focusAttractionOnMap;

document.addEventListener("DOMContentLoaded", initAttractionPage);
