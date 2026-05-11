import "dotenv/config";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import { PrismaClient } from "@prisma/client";
import axios from "axios";
import swaggerUi from "swagger-ui-express";
import { buildAuthHelpers } from "./common/auth/auth.js";
import { asyncHandler } from "./common/http/async-handler.js";
import {
  normalizeAttractionPayload,
  normalizeCategoryPayload,
  normalizeChatPayload,
  normalizeExpensePayload,
  normalizeHotelPayload,
  normalizeJournalPayload,
  normalizeRestaurantPayload,
  normalizeReviewPayload,
  normalizeTripPayload
} from "./common/utils/normalizers.js";
import { toDate, toLowerSafe, toNumber } from "./common/utils/parsers.js";
import { createAuthRouter } from "./modules/auth/auth.routes.js";
import { registerCatalogRoutes } from "./modules/catalog/catalog.routes.js";
import { registerCommunityRoutes } from "./modules/community/community.routes.js";
import { createHealthRouter } from "./modules/health/health.routes.js";
import { registerMetaRoutes } from "./modules/meta/meta.routes.js";
import { registerPlanningRoutes } from "./modules/planning/planning.routes.js";
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
const { requireAuth, makeJwtToken } = buildAuthHelpers({
  jwtSecret: JWT_SECRET,
  jwtExpiresIn: JWT_EXPIRES_IN,
  allowLegacyNumericToken: ALLOW_LEGACY_NUMERIC_TOKEN
});

function jsonObjectRequestBody(description) {
  return {
    required: true,
    content: {
      "application/json": {
        schema: {
          type: "object",
          additionalProperties: true,
          description
        }
      }
    }
  };
}

function authSecurity(required) {
  return required ? { security: [{ bearerAuth: [] }] } : {};
}

function crudPathDocs({ base, tag, authCreate = false, authUpdate = false, authDelete = false }) {
  return {
    [base]: {
      get: {
        tags: [tag],
        summary: `List ${tag.toLowerCase()}`,
        responses: {
          200: { description: "Success" }
        }
      },
      post: {
        tags: [tag],
        summary: `Create ${tag.slice(0, -1).toLowerCase()}`,
        ...authSecurity(authCreate),
        requestBody: jsonObjectRequestBody(`Create payload for ${tag.toLowerCase()}`),
        responses: {
          201: { description: "Created" },
          ...(authCreate ? { 401: { description: "Unauthorized" } } : {})
        }
      }
    },
    [`${base}/{id}`]: {
      get: {
        tags: [tag],
        summary: `Get ${tag.slice(0, -1).toLowerCase()} by id`,
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "integer" }
          }
        ],
        responses: {
          200: { description: "Success" },
          404: { description: "Not found" }
        }
      },
      put: {
        tags: [tag],
        summary: `Update ${tag.slice(0, -1).toLowerCase()} by id`,
        ...authSecurity(authUpdate),
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "integer" }
          }
        ],
        requestBody: jsonObjectRequestBody(`Update payload for ${tag.toLowerCase()}`),
        responses: {
          200: { description: "Updated" },
          404: { description: "Not found" },
          ...(authUpdate ? { 401: { description: "Unauthorized" } } : {})
        }
      },
      delete: {
        tags: [tag],
        summary: `Delete ${tag.slice(0, -1).toLowerCase()} by id`,
        ...authSecurity(authDelete),
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "integer" }
          }
        ],
        responses: {
          204: { description: "Deleted" },
          404: { description: "Not found" },
          ...(authDelete ? { 401: { description: "Unauthorized" } } : {})
        }
      }
    }
  };
}

