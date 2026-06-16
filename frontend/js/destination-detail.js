const DESTINATION_STORAGE_KEY = "tm_destination_favorites_v1";
const DESTINATION_CENTER = [31.24, 36.51];

const destinationConfigs = {
  petra: {
    city: "Petra",
    title: "Petra",
    subtitle: "The Rose-Red City carved into sandstone cliffs.",
    description:
      "Petra blends world-famous archaeology, desert landscapes, dramatic viewpoints, and atmospheric evenings into one of Jordan's most memorable travel experiences.",
    heroImages: [
      "image/city/petra-world-heritage-jordan_16x9.avif",
      "image/—Pngtree—ad deir aka the monastery_15507046.png",
      "image/وادي رم 2.jpg",
    ],
    bestTime: "March to May",
    recommendedDuration: "2 to 3 days",
    weather: "Warm days, cool evenings",
    openingHours: "6:00 AM - 6:00 PM",
    ticketPrice: "From 50 JOD",
    virtualLabel: "Walk the Siq, the Treasury, and sunset viewpoints before you arrive.",
    virtualExperiences: [
      {
        title: "360° Tour",
        description: "Open Petra's 360° YouTube experience before you book.",
        image: "image/city/petra-world-heritage-jordan_16x9.avif",
        href: "https://youtu.be/z3zoJNF0EpI",
      },
      {
        title: "Travel Video",
        description: "See how travelers spend a full day exploring Petra.",
        image: "image/â€”Pngtreeâ€”ad deir aka the monastery_15507046.png",
      },
      {
        title: "Panoramic View",
        description: "Open wide-angle views for Petra's key viewpoints.",
        image: "image/ÙˆØ§Ø¯ÙŠ Ø±Ù… 2.jpg",
      },
    ],
  },
  amman: {
    city: "Amman",
    title: "Amman",
    subtitle: "Jordan's energetic capital where heritage meets café culture.",
    description:
      "Amman is ideal for travelers who want Roman ruins, creative neighborhoods, food discoveries, and easy access to day trips across central Jordan.",
    heroImages: [
      "image/city/New_Abdali_2024.png",
      "image/سد الملك طلال.jpg",
      "image/المسرح الجنوبي جرش.JPG",
    ],
    bestTime: "April to June",
    recommendedDuration: "2 days",
    weather: "Mild with sunny afternoons",
    openingHours: "Most landmarks: 8:00 AM - 6:00 PM",
    ticketPrice: "Many sites from 2 JOD",
    virtualLabel: "Preview downtown hills, rooftop views, and heritage landmarks.",
  },
  "wadi-rum": {
    city: "Wadi Rum",
    title: "Wadi Rum",
    subtitle: "A cinematic desert of canyons, red dunes, and stargazing camps.",
    description:
      "Wadi Rum is built for adventure travelers looking for jeep safaris, Bedouin hospitality, and wide-open desert landscapes that feel surreal in every direction.",
    heroImages: [
      "image/city/wadi-rum-bedouin-camp-travel.webp",
      "image/وادي رم.jpg",
      "image/وادي رم 2.jpg",
    ],
    bestTime: "October to April",
    recommendedDuration: "1 to 2 days",
    weather: "Hot sun, cool nights",
    openingHours: "Always open",
    ticketPrice: "From 5 JOD",
    virtualLabel: "See camp life, canyon tracks, and night-sky panoramas.",
  },
  aqaba: {
    city: "Aqaba",
    title: "Aqaba",
    subtitle: "Jordan's Red Sea escape for diving, cruises, and seaside stays.",
    description:
      "Aqaba is the destination for beach time, marine experiences, and resort-style travel with a warmer climate through much of the year.",
    heroImages: [
      "image/city/Aqaba_Red_Sea_Jordan_Canva-1.webp",
      "image/البحر الميت.jpg",
      "image/Event/petra-by-night.jpg",
    ],
    bestTime: "October to May",
    recommendedDuration: "2 to 4 days",
    weather: "Sunny and coastal",
    openingHours: "Varies by beach club and marina",
    ticketPrice: "Experiences from 15 JOD",
    virtualLabel: "Preview sea views, snorkeling spots, and waterfront dining.",
  },
  "dead-sea": {
    city: "Dead Sea",
    title: "Dead Sea",
    subtitle: "A restorative shoreline famous for floating, spa retreats, and sunsets.",
    description:
      "The Dead Sea is perfect for wellness-focused trips, resort escapes, and easy scenic downtime between busier Jordan adventures.",
    heroImages: [
      "image/city/deadsea.jpg",
      "image/البحر الميت.jpg",
      "image/images.jpg",
    ],
    bestTime: "September to May",
    recommendedDuration: "1 to 2 days",
    weather: "Warm and dry",
    openingHours: "Resorts open daily",
    ticketPrice: "Beach access from 20 JOD",
    virtualLabel: "Preview salt shores, spa terraces, and sunset panoramas.",
  },
  jerash: {
    city: "Jerash",
    title: "Jerash",
    subtitle: "A grand Roman city of colonnades, arches, and ancient plazas.",
    description:
      "Jerash is one of the best-preserved Roman archaeological sites in the region and works beautifully as either a day trip or a deeper cultural stop.",
    heroImages: [
      "image/city/sites-jerash.jpg",
      "image/المسرح الجنوبي جرش.JPG",
      "image/Event/مهرجان جرش.jpg",
    ],
    bestTime: "March to May",
    recommendedDuration: "1 day",
    weather: "Pleasant with occasional breeze",
    openingHours: "8:00 AM - 6:00 PM",
    ticketPrice: "From 12 JOD",
    virtualLabel: "Preview Roman streets, amphitheaters, and festival venues.",
  },
};

