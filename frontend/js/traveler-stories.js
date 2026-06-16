const storyPageState = {
  stories: [],
  destinationFilter: "",
  viewerStoryId: null,
  editingStoryId: null,
  videoPayload: null,
};

const STORY_ACCEPTED_TYPES = [
  "video/mp4",
  "video/webm",
  "video/ogg",
  "video/quicktime",
];

function storyPageById(id) {
  return document.getElementById(id);
}

function storySafe(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function storyCurrentUser() {
  return typeof getUser === "function" ? getUser() : null;
}

function storyIsOwner(story) {
  const user = storyCurrentUser();
  return Boolean(user && story && Number(user.id) === Number(story.userId));
}

function storyFormatDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Recently" : date.toLocaleDateString();
}

function storyNormalize(raw) {
  return {
    id: raw.id,
    userId: raw.userId,
    destinationId: raw.destinationId || raw.destinationSlug || raw.attractionId || "",
    destinationSlug: raw.destinationSlug || raw.destinationId || "",
    destination: raw.destination || raw.attraction?.city || "Jordan",
    title: raw.title || "Traveler Story",
    description: raw.description || raw.storyText || "",
    storyText: raw.storyText || raw.description || "",
    userName: raw.userName || raw.user?.name || "Traveler",
    sponsorCompanyName: raw.sponsorCompanyName || "",
    videoUrl: raw.videoUrl || "",
    thumbnailUrl: raw.thumbnailUrl || raw.coverImage || "image/city/petra-world-heritage-jordan_16x9.avif",
    coverImage: raw.coverImage || raw.thumbnailUrl || "image/city/petra-world-heritage-jordan_16x9.avif",
    viewsCount: Number(raw.viewsCount || 0),
    isActive: raw.isActive !== false,
    createdAt: raw.createdAt || new Date().toISOString(),
    updatedAt: raw.updatedAt || raw.createdAt || new Date().toISOString(),
    mediaType: raw.mediaType || "video",
  };
}

function storyDestinationOptions() {
  return window.TRAVEL_STORY_DESTINATIONS || [];
}

function storyFilteredList() {
  return storyPageState.stories.filter((story) => {
    if (!story.isActive) return false;
    if (!storyPageState.destinationFilter) return true;
    return String(story.destinationSlug || "").toLowerCase() === storyPageState.destinationFilter
      || String(story.destination || "").toLowerCase() === storyPageState.destinationFilter;
  });
}

function storyCardTemplate(story) {
  const sponsor = story.sponsorCompanyName
    ? `<div class="story-card-line">Sponsored by ${storySafe(story.sponsorCompanyName)}</div>`
    : `<div class="story-card-line story-card-line-muted">Community story</div>`;
  const ownerControls = storyIsOwner(story)
    ? `
      <div class="story-card-owner-actions">
        <button class="btn btn-outline btn-sm" type="button" data-edit-story="${story.id}">Edit</button>
        <button class="btn btn-ghost btn-sm" type="button" data-delete-story="${story.id}">Delete</button>
      </div>
    `
    : "";

  return `
    <article class="story-tile" data-open-story="${story.id}" tabindex="0" role="button" aria-label="Open ${storySafe(story.title)} story">
      <div class="story-tile-media">
        <img src="${storySafe(story.thumbnailUrl)}" alt="${storySafe(story.title)} thumbnail" />
        <span class="story-play-badge">Play story</span>
      </div>
      <div class="story-tile-body">
        <h3>${storySafe(story.title)}</h3>
        <div class="story-card-line"><strong>${storySafe(story.userName)}</strong></div>
        <div class="story-card-line">${storySafe(story.destination)}</div>
        ${sponsor}
        <div class="story-card-line story-card-line-muted">${storySafe(storyFormatDate(story.createdAt))}</div>
        ${ownerControls}
      </div>
    </article>
  `;
}