const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "TravelMind Backend API",
    version: "1.0.0",
    description: "Swagger documentation for TravelMind backend routes."
  },
  servers: [
    {
      url: `http://localhost:${PORT}`,
      description: "Local development server"
    }
  ],
  tags: [
    { name: "Health" },
    { name: "Auth" },
    { name: "Attractions" },
    { name: "Hotels" },
    { name: "Restaurants" },
    { name: "Categories" },
    { name: "Trips" },
    { name: "Expenses" },
    { name: "Journals" },
    { name: "Reviews" },
    { name: "Chat" },
    { name: "Photos" }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT"
      }
    }
  },
  paths: {
    "/api/health": {
      get: {
        tags: ["Health"],
        summary: "Get API health status",
        responses: {
          200: {
            description: "API is healthy"
          }
        }
      }
    },
    "/api/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Register a new user",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "email", "passwordHash"],
                properties: {
                  name: { type: "string", example: "Jane Doe" },
                  email: { type: "string", format: "email", example: "jane@example.com" },
                  passwordHash: { type: "string", example: "my-password" },
                  preferredLanguage: { type: "string", example: "en" }
                }
              }
            }
          }
        },
        responses: {
          201: { description: "User created" },
          400: { description: "Invalid input" },
          409: { description: "Email already exists" }
        }
      }
    },
    "/api/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Login with email and password",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "passwordHash"],
                properties: {
                  email: { type: "string", format: "email", example: "jane@example.com" },
                  passwordHash: { type: "string", example: "my-password" }
                }
              }
            }
          }
        },
        responses: {
          200: { description: "Login successful" },
          400: { description: "Missing credentials" },
          401: { description: "Invalid email or password" }
        }
      }
    },
    ...crudPathDocs({ base: "/api/attractions", tag: "Attractions" }),
    ...crudPathDocs({ base: "/api/hotels", tag: "Hotels" }),
    ...crudPathDocs({ base: "/api/restaurants", tag: "Restaurants" }),
    ...crudPathDocs({ base: "/api/categories", tag: "Categories" }),
    ...crudPathDocs({
      base: "/api/trips",
      tag: "Trips",
      authCreate: true,
      authUpdate: true,
      authDelete: true
    }),
    ...crudPathDocs({
      base: "/api/expenses",
      tag: "Expenses",
      authCreate: true,
      authUpdate: true,
      authDelete: true
    }),
    ...crudPathDocs({
      base: "/api/journals",
      tag: "Journals",
      authCreate: true,
      authUpdate: true,
      authDelete: true
    }),
    "/api/photos": {
      get: {
        tags: ["Photos"],
        summary: "List photos by optional filters",
        parameters: [
          {
            name: "location",
            in: "query",
            required: false,
            schema: { type: "string" }
          },
          {
            name: "category",
            in: "query",
            required: false,
            schema: { type: "string" }
          },
          {
            name: "limit",
            in: "query",
            required: false,
            schema: { type: "integer", minimum: 1, maximum: 120 }
          }
        ],
        responses: {
          200: { description: "Success" }
        }
      }
    },
    "/api/attractions/city/{city}": {
      get: {
        tags: ["Attractions"],
        summary: "Get attractions by city",
        parameters: [
          {
            name: "city",
            in: "path",
            required: true,
            schema: { type: "string" }
          }
        ],
        responses: {
          200: { description: "Success" }
        }
      }
    },
    "/api/attractions/category/{categoryId}": {
      get: {
        tags: ["Attractions"],
        summary: "Get attractions by category",
        parameters: [
          {
            name: "categoryId",
            in: "path",
            required: true,
            schema: { type: "integer" }
          }
        ],
        responses: {
          200: { description: "Success" }
        }
      }
    },
    "/api/attractions/import-overpass": {
      post: {
        tags: ["Attractions"],
        summary: "Import attractions from Overpass",
        requestBody: {
          required: false,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  limit: { type: "integer", example: 300 }
                }
              }
            }
          }
        },
        responses: {
          200: { description: "Import finished" }
        }
      }
    },
    "/api/attractions/update-images": {
      post: {
        tags: ["Attractions"],
        summary: "Update attraction images",
        requestBody: {
          required: false,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  batchSize: { type: "integer", example: 15 },
                  perRequestDelayMs: { type: "integer", example: 250 }
                }
              }
            }
          }
        },
        responses: {
          200: { description: "Update finished" }
        }
      }
    },
    "/api/hotels/city/{city}": {
      get: {
        tags: ["Hotels"],
        summary: "Get hotels by city",
        parameters: [
          {
            name: "city",
            in: "path",
            required: true,
            schema: { type: "string" }
          }
        ],
        responses: {
          200: { description: "Success" }
        }
      }
    },
    "/api/hotels/stars/{stars}": {
      get: {
        tags: ["Hotels"],
        summary: "Get hotels by stars",
        parameters: [
          {
            name: "stars",
            in: "path",
            required: true,
            schema: { type: "integer", minimum: 1, maximum: 5 }
          }
        ],
        responses: {
          200: { description: "Success" }
        }
      }
    },
    "/api/hotels/fetch-external": {
      post: {
        tags: ["Hotels"],
        summary: "Fetch hotels from external API and upsert",
        requestBody: {
          required: false,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  country: { type: "string", example: "Jordan" },
                  limit: { type: "integer", example: 10 }
                }
              }
            }
          }
        },
        responses: {
          200: { description: "Import finished" },
          400: { description: "Missing HOTELS_API_KEY" },
          502: { description: "External provider failed" }
        }
      }
    },
    "/api/restaurants/city/{city}": {
      get: {
        tags: ["Restaurants"],
        summary: "Get restaurants by city",
        parameters: [
          {
            name: "city",
            in: "path",
            required: true,
            schema: { type: "string" }
          }
        ],
        responses: {
          200: { description: "Success" }
        }
      }
    },
    "/api/restaurants/import-overpass": {
      post: {
        tags: ["Restaurants"],
        summary: "Import restaurants from Overpass",
        requestBody: {
          required: false,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  limit: { type: "integer", example: 300 },
                  batchSize: { type: "integer", example: 100 }
                }
              }
            }
          }
        },
        responses: {
          200: { description: "Import finished" }
        }
      }
    },
    "/api/restaurants/update-photos": {
      post: {
        tags: ["Restaurants"],
        summary: "Update restaurant photos",
        requestBody: {
          required: false,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  batchSize: { type: "integer", example: 10 },
                  perRequestDelayMs: { type: "integer", example: 500 }
                }
              }
            }
          }
        },
        responses: {
          200: { description: "Update finished" }
        }
      }
    },
    "/api/restaurants/cuisine/{cuisine}": {
      get: {
        tags: ["Restaurants"],
        summary: "Get restaurants by cuisine",
        parameters: [
          {
            name: "cuisine",
            in: "path",
            required: true,
            schema: { type: "string" }
          }
        ],
        responses: {
          200: { description: "Success" }
        }
      }
    },
    "/api/categories/type/{type}": {
      get: {
        tags: ["Categories"],
        summary: "Get categories by type",
        parameters: [
          {
            name: "type",
            in: "path",
            required: true,
            schema: { type: "string" }
          }
        ],
        responses: {
          200: { description: "Success" }
        }
      }
    },
    "/api/trips/user/{userId}": {
      get: {
        tags: ["Trips"],
        summary: "Get trips by user",
        ...authSecurity(true),
        parameters: [
          {
            name: "userId",
            in: "path",
            required: true,
            schema: { type: "integer" }
          }
        ],
        responses: {
          200: { description: "Success" },
          401: { description: "Unauthorized" }
        }
      }
    },
    "/api/expenses/user/{userId}": {
      get: {
        tags: ["Expenses"],
        summary: "Get expenses by user",
        ...authSecurity(true),
        parameters: [
          {
            name: "userId",
            in: "path",
            required: true,
            schema: { type: "integer" }
          }
        ],
        responses: {
          200: { description: "Success" },
          401: { description: "Unauthorized" }
        }
      }
    },
    "/api/expenses/trip/{tripId}": {
      get: {
        tags: ["Expenses"],
        summary: "Get expenses by trip",
        ...authSecurity(true),
        parameters: [
          {
            name: "tripId",
            in: "path",
            required: true,
            schema: { type: "integer" }
          }
        ],
        responses: {
          200: { description: "Success" },
          401: { description: "Unauthorized" }
        }
      }
    },
    "/api/journals/user/{userId}": {
      get: {
        tags: ["Journals"],
        summary: "Get journals by user",
        ...authSecurity(true),
        parameters: [
          {
            name: "userId",
            in: "path",
            required: true,
            schema: { type: "integer" }
          }
        ],
        responses: {
          200: { description: "Success" },
          401: { description: "Unauthorized" }
        }
      }
    },
    "/api/reviews/place/{type}/{id}": {
      get: {
        tags: ["Reviews"],
        summary: "Get reviews by place type and id",
        parameters: [
          {
            name: "type",
            in: "path",
            required: true,
            schema: { type: "string" }
          },
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "integer" }
          }
        ],
        responses: {
          200: { description: "Success" }
        }
      }
    },
    "/api/reviews/user/{userId}": {
      get: {
        tags: ["Reviews"],
        summary: "Get reviews by user",
        ...authSecurity(true),
        parameters: [
          {
            name: "userId",
            in: "path",
            required: true,
            schema: { type: "integer" }
          }
        ],
        responses: {
          200: { description: "Success" },
          401: { description: "Unauthorized" }
        }
      }
    },
    "/api/reviews": {
      post: {
        tags: ["Reviews"],
        summary: "Create review",
        ...authSecurity(true),
        requestBody: jsonObjectRequestBody("Review payload"),
        responses: {
          201: { description: "Created" },
          401: { description: "Unauthorized" }
        }
      }
    },
    "/api/reviews/{id}": {
      delete: {
        tags: ["Reviews"],
        summary: "Delete review",
        ...authSecurity(true),
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "integer" }
          }
        ],
        responses: {
          204: { description: "Deleted" },
          401: { description: "Unauthorized" },
          404: { description: "Not found" }
        }
      }
    },
    "/api/chat/user/{userId}": {
      get: {
        tags: ["Chat"],
        summary: "Get chat messages by user",
        ...authSecurity(true),
        parameters: [
          {
            name: "userId",
            in: "path",
            required: true,
            schema: { type: "integer" }
          }
        ],
        responses: {
          200: { description: "Success" },
          401: { description: "Unauthorized" }
        }
      },
      delete: {
        tags: ["Chat"],
        summary: "Delete all chat messages for user",
        ...authSecurity(true),
        parameters: [
          {
            name: "userId",
            in: "path",
            required: true,
            schema: { type: "integer" }
          }
        ],
        responses: {
          204: { description: "Deleted" },
          401: { description: "Unauthorized" }
        }
      }
    },
    "/api/chat": {
      post: {
        tags: ["Chat"],
        summary: "Create chat message",
        ...authSecurity(true),
        requestBody: jsonObjectRequestBody("Chat message payload"),
        responses: {
          201: { description: "Created" },
          401: { description: "Unauthorized" }
        }
      }
    }
  }
};

app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));
app.get("/api/openapi.json", (_req, res) => {
  res.json(openApiSpec);
});
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(openApiSpec));

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

app.use(createHealthRouter());
app.use(createAuthRouter({
  prisma,
  asyncHandler,
  toLowerSafe,
  toDate,
  makeJwtToken
}));

registerCatalogRoutes({
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
  HOTELS_API_KEY,
  HOTELS_API_URL,
  axios,
  extractHotelArray,
  mapExternalHotel
});

registerMetaRoutes({
  app,
  prisma,
  modelCrud,
  normalizeCategoryPayload,
  asyncHandler,
  toNumber
});

registerPlanningRoutes({
  app,
  prisma,
  modelCrud,
  normalizeTripPayload,
  normalizeExpensePayload,
  normalizeJournalPayload,
  requireAuth,
  asyncHandler,
  toNumber
});

registerCommunityRoutes({
  app,
  prisma,
  requireAuth,
  asyncHandler,
  toNumber,
  normalizeReviewPayload,
  normalizeChatPayload
});

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