const destinationState = {
  config: null,
  attractions: [],
  hotels: [],
  restaurants: [],
  companies: [],
  tours: [],
  transport: [],
  reviews: [],
  stories: [],
  map: null,
  markers: [],
  selectedMarker: null,
  filters: {
    attractions: true,
    hotels: true,
    companies: true,
    tours: true,
    restaurants: true,
    transport: true,
  },
};

function ddById(id) {
  return document.getElementById(id);
}

function ddEsc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function readDestinationJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (_error) {
    return fallback;
  }
}

function writeDestinationJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function getSlug() {
  const params = new URLSearchParams(window.location.search);
  const city = params.get("city");
  const slug = params.get("slug");
  const source = slug || city || "petra";
  return String(source)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");
}

function getDestinationConfig() {
  const slug = getSlug();
  return destinationConfigs[slug] || destinationConfigs.petra;
}

function placeImage(item, fallback) {
  return item.image || item.imageUrl || item.photoUrl || item.photo_url || fallback;
}

function priceLabel(value, suffix = "") {
  const amount = Number(value || 0);
  return amount > 0 ? `${Math.round(amount)} JOD${suffix}` : `Custom${suffix}`;
}

function buildWeatherLabel(city) {
  const month = new Date().getMonth();
  const warm = month >= 3 && month <= 9;
  if (String(city).toLowerCase().includes("wadi")) return warm ? "31°C, dry desert breeze" : "22°C, crisp desert evening";
  if (String(city).toLowerCase().includes("aqaba")) return warm ? "29°C, sea breeze" : "23°C, sunny coast";
  return warm ? "26°C, clear skies" : "18°C, mild and sunny";
}

async function loadDestinationData() {
  const config = getDestinationConfig();
  destinationState.config = config;

  const [attractions, hotels, restaurants, companies, tours, transport] = await Promise.all([
    AttractionsAPI.getAll().catch(() => []),
    HotelsAPI.getAll().catch(() => []),
    RestaurantsAPI.getAll().catch(() => []),
    CompaniesAPI.getAll().catch(() => []),
    ToursAPI.getAll().catch(() => []),
    TransportAPI.getAll().catch(() => []),
  ]);

  const cityMatch = (value) =>
    String(value || "").trim().toLowerCase() === String(config.city || "").trim().toLowerCase();

  destinationState.attractions = (attractions || []).filter((item) => cityMatch(item.city));
  destinationState.hotels = (hotels || []).filter((item) => cityMatch(item.city));
  destinationState.restaurants = (restaurants || []).filter((item) => cityMatch(item.city));
  destinationState.companies = (companies || []).filter((item) => cityMatch(item.city));
  destinationState.tours = (tours || []).filter((item) => {
    const location = String(item.location || item.title || "").toLowerCase();
    return location.includes(config.city.toLowerCase());
  });
  destinationState.transport = (transport || []).filter((item) => {
    const text = `${item.title || ""} ${item.provider || ""} ${item.pickupLocation || ""} ${item.dropOffLocation || ""}`.toLowerCase();
    return text.includes(config.city.toLowerCase());
  });

  destinationState.reviews = await buildDestinationReviews();
  destinationState.stories = await loadDestinationStories(config);
}

