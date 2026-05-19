import { createAttractionEnrichmentService } from "./attraction-geoapify-enrichment.service.js";
import fs from 'fs';
import path from 'path';
function readLocalDb() {
    const p1 = path.resolve(process.cwd(), 'backend', 'data', 'db.json');
    const p2 = path.resolve(process.cwd(), 'data', 'db.json');
    let file = null;
    if (fs.existsSync(p1)) file = p1;
    else if (fs.existsSync(p2)) file = p2;
    if (!file) throw new Error('local db.json not found');
    return JSON.parse(fs.readFileSync(file, 'utf8'));
}

export function registerCatalogRoutes({
    app,
    prisma,
    modelCrud,
    normalizeAttractionPayload,
    normalizeHotelPayload,
    normalizeRestaurantPayload,
    asyncHandler,
    toNumber,
    importAttractions,
    updateAttractionImages,
    importRestaurants,
    updateRestaurantPhotos,
    requireAuth,
    HOTELS_API_KEY,
    HOTELS_API_URL,
    axios,
    extractHotelArray,
    mapExternalHotel
}) {
    const attractionEnricher = createAttractionEnrichmentService({
        prisma,
        axiosInstance: axios,
        apiKey: process.env.GEOAPIFY_API_KEY || process.env.OPENTRIPMAP_API_KEY,
        logger: console
    });

    modelCrud({
        base: "/api/attractions",
        delegate: "attraction",
        normalize: normalizeAttractionPayload,
        notFoundMessage: "attractions item not found."
    });

    modelCrud({
        base: "/api/hotels",
        delegate: "hotel",
        normalize: normalizeHotelPayload,
        notFoundMessage: "hotels item not found."
    });

    modelCrud({
        base: "/api/restaurants",
        delegate: "restaurant",
        normalize: normalizeRestaurantPayload,
        notFoundMessage: "restaurants item not found."
    });

    // Tours, Packages, Transport simple CRUD
    modelCrud({ base: "/api/tours", delegate: "tour", normalize: (x) => x, notFoundMessage: "tour not found." });
    modelCrud({ base: "/api/packages", delegate: "package", normalize: (x) => x, notFoundMessage: "package not found." });
    modelCrud({ base: "/api/transport", delegate: "transport", normalize: (x) => x, notFoundMessage: "transport not found." });

    app.get("/api/attractions/city/:city", asyncHandler(async (req, res) => {
        const city = String(req.params.city || "").trim();
        const list = await prisma.attraction.findMany({
            where: { city: { equals: city, mode: "insensitive" } },
            orderBy: { id: "asc" }
        });

        res.json(list);
    }));

    app.get("/api/attractions/category/:categoryId", asyncHandler(async (req, res) => {
        const categoryId = toNumber(req.params.categoryId, 0);
        const list = await prisma.attraction.findMany({
            where: { categoryId },
            orderBy: { id: "asc" }
        });

        res.json(list);
    }));

    app.post("/api/attractions/import-overpass", asyncHandler(async (req, res) => {
        const limit = toNumber(req.body?.limit, 300);
        const result = await importAttractions({ limit });
        res.status(200).json({
            message: "Overpass attractions import completed.",
            ...result
        });
    }));

    app.post("/api/attractions/update-images", asyncHandler(async (req, res) => {
        const batchSize = toNumber(req.body?.batchSize, 15);
        const perRequestDelayMs = toNumber(req.body?.perRequestDelayMs, 250);

        const result = await updateAttractionImages({
            batchSize: Math.max(1, Math.min(50, batchSize || 15)),
            perRequestDelayMs: Math.max(50, Math.min(5000, perRequestDelayMs || 250))
        });

        res.status(200).json({
            message: "Attraction image update completed.",
            ...result
        });
    }));

    function hasGeoapifyKey() {
        return String(process.env.GEOAPIFY_API_KEY || process.env.OPENTRIPMAP_API_KEY || "").trim().length > 0;
    }

    async function runGeoapifyEnrichment(req, res, singleId = null) {
        if (!hasGeoapifyKey()) {
            return res.status(400).json({ message: "GEOAPIFY_API_KEY is missing in backend/.env" });
        }

        const overwrite = Boolean(req.body?.overwrite);

        if (singleId !== null) {
            const record = await prisma.attraction.findUnique({ where: { id: singleId } });
            if (!record) {
                return res.status(404).json({ message: "Attraction not found." });
            }

            const result = await attractionEnricher.enrichSingleAttraction(record, overwrite);
            return res.status(200).json(result);
        }

        const onlyMissing = req.body?.onlyMissing !== false;
        const batchSize = Math.max(1, Math.min(100, toNumber(req.body?.batchSize, 20) || 20));
        const limit = req.body?.limit === undefined ? null : toNumber(req.body?.limit, null);

        const result = await attractionEnricher.enrichExistingAttractions({
            overwrite,
            onlyMissing,
            batchSize,
            limit
        });

        return res.status(200).json({
            message: "Geoapify enrichment completed.",
            ...result
        });
    }

    // Enrich existing attraction rows from Geoapify without creating new rows.
    app.post("/api/attractions/enrich-existing-geoapify", asyncHandler((req, res) => runGeoapifyEnrichment(req, res)));
    app.post("/api/attractions/enrich-existing-opentripmap", asyncHandler((req, res) => runGeoapifyEnrichment(req, res)));

    app.post("/api/attractions/:id/enrich-geoapify", asyncHandler((req, res) => {
        const id = toNumber(req.params.id, 0);
        if (!id) {
            return res.status(400).json({ message: "Invalid attraction id." });
        }

        return runGeoapifyEnrichment(req, res, id);
    }));

    app.post("/api/attractions/:id/enrich-opentripmap", asyncHandler((req, res) => {
        const id = toNumber(req.params.id, 0);
        if (!id) {
            return res.status(400).json({ message: "Invalid attraction id." });
        }

        return runGeoapifyEnrichment(req, res, id);
    }));

    app.get("/api/hotels/city/:city", asyncHandler(async (req, res) => {
        const city = String(req.params.city || "").trim();
        const list = await prisma.hotel.findMany({
            where: { city: { equals: city, mode: "insensitive" } },
            orderBy: { id: "asc" }
        });

        res.json(list);
    }));

    app.get("/api/hotels/stars/:stars", asyncHandler(async (req, res) => {
        const stars = toNumber(req.params.stars, 0);
        const list = await prisma.hotel.findMany({
            where: { stars },
            orderBy: { id: "asc" }
        });

        res.json(list);
    }));

    app.post("/api/hotels/fetch-external", asyncHandler(async (req, res) => {
        if (!HOTELS_API_KEY) {
            return res.status(400).json({
                message: "HOTELS_API_KEY is missing in backend/.env"
            });
        }

        const country = String(req.body?.country || "Jordan").trim() || "Jordan";
        const limit = Math.max(1, Math.min(50, toNumber(req.body?.limit, 10) || 10));

        let response;
        try {
            response = await axios.get(HOTELS_API_URL, {
                params: { country, limit },
                headers: { "X-API-KEY": HOTELS_API_KEY },
                timeout: 15000
            });
        } catch (error) {
            const status = error?.response?.status || 502;
            const details = error?.response?.data || error?.message || "Unknown error";
            return res.status(status).json({
                message: "Failed to fetch hotels from external API.",
                details
            });
        }

        const rawHotels = extractHotelArray(response.data);
        const mappedHotels = rawHotels.map(mapExternalHotel).filter(Boolean);

        if (mappedHotels.length === 0) {
            return res.json({
                message: "External API returned no hotel records to import.",
                added: 0,
                updated: 0,
                total: 0
            });
        }

        let added = 0;
        let updated = 0;

        for (const hotel of mappedHotels) {
            const exists = await prisma.hotel.findUnique({
                where: { externalId: hotel.externalId },
                select: { id: true }
            });

            await prisma.hotel.upsert({
                where: { externalId: hotel.externalId },
                update: {
                    nameEn: hotel.nameEn,
                    city: hotel.city,
                    country: hotel.country,
                    descriptionEn: hotel.descriptionEn,
                    imageUrl: hotel.imageUrl,
                    amenities: hotel.amenities,
                    stars: hotel.stars,
                    rating: hotel.rating,
                    latitude: hotel.latitude,
                    longitude: hotel.longitude,
                    pricePerNight: hotel.pricePerNight,
                    updatedAt: new Date()
                },
                create: {
                    externalId: hotel.externalId,
                    nameEn: hotel.nameEn,
                    city: hotel.city,
                    country: hotel.country,
                    descriptionEn: hotel.descriptionEn,
                    imageUrl: hotel.imageUrl,
                    amenities: hotel.amenities,
                    stars: hotel.stars,
                    rating: hotel.rating,
                    latitude: hotel.latitude,
                    longitude: hotel.longitude,
                    pricePerNight: hotel.pricePerNight,
                    updatedAt: new Date()
                }
            });

            if (exists) updated += 1;
            else added += 1;
        }

        res.json({
            message: "Hotels imported successfully from external API.",
            country,
            requestedLimit: limit,
            received: rawHotels.length,
            imported: mappedHotels.length,
            added,
            updated
        });
    }));

    app.get("/api/restaurants/city/:city", asyncHandler(async (req, res) => {
        const city = String(req.params.city || "").trim();
        const list = await prisma.restaurant.findMany({
            where: { city: { equals: city, mode: "insensitive" } },
            orderBy: { id: "asc" }
        });

        res.json(list);
    }));

    app.post("/api/restaurants/import-overpass", asyncHandler(async (req, res) => {
        const limit = toNumber(req.body?.limit, 300);
        const batchSize = toNumber(req.body?.batchSize, 100);
        const result = await importRestaurants({ limit, batchSize });
        res.status(200).json({
            message: "Overpass restaurants import completed.",
            ...result
        });
    }));

    // fs and path are imported at module scope above

    app.get('/api/attractions/:id/tours', asyncHandler(async (req, res) => {
        const id = toNumber(req.params.id, 0);
        try {
            const list = await prisma.tour.findMany({ where: { attractionId: id }, orderBy: { id: 'asc' } });
            return res.json(list);
        } catch (e) {
            // fallback to local data file for demo
            try {
                const raw = readLocalDb();
                const tours = (raw.tours || []).filter(t => Number(t.attractionId) === Number(id));
                return res.json(tours);
            } catch (e2) {
                return res.json([]);
            }
        }
    }));

    app.get('/api/attractions/:id/packages', asyncHandler(async (req, res) => {
        const id = toNumber(req.params.id, 0);
        try {
            const list = await prisma.package.findMany({ where: { attractionId: id }, orderBy: { id: 'asc' } });
            return res.json(list);
        } catch (e) {
            try {
                const raw = readLocalDb();
                const list = (raw.packages || []).filter(p => Number(p.attractionId) === Number(id));
                return res.json(list);
            } catch (e2) {
                return res.json([]);
            }
        }
    }));

    app.get('/api/attractions/:id/transport', asyncHandler(async (req, res) => {
        const id = toNumber(req.params.id, 0);
        try {
            const list = await prisma.transport.findMany({ where: { attractionId: id }, orderBy: { id: 'asc' } });
            return res.json(list);
        } catch (e) {
            try {
                const raw = readLocalDb();
                const list = (raw.transport || []).filter(t => Number(t.attractionId) === Number(id));
                return res.json(list);
            } catch (e2) {
                return res.json([]);
            }
        }
    }));

    app.post("/api/restaurants/update-photos", asyncHandler(async (req, res) => {
        const batchSize = toNumber(req.body?.batchSize, 10);
        const perRequestDelayMs = toNumber(req.body?.perRequestDelayMs, 500);
        const result = await updateRestaurantPhotos({
            batchSize: Math.max(1, Math.min(50, batchSize || 10)),
            perRequestDelayMs: Math.max(0, Math.min(10000, perRequestDelayMs || 500))
        });
        res.status(200).json({
            message: "Restaurant photo update completed.",
            ...result
        });
    }));

    app.get("/api/restaurants/cuisine/:cuisine", asyncHandler(async (req, res) => {
        const cuisine = String(req.params.cuisine || "").trim();
        const list = await prisma.restaurant.findMany({
            where: { cuisine: { equals: cuisine, mode: "insensitive" } },
            orderBy: { id: "asc" }
        });

        res.json(list);
    }));

    // Detailed attraction endpoint (includes images, badges, placeholder related data and reviews)
    app.get("/api/attractions/:id/detail", asyncHandler(async (req, res) => {
        const id = toNumber(req.params.id, 0);
        const item = await prisma.attraction.findUnique({ where: { id } });
        if (!item) return res.status(404).json({ message: "attraction not found." });

        // Build a richer payload while we don't have normalized relations in the schema
        const images = [];
        if (item.photoUrl) images.push(item.photoUrl);
        // provide a couple of fallback images from the repo if available
        images.push('/image/city/petra-world-heritage-jordan_16x9.avif');

        // fetch reviews for this attraction
        const reviews = await prisma.review.findMany({ where: { placeType: 'attraction', placeId: id }, orderBy: { createdAt: 'desc' } });

        // attempt to enrich with local demo data if available
        let tours = [];
        let packages = [];
        let transport = [];
        try {
            const raw = readLocalDb();
            tours = (raw.tours || []).filter(t => Number(t.attractionId) === Number(id));
            packages = (raw.packages || []).filter(p => Number(p.attractionId) === Number(id));
            transport = (raw.transport || []).filter(t => Number(t.attractionId) === Number(id));
        } catch (e) {
            // ignore
        }

        const payload = {
            ...item,
            images,
            badges: [],
            tours,
            packages,
            transport,
            reviews
        };

        res.json(payload);
    }));

    app.get("/api/attractions/:id/reviews", asyncHandler(async (req, res) => {
        const id = toNumber(req.params.id, 0);
        const list = await prisma.review.findMany({ where: { placeType: 'attraction', placeId: id }, orderBy: { createdAt: 'desc' } });
        res.json(list);
    }));

    app.post("/api/attractions/:id/reviews", requireAuth, asyncHandler(async (req, res) => {
        const id = toNumber(req.params.id, 0);
        const rating = toNumber(req.body?.rating, 0);
        const text = String(req.body?.text || req.body?.comment || "").trim();
        const userId = toNumber(req.body?.userId, 0) || 1; // fallback to user 1 for demo purposes

        if (!id || !userId) return res.status(400).json({ message: 'Invalid request' });

        const created = await prisma.review.create({ data: { userId, placeType: 'attraction', placeId: id, rating, comment: text } });
        res.status(201).json(created);
    }));

    // Simple favorites endpoint (no persistence yet)
    app.post('/api/favorites', requireAuth, asyncHandler(async (req, res) => {
        const attractionId = toNumber(req.body?.attractionId, 0) || toNumber(req.body?.id, 0);
        const favorite = Boolean(req.body?.favorite);
        const userId = toNumber(req.body?.userId, 0) || (req.user && req.user.id) || 0;
        if (!attractionId || !userId) return res.status(400).json({ message: 'Invalid payload' });

        try {
            if (favorite) {
                const exists = await prisma.favorite.findFirst({ where: { userId, attractionId } });
                if (!exists) await prisma.favorite.create({ data: { userId, attractionId } });
                return res.json({ userId, attractionId, favorite: true });
            } else {
                await prisma.favorite.deleteMany({ where: { userId, attractionId } });
                return res.json({ userId, attractionId, favorite: false });
            }
        } catch (e) {
            // fallback to local file-based favorites (demo)
            try {
                const raw = readLocalDb();
                raw.favorites = raw.favorites || [];
                if (favorite) {
                    if (!raw.favorites.find(f => Number(f.userId) === Number(userId) && Number(f.attractionId) === Number(attractionId))) {
                        raw.favorites.push({ id: Date.now(), userId, attractionId });
                    }
                } else {
                    raw.favorites = (raw.favorites || []).filter(f => !(Number(f.userId) === Number(userId) && Number(f.attractionId) === Number(attractionId)));
                }
                fs.writeFileSync(path.resolve(process.cwd(), 'backend', 'data', 'db.json'), JSON.stringify(raw, null, 2), 'utf8');
                return res.json({ userId, attractionId, favorite });
            } catch (e2) {
                return res.status(500).json({ message: 'Failed to persist favorite' });
            }
        }
    }));

    app.get('/api/users/:id/favorites', asyncHandler(async (req, res) => {
        const userId = toNumber(req.params.id, 0);
        if (!userId) return res.status(400).json({ message: 'Invalid user id' });
        try {
            const rows = await prisma.favorite.findMany({ where: { userId }, orderBy: { id: 'desc' }, select: { attractionId: true } });
            const ids = (rows || []).map(r => r.attractionId).filter(Boolean);
            return res.json(ids);
        } catch (e) {
            try {
                const raw = readLocalDb();
                const favs = (raw.favorites || []).filter(f => Number(f.userId) === Number(userId)).map(f => f.attractionId);
                return res.json(favs);
            } catch (e2) {
                return res.json([]);
            }
        }
    }));
}
