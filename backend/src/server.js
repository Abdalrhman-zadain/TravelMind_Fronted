import "dotenv/config";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import { PrismaClient } from "@prisma/client";
import axios from "axios";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { importAttractions } from "../scripts/importAttractionsOverpass.js";
import { importRestaurants } from "../scripts/importRestaurantsOverpass.js";
import { updateAttractionImages } from "../scripts/updateAttractionImages.js";
import { updateRestaurantPhotos } from "../scripts/updateRestaurantPhotos.js";

const prisma = new PrismaClient();
const app = express();
const PORT = Number(process.env.PORT || 3000);
const JWT_SECRET = String(process.env.JWT_SECRET || "change-me-in-production");
const JWT_EXPIRES_IN = String(process.env.JWT_EXPIRES_IN || "7d");
const ALLOW_LEGACY_NUMERIC_TOKEN = String(process.env.ALLOW_LEGACY_NUMERIC_TOKEN || "true") === "true";
const HOTELS_API_URL = "https://api.hotels-api.com/v1/hotels/search";
const HOTELS_API_KEY = String(process.env.HOTELS_API_KEY || "").trim();

app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));

function asyncHandler(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}

function toLowerSafe(value) {
  return String(value || "").trim().toLowerCase();
}

function toNumber(value, fallback = null) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function toDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function parseAuthUserId(req) {
  const auth = req.headers.authorization || "";
  if (!auth.startsWith("Bearer ")) return null;
  const token = auth.slice("Bearer ".length).trim();

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const fromSub = Number(payload?.sub);
    if (Number.isInteger(fromSub) && fromSub > 0) return fromSub;
    const fromUserId = Number(payload?.userId);
    if (Number.isInteger(fromUserId) && fromUserId > 0) return fromUserId;
  } catch (_) {
    if (ALLOW_LEGACY_NUMERIC_TOKEN) {
      const asInt = Number(token);
      if (Number.isInteger(asInt) && asInt > 0) return asInt;
    }
  }

  return null;
}

function requireAuth(req, res, next) {
  const userId = parseAuthUserId(req);
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  req.authUserId = userId;
  next();
}

function makeJwtToken(user) {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email
    },
    JWT_SECRET,
    {
      subject: String(user.id),
      expiresIn: JWT_EXPIRES_IN
    }
  );
}

function normalizeTripPayload(body) {
  const payload = { ...body };

  if (payload.userId !== undefined) payload.userId = toNumber(payload.userId, 0);
  if (payload.budget !== undefined) payload.budget = toNumber(payload.budget, 0);
  if (payload.startDate !== undefined) payload.startDate = toDate(payload.startDate);
  if (payload.endDate !== undefined) payload.endDate = toDate(payload.endDate);
  if (payload.createdAt !== undefined) payload.createdAt = toDate(payload.createdAt) || new Date();

  return payload;
}

function normalizeExpensePayload(body) {
  const payload = { ...body };

  if (payload.userId !== undefined) payload.userId = toNumber(payload.userId, 0);
  if (payload.tripId !== undefined) payload.tripId = toNumber(payload.tripId, 0);
  if (payload.amount !== undefined) payload.amount = toNumber(payload.amount, 0);
  if (payload.date !== undefined) payload.date = toDate(payload.date);
  if (payload.createdAt !== undefined) payload.createdAt = toDate(payload.createdAt) || new Date();

  return payload;
}

function normalizeJournalPayload(body) {
  const payload = { ...body };

  if (payload.userId !== undefined) payload.userId = toNumber(payload.userId, 0);
  if (payload.tripId !== undefined) payload.tripId = toNumber(payload.tripId, 0);
  if (payload.date !== undefined) payload.date = toDate(payload.date);
  if (payload.createdAt !== undefined) payload.createdAt = toDate(payload.createdAt) || new Date();

  return payload;
}

function normalizeReviewPayload(body) {
  const payload = { ...body };

  if (payload.userId !== undefined) payload.userId = toNumber(payload.userId, 0);
  if (payload.placeId !== undefined) payload.placeId = toNumber(payload.placeId, 0);
  if (payload.rating !== undefined) payload.rating = toNumber(payload.rating, 0);
  if (payload.createdAt !== undefined) payload.createdAt = toDate(payload.createdAt) || new Date();

  return payload;
}

