const companyDetailState = {
  company: null,
  currentBookingItem: null,
  reviewFilter: "all",
  explorerMap: null,
  companyChatMessages: [],
};

function qParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

function dById(id) {
  return document.getElementById(id);
}

function dEsc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function money(value, currency = "USD") {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) return "Custom";
  return currency === "USD" ? `$${amount}` : `${amount} ${currency}`;
}

function serviceStartPrice(company) {
  const prices = []
    .concat((company.tours || []).map((item) => Number(item.price) || 0))
    .concat((company.packages || []).map((item) => Number(item.price) || 0))
    .concat((company.transportServices || []).map((item) => Number(item.price) || 0))
    .filter((price) => price > 0);
  return prices.length ? Math.min(...prices) : 0;
}

function initials(name) {
  return String(name || "Guest")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] || "")
    .join("")
    .toUpperCase();
}

function switchTab(selectedId) {
  document.querySelectorAll(".company-tabs [role='tab']").forEach((tab) => {
    const panel = dById(tab.getAttribute("aria-controls"));
    const active = tab.getAttribute("aria-controls") === selectedId;
    tab.setAttribute("aria-selected", active ? "true" : "false");
    if (panel) panel.hidden = !active;
  });
}

function renderStats(company) {
  const statsEl = dById("company-stats");
  const stats = [
    { label: "Years of Experience", value: company.stats?.yearsExperience || "5+" },
    { label: "Happy Travelers", value: company.stats?.happyTravelers || "500+" },
    { label: "Unique Experiences", value: company.stats?.uniqueExperiences || "12+" },
    { label: "Professional Guides", value: company.stats?.professionalGuides || "6" },
  ];

  statsEl.innerHTML = stats
    .map(
      (stat) => `
        <div class="stat">
          <span class="stat-value">${dEsc(stat.value)}</span>
          <span class="stat-label">${dEsc(stat.label)}</span>
        </div>
      `
    )
    .join("");
}

function renderBadges(company) {
  dById("company-badges").innerHTML = (company.badges || [])
    .map((badge) => `<span class="badge">${dEsc(badge)}</span>`)
    .join("");

  dById("company-feature-strip").innerHTML = [
    company.location,
    `Since ${company.foundedYear}`,
    company.supportedLanguages.join(", "),
    company.isLicensed ? "Licensed company" : "Custom operator",
  ]
    .filter(Boolean)
    .map((text) => `<span class="feature-pill">${dEsc(text)}</span>`)
    .join("");
}

function renderGallery(company) {
  const feature = dById("gallery-feature-image");
  const galleryEl = dById("company-gallery");
  feature.src = company.gallery[0];
  feature.alt = company.name;

  galleryEl.innerHTML = company.gallery
    .map(
      (image, index) =>
        `<img src="${dEsc(image)}" alt="${dEsc(company.name)} view ${index + 1}" loading="lazy" data-gallery-src="${dEsc(image)}" />`
    )
    .join("");

  galleryEl.querySelectorAll("[data-gallery-src]").forEach((img) => {
    img.addEventListener("click", () => {
      feature.src = img.getAttribute("data-gallery-src");
    });
  });
}

function serviceMetaLine(item, type) {
  if (type === "tour") {
    return [
      item.duration,
      `${item.minGroupSize}-${item.maxGroupSize}`,
      (item.languages || []).join(", "),
    ]
      .filter(Boolean)
      .join(" · ");
  }
  if (type === "package") {
    return [
      `${item.durationDays} days`,
      `${item.minGroupSize}-${item.maxGroupSize}`,
      item.hotelIncluded ? "Hotels included" : "Hotels not included",
    ].join(" · ");
  }
  return [item.serviceType, item.pickupLocation, item.dropOffLocation]
    .filter(Boolean)
    .join(" · ");
}