function renderStoriesGrid() {
  const grid = storyPageById("stories-grid");
  if (!grid) return;

  const stories = storyFilteredList();
  grid.innerHTML = stories.length
    ? stories.map(storyCardTemplate).join("")
    : `
      <div class="story-empty-state">
        <h3>No stories match this destination yet</h3>
        <p>Try another destination or come back after more travelers publish their experiences.</p>
      </div>
    `;

  grid.querySelectorAll("[data-open-story]").forEach((card) => {
    const open = () => openStoryViewer(card.getAttribute("data-open-story"));
    card.addEventListener("click", open);
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        open();
      }
    });
  });

  grid.querySelectorAll("[data-edit-story]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      openStoryForm(button.getAttribute("data-edit-story"));
    });
  });

  grid.querySelectorAll("[data-delete-story]").forEach((button) => {
    button.addEventListener("click", async (event) => {
      event.stopPropagation();
      await deleteStory(button.getAttribute("data-delete-story"));
    });
  });
}

async function loadStories() {
  const merged = new Map();

  try {
    const stories = await TravelerStoriesAPI.getAll();
    if (Array.isArray(stories) && stories.length) {
      stories.map(storyNormalize).forEach((story) => {
        merged.set(String(story.id), story);
      });
    }
  } catch (_error) {
    // fall back below
  }

  const user = storyCurrentUser();
  if (user && window.TravelerStoriesAPI?.getMine) {
    try {
      const myStories = await TravelerStoriesAPI.getMine(user.id);
      if (Array.isArray(myStories)) {
        myStories.map(storyNormalize).forEach((story) => {
          merged.set(String(story.id), story);
        });
      }
    } catch (_error) {
      // keep merged list as-is
    }
  }

  if (merged.size) {
    return [...merged.values()];
  }

  return (window.TRAVELER_STORIES || []).map(storyNormalize);
}

function populateDestinationFilter() {
  const select = storyPageById("story-destination-filter");
  if (!select) return;
  const current = storyPageState.destinationFilter;
  select.innerHTML = `
    <option value="">All destinations</option>
    ${storyDestinationOptions().map((item) => `<option value="${storySafe(item.id)}">${storySafe(item.name)}</option>`).join("")}
  `;
  select.value = current;
}

function renderHeaderState() {
  const addButton = storyPageById("open-story-form-btn");
  const helper = storyPageById("story-auth-helper");
  const loggedIn = typeof isLoggedIn === "function" && isLoggedIn();

  if (addButton) {
    addButton.hidden = !loggedIn;
  }
  if (helper) {
    helper.hidden = loggedIn;
  }
}

async function openStoryViewer(storyId) {
  const story = storyPageState.stories.find((item) => String(item.id) === String(storyId));
  if (!story) return;

  storyPageState.viewerStoryId = story.id;
  const modal = storyPageById("story-viewer-modal");
  const body = storyPageById("story-viewer-body");
  if (!modal || !body) return;

  body.innerHTML = `
    <div class="story-viewer-layout">
      <div class="story-viewer-video-shell">
        <video class="story-viewer-video" controls playsinline preload="metadata" poster="${storySafe(story.thumbnailUrl)}">
          <source src="${storySafe(story.videoUrl)}" />
        </video>
      </div>
      <div class="story-viewer-copy">
        <span class="story-section-tag">${storySafe(story.destination)}</span>
        <h2>${storySafe(story.title)}</h2>
        <div class="story-viewer-meta">
          <span>${storySafe(story.userName)}</span>
          <span>${storySafe(storyFormatDate(story.createdAt))}</span>
        </div>
        <p>${storySafe(story.storyText || story.description)}</p>
        ${story.sponsorCompanyName ? `<div class="story-viewer-info"><span>Sponsor</span><strong>${storySafe(story.sponsorCompanyName)}</strong></div>` : ""}
        <div class="story-viewer-info"><span>Views</span><strong id="story-viewer-views">${storySafe(String(story.viewsCount))}</strong></div>
      </div>
    </div>
  `;

  modal.hidden = false;
  document.body.classList.add("story-modal-open");

  try {
    const response = await TravelerStoriesAPI.incrementView(story.id);
    story.viewsCount = Number(response?.viewsCount || story.viewsCount + 1);
    const views = storyPageById("story-viewer-views");
    if (views) views.textContent = String(story.viewsCount);
  } catch (_error) {
    // keep local count stable if the API is unavailable
  }
}

function closeStoryViewer() {
  const modal = storyPageById("story-viewer-modal");
  if (!modal) return;
  modal.hidden = true;
  document.body.classList.remove("story-modal-open");
}

