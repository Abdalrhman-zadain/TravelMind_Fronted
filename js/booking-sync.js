const BOOKING_STORAGE_KEY = "tm_bookings_v1";
const BOOKING_PROFILE_KEY = "tm_booking_profile_v1";

function bookingReadJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (_error) {
    return fallback;
  }
}

function bookingWriteJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function getBookingProfile() {
  return bookingReadJson(BOOKING_PROFILE_KEY, {});
}

function saveBookingProfile(profile) {
  const current = getBookingProfile();
  bookingWriteJson(BOOKING_PROFILE_KEY, { ...current, ...profile, updatedAt: new Date().toISOString() });
}

function getBookings() {
  return bookingReadJson(BOOKING_STORAGE_KEY, []);
}

function getBookingsByUser(userId) {
  return getBookings().filter((booking) => String(booking.userId) === String(userId));
}

function saveBookingRecord(record) {
  const bookings = getBookings();
  const authorName = record.contactName || record.guestName || "Traveler";
  const saved = {
    id: record.id || `booking-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    status: record.status || "Confirmed",
    createdAt: record.createdAt || new Date().toISOString(),
    ...record,
  };
  bookings.unshift(saved);
  bookingWriteJson(BOOKING_STORAGE_KEY, bookings);
  if (saved.tripId && typeof window.recordTripActivity === "function") {
    window.recordTripActivity(saved.tripId, {
      type: "booking-added",
      authorId: saved.userId || null,
      authorName,
      text: `${authorName} confirmed ${saved.itemTitle || "a booking"} for this trip.`,
    });
  }
  window.dispatchEvent(new CustomEvent("bookings-updated", { detail: { bookingId: saved.id } }));
  return saved;
}

window.getBookingProfile = getBookingProfile;
window.saveBookingProfile = saveBookingProfile;
window.getBookings = getBookings;
window.getBookingsByUser = getBookingsByUser;
window.saveBookingRecord = saveBookingRecord;
