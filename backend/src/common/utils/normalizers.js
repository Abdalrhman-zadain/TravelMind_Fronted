import { toDate, toNumber } from "./parsers.js";

export function normalizeTripPayload(body) {
    const payload = { ...body };

    if (payload.userId !== undefined) payload.userId = toNumber(payload.userId, 0);
    if (payload.budget !== undefined) payload.budget = toNumber(payload.budget, 0);
    if (payload.startDate !== undefined) payload.startDate = toDate(payload.startDate);
    if (payload.endDate !== undefined) payload.endDate = toDate(payload.endDate);
    if (payload.createdAt !== undefined) payload.createdAt = toDate(payload.createdAt) || new Date();

    return payload;
}

export function normalizeExpensePayload(body) {
    const payload = { ...body };

    if (payload.userId !== undefined) payload.userId = toNumber(payload.userId, 0);
    if (payload.tripId !== undefined) payload.tripId = toNumber(payload.tripId, 0);
    if (payload.amount !== undefined) payload.amount = toNumber(payload.amount, 0);
    if (payload.date !== undefined) payload.date = toDate(payload.date);
    if (payload.createdAt !== undefined) payload.createdAt = toDate(payload.createdAt) || new Date();

    return payload;
}

export function normalizeJournalPayload(body) {
    const payload = { ...body };

    if (payload.userId !== undefined) payload.userId = toNumber(payload.userId, 0);
    if (payload.tripId !== undefined) payload.tripId = toNumber(payload.tripId, 0);
    if (payload.date !== undefined) payload.date = toDate(payload.date);
    if (payload.createdAt !== undefined) payload.createdAt = toDate(payload.createdAt) || new Date();

    return payload;
}

export function normalizeReviewPayload(body) {
    const payload = { ...body };

    if (payload.userId !== undefined) payload.userId = toNumber(payload.userId, 0);
    if (payload.placeId !== undefined) payload.placeId = toNumber(payload.placeId, 0);
    if (payload.rating !== undefined) payload.rating = toNumber(payload.rating, 0);
    if (payload.createdAt !== undefined) payload.createdAt = toDate(payload.createdAt) || new Date();

    return payload;
}

export function normalizeChatPayload(body) {
    const payload = { ...body };

    if (payload.userId !== undefined) payload.userId = toNumber(payload.userId, 0);
    if (payload.createdAt !== undefined) payload.createdAt = toDate(payload.createdAt) || new Date();

    return payload;
}

export function normalizeAttractionPayload(body) {
    const payload = { ...body };

    if (payload.entryFee !== undefined) payload.entryFee = toNumber(payload.entryFee, 0);
    if (payload.rating !== undefined) payload.rating = toNumber(payload.rating, 0);
    if (payload.latitude !== undefined) payload.latitude = toNumber(payload.latitude, null);
    if (payload.longitude !== undefined) payload.longitude = toNumber(payload.longitude, null);
    if (payload.categoryId !== undefined) payload.categoryId = toNumber(payload.categoryId, null);

    return payload;
}

export function normalizeHotelPayload(body) {
    const payload = { ...body };

    if (payload.stars !== undefined) payload.stars = toNumber(payload.stars, null);
    if (payload.pricePerNight !== undefined) payload.pricePerNight = toNumber(payload.pricePerNight, 0);
    if (payload.rating !== undefined) payload.rating = toNumber(payload.rating, 0);
    if (payload.latitude !== undefined) payload.latitude = toNumber(payload.latitude, null);
    if (payload.longitude !== undefined) payload.longitude = toNumber(payload.longitude, null);

    return payload;
}

export function normalizeRestaurantPayload(body) {
    const payload = { ...body };

    if (payload.rating !== undefined) payload.rating = toNumber(payload.rating, 0);

    return payload;
}

export function normalizeCategoryPayload(body) {
    return { ...body };
}
