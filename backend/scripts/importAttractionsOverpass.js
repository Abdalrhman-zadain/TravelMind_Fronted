import "dotenv/config";
import axios from "axios";
import { Pool } from "pg";

const DEFAULT_OVERPASS_URL = "https://overpass-api.de/api/interpreter";

function buildPoolConfig() {
  const connectionString = String(process.env.DATABASE_URL || "").trim();
  if (connectionString) {
    return { connectionString };
  }

  return {
    host: String(process.env.DB_HOST || "localhost"),
    user: String(process.env.DB_USER || "postgres"),
    password: String(process.env.DB_PASSWORD ?? ""),
    database: String(process.env.DB_NAME || "travelmind"),
    port: Number(process.env.DB_PORT || 5432)
  };
}

function mapCategoryId(tourismType) {
  switch (tourismType) {
    case "attraction":
      return 1;
    case "museum":
      return 2;
    case "viewpoint":
      return 3;
    case "zoo":
      return 4;
    default:
      return null;
  }
}

function overpassQuery() {
  return `
[out:json];
area["ISO3166-1"="JO"][admin_level=2]->.searchArea;
(
  node["tourism"="attraction"](area.searchArea);
  node["tourism"="museum"](area.searchArea);
  node["tourism"="viewpoint"](area.searchArea);
  node["tourism"="zoo"](area.searchArea);
);
out body;
  `.trim();
}

function normalizeRecord(node) {
  const tags = node?.tags || {};
  const nameEn = String(tags.name || "").trim();
  if (!nameEn) return null;

  return {
    nameEn,
    nameAr: tags["name:ar"] || null,
    city: tags["addr:city"] || "Jordan",
    descriptionEn: tags.description || tags.wikidata || null,
    descriptionAr: null,
    entryFee: null,
    openingHours: tags.opening_hours || null,
    rating: null,
    latitude: Number(node.lat),
    longitude: Number(node.lon),
    categoryId: mapCategoryId(tags.tourism || "")
  };
}

function isLikelyInJordan(lat, lng) {
  // Safety filter for Jordan approximate bounds.
  return lat >= 29 && lat <= 34.5 && lng >= 34 && lng <= 40.5;
}

export async function importAttractions({
  limit = 300,
  overpassUrl = DEFAULT_OVERPASS_URL
} = {}) {
  const pool = new Pool(buildPoolConfig());
  const safeLimit = Math.max(100, Math.min(500, Number(limit) || 300));

  let inserted = 0;
  let skipped = 0;

  try {
    const { data } = await axios.post(overpassUrl, overpassQuery(), {
      headers: { "Content-Type": "text/plain" },
      timeout: 60000
    });

    const elements = Array.isArray(data?.elements) ? data.elements : [];
    const normalized = elements
      .map(normalizeRecord)
      .filter(Boolean)
      .slice(0, safeLimit);

    const seen = new Set();
    for (const item of normalized) {
      if (!Number.isFinite(item.latitude) || !Number.isFinite(item.longitude)) {
        skipped += 1;
        continue;
      }
      if (!isLikelyInJordan(item.latitude, item.longitude)) {
        skipped += 1;
        continue;
      }

      // In-run dedupe by lat/lng OR name.
      const runKey = `${item.latitude.toFixed(6)}|${item.longitude.toFixed(6)}|${item.nameEn.toLowerCase()}`;
      if (seen.has(runKey)) {
        skipped += 1;
        continue;
      }
      seen.add(runKey);

      // DB dedupe by (lat+lng) OR nameEn.
      const exists = await pool.query(
        `
        SELECT id
        FROM attractions
        WHERE ("latitude" = $1 AND "longitude" = $2)
           OR LOWER("nameEn") = LOWER($3)
        LIMIT 1
        `,
        [item.latitude, item.longitude, item.nameEn]
      );

      if (exists.rowCount > 0) {
        skipped += 1;
        continue;
      }

      await pool.query(
        `
        INSERT INTO attractions
        ("nameEn", "nameAr", city, "descriptionEn", "descriptionAr", "entryFee", "openingHours", rating, "latitude", "longitude", "categoryId")
        VALUES
        ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        `,
        [
          item.nameEn,
          item.nameAr,
          item.city,
          item.descriptionEn,
          item.descriptionAr,
          item.entryFee,
          item.openingHours,
          item.rating,
          item.latitude,
          item.longitude,
          item.categoryId
        ]
      );

      inserted += 1;
    }

    return {
      inserted,
      skipped,
      processed: normalized.length
    };
  } finally {
    await pool.end();
  }
}