async function loadDestinationStories(config) {
  try {
    const stories = await TravelerStoriesAPI.getAll({ destination: config.city });
    if (Array.isArray(stories) && stories.length) return stories;
  } catch (_error) {
    // fall back below
  }
  return typeof findStoriesByDestination === "function"
    ? findStoriesByDestination(config.destinationSlug || getSlug())
    : [];
}

async function buildDestinationReviews() {
  const attractionReviews = await Promise.all(
    destinationState.attractions.slice(0, 4).map(async (item) => {
      try {
        const reviews = typeof loadPlaceReviews === "function" ? await loadPlaceReviews("attraction", item.id) : [];
        return reviews.map((review) => ({
          userName: review.userName || "Traveler",
          country: review.userCountry || "Jordan",
          rating: Number(review.rating || item.rating || 4.8),
          comment: review.comment || `Loved the experience at ${item.nameEn || item.title}.`,
          photos: review.photos || [placeImage(item, destinationState.config.heroImages[0])],
        }));
      } catch (_error) {
        return [];
      }
    })
  );

  const flattened = attractionReviews.flat().slice(0, 6);
  if (flattened.length) return flattened;

  return destinationState.attractions.slice(0, 3).map((item, index) => ({
    userName: ["Mia Roberts", "Yusuf Ali", "Nadia Chen"][index] || "Traveler",
    country: ["United Kingdom", "Jordan", "Singapore"][index] || "Jordan",
    rating: Number(item.rating || 4.7),
    comment: `A memorable stop in ${destinationState.config.title} with strong atmosphere, smooth logistics, and plenty to fill a full travel day.`,
    photos: [placeImage(item, destinationState.config.heroImages[0])],
  }));
}

function renderHero() {
  const config = destinationState.config;
  ddById("destination-name").textContent = config.title;
  ddById("destination-subtitle").textContent = config.subtitle;
  ddById("destination-description").textContent = config.description;

  const ratings = destinationState.attractions.map((item) => Number(item.rating || 0)).filter(Boolean);
  const average = ratings.length ? ratings.reduce((sum, value) => sum + value, 0) / ratings.length : 4.8;
  const reviewCount = destinationState.reviews.length || 120;

  ddById("destination-rating").textContent = `${average.toFixed(1)} average rating`;
  ddById("destination-reviews").textContent = `${reviewCount} traveler reviews`;

  ddById("destination-gallery").innerHTML = `
    <img class="destination-gallery-main" src="${ddEsc(config.heroImages[0])}" alt="${ddEsc(config.title)} hero image" />
    <div class="destination-gallery-stack">
      <img src="${ddEsc(config.heroImages[1] || config.heroImages[0])}" alt="${ddEsc(config.title)} gallery image" />
      <img src="${ddEsc(config.heroImages[2] || config.heroImages[0])}" alt="${ddEsc(config.title)} gallery image" />
    </div>
  `;
}

function renderQuickInfo() {
  const config = destinationState.config;
  const cards = [
    ["Opening Hours", config.openingHours],
    ["Ticket Price", config.ticketPrice],
    ["Best Time to Visit", config.bestTime],
    ["Recommended Duration", config.recommendedDuration],
    ["Current Weather", buildWeatherLabel(config.city)],
  ];
  ddById("quick-info-grid").innerHTML = cards
    .map(
      ([label, value]) => `
        <article class="quick-info-card">
          <span>${ddEsc(label)}</span>
          <strong>${ddEsc(value)}</strong>
        </article>`
    )
    .join("");
}

