const galleryGrid = document.getElementById("visual-grid");
const galleryChips = Array.from(document.querySelectorAll(".gallery-chip"));
const galleryCardSizes = [
  "visual-card-tall",
  "visual-card-medium",
  "visual-card-large",
  "visual-card-small",
  "visual-card-medium",
  "visual-card-tall"
];

const galleryCopyByCategory = {
  travel: "Curated travel frames from across Jordan.",
  city: "Urban moments, rooftops, and the rhythm of Amman.",
  landmark: "Ancient monuments and carved stone grandeur.",
  beach: "Bright coastal scenes and Red Sea calm.",
  desert: "Waves of sand, shadow, and open horizon.",
  restaurants: "Shared tables, hospitality, and Jordanian flavor."
};

function formatLabel(value, fallback) {
  const text = String(value || "").trim();
  if (!text) return fallback;
  return text
    .split(/[\s_-]+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function renderGalleryCards(photos) {
  if (!Array.isArray(photos) || photos.length === 0) {
    galleryGrid.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🖼️</div>
        <div class="empty-state-title">No Photos Yet</div>
        <div class="empty-state-desc">Run the Pexels import and your gallery will appear here.</div>
      </div>
    `;
    return;
  }

  galleryGrid.innerHTML = photos
    .map((photo, index) => {
      const sizeClass = galleryCardSizes[index % galleryCardSizes.length];
      const location = formatLabel(photo.location, "Jordan");
      const category = formatLabel(photo.category, "Photograph");
      const description =
        galleryCopyByCategory[String(photo.category || "").toLowerCase()] ||
        "Editorial imagery gathered for the TravelMind gallery.";

      return `
        <article class="visual-card ${sizeClass}">
          <img src="${photo.url}" alt="${location} ${category}" loading="lazy" />
          <div class="visual-overlay">
            <span>${location}</span>
            <strong>${description}</strong>
          </div>
        </article>
      `;
    })
    .join("");
}

async function loadGalleryPhotos(category = "") {
  galleryGrid.innerHTML = `
    <div class="loading-state">
      <div class="spinner"></div>
      <span>Loading gallery photographs...</span>
    </div>
  `;

  try {
    const photos = await PhotosAPI.getAll({ category, limit: 24 });
    renderGalleryCards(photos);
  } catch (error) {
    galleryGrid.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">⚠️</div>
        <div class="empty-state-title">Could not load gallery</div>
        <div class="empty-state-desc">Make sure the backend is running and photos were imported.</div>
      </div>
    `;
  }
}

galleryChips.forEach((chip) => {
  chip.addEventListener("click", () => {
    galleryChips.forEach((item) => item.classList.remove("active"));
    chip.classList.add("active");
    loadGalleryPhotos(chip.dataset.category || "");
  });
});

document.addEventListener("DOMContentLoaded", () => {
  loadGalleryPhotos("");
});
