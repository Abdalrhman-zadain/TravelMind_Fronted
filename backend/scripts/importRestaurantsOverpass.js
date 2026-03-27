import "dotenv/config";
import axios from "axios";
import { Pool } from "pg";

const DEFAULT_OVERPASS_URL = "https://overpass-api.de/api/interpreter";
const FALLBACK_OVERPASS_URLS = [
  "https://overpass-api.de/api/interpreter",
  "https://lz4.overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter"
];

function buildPoolConfig() {
  const connectionString = String(process.env.DATABASE_URL || "").trim();
  if (connectionString) return { connectionString };

  return {
    host: String(process.env.DB_HOST || "localhost"),
    user: String(process.env.DB_USER || "postgres"),
    password: String(process.env.DB_PASSWORD ?? ""),
    database: String(process.env.DB_NAME || "travelmind"),
    port: Number(process.env.DB_PORT || 5432)
  };
}

function overpassQuery(limit = 300) {
  const safeLimit = Math.max(50, Math.min(1000, Number(limit) || 300));
  return `
[out:json];
area["ISO3166-1"="JO"][admin_level=2]->.searchArea;
(
  node["amenity"="restaurant"](area.searchArea);
  node["amenity"="fast_food"](area.searchArea);
  node["amenity"="cafe"](area.searchArea);
);
out body ${safeLimit};
  `.trim();
}

function isLikelyInJordan(lat, lng) {
  return lat >= 29 && lat <= 34.5 && lng >= 34 && lng <= 40.5;
}

function categoryFromAmenity(amenity) {
  switch (amenity) {
    case "restaurant":
      return "Restaurant";
    case "fast_food":
      return "Fast Food";
    case "cafe":
      return "Cafe";
    default:
      return "Restaurant";
  }
}

function normalizeRecord(node) {
  const tags = node?.tags || {};
  const nameEn = String(tags.name || "").trim();
  if (!nameEn) return null;

  const latitude = Number(node?.lat);
  const longitude = Number(node?.lon);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

  const amenity = String(tags.amenity || "").trim().toLowerCase();
  const category = categoryFromAmenity(amenity);

  return {
    nameEn,
    nameAr: tags["name:ar"] ? String(tags["name:ar"]).trim() : null,
    city: tags["addr:city"] ? String(tags["addr:city"]).trim() : "Jordan",
    descriptionEn: tags.cuisine ? String(tags.cuisine).trim() : null,
    descriptionAr: null,
    rating: null,
    latitude,
    longitude,
    category
  };
}

async function loadRestaurantColumns(pool) {
  const result = await pool.query(
    `
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'restaurants'
    `
  );
  return new Set(result.rows.map((r) => String(r.column_name)));
}

function pickInsertData(item, columns) {
  const data = {};

  if (columns.has("nameEn")) data.nameEn = item.nameEn;
  if (columns.has("nameAr")) data.nameAr = item.nameAr;
  if (columns.has("city")) data.city = item.city;
  if (columns.has("descriptionEn")) data.descriptionEn = item.descriptionEn;
  if (columns.has("descriptionAr")) data.descriptionAr = item.descriptionAr;
  if (columns.has("rating")) data.rating = item.rating;
  if (columns.has("latitude")) data.latitude = item.latitude;
  if (columns.has("longitude")) data.longitude = item.longitude;
  if (columns.has("category")) data.category = item.category;

  // Compatibility with your current Prisma model.
  if (columns.has("cuisine")) data.cuisine = item.descriptionEn || item.category;

  return data;
}

function buildInsertStatement(data) {
  const keys = Object.keys(data);
  const fields = keys.map((k) => `"${k}"`).join(", ");
  const params = keys.map((_, i) => `$${i + 1}`).join(", ");
  const values = keys.map((k) => data[k]);
  return {
    sql: `INSERT INTO restaurants (${fields}) VALUES (${params})`,
    values
  };
}

