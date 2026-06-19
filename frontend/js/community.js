// ═══════════════════════════════════════════════
// TRAVELMIND — COMMUNITY HUB JS (AI EXPLORER)
// ═══════════════════════════════════════════════

document.addEventListener("DOMContentLoaded", () => {
  const user = typeof getUser === "function" ? getUser() : null;

  const authContainer = document.getElementById("auth-required-container");
  const mainContainer = document.getElementById("community-main-container");

  if (!user) {
    if (authContainer) authContainer.removeAttribute("hidden");
    if (mainContainer) mainContainer.setAttribute("hidden", "true");
    return;
  }

  if (authContainer) authContainer.setAttribute("hidden", "true");
  if (mainContainer) mainContainer.removeAttribute("hidden");

  // State Management
  const state = {
    allTravelers: [],
    filteredTravelers: [],
    selectedTraveler: null,
    aiMatchScores: {}, // Maps traveler ID to custom match score
    aiModelActive: false
  };

  // DOM Elements
  const searchInput = document.getElementById("traveler-search-input");
  const langFilter = document.getElementById("traveler-lang-filter");
  const roleFilter = document.getElementById("traveler-role-filter");
  const sortFilter = document.getElementById("traveler-sort-filter");
  const clearFiltersBtn = document.getElementById("clear-filters-btn");
  
  const travelersGrid = document.getElementById("travelers-grid");
  const countHeading = document.getElementById("results-count-heading");
  
  // AI Sidebar Elements
  const aiBuddyCriteria = document.getElementById("ai-buddy-criteria");
  const aiSearchBtn = document.getElementById("ai-search-btn");
  const aiLoadingIndicator = document.getElementById("ai-loading-indicator");
  const statsTotalUsers = document.getElementById("stats-total-users");
  const statsTotalStories = document.getElementById("stats-total-stories");

  // Profile Modal Elements
  const profileModal = document.getElementById("profile-modal");
  const closeProfileBtn = document.getElementById("close-profile-modal-btn");
  const modalHeaderContent = document.getElementById("modal-header-profile-content");
  const statStoriesVal = document.getElementById("profile-stat-stories");
  const statTripsVal = document.getElementById("profile-stat-trips");
  const statJournalsVal = document.getElementById("profile-stat-journals");
  const profileStoriesGrid = document.getElementById("profile-stories-grid");

  // Video Player Modal Elements
  const videoModal = document.getElementById("modal-story-video-viewer");
  const closeVideoBtn = document.getElementById("close-video-viewer-btn");
  const videoWrapper = document.getElementById("video-container-wrapper");

  // Event Listeners for Filters
  let searchTimeout;
  if (searchInput) {
    searchInput.addEventListener("input", () => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        loadTravelers();
      }, 300);
    });
  }

  if (langFilter) langFilter.addEventListener("change", applyFiltersAndSort);
  if (roleFilter) roleFilter.addEventListener("change", applyFiltersAndSort);
  if (sortFilter) sortFilter.addEventListener("change", applyFiltersAndSort);

  if (clearFiltersBtn) {
    clearFiltersBtn.addEventListener("click", () => {
      if (searchInput) searchInput.value = "";
      if (langFilter) langFilter.value = "";
      if (roleFilter) roleFilter.value = "";
      if (sortFilter) sortFilter.value = "ai-score";
      applyFiltersAndSort();
    });
  }

  // Interactive AI Semantic Matching Simulation
  if (aiSearchBtn) {
    aiSearchBtn.addEventListener("click", () => {
      const criteria = aiBuddyCriteria ? aiBuddyCriteria.value.trim() : "";
      if (!criteria) {
        if (typeof showToast === "function") {
          showToast("Please explain your ideal travel buddy criteria first.", "warning");
        } else {
          alert("Please explain your ideal travel buddy criteria first.");
        }
        return;
      }

      // Show AI processing animation
      if (aiLoadingIndicator) aiLoadingIndicator.removeAttribute("hidden");
      if (aiSearchBtn) aiSearchBtn.setAttribute("disabled", "true");
      state.aiModelActive = true;

      setTimeout(() => {
        // Calculate mock semantic score mapping based on string matching & random vectors
        state.allTravelers.forEach(traveler => {
          let score = 70 + Math.floor(Math.random() * 20); // base 70-90% Match
          
          // Boost match score if traveler's language matches terms in criteria
          const criteriaLower = criteria.toLowerCase();
          const lang = (traveler.preferredLanguage || "en").toLowerCase();
          if (criteriaLower.includes(lang) || (lang === "ar" && criteriaLower.includes("arabic")) || (lang === "en" && criteriaLower.includes("english"))) {
            score += 8;
          }
          
          // Boost if role fits terms in criteria
          if (criteriaLower.includes("guide") && traveler.role === "GUIDE") score += 5;
          if (criteriaLower.includes("traveler") && traveler.role === "TRAVELER") score += 3;
          if (traveler._count?.travelerStories > 0 && criteriaLower.includes("story")) score += 4;
          
          state.aiMatchScores[traveler.id] = Math.min(99, score);
        });

        // Hide processing animation
        if (aiLoadingIndicator) aiLoadingIndicator.setAttribute("hidden", "true");
        if (aiSearchBtn) aiSearchBtn.removeAttribute("disabled");

        if (travelersGrid) {
          travelersGrid.classList.add("scanning");
          setTimeout(() => {
            travelersGrid.classList.remove("scanning");
          }, 1200);
        }

        if (typeof showToast === "function") {
          showToast("TravelMind AI calculated community semantic scores successfully!", "success");
        }

        // Force sort to AI score and refresh list
        if (sortFilter) sortFilter.value = "ai-score";
        applyFiltersAndSort();
      }, 1200);
    });
  }

  // Load traveler list from API
  async function loadTravelers() {
    const query = searchInput ? searchInput.value.trim() : "";
    travelersGrid.innerHTML = `
      <div class="no-results-state">
        <div class="spinner-mini" style="margin: 0 auto 10px auto; width: 30px; height: 30px;"></div>
        <p>Loading travelers...</p>
      </div>
    `;
    
    try {
      if (typeof CommunityAPI !== "undefined" && typeof CommunityAPI.searchUsers === "function") {
        const data = await CommunityAPI.searchUsers(query);
        state.allTravelers = data || [];
        
        // Populate community stats widget
        updateCommunityStats(state.allTravelers);
        
        // Set default match scores if not set
        state.allTravelers.forEach(traveler => {
          if (!state.aiMatchScores[traveler.id]) {
            state.aiMatchScores[traveler.id] = 100 - traveler.id; // dynamic default matching score based on ID
          }
        });

        applyFiltersAndSort();
      } else {
        console.error("CommunityAPI is not loaded.");
        travelersGrid.innerHTML = `
          <div class="no-results-state">
            <span class="no-results-icon">❌</span>
            <p>Error: API helper missing</p>
          </div>
        `;
      }
    } catch (err) {
      console.error("Failed to load community users:", err);
      travelersGrid.innerHTML = `
        <div class="no-results-state">
          <span class="no-results-icon">⚠️</span>
          <p>Failed to load community members. Please try again later.</p>
        </div>
      `;
    }
  }

  // Local filtering & sorting logic
  function applyFiltersAndSort() {
    const selectedLang = langFilter ? langFilter.value : "";
    const selectedRole = roleFilter ? roleFilter.value : "";
    const sortBy = sortFilter ? sortFilter.value : "ai-score";
    
    // Filter
    state.filteredTravelers = state.allTravelers.filter(traveler => {
      const matchLang = !selectedLang || (traveler.preferredLanguage || "").toLowerCase() === selectedLang.toLowerCase();
      const matchRole = !selectedRole || (traveler.role || "").toUpperCase() === selectedRole.toUpperCase();
      return matchLang && matchRole;
    });

    // Sort
    state.filteredTravelers.sort((a, b) => {
      if (sortBy === "ai-score") {
        const scoreA = state.aiMatchScores[a.id] || 0;
        const scoreB = state.aiMatchScores[b.id] || 0;
        return scoreB - scoreA;
      }
      if (sortBy === "name-asc") {
        return (a.name || "").localeCompare(b.name || "");
      }
      if (sortBy === "newest") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      return 0;
    });

    renderTravelers();
  }

  function updateCommunityStats(travelers) {
    if (statsTotalUsers) statsTotalUsers.textContent = travelers.length;
    
    let totalStories = 0;
    travelers.forEach(t => {
      totalStories += (t._count?.travelerStories || 0);
    });
    if (statsTotalStories) statsTotalStories.textContent = totalStories;
  }

  // Generate initials helper
  function getInitials(name) {
    if (!name) return "?";
    return name
      .split(" ")
      .map(part => part.charAt(0))
      .slice(0, 2)
      .join("")
      .toUpperCase();
  }

  // Render traveler card rows (Explorer dual-column layout)
  function renderTravelers() {
    if (!travelersGrid) return;
    travelersGrid.innerHTML = "";

    const count = state.filteredTravelers.length;
    if (countHeading) {
      countHeading.textContent = `${count} Explorer${count !== 1 ? 's' : ''}`;
    }

    if (count === 0) {
      travelersGrid.innerHTML = `
        <div class="no-results-state">
          <span class="no-results-icon">🔍</span>
          <h3>No travelers found</h3>
          <p>Try adjusting your search terms or filters.</p>
        </div>
      `;
      return;
    }

    state.filteredTravelers.forEach(traveler => {
      const card = document.createElement("div");
      card.className = "traveler-card";
      
      const avatarHTML = traveler.profileImage 
        ? `<img class="avatar" src="${escapeHtml(traveler.profileImage)}" alt="${escapeHtml(traveler.name)}" />`
        : `<div class="avatar-fallback">${escapeHtml(getInitials(traveler.name))}</div>`;

      const storiesCount = traveler._count?.travelerStories || 0;
      const tripsCount = traveler._count?.trips || 0;
      const journalsCount = traveler._count?.journals || 0;
      const matchScore = state.aiMatchScores[traveler.id] || 85;

      card.innerHTML = `
        <div class="traveler-card-media">
          ${avatarHTML}
        </div>
        <div class="traveler-card-body">
          <div class="traveler-card-topline">
            <div class="traveler-card-title-group">
              <div class="traveler-card-eyebrow">
                <span class="ai-match-badge">${matchScore}% Match</span>
                <span class="traveler-rank-badge">Rank #${escapeHtml(traveler.id)}</span>
              </div>
              <h3>${escapeHtml(traveler.name)}</h3>
              <span class="traveler-role">${escapeHtml(traveler.role)}</span>
            </div>
          </div>
          
          <div class="traveler-meta-info">
            <div class="meta-item">Speaks <strong>${escapeHtml((traveler.preferredLanguage || "en").toUpperCase())}</strong></div>
            <div class="meta-item">Joined ${new Date(traveler.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short' })}</div>
          </div>
          
          <div class="traveler-card-stat-row">
            <div class="stat-item"><span class="stat-val">${storiesCount}</span> Stories</div>
            <div class="stat-item"><span class="stat-val">${tripsCount}</span> Trips</div>
            <div class="stat-item"><span class="stat-val">${journalsCount}</span> Journals</div>
          </div>
          
          <div class="traveler-card-footer">
            <div class="traveler-card-price">Public profile and shared activity</div>
            <button class="btn-view-profile" data-user-id="${traveler.id}">View Profile</button>
          </div>
        </div>
      `;

      // Click handler for opening profile
      const viewProfileBtn = card.querySelector(".btn-view-profile");
      if (viewProfileBtn) {
        viewProfileBtn.addEventListener("click", () => {
          showUserProfile(traveler.id);
        });
      }

      travelersGrid.appendChild(card);
    });
  }

  // Load and display full user profile modal
  async function showUserProfile(userId) {
    if (!profileModal) return;
    
    // Reset modal content and show loading indicator
    if (modalHeaderContent) {
      modalHeaderContent.innerHTML = `
        <div class="modal-avatar-fallback">⏳</div>
        <div class="modal-profile-info">
          <h2>Loading...</h2>
          <p>Fetching traveler details</p>
        </div>
      `;
    }
    if (profileStoriesGrid) profileStoriesGrid.innerHTML = "";
    if (statStoriesVal) statStoriesVal.textContent = "-";
    if (statTripsVal) statTripsVal.textContent = "-";
    if (statJournalsVal) statJournalsVal.textContent = "-";

    profileModal.removeAttribute("hidden");

    try {
      const userDetails = await CommunityAPI.getUserProfile(userId);
      state.selectedTraveler = userDetails;

      // Render profile header details
      const avatarHTML = userDetails.profileImage
        ? `<img class="modal-avatar" src="${escapeHtml(userDetails.profileImage)}" alt="${escapeHtml(userDetails.name)}" />`
        : `<div class="modal-avatar-fallback">${escapeHtml(getInitials(userDetails.name))}</div>`;

      if (modalHeaderContent) {
        modalHeaderContent.innerHTML = `
          ${avatarHTML}
          <div class="modal-profile-info">
            <h2>${escapeHtml(userDetails.name)}</h2>
            <span class="role-badge">${escapeHtml(userDetails.role)}</span>
            <p>🗣️ Preferred Language: <strong>${escapeHtml((userDetails.preferredLanguage || "en").toUpperCase())}</strong></p>
            <p>📅 Joined: ${new Date(userDetails.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
        `;
      }

      // Render stat metrics
      const stories = userDetails.travelerStories || [];
      if (statStoriesVal) statStoriesVal.textContent = stories.length;
      if (statTripsVal) statTripsVal.textContent = userDetails._count?.trips || 0;
      if (statJournalsVal) statJournalsVal.textContent = userDetails._count?.journals || 0;

      // Render stories grid
      if (profileStoriesGrid) {
        profileStoriesGrid.innerHTML = "";
        if (stories.length === 0) {
          profileStoriesGrid.innerHTML = `<div class="no-stories-msg">No shared traveler stories yet.</div>`;
        } else {
          stories.forEach(story => {
            const storyTile = document.createElement("div");
            storyTile.className = "story-card-mini";
            const thumbnail = story.thumbnailUrl || "image/city/petra-world-heritage-jordan_16x9.avif";
            
            storyTile.innerHTML = `
              <div class="story-card-mini-img-wrapper">
                <img src="${escapeHtml(thumbnail)}" alt="${escapeHtml(story.title)}" />
                <span class="story-card-mini-play-badge">▶</span>
              </div>
              <div class="story-card-mini-body">
                <h4>${escapeHtml(story.title)}</h4>
                <p>📍 ${escapeHtml(story.destination)}</p>
                <p class="story-views-lbl">👁️ ${story.viewsCount || 0} views</p>
              </div>
            `;

            storyTile.addEventListener("click", () => {
              playStoryVideo(story);
            });

            profileStoriesGrid.appendChild(storyTile);
          });
        }
      }
    } catch (err) {
      console.error("Failed to load user profile details:", err);
      if (modalHeaderContent) {
        modalHeaderContent.innerHTML = `
          <div class="modal-avatar-fallback">⚠️</div>
          <div class="modal-profile-info">
            <h2>Error Loading Profile</h2>
            <p>Could not retrieve traveler profile details.</p>
          </div>
        `;
      }
    }
  }

  // Play video logic
  function playStoryVideo(story) {
    if (!videoModal || !videoWrapper) return;
    
    videoWrapper.innerHTML = "";
    
    if (!story.videoUrl) {
      if (typeof showToast === "function") {
        showToast("This story doesn't have a playable video.", "warning");
      } else {
        alert("This story doesn't have a playable video.");
      }
      return;
    }

    const videoElement = document.createElement("video");
    videoElement.src = story.videoUrl;
    videoElement.controls = true;
    videoElement.autoplay = true;
    videoElement.style.width = "100%";
    videoElement.style.height = "100%";
    
    videoWrapper.appendChild(videoElement);
    videoModal.removeAttribute("hidden");

    // Increment story view counter
    if (typeof TravelerStoriesAPI !== "undefined" && typeof TravelerStoriesAPI.incrementView === "function") {
      TravelerStoriesAPI.incrementView(story.id).catch(err => {
        console.error("Failed to increment story view count:", err);
      });
    }
  }

  // Helper to escape HTML safely
  function escapeHtml(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  // Modal close handlers
  if (closeProfileBtn) {
    closeProfileBtn.addEventListener("click", () => {
      if (profileModal) profileModal.setAttribute("hidden", "true");
    });
  }

  if (profileModal) {
    profileModal.addEventListener("click", (e) => {
      if (e.target === profileModal) {
        profileModal.setAttribute("hidden", "true");
      }
    });
  }

  if (closeVideoBtn) {
    closeVideoBtn.addEventListener("click", () => {
      if (videoModal) videoModal.setAttribute("hidden", "true");
      if (videoWrapper) videoWrapper.innerHTML = "";
    });
  }

  if (videoModal) {
    videoModal.addEventListener("click", (e) => {
      if (e.target === videoModal) {
        videoModal.setAttribute("hidden", "true");
        if (videoWrapper) videoWrapper.innerHTML = "";
      }
    });
  }

  // Initial Load
  loadTravelers();
});
