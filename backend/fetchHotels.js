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
 *   id, name, city, country, lat, lng, rating, amenities, imageUrl
 * }
 */
function hashString(value) {
  const s = String(value || "");
  let h = 0;
  for (let i = 0; i < s.length; i += 1) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

function pickByKey(list, key) {
  if (!Array.isArray(list) || list.length === 0) return null;
  return list[hashString(key) % list.length];
}

function fallbackImageByCity(city, key) {
  const c = String(city || "").toLowerCase();

  const amman = [
    "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80"
  ];

  const petra = [
    "https://images.unsplash.com/photo-1445019980597-93fa8acb246c?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1578898886225-c7c894047899?auto=format&fit=crop&w=1200&q=80"
  ];

  const aqaba = [
    "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=1200&q=80"
  ];

  const wadi = [
    "https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1501117716987-c8e1ecb210f3?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80"
  ];

  const karak = [
    "https://images.unsplash.com/photo-1468824357306-a439d58ccb1c?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1200&q=80"
  ];

  const generic = [
    "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1444201983204-c43cbd584d93?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1455587734955-081b22074882?auto=format&fit=crop&w=1200&q=80"
  ];

  if (c.includes("amman")) return pickByKey(amman, key);
  if (c.includes("petra")) return pickByKey(petra, key);
  if (c.includes("aqaba")) return pickByKey(aqaba, key);
  if (c.includes("wadi")) return pickByKey(wadi, key);
  if (c.includes("karak")) return pickByKey(karak, key);
  return pickByKey(generic, key);
}

function pickImageUrl(rawHotel, city) {
  const direct =
    rawHotel.imageUrl ||
    rawHotel.image_url ||
    rawHotel.image ||
    rawHotel.photo ||
    rawHotel.thumbnail ||
    rawHotel?.photos?.[0]?.url;

  const value = String(direct || "").trim();
  const key = rawHotel.id || rawHotel.name || `${city}-hotel`;
  return value || fallbackImageByCity(city, key);
}

function mapHotel(rawHotel) {
  const city = rawHotel.city ?? null;
  return {
    id: String(rawHotel.id),
    name: rawHotel.name ?? null,
    city,
    country: rawHotel.country ?? null,
    lat: rawHotel.lat != null ? Number(rawHotel.lat) : null,
    lng: rawHotel.lng != null ? Number(rawHotel.lng) : null,
    rating: rawHotel.rating != null ? Number(rawHotel.rating) : null,
    amenities: Array.isArray(rawHotel.amenities) ? rawHotel.amenities : [],
    imageUrl: pickImageUrl(rawHotel, city)
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
      image_url TEXT,
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
    ADD COLUMN IF NOT EXISTS "imageUrl" TEXT,
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
        "imageUrl",
        "latitude",
        "longitude",
        rating,
        amenities,
        updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, NOW())
      ON CONFLICT (external_id)
      DO UPDATE SET
        "nameEn" = EXCLUDED."nameEn",
        city = EXCLUDED.city,
        country = EXCLUDED.country,
        "imageUrl" = EXCLUDED."imageUrl",
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
        hotel.imageUrl,
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
    INSERT INTO hotels (id, name, city, country, lat, lng, rating, image_url, amenities, updated_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, NOW())
    ON CONFLICT (id)
    DO UPDATE SET
      name = EXCLUDED.name,
      city = EXCLUDED.city,
      country = EXCLUDED.country,
      lat = EXCLUDED.lat,
      lng = EXCLUDED.lng,
      rating = EXCLUDED.rating,
      image_url = EXCLUDED.image_url,
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
      hotel.imageUrl,
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
