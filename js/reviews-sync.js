const REVIEW_STORAGE_KEY = "tm_reviews_v1";

function readReviewJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (_error) {
    return fallback;
  }
}

function writeReviewJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function getStoredReviews() {
  return readReviewJson(REVIEW_STORAGE_KEY, []);
}

function saveStoredReviews(reviews) {
  writeReviewJson(REVIEW_STORAGE_KEY, reviews);
}

function normalizeReviewRecord(review, fallback = {}) {
  return {
    id: review.id || fallback.id || `review-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    placeType: review.placeType || fallback.placeType || "",
    placeId: String(review.placeId ?? fallback.placeId ?? ""),
    userId: String(review.userId ?? fallback.userId ?? ""),
    userName: review.userName || fallback.userName || "Traveler",
    rating: Number(review.rating || fallback.rating || 0),
    comment: review.comment || review.content || fallback.comment || "",
    createdAt: review.createdAt || fallback.createdAt || new Date().toISOString(),
  };
}

async function loadPlaceReviews(placeType, placeId) {
  if (window.ReviewsAPI?.getByPlace) {
    try {
      const data = await ReviewsAPI.getByPlace(placeType, placeId);
      if (Array.isArray(data)) {
        return data.map((review) => normalizeReviewRecord(review, { placeType, placeId }));
      }
    } catch (_error) {
      // Fall back to local storage when API is unavailable.
    }
  }

  return getStoredReviews()
    .filter((review) => review.placeType === placeType && String(review.placeId) === String(placeId))
    .map((review) => normalizeReviewRecord(review, { placeType, placeId }));
}

async function createPlaceReview(review) {
  const normalized = normalizeReviewRecord(review);

  if (window.ReviewsAPI?.create) {
    try {
      const data = await ReviewsAPI.create(normalized);
      return normalizeReviewRecord(data, normalized);
    } catch (_error) {
      // Fall back to local storage when API is unavailable.
    }
  }

  const reviews = getStoredReviews().filter((item) => item.id !== normalized.id);
  reviews.push(normalized);
  saveStoredReviews(reviews);
  return normalized;
}

async function deletePlaceReview(reviewId) {
  if (window.ReviewsAPI?.delete) {
    try {
      await ReviewsAPI.delete(reviewId);
      return;
    } catch (_error) {
      // Fall back to local storage when API is unavailable.
    }
  }

  const reviews = getStoredReviews().filter((item) => String(item.id) !== String(reviewId));
  saveStoredReviews(reviews);
}

function summarizeReviews(reviews, fallbackRating = 0, fallbackCount = 0) {
  if (!Array.isArray(reviews) || !reviews.length) {
    return {
      rating: Number(fallbackRating || 0),
      count: Number(fallbackCount || 0),
    };
  }

  const total = reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0);
  return {
    rating: total / reviews.length,
    count: reviews.length,
  };
}

function reviewStarsText(value) {
  const rating = Math.round(Number(value || 0));
  return "★".repeat(Math.max(0, rating)) + "☆".repeat(Math.max(0, 5 - rating));
}

function buildReviewSection(options) {
  const {
    placeType,
    placeId,
    reviews,
    summary,
    submitHandler,
    deleteHandler,
  } = options;
  const user = typeof getUser === "function" ? getUser() : null;
  const userId = user?.id != null ? String(user.id) : "";

  return `
    <section class="review-section">
      <div class="review-section-header">
        <div>
          <h4 class="section-subtitle">Reviews & Ratings</h4>
          <p class="review-section-copy">Community feedback for this ${placeType}.</p>
        </div>
        <div class="review-summary-card">
          <strong>${summary.rating ? summary.rating.toFixed(1) : "0.0"}</strong>
          <span>${summary.count} review${summary.count === 1 ? "" : "s"}</span>
        </div>
      </div>

      <div class="review-form-card">
        ${
          typeof isLoggedIn === "function" && isLoggedIn()
            ? `
              <div class="review-form-grid">
                <label class="review-field">
                  <span>Rating</span>
                  <select id="detail-review-rating">
                    <option value="5">5 - Excellent</option>
                    <option value="4">4 - Great</option>
                    <option value="3">3 - Good</option>
                    <option value="2">2 - Fair</option>
                    <option value="1">1 - Poor</option>
                  </select>
                </label>
                <label class="review-field">
                  <span>Your review</span>
                  <textarea id="detail-review-comment" rows="3" placeholder="Share what stood out, what to expect, or any tips for other travelers."></textarea>
                </label>
              </div>
              <div class="review-form-actions">
                <button class="btn btn-primary btn-sm" type="button" onclick="${submitHandler}(${placeId})">Submit Review</button>
              </div>
            `
            : `<p class="review-login-note">Login to leave a rating and written review.</p>`
        }
      </div>

      <div class="review-list">
        ${
          reviews.length
            ? reviews
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                .map(
                  (review) => `
                    <article class="review-item">
                      <div class="review-item-topline">
                        <div>
                          <div class="review-author">${escapeReviewHtml(review.userName || "Traveler")}</div>
                          <div class="review-meta">${reviewStarsText(review.rating)} • ${new Date(review.createdAt).toLocaleDateString()}</div>
                        </div>
                        ${
                          userId && String(review.userId) === userId
                            ? `<button class="review-delete-btn" type="button" onclick="${deleteHandler}('${escapeReviewHtml(review.id)}', ${placeId})">Delete</button>`
                            : ""
                        }
                      </div>
                      <p class="review-copy">${escapeReviewHtml(review.comment || "No written comment provided.")}</p>
                    </article>
                  `
                )
                .join("")
            : `<div class="planner-empty-inline"><div class="planner-empty-inline-icon">☆</div><div><h4>No reviews yet</h4><p>Be the first traveler to share feedback for this place.</p></div></div>`
        }
      </div>
    </section>
  `;
}

function escapeReviewHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

window.loadPlaceReviews = loadPlaceReviews;
window.createPlaceReview = createPlaceReview;
window.deletePlaceReview = deletePlaceReview;
window.summarizeReviews = summarizeReviews;
window.buildReviewSection = buildReviewSection;
window.reviewStarsText = reviewStarsText;