function tourCard(item) {
  return `
    <article class="tour-card">
      <div class="tour-card-media">
        <span class="tour-badge">${dEsc(item.badge || "Top Pick")}</span>
        <span class="tour-save">Save</span>
        <img src="${dEsc(item.image)}" alt="${dEsc(item.title)}" loading="lazy" />
      </div>
      <div class="tour-card-body">
        <h3>${dEsc(item.title)}</h3>
        <p>${dEsc(item.description)}</p>
        <div class="tour-meta-grid">
          <span>${dEsc(item.duration)}</span>
          <span>${dEsc(item.minGroupSize)}-${dEsc(item.maxGroupSize)} guests</span>
          <span>${dEsc((item.languages || []).join(", "))}</span>
        </div>
        <div class="tour-rating-row">
          <span><strong>${Number(item.rating || 0).toFixed(1)}</strong> (${dEsc(item.reviewsCount)})</span>
          <span class="tour-price">From ${money(item.price, item.currency)}</span>
        </div>
        <div class="tour-actions">
          <button class="btn btn-outline" type="button" data-view-tour="${item.id}">View Details</button>
          <button class="btn btn-primary" type="button" data-book-tour="${item.id}">Book Now</button>
        </div>
      </div>
    </article>
  `;
}

function listCard(item, type) {
  const title = item.title;
  const image = item.image || companyDetailState.company.heroImage;
  const meta = serviceMetaLine(item, type);

  return `
    <article class="list-item">
      <img src="${dEsc(image)}" alt="${dEsc(title)}" loading="lazy" />
      <div>
        <div class="list-item-title">${dEsc(title)}</div>
        <div class="list-item-subtitle">${dEsc(item.description)}</div>
        <div class="list-item-meta"><span>${dEsc(meta)}</span></div>
      </div>
      <div class="list-item-price">
        From ${money(item.price, item.currency)}
        <div class="list-item-buttons">
          <button class="btn btn-outline btn-sm" type="button" data-view-${type}="${item.id}">View Details</button>
          <button class="btn btn-primary btn-sm" type="button" data-book-${type}="${item.id}">Book Now</button>
        </div>
      </div>
    </article>
  `;
}

function renderTours(company, sortMode = "popular") {
  let tours = (company.tours || []).slice();

  switch (sortMode) {
    case "price-asc":
      tours.sort((a, b) => a.price - b.price);
      break;
    case "rating":
      tours.sort((a, b) => b.rating - a.rating);
      break;
    case "price-desc":
      tours.sort((a, b) => b.price - a.price);
      break;
    case "duration":
      tours.sort((a, b) => String(a.duration).localeCompare(String(b.duration)));
      break;
    default:
      break;
  }

  const html = tours.length
    ? tours.map(tourCard).join("")
    : '<div class="empty-state"><p>No tours available yet.</p></div>';

  dById("tours-grid").innerHTML = html;
  dById("related-grid").innerHTML = html;
}

function renderPackages(company) {
  const html = (company.packages || []).length
    ? `<div class="list-stack">${company.packages
        .map((item) => listCard(item, "package"))
        .join("")}</div>`
    : '<div class="empty-state"><p>No packages available yet.</p></div>';

  dById("packages-list").innerHTML = html;
  dById("packages-panel-list").innerHTML = html;
}

function renderTransport(company) {
  const html = (company.transportServices || []).length
    ? `<div class="list-stack">${company.transportServices
        .map((item) => listCard(item, "transport"))
        .join("")}</div>`
    : '<div class="empty-state"><p>No transport services available yet.</p></div>';

  dById("transport-list").innerHTML = html;
  dById("transport-panel-list").innerHTML = html;
}

function filteredReviews() {
  const reviews = companyDetailState.company.reviews || [];
  switch (companyDetailState.reviewFilter) {
    case "5":
      return reviews.filter((review) => Number(review.rating) >= 5);
    case "4":
      return reviews.filter((review) => Number(review.rating) >= 4 && Number(review.rating) < 5);
    case "photos":
      return reviews.filter((review) => Array.isArray(review.reviewImages) && review.reviewImages.length);
    case "newest":
      return reviews.slice().sort((a, b) => new Date(b.reviewDate) - new Date(a.reviewDate));
    case "oldest":
      return reviews.slice().sort((a, b) => new Date(a.reviewDate) - new Date(b.reviewDate));
    default:
      return reviews;
  }
}

function reviewCard(review) {
  const imageStrip =
    Array.isArray(review.reviewImages) && review.reviewImages.length
      ? `<div class="review-images">${review.reviewImages
          .map(
            (image) =>
              `<img src="${dEsc(image)}" alt="${dEsc(review.userName)} review image" loading="lazy" />`
          )
          .join("")}</div>`
      : "";

  return `
    <article class="review-card">
      <div class="review-head">
        <div class="review-author">
          <span class="review-avatar">${dEsc(initials(review.userName))}</span>
          <div>
            <div class="review-name">${dEsc(review.userName)}</div>
            <div class="review-country">${dEsc(review.country)}</div>
          </div>
        </div>
        <div class="review-rating">${Number(review.rating).toFixed(1)}</div>
      </div>
      <p>${dEsc(review.comment)}</p>
      ${imageStrip}
      <div class="review-date">${dEsc(review.reviewDate)}</div>
    </article>
  `;
}

