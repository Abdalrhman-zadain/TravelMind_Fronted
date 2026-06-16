const tourDetailState = {
  company: null,
  tour: null,
};

function tdById(id) {
  return document.getElementById(id);
}

function tdEsc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getTourParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

async function loadTourDetail() {
  const companySlug = getTourParam("company");
  const tourId = Number(getTourParam("tour") || 0);
  if (!companySlug || !tourId) throw new Error("Missing tour detail parameters.");

  const company = await CompaniesAPI.getBySlug(companySlug);
  const tour = (company.tours || []).find((item) => Number(item.id) === tourId);
  if (!tour) throw new Error("Tour not found.");

  tourDetailState.company = company;
  tourDetailState.tour = tour;
}

function renderTourDetail() {
  const { company, tour } = tourDetailState;
  tdById("tour-title").textContent = tour.title;
  tdById("tour-summary").textContent = tour.description || tour.summary || "Guided experience details.";
  tdById("tour-image").src = tour.image || company.heroImage || company.logo;
  tdById("tour-image").alt = tour.title;
  tdById("tour-company-link").href = `company-detail.html?slug=${encodeURIComponent(company.slug)}`;
  tdById("tour-meta").innerHTML = [
    tour.duration || "Flexible duration",
    `${Number(tour.rating || 4.8).toFixed(1)} rating`,
    `${tour.location || company.city || "Jordan"}`,
    `From ${Number(tour.price || 0) > 0 ? `$${tour.price}` : "Custom"}`
  ].map((item) => `<span>${tdEsc(item)}</span>`).join("");
  tdById("tour-included").innerHTML = (tour.includedServices || ["Professional guide", "Flexible planning support", "Local recommendations"]).map((item) => `<li>${tdEsc(item)}</li>`).join("");
  tdById("tour-itinerary").innerHTML = (tour.itinerary || ["Meet your guide", "Explore the main highlights", "Wrap up with practical local tips"]).map((item) => `<li>${tdEsc(item)}</li>`).join("");
  tdById("tour-booking-snapshot").innerHTML = `
    <p><strong>Provider:</strong> ${tdEsc(company.name)}</p>
    <p><strong>Travelers:</strong> ${tdEsc(`${tour.minGroupSize || 1} - ${tour.maxGroupSize || 12}`)}</p>
    <p><strong>Languages:</strong> ${tdEsc((tour.languages || company.supportedLanguages || []).join(", ") || "English, Arabic")}</p>
    <p><strong>Cancellation:</strong> ${tdEsc(tour.cancellationPolicy || "Flexible cancellation terms vary by booking.")}</p>
  `;
}

async function initTourMap() {
  await createTravelExplorerMap({
    rootId: "tour-explorer-map",
    mapId: "tour-detail-map-canvas",
    title: "Nearby attractions, stays, food, and operators",
    kicker: "Tour Area Explorer",
    city: () => tourDetailState.company?.city || tourDetailState.tour?.location || "",
    center: [
      Number(tourDetailState.company?.latitude || 31.24),
      Number(tourDetailState.company?.longitude || 36.51),
    ],
  });
}

function bindTourActions() {
  tdById("tour-plan-btn").addEventListener("click", () => {
    const destination = tourDetailState.company?.city || tourDetailState.tour?.location || "Jordan";
    location.href = `trip-planner.html?destination=${encodeURIComponent(destination)}&days=2&budget=${encodeURIComponent(Math.max(200, Number(tourDetailState.tour?.price || 0) * 2))}&travelers=2&interests=adventure,culture`;
  });
}

async function initTourDetail() {
  try {
    await loadTourDetail();
    renderTourDetail();
    bindTourActions();
    await initTourMap();
  } catch (error) {
    tdById("tour-title").textContent = "Tour detail unavailable";
    tdById("tour-summary").textContent = error.message || "Please try again later.";
  }
}

document.addEventListener("DOMContentLoaded", initTourDetail);