function normalizeChatPayload(body) {
  const payload = { ...body };

  if (payload.userId !== undefined) payload.userId = toNumber(payload.userId, 0);
  if (payload.createdAt !== undefined) payload.createdAt = toDate(payload.createdAt) || new Date();

  return payload;
}

function normalizeAttractionPayload(body) {
  const payload = { ...body };

  if (payload.entryFee !== undefined) payload.entryFee = toNumber(payload.entryFee, 0);
  if (payload.rating !== undefined) payload.rating = toNumber(payload.rating, 0);
  if (payload.latitude !== undefined) payload.latitude = toNumber(payload.latitude, null);
  if (payload.longitude !== undefined) payload.longitude = toNumber(payload.longitude, null);
  if (payload.categoryId !== undefined) payload.categoryId = toNumber(payload.categoryId, null);

  return payload;
}

function normalizeHotelPayload(body) {
  const payload = { ...body };

  if (payload.stars !== undefined) payload.stars = toNumber(payload.stars, null);
  if (payload.pricePerNight !== undefined) payload.pricePerNight = toNumber(payload.pricePerNight, 0);
  if (payload.rating !== undefined) payload.rating = toNumber(payload.rating, 0);
  if (payload.latitude !== undefined) payload.latitude = toNumber(payload.latitude, null);
  if (payload.longitude !== undefined) payload.longitude = toNumber(payload.longitude, null);

  return payload;
}

function normalizeRestaurantPayload(body) {
  const payload = { ...body };

  if (payload.rating !== undefined) payload.rating = toNumber(payload.rating, 0);

  return payload;
}

function normalizeCategoryPayload(body) {
  return { ...body };
}

function clampStars(value) {
  const stars = Math.round(toNumber(value, 0));
  if (stars < 1) return null;
  if (stars > 5) return 5;
  return stars;
}

function normalizeAmenities(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === "string" && value.trim()) {
    return value.split(",").map((x) => x.trim()).filter(Boolean);
  }
  return [];
}

function extractHotelArray(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.hotels)) return payload.hotels;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.results)) return payload.results;
  if (Array.isArray(payload?.items)) return payload.items;
  if (payload && typeof payload === "object") {
    const firstArray = Object.values(payload).find(Array.isArray);
    if (Array.isArray(firstArray)) return firstArray;
  }
  return [];
}

function fallbackImageByCity(city) {
  const normalized = String(city || "").toLowerCase();
  if (normalized.includes("amman")) {
    return "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80";
  }
  if (normalized.includes("petra")) {
    return "https://images.unsplash.com/photo-1445019980597-93fa8acb246c?auto=format&fit=crop&w=1200&q=80";
  }
  if (normalized.includes("wadi")) {
    return "https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&w=1200&q=80";
  }
  return "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1200&q=80";
}

function mapExternalHotel(raw) {
  const externalId = String(raw?.id || raw?.hotel_id || raw?.uuid || "").trim();
  if (!externalId) return null;

  const city = String(raw?.city || raw?.location?.city || "Unknown").trim();
  const country = String(raw?.country || raw?.location?.country || "Jordan").trim();
  const rating = toNumber(raw?.rating, null);
  const stars = clampStars(raw?.stars ?? rating);
  const pricePerNight =
    toNumber(raw?.pricePerNight, null) ??
    toNumber(raw?.price, null) ??
    toNumber(raw?.min_price, null);

  return {
    externalId,
    nameEn: String(raw?.name || raw?.hotel_name || `Hotel ${externalId}`).trim(),
    city,
    country: country || null,
    descriptionEn: String(raw?.description || "").trim() || null,
    imageUrl:
      String(
        raw?.image ||
          raw?.image_url ||
          raw?.photo ||
          raw?.thumbnail ||
          raw?.photos?.[0]?.url ||
          ""
      ).trim() || fallbackImageByCity(city),
    amenities: normalizeAmenities(raw?.amenities),
    stars,
    rating,
    latitude: toNumber(raw?.lat ?? raw?.latitude, null),
    longitude: toNumber(raw?.lng ?? raw?.longitude, null),
    pricePerNight
  };
}