async function existsRestaurant(pool, item, columns) {
  if (columns.has("latitude") && columns.has("longitude")) {
    const result = await pool.query(
      `
      SELECT id
      FROM restaurants
      WHERE LOWER("nameEn") = LOWER($1)
        AND "latitude" = $2
        AND "longitude" = $3
      LIMIT 1
      `,
      [item.nameEn, item.latitude, item.longitude]
    );
    return result.rowCount > 0;
  }

  const result = await pool.query(
    `
    SELECT id
    FROM restaurants
    WHERE LOWER("nameEn") = LOWER($1)
    LIMIT 1
    `,
    [item.nameEn]
  );
  return result.rowCount > 0;
}

export async function importRestaurants({
  limit = 300,
  batchSize = 100,
  overpassUrl = DEFAULT_OVERPASS_URL
} = {}) {
  const safeLimit = Math.max(200, Math.min(500, Number(limit) || 300));
  const safeBatchSize = Math.max(10, Math.min(200, Number(batchSize) || 100));
  const pool = new Pool(buildPoolConfig());

  let inserted = 0;
  let skipped = 0;
  let processed = 0;

  try {
    let data;
    const overpassCandidates = [
      String(overpassUrl || "").trim(),
      ...FALLBACK_OVERPASS_URLS
    ].filter(Boolean);
    const tried = new Set();
    const uniqueCandidates = overpassCandidates.filter((url) => {
      if (tried.has(url)) return false;
      tried.add(url);
      return true;
    });

    let lastError = null;
    for (const candidate of uniqueCandidates) {
      for (let attempt = 1; attempt <= 3; attempt += 1) {
        try {
          const response = await axios.post(candidate, overpassQuery(safeLimit), {
            headers: { "Content-Type": "text/plain" },
            timeout: 90000
          });
          data = response.data;
          break;
        } catch (error) {
          lastError = error;
          const status = Number(error?.response?.status || 0);
          const retriable = [429, 500, 502, 503, 504].includes(status) || !status;
          if (!retriable || attempt === 3) break;
          const backoffMs = 1200 * attempt;
          await new Promise((resolve) => setTimeout(resolve, backoffMs));
        }
      }
      if (data) break;
    }

    if (!data) {
      const status = lastError?.response?.status;
      const msg = lastError?.message || "Unknown Overpass error";
      throw new Error(
        `Failed to fetch restaurants from Overpass. Last status: ${status || "n/a"}, error: ${msg}`
      );
    }

    const elements = Array.isArray(data?.elements) ? data.elements : [];
    const normalized = elements
      .map(normalizeRecord)
      .filter(Boolean)
      .filter((r) => isLikelyInJordan(r.latitude, r.longitude))
      .slice(0, safeLimit);

    processed = normalized.length;

    const columns = await loadRestaurantColumns(pool);
    const seen = new Set();

    for (let i = 0; i < normalized.length; i += safeBatchSize) {
      const batch = normalized.slice(i, i + safeBatchSize);
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        for (const item of batch) {
          const inRunKey = `${item.nameEn.toLowerCase()}|${item.latitude.toFixed(6)}|${item.longitude.toFixed(6)}`;
          if (seen.has(inRunKey)) {
            skipped += 1;
            continue;
          }
          seen.add(inRunKey);

          const exists = await existsRestaurant(client, item, columns);
          if (exists) {
            skipped += 1;
            continue;
          }

          const insertData = pickInsertData(item, columns);
          const keys = Object.keys(insertData);
          if (keys.length === 0) {
            skipped += 1;
            continue;
          }

          const { sql, values } = buildInsertStatement(insertData);
          await client.query(sql, values);
          inserted += 1;
        }
        await client.query("COMMIT");
      } catch (error) {
        await client.query("ROLLBACK");
        throw new Error(`Failed while inserting restaurants batch: ${error.message}`);
      } finally {
        client.release();
      }
    }

    return { processed, inserted, skipped };
  } finally {
    await pool.end();
  }
}