function activityCard(item) {
  return `
    <article class="destination-card">
      <img src="${ddEsc(placeImage(item, destinationState.config.heroImages[0]))}" alt="${ddEsc(item.title || item.nameEn)}" />
      <div class="destination-card-body">
        <div class="destination-card-topline">
          <h3>${ddEsc(item.title || item.nameEn || "Activity")}</h3>
          <span class="destination-chip">${ddEsc(item.duration || "Flexible")}</span>
        </div>
        <p>${ddEsc(item.summary || item.description || item.descriptionEn || "Explore one of the destination highlights.")}</p>
        <div class="destination-card-meta">
          <span>${Number(item.rating || 4.7).toFixed(1)} rating</span>
          <span>${Number(item.reviewCount || item.reviewsCount || 40)} reviews</span>
        </div>
        <div class="destination-card-meta">
          <strong>${ddEsc(priceLabel(item.price || item.entryFee || 25))}</strong>
          <button class="btn btn-primary btn-sm" type="button" data-book-activity="${ddEsc(item.title || item.nameEn || "activity")}">Book Now</button>
        </div>
      </div>
    </article>
  `;
}

function hotelCard(item) {
  return `
    <article class="destination-card">
      <img src="${ddEsc(placeImage(item, destinationState.config.heroImages[0]))}" alt="${ddEsc(item.nameEn)}" />
      <div class="destination-card-body">
        <div class="destination-card-topline">
          <h3>${ddEsc(item.nameEn || "Hotel")}</h3>
          <span>${Number(item.rating || 4.6).toFixed(1)} rating</span>
        </div>
        <p>${ddEsc(item.descriptionEn || "Comfortable stay close to the destination highlights.")}</p>
        <div class="destination-card-meta">
          <strong>${ddEsc(priceLabel(item.pricePerNight, "/night"))}</strong>
          <a class="btn btn-outline btn-sm" href="hotels.html?id=${ddEsc(item.id)}">View Hotel</a>
        </div>
      </div>
    </article>
  `;
}

function companyCard(item) {
  return `
    <article class="destination-card">
      <img src="${ddEsc(placeImage(item, destinationState.config.heroImages[0]))}" alt="${ddEsc(item.name)}" />
      <div class="destination-card-body">
        <div class="destination-card-topline">
          <h3>${ddEsc(item.name)}</h3>
          <span>${Number(item.rating || 4.7).toFixed(1)} rating</span>
        </div>
        <p>${ddEsc(item.tagline || item.description || "Trusted local operator.")}</p>
        <div class="destination-card-meta">
          <span>${Number((item.tours || []).length || 0)} tours</span>
          <a class="btn btn-outline btn-sm" href="company-detail.html?slug=${ddEsc(item.slug)}">Explore Company</a>
        </div>
      </div>
    </article>
  `;
}

function renderMainSections() {
  const activityItems = destinationState.tours.length
    ? destinationState.tours.slice(0, 6)
    : destinationState.attractions.slice(0, 6).map((item) => ({
        title: item.nameEn,
        summary: item.descriptionEn,
        duration: "Half day",
        rating: item.rating,
        reviewCount: 32,
        price: item.entryFee || 20,
        image: placeImage(item, destinationState.config.heroImages[0]),
      }));

  ddById("activities-grid").innerHTML = activityItems.map(activityCard).join("");
  ddById("hotels-grid").innerHTML = destinationState.hotels.slice(0, 4).map(hotelCard).join("") || `<p>No nearby hotels available right now.</p>`;
  ddById("companies-grid").innerHTML = destinationState.companies.slice(0, 4).map(companyCard).join("") || `<p>No companies available right now.</p>`;
}

function buildSuggestedItineraries() {
  const destination = destinationState.config.title;
  const topAttractions = destinationState.attractions.slice(0, 5).map((item) => item.nameEn || item.title);
  return [
    {
      title: `1 Day in ${destination}`,
      cost: "From 95 JOD",
      items: [
        `Morning: ${topAttractions[0] || `Explore ${destination}`}`,
        `Afternoon: guided highlight tour and lunch stop`,
        `Evening: scenic dinner and city walk`,
      ],
    },
    {
      title: `2 Days in ${destination}`,
      cost: "From 190 JOD",
      items: [
        `Day 1: core landmarks, local food, sunset viewpoint`,
        `Day 2: extra activity, slower pace, hotel leisure`,
        `Includes top attractions and one premium experience`,
      ],
    },
    {
      title: `3 Days in ${destination}`,
      cost: "From 320 JOD",
      items: [
        `Day 1: destination essentials`,
        `Day 2: immersive tour and local company experience`,
        `Day 3: flexible add-ons, restaurants, and shopping`,
      ],
    },
  ];
}