function modelCrud({
  base,
  delegate,
  idField = "id",
  normalize = (x) => x,
  authCreate = false,
  authUpdate = false,
  authDelete = false,
  notFoundMessage = "Item not found."
}) {
  app.get(base, asyncHandler(async (_req, res) => {
    let list = await prisma[delegate].findMany({ orderBy: { [idField]: "asc" } });

    // Compatibility bridge: allow frontend to read *_photo_url fields
    // even when Prisma client hasn't been regenerated yet.
    if (Array.isArray(list) && list.length > 0 && (delegate === "attraction" || delegate === "restaurant")) {
      const tableName = delegate === "attraction" ? "attractions" : "restaurants";
      const columnsResult = await prisma.$queryRawUnsafe(
        `SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='${tableName}'`
      );
      const has = new Set((columnsResult || []).map((c) => String(c.column_name)));

      const wanted = ["photo_url"];
      if (delegate === "restaurant") {
        wanted.push("latitude", "longitude", "category");
      }
      const selected = ["id", ...wanted.filter((c) => has.has(c))];
      const extraRows = await prisma.$queryRawUnsafe(
        `SELECT ${selected.map((c) => `"${c}"`).join(", ")} FROM ${tableName}`
      );
      const extraById = new Map((extraRows || []).map((row) => [Number(row.id), row]));
      list = list.map((item) => {
        const extra = extraById.get(Number(item.id)) || {};
        const photoUrl = extra.photo_url || null;
        return {
          ...item,
          photoUrl,
          photo_url: photoUrl,
          latitude: extra.latitude ?? item.latitude ?? null,
          longitude: extra.longitude ?? item.longitude ?? null,
          category: extra.category ?? item.category ?? null
        };
      });
    }

    res.json(list);
  }));

  app.get(`${base}/:id`, asyncHandler(async (req, res) => {
    const id = toNumber(req.params.id, 0);
    let item = await prisma[delegate].findUnique({ where: { [idField]: id } });

    if (!item) {
      return res.status(404).json({ message: notFoundMessage });
    }

    if (delegate === "attraction" || delegate === "restaurant") {
      const tableName = delegate === "attraction" ? "attractions" : "restaurants";
      const columnsResult = await prisma.$queryRawUnsafe(
        `SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='${tableName}'`
      );
      const has = new Set((columnsResult || []).map((c) => String(c.column_name)));
      const wanted = ["photo_url"];
      if (delegate === "restaurant") {
        wanted.push("latitude", "longitude", "category");
      }
      const selected = wanted.filter((c) => has.has(c));
      if (selected.length > 0) {
        const extraRows = await prisma.$queryRawUnsafe(
          `SELECT ${selected.map((c) => `"${c}"`).join(", ")} FROM ${tableName} WHERE id = $1 LIMIT 1`,
          id
        );
        const extra = extraRows?.[0] || {};
        const photoUrl = extra.photo_url || null;
        item = {
          ...item,
          photoUrl,
          photo_url: photoUrl,
          latitude: extra.latitude ?? item.latitude ?? null,
          longitude: extra.longitude ?? item.longitude ?? null,
          category: extra.category ?? item.category ?? null
        };
      }
    }

    res.json(item);
  }));

  app.post(
    base,
    ...(authCreate ? [requireAuth] : []),
    asyncHandler(async (req, res) => {
      const { id: _ignored, ...body } = req.body || {};
      const created = await prisma[delegate].create({ data: normalize(body) });
      res.status(201).json(created);
    })
  );

  app.put(
    `${base}/:id`,
    ...(authUpdate ? [requireAuth] : []),
    asyncHandler(async (req, res) => {
      const id = toNumber(req.params.id, 0);
      const exists = await prisma[delegate].findUnique({ where: { [idField]: id } });

      if (!exists) {
        return res.status(404).json({ message: notFoundMessage });
      }

      const { id: _ignored, ...body } = req.body || {};
      const updated = await prisma[delegate].update({
        where: { [idField]: id },
        data: normalize(body)
      });

      res.json(updated);
    })
  );

  app.delete(
    `${base}/:id`,
    ...(authDelete ? [requireAuth] : []),
    asyncHandler(async (req, res) => {
      const id = toNumber(req.params.id, 0);
      const exists = await prisma[delegate].findUnique({ where: { [idField]: id } });

      if (!exists) {
        return res.status(404).json({ message: notFoundMessage });
      }

      await prisma[delegate].delete({ where: { [idField]: id } });
      res.status(204).send();
    })
  );
}

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "travelmind-node-api", database: "postgresql" });
});