function reviewFilterBar() {
  const filters = [
    ["all", "All Reviews"],
    ["5", "5 Stars"],
    ["4", "4 Stars"],
    ["photos", "With Photos"],
    ["newest", "Newest"],
    ["oldest", "Oldest"],
  ];

  return `
    <div class="review-filter-bar">
      ${filters
        .map(
          ([value, label]) =>
            `<button type="button" class="review-filter-btn ${
              companyDetailState.reviewFilter === value ? "active" : ""
            }" data-review-filter="${value}">${dEsc(label)}</button>`
        )
        .join("")}
    </div>
  `;
}

function renderReviews() {
  const reviews = filteredReviews();
  const summaryText = `${Number(companyDetailState.company.rating).toFixed(1)} average rating from ${
    companyDetailState.company.reviewsCount
  } reviews`;
  const reviewsHtml = reviews.length
    ? reviews.map(reviewCard).join("")
    : '<div class="empty-state"><p>No reviews yet.</p></div>';

  dById("reviews-summary").innerHTML = `${summaryText}${reviewFilterBar()}`;
  dById("reviews-panel-summary").innerHTML = reviewFilterBar();
  dById("reviews-list").innerHTML = reviewsHtml;
  dById("reviews-panel-list").innerHTML = reviewsHtml;

  document.querySelectorAll("[data-review-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      companyDetailState.reviewFilter = button.getAttribute("data-review-filter");
      renderReviews();
    });
  });
}

function renderFaq(company) {
  const faqs = [
    {
      question: "Is booking required in advance?",
      answer: "Advance booking is recommended to secure your preferred date and guide availability.",
    },
    {
      question: "What languages are available?",
      answer: `This company supports ${company.supportedLanguages.join(", ")}.`,
    },
    {
      question: "Can transport be arranged?",
      answer: "Yes. Airport transfers, private drivers, and package transport can be arranged.",
    },
  ];

  dById("faq-list").innerHTML = `<div class="faq-stack">${faqs
    .map(
      (faq) => `
        <article class="faq-item">
          <div class="faq-question">${dEsc(faq.question)}</div>
          <div class="faq-answer">${dEsc(faq.answer)}</div>
        </article>
      `
    )
    .join("")}</div>`;
}

function renderMap(company) {
  const mapEl = dById("map");
  if (!company.latitude || !company.longitude || !window.L) {
    mapEl.textContent = "Map not available.";
    return;
  }

  mapEl.innerHTML = "";
  const map = L.map("map").setView([company.latitude, company.longitude], 12);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors",
  }).addTo(map);
  L.marker([company.latitude, company.longitude])
    .addTo(map)
    .bindPopup(company.name);
}

async function renderExplorerMap(company) {
  if (typeof createTravelExplorerMap !== "function") return;
  companyDetailState.explorerMap = await createTravelExplorerMap({
    rootId: "company-explorer-map",
    mapId: "company-explorer-map-canvas",
    title: "Explore nearby attractions, hotels, food, tours, and transport",
    kicker: "Interactive area explorer",
    city: () => company.city || company.location || "",
    center: [Number(company.latitude || 31.24), Number(company.longitude || 36.51)],
  });
}

function updateSeo(company) {
  const title = company.seo?.metaTitle || `${company.name} | TravelMind`;
  const description = company.seo?.metaDescription || company.description;
  document.title = title;
  document.querySelector('meta[property="og:title"]').content = title;
  document.querySelector('meta[property="og:description"]').content = description;
  document.querySelector('meta[property="og:image"]').content = company.heroImage;
  document.querySelector('meta[property="og:url"]').content = window.location.href;
  document.querySelector('meta[name="description"]').content = description;
  document.querySelector('meta[name="twitter:title"]').content = title;
  document.querySelector('meta[name="twitter:description"]').content = description;
  document.querySelector('meta[name="twitter:image"]').content = company.heroImage;
}

function fillCompanyProfile(company) {
  companyDetailState.company = company;

  dById("company-title").textContent = company.name;
  dById("company-subtitle").textContent = company.tagline;
  dById("company-description").textContent = company.description;
  dById("overview-text").textContent = company.longDescription;
  dById("company-meta").textContent = `${company.rating.toFixed(1)} rating | ${company.reviewsCount} reviews | ${company.location} | Since ${company.foundedYear}`;
  dById("company-tag").textContent = company.isVerified ? "Verified Local Expert" : "Local Travel Company";
  dById("company-logo").src = company.logo;
  dById("company-verified").textContent = company.isVerified ? "Verified" : "Trusted";
  dById("price-amount").textContent = money(serviceStartPrice(company));
  dById("book-rating").textContent = `${company.rating.toFixed(1)} rating`;
  dById("book-availability").innerHTML = `Availability: <strong>Check dates</strong>`;
  dById("offer-text").textContent = `${company.specialOffer?.discountPercentage || 10}% OFF`;
  dById("company-hero").style.backgroundImage =
    `linear-gradient(180deg, rgba(8, 18, 24, 0.12), rgba(8, 18, 24, 0.42)), url("${company.heroImage}")`;
  dById("chat-btn").textContent = "Chat with Company";

  renderStats(company);
  renderBadges(company);
  renderGallery(company);
  renderTours(company);
  renderPackages(company);
  renderTransport(company);
  renderReviews();
  renderFaq(company);
  renderMap(company);
  renderExplorerMap(company);
  updateSeo(company);
}

async function refreshCompanyFavoriteState() {
  const button = dById("fav-btn");
  const userId = window.currentUser?.id || 0;
  if (!userId || !companyDetailState.company?.id) return;

  try {
    const ids = await api("GET", `/users/${encodeURIComponent(userId)}/company-favorites`);
    const isFavorite = Array.isArray(ids) && ids.includes(companyDetailState.company.id);
    button.setAttribute("aria-pressed", isFavorite ? "true" : "false");
  } catch (_error) {
    // Ignore favorite state errors.
  }
}

function findService(type, id) {
  const key =
    type === "tour"
      ? "tours"
      : type === "package"
        ? "packages"
        : "transportServices";
  return (companyDetailState.company[key] || []).find((item) => String(item.id) === String(id));
}

function openServiceModal(type, item) {
  const content = dById("service-modal-content");
  const gallery = item.gallery || [item.image];
  const showBookingAction = type !== "share";
  const itineraryMarkup =
    type === "share"
      ? `<div class="service-detail-block"><h3>Share Options</h3><ul>
          <li><a href="#" id="copy-share-link">Copy link</a></li>
          <li><a href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}" target="_blank" rel="noreferrer">Share to Facebook</a></li>
          <li><a href="https://wa.me/?text=${encodeURIComponent(window.location.href)}" target="_blank" rel="noreferrer">Share to WhatsApp</a></li>
          <li><a href="https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}" target="_blank" rel="noreferrer">Share to X / Twitter</a></li>
        </ul></div>`
      : item.itinerary
        ? `<div class="service-detail-block"><h3>Itinerary</h3><ol>${item.itinerary
            .map((step) => `<li>${dEsc(step)}</li>`)
            .join("")}</ol></div>`
        : "";

  content.innerHTML = `
    <div class="service-modal-layout">
      <img class="service-modal-hero" src="${dEsc(item.image || gallery[0])}" alt="${dEsc(item.title)}" />
      <div class="service-modal-copy">
        <p class="eyebrow">${dEsc(type)}</p>
        <h2>${dEsc(item.title)}</h2>
        <p>${dEsc(item.description)}</p>
        <div class="service-modal-meta">${dEsc(serviceMetaLine(item, type))}</div>
        <div class="service-modal-meta">Price: ${money(item.price, item.currency)}</div>
        ${
          item.meetingPoint
            ? `<div class="service-modal-meta">Meeting point: ${dEsc(item.meetingPoint)}</div>`
            : ""
        }
        ${
          item.includedServices
            ? `<div class="service-detail-block"><h3>Included</h3><ul>${item.includedServices
                .map((service) => `<li>${dEsc(service)}</li>`)
                .join("")}</ul></div>`
            : ""
        }
        ${
          item.excludedServices
            ? `<div class="service-detail-block"><h3>Excluded</h3><ul>${item.excludedServices
                .map((service) => `<li>${dEsc(service)}</li>`)
                .join("")}</ul></div>`
            : ""
        }
        ${itineraryMarkup}
        ${
          item.cancellationPolicy
            ? `<div class="service-detail-block"><h3>Cancellation Policy</h3><p>${dEsc(
                item.cancellationPolicy
              )}</p></div>`
            : ""
        }
        ${
          showBookingAction
            ? `<div class="service-modal-actions">
                <button class="btn btn-primary" type="button" id="service-modal-book">Book Now</button>
              </div>`
            : ""
        }
      </div>
    </div>
  `;

  const modal = dById("service-modal");
  modal.hidden = false;
  if (showBookingAction) {
    dById("service-modal-book").addEventListener("click", () => {
      closeModal("service-modal");
      openBookingModal(type, item);
    });
  }
  if (type === "share") {
    dById("copy-share-link").addEventListener("click", async (event) => {
      event.preventDefault();
      await navigator.clipboard.writeText(window.location.href);
      alert("Link copied to clipboard");
    });
  }
}

function closeModal(id) {
  dById(id).hidden = true;
}

function companyChatBubble(message) {
  const outgoing = String(message.direction || "").toLowerCase() !== "company_to_traveler";
  const timestamp = new Date(message.createdAt || Date.now()).toLocaleString();
  return `
    <article class="company-chat-bubble ${outgoing ? "outgoing" : ""}">
      <strong>${dEsc(message.senderName || "Traveler")}</strong>
      <div>${dEsc(message.message || "")}</div>
      <span class="company-chat-bubble-meta">${dEsc(timestamp)}</span>
    </article>
  `;
}

async function loadCompanyChat() {
  const thread = dById("company-chat-thread");
  if (!thread || !companyDetailState.company?.id) return;
  thread.innerHTML = `<div class="loading-state"><div class="spinner"></div>Loading conversation...</div>`;
  try {
    const userId = window.currentUser?.id || "";
    companyDetailState.companyChatMessages = await CompanyChatAPI.getByCompany(companyDetailState.company.id, { userId });
  } catch (_error) {
    companyDetailState.companyChatMessages = [];
  }
  thread.innerHTML = companyDetailState.companyChatMessages.length
    ? companyDetailState.companyChatMessages.map(companyChatBubble).join("")
    : `<div class="empty-state"><p>No messages yet. Start the conversation with the company.</p></div>`;
}

async function openCompanyChatModal() {
  dById("company-chat-modal").hidden = false;
  await loadCompanyChat();
}

function openBookingModal(type, item) {
  companyDetailState.currentBookingItem = { type, item };
  dById("booking-service").value = `${item.title} (${type})`;
  dById("booking-error").hidden = true;
  dById("booking-modal").hidden = false;
}

function validateBookingForm() {
  const date = dById("booking-date").value;
  const travelers = Number(dById("booking-travelers").value);
  const name = dById("booking-name").value.trim();
  const phone = dById("booking-phone").value.trim();
  const email = dById("booking-email").value.trim();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (!name) return "Name is required.";
  if (!phone) return "Phone number is required.";
  if (!email) return "Email is required.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Email must be valid.";
  if (!date) return "Booking date is required.";
  if (new Date(date) < today) return "Booking date cannot be in the past.";
  if (!Number.isFinite(travelers) || travelers < 1) return "Travelers count must be at least 1.";
  return "";
}

function bindDetailActions() {
  document.querySelectorAll("[data-view-tour]").forEach((button) => {
    button.addEventListener("click", () => {
      const id = button.getAttribute("data-view-tour");
      const tour = findService("tour", id);
      if (tour) openServiceModal("tour", tour);
    });
  });
  document.querySelectorAll("[data-book-tour]").forEach((button) => {
    button.addEventListener("click", () => openBookingModal("tour", findService("tour", button.getAttribute("data-book-tour"))));
  });
  document.querySelectorAll("[data-view-package]").forEach((button) => {
    button.addEventListener("click", () => openServiceModal("package", findService("package", button.getAttribute("data-view-package"))));
  });
  document.querySelectorAll("[data-book-package]").forEach((button) => {
    button.addEventListener("click", () => openBookingModal("package", findService("package", button.getAttribute("data-book-package"))));
  });
  document.querySelectorAll("[data-view-transport]").forEach((button) => {
    button.addEventListener("click", () => openServiceModal("transport", findService("transport", button.getAttribute("data-view-transport"))));
  });
  document.querySelectorAll("[data-book-transport]").forEach((button) => {
    button.addEventListener("click", () => openBookingModal("transport", findService("transport", button.getAttribute("data-book-transport"))));
  });
}

async function fetchLegacyAttraction(id) {
  try {
    const item = await api("GET", `/attractions/${encodeURIComponent(id)}/detail`);
    return {
      id: item.id,
      slug: `attraction-${item.id}`,
      name: item.nameEn || item.title || "Travel Company",
      logo: item.image || item.photoUrl || "image/city/petra-world-heritage-jordan_16x9.avif",
      heroImage: item.image || item.photoUrl || "image/city/petra-world-heritage-jordan_16x9.avif",
      gallery: item.images || [item.image || item.photoUrl || "image/city/petra-world-heritage-jordan_16x9.avif"],
      tagline: "Local experts. Authentic experiences.",
      description: item.descriptionEn || item.description || "Travel details coming soon.",
      longDescription: item.descriptionEn || item.description || "Travel details coming soon.",
      location: `${item.city || "Jordan"}, Jordan`,
      city: item.city || "Jordan",
      country: "Jordan",
      phone: "+962000000000",
      email: "info@travelmind.app",
      whatsapp: "+962000000000",
      foundedYear: 2015,
      isVerified: true,
      isLicensed: true,
      supportedLanguages: item.languages || ["English", "Arabic"],
      rating: Number(item.rating || 4.5),
      reviewsCount: Number(item.reviewCount || 20),
      badges: ["Licensed & Insured", "Best Price Guarantee", "Local Expert Guides", "24/7 Customer Support"],
      stats: {
        yearsExperience: "8+",
        happyTravelers: "1,000+",
        uniqueExperiences: "20+",
        professionalGuides: "8",
      },
      servicesOffered: ["Tours", "Packages", "Transport"],
      specialOffer: { discountPercentage: 10 },
      tours: (item.tours || []).map((tour) => ({
        ...tour,
        description: tour.summary || tour.description || "Local experience.",
        minGroupSize: 1,
        maxGroupSize: 10,
        languages: ["English", "Arabic"],
        rating: Number(tour.rating || 4.8),
        reviewsCount: Number(tour.reviewCount || 30),
        badge: tour.badge || "Popular",
      })),
      packages: (item.packages || []).map((pkg) => ({
        ...pkg,
        image: pkg.image || item.image || item.photoUrl,
        durationDays: Number(pkg.durationDays || 2),
        minGroupSize: 1,
        maxGroupSize: 8,
        hotelIncluded: true,
      })),
      transportServices: (item.transport || []).map((service) => ({
        id: service.id,
        title: service.provider || service.title || "Transport Service",
        description: service.description || "Transport support.",
        image: item.image || item.photoUrl,
        serviceType: "Transfer",
        price: Number(service.price || 0),
        currency: "USD",
        pickupLocation: item.city || "Jordan",
        dropOffLocation: "Flexible",
      })),
      reviews: (item.reviews || []).map((review, index) => ({
        id: review.id || index + 1,
        userName: review.user || "Traveler",
        country: "Traveler",
        rating: Number(review.rating || 5),
        comment: review.comment || review.text || "Great experience.",
        reviewImages: [],
        reviewDate: review.createdAt || "2026-05-01",
      })),
      seo: {
        metaTitle: `${item.nameEn || item.title || "Travel Company"} | TravelMind`,
        metaDescription: item.descriptionEn || item.description || "Travel company profile.",
      },
      latitude: Number(item.latitude) || null,
      longitude: Number(item.longitude) || null,
    };
  } catch (error) {
    return null;
  }
}

async function fetchCompanyBySlug(slug) {
  return api("GET", `/companies/${encodeURIComponent(slug)}`);
}

async function fetchCompanyById(id) {
  return api("GET", `/companies/id/${encodeURIComponent(id)}`);
}

async function loadCompany() {
  const slug = qParam("slug");
  const id = qParam("id");

  if (slug) {
    const bySlug = await fetchCompanyBySlug(slug);
    if (bySlug) return bySlug;
  }

  if (id) {
    const byId = await fetchCompanyById(id);
    if (byId) return byId;
    const legacy = await fetchLegacyAttraction(id);
    if (legacy) return legacy;
  }

  return await fetchCompanyBySlug("petra-adventures");
}

function bindGlobalActions() {
  document.querySelectorAll(".company-tabs [role='tab']").forEach((button) => {
    button.addEventListener("click", () => switchTab(button.getAttribute("aria-controls")));
  });

  dById("sort-select").addEventListener("change", (event) => {
    renderTours(companyDetailState.company, event.target.value);
    bindDetailActions();
  });

  dById("share-btn").addEventListener("click", () => {
    const url = encodeURIComponent(window.location.href);
    openServiceModal("share", {
      title: "Share Company Profile",
      image: companyDetailState.company.logo,
      description: "Choose how you want to share this company profile.",
      gallery: [companyDetailState.company.logo],
      price: 0,
      currency: "USD",
      itinerary: [
        `Copy link: ${window.location.href}`,
        `Facebook: https://www.facebook.com/sharer/sharer.php?u=${url}`,
        `WhatsApp: https://wa.me/?text=${url}`,
        `X / Twitter: https://twitter.com/intent/tweet?url=${url}`,
      ],
    });
  });

  const openPrimaryBooking = () => {
    const firstTour = companyDetailState.company.tours?.[0];
    if (firstTour) openBookingModal("tour", firstTour);
  };

  dById("book-now").addEventListener("click", openPrimaryBooking);
  dById("book-now-cta").addEventListener("click", openPrimaryBooking);
  dById("floating-book-btn").addEventListener("click", openPrimaryBooking);
  dById("inquire-btn").addEventListener("click", () => {
    openCompanyChatModal();
  });
  dById("chat-btn").addEventListener("click", () => {
    openCompanyChatModal();
  });
  dById("write-review-btn").addEventListener("click", () => {
    switchTab("tab-reviews");
    dById("add-review-form").scrollIntoView({ behavior: "smooth", block: "start" });
  });

  const phone = companyDetailState.company.phone || "+962000000000";
  dById("call-btn").addEventListener("click", () => {
    window.location.href = `tel:${phone}`;
  });
  dById("call-us").addEventListener("click", () => {
    window.location.href = `tel:${phone}`;
  });
  dById("whatsapp-us").addEventListener("click", () => {
    const raw = (companyDetailState.company.whatsapp || phone).replace(/[^\d+]/g, "");
    window.open(`https://wa.me/${raw.replace(/^\+/, "")}`, "_blank");
  });

  dById("fav-btn").addEventListener("click", () => {
    const button = dById("fav-btn");
    const current = button.getAttribute("aria-pressed") === "true";
    const next = !current;
    button.setAttribute("aria-pressed", next ? "true" : "false");

    const userId = window.currentUser?.id || 0;
    if (!userId) return;

    const headers = { "Content-Type": "application/json" };
    const token = localStorage.getItem("tm_token");
    if (token) headers.Authorization = `Bearer ${token}`;

    api("POST", `/companies/${encodeURIComponent(companyDetailState.company.id)}/favorite`, {
      favorite: next,
      userId,
    }).catch(() => {
      button.setAttribute("aria-pressed", current ? "true" : "false");
    });
  });

  dById("close-service-modal").addEventListener("click", () => closeModal("service-modal"));
  dById("close-booking-modal").addEventListener("click", () => closeModal("booking-modal"));
  dById("close-company-chat-modal").addEventListener("click", () => closeModal("company-chat-modal"));
  dById("cancel-booking").addEventListener("click", () => closeModal("booking-modal"));
  dById("company-chat-cancel").addEventListener("click", () => closeModal("company-chat-modal"));

  dById("service-modal").addEventListener("click", (event) => {
    if (event.target === dById("service-modal")) closeModal("service-modal");
  });
  dById("booking-modal").addEventListener("click", (event) => {
    if (event.target === dById("booking-modal")) closeModal("booking-modal");
  });
  dById("company-chat-modal").addEventListener("click", (event) => {
    if (event.target === dById("company-chat-modal")) closeModal("company-chat-modal");
  });

  dById("booking-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const error = validateBookingForm();
    const errorEl = dById("booking-error");

    if (error) {
      errorEl.hidden = false;
      errorEl.textContent = error;
      return;
    }

    errorEl.hidden = true;
    dById("confirm-booking").textContent = "Confirming...";
    dById("confirm-booking").disabled = true;
    try {
      const currentType = companyDetailState.currentBookingItem?.type || "";
      const currentItem = companyDetailState.currentBookingItem?.item || {};
      const travelersCount = Number(dById("booking-travelers").value);
      const contact = {
        name: dById("booking-name").value.trim(),
        phone: dById("booking-phone").value.trim(),
        email: dById("booking-email").value.trim(),
      };
      if (typeof saveBookingProfile === "function") saveBookingProfile(contact);
      dById("confirm-booking").textContent = "Confirm Booking";
      dById("confirm-booking").disabled = false;
      closeModal("booking-modal");
      startCheckoutFlow({
        sourceType: "company-service",
        companyId: companyDetailState.company.id,
        itemType: currentType || "experience",
        itemId: currentItem.id || null,
        itemTitle: currentItem.title || companyDetailState.company.name,
        serviceName: currentItem.title || currentType,
        serviceType: currentType || "experience",
        serviceId: currentItem.id || null,
        destination: companyDetailState.company.location || companyDetailState.company.city || "Jordan",
        image: currentItem.image || companyDetailState.company.heroImage,
        bookingDate: dById("booking-date").value,
        travelersCount,
        notes: dById("booking-requests").value.trim(),
        contact,
        priceBreakdown: {
          base: Number(currentItem.price || 0) * travelersCount,
          taxes: Math.round(Number(currentItem.price || 0) * travelersCount * 0.1 * 100) / 100,
          fees: 5,
          addOns: 0,
          total: Math.round((Number(currentItem.price || 0) * travelersCount * 1.1 + 5) * 100) / 100,
          currency: currentItem.currency || "USD",
        },
      });
    } catch (submitError) {
      dById("confirm-booking").textContent = "Confirm Booking";
      dById("confirm-booking").disabled = false;
      errorEl.hidden = false;
      errorEl.textContent = submitError.message || "Booking could not be completed. Please try again.";
    }
  });

  const addReviewForm = dById("add-review-form");
  if (addReviewForm) {
    addReviewForm.hidden = false;
    addReviewForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const rating = Number(dById("review-rating").value);
      const text = dById("review-text").value.trim();
      if (!text) return;
      const headers = { "Content-Type": "application/json" };
      const token = localStorage.getItem("tm_token");
      if (token) headers.Authorization = `Bearer ${token}`;

      try {
        const created = await api("POST", `/companies/${encodeURIComponent(companyDetailState.company.id)}/reviews`, {
          rating,
          text,
          userId: window.currentUser?.id || 1,
          userName: window.currentUser?.name || "You",
        });
        companyDetailState.company.reviews.unshift({
          id: created.id || Date.now(),
          userName: created.userName || window.currentUser?.name || "You",
          country: created.country || "Traveler",
          rating: Number(created.rating || rating),
          comment: created.comment || text,
          reviewImages: [],
          reviewDate: created.reviewDate || created.createdAt || new Date().toISOString().slice(0, 10),
        });
        companyDetailState.company.reviewsCount += 1;
        renderReviews();
        addReviewForm.reset();
      } catch (_error) {
        companyDetailState.company.reviews.unshift({
          id: Date.now(),
          userName: window.currentUser?.name || "You",
          country: "Traveler",
          rating,
          comment: text,
          reviewImages: [],
          reviewDate: new Date().toISOString().slice(0, 10),
        });
        companyDetailState.company.reviewsCount += 1;
        renderReviews();
        addReviewForm.reset();
      }
    });
  }

  dById("company-chat-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const input = dById("company-chat-input");
    const message = input.value.trim();
    if (!message) return;
    const senderName = window.currentUser?.name || "Traveler";
    try {
      await CompanyChatAPI.create({
        companyId: companyDetailState.company.id,
        userId: window.currentUser?.id || null,
        senderName,
        message,
        direction: "traveler_to_company",
      });
      input.value = "";
      await loadCompanyChat();
    } catch (_error) {
      companyDetailState.companyChatMessages.push({
        senderName,
        message,
        direction: "traveler_to_company",
        createdAt: new Date().toISOString(),
      });
      input.value = "";
      dById("company-chat-thread").innerHTML = companyDetailState.companyChatMessages.map(companyChatBubble).join("");
    }
  });
}

async function initCompanyDetail() {
  try {
    const company = await loadCompany();
    fillCompanyProfile(company);
    bindDetailActions();
    bindGlobalActions();
    refreshCompanyFavoriteState();
    if (qParam("chat") === "1") {
      await openCompanyChatModal();
    }
  } catch (error) {
    dById("company-title").textContent = "Failed to load company";
    dById("company-description").textContent = error.message || "Please try again later.";
    dById("overview-text").textContent = "Company data could not be loaded from the backend.";
  }
}

document.addEventListener("DOMContentLoaded", initCompanyDetail);