function openStoryForm(storyId = null) {
  if (!isLoggedIn()) {
    showToast("Please log in to create a story.", "info");
    location.href = "auth.html?redirect=stories.html";
    return;
  }

  const story = storyId
    ? storyPageState.stories.find((item) => String(item.id) === String(storyId))
    : null;

  if (story && !storyIsOwner(story) && storyCurrentUser()?.role !== "ADMIN") {
    showToast("You can only edit your own stories.", "error");
    return;
  }

  storyPageState.editingStoryId = story ? story.id : null;
  storyPageState.videoPayload = story
    ? {
        videoUrl: story.videoUrl,
        thumbnailUrl: story.thumbnailUrl,
        filename: story.title,
      }
    : null;

  const modal = storyPageById("story-form-modal");
  const title = storyPageById("story-form-heading");
  const form = storyPageById("story-form");
  const destination = storyPageById("story-destination");
  const videoHint = storyPageById("story-video-hint");

  if (!modal || !title || !form || !destination || !videoHint) return;

  populateStoryFormDestinations();
  form.reset();
  clearStoryFormError();

  title.textContent = story ? "Edit Story" : "Create Story";
  storyPageById("story-title").value = story?.title || "";
  storyPageById("story-destination").value = story?.destinationSlug || "";
  storyPageById("story-description").value = story?.storyText || story?.description || "";
  storyPageById("story-sponsor").value = story?.sponsorCompanyName || "";
  videoHint.textContent = story ? "Leave the file unchanged to keep the current video." : "Upload a short MP4, WebM, OGG, or MOV story.";
  modal.hidden = false;
  document.body.classList.add("story-modal-open");

  destination.value = story?.destinationSlug || "";
}

function closeStoryForm() {
  const modal = storyPageById("story-form-modal");
  if (!modal) return;
  modal.hidden = true;
  document.body.classList.remove("story-modal-open");
  storyPageState.editingStoryId = null;
  storyPageState.videoPayload = null;
  clearStoryFormError();
}

function populateStoryFormDestinations() {
  const select = storyPageById("story-destination");
  if (!select) return;
  select.innerHTML = `
    <option value="">Select destination</option>
    ${storyDestinationOptions().map((item) => `<option value="${storySafe(item.id)}">${storySafe(item.name)}</option>`).join("")}
  `;
}

function setStoryFormError(message) {
  const error = storyPageById("story-form-error");
  if (!error) return;
  error.hidden = !message;
  error.textContent = message || "";
}

function clearStoryFormError() {
  setStoryFormError("");
}

function storyDestinationMeta(destinationId) {
  return storyDestinationOptions().find((item) => item.id === destinationId) || null;
}

function storyFileIsSupported(file) {
  if (!file) return false;
  if (STORY_ACCEPTED_TYPES.includes(file.type)) return true;
  return /\.(mp4|webm|ogg|mov)$/i.test(file.name || "");
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Could not read the selected video."));
    reader.readAsDataURL(file);
  });
}

function buildVideoThumbnail(videoUrl) {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;
    video.src = videoUrl;
    video.addEventListener("loadeddata", () => {
      try {
        const canvas = document.createElement("canvas");
        const width = video.videoWidth || 640;
        const height = video.videoHeight || 360;
        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d")?.drawImage(video, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      } catch (_error) {
        resolve("");
      }
    }, { once: true });
    video.addEventListener("error", () => resolve(""), { once: true });
  });
}

async function handleStoryVideoSelection(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  if (!storyFileIsSupported(file)) {
    setStoryFormError("Please upload a supported video format: MP4, WebM, OGG, or MOV.");
    event.target.value = "";
    return;
  }

  clearStoryFormError();
  const videoUrl = await readFileAsDataUrl(file);
  const thumbnailUrl = await buildVideoThumbnail(videoUrl);
  storyPageState.videoPayload = {
    videoUrl,
    thumbnailUrl,
    filename: file.name,
  };
  storyPageById("story-video-hint").textContent = `Ready to publish: ${file.name}`;
}

