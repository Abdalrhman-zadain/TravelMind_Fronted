const storyState = {
  destination: "",
  tag: "",
  feedView: false,
  stories: [],
};

const STORY_SOCIAL_KEY = "tm_story_social_v1";

function storyReadSocial() {
  try {
    return JSON.parse(localStorage.getItem(STORY_SOCIAL_KEY) || "{}");
  } catch (_error) {
    return {};
  }
}

function storyWriteSocial(data) {
  localStorage.setItem(STORY_SOCIAL_KEY, JSON.stringify(data));
}

function storyEsc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function storyStars(rating) {
  return `${"★".repeat(Math.round(rating || 0))}${"☆".repeat(Math.max(0, 5 - Math.round(rating || 0)))}`;
}

function storyShortText(text, limit = 180) {
  const value = String(text || "").trim();
  if (value.length <= limit) return value;
  return `${value.slice(0, limit).trim()}...`;
}

function currentStoryUserId() {
  return Number(getUser?.()?.id || 0) || 0;
}

function latestUserSaveState(interactions = []) {
  const userId = currentStoryUserId();
  if (!userId) return false;
  const saves = interactions
    .filter((entry) => entry.interactionType === "save" && Number(entry.userId) === userId)
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  if (!saves.length) return false;
  return String(saves[0].content || "saved").toLowerCase() !== "unsaved";
}

function normalizeGuide(rawGuide) {
  if (!rawGuide) return null;
  return {
    id: rawGuide.id,
    name: rawGuide.name || rawGuide.fullName || "Certified Guide",
    languages: Array.isArray(rawGuide.languages) ? rawGuide.languages : [],
    rating: Number(rawGuide.rating || 0),
    hourlyRate: Number(rawGuide.hourlyRate || 0),
    yearsExperience: Number(rawGuide.yearsExperience || 0),
  };
}

function normalizeStory(story) {
  const interactions = Array.isArray(story?.interactions) ? story.interactions : [];
  const comments = interactions
    .filter((entry) => entry.interactionType === "comment" && String(entry.content || "").trim())
    .map((entry) => ({
      id: entry.id,
      author: entry.user?.name || `Traveler ${entry.userId || ""}`.trim() || "Traveler",
      content: String(entry.content || "").trim(),
      createdAt: entry.createdAt,
    }));

  const socialCounts = {
    likes: interactions.filter((entry) => entry.interactionType === "like").length,
    comments: comments.length,
    shares: interactions.filter((entry) => entry.interactionType === "share").length,
  };

  return {
    id: story.id,
    title: story.title || "Traveler Story",
    destination: story.destination || story.attraction?.city || "Jordan",
    destinationSlug: story.destinationSlug || String(story.destination || "jordan").trim().toLowerCase().replace(/\s+/g, "-"),
    userName: story.userName || story.user?.name || "Traveler",
    userCountry: story.userCountry || story.user?.preferredLanguage || "Jordan",
    rating: Number(story.rating || 0),
    mediaType: story.mediaType || "image",
    coverImage: story.coverImage || "image/city/petra-world-heritage-jordan_16x9.avif",
    estimatedCost: Number(story.estimatedCost || 0),
    durationDays: Number(story.durationDays || 1),
    travelers: Number(story.travelers || story.travelersCount || 1),
    travelersCount: Number(story.travelersCount || story.travelers || 1),
    travelInterests: Array.isArray(story.travelInterests) ? story.travelInterests : [],
    tags: Array.isArray(story.tags) ? story.tags : [],
    description: story.description || storyShortText(story.storyText || story.fullExperience || ""),
    fullExperience: story.fullExperience || story.storyText || story.description || "",
    activities: Array.isArray(story.activities) ? story.activities : [],
    tips: Array.isArray(story.tips) ? story.tips : Array.isArray(story.travelTips) ? story.travelTips : [],
    guide: normalizeGuide(story.guide),
    interactions,
    comments,
    socialCounts,
    saved: latestUserSaveState(interactions),
  };
}

