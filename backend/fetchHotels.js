import axios from "axios";
import dotenv from "dotenv";
import { Pool } from "pg";

dotenv.config();

const HOTELS_API_URL = "https://api.hotels-api.com/v1/hotels/search";

const HOTELS_API_KEY = process.env.HOTELS_API_KEY || "YOUR_HOTELS_API_KEY_HERE";
const DATABASE_URL = process.env.DATABASE_URL;
const DEFAULT_COUNTRY = process.env.HOTELS_COUNTRY || "Jordan";
const DEFAULT_LIMIT = Number(process.env.HOTELS_LIMIT || 10);

if (!DATABASE_URL) {
  throw new Error(
    "Missing DATABASE_URL in environment variables. Please set it in backend/.env."
  );
}

if (HOTELS_API_KEY === "YOUR_HOTELS_API_KEY_HERE") {
  console.warn(
    "HOTELS_API_KEY is using a placeholder value. Set HOTELS_API_KEY in backend/.env before running this script."
  );
}

const pool = new Pool({
  connectionString: DATABASE_URL
});

function parseArgValue(key) {
  const prefix = `--${key}=`;
  const arg = process.argv.find((item) => item.startsWith(prefix));
  return arg ? arg.slice(prefix.length) : null;
}

function getFetchOptions() {
  const countryFromArg = parseArgValue("country");
  const limitFromArg = parseArgValue("limit");
  const parsedLimit = Number(limitFromArg ?? DEFAULT_LIMIT);
  const safeLimit = Number.isFinite(parsedLimit)
    ? Math.max(1, Math.min(100, Math.floor(parsedLimit)))
    : 10;

  return {
    country: (countryFromArg || DEFAULT_COUNTRY || "Jordan").trim(),
    limit: safeLimit
  };
}

/**
 * Normalized hotel object shape:
 * {
 *   id, name, city, country, lat, lng, rating, amenities
 * }
 */
function mapHotel(rawHotel) {
  return {
    id: String(rawHotel.id),
    name: rawHotel.name ?? null,
    city: rawHotel.city ?? null,
    country: rawHotel.country ?? null,
    lat: rawHotel.lat != null ? Number(rawHotel.lat) : null,
    lng: rawHotel.lng != null ? Number(rawHotel.lng) : null,
    rating: rawHotel.rating != null ? Number(rawHotel.rating) : null,
    amenities: Array.isArray(rawHotel.amenities) ? rawHotel.amenities : []
  };
}

async function fetchHotelsFromApi(options) {
  const response = await axios.get(HOTELS_API_URL, {
    params: {
      country: options.country,
      limit: options.limit
    },
    headers: {
      "X-API-KEY": HOTELS_API_KEY
    },
    timeout: 15000
  });

  const payload = response.data;

  // Support common response shapes from hotel APIs.
  let rawHotels = [];
  if (Array.isArray(payload)) {
    rawHotels = payload;
  } else if (Array.isArray(payload?.hotels)) {
    rawHotels = payload.hotels;
  } else if (Array.isArray(payload?.data)) {
    rawHotels = payload.data;
  } else if (Array.isArray(payload?.results)) {
    rawHotels = payload.results;
  } else if (Array.isArray(payload?.items)) {
    rawHotels = payload.items;
  } else if (payload && typeof payload === "object") {
    // Last-resort fallback: pick first array found on root object.
    const firstArray = Object.values(payload).find(Array.isArray);
    if (firstArray) rawHotels = firstArray;
  }

  if (rawHotels.length === 0) {
    console.warn("API returned no hotels. Response preview:");
    console.warn(JSON.stringify(payload, null, 2).slice(0, 1200));
  }

  return rawHotels.map(mapHotel).filter((hotel) => hotel.id);
}

async function createHotelsTable() {
  const createTableSql = `
    CREATE TABLE IF NOT EXISTS hotels (
      id TEXT PRIMARY KEY,
      name TEXT,
      city TEXT,
      country TEXT,
      lat DOUBLE PRECISION,
      lng DOUBLE PRECISION,
      rating DOUBLE PRECISION,
      amenities JSONB NOT NULL DEFAULT '[]'::jsonb,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;

  await pool.query(createTableSql);
}

async function getHotelsTableColumns() {
  const result = await pool.query(
    `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'hotels';
    `
  );

  return new Set(result.rows.map((row) => row.column_name));
}

async function ensurePrismaHotelExtensions() {
  await pool.query(`
    ALTER TABLE hotels
    ADD COLUMN IF NOT EXISTS external_id TEXT,
    ADD COLUMN IF NOT EXISTS country TEXT,
    ADD COLUMN IF NOT EXISTS amenities JSONB NOT NULL DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
  `);

  await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS hotels_external_id_key
    ON hotels (external_id);
  `);
}

async function upsertHotels(hotels) {
  const columns = await getHotelsTableColumns();
  const isPrismaHotelTable = columns.has("nameEn");

  if (isPrismaHotelTable) {
    await ensurePrismaHotelExtensions();

    const prismaUpsertSql = `
      INSERT INTO hotels (
        external_id,
        "nameEn",
        city,
        country,
        "latitude",
        "longitude",
        rating,
        amenities,
        updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, NOW())
      ON CONFLICT (external_id)
      DO UPDATE SET
        "nameEn" = EXCLUDED."nameEn",
        city = EXCLUDED.city,
        country = EXCLUDED.country,
        "latitude" = EXCLUDED."latitude",
        "longitude" = EXCLUDED."longitude",
        rating = EXCLUDED.rating,
        amenities = EXCLUDED.amenities,
        updated_at = NOW();
    `;

    for (const hotel of hotels) {
      const values = [
        hotel.id,
        hotel.name ?? "Unknown Hotel",
        hotel.city ?? "Unknown",
        hotel.country,
        hotel.lat,
        hotel.lng,
        hotel.rating,
        JSON.stringify(hotel.amenities)
      ];

      await pool.query(prismaUpsertSql, values);
    }

    return;
  }

  const standardUpsertSql = `
    INSERT INTO hotels (id, name, city, country, lat, lng, rating, amenities, updated_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, NOW())
    ON CONFLICT (id)
    DO UPDATE SET
      name = EXCLUDED.name,
      city = EXCLUDED.city,
      country = EXCLUDED.country,
      lat = EXCLUDED.lat,
      lng = EXCLUDED.lng,
      rating = EXCLUDED.rating,
      amenities = EXCLUDED.amenities,
      updated_at = NOW();
  `;

  for (const hotel of hotels) {
    const values = [
      hotel.id,
      hotel.name,
      hotel.city,
      hotel.country,
      hotel.lat,
      hotel.lng,
      hotel.rating,
      JSON.stringify(hotel.amenities)
    ];

    await pool.query(standardUpsertSql, values);
  }
}

async function main() {
  try {
    const options = getFetchOptions();
    await createHotelsTable();
    const hotels = await fetchHotelsFromApi(options);

    if (hotels.length === 0) {
      console.log("No hotels were returned from the API.");
      return;
    }

    await upsertHotels(hotels);
    console.log(
      `Upserted ${hotels.length} hotels into PostgreSQL (country=${options.country}, limit=${options.limit}).`
    );
  } catch (error) {
    console.error("Failed to fetch or store hotels:", error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main();