function renderSuggestedItineraries() {
  ddById("suggested-itinerary-grid").innerHTML = buildSuggestedItineraries()
    .map(
      (item, index) => `
        <article class="suggested-itinerary-card">
          <div class="destination-card-topline">
            <h3>${ddEsc(item.title)}</h3>
            <span class="destination-chip">${ddEsc(item.cost)}</span>
          </div>
          <ul class="suggested-itinerary-list">
            ${item.items.map((entry) => `<li>${ddEsc(entry)}</li>`).join("")}
          </ul>
          <button class="btn btn-outline btn-sm" type="button" data-view-itinerary="${index + 1}">View Itinerary</button>
        </article>`
    )
    .join("");
}

function normalizeDestinationStory(story) {
  return {
    id: story.id,
    title: story.title || "Traveler Story",
    userName: story.userName || story.user?.name || "Traveler",
    destination: story.destination || destinationState.config.title,
    storyText: story.storyText || story.description || "",
    description: story.description || story.storyText || "",
    sponsorCompanyName: story.sponsorCompanyName || "",
    viewsCount: Number(story.viewsCount || 0),
    videoUrl: story.videoUrl || "",
    thumbnailUrl: story.thumbnailUrl || story.coverImage || destinationState.config.heroImages[0],
    createdAt: story.createdAt || new Date().toISOString(),
    destinationSlug: story.destinationSlug || getSlug(),
  };
}

function renderDestinationStories() {
  const grid = ddById("destination-stories-grid");
  const viewAll = ddById("view-all-stories-btn");
  if (!grid || !viewAll) return;

  viewAll.href = `stories.html?destination=${encodeURIComponent(getSlug())}`;
  const stories = (destinationState.stories || []).map(normalizeDestinationStory).slice(0, 3);
  if (!stories.length) {
    grid.innerHTML = `
      <article class="destination-story-empty">
        <h3>No traveler stories yet</h3>
        <p>Be the first traveler to publish a short story from ${ddEsc(destinationState.config.title)}.</p>
      </article>
    `;
    return;
  }

  grid.innerHTML = stories.map((story) => `
    <article class="destination-story-card" data-open-destination-story="${story.id}">
      <img src="${ddEsc(story.thumbnailUrl)}" alt="${ddEsc(story.title)}" />
      <div class="destination-story-card-body">
        <span class="destination-chip">Traveler Story</span>
        <h3>${ddEsc(story.title)}</h3>
        <p>${ddEsc(story.userName)} • ${ddEsc(new Date(story.createdAt).toLocaleDateString())}</p>
      </div>
    </article>
  `).join("");

  grid.querySelectorAll("[data-open-destination-story]").forEach((card) => {
    card.addEventListener("click", () => openDestinationStory(card.getAttribute("data-open-destination-story")));
  });
}

async function openDestinationStory(storyId) {
  const story = (destinationState.stories || []).map(normalizeDestinationStory).find((item) => String(item.id) === String(storyId));
  if (!story) return;

  ddById("destination-story-modal-body").innerHTML = `
    <div class="story-viewer-layout">
      <div class="story-viewer-video-shell">
        <video class="story-viewer-video" controls playsinline preload="metadata" poster="${ddEsc(story.thumbnailUrl)}">
          <source src="${ddEsc(story.videoUrl)}" />
        </video>
      </div>
      <div class="story-viewer-copy">
        <span class="destination-kicker">${ddEsc(story.destination)}</span>
        <h2>${ddEsc(story.title)}</h2>
        <div class="story-viewer-meta">
          <span>${ddEsc(story.userName)}</span>
          <span>${ddEsc(new Date(story.createdAt).toLocaleDateString())}</span>
        </div>
        <p>${ddEsc(story.storyText || story.description)}</p>
        ${story.sponsorCompanyName ? `<div class="story-viewer-info"><span>Sponsor</span><strong>${ddEsc(story.sponsorCompanyName)}</strong></div>` : ""}
        <div class="story-viewer-info"><span>Views</span><strong id="destination-story-views">${ddEsc(String(story.viewsCount))}</strong></div>
        <a class="btn btn-outline" href="stories.html?story=${encodeURIComponent(story.id)}">Open on Stories Page</a>
      </div>
    </div>
  `;
  ddById("destination-story-modal").hidden = false;

  try {
    const response = await TravelerStoriesAPI.incrementView(story.id);
    const count = ddById("destination-story-views");
    if (count) count.textContent = String(response?.viewsCount || story.viewsCount + 1);
  } catch (_error) {
    // non-blocking
  }
}