function storySocialState(story) {
  const fallback = storyReadSocial()[story.id] || {};
  return {
    likes: Number(fallback.likes ?? story.socialCounts?.likes ?? 0),
    comments: Number(fallback.comments ?? story.socialCounts?.comments ?? 0),
    saved: typeof fallback.saved === "boolean" ? fallback.saved : Boolean(story.saved),
  };
}

function setStorySocialState(storyId, next) {
  const all = storyReadSocial();
  all[storyId] = next;
  storyWriteSocial(all);
}

function filteredStories() {
  return storyState.stories.filter((story) => {
    if (storyState.destination && story.destination !== storyState.destination) return false;
    if (storyState.tag && !story.tags.includes(storyState.tag)) return false;
    return true;
  });
}

function storyCard(story) {
  const social = storySocialState(story);
  return `
    <article class="story-card">
      <div class="story-media">
        <img src="${storyEsc(story.coverImage)}" alt="${storyEsc(story.title)}" />
        <span class="story-badge">${storyEsc(story.mediaType === "video" ? "Short video" : "Photo story")}</span>
      </div>
      <div class="story-content">
        <div class="story-meta">
          <span>${storyEsc(story.userName)}</span>
          <span>${storyEsc(story.userCountry)}</span>
          <span>${storyEsc(story.destination)}</span>
          <span>${storyStars(story.rating)}</span>
        </div>
        <h3>${storyEsc(story.title)}</h3>
        <p class="story-description">${storyEsc(story.description)}</p>
        <div class="story-tags">${story.tags.map((tag) => `<span class="story-pill">${storyEsc(tag)}</span>`).join("")}</div>
        <div class="story-actions">
          <div class="story-social">
            <button type="button" data-like-story="${story.id}">Like ${social.likes}</button>
            <button type="button" data-comment-story="${story.id}">Comment ${social.comments}</button>
            <button type="button" data-save-story="${story.id}">${social.saved ? "Saved" : "Save"}</button>
            <button type="button" data-share-story="${story.id}">Share</button>
          </div>
          <button type="button" class="btn btn-primary" data-open-story="${story.id}">View Story</button>
        </div>
      </div>
    </article>
  `;
}

function storyTripUrl(story) {
  const params = new URLSearchParams({
    destination: story.destination,
    days: String(story.durationDays),
    budget: String(story.estimatedCost),
    travelers: String(story.travelersCount),
    interests: story.travelInterests.join(","),
  });
  return `trip-planner.html?${params.toString()}`;
}

async function refreshStoryById(storyId) {
  try {
    const refreshed = normalizeStory(await TravelerStoriesAPI.getById(storyId));
    storyState.stories = storyState.stories.map((story) => (String(story.id) === String(storyId) ? refreshed : story));
    return refreshed;
  } catch (_error) {
    return storyState.stories.find((story) => String(story.id) === String(storyId)) || null;
  }
}