function buildStoryPayloadFromForm() {
  const title = storyPageById("story-title").value.trim();
  const destinationId = storyPageById("story-destination").value.trim();
  const description = storyPageById("story-description").value.trim();
  const sponsorCompanyName = storyPageById("story-sponsor").value.trim();
  const destinationMeta = storyDestinationMeta(destinationId);

  if (!title) {
    throw new Error("Story title is required.");
  }
  if (!destinationMeta) {
    throw new Error("Destination is required.");
  }
  if (!description) {
    throw new Error("Description is required.");
  }
  if (!storyPageState.videoPayload?.videoUrl) {
    throw new Error("Video upload is required.");
  }

  return {
    title,
    destination: destinationMeta.name,
    destinationSlug: destinationMeta.id,
    destinationId: destinationMeta.id,
    description,
    storyText: description,
    videoUrl: storyPageState.videoPayload.videoUrl,
    thumbnailUrl: storyPageState.videoPayload.thumbnailUrl || "",
    coverImage: storyPageState.videoPayload.thumbnailUrl || "",
    sponsorCompanyName,
    mediaType: "video",
    isActive: true,
  };
}

async function submitStoryForm(event) {
  event.preventDefault();
  clearStoryFormError();

  try {
    const payload = buildStoryPayloadFromForm();
    if (storyPageState.editingStoryId) {
      await TravelerStoriesAPI.update(storyPageState.editingStoryId, payload);
      showToast("Story updated successfully.", "success");
    } else {
      await TravelerStoriesAPI.create(payload);
      showToast("Story published successfully.", "success");
    }
    closeStoryForm();
    await refreshStories();
  } catch (error) {
    setStoryFormError(error.message || "Could not save your story.");
  }
}

async function deleteStory(storyId) {
  const story = storyPageState.stories.find((item) => String(item.id) === String(storyId));
  if (!story) return;
  if (!window.confirm(`Delete "${story.title}"?`)) return;

  try {
    await TravelerStoriesAPI.delete(story.id);
    showToast("Story deleted.", "success");
    await refreshStories();
  } catch (error) {
    showToast(error.message || "Could not delete the story.", "error");
  }
}

async function refreshStories() {
  storyPageState.stories = await loadStories();
  renderStoriesGrid();
  renderPageSummary();
}

function renderPageSummary() {
  const stories = storyFilteredList();
  const count = storyPageById("stories-count");
  if (count) {
    count.textContent = `${stories.length} published stor${stories.length === 1 ? "y" : "ies"}`;
  }
}

function applyDestinationQuery() {
  const params = new URLSearchParams(window.location.search);
  const destination = String(params.get("destination") || "").trim().toLowerCase();
  storyPageState.destinationFilter = destination;
}

async function handleDeepLinks() {
  const params = new URLSearchParams(window.location.search);
  const storyId = params.get("story");
  const editId = params.get("edit");

  if (storyId) {
    await openStoryViewer(storyId);
  }
  if (editId) {
    openStoryForm(editId);
  }
}

async function initStoriesPage() {
  applyDestinationQuery();
  populateDestinationFilter();
  renderHeaderState();
  storyPageById("story-destination-filter")?.addEventListener("change", (event) => {
    storyPageState.destinationFilter = String(event.target.value || "").trim().toLowerCase();
    renderStoriesGrid();
    renderPageSummary();
  });
  storyPageById("open-story-form-btn")?.addEventListener("click", () => openStoryForm());
  storyPageById("close-story-viewer-btn")?.addEventListener("click", closeStoryViewer);
  storyPageById("close-story-form-btn")?.addEventListener("click", closeStoryForm);
  storyPageById("story-viewer-modal")?.addEventListener("click", (event) => {
    if (event.target === storyPageById("story-viewer-modal")) closeStoryViewer();
  });
  storyPageById("story-form-modal")?.addEventListener("click", (event) => {
    if (event.target === storyPageById("story-form-modal")) closeStoryForm();
  });
  storyPageById("story-form")?.addEventListener("submit", submitStoryForm);
  storyPageById("story-cancel-btn")?.addEventListener("click", closeStoryForm);
  storyPageById("story-video")?.addEventListener("change", handleStoryVideoSelection);

  await refreshStories();
  populateDestinationFilter();
  storyPageById("story-destination-filter").value = storyPageState.destinationFilter;
  await handleDeepLinks();
}

document.addEventListener("DOMContentLoaded", initStoriesPage);