function closeDestinationStory() {
  const modal = ddById("destination-story-modal");
  if (modal) modal.hidden = true;
}

function toYouTubeEmbedUrl(url) {
  const value = String(url || "").trim();
  const shortMatch = value.match(/youtu\.be\/([^?&]+)/i);
  if (shortMatch) return `https://www.youtube.com/embed/${shortMatch[1]}?autoplay=1&rel=0&start=5`;

  const longMatch = value.match(/[?&]v=([^?&]+)/i);
  if (longMatch) return `https://www.youtube.com/embed/${longMatch[1]}?autoplay=1&rel=0&start=5`;

  return value;
}

function openDefaultDestinationVideo() {
  const experiences = destinationState.config?.virtualExperiences || [];
  const firstVideo = experiences.find((item) => item.href);
  if (!firstVideo) return;
  openDestinationVideo(firstVideo.href);
}

function openDestinationVideo(url) {
  const modal = ddById("destination-video-modal");
  const frame = ddById("destination-video-frame");
  if (!modal || !frame || !url) return;

  frame.src = toYouTubeEmbedUrl(url);
  modal.hidden = false;
}

function closeDestinationVideo() {
  const modal = ddById("destination-video-modal");
  const frame = ddById("destination-video-frame");
  if (frame) frame.src = "";
  if (modal) modal.hidden = true;
}

function renderReviews() {
  ddById("destination-reviews-grid").innerHTML = destinationState.reviews
    .map(
      (review) => `
        <article class="review-card-lite">
          <div class="review-card-lite-head">
            <div class="review-author-lite">
              <strong>${ddEsc(review.userName)}</strong>
              <span>${ddEsc(review.country)}</span>
            </div>
            <strong>${Number(review.rating || 4.8).toFixed(1)}</strong>
          </div>
          <p>${ddEsc(review.comment)}</p>
          <div class="review-photos-lite">
            ${(review.photos || []).slice(0, 2).map((photo) => `<img src="${ddEsc(photo)}" alt="${ddEsc(review.userName)} review photo" />`).join("")}
          </div>
        </article>`
    )
    .join("");
}

function renderImmersive() {
  const config = destinationState.config;
  const cards = [
    ["360° Tour", config.virtualLabel, config.heroImages[0]],
    ["Travel Video", `See how travelers spend a full day in ${config.title}.`, config.heroImages[1] || config.heroImages[0]],
    ["Panoramic View", `Open wide-angle views for key viewpoints around ${config.title}.`, config.heroImages[2] || config.heroImages[0]],
  ];

  ddById("immersive-grid").innerHTML = cards
    .map(
      ([title, description, image]) => `
        <article class="immersive-card">
          <div class="immersive-card-media"><img src="${ddEsc(image)}" alt="${ddEsc(title)}" /></div>
          <h3>${ddEsc(title)}</h3>
          <p>${ddEsc(description)}</p>
          <button class="btn btn-outline btn-sm" type="button" onclick="showToast('Virtual preview ready for ${ddEsc(title)}.', 'info')">Open Experience</button>
        </article>`
    )
    .join("");
}