function bindStoryActions() {
  document.querySelectorAll("[data-open-story]").forEach((button) => {
    button.addEventListener("click", () => openStoryModal(button.getAttribute("data-open-story")));
  });

  document.querySelectorAll("[data-like-story]").forEach((button) => {
    button.addEventListener("click", async () => {
      const id = button.getAttribute("data-like-story");
      const story = storyState.stories.find((entry) => String(entry.id) === String(id));
      if (!story) return;
      const state = storySocialState(story);
      state.likes += 1;
      setStorySocialState(id, state);
      try {
        await TravelerStoriesAPI.interact(id, { interactionType: "like" });
        await refreshStoryById(id);
      } catch (_error) {
        // Keep optimistic local state if the API call fails.
      }
      renderStories();
    });
  });

  document.querySelectorAll("[data-comment-story]").forEach((button) => {
    button.addEventListener("click", async () => {
      const id = button.getAttribute("data-comment-story");
      const story = storyState.stories.find((entry) => String(entry.id) === String(id));
      if (!story) return;
      const text = window.prompt("Add your comment");
      if (!text) return;
      const state = storySocialState(story);
      state.comments += 1;
      setStorySocialState(id, state);
      try {
        await TravelerStoriesAPI.interact(id, { interactionType: "comment", content: text });
        await refreshStoryById(id);
      } catch (_error) {
        // Keep optimistic local state if the API call fails.
      }
      renderStories();
    });
  });

  document.querySelectorAll("[data-save-story]").forEach((button) => {
    button.addEventListener("click", async () => {
      const id = button.getAttribute("data-save-story");
      const story = storyState.stories.find((entry) => String(entry.id) === String(id));
      if (!story) return;
      const state = storySocialState(story);
      state.saved = !state.saved;
      setStorySocialState(id, state);
      try {
        await TravelerStoriesAPI.interact(id, {
          interactionType: "save",
          content: state.saved ? "saved" : "unsaved",
        });
        await refreshStoryById(id);
      } catch (_error) {
        // Keep optimistic local state if the API call fails.
      }
      renderStories();
    });
  });

  document.querySelectorAll("[data-share-story]").forEach((button) => {
    button.addEventListener("click", async () => {
      const id = button.getAttribute("data-share-story");
      const story = storyState.stories.find((entry) => String(entry.id) === String(id));
      if (!story) return;
      await navigator.clipboard.writeText(`${location.origin}${location.pathname}?story=${id}`);
      try {
        await TravelerStoriesAPI.interact(id, { interactionType: "share" });
        await refreshStoryById(id);
      } catch (_error) {
        // Sharing should stay resilient even if the API is unavailable.
      }
      showToast(`${story.title} link copied.`, "success");
      renderStories();
    });
  });
}

function renderStories() {
  const root = document.getElementById("stories-grid");
  if (!root) return;
  root.classList.toggle("feed-view", storyState.feedView);
  const stories = filteredStories();
  root.innerHTML = stories.length
    ? stories.map(storyCard).join("")
    : `<div class="story-card"><div class="story-content"><h3>No stories match these filters</h3><p class="story-description">Try another destination or tag to explore more real experiences from Jordan.</p></div></div>`;
  bindStoryActions();
}

function renderStoryComments(story) {
  if (!story.comments.length) {
    return `<p class="story-description">No comments yet. Be the first traveler to add a note.</p>`;
  }

  return `<ul class="story-list">${story.comments.slice(0, 4).map((comment) => {
    const timestamp = comment.createdAt ? new Date(comment.createdAt).toLocaleDateString() : "";
    return `<li><strong>${storyEsc(comment.author)}</strong>: ${storyEsc(comment.content)}${timestamp ? ` <span>(${storyEsc(timestamp)})</span>` : ""}</li>`;
  }).join("")}</ul>`;
}