app.post("/api/auth/register", asyncHandler(async (req, res) => {
  const body = req.body || {};

  const name = String(body.name || "").trim();
  const email = toLowerSafe(body.email);
  const passwordHash = String(body.passwordHash || "").trim();
  const preferredLanguage = String(body.preferredLanguage || "en").trim() || "en";

  if (!name || !email || !passwordHash) {
    return res.status(400).json({ message: "Name, email and password are required." });
  }

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) {
    return res.status(409).json({ message: "Email already exists." });
  }

  const hashedPassword = await bcrypt.hash(passwordHash, 10);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash: hashedPassword,
      preferredLanguage,
      profileImage: String(body.profileImage || ""),
      createdAt: toDate(body.createdAt) || new Date()
    }
  });

  const token = makeJwtToken(user);

  res.status(201).json({
    userId: user.id,
    name: user.name,
    email: user.email,
    language: user.preferredLanguage,
    token
  });
}));

app.post("/api/auth/login", asyncHandler(async (req, res) => {
  const body = req.body || {};

  const email = toLowerSafe(body.email);
  const passwordHash = String(body.passwordHash || "").trim();

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    return res.status(401).json({ message: "Invalid email or password." });
  }

  let valid = false;
  const stored = String(user.passwordHash || "");
  if (stored.startsWith("$2a$") || stored.startsWith("$2b$") || stored.startsWith("$2y$")) {
    valid = await bcrypt.compare(passwordHash, stored);
  } else {
    valid = stored === passwordHash;
    if (valid) {
      const upgraded = await bcrypt.hash(passwordHash, 10);
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: upgraded }
      });
    }
  }

  if (!valid) {
    return res.status(401).json({ message: "Invalid email or password." });
  }

  const token = makeJwtToken(user);

  res.json({
    userId: user.id,
    name: user.name,
    email: user.email,
    language: user.preferredLanguage,
    token
  });
}));

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

modelCrud({
  base: "/api/categories",
  delegate: "category",
  normalize: normalizeCategoryPayload,
  notFoundMessage: "categories item not found."
});

app.get("/api/photos", asyncHandler(async (req, res) => {
  const location = String(req.query.location || "").trim();
  const category = String(req.query.category || "").trim();
  const limit = Math.max(1, Math.min(120, toNumber(req.query.limit, 30) || 30));

  const values = [];
  const where = [];

  if (location) {
    values.push(location);
    where.push(`location ILIKE $${values.length}`);
  }

  if (category) {
    values.push(category);
    where.push(`category ILIKE $${values.length}`);
  }

  values.push(limit);

  const sql = `
    SELECT id, url, location, category, source
    FROM photos
    ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
    ORDER BY id DESC
    LIMIT $${values.length}
  `;

  const rows = await prisma.$queryRawUnsafe(sql, ...values);
  const serializedRows = Array.isArray(rows)
    ? rows.map((row) => ({
        ...row,
        id: typeof row?.id === "bigint" ? Number(row.id) : row?.id
      }))
    : [];

  res.json(serializedRows);
}));

modelCrud({
  base: "/api/trips",
  delegate: "trip",
  normalize: normalizeTripPayload,
  authCreate: true,
  authUpdate: true,
  authDelete: true,
  notFoundMessage: "trips item not found."
});