function renderImmersive() {
  const config = destinationState.config;
  const cards =
    config.virtualExperiences || [
      {
        title: "360° Tour",
        description: config.virtualLabel,
        image: config.heroImages[0],
      },
      {
        title: "Travel Video",
        description: `See how travelers spend a full day in ${config.title}.`,
        image: config.heroImages[1] || config.heroImages[0],
      },
      {
        title: "Panoramic View",
        description: `Open wide-angle views for key viewpoints around ${config.title}.`,
        image: config.heroImages[2] || config.heroImages[0],
      },
    ];

  ddById("immersive-grid").innerHTML = cards
    .map(
      (card) => `
        <article class="immersive-card">
          <div class="immersive-card-media"><img src="${ddEsc(card.image)}" alt="${ddEsc(card.title)}" /></div>
          <h3>${ddEsc(card.title)}</h3>
          <p>${ddEsc(card.description)}</p>
          ${
            card.href
              ? `<button class="btn btn-outline btn-sm" type="button" data-video-url="${ddEsc(card.href)}">Open Experience</button>`
              : `<button class="btn btn-outline btn-sm" type="button" onclick="showToast('Virtual preview coming soon for ${ddEsc(card.title)}.', 'info')">Open Experience</button>`
          }
        </article>`
    )
    .join("");
}

function createMarker(item, type) {
  const latitude = Number(item.latitude || item.lat);
  const longitude = Number(item.longitude || item.lng);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

  const label = type === "hotels" ? priceLabel(item.pricePerNight, "/n") : Number(item.rating || 4.7).toFixed(1);
  const marker = L.marker([latitude, longitude], {
    icon: L.divIcon({
      className: "",
      html: `<div class="destination-marker">${ddEsc(type.slice(0, -1))}: ${ddEsc(label)}</div>`,
      iconSize: [110, 34],
      iconAnchor: [55, 34],
      popupAnchor: [0, -30],
    }),
  });

  marker.destinationMeta = {
    type,
    title: item.title || item.name || item.nameEn || item.provider || "Location",
    rating: Number(item.rating || 4.7),
    image: placeImage(item, destinationState.config.heroImages[0]),
    actionHref:
      type === "companies"
        ? `company-detail.html?slug=${item.slug}`
        : type === "hotels"
          ? `hotels.html?id=${item.id}`
          : type === "restaurants"
            ? `restaurants.html?id=${item.id}`
            : `attractions.html?city=${encodeURIComponent(destinationState.config.city)}`,
    latitude,
    longitude,
  };

  marker.bindPopup(
    `<strong>${ddEsc(marker.destinationMeta.title)}</strong><br />${ddEsc(type.replace("-", " "))}<br /><button class="btn btn-outline btn-sm" type="button" onclick="window.open('https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}', '_blank')">Directions</button>`
  );
  marker.on("click", () => updateMapPreview(marker.destinationMeta));
  return marker;
}

function getMapCollections() {
  return {
    attractions: destinationState.attractions,
    hotels: destinationState.hotels,
    companies: destinationState.companies,
    tours: destinationState.tours,
    restaurants: destinationState.restaurants,
    transport: destinationState.transport,
  };
}

function renderMapFilters() {
  ddById("map-filter-bar").innerHTML = Object.keys(destinationState.filters)
    .map(
      (key) => `
        <button class="map-filter-btn ${destinationState.filters[key] ? "active" : ""}" type="button" data-map-filter="${key}">
          ${ddEsc(key.replace(/(^\w|-\w)/g, (match) => match.replace("-", "").toUpperCase()))}
        </button>`
    )
    .join("");

  document.querySelectorAll("[data-map-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      const key = button.getAttribute("data-map-filter");
      destinationState.filters[key] = !destinationState.filters[key];
      renderMapFilters();
      renderDestinationMap();
    });
  });
}

function updateMapPreview(meta) {
  destinationState.selectedMarker = meta;
  ddById("map-preview-card").innerHTML = `
    <img src="${ddEsc(meta.image)}" alt="${ddEsc(meta.title)}" />
    <strong>${ddEsc(meta.title)}</strong>
    <div class="map-preview-row"><span>Rating</span><span>${meta.rating.toFixed(1)}</span></div>
    <div class="map-preview-row"><span>Type</span><span>${ddEsc(meta.type)}</span></div>
    <div class="destination-meta-row">
      <a class="btn btn-primary btn-sm" href="${ddEsc(meta.actionHref)}">Quick action</a>
      <button class="btn btn-outline btn-sm" type="button" onclick="window.open('https://www.google.com/maps/dir/?api=1&destination=${meta.latitude},${meta.longitude}', '_blank')">Directions</button>
    </div>
  `;
}

function initMap() {
  destinationState.map = L.map("destination-map").setView(DESTINATION_CENTER, 7);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors",
  }).addTo(destinationState.map);
}