function openStoryModal(storyId) {
  const story = storyState.stories.find((item) => String(item.id) === String(storyId));
  if (!story) return;

  const content = document.getElementById("story-modal-content");
  if (!content) return;
  content.innerHTML = `
    <div class="story-modal-layout">
      <div class="story-modal-media">
        <img src="${storyEsc(story.coverImage)}" alt="${storyEsc(story.title)}" />
      </div>
      <div class="story-modal-copy">
        <p class="stories-kicker">${storyEsc(story.destination)}</p>
        <h2>${storyEsc(story.title)}</h2>
        <div class="story-rating">${storyStars(story.rating)} • ${storyEsc(story.userName)} from ${storyEsc(story.userCountry)}</div>
        <p>${storyEsc(story.fullExperience)}</p>
        <div class="story-detail-grid">
          <div class="story-detail-card"><span>Estimated cost</span><strong>${storyEsc(`${story.estimatedCost} JOD`)}</strong></div>
          <div class="story-detail-card"><span>Duration</span><strong>${storyEsc(`${story.durationDays} days`)}</strong></div>
          <div class="story-detail-card"><span>Travelers</span><strong>${storyEsc(String(story.travelersCount))}</strong></div>
        </div>
        <div>
          <h3>Activities</h3>
          <ul class="story-list">${story.activities.map((item) => `<li>${storyEsc(item)}</li>`).join("")}</ul>
        </div>
        <div>
          <h3>Travel tips</h3>
          <ul class="story-list">${story.tips.map((item) => `<li>${storyEsc(item)}</li>`).join("")}</ul>
        </div>
        <div>
          <h3>Traveler comments</h3>
          ${renderStoryComments(story)}
        </div>
        ${story.guide ? `<div class="story-guide-card"><span>Guide used on this trip</span><strong>${storyEsc(story.guide.name)}</strong><div>${storyEsc(story.guide.languages.join(", "))} • ${storyEsc(`${story.guide.yearsExperience} years`)} • ${storyEsc(`${story.guide.hourlyRate} JOD/hr`)}</div></div>` : ""}
        <div class="story-modal-actions">
          <button type="button" class="btn btn-primary" id="story-create-trip-btn">Create Trip Like This</button>
          <a href="destination-detail.html?slug=${encodeURIComponent(story.destinationSlug)}" class="btn btn-outline">Open Destination</a>
        </div>
      </div>
    </div>
  `;
  document.getElementById("story-modal").hidden = false;
  document.getElementById("story-create-trip-btn").addEventListener("click", () => {
    saveStoryTripPrefill(story);
    location.href = storyTripUrl(story);
  });
}

function closeStoryModal() {
  const modal = document.getElementById("story-modal");
  if (modal) modal.hidden = true;
}

function initStoryFilters() {
  const destinationSelect = document.getElementById("story-destination-filter");
  const tagSelect = document.getElementById("story-tag-filter");
  if (!destinationSelect || !tagSelect) return;

  const destinations = [...new Set(storyState.stories.map((story) => story.destination))].sort();
  const tags = [...new Set(storyState.stories.flatMap((story) => story.tags))].sort();

  destinationSelect.innerHTML = `<option value="">All destinations</option>${destinations.map((item) => `<option value="${storyEsc(item)}">${storyEsc(item)}</option>`).join("")}`;
  tagSelect.innerHTML = `<option value="">All tags</option>${tags.map((item) => `<option value="${storyEsc(item)}">${storyEsc(item)}</option>`).join("")}`;

  destinationSelect.addEventListener("change", (event) => {
    storyState.destination = event.target.value;
    renderStories();
  });
  tagSelect.addEventListener("change", (event) => {
    storyState.tag = event.target.value;
    renderStories();
  });
}

async function loadTravelerStories() {
  try {
    const stories = await TravelerStoriesAPI.getAll();
    if (Array.isArray(stories) && stories.length) {
      return stories.map(normalizeStory);
    }
  } catch (_error) {
    // Fall through to bundled stories below.
  }
  return (window.TRAVELER_STORIES || []).map(normalizeStory);
}

async function initTravelerStoriesPage() {
  storyState.stories = await loadTravelerStories();
  initStoryFilters();
  renderStories();

  document.getElementById("toggle-view-btn")?.addEventListener("click", () => {
    storyState.feedView = !storyState.feedView;
    document.getElementById("toggle-view-btn").textContent = storyState.feedView ? "Switch to Grid" : "Switch to Feed";
    renderStories();
  });

  document.getElementById("close-story-modal")?.addEventListener("click", closeStoryModal);
  document.getElementById("story-modal")?.addEventListener("click", (event) => {
    if (event.target === document.getElementById("story-modal")) closeStoryModal();
  });

  const queryStory = new URLSearchParams(window.location.search).get("story");
  if (queryStory) {
    openStoryModal(queryStory);
  }
}

document.addEventListener("DOMContentLoaded", initTravelerStoriesPage);