modelCrud({
  base: "/api/expenses",
  delegate: "expense",
  normalize: normalizeExpensePayload,
  authCreate: true,
  authUpdate: true,
  authDelete: true,
  notFoundMessage: "expenses item not found."
});

modelCrud({
  base: "/api/journals",
  delegate: "journal",
  normalize: normalizeJournalPayload,
  authCreate: true,
  authUpdate: true,
  authDelete: true,
  notFoundMessage: "journals item not found."
});

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

app.get("/api/categories/type/:type", asyncHandler(async (req, res) => {
  const type = String(req.params.type || "").trim();
  const list = await prisma.category.findMany({
    where: { type: { equals: type, mode: "insensitive" } },
    orderBy: { id: "asc" }
  });

  res.json(list);
}));

app.get("/api/trips/user/:userId", requireAuth, asyncHandler(async (req, res) => {
  const userId = toNumber(req.params.userId, 0);
  const list = await prisma.trip.findMany({
    where: { userId },
    orderBy: { id: "asc" }
  });

  res.json(list);
}));

app.get("/api/expenses/user/:userId", requireAuth, asyncHandler(async (req, res) => {
  const userId = toNumber(req.params.userId, 0);
  const list = await prisma.expense.findMany({
    where: { userId },
    orderBy: { id: "asc" }
  });

  res.json(list);
}));

app.get("/api/expenses/trip/:tripId", requireAuth, asyncHandler(async (req, res) => {
  const tripId = toNumber(req.params.tripId, 0);
  const list = await prisma.expense.findMany({
    where: { tripId },
    orderBy: { id: "asc" }
  });

  res.json(list);
}));

app.get("/api/journals/user/:userId", requireAuth, asyncHandler(async (req, res) => {
  const userId = toNumber(req.params.userId, 0);
  const list = await prisma.journal.findMany({
    where: { userId },
    orderBy: { id: "asc" }
  });

  res.json(list);
}));

app.get("/api/reviews/place/:type/:id", asyncHandler(async (req, res) => {
  const placeType = String(req.params.type || "").trim();
  const placeId = toNumber(req.params.id, 0);

  const list = await prisma.review.findMany({
    where: {
      placeType: { equals: placeType, mode: "insensitive" },
      placeId
    },
    orderBy: { createdAt: "desc" }
  });

  res.json(list);
}));

app.get("/api/reviews/user/:userId", requireAuth, asyncHandler(async (req, res) => {
  const userId = toNumber(req.params.userId, 0);
  const list = await prisma.review.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" }
  });

  res.json(list);
}));

app.post("/api/reviews", requireAuth, asyncHandler(async (req, res) => {
  const { id: _ignored, ...body } = req.body || {};
  const created = await prisma.review.create({ data: normalizeReviewPayload(body) });
  res.status(201).json(created);
}));

app.delete("/api/reviews/:id", requireAuth, asyncHandler(async (req, res) => {
  const id = toNumber(req.params.id, 0);
  const exists = await prisma.review.findUnique({ where: { id } });

  if (!exists) {
    return res.status(404).json({ message: "Review not found." });
  }

  await prisma.review.delete({ where: { id } });
  res.status(204).send();
}));

app.get("/api/chat/user/:userId", requireAuth, asyncHandler(async (req, res) => {
  const userId = toNumber(req.params.userId, 0);
  const list = await prisma.chatMessage.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" }
  });

  res.json(list);
}));

app.post("/api/chat", requireAuth, asyncHandler(async (req, res) => {
  const { id: _ignored, ...body } = req.body || {};
  const created = await prisma.chatMessage.create({ data: normalizeChatPayload(body) });
  res.status(201).json(created);
}));

app.delete("/api/chat/user/:userId", requireAuth, asyncHandler(async (req, res) => {
  const userId = toNumber(req.params.userId, 0);
  await prisma.chatMessage.deleteMany({ where: { userId } });
  res.status(204).send();
}));

app.use((req, res) => {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.path}` });
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: "Internal server error." });
});

app.listen(PORT, () => {
  console.log(`TravelMind Node API running at http://localhost:${PORT}/api`);
});