function renderDestinationMap() {
  destinationState.markers.forEach((marker) => marker.remove());
  destinationState.markers = [];

  const bounds = [];
  const collections = getMapCollections();
  Object.entries(collections).forEach(([type, items]) => {
    if (!destinationState.filters[type]) return;
    items.forEach((item) => {
      const marker = createMarker(item, type);
      if (!marker) return;
      marker.addTo(destinationState.map);
      destinationState.markers.push(marker);
      bounds.push([marker.destinationMeta.latitude, marker.destinationMeta.longitude]);
    });
  });

  if (bounds.length) {
    destinationState.map.fitBounds(bounds, { padding: [30, 30] });
  }
}

function destinationFavorites() {
  return readDestinationJson(DESTINATION_STORAGE_KEY, []);
}

function toggleDestinationFavorite() {
  const key = destinationState.config.city;
  const favorites = destinationFavorites();
  const exists = favorites.includes(key);
  const next = exists ? favorites.filter((item) => item !== key) : [...favorites, key];
  writeDestinationJson(DESTINATION_STORAGE_KEY, next);
  syncFavoriteButton();
  showToast(exists ? "Destination removed from favorites." : "Destination added to favorites.", exists ? "info" : "success");
}

function syncFavoriteButton() {
  const exists = destinationFavorites().includes(destinationState.config.city);
  ddById("favorite-destination-btn").textContent = exists ? "Favorited" : "Favorite";
}

function bindEvents() {
  ddById("favorite-destination-btn").addEventListener("click", toggleDestinationFavorite);
  ddById("share-destination-btn").addEventListener("click", async () => {
    const url = `${window.location.origin}${window.location.pathname}?slug=${getSlug()}`;
    try {
      await navigator.clipboard.writeText(url);
      showToast("Destination link copied.", "success");
    } catch (_error) {
      showToast("Could not copy the link right now.", "error");
    }
  });
  ddById("sticky-book-btn").addEventListener("click", () => {
    const target = destinationState.tours[0] || destinationState.attractions[0];
    if (!target) return;
    showToast(`Booking flow ready for ${target.title || target.nameEn}.`, "success");
  });
  ddById("sticky-hotel-btn").addEventListener("click", () => {
    const hotel = destinationState.hotels[0];
    if (hotel) location.href = `hotels.html?id=${hotel.id}`;
  });
  ddById("sticky-plan-btn").addEventListener("click", () => {
    location.href = `trip-planner.html?destination=${encodeURIComponent(destinationState.config.city)}&days=3&budget=450&travelers=2&interests=history,nature`;
  });

  document.querySelectorAll("[data-assistant-action]").forEach((button) => {
    button.addEventListener("click", () => {
      const action = button.getAttribute("data-assistant-action");
      if (action === "itinerary") {
        location.href = `trip-planner.html?destination=${encodeURIComponent(destinationState.config.city)}&days=3&budget=450&travelers=2&interests=history,culture`;
        return;
      }
      if (action === "tours") {
        ddById("activities-grid").scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
      if (action === "hotels") {
        ddById("hotels-grid").scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
      ddById("activities-grid").scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  ddById("immersive-grid")?.addEventListener("click", (event) => {
    const trigger = event.target.closest("[data-video-url]");
    if (!trigger) return;
    openDestinationVideo(trigger.getAttribute("data-video-url"));
  });

  ddById("close-destination-story-modal")?.addEventListener("click", closeDestinationStory);
  ddById("destination-story-modal")?.addEventListener("click", (event) => {
    if (event.target === ddById("destination-story-modal")) closeDestinationStory();
  });
  ddById("close-destination-video-modal")?.addEventListener("click", closeDestinationVideo);
  ddById("destination-video-modal")?.addEventListener("click", (event) => {
    if (event.target === ddById("destination-video-modal")) closeDestinationVideo();
  });
}

async function initDestinationDetail() {
  await loadDestinationData();
  renderHero();
  renderQuickInfo();
  renderMainSections();
  renderSuggestedItineraries();
  renderDestinationStories();
  renderReviews();
  renderImmersive();
  bindEvents();
  syncFavoriteButton();
  openDefaultDestinationVideo();
}

document.addEventListener("DOMContentLoaded", initDestinationDetail);
