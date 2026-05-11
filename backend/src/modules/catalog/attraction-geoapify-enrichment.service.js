function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeText(value) {
    return String(value || "")
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function tokenize(value) {
    const normalized = normalizeText(value);
    if (!normalized) return new Set();
    return new Set(normalized.split(" ").filter(Boolean));
}

function jaccardSimilarity(a, b) {
    const setA = tokenize(a);
    const setB = tokenize(b);
    if (!setA.size || !setB.size) return 0;

    let intersection = 0;
    for (const token of setA) {
        if (setB.has(token)) intersection += 1;
    }

    const union = new Set([...setA, ...setB]).size;
    return union ? intersection / union : 0;
}

function hasValue(value) {
    if (value === null || value === undefined) return false;
    if (typeof value === "string") return value.trim().length > 0;
    return true;
}

function shouldWrite(currentValue, nextValue, overwrite) {
    if (!hasValue(nextValue)) return false;
    if (overwrite) return true;
    return !hasValue(currentValue);
}

function toFinite(value, fallback = null) {
    const num = Number(value);
    return Number.isFinite(num) ? num : fallback;
}

function parseRetryAfterMs(headerValue) {
    if (!headerValue) return null;
    const asNumber = Number(headerValue);
    if (Number.isFinite(asNumber) && asNumber >= 0) return asNumber * 1000;

    const asDate = new Date(headerValue);
    if (!Number.isNaN(asDate.getTime())) {
        return Math.max(0, asDate.getTime() - Date.now());
    }

    return null;
}

function retryable(error) {
    const status = error?.response?.status;
    if (status === 429) return true;
    if (status >= 500) return true;
    if (error?.code === "ECONNABORTED") return true;
    return !status;
}

function haversineKm(lat1, lon1, lat2, lon2) {
    const rad = (deg) => (deg * Math.PI) / 180;
    const R = 6371;
    const dLat = rad(lat2 - lat1);
    const dLon = rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toBatches(items, batchSize) {
    const chunks = [];
    for (let i = 0; i < items.length; i += batchSize) {
        chunks.push(items.slice(i, i + batchSize));
    }
    return chunks;
}

function isUnknownPhotoUrlArgError(error) {
    const message = String(error?.message || "");
    return message.includes("Unknown argument `photoUrl`");
}

function extractFeatures(data) {
    if (Array.isArray(data?.features)) return data.features;
    if (Array.isArray(data)) return data;
    return [];
}

function extractDetailsFeature(data) {
    const features = extractFeatures(data);
    return features.find((feature) => feature?.properties?.feature_type === "details") || features[0] || null;
}

function extractCandidateName(feature) {
    return String(feature?.properties?.name || feature?.properties?.address_line1 || "").trim();
}

export function createAttractionEnrichmentService({
    prisma,
    axiosInstance,
    apiKey,
    logger = console,
    minDelayMs = 250,
    maxRetries = 3,
    searchRadiusMeters = 12000,
    matchNameThreshold = 0.42,
    matchDistanceKm = 6
}) {
    if (!prisma) throw new Error("prisma is required");
    if (!axiosInstance) throw new Error("axiosInstance is required");

    const resolvedApiKey = String(apiKey || process.env.GEOAPIFY_API_KEY || process.env.OPENTRIPMAP_API_KEY || "").trim();
    const geoapifyCategories = [
        "tourism.attraction",
        "tourism.sights",
        "heritage",
        "memorial",
        "entertainment.museum",
        "entertainment.aquarium",
        "entertainment.planetarium",
        "entertainment.theme_park",
        "entertainment.zoo",
        "leisure.park",
        "natural",
        "man_made",
        "religion.place_of_worship"
    ].join(",");

    let lastRequestAt = 0;

    async function waitRateLimit() {
        const elapsed = Date.now() - lastRequestAt;
        const waitMs = Math.max(0, minDelayMs - elapsed);
        if (waitMs > 0) await sleep(waitMs);
        lastRequestAt = Date.now();
    }

    async function requestWithRetry(config) {
        if (!resolvedApiKey) {
            throw new Error("GEOAPIFY_API_KEY is required");
        }

        let attempt = 0;
        while (true) {
            attempt += 1;
            try {
                await waitRateLimit();
                return await axiosInstance.request({ timeout: 15000, ...config });
            } catch (error) {
                if (!retryable(error) || attempt > maxRetries) throw error;

                const retryAfter = parseRetryAfterMs(error?.response?.headers?.["retry-after"]);
                const delayMs = retryAfter ?? 700 * Math.pow(2, attempt - 1);
                logger.warn(`[enrich] retry ${attempt}/${maxRetries} in ${delayMs}ms`, {
                    url: config?.url,
                    status: error?.response?.status || "network"
                });
                await sleep(delayMs);
            }
        }
    }

    async function searchCandidates(record) {
        const latitude = toFinite(record.latitude);
        const longitude = toFinite(record.longitude);
        const baseParams = {
            apiKey: resolvedApiKey,
            categories: geoapifyCategories,
            filter: `circle:${longitude},${latitude},${searchRadiusMeters}`,
            bias: `proximity:${longitude},${latitude}`,
            lang: "en",
            limit: 20
        };

        const namedResponse = await requestWithRetry({
            method: "GET",
            url: "https://api.geoapify.com/v2/places",
            params: { ...baseParams, name: record.nameEn }
        }).catch(() => null);

        const named = extractFeatures(namedResponse?.data);
        if (named.length) return named;

        const fallbackResponse = await requestWithRetry({
            method: "GET",
            url: "https://api.geoapify.com/v2/places",
            params: baseParams
        });

        return extractFeatures(fallbackResponse?.data);
    }

    function pickBestMatch(record, candidates) {
        const baseLat = toFinite(record.latitude);
        const baseLon = toFinite(record.longitude);
        if (!Number.isFinite(baseLat) || !Number.isFinite(baseLon)) return null;

        const scored = (candidates || [])
            .map((candidate) => {
                const placeId = String(candidate?.properties?.place_id || "").trim();
                const candidateName = extractCandidateName(candidate);
                if (!placeId || !candidateName) return null;

                const pointLat = toFinite(candidate?.geometry?.coordinates?.[1] ?? candidate?.properties?.lat);
                const pointLon = toFinite(candidate?.geometry?.coordinates?.[0] ?? candidate?.properties?.lon);
                const distanceKm = Number.isFinite(Number(candidate?.properties?.distance))
                    ? Number(candidate.properties.distance) / 1000
                    : (Number.isFinite(pointLat) && Number.isFinite(pointLon)
                        ? haversineKm(baseLat, baseLon, pointLat, pointLon)
                        : Number.POSITIVE_INFINITY);

                const nameScore = jaccardSimilarity(record.nameEn, candidateName);
                const distanceScore = Math.max(0, 1 - (distanceKm / matchDistanceKm));
                const finalScore = nameScore * 0.7 + distanceScore * 0.3;

                return {
                    placeId,
                    candidateName,
                    distanceKm,
                    nameScore,
                    finalScore
                };
            })
            .filter(Boolean)
            .sort((a, b) => b.finalScore - a.finalScore);

        if (!scored.length) return null;
        const best = scored[0];

        if (best.nameScore < matchNameThreshold || best.distanceKm > matchDistanceKm) {
            return null;
        }

        return best;
    }

    async function getDetails(placeId, latitude, longitude) {
        const response = await requestWithRetry({
            method: "GET",
            url: "https://api.geoapify.com/v2/place-details",
            params: placeId
                ? { apiKey: resolvedApiKey, id: placeId, lang: "en" }
                : { apiKey: resolvedApiKey, lat: latitude, lon: longitude, lang: "en" }
        });

        return extractDetailsFeature(response?.data);
    }

    function extractUpdatePayload(record, details, overwrite) {
        const updateData = {};
        const fieldsUpdated = [];
        const detailsProps = details?.properties || {};

        const descriptionEn = String(
            detailsProps.description ||
            detailsProps.formatted ||
            detailsProps.address_line1 ||
            detailsProps.address_line2 ||
            ""
        ).trim() || null;
        const openingHours = String(detailsProps.opening_hours || "").trim() || null;
        const imageUrl = String(detailsProps?.wiki_and_media?.image || "").trim() || null;
        const detailLat = toFinite(details?.geometry?.coordinates?.[1] ?? detailsProps.lat, null);
        const detailLon = toFinite(details?.geometry?.coordinates?.[0] ?? detailsProps.lon, null);

        if (shouldWrite(record.descriptionEn, descriptionEn, overwrite)) {
            updateData.descriptionEn = descriptionEn;
            fieldsUpdated.push("descriptionEn");
        }

        if (shouldWrite(record.openingHours, openingHours, overwrite)) {
            updateData.openingHours = openingHours;
            fieldsUpdated.push("openingHours");
        }

        const currentPhoto = record.photoUrl ?? record.photo_url ?? null;
        if (shouldWrite(currentPhoto, imageUrl, overwrite)) {
            updateData.photoUrl = imageUrl;
            fieldsUpdated.push("photoUrl");
            fieldsUpdated.push("photo_url");
        }

        if (Number.isFinite(detailLat) && shouldWrite(record.latitude, detailLat, overwrite)) {
            updateData.latitude = detailLat;
            fieldsUpdated.push("latitude");
        }

        if (Number.isFinite(detailLon) && shouldWrite(record.longitude, detailLon, overwrite)) {
            updateData.longitude = detailLon;
            fieldsUpdated.push("longitude");
        }

        return { updateData, fieldsUpdated: [...new Set(fieldsUpdated)] };
    }

    async function enrichSingleAttraction(record, overwrite = false) {
        if (!record || !record.id) {
            return { id: null, status: "failed", reason: "invalid_record", fieldsUpdated: [] };
        }

        if (!hasValue(record.nameEn) || !Number.isFinite(Number(record.latitude)) || !Number.isFinite(Number(record.longitude))) {
            logger.info(`[enrich] skip #${record.id}: missing name or coordinates`);
            return { id: record.id, status: "skipped", reason: "missing_name_or_coordinates", fieldsUpdated: [] };
        }

        try {
            const candidates = await searchCandidates(record);
            const match = pickBestMatch(record, candidates);

            if (!match) {
                logger.info(`[enrich] skip #${record.id}: no strong match`, { name: record.nameEn });
                return { id: record.id, status: "skipped", reason: "no_strong_match", fieldsUpdated: [] };
            }

            const details = await getDetails(match.placeId, record.latitude, record.longitude);
            const { updateData, fieldsUpdated } = extractUpdatePayload(record, details, overwrite);

            if (!fieldsUpdated.length) {
                logger.info(`[enrich] matched #${record.id}, no missing fields to fill`, {
                    placeId: match.placeId,
                    candidateName: match.candidateName
                });
                return {
                    id: record.id,
                    status: "matched_no_changes",
                    placeId: match.placeId,
                    fieldsUpdated: []
                };
            }

            try {
                await prisma.attraction.update({
                    where: { id: record.id },
                    data: updateData
                });
            } catch (error) {
                if (!isUnknownPhotoUrlArgError(error) || !Object.prototype.hasOwnProperty.call(updateData, "photoUrl")) {
                    throw error;
                }

                const fallbackData = { ...updateData };
                fallbackData.photo_url = fallbackData.photoUrl;
                delete fallbackData.photoUrl;

                await prisma.attraction.update({
                    where: { id: record.id },
                    data: fallbackData
                });
            }

            logger.info(`[enrich] updated #${record.id}`, {
                placeId: match.placeId,
                candidateName: match.candidateName,
                fieldsUpdated
            });

            return {
                id: record.id,
                status: "updated",
                placeId: match.placeId,
                fieldsUpdated
            };
        } catch (error) {
            logger.error(`[enrich] failed #${record.id}`, {
                message: error?.message,
                status: error?.response?.status || null
            });
            return {
                id: record.id,
                status: "failed",
                reason: error?.message || "unknown_error",
                fieldsUpdated: []
            };
        }
    }

    async function enrichExistingAttractions({ overwrite = false, onlyMissing = true, batchSize = 20, limit = null } = {}) {
        const safeWhere = onlyMissing
            ? {
                OR: [
                    { descriptionEn: null },
                    { descriptionAr: null },
                    { openingHours: null },
                    { rating: null },
                    { entryFee: null }
                ]
            }
            : undefined;

        let records = await prisma.attraction.findMany({
            where: safeWhere,
            orderBy: { id: "asc" }
        });

        if (onlyMissing) {
            records = records.filter((record) => {
                const photoValue = record.photoUrl ?? record.photo_url ?? null;
                return !hasValue(record.descriptionEn) ||
                    !hasValue(record.descriptionAr) ||
                    !hasValue(record.openingHours) ||
                    !hasValue(photoValue) ||
                    !hasValue(record.rating) ||
                    !hasValue(record.entryFee);
            });
        }

        if (Number.isFinite(Number(limit)) && Number(limit) > 0) {
            records = records.slice(0, Number(limit));
        }

        const summary = {
            totalCandidates: records.length,
            updated: 0,
            matchedNoChanges: 0,
            skipped: 0,
            failed: 0,
            results: []
        };

        const chunks = toBatches(records, Math.max(1, Number(batchSize) || 20));
        for (const chunk of chunks) {
            for (const record of chunk) {
                const result = await enrichSingleAttraction(record, overwrite);
                summary.results.push(result);

                if (result.status === "updated") summary.updated += 1;
                else if (result.status === "matched_no_changes") summary.matchedNoChanges += 1;
                else if (result.status === "failed") summary.failed += 1;
                else summary.skipped += 1;
            }
        }

        logger.info("[enrich] done", {
            totalCandidates: summary.totalCandidates,
            updated: summary.updated,
            matchedNoChanges: summary.matchedNoChanges,
            skipped: summary.skipped,
            failed: summary.failed
        });

        return summary;
    }

    return {
        enrichSingleAttraction,
        enrichExistingAttractions
    };
}
